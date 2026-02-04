"""Profile management API endpoints."""

# Add this at the end of app.py before the if __name__ == "__main__" block

from .formatters import get_profile_manager, validate_profile, get_profile_template


@app.route("/api/profiles", methods=["GET"])
def list_profiles():
    """List all available profiles."""
    try:
        profile_manager = get_profile_manager()
        profiles = profile_manager.list_profiles()
        return jsonify({"profiles": profiles}), 200
    except Exception as e:
        logger.error(f"Error listing profiles: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/profiles/<profile_name>", methods=["GET"])
def get_profile(profile_name):
    """Get a specific profile by name."""
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.load_profile(profile_name)
        
        if not profile:
            return jsonify({"error": f"Profile '{profile_name}' not found"}), 404
        
        return jsonify(profile), 200
    except Exception as e:
        logger.error(f"Error getting profile '{profile_name}': {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/profiles", methods=["POST"])
def create_profile():
    """Create or update a profile."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No profile data provided"}), 400
        
        # Validate profile
        is_valid, error_message = validate_profile(data)
        if not is_valid:
            return jsonify({"error": f"Invalid profile: {error_message}"}), 400
        
        profile_manager = get_profile_manager()
        success = profile_manager.save_profile(data)
        
        if success:
            return jsonify({"message": f"Profile '{data.get('name')}' saved successfully"}), 200
        else:
            return jsonify({"error": "Failed to save profile"}), 500
            
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/profiles/<profile_name>", methods=["PUT"])
def update_profile(profile_name):
    """Update an existing profile."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No profile data provided"}), 400
        
        # Ensure name matches
        data["name"] = profile_name
        
        # Validate profile
        is_valid, error_message = validate_profile(data)
        if not is_valid:
            return jsonify({"error": f"Invalid profile: {error_message}"}), 400
        
        profile_manager = get_profile_manager()
        success = profile_manager.save_profile(data)
        
        if success:
            return jsonify({"message": f"Profile '{profile_name}' updated successfully"}), 200
        else:
            return jsonify({"error": "Failed to update profile"}), 500
            
    except Exception as e:
        logger.error(f"Error updating profile '{profile_name}': {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/profiles/<profile_name>", methods=["DELETE"])
def delete_profile(profile_name):
    """Delete a profile."""
    try:
        profile_manager = get_profile_manager()
        success = profile_manager.delete_profile(profile_name)
        
        if success:
            return jsonify({"message": f"Profile '{profile_name}' deleted successfully"}), 200
        else:
            return jsonify({"error": f"Failed to delete profile '{profile_name}'"}), 400
            
    except Exception as e:
        logger.error(f"Error deleting profile '{profile_name}': {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/profiles/<profile_name>/duplicate", methods=["POST"])
def duplicate_profile(profile_name):
    """Duplicate a profile with a new name."""
    try:
        data = request.get_json()
        new_name = data.get("newName")
        
        if not new_name:
            return jsonify({"error": "New profile name required"}), 400
        
        profile_manager = get_profile_manager()
        success = profile_manager.duplicate_profile(profile_name, new_name)
        
        if success:
            return jsonify({"message": f"Profile duplicated as '{new_name}'"}), 200
        else:
            return jsonify({"error": "Failed to duplicate profile"}), 400
            
    except Exception as e:
        logger.error(f"Error duplicating profile '{profile_name}': {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/profiles/template", methods=["GET"])
def get_profile_template_endpoint():
    """Get a profile template for creating new profiles."""
    try:
        name = request.args.get("name", "New Profile")
        description = request.args.get("description", "")
        
        template = get_profile_template(name, description)
        return jsonify(template), 200
        
    except Exception as e:
        logger.error(f"Error getting profile template: {str(e)}")
        return jsonify({"error": str(e)}), 500
