from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        user.name = data['name'].strip()
    if 'phone' in data:
        user.phone = data['phone'].strip()
    if 'profile_photo' in data:
        user.profile_photo = data['profile_photo']

    db.session.commit()

    # Also update persistent store profile
    try:
        from persistent_store import save_registered_user
        save_registered_user(user.to_dict())
    except Exception:
        pass

    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        user = resolve_current_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200
