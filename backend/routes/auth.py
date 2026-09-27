from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    phone = data.get('phone', '').strip()
    role = data.get('role', 'trekker').strip().lower()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if role not in ['trekker', 'guide', 'admin']:
        return jsonify({'error': 'Invalid role specified.'}), 400

    if confirm_password and password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'User with this email already exists.'}), 400

    user = User(name=name, email=email, phone=phone, role=role)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Save registered user profile to persistent store for serverless cold-start recovery
    try:
        from persistent_store import save_registered_user
        save_registered_user({
            'name': name,
            'email': email,
            'phone': phone,
            'role': role,
            'password_hash': user.password_hash
        })
    except Exception as e:
        print(f"Error saving to persistent store: {e}")

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Account created successfully.',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    if user.status == 'deactivated':
        return jsonify({'error': 'Account deactivated. Please contact support.'}), 403

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful.',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id_raw = get_jwt_identity()
    user = None

    try:
        current_user_id = int(current_user_id_raw)
        user = User.query.get(current_user_id)
    except (ValueError, TypeError):
        pass

    if not user and isinstance(current_user_id_raw, str):
        user = User.query.filter_by(email=current_user_id_raw).first()

    # Restore user profile from persistent store if new deployment wiped /tmp SQLite
    if not user:
        try:
            from persistent_store import load_registered_users
            custom_users = load_registered_users()
            for c_user in custom_users:
                if str(c_user.get('id')) == str(current_user_id_raw) or c_user.get('email') == str(current_user_id_raw):
                    user = User(
                        name=c_user.get('name', 'User'),
                        email=c_user.get('email', 'user@example.com'),
                        phone=c_user.get('phone', ''),
                        role=c_user.get('role', 'trekker'),
                        status='active'
                    )
                    db.session.add(user)
                    db.session.commit()
                    break
        except Exception as e:
            print(f"Error restoring user in /me: {e}")

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({'user': user.to_dict()}), 200
