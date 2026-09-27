from flask import Blueprint, request, jsonify
from extensions import db, socketio
from models import GpsLocation, Trek, User
from flask_jwt_extended import jwt_required, get_jwt_identity

tracking_bp = Blueprint('tracking', __name__, url_prefix='/api/tracking')

@tracking_bp.route('/update', methods=['POST'])
@jwt_required()
def update_gps():
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    lat = data.get('latitude')
    lng = data.get('longitude')
    alt = data.get('altitude', 0.0)
    batt = data.get('battery_level', 100)

    if not trek_id or lat is None or lng is None:
        return jsonify({'error': 'Trek ID, latitude, and longitude are required.'}), 400

    trek_id = int(trek_id)
    gps = GpsLocation.query.filter_by(trek_id=trek_id, user_id=current_user_id).first()
    if not gps:
        gps = GpsLocation(trek_id=trek_id, user_id=current_user_id, latitude=lat, longitude=lng, altitude=alt, battery_level=batt)
        db.session.add(gps)
    else:
        gps.latitude = lat
        gps.longitude = lng
        gps.altitude = alt
        gps.battery_level = batt

    db.session.commit()
    db.session.refresh(gps)

    gps_dict = gps.to_dict()
    room = f"trek_{trek_id}"
    socketio.emit('receive_gps', gps_dict, room=room)

    return jsonify({'message': 'Location updated.', 'gps': gps_dict}), 200

from models import GpsLocation, Trek, User, Booking

@tracking_bp.route('/<int:trek_id>', methods=['GET'])
@jwt_required()
def get_trek_locations(trek_id):
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify([]), 404

    base_lat = trek.latitude or 32.2432
    base_lng = trek.longitude or 77.1892

    # Find all users with bookings for this trek
    bookings = Booking.query.filter_by(trek_id=trek_id).all()
    user_ids = {b.user_id for b in bookings}

    # Ensure current logged-in user is also included if viewing
    current_user_id = int(get_jwt_identity())
    user_ids.add(current_user_id)

    existing_gps = GpsLocation.query.filter_by(trek_id=trek_id).all()
    existing_user_ids = {g.user_id for g in existing_gps}

    # Create default GPS location for any booked participant missing a location record
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
        db.session.commit()

    locations = GpsLocation.query.filter_by(trek_id=trek_id).all()
    return jsonify([loc.to_dict() for loc in locations]), 200
