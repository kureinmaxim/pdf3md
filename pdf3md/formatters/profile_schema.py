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


def validate_profile(profile_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
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
            return False, f"Missing required field: {field}"

    # Validate name
    if not isinstance(profile_data["name"], str) or not profile_data["name"].strip():
        return False, "Profile name must be a non-empty string"

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
            return False, f"Missing required page field: {field}"
        if not isinstance(page[field], (int, float)) or page[field] < 0:
            return False, f"Invalid page.{field}: must be a positive number"

    # Validate fonts
    fonts = profile_data.get("fonts", {})
    required_fonts = ["body", "heading1", "table_header", "table_body"]
    for font_key in required_fonts:
        if font_key not in fonts:
            return False, f"Missing required font: {font_key}"
        font = fonts[font_key]
        if "name" not in font or "size" not in font:
            return False, f"Font '{font_key}' missing 'name' or 'size'"
        if not isinstance(font["size"], (int, float)) or font["size"] <= 0:
            return False, f"Font '{font_key}' size must be positive"

    # Validate headings
    headings = profile_data.get("headings", {})
    required_heading_fields = ["h1_size", "h2_size", "h3_size"]
    for field in required_heading_fields:
        if field not in headings:
            return False, f"Missing required heading field: {field}"
        if not isinstance(headings[field], (int, float)) or headings[field] <= 0:
            return False, f"Invalid headings.{field}: must be positive"

    # Validate tables
    tables = profile_data.get("tables", {})
    if "border_width" in tables:
        if not isinstance(tables["border_width"], int) or tables["border_width"] < 0:
            return False, "tables.border_width must be a non-negative integer"

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
