from __future__ import annotations

import os
import uuid
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pymupdf

from core.errors import InvalidJobRequest


ProgressEmitter = Callable[
    [int, str],
    None,
]


def _require_file_list(
    payload: dict[str, Any],
) -> list[Path]:
    value = payload.get(
        "inputFiles"
    )

    if not isinstance(
        value,
        list,
    ):
        raise InvalidJobRequest(
            "inputFiles harus berupa array."
        )

    if len(value) < 2:
        raise InvalidJobRequest(
            "Pilih minimal dua file PDF."
        )

    input_files: list[Path] = []

    for item in value:
        if (
            not isinstance(
                item,
                str,
            )
            or not item.strip()
        ):
            raise InvalidJobRequest(
                "Path file PDF tidak valid."
            )

        file_path = Path(
            item
        ).expanduser()

        if not file_path.exists():
            raise InvalidJobRequest(
                f"File tidak ditemukan: "
                f"{file_path}"
            )

        if not file_path.is_file():
            raise InvalidJobRequest(
                f"Path bukan file: "
                f"{file_path}"
            )

        if (
            file_path.suffix.lower()
            != ".pdf"
        ):
            raise InvalidJobRequest(
                f"File bukan PDF: "
                f"{file_path.name}"
            )

        input_files.append(
            file_path
        )

    return input_files


def _require_output_file(
    payload: dict[str, Any],
) -> Path:
    value = payload.get(
        "outputFile"
    )

    if (
        not isinstance(
            value,
            str,
        )
        or not value.strip()
    ):
        raise InvalidJobRequest(
            "Lokasi output belum dipilih."
        )

    output_file = Path(
        value
    ).expanduser()

    if (
        output_file.suffix.lower()
        != ".pdf"
    ):
        output_file = (
            output_file.with_suffix(
                ".pdf"
            )
        )

    return output_file


def _normalized_path(
    file_path: Path,
) -> str:
    return os.path.normcase(
        str(
            file_path.resolve()
        )
    )


def run_merge_pdf_job(
    payload: dict[str, Any],
    emit_progress: ProgressEmitter,
) -> dict[str, Any]:
    emit_progress(
        0,
        "Memvalidasi file PDF.",
    )

    input_files = (
        _require_file_list(
            payload
        )
    )

    output_file = (
        _require_output_file(
            payload
        )
    )

    normalized_output = (
        _normalized_path(
            output_file
        )
    )

    normalized_inputs = {
        _normalized_path(
            input_file
        )
        for input_file
        in input_files
    }

    if (
        normalized_output
        in normalized_inputs
    ):
        raise InvalidJobRequest(
            "File output tidak boleh "
            "sama dengan file input."
        )

    output_file.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_file = (
        output_file.with_name(
            (
                f".{output_file.stem}-"
                f"{uuid.uuid4().hex}"
                f".partial.pdf"
            )
        )
    )

    output_document = (
        pymupdf.open()
    )

    total_files = len(
        input_files
    )

    total_pages = 0

    try:
        for index, input_file in enumerate(
            input_files,
            start=1,
        ):
            progress_before = (
                5
                + round(
                    (
                        index - 1
                    )
                    / total_files
                    * 75
                )
            )

            emit_progress(
                progress_before,
                (
                    f"Membuka "
                    f"{input_file.name}."
                ),
            )

            with pymupdf.open(
                str(input_file)
            ) as source_document:
                if (
                    source_document
                    .needs_pass
                ):
                    raise InvalidJobRequest(
                        (
                            "PDF dilindungi "
                            "password: "
                            f"{input_file.name}"
                        )
                    )

                if (
                    not source_document
                    .is_pdf
                ):
                    raise InvalidJobRequest(
                        (
                            "Dokumen bukan "
                            "PDF valid: "
                            f"{input_file.name}"
                        )
                    )

                if (
                    source_document
                    .page_count
                    < 1
                ):
                    raise InvalidJobRequest(
                        (
                            "PDF tidak memiliki "
                            "halaman: "
                            f"{input_file.name}"
                        )
                    )

                output_document.insert_pdf(
                    source_document
                )

                total_pages += (
                    source_document
                    .page_count
                )

            progress_after = (
                5
                + round(
                    index
                    / total_files
                    * 75
                )
            )

            emit_progress(
                progress_after,
                (
                    f"{input_file.name} "
                    "berhasil ditambahkan."
                ),
            )

        emit_progress(
            85,
            "Mengoptimalkan dokumen hasil.",
        )

        if temporary_file.exists():
            temporary_file.unlink()

        output_document.save(
            str(temporary_file),
            garbage=4,
            deflate=True,
        )

        output_document.close()

        emit_progress(
            95,
            "Memindahkan file hasil.",
        )

        os.replace(
            temporary_file,
            output_file,
        )

        output_size = (
            output_file.stat().st_size
        )

        return {
            "outputFile":
                str(output_file),

            "outputFileName":
                output_file.name,

            "inputCount":
                total_files,

            "pageCount":
                total_pages,

            "sizeBytes":
                output_size,
        }

    except Exception:
        if not output_document.is_closed:
            output_document.close()

        if temporary_file.exists():
            temporary_file.unlink(
                missing_ok=True
            )

        raise

    finally:
        if not output_document.is_closed:
            output_document.close()