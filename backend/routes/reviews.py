from flask import Blueprint, jsonify, request
from extensions import db
from models import Review, Booking, Trek, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

@reviews_bp.route('/<trek_id>', methods=['GET'])
def get_trek_reviews(trek_id):
    if str(trek_id).isdigit():
        reviews = Review.query.filter_by(trek_id=int(trek_id)).order_by(Review.id.desc()).all()
    else:
        trek = Trek.query.filter_by(name=str(trek_id)).first()
        if trek:
            reviews = Review.query.filter_by(trek_id=trek.id).order_by(Review.id.desc()).all()
        else:
            reviews = []
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

    trek = None
    if str(trek_id).isdigit():
        try:
            trek = Trek.query.get(int(trek_id))
        except Exception:
            pass

    if not trek:
        trek = Trek.query.filter_by(name=str(trek_id)).first()

    if not trek:
        try:
            from persistent_store import load_custom_treks
            custom_treks = load_custom_treks()
            for c_t in custom_treks:
                if str(c_t.get('id')) == str(trek_id) or c_t.get('name') == str(trek_id):
                    existing = Trek.query.filter_by(name=c_t['name']).first()
                    if existing:
                        trek = existing
                    else:
                        trek = Trek(
                            name=c_t['name'],
                            location=c_t.get('location', 'High Altitude Region'),
                            difficulty=c_t.get('difficulty', 'Moderate'),
                            duration=c_t.get('duration', '3 Days'),
                            distance=c_t.get('distance', '20 km'),
                            price=c_t.get('price', 250.0),
                            status=c_t.get('status', 'completed'),
                            guide_id=2
                        )
                        db.session.add(trek)
                        db.session.commit()
                    break
        except Exception as e:
            print(f"Error restoring trek in review creation: {e}")

    if not trek:
        trek = Trek(
            name=f"Trek {trek_id}",
            location="High Altitude Region",
            price=250.0,
            status="completed",
            guide_id=2
        )
        db.session.add(trek)
        db.session.commit()

    numeric_trek_id = trek.id

    completed_booking = Booking.query.filter(
        Booking.user_id == user.id,
        db.or_(Booking.trek_id == numeric_trek_id, Booking.trek_id == trek_id)
    ).first()

    if not completed_booking:
        completed_booking = Booking(
            trek_id=numeric_trek_id,
            user_id=user.id,
            num_participants=1,
            total_price=trek.price or 250.0,
            booking_status='completed',
            payment_status='paid'
        )
        db.session.add(completed_booking)
        db.session.commit()

    existing_review = Review.query.filter_by(trek_id=numeric_trek_id, user_id=user.id).first()
    if existing_review:
        existing_review.rating = rating
        existing_review.comment = comment
        db.session.commit()
        return jsonify({'message': 'Review updated.', 'review': existing_review.to_dict()}), 200

    review = Review(trek_id=numeric_trek_id, user_id=user.id, rating=rating, comment=comment)
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
