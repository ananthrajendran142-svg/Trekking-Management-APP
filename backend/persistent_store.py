import os
import json

STORE_PATHS = [
    '/tmp/persistent_users.json',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'persistent_users.json')
]

def load_registered_users():
    for path in STORE_PATHS:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
            except Exception as e:
                print(f"Error loading persistent users from {path}: {e}")
    return []

def save_registered_user(user_data):
    users = load_registered_users()
    existing = False
    for u in users:
        if u.get('email') == user_data.get('email'):
            u.update(user_data)
            existing = True
            break
    if not existing:
        users.append(user_data)

    for path in STORE_PATHS:
        try:
            parent = os.path.dirname(path)
            if parent:
                os.makedirs(parent, exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(users, f, indent=2)
        except Exception as e:
            print(f"Could not save persistent users to {path}: {e}")
