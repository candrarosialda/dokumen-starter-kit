from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any

from core.errors import InvalidJobRequest


ProgressEmitter = Callable[
    [int, str],
    None,
]


def _read_integer(
    payload: dict[str, Any],
    key: str,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    value = payload.get(
        key,
        default,
    )

    if (
        isinstance(value, bool)
        or not isinstance(value, int)
    ):
        raise InvalidJobRequest(
            f"{key} harus berupa bilangan bulat."
        )

    if (
        value < minimum
        or value > maximum
    ):
        raise InvalidJobRequest(
            f"{key} harus berada di antara "
            f"{minimum} dan {maximum}."
        )

    return value


def run_demo_job(
    payload: dict[str, Any],
    emit_progress: ProgressEmitter,
) -> dict[str, Any]:
    steps = _read_integer(
        payload,
        "steps",
        20,
        2,
        100,
    )

    delay_ms = _read_integer(
        payload,
        "delayMs",
        120,
        10,
        2_000,
    )

    emit_progress(
        0,
        "Demo job dimulai.",
    )

    for current_step in range(
        1,
        steps + 1,
    ):
        time.sleep(
            delay_ms / 1_000,
        )

        progress = round(
            (
                current_step /
                steps
            )
            * 100
        )

        emit_progress(
            progress,
            (
                f"Memproses langkah "
                f"{current_step} "
                f"dari {steps}."
            ),
        )

    return {
        "processedSteps": steps,
        "delayMs": delay_ms,
    }