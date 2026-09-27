import os
import json

USER_FILE = "/tmp/persistent_users.json"
TREK_FILE = "/tmp/persistent_treks.json"

def load_registered_users():
    if os.path.exists(USER_FILE):
        try:
            with open(USER_FILE, 'r', encoding='utf-8') as f:
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
        parent = os.path.dirname(USER_FILE)
        if parent:
            os.makedirs(parent, exist_ok=True)
        with open(USER_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Local user save error: {e}")

def load_custom_treks():
    if os.path.exists(TREK_FILE):
        try:
            with open(TREK_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception as e:
            print(f"Error loading persistent treks: {e}")
    return []

def save_custom_trek(trek_data):
    treks = load_custom_treks()
    existing = False
    for t in treks:
        if t.get('name') == trek_data.get('name'):
            t.update(trek_data)
            existing = True
            break
    if not existing:
        treks.append(trek_data)

    try:
        parent = os.path.dirname(TREK_FILE)
        if parent:
            os.makedirs(parent, exist_ok=True)
        with open(TREK_FILE, 'w', encoding='utf-8') as f:
            json.dump(treks, f, indent=2)
    except Exception as e:
        print(f"Local trek save error: {e}")
