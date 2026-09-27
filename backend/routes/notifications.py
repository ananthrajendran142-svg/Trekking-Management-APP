from flask import Blueprint, jsonify, request
from extensions import db
from models import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.id.desc()).all()
    return jsonify([n.to_dict() for n in notifs]), 200

@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    current_user_id = int(get_jwt_identity())
    notif = Notification.query.get(notif_id)
    if not notif or notif.user_id != current_user_id:
        return jsonify({'error': 'Notification not found.'}), 404

    notif.read_status = True
    db.session.commit()
    return jsonify({'message': 'Marked read.'}), 200

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    current_user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=current_user_id, read_status=False).update({'read_status': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read.'}), 200
