"""Document formatting modules for pdf3md."""

from .docx_formatter import apply_docx_formatting
from .docx_cleaners import (
    remove_leading_metadata,
    remove_horizontal_rules,
    remove_shape_lines,
)
from .profile_manager import ProfileManager, get_profile_manager
from .profile_schema import DEFAULT_PROFILE, validate_profile, get_profile_template

__all__ = [
    "apply_docx_formatting",
    "remove_leading_metadata",
    "remove_horizontal_rules",
    "remove_shape_lines",
    "ProfileManager",
    "get_profile_manager",
    "DEFAULT_PROFILE",
    "validate_profile",
    "get_profile_template",
]
