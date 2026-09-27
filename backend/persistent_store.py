import os
import json
import requests

CLOUD_STORE_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a0e2b03330242b"
LOCAL_FILE = "/tmp/persistent_users.json"

def load_registered_users():
    # 1. Try loading from Cloud Store for serverless instance synchronization
    try:
        r = requests.get(CLOUD_STORE_URL, timeout=4)
        if r.status_code == 200:
            data = r.json()
            users = data.get('data', {}).get('users', [])
            if isinstance(users, list):
                try:
                    with open(LOCAL_FILE, 'w', encoding='utf-8') as f:
                        json.dump(users, f)
                except Exception:
                    pass
                return users
    except Exception as e:
        print(f"Cloud store fetch exception: {e}")

    # 2. Fallback to local file
    if os.path.exists(LOCAL_FILE):
        try:
            with open(LOCAL_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass

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

    # 1. Save to local file
    try:
        with open(LOCAL_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Local save error: {e}")

    # 2. Sync to Cloud Store so all Vercel Lambdas share the user registration
    try:
        requests.put(
            CLOUD_STORE_URL,
            json={'name': 'TrekMate Users Cloud Store', 'data': {'users': users}},
            timeout=5
        )
    except Exception as e:
        print(f"Cloud store sync exception: {e}")
