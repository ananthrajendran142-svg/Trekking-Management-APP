from extensions import db
from models import User

def resolve_current_user(jwt_identity):
    if not jwt_identity:
        return None
    user = None
    try:
        user_id = int(jwt_identity)
        user = User.query.get(user_id)
    except (ValueError, TypeError):
        pass

    if not user and isinstance(jwt_identity, str):
        user = User.query.filter_by(email=jwt_identity.strip().lower()).first()

    if not user:
        try:
            from persistent_store import load_registered_users
            custom_users = load_registered_users()
            for c_user in custom_users:
                if str(c_user.get('id')) == str(jwt_identity) or c_user.get('email', '').strip().lower() == str(jwt_identity).strip().lower():
                    user = User(
                        id=c_user.get('id') if isinstance(c_user.get('id'), int) and c_user.get('id') < 2000000000 else None,
                        name=c_user.get('name', 'User'),
                        email=c_user['email'],
                        phone=c_user.get('phone', ''),
                        role=c_user.get('role', 'trekker'),
                        status='active'
                    )
                    db.session.add(user)
                    db.session.commit()
                    break
        except Exception as e:
            print(f"User resolution restore exception: {e}")

    if not user:
        user = User.query.first()

    return user
