from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models import SosAlert, Trek, User, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

sos_bp = Blueprint('sos', __name__, url_prefix='/api/sos')

@sos_bp.route('', methods=['POST'])
@jwt_required()
def trigger_sos():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User not authenticated.'}), 401

    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    lat = data.get('latitude', 32.2432)
    lng = data.get('longitude', 77.1892)
    message = data.get('message', 'Emergency SOS signal triggered! Immediate assistance required.')

    if not trek_id:
        return jsonify({'error': 'Trek ID is required.'}), 400

    trek = Trek.query.get(trek_id)
    if not trek:
        trek = Trek.query.first()

    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    sos = SosAlert(
        trek_id=trek.id,
        user_id=user.id,
        latitude=lat,
        longitude=lng,
        message=message,
        status='active'
    )
    db.session.add(sos)

    if trek.guide_id:
        guide_notif = Notification(
            user_id=trek.guide_id,
            title="🚨 EMERGENCY SOS ALERT!",
            message=f"SOS triggered by {user.name} on trek '{trek.name}'! Location: ({lat}, {lng}).",
            type="sos"
        )
        db.session.add(guide_notif)

    admins = User.query.filter_by(role='admin').all()
    for admin in admins:
        admin_notif = Notification(
            user_id=admin.id,
            title="🚨 SYSTEM EMERGENCY SOS",
            message=f"SOS by {user.name} on trek '{trek.name}'.",
            type="sos"
        )
        db.session.add(admin_notif)

    db.session.commit()
    return jsonify({'message': 'SOS alert transmitted to guide and search team!', 'sos': sos.to_dict()}), 201

@sos_bp.route('', methods=['GET'])
@jwt_required()
def get_sos_alerts():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify([]), 200

    status = request.args.get('status', '').strip().lower()

    if user.role == 'admin':
        query = SosAlert.query
    elif user.role == 'guide':
        guided_trek_ids = [t.id for t in Trek.query.filter_by(guide_id=user.id).all()]
        query = SosAlert.query.filter(
            (SosAlert.user_id == user.id) | (SosAlert.trek_id.in_(guided_trek_ids))
        )
    else:
        query = SosAlert.query.filter_by(user_id=user.id)

    if status and status != 'all':
        query = query.filter_by(status=status)

    alerts = query.order_by(SosAlert.id.desc()).all()
    return jsonify([a.to_dict() for a in alerts]), 200

@sos_bp.route('/<int:sos_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_sos(sos_id):
    user = resolve_current_user(get_jwt_identity())
    sos = SosAlert.query.get(sos_id)

    if not sos:
        return jsonify({'error': 'SOS record not found.'}), 404

    sos.status = 'resolved'
    sos.resolved_at = datetime.utcnow()

    notif = Notification(
        user_id=sos.user_id,
        title="SOS Alert Resolved",
        message=f"Your SOS alert on '{sos.trek.name}' has been marked resolved.",
        type="sos"
    )
    db.session.add(notif)

    db.session.commit()
    return jsonify({'message': 'SOS marked resolved.', 'sos': sos.to_dict()}), 200
