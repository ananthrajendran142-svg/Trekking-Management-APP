from flask import Blueprint, request, jsonify
from extensions import db
from models import Trek, User, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required

treks_bp = Blueprint('treks', __name__, url_prefix='/api/treks')

@treks_bp.route('', methods=['GET'])
def get_treks():
    query = Trek.query

    # Optional query params
    search = request.args.get('search', '').strip()
    location = request.args.get('location', '').strip()
    difficulty = request.args.get('difficulty', '').strip()
    status = request.args.get('status', '').strip()
    max_price = request.args.get('max_price', type=float)
    guide_id = request.args.get('guide_id', type=int)

    if search:
        query = query.filter(
            (Trek.name.ilike(f'%{search}%')) |
            (Trek.location.ilike(f'%{search}%')) |
            (Trek.description.ilike(f'%{search}%'))
        )
    if location:
        query = query.filter(Trek.location.ilike(f'%{location}%'))
    if difficulty and difficulty != 'All':
        query = query.filter(Trek.difficulty.lower() == difficulty.lower())
    if status:
        query = query.filter(Trek.status.lower() == status.lower())
    elif not guide_id:
        # Default public listing shows published or active treks
        query = query.filter(Trek.status.in_(['published', 'active', 'completed']))
    if guide_id:
        query = query.filter(Trek.guide_id == guide_id)
    if max_price:
        query = query.filter(Trek.price <= max_price)

    treks = query.order_by(Trek.id.desc()).all()
    return jsonify([t.to_dict() for t in treks]), 200

@treks_bp.route('/<int:trek_id>', methods=['GET'])
def get_trek(trek_id):
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
    return jsonify(trek.to_dict()), 200

@treks_bp.route('', methods=['POST'])
@jwt_required()
def create_trek():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role not in ['guide', 'admin']:
        return jsonify({'error': 'Only guides and administrators can create treks.'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    location = data.get('location', '').strip()
    difficulty = data.get('difficulty', 'Moderate').strip()
    duration = data.get('duration', '3 Days').strip()
    distance = data.get('distance', '20 km').strip()
    price = data.get('price', 0.0)
    description = data.get('description', '').strip()

    if not name or not location or not description:
        return jsonify({'error': 'Trek name, location, and description are required.'}), 400

    trek = Trek(
        name=name,
        location=location,
        latitude=data.get('latitude', 32.2432),
        longitude=data.get('longitude', 77.1892),
        difficulty=difficulty,
        duration=duration,
        distance=distance,
        max_participants=int(data.get('max_participants', 15)),
        price=float(price),
        start_date=data.get('start_date', ''),
        end_date=data.get('end_date', ''),
        meeting_point=data.get('meeting_point', ''),
        required_equipment=data.get('required_equipment', ''),
        safety_instructions=data.get('safety_instructions', ''),
        description=description,
        itinerary=data.get('itinerary', ''),
        status=data.get('status', 'published'),
        image_url=data.get('image_url', ''),
        guide_id=user.id
    )

    db.session.add(trek)
    db.session.commit()

    return jsonify({'message': 'Trek created successfully.', 'trek': trek.to_dict()}), 201

@treks_bp.route('/<int:trek_id>', methods=['PUT'])
@jwt_required()
def update_trek(trek_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    trek = Trek.query.get(trek_id)

    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    if user.role != 'admin' and trek.guide_id != user.id:
        return jsonify({'error': 'Unauthorized to modify this trek.'}), 403

    data = request.get_json() or {}
    for key in ['name', 'location', 'difficulty', 'duration', 'distance', 'description', 
                'start_date', 'end_date', 'meeting_point', 'required_equipment', 
                'safety_instructions', 'itinerary', 'status', 'image_url']:
        if key in data:
            setattr(trek, key, data[key])

    if 'latitude' in data and data['latitude'] is not None:
        trek.latitude = float(data['latitude'])
    if 'longitude' in data and data['longitude'] is not None:
        trek.longitude = float(data['longitude'])
    if 'max_participants' in data:
        trek.max_participants = int(data['max_participants'])
    if 'price' in data:
        trek.price = float(data['price'])

    db.session.commit()
    return jsonify({'message': 'Trek updated successfully.', 'trek': trek.to_dict()}), 200

@treks_bp.route('/<int:trek_id>/status', methods=['PUT'])
@jwt_required()
def update_trek_status(trek_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    trek = Trek.query.get(trek_id)

    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    if user.role != 'admin' and trek.guide_id != user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['draft', 'published', 'active', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status.'}), 400

    trek.status = new_status

    # Notify participants if trek activated or cancelled
    if new_status in ['active', 'cancelled', 'completed']:
        for booking in trek.bookings:
            if booking.booking_status != 'cancelled':
                notif = Notification(
                    user_id=booking.user_id,
                    title=f"Trek Status Update: {trek.name}",
                    message=f"The status of your trek '{trek.name}' is now '{new_status.upper()}'.",
                    type="trek"
                )
                db.session.add(notif)
                if new_status == 'completed':
                    booking.booking_status = 'completed'

    db.session.commit()
    return jsonify({'message': f'Trek status changed to {new_status}.', 'trek': trek.to_dict()}), 200

@treks_bp.route('/<int:trek_id>', methods=['DELETE'])
@jwt_required()
def delete_trek(trek_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    trek = Trek.query.get(trek_id)

    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    if user.role != 'admin' and trek.guide_id != user.id:
        return jsonify({'error': 'Unauthorized to delete this trek.'}), 403

    db.session.delete(trek)
    db.session.commit()
    return jsonify({'message': 'Trek deleted successfully.'}), 200
