from extensions import db
from models import User

def resolve_current_user(jwt_identity, payload_email=None, payload_id=None):
    user = None

    # 1. Try resolving by payload email or payload id first if provided
    if payload_email and isinstance(payload_email, str):
        user = User.query.filter_by(email=payload_email.strip().lower()).first()

    if not user and payload_id:
        try:
            user = User.query.get(int(payload_id))
        except (ValueError, TypeError):
            pass

    # 2. Try resolving by jwt_identity if not found yet
    if not user and jwt_identity:
        if isinstance(jwt_identity, str) and '@' in jwt_identity:
            user = User.query.filter_by(email=jwt_identity.strip().lower()).first()

        if not user:
            try:
                user_id = int(jwt_identity)
                user = User.query.get(user_id)
            except (ValueError, TypeError):
                pass

        if not user and isinstance(jwt_identity, str):
            user = User.query.filter_by(email=jwt_identity.strip().lower()).first()

    # 3. Restore user from cloud persistent store if missing from local SQLite
    lookup_keys = []
    if payload_email:
        lookup_keys.append(str(payload_email).strip().lower())
    if payload_id:
        lookup_keys.append(str(payload_id))
    if jwt_identity:
        lookup_keys.append(str(jwt_identity).strip().lower())

    if not user and lookup_keys:
        try:
            from persistent_store import load_registered_users
            custom_users = load_registered_users()
            for c_user in custom_users:
                c_email = str(c_user.get('email', '')).strip().lower()
                c_id = str(c_user.get('id', ''))
                if (c_email and c_email in lookup_keys) or (c_id and c_id in lookup_keys):
                    u_existing = User.query.filter_by(email=c_user['email'].strip().lower()).first()
                    if not u_existing:
                        u_existing = User(
                            name=c_user.get('name', 'User'),
                            email=c_user['email'].strip().lower(),
                            phone=c_user.get('phone', ''),
                            role=c_user.get('role', 'trekker'),
                            status='active'
                        )
                        if 'password_hash' in c_user:
                            u_existing.password_hash = c_user['password_hash']
                        elif 'password' in c_user:
                            u_existing.set_password(c_user['password'])
                        db.session.add(u_existing)
                        db.session.commit()
                    user = u_existing
                    break
        except Exception as e:
            print(f"User resolution restore exception: {e}")

    return user

