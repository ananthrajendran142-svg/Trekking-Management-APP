import os
import json

LOCAL_FILE = "/tmp/persistent_users.json"

def load_registered_users():
    if os.path.exists(LOCAL_FILE):
        try:
            with open(LOCAL_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception as e:
            print(f"Error loading persistent users: {e}")
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

    try:
        parent = os.path.dirname(LOCAL_FILE)
        if parent:
            os.makedirs(parent, exist_ok=True)
        with open(LOCAL_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Local save error: {e}")
