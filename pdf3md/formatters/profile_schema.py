"""DOCX formatting profile schema and default configuration."""

import json
from typing import Dict, Any, Optional

# Default profile that matches current hardcoded settings
DEFAULT_PROFILE = {
    "name": "Default",
    "description": "Standard formatting profile with current settings",
    "version": "1.0",
    "page": {
        "width": 8.5,  # inches
        "height": 11.0,
        "top_margin": 0.3,
        "bottom_margin": 0.3,
        "left_margin": 0.79,
        "right_margin": 0.33,
        "header_distance": 0.0,
        "footer_distance": 0.2,
    },
    "fonts": {
        "body": {"name": "Calibri", "size": 11},
        "heading1": {"name": "Calibri", "size": 14, "bold": True},
        "heading2": {"name": "Calibri", "size": 12, "bold": True},
        "heading3": {"name": "Calibri", "size": 11, "bold": True},
        "heading4": {"name": "Calibri", "size": 10, "bold": True},
        "heading5": {"name": "Calibri", "size": 9, "bold": True},
        "heading6": {"name": "Calibri", "size": 9, "bold": True},
        "table_header": {"name": "Calibri", "size": 10, "bold": True},
        "table_body": {"name": "Calibri", "size": 10, "bold": False},
    },
    "headings": {
        "h1_size": 14,
        "h2_size": 12,
        "h3_size": 11,
        "h4_size": 10,
        "h5_size": 9,
        "h6_size": 9,
        "bold": True,
    },
    "tables": {
        "border_style": "single",
        "border_width": 8,
        "border_color": "000000",
        "header_bold": True,
        "header_center": True,
        "auto_width": True,
        "min_col_width": 0.35,
        "max_col_width": 3.0,
    },
    "page_numbers": {
        "enabled": True,
        "position": "footer_right",  # footer_left, footer_center, footer_right
        "format": "PAGE",  # PAGE, PAGE_OF_PAGES, custom
    },
    "paragraph": {
        "line_spacing": 1.0,
        "space_before": 0,
        "space_after": 0,
    },
}


def validate_profile(
    profile_data: Dict[str, Any], strict: bool = True
) -> tuple[bool, Optional[str]]:
    """Validate a profile dictionary against required schema.

    Args:
        profile_data: Profile dictionary to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    required_fields = ["name", "version", "page", "fonts", "headings", "tables"]

    # Check required top-level fields
    for field in required_fields:
        if field not in profile_data:
            if strict:
                return False, f"Missing required field: {field}"
            continue

    # Validate name
    if not isinstance(profile_data["name"], str) or not profile_data["name"].strip():
        return False, "Profile name must be a non-empty string"

    def _is_number(value: Any) -> bool:
        return isinstance(value, (int, float)) and not isinstance(value, bool)

    # Validate page settings
    page = profile_data.get("page", {})
    required_page_fields = [
        "width",
        "height",
        "top_margin",
        "bottom_margin",
        "left_margin",
        "right_margin",
    ]
    for field in required_page_fields:
        if field not in page:
            if strict:
                return False, f"Missing required page field: {field}"
            continue
        if not _is_number(page[field]) or page[field] < 0:
            return False, f"Invalid page.{field}: must be a positive number"

    # Validate fonts
    fonts = profile_data.get("fonts", {})
    required_fonts = [
        "body",
        "heading1",
        "heading2",
        "heading3",
        "heading4",
        "heading5",
        "heading6",
        "table_header",
        "table_body",
    ]
    for font_key in required_fonts:
        if font_key not in fonts:
            if strict:
                return False, f"Missing required font: {font_key}"
            continue
        font = fonts[font_key]
        if "name" not in font or "size" not in font:
            return False, f"Font '{font_key}' missing 'name' or 'size'"
        if not _is_number(font["size"]) or font["size"] <= 0:
            return False, f"Font '{font_key}' size must be positive"

    # Validate headings
    headings = profile_data.get("headings", {})
    required_heading_fields = [
        "h1_size",
        "h2_size",
        "h3_size",
        "h4_size",
        "h5_size",
        "h6_size",
    ]
    for field in required_heading_fields:
        if field not in headings:
            if strict:
                return False, f"Missing required heading field: {field}"
            continue
        if not _is_number(headings[field]) or headings[field] <= 0:
            return False, f"Invalid headings.{field}: must be positive"

    # Validate tables
    tables = profile_data.get("tables", {})
    if "border_width" in tables:
        if not isinstance(tables["border_width"], int) or tables["border_width"] < 0:
            return False, "tables.border_width must be a non-negative integer"
    if "min_col_width" in tables:
        if not _is_number(tables["min_col_width"]) or tables["min_col_width"] <= 0:
            return False, "tables.min_col_width must be positive"
    if "max_col_width" in tables:
        if not _is_number(tables["max_col_width"]) or tables["max_col_width"] <= 0:
            return False, "tables.max_col_width must be positive"
    if "auto_width" in tables and not isinstance(tables["auto_width"], bool):
        return False, "tables.auto_width must be boolean"

    # Validate paragraph settings
    paragraph = profile_data.get("paragraph", {})
    if "line_spacing" in paragraph:
        if not _is_number(paragraph["line_spacing"]) or paragraph["line_spacing"] <= 0:
            return False, "paragraph.line_spacing must be positive"
    for field in ["space_before", "space_after"]:
        if field in paragraph:
            if not _is_number(paragraph[field]) or paragraph[field] < 0:
                return False, f"paragraph.{field} must be non-negative"

    # Validate page numbers
    page_numbers = profile_data.get("page_numbers", {})
    if "enabled" in page_numbers and not isinstance(page_numbers["enabled"], bool):
        return False, "page_numbers.enabled must be boolean"
    if "position" in page_numbers:
        if page_numbers["position"] not in [
            "footer_left",
            "footer_center",
            "footer_right",
        ]:
            return False, "page_numbers.position is invalid"
    if "format" in page_numbers:
        if page_numbers["format"] not in ["PAGE", "PAGE_OF_PAGES", "custom"]:
            return False, "page_numbers.format is invalid"
    if "custom_text" in page_numbers and not isinstance(
        page_numbers["custom_text"], str
    ):
        return False, "page_numbers.custom_text must be string"

    return True, None


def merge_with_defaults(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Merge a profile with default values for missing fields.

    Args:
        profile_data: Partial or complete profile dictionary

    Returns:
        Complete profile with defaults filled in
    """
    merged = json.loads(json.dumps(DEFAULT_PROFILE))  # Deep copy

    def deep_merge(base: dict, overlay: dict) -> dict:
        """Recursively merge overlay into base."""
        for key, value in overlay.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                base[key] = deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    return deep_merge(merged, profile_data)


def get_profile_template(name: str, description: str = "") -> Dict[str, Any]:
    """Get a profile template with the given name and description.

    Args:
        name: Profile name
        description: Profile description

    Returns:
        Profile dictionary based on default template
    """
    template = json.loads(json.dumps(DEFAULT_PROFILE))  # Deep copy
    template["name"] = name
    template["description"] = description or f"Custom profile: {name}"
    return template
