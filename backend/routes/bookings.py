from flask import Blueprint, request, jsonify
from extensions import db
from models import Booking, Trek, User, Participant, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

@bookings_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    num_participants = int(data.get('num_participants', 1))

    if not trek_id or num_participants <= 0:
        return jsonify({'error': 'Valid trek ID and participant count required.'}), 400

    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    if trek.status not in ['published', 'active']:
        return jsonify({'error': 'This trek is not open for booking.'}), 400

    # Calculate booked slots
    current_booked = sum(b.num_participants for b in trek.bookings if b.booking_status != 'cancelled')
    available_slots = trek.max_participants - current_booked

    if num_participants > available_slots:
        return jsonify({'error': f'Only {available_slots} slots available for this trek.'}), 400

    total_price = float(trek.price) * num_participants

    booking = Booking(
        trek_id=trek.id,
        user_id=user.id,
        num_participants=num_participants,
        total_price=total_price,
        booking_status='upcoming',
        payment_status='paid' if trek.price == 0 else 'pending'
    )
    db.session.add(booking)
    db.session.flush()

    # Create participant record
    participant = Participant(
        booking_id=booking.id,
        trek_id=trek.id,
        user_id=user.id,
        check_in_status='pending',
        location_status='active'
    )
    db.session.add(participant)

    # Send Notification
    notif = Notification(
        user_id=user.id,
        title="Booking Confirmed!",
        message=f"You successfully booked {num_participants} slot(s) for '{trek.name}'. Total: ${total_price:.2f}.",
        type="booking"
    )
    db.session.add(notif)

    # Notify Guide
    guide_notif = Notification(
        user_id=trek.guide_id,
        title="New Trek Booking",
        message=f"{user.name} booked {num_participants} participant(s) for '{trek.name}'.",
        type="booking"
    )
    db.session.add(guide_notif)

    db.session.commit()
    return jsonify({'message': 'Booking successful!', 'booking': booking.to_dict()}), 201

@bookings_bp.route('', methods=['GET'])
@jwt_required()
def get_bookings():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    status = request.args.get('status', '').strip().lower()

    if user.role == 'admin':
        query = Booking.query
    elif user.role == 'guide':
        # Bookings for treks guided by this guide or by this user
        guided_trek_ids = [t.id for t in Trek.query.filter_by(guide_id=user.id).all()]
        query = Booking.query.filter(
            (Booking.user_id == user.id) | (Booking.trek_id.in_(guided_trek_ids))
        )
    else:
        query = Booking.query.filter_by(user_id=user.id)

    if status and status != 'all':
        query = query.filter_by(booking_status=status)

    bookings = query.order_by(Booking.id.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404

    if user.role != 'admin' and booking.user_id != user.id and booking.trek.guide_id != user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    return jsonify(booking.to_dict()), 200

@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404

    if user.role != 'admin' and booking.user_id != user.id and booking.trek.guide_id != user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    data = request.get_json() or {}
    new_status = data.get('booking_status')
    payment_status = data.get('payment_status')

    if new_status:
        booking.booking_status = new_status
    if payment_status:
        booking.payment_status = payment_status

    db.session.commit()
    return jsonify({'message': 'Booking updated successfully.', 'booking': booking.to_dict()}), 200

@bookings_bp.route('/participants/<int:trek_id>', methods=['GET'])
@jwt_required()
def get_participants(trek_id):
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    participants = Participant.query.filter_by(trek_id=trek_id).all()
    return jsonify([p.to_dict() for p in participants]), 200

@bookings_bp.route('/participants/<int:participant_id>/status', methods=['PUT'])
@jwt_required()
def update_participant_status(participant_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    participant = Participant.query.get(participant_id)

    if not participant:
        return jsonify({'error': 'Participant record not found.'}), 404

    data = request.get_json() or {}
    check_in = data.get('check_in_status')
    loc_status = data.get('location_status')

    if check_in:
        participant.check_in_status = check_in
    if loc_status:
        participant.location_status = loc_status

    db.session.commit()
    return jsonify({'message': 'Participant status updated.', 'participant': participant.to_dict()}), 200
