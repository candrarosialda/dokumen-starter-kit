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

SUPPORTED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
}


def _normalized_path(
    file_path: Path,
) -> str:
    return os.path.normcase(
        str(file_path.resolve())
    )


def _require_existing_file(
    value: Any,
    label: str,
) -> Path:
    if (
        not isinstance(value, str)
        or not value.strip()
    ):
        raise InvalidJobRequest(
            f"{label} belum dipilih."
        )

    file_path = Path(
        value
    ).expanduser()

    if not file_path.exists():
        raise InvalidJobRequest(
            f"{label} tidak ditemukan: "
            f"{file_path}"
        )

    if not file_path.is_file():
        raise InvalidJobRequest(
            f"{label} bukan file."
        )

    return file_path


def _require_output_file(
    payload: dict[str, Any],
) -> Path:
    value = payload.get(
        "outputFile"
    )

    if (
        not isinstance(value, str)
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


def _require_dimension(
    value: Any,
    label: str,
) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(
            value,
            (int, float),
        )
    ):
        raise InvalidJobRequest(
            f"{label} tidak valid."
        )

    dimension = float(value)

    if (
        dimension < 50
        or dimension > 5000
    ):
        raise InvalidJobRequest(
            f"{label} berada di luar batas."
        )

    return dimension


def _require_rotation(
    value: Any,
) -> int:
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
    ):
        raise InvalidJobRequest(
            "Rotasi halaman tidak valid."
        )

    normalized_rotation = (
        value % 360
    )

    if normalized_rotation not in {
        0,
        90,
        180,
        270,
    }:
        raise InvalidJobRequest(
            "Rotasi harus 0, 90, "
            "180, atau 270 derajat."
        )

    return normalized_rotation


def _require_page_list(
    payload: dict[str, Any],
) -> list[dict[str, Any]]:
    value = payload.get(
        "pages"
    )

    if not isinstance(value, list):
        raise InvalidJobRequest(
            "Daftar halaman tidak valid."
        )

    if len(value) < 1:
        raise InvalidJobRequest(
            "Dokumen hasil harus mempunyai "
            "minimal satu halaman."
        )

    parsed_pages: list[
        dict[str, Any]
    ] = []

    for index, item in enumerate(
        value,
        start=1,
    ):
        if not isinstance(item, dict):
            raise InvalidJobRequest(
                f"Data halaman ke-{index} "
                "tidak valid."
            )

        kind = item.get(
            "kind"
        )

        rotation = _require_rotation(
            item.get(
                "rotation",
                0,
            )
        )

        if kind == "pdf":
            source_file = (
                _require_existing_file(
                    item.get(
                        "sourceFile"
                    ),
                    "PDF sumber",
                )
            )

            if (
                source_file.suffix.lower()
                != ".pdf"
            ):
                raise InvalidJobRequest(
                    f"{source_file.name} "
                    "bukan file PDF."
                )

            page_number = item.get(
                "pageNumber"
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
                or page_number < 1
            ):
                raise InvalidJobRequest(
                    f"Nomor halaman PDF "
                    f"ke-{index} tidak valid."
                )

            parsed_pages.append({
                "kind": "pdf",
                "sourceFile":
                    source_file,
                "pageNumber":
                    page_number,
                "rotation":
                    rotation,
            })

            continue

        if kind == "image":
            source_file = (
                _require_existing_file(
                    item.get(
                        "sourceFile"
                    ),
                    "Gambar sumber",
                )
            )

            if (
                source_file.suffix.lower()
                not in
                SUPPORTED_IMAGE_EXTENSIONS
            ):
                raise InvalidJobRequest(
                    f"Format gambar "
                    f"{source_file.name} "
                    "tidak didukung."
                )

            parsed_pages.append({
                "kind": "image",
                "sourceFile":
                    source_file,
                "width":
                    _require_dimension(
                        item.get(
                            "width"
                        ),
                        "Lebar halaman gambar",
                    ),
                "height":
                    _require_dimension(
                        item.get(
                            "height"
                        ),
                        "Tinggi halaman gambar",
                    ),
                "rotation":
                    rotation,
            })

            continue

        if kind == "blank":
            parsed_pages.append({
                "kind": "blank",
                "width":
                    _require_dimension(
                        item.get(
                            "width"
                        ),
                        "Lebar halaman kosong",
                    ),
                "height":
                    _require_dimension(
                        item.get(
                            "height"
                        ),
                        "Tinggi halaman kosong",
                    ),
                "rotation":
                    rotation,
            })

            continue

        raise InvalidJobRequest(
            f"Jenis halaman ke-{index} "
            "tidak didukung."
        )

    return parsed_pages


def run_organize_pdf_job(
    payload: dict[str, Any],
    emit_progress: ProgressEmitter,
) -> dict[str, Any]:
    emit_progress(
        0,
        "Memvalidasi daftar halaman.",
    )

    output_file = (
        _require_output_file(
            payload
        )
    )

    pages = (
        _require_page_list(
            payload
        )
    )

    source_paths = {
        _normalized_path(
            page["sourceFile"]
        )
        for page in pages
        if page["kind"]
        in {
            "pdf",
            "image",
        }
    }

    if (
        _normalized_path(
            output_file
        )
        in source_paths
    ):
        raise InvalidJobRequest(
            "File output tidak boleh "
            "menimpa salah satu file sumber."
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

    source_documents: dict[
        str,
        pymupdf.Document,
    ] = {}

    def get_source_document(
        source_file: Path,
    ) -> pymupdf.Document:
        cache_key = (
            _normalized_path(
                source_file
            )
        )

        cached_document = (
            source_documents.get(
                cache_key
            )
        )

        if cached_document is not None:
            return cached_document

        document = pymupdf.open(
            str(source_file)
        )

        if document.needs_pass:
            document.close()

            raise InvalidJobRequest(
                "PDF dilindungi password: "
                f"{source_file.name}"
            )

        source_documents[
            cache_key
        ] = document

        return document

    try:
        total_pages = len(
            pages
        )

        for index, page_spec in enumerate(
            pages,
            start=1,
        ):
            kind = page_spec[
                "kind"
            ]

            if kind == "pdf":
                source_document = (
                    get_source_document(
                        page_spec[
                            "sourceFile"
                        ]
                    )
                )

                source_page_index = (
                    page_spec[
                        "pageNumber"
                    ]
                    - 1
                )

                if (
                    source_page_index < 0
                    or source_page_index
                    >= source_document.page_count
                ):
                    raise InvalidJobRequest(
                        "Halaman "
                        f"{page_spec['pageNumber']} "
                        "tidak tersedia pada "
                        f"{page_spec['sourceFile'].name}."
                    )

                output_document.insert_pdf(
                    source_document,
                    from_page=
                        source_page_index,
                    to_page=
                        source_page_index,
                )

            elif kind == "blank":
                output_document.new_page(
                    width=
                        page_spec[
                            "width"
                        ],
                    height=
                        page_spec[
                            "height"
                        ],
                )

            elif kind == "image":
                inserted_page = (
                    output_document.new_page(
                        width=
                            page_spec[
                                "width"
                            ],
                        height=
                            page_spec[
                                "height"
                            ],
                    )
                )

                inserted_page.insert_image(
                    inserted_page.rect,
                    filename=str(
                        page_spec[
                            "sourceFile"
                        ]
                    ),
                    keep_proportion=True,
                )

            result_page = (
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

            if additional_rotation != 0:
                result_page.set_rotation(
                    (
                        result_page.rotation
                        + additional_rotation
                    )
                    % 360
                )

            progress = (
                5
                + round(
                    (
                        index
                        / total_pages
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
        if not output_document.is_closed:
            output_document.close()

        if temporary_file.exists():
            temporary_file.unlink()

        raise

    finally:
        for source_document in (
            source_documents.values()
        ):
            if not source_document.is_closed:
                source_document.close()

        if not output_document.is_closed:
            output_document.close()