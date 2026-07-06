from __future__ import annotations

from collections.abc import Callable
from typing import Any

from core.errors import InvalidJobRequest
from jobs.demo_job import run_demo_job
from jobs.merge_pdf_job import run_merge_pdf_job
from jobs.organize_pdf_job import run_organize_pdf_job


ProgressEmitter = Callable[
    [int, str],
    None,
]


def dispatch_job(
    request: dict[str, Any],
    emit_progress: ProgressEmitter,
) -> dict[str, Any]:
    kind = request.get("kind")
    payload = request.get("payload")

    if (
        not isinstance(kind, str)
        or not kind
    ):
        raise InvalidJobRequest(
            "Jenis job tidak tersedia."
        )

    if not isinstance(
        payload,
        dict,
    ):
        raise InvalidJobRequest(
            "Payload job harus berupa object JSON."
        )

    if kind == "demo":
        return run_demo_job(
            payload,
            emit_progress,
        )

    if kind == "merge_pdf":
        return run_merge_pdf_job(
            payload,
            emit_progress,
        )

    if kind == "organize_pdf":
        return run_organize_pdf_job(
            payload,
            emit_progress,
        )

    raise InvalidJobRequest(
        f"Jenis job '{kind}' belum didukung."
    )