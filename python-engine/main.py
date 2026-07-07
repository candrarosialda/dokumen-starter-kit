from __future__ import annotations

import argparse
import json
import platform
import sys
from typing import Any

from core.dispatcher import dispatch_job
from core.errors import JobError
from core.messages import emit_message


ENGINE_NAME = (
    "Dokumen Starter Kit Python Engine"
)

ENGINE_VERSION = "0.5.0"


def health_check() -> dict[str, Any]:
    return {
        "ok": True,
        "engine": ENGINE_NAME,
        "version": ENGINE_VERSION,
        "python": platform.python_version(),
        "platform": platform.platform(),
    }


def read_job_request() -> dict[str, Any]:
    raw_request = sys.stdin.readline()

    if not raw_request.strip():
        raise JobError(
            "Permintaan job kosong."
        )

    try:
        request = json.loads(
            raw_request
        )
    except json.JSONDecodeError as error:
        raise JobError(
            "Permintaan job bukan JSON yang valid."
        ) from error

    if not isinstance(
        request,
        dict,
    ):
        raise JobError(
            "Permintaan job harus berupa object JSON."
        )

    return request


def run_job() -> int:
    try:
        request = read_job_request()

        result = dispatch_job(
            request,

            lambda progress, message:
                emit_message(
                    "progress",
                    message,
                    progress=progress,
                ),
        )

        emit_message(
            "result",
            "Pekerjaan selesai.",
            progress=100,
            result=result,
        )

        return 0

    except JobError as error:
        emit_message(
            "error",
            "Pekerjaan gagal.",
            error=str(error),
        )

        return 2

    except Exception as error:
        emit_message(
            "error",
            (
                "Terjadi kesalahan internal "
                "pada Python engine."
            ),
            error=str(error),
        )

        return 1


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=ENGINE_NAME
    )

    parser.add_argument(
        "--health-check",
        action="store_true",
    )

    parser.add_argument(
        "--run-job",
        action="store_true",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_arguments()

    if args.health_check:
        print(
            json.dumps(
                health_check(),
                ensure_ascii=False,
            )
        )

        return 0

    if args.run_job:
        return run_job()

    print(
        json.dumps(
            {
                "ok": False,
                "error": (
                    "Tidak ada perintah engine "
                    "yang diberikan."
                ),
            },
            ensure_ascii=False,
        )
    )

    return 1


if __name__ == "__main__":
    sys.exit(main())