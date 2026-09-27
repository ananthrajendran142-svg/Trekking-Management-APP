from flask import Blueprint, jsonify, request
from services.rag_service import query_rag_assistant
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/query', methods=['POST'])
def ai_query():
    # Allow optional token identification
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        pass

    data = request.get_json() or {}
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'error': 'Please provide a prompt or question.'}), 400

    result = query_rag_assistant(query, user_id)
    return jsonify(result), 200
