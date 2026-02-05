"""DOCX formatting profile management."""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

from .profile_schema import (
    DEFAULT_PROFILE,
    validate_profile,
    merge_with_defaults,
    get_profile_template,
)

logger = logging.getLogger(__name__)


class ProfileManager:
    """Manage DOCX formatting profiles."""

    def __init__(self, storage_dir: Optional[str] = None):
        """Initialize profile manager.

        Args:
            storage_dir: Directory to store profiles. Defaults to ~/.pdf3md/profiles/
        """
        if storage_dir:
            self.storage_dir = Path(storage_dir)
        else:
            self.storage_dir = Path.home() / ".pdf3md" / "profiles"

        self.storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Profile storage directory: {self.storage_dir}")

        # Ensure default profile exists
        self._ensure_default_profile()

    def _ensure_default_profile(self):
        """Ensure the default profile file exists."""
        default_path = self.storage_dir / "default.json"
        if not default_path.exists():
            self.save_profile(DEFAULT_PROFILE)
            logger.info("Created default profile")

    def _get_profile_path(self, name: str) -> Path:
        """Get the file path for a profile.

        Args:
            name: Profile name

        Returns:
            Path to profile file
        """
        # Sanitize filename
        safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_"))
        safe_name = safe_name.lower().replace(" ", "_")
        return self.storage_dir / f"{safe_name}.json"

    def list_profiles(self) -> List[Dict[str, Any]]:
        """List all available profiles.

        Returns:
            List of profile metadata (name, description)
        """
        profiles = []

        for profile_file in self.storage_dir.glob("*.json"):
            try:
                with open(profile_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                profiles.append(
                    {
                        "name": data.get("name", profile_file.stem),
                        "description": data.get("description", ""),
                        "version": data.get("version", "1.0"),
                    }
                )
            except Exception as e:
                logger.error(f"Error reading profile {profile_file}: {e}")

        # Sort by name
        profiles.sort(key=lambda p: p["name"])
        return profiles

    def load_profile(self, name: str) -> Optional[Dict[str, Any]]:
        """Load a profile by name.

        Args:
            name: Profile name

        Returns:
            Profile dictionary, or None if not found
        """
        profile_path = self._get_profile_path(name)

        if not profile_path.exists():
            logger.warning(f"Profile not found: {name}")
            return None

        try:
            with open(profile_path, "r", encoding="utf-8") as f:
                profile_data = json.load(f)

            # Validate
            is_valid, error = validate_profile(profile_data)
            if not is_valid:
                logger.error(f"Invalid profile '{name}': {error}")
                return None

            # Merge with defaults for any missing fields
            profile_data = merge_with_defaults(profile_data)

            logger.info(f"Loaded profile: {name}")
            return profile_data

        except Exception as e:
            logger.error(f"Error loading profile '{name}': {e}")
            return None

    def save_profile(self, profile_data: Dict[str, Any]) -> bool:
        """Save a profile.

        Args:
            profile_data: Profile dictionary

        Returns:
            True if successful, False otherwise
        """
        # Validate
        is_valid, error = validate_profile(profile_data)
        if not is_valid:
            logger.error(f"Cannot save invalid profile: {error}")
            return False

        name = profile_data.get("name")
        if not name:
            logger.error("Profile must have a name")
            return False

        profile_path = self._get_profile_path(name)

        try:
            with open(profile_path, "w", encoding="utf-8") as f:
                json.dump(profile_data, f, indent=2, ensure_ascii=False)

            logger.info(f"Saved profile: {name} to {profile_path}")
            return True

        except Exception as e:
            logger.error(f"Error saving profile '{name}': {e}")
            return False

    def delete_profile(self, name: str) -> bool:
        """Delete a profile.

        Args:
            name: Profile name

        Returns:
            True if successful, False otherwise
        """
        # Prevent deletion of default profile
        if name.lower() == "default":
            logger.warning("Cannot delete default profile")
            return False

        profile_path = self._get_profile_path(name)

        if not profile_path.exists():
            logger.warning(f"Profile not found: {name}")
            return False

        try:
            profile_path.unlink()
            logger.info(f"Deleted profile: {name}")
            return True

        except Exception as e:
            logger.error(f"Error deleting profile '{name}': {e}")
            return False

    def duplicate_profile(self, source_name: str, new_name: str) -> bool:
        """Duplicate an existing profile with a new name.

        Args:
            source_name: Name of profile to duplicate
            new_name: Name for the new profile

        Returns:
            True if successful, False otherwise
        """
        source_profile = self.load_profile(source_name)
        if not source_profile:
            return False

        # Update name and description
        source_profile["name"] = new_name
        source_profile["description"] = f"Copy of {source_name}"

        return self.save_profile(source_profile)

    def get_default_profile(self) -> Dict[str, Any]:
        """Get the default profile.

        Returns:
            Default profile dictionary
        """
        profile = self.load_profile("default")
        if profile:
            return profile

        # Fallback to hardcoded default
        logger.warning("Using hardcoded default profile")
        return DEFAULT_PROFILE.copy()


# Global profile manager instance
_profile_manager = None


def get_profile_manager() -> ProfileManager:
    """Get the global profile manager instance.

    Returns:
        ProfileManager instance
    """
    global _profile_manager
    if _profile_manager is None:
        _profile_manager = ProfileManager()
    return _profile_manager
