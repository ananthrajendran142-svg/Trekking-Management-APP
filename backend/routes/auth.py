from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

SEED_ACCOUNTS = {
    'admin@trekmate.com': ('TrekMate Admin', 'admin', 'admin123'),
    'guide@trekmate.com': ('Himalayan Guide Tenzing', 'guide', 'guide123'),
    'trekker@trekmate.com': ('Alex Mercer', 'trekker', 'trekker123'),
    'ananthrajendran142@gmail.com': ('Ananth', 'trekker', 'trekker123'),
    'priya@trekmate.com': ('Priya Sharma', 'trekker', 'trekker123'),
    'rohan@trekmate.com': ('Rohan Gupta', 'trekker', 'trekker123')
}

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

    user = User.query.filter_by(email=email).first()

    # If missing from SQLite DB, check persistent cloud store
    if not user:
        try:
            from persistent_store import load_registered_users
            custom_users = load_registered_users()
            for c_user in custom_users:
                if c_user.get('email', '').strip().lower() == email:
                    user = User(
                        name=c_user.get('name', name),
                        email=email,
                        phone=c_user.get('phone', phone),
                        role=c_user.get('role', role),
                        status='active'
                    )
                    db.session.add(user)
                    db.session.commit()
                    break
        except Exception as e:
            print(f"Restore error in register: {e}")

    if user:
        # User already exists - update credentials and status
        user.name = name
        user.phone = phone
        user.role = role
        user.status = 'active'
        user.set_password(password)
        db.session.commit()
    else:
        # Create brand new user
        user = User(name=name, email=email, phone=phone, role=role, status='active')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

    # Save registered user profile to persistent cloud store for cold-start recovery
    try:
        from persistent_store import save_registered_user
        save_registered_user({
            'id': user.id,
            'name': name,
            'email': email,
            'phone': phone,
            'role': role,
            'password_hash': user.password_hash,
            'password': password
        })
    except Exception as e:
        print(f"Error saving user to persistent store: {e}")

    access_token = create_access_token(identity=user.email)

    return jsonify({
        'message': 'Account registered successfully.',
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

    # 1. If missing from SQLite DB, check default seed accounts
    if not user and email in SEED_ACCOUNTS:
        seed_name, seed_role, seed_pass = SEED_ACCOUNTS[email]
        user = User(name=seed_name, email=email, role=seed_role, status='active')
        user.set_password(seed_pass)
        db.session.add(user)
        db.session.commit()

    # 2. If still missing from SQLite DB, restore from persistent cloud store
    if not user:
        try:
            from persistent_store import load_registered_users
            custom_users = load_registered_users()
            for c_user in custom_users:
                if c_user.get('email', '').strip().lower() == email:
                    user = User(
                        name=c_user.get('name', 'User'),
                        email=email,
                        phone=c_user.get('phone', ''),
                        role=c_user.get('role', 'trekker'),
                        status='active'
                    )
                    if 'password_hash' in c_user:
                        user.password_hash = c_user['password_hash']
                    elif 'password' in c_user:
                        user.set_password(c_user['password'])
                    db.session.add(user)
                    db.session.commit()
                    break
        except Exception as e:
            print(f"Error restoring user during login: {e}")

    # 3. Check password validity
    if not user or not user.check_password(password):
        # Auto-heal default seed accounts if password mismatch
        if email in SEED_ACCOUNTS:
            seed_name, seed_role, seed_pass = SEED_ACCOUNTS[email]
            if password == seed_pass:
                user = User.query.filter_by(email=email).first()
                if not user:
                    user = User(name=seed_name, email=email, role=seed_role, status='active')
                    db.session.add(user)
                user.set_password(seed_pass)
                db.session.commit()
            else:
                return jsonify({'error': 'Invalid email or password. Please try again.'}), 401
        else:
            return jsonify({'error': 'Invalid email or password. Please try again.'}), 401

    if user.status == 'deactivated':
        return jsonify({'error': 'Account deactivated. Please contact support.'}), 403

    access_token = create_access_token(identity=user.email)

    return jsonify({
        'message': 'Login successful.',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    from auth_helper import resolve_current_user
    current_user_raw = get_jwt_identity()
    user = resolve_current_user(current_user_raw)

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({'user': user.to_dict()}), 200

