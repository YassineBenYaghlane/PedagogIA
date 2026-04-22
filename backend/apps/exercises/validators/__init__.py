"""Answer validators dispatched by input_type."""

from . import (
    binary_equality,
    decomposition,
    drag_order,
    mcq,
    mcq_multi,
    number,
    point_on_line,
    symbol,
)

_REGISTRY = {
    "number": number.validate,
    "mcq": mcq.validate,
    "mcq_multi": mcq_multi.validate,
    "symbol": symbol.validate,
    "binary_equality": binary_equality.validate,
    "decomposition": decomposition.validate,
    "point_on_line": point_on_line.validate,
    "drag_order": drag_order.validate,
}


def validate(input_type: str, student_answer, correct_answer, params: dict | None = None) -> bool:
    """Validate a student's answer against the expected one, by input_type."""
    fn = _REGISTRY.get(input_type, number.validate)
    return fn(student_answer, correct_answer, params or {})
