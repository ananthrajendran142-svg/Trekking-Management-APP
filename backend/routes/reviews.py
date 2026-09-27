from flask import Blueprint, jsonify, request
from extensions import db
from models import Review, Booking, Trek, User
from flask_jwt_extended import jwt_required, get_jwt_identity

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
    current_user_id = int(get_jwt_identity())
    reviews = Review.query.filter_by(user_id=current_user_id).order_by(Review.id.desc()).all()
    return jsonify([r.to_dict() for r in reviews]), 200

@reviews_bp.route('', methods=['POST'])
@jwt_required()
def create_review():
    current_user_id = int(get_jwt_identity())
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

    # Verify user completed the trek
    completed_booking = Booking.query.filter_by(
        trek_id=trek_id,
        user_id=current_user_id,
        booking_status='completed'
    ).first()

    if not completed_booking:
        return jsonify({'error': 'Reviews and star ratings can only be submitted after completing your trek.'}), 403

    existing_review = Review.query.filter_by(trek_id=trek_id, user_id=current_user_id).first()
    if existing_review:
        existing_review.rating = rating
        existing_review.comment = comment
        db.session.commit()
        return jsonify({'message': 'Review updated.', 'review': existing_review.to_dict()}), 200

    review = Review(trek_id=trek_id, user_id=current_user_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()

    return jsonify({'message': 'Review submitted successfully!', 'review': review.to_dict()}), 201

@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    review = Review.query.get(review_id)

    if not review:
        return jsonify({'error': 'Review not found.'}), 404

    if user.role != 'admin' and review.user_id != user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted.'}), 200
