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


def _normalized_path(
    file_path: Path,
) -> str:
    return os.path.normcase(
        str(
            file_path.resolve()
        )
    )


def _require_source_file(
    payload: dict[str, Any],
) -> Path:
    value = payload.get(
        "sourceFile"
    )

    if (
        not isinstance(
            value,
            str,
        )
        or not value.strip()
    ):
        raise InvalidJobRequest(
            "File sumber belum dipilih."
        )

    source_file = Path(
        value
    ).expanduser()

    if not source_file.exists():
        raise InvalidJobRequest(
            "File sumber tidak ditemukan."
        )

    if not source_file.is_file():
        raise InvalidJobRequest(
            "Path sumber bukan file."
        )

    if (
        source_file.suffix.lower()
        != ".pdf"
    ):
        raise InvalidJobRequest(
            "File sumber bukan PDF."
        )

    return source_file


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
            "File output belum dipilih."
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


def _require_page_list(
    payload: dict[str, Any],
    page_count: int,
) -> list[dict[str, int]]:
    value = payload.get(
        "pages"
    )

    if not isinstance(
        value,
        list,
    ):
        raise InvalidJobRequest(
            "Daftar halaman tidak valid."
        )

    if len(value) < 1:
        raise InvalidJobRequest(
            "Dokumen hasil harus "
            "memiliki minimal satu halaman."
        )

    pages: list[
        dict[str, int]
    ] = []

    for index, item in enumerate(
        value,
        start=1,
    ):
        if not isinstance(
            item,
            dict,
        ):
            raise InvalidJobRequest(
                (
                    "Data halaman ke-"
                    f"{index} tidak valid."
                )
            )

        page_number = item.get(
            "pageNumber"
        )

        rotation = item.get(
            "rotation",
            0,
        )

        if (
            isinstance(
                page_number,
                bool,
            )
            or not isinstance(
                page_number,
                int,
            )
        ):
            raise InvalidJobRequest(
                (
                    "Nomor halaman ke-"
                    f"{index} tidak valid."
                )
            )

        if (
            page_number < 1
            or page_number >
            page_count
        ):
            raise InvalidJobRequest(
                (
                    "Halaman "
                    f"{page_number} "
                    "tidak tersedia."
                )
            )

        if (
            isinstance(
                rotation,
                bool,
            )
            or not isinstance(
                rotation,
                int,
            )
        ):
            raise InvalidJobRequest(
                (
                    "Rotasi halaman "
                    f"{page_number} "
                    "tidak valid."
                )
            )

        normalized_rotation = (
            rotation % 360
        )

        if (
            normalized_rotation
            not in {
                0,
                90,
                180,
                270,
            }
        ):
            raise InvalidJobRequest(
                (
                    "Rotasi halaman harus "
                    "0, 90, 180, atau 270."
                )
            )

        pages.append(
            {
                "pageNumber":
                    page_number,

                "rotation":
                    normalized_rotation,
            }
        )

    return pages


def run_organize_pdf_job(
    payload: dict[str, Any],
    emit_progress: ProgressEmitter,
) -> dict[str, Any]:
    emit_progress(
        0,
        "Memvalidasi dokumen.",
    )

    source_file = (
        _require_source_file(
            payload
        )
    )

    output_file = (
        _require_output_file(
            payload
        )
    )

    if (
        _normalized_path(
            source_file
        )
        ==
        _normalized_path(
            output_file
        )
    ):
        raise InvalidJobRequest(
            "File output tidak boleh "
            "menimpa file sumber."
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
                ".partial.pdf"
            )
        )
    )

    output_document = (
        pymupdf.open()
    )

    try:
        with pymupdf.open(
            str(source_file)
        ) as source_document:
            if (
                source_document
                .needs_pass
            ):
                raise InvalidJobRequest(
                    "PDF dilindungi password."
                )

            if (
                source_document
                .page_count < 1
            ):
                raise InvalidJobRequest(
                    "PDF tidak memiliki halaman."
                )

            pages = (
                _require_page_list(
                    payload,
                    source_document.page_count,
                )
            )

            total_pages = len(
                pages
            )

            for index, page_spec in enumerate(
                pages,
                start=1,
            ):
                source_page_index = (
                    page_spec[
                        "pageNumber"
                    ]
                    - 1
                )
                is_last_page = (
                    index ==
                    total_pages
                )

                output_document.insert_pdf(
                    source_document,

                    from_page=
                        source_page_index,

                    to_page=
                        source_page_index,

                    final=
                        1
                        if is_last_page
                        else 0,
                )

                inserted_page = (
                    output_document.load_page(
                        output_document.page_count
                        - 1
                    )
                )

                additional_rotation = (
                    page_spec[
                        "rotation"
                    ]
                )

                if (
                    additional_rotation
                    != 0
                ):
                    current_rotation = (
                        inserted_page.rotation
                    )

                    inserted_page.set_rotation(
                        (
                            current_rotation
                            +
                            additional_rotation
                        )
                        % 360
                    )

                progress = (
                    5
                    + round(
                        (
                            index /
                            total_pages
                        )
                        * 80
                    )
                )

                emit_progress(
                    progress,
                    (
                        "Memproses halaman "
                        f"{index} dari "
                        f"{total_pages}."
                    ),
                )

        emit_progress(
            90,
            "Menyimpan dokumen hasil.",
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
            97,
            "Memindahkan file hasil.",
        )

        os.replace(
            temporary_file,
            output_file,
        )

        return {
            "outputFile":
                str(output_file),

            "outputFileName":
                output_file.name,

            "pageCount":
                len(pages),

            "sizeBytes":
                output_file.stat().st_size,
        }

    except Exception:
        if (
            not output_document
            .is_closed
        ):
            output_document.close()

        if temporary_file.exists():
            temporary_file.unlink(
                missing_ok=True
            )

        raise

    finally:
        if (
            not output_document
            .is_closed
        ):
            output_document.close()
