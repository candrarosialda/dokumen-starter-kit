from __future__ import annotations

import json
import sys
from typing import Any


def emit_message(
    message_type: str,
    message: str,
    *,
    progress: int | None = None,
    result: Any = None,
    error: str | None = None,
) -> None:
    payload: dict[str, Any] = {
        "type": message_type,
        "message": message,
    }

    if progress is not None:
        payload["progress"] = max(
            0,
            min(
                int(progress),
                100,
            ),
        )

    if result is not None:
        payload["result"] = result

    if error is not None:
        payload["error"] = error

    sys.stdout.write(
        json.dumps(
            payload,
            ensure_ascii=False,
        )
        + "\n"
    )

    
    sys.stdout.flush()