from flask import Blueprint, request, jsonify
from extensions import db
from models import Trek, User, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

treks_bp = Blueprint('treks', __name__, url_prefix='/api/treks')

@treks_bp.route('', methods=['GET'])
def get_treks():
    # Sync custom published & updated treks from persistent store into SQLite FIRST
    try:
        from persistent_store import load_custom_treks
        custom_treks = load_custom_treks()
        for c_t in custom_treks:
            if not c_t.get('name'):
                continue

            existing = None
            if c_t.get('id'):
                try:
                    existing = Trek.query.get(int(c_t['id']))
                except (ValueError, TypeError):
                    pass
            if not existing:
                existing = Trek.query.filter_by(name=c_t['name']).first()

            if existing:
                # Update existing DB trek fields with latest properties
                for key in ['name', 'location', 'difficulty', 'duration', 'distance', 'description', 
                            'start_date', 'end_date', 'meeting_point', 'required_equipment', 
                            'safety_instructions', 'itinerary', 'status', 'image_url']:
                    if key in c_t and c_t[key] is not None:
                        setattr(existing, key, c_t[key])
                if 'price' in c_t and c_t['price'] is not None:
                    existing.price = float(c_t['price'])
                if 'max_participants' in c_t and c_t['max_participants'] is not None:
                    existing.max_participants = int(c_t['max_participants'])
            else:
                # Insert missing custom trek
                t_obj = Trek(
                    id=int(c_t['id']) if isinstance(c_t.get('id'), int) and c_t['id'] < 2000000000 else None,
                    name=c_t['name'],
                    location=c_t.get('location', 'High Altitude Region'),
                    latitude=c_t.get('latitude', 32.2432),
                    longitude=c_t.get('longitude', 77.1892),
                    difficulty=c_t.get('difficulty', 'Moderate'),
                    duration=c_t.get('duration', '3 Days'),
                    distance=c_t.get('distance', '20 km'),
                    max_participants=c_t.get('max_participants', 15),
                    price=c_t.get('price', 250.0),
                    start_date=c_t.get('start_date', ''),
                    end_date=c_t.get('end_date', ''),
                    meeting_point=c_t.get('meeting_point', ''),
                    required_equipment=c_t.get('required_equipment', ''),
                    safety_instructions=c_t.get('safety_instructions', ''),
                    description=c_t.get('description', ''),
                    itinerary=c_t.get('itinerary', ''),
                    status=c_t.get('status', 'published'),
                    image_url=c_t.get('image_url', ''),
                    guide_id=c_t.get('guide_id', 2)
                )
                db.session.add(t_obj)
        db.session.commit()
    except Exception as e:
        print(f"Trek restore error: {e}")

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
        # Check custom treks in persistent store
        try:
            from persistent_store import load_custom_treks
            custom_treks = load_custom_treks()
            for c_t in custom_treks:
                if str(c_t.get('id')) == str(trek_id) or c_t.get('name') == str(trek_id):
                    trek = Trek(
                        id=int(trek_id) if isinstance(trek_id, int) and trek_id < 2000000000 else None,
                        name=c_t['name'],
                        location=c_t.get('location', 'High Altitude Region'),
                        latitude=c_t.get('latitude', 32.2432),
                        longitude=c_t.get('longitude', 77.1892),
                        difficulty=c_t.get('difficulty', 'Moderate'),
                        duration=c_t.get('duration', '3 Days'),
                        distance=c_t.get('distance', '20 km'),
                        max_participants=c_t.get('max_participants', 15),
                        price=c_t.get('price', 250.0),
                        start_date=c_t.get('start_date', ''),
                        end_date=c_t.get('end_date', ''),
                        meeting_point=c_t.get('meeting_point', ''),
                        required_equipment=c_t.get('required_equipment', ''),
                        safety_instructions=c_t.get('safety_instructions', ''),
                        description=c_t.get('description', ''),
                        itinerary=c_t.get('itinerary', ''),
                        status=c_t.get('status', 'published'),
                        image_url=c_t.get('image_url', ''),
                        guide_id=c_t.get('guide_id', 2)
                    )
                    db.session.add(trek)
                    db.session.commit()
                    return jsonify(trek.to_dict()), 200
        except Exception as e:
            print(f"Error restoring single trek: {e}")
        return jsonify({'error': 'Trek not found.'}), 404
    return jsonify(trek.to_dict()), 200

@treks_bp.route('', methods=['POST'])
@jwt_required()
def create_trek():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User authentication failed.'}), 401

    # Auto-promote user role to guide if they are creating a trek
    if user.role not in ['guide', 'admin']:
        user.role = 'guide'
        db.session.commit()

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
    db.session.refresh(trek)

    trek_dict = trek.to_dict()

    # Save to persistent trek store
    try:
        from persistent_store import save_custom_trek
        save_custom_trek(trek_dict)
    except Exception as e:
        print(f"Error saving trek to persistent store: {e}")

    return jsonify({'message': 'Trek created successfully.', 'trek': trek_dict}), 201

@treks_bp.route('/<int:trek_id>', methods=['PUT'])
@jwt_required()
def update_trek(trek_id):
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User authentication failed.'}), 401

    trek = Trek.query.get(trek_id)
    if not trek:
        # Check custom treks in persistent store
        try:
            from persistent_store import load_custom_treks
            custom_treks = load_custom_treks()
            for c_t in custom_treks:
                if str(c_t.get('id')) == str(trek_id) or c_t.get('name') == str(trek_id):
                    trek = Trek(
                        id=int(trek_id) if isinstance(trek_id, int) and trek_id < 2000000000 else None,
                        name=c_t['name'],
                        location=c_t.get('location', 'High Altitude Region'),
                        latitude=c_t.get('latitude', 32.2432),
                        longitude=c_t.get('longitude', 77.1892),
                        difficulty=c_t.get('difficulty', 'Moderate'),
                        duration=c_t.get('duration', '3 Days'),
                        distance=c_t.get('distance', '20 km'),
                        max_participants=c_t.get('max_participants', 15),
                        price=c_t.get('price', 250.0),
                        start_date=c_t.get('start_date', ''),
                        end_date=c_t.get('end_date', ''),
                        meeting_point=c_t.get('meeting_point', ''),
                        required_equipment=c_t.get('required_equipment', ''),
                        safety_instructions=c_t.get('safety_instructions', ''),
                        description=c_t.get('description', ''),
                        itinerary=c_t.get('itinerary', ''),
                        status=c_t.get('status', 'published'),
                        image_url=c_t.get('image_url', ''),
                        guide_id=user.id
                    )
                    db.session.add(trek)
                    db.session.commit()
                    break
        except Exception as e:
            print(f"Error restoring trek for update: {e}")

    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    # Allow authenticated guide to claim ownership or admin to update
    if user.role != 'admin' and trek.guide_id != user.id:
        trek.guide_id = user.id

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

    trek_dict = trek.to_dict()

    try:
        from persistent_store import save_custom_trek
        save_custom_trek(trek_dict)
    except Exception as e:
        print(f"Error saving updated trek: {e}")

    return jsonify({'message': 'Trek updated successfully.', 'trek': trek_dict}), 200

@treks_bp.route('/<int:trek_id>/status', methods=['PUT'])
@jwt_required()
def update_trek_status(trek_id):
    user = resolve_current_user(get_jwt_identity())
    trek = Trek.query.get(trek_id)

    # Restore trek from persistent store if missing in SQLite on cold start
    if not trek:
        try:
            from persistent_store import load_custom_treks
            custom_treks = load_custom_treks()
            for c_t in custom_treks:
                if str(c_t.get('id')) == str(trek_id) or c_t.get('name') == str(trek_id):
                    trek = Trek(
                        id=int(trek_id) if isinstance(trek_id, int) and trek_id < 2000000000 else None,
                        name=c_t['name'],
                        location=c_t.get('location', 'High Altitude Region'),
                        difficulty=c_t.get('difficulty', 'Moderate'),
                        duration=c_t.get('duration', '3 Days'),
                        distance=c_t.get('distance', '20 km'),
                        price=c_t.get('price', 250.0),
                        status=c_t.get('status', 'published'),
                        description=c_t.get('description', ''),
                        guide_id=user.id if user else 2
                    )
                    db.session.add(trek)
                    db.session.commit()
                    break
        except Exception as e:
            print(f"Error restoring trek in status update: {e}")

    data = request.get_json() or {}
    new_status = data.get('status')
    if not new_status or new_status not in ['draft', 'published', 'active', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status.'}), 400

    if trek:
        trek.status = new_status
        if user and user.id:
            trek.guide_id = user.id

        if new_status in ['active', 'cancelled', 'completed']:
            all_bookings = Booking.query.filter_by(trek_id=trek.id).all()
            for booking in all_bookings:
                if booking.booking_status != 'cancelled':
                    notif = Notification(
                        user_id=booking.user_id,
                        title=f"Trek Status Update: {trek.name}",
                        message=f"The status of your trek '{trek.name}' is now '{new_status.upper()}'. Review forms are now unlocked!",
                        type="trek"
                    )
                    db.session.add(notif)
                    if new_status == 'completed':
                        booking.booking_status = 'completed'

        db.session.commit()

        try:
            from persistent_store import save_custom_trek
            save_custom_trek(trek.to_dict())
        except Exception as e:
            print(f"Error saving updated trek status: {e}")

        return jsonify({'message': f'Trek status changed to {new_status}.', 'trek': trek.to_dict()}), 200
    else:
        try:
            from persistent_store import save_custom_trek
            save_custom_trek({'id': trek_id, 'status': new_status})
        except Exception:
            pass
        return jsonify({'message': f'Trek status changed to {new_status}.', 'trek': {'id': trek_id, 'status': new_status}}), 200

@treks_bp.route('/<int:trek_id>', methods=['DELETE'])
@jwt_required()
def delete_trek(trek_id):
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User authentication failed.'}), 401

    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    if user.role != 'admin' and trek.guide_id != user.id:
        return jsonify({'error': 'Unauthorized to delete this trek.'}), 403

    db.session.delete(trek)
    db.session.commit()
    return jsonify({'message': 'Trek deleted successfully.'}), 200

