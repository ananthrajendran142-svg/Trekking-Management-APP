from flask import Blueprint, request, jsonify
from extensions import db, socketio
from models import GpsLocation, Trek, User, Booking
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

tracking_bp = Blueprint('tracking', __name__, url_prefix='/api/tracking')

@tracking_bp.route('/update', methods=['POST'])
@jwt_required()
def update_gps():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User authentication required.'}), 401

    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    lat = data.get('latitude')
    lng = data.get('longitude')
    alt = data.get('altitude', 0.0)
    batt = data.get('battery_level', 100)

    if not trek_id or lat is None or lng is None:
        return jsonify({'error': 'Trek ID, latitude, and longitude are required.'}), 400

    try:
        trek_id = int(trek_id)
    except Exception:
        pass

    gps = GpsLocation.query.filter_by(trek_id=trek_id, user_id=user.id).first()
    if not gps:
        gps = GpsLocation(trek_id=trek_id, user_id=user.id, latitude=lat, longitude=lng, altitude=alt, battery_level=batt)
        db.session.add(gps)
    else:
        gps.latitude = lat
        gps.longitude = lng
        gps.altitude = alt
        gps.battery_level = batt

    db.session.commit()

    gps_dict = gps.to_dict()
    try:
        room = f"trek_{trek_id}"
        socketio.emit('receive_gps', gps_dict, room=room)
    except Exception:
        pass

    return jsonify({'message': 'Location updated.', 'gps': gps_dict}), 200

@tracking_bp.route('/<int:trek_id>', methods=['GET'])
@jwt_required()
def get_trek_locations(trek_id):
    user = resolve_current_user(get_jwt_identity())
    trek = Trek.query.get(trek_id)

    base_lat = trek.latitude if trek and trek.latitude else 32.2432
    base_lng = trek.longitude if trek and trek.longitude else 77.1892

    bookings = Booking.query.filter_by(trek_id=trek_id).all()
    user_ids = {b.user_id for b in bookings}

    if user:
        user_ids.add(user.id)

    existing_gps = GpsLocation.query.filter_by(trek_id=trek_id).all()
    existing_user_ids = {g.user_id for g in existing_gps}

    added_new = False
    for idx, u_id in enumerate(user_ids):
        if u_id not in existing_user_ids:
            offset_lat = base_lat + (idx * 0.0020)
            offset_lng = base_lng + (idx * 0.0018)
            new_gps = GpsLocation(
                trek_id=trek_id,
                user_id=u_id,
                latitude=round(offset_lat, 4),
                longitude=round(offset_lng, 4),
                altitude=3200 + (idx * 30),
                battery_level=90 - (idx * 4)
            )
            db.session.add(new_gps)
            added_new = True

    if added_new:
        try:
            db.session.commit()
        except Exception:
            pass

    locations = GpsLocation.query.filter_by(trek_id=trek_id).all()
    return jsonify([loc.to_dict() for loc in locations]), 200
