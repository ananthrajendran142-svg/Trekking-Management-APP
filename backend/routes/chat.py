from flask import Blueprint, jsonify, request
from extensions import db, socketio
from models import Message, Trek
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth_helper import resolve_current_user

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('/<int:trek_id>/history', methods=['GET'])
@jwt_required()
def get_chat_history(trek_id):
    messages = Message.query.filter_by(trek_id=trek_id).order_by(Message.id.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200

@chat_bp.route('/<int:trek_id>/send', methods=['POST'])
@jwt_required()
def send_chat_message(trek_id):
    jwt_ident = get_jwt_identity()
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    payload_email = data.get('sender_email')
    payload_id = data.get('sender_id')

    if not content:
        return jsonify({'error': 'Message content cannot be empty.'}), 400

    user = resolve_current_user(jwt_ident, payload_email=payload_email, payload_id=payload_id)

    if not user:
        return jsonify({'error': 'User not found or unauthenticated.'}), 401

    msg = Message(trek_id=trek_id, sender_id=user.id, content=content)
    db.session.add(msg)
    db.session.commit()
    db.session.refresh(msg)

    msg_dict = msg.to_dict()
    try:
        room = f"trek_{trek_id}"
        socketio.emit('receive_chat', msg_dict, room=room)
    except Exception:
        pass

    return jsonify(msg_dict), 201

