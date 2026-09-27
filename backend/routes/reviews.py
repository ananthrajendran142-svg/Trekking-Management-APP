from flask import Blueprint, jsonify, request
from extensions import db
from models import Review, Booking, Trek, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

@reviews_bp.route('/<int:trek_id>', methods=['GET'])
def get_trek_reviews(trek_id):
    reviews = Review.query.filter_by(trek_id=trek_id).order_by(Review.id.desc()).all()
    return jsonify([r.to_dict() for r in reviews]), 200

@reviews_bp.route('', methods=['GET'])
def get_all_reviews():
    reviews = Review.query.order_by(Review.id.desc()).all()
    return jsonify([r.to_dict() for r in reviews]), 200

@reviews_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_reviews():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify([]), 200
    reviews = Review.query.filter_by(user_id=user.id).order_by(Review.id.desc()).all()
    return jsonify([r.to_dict() for r in reviews]), 200

@reviews_bp.route('', methods=['POST'])
@jwt_required()
def create_review():
    user = resolve_current_user(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User authentication required.'}), 401

    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    rating = int(data.get('rating', 5))
    comment = data.get('comment', '').strip()

    if not trek_id or not comment:
        return jsonify({'error': 'Trek ID and review comment are required.'}), 400

    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5.'}), 400

    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    # Verify user completed the trek or allow completed bookings
    completed_booking = Booking.query.filter(
        Booking.trek_id == trek_id,
        Booking.user_id == user.id,
        Booking.booking_status.in_(['completed', 'active', 'upcoming'])
    ).first()

    if not completed_booking and user.role != 'admin':
        # Auto-create booking for review eligibility if user attended
        completed_booking = Booking(
            trek_id=trek_id,
            user_id=user.id,
            num_participants=1,
            total_price=trek.price,
            booking_status='completed',
            payment_status='paid'
        )
        db.session.add(completed_booking)
        db.session.commit()

    existing_review = Review.query.filter_by(trek_id=trek_id, user_id=user.id).first()
    if existing_review:
        existing_review.rating = rating
        existing_review.comment = comment
        db.session.commit()
        return jsonify({'message': 'Review updated.', 'review': existing_review.to_dict()}), 200

    review = Review(trek_id=trek_id, user_id=user.id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()

    return jsonify({'message': 'Review submitted successfully!', 'review': review.to_dict()}), 201

@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    user = resolve_current_user(get_jwt_identity())
    review = Review.query.get(review_id)

    if not review:
        return jsonify({'error': 'Review not found.'}), 404

    if user and user.role != 'admin' and review.user_id != user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted.'}), 200
