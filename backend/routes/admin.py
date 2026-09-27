from flask import Blueprint, jsonify, request
from extensions import db
from models import User, Trek, Booking, SosAlert, Review, Document, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role == 'admin'

@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privileges required.'}), 403

    total_users = User.query.count()
    total_trekkers = User.query.filter_by(role='trekker').count()
    total_guides = User.query.filter_by(role='guide').count()
    total_admins = User.query.filter_by(role='admin').count()
    
    total_treks = Trek.query.count()
    active_treks = Trek.query.filter_by(status='active').count()
    published_treks = Trek.query.filter_by(status='published').count()
    completed_treks = Trek.query.filter_by(status='completed').count()
    draft_treks = Trek.query.filter_by(status='draft').count()

    total_bookings = Booking.query.count()
    upcoming_bookings = Booking.query.filter_by(booking_status='upcoming').count()
    completed_bookings = Booking.query.filter_by(booking_status='completed').count()
    cancelled_bookings = Booking.query.filter_by(booking_status='cancelled').count()
    
    total_revenue = sum(b.total_price for b in Booking.query.filter(Booking.booking_status != 'cancelled').all())

    total_sos = SosAlert.query.count()
    active_sos = SosAlert.query.filter_by(status='active').count()
    resolved_sos = SosAlert.query.filter_by(status='resolved').count()

    total_reviews = Review.query.count()
    avg_rating = 0.0
    if total_reviews > 0:
        avg_rating = round(sum(r.rating for r in Review.query.all()) / total_reviews, 1)

    return jsonify({
        'users': {
            'total': total_users,
            'trekkers': total_trekkers,
            'guides': total_guides,
            'admins': total_admins
        },
        'treks': {
            'total': total_treks,
            'active': active_treks,
            'published': published_treks,
            'completed': completed_treks,
            'draft': draft_treks
        },
        'bookings': {
            'total': total_bookings,
            'upcoming': upcoming_bookings,
            'completed': completed_bookings,
            'cancelled': cancelled_bookings,
            'total_revenue': round(total_revenue, 2)
        },
        'sos': {
            'total': total_sos,
            'active': active_sos,
            'resolved': resolved_sos
        },
        'reviews': {
            'total': total_reviews,
            'average_rating': avg_rating
        }
    }), 200

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privileges required.'}), 403

    role = request.args.get('role', '').strip().lower()
    search = request.args.get('search', '').strip().lower()

    query = User.query
    if role:
        query = query.filter_by(role=role)
    if search:
        query = query.filter(
            (User.name.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%')) |
            (User.phone.ilike(f'%{search}%'))
        )

    users = query.order_by(User.id.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privileges required.'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status in ['active', 'deactivated']:
        user.status = new_status
        db.session.commit()
        return jsonify({'message': f'User status changed to {new_status}.', 'user': user.to_dict()}), 200
    
    return jsonify({'error': 'Invalid status.'}), 400

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privileges required.'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}
    new_role = data.get('role')
    if new_role in ['trekker', 'guide', 'admin']:
        user.role = new_role
        db.session.commit()
        return jsonify({'message': f'User role changed to {new_role}.', 'user': user.to_dict()}), 200

    return jsonify({'error': 'Invalid role.'}), 400
