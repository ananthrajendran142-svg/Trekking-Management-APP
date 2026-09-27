import os
import json
import requests

USER_FILE = "/tmp/persistent_users.json"
TREK_FILE = "/tmp/persistent_treks.json"

CLOUD_USERS_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a0e2b03330242b"
CLOUD_TREKS_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a0e2fe493e24c7"

def load_registered_users():
    try:
        r = requests.get(CLOUD_USERS_URL, timeout=2.5)
        if r.status_code == 200:
            users = r.json().get('data', {}).get('users', [])
            if isinstance(users, list) and users:
                try:
                    with open(USER_FILE, 'w', encoding='utf-8') as f:
                        json.dump(users, f)
                except Exception:
                    pass
                return users
    except Exception as e:
        print(f"Cloud users fetch exception: {e}")

    if os.path.exists(USER_FILE):
        try:
            with open(USER_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception as e:
            print(f"Error loading local users: {e}")
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

    try:
        requests.put(
            CLOUD_USERS_URL,
            json={'name': 'TrekMate Users Cloud Store', 'data': {'users': users}},
            timeout=3
        )
    except Exception as e:
        print(f"Cloud user sync exception: {e}")

def load_custom_treks():
    try:
        r = requests.get(CLOUD_TREKS_URL, timeout=2.5)
        if r.status_code == 200:
            treks = r.json().get('data', {}).get('treks', [])
            if isinstance(treks, list) and treks:
                try:
                    with open(TREK_FILE, 'w', encoding='utf-8') as f:
                        json.dump(treks, f)
                except Exception:
                    pass
                return treks
    except Exception as e:
        print(f"Cloud treks fetch exception: {e}")

    if os.path.exists(TREK_FILE):
        try:
            with open(TREK_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception as e:
            print(f"Error loading local treks: {e}")
    return []

def save_custom_trek(trek_data):
    treks = load_custom_treks()
    existing = False
    req_id = str(trek_data.get('id')) if trek_data.get('id') else None
    req_name = str(trek_data.get('name', '')).strip().lower()

    for t in treks:
        t_id = str(t.get('id')) if t.get('id') else None
        t_name = str(t.get('name', '')).strip().lower()
        if (req_id and t_id == req_id) or (req_name and t_name == req_name):
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

    try:
        requests.put(
            CLOUD_TREKS_URL,
            json={'name': 'TrekMate Treks Cloud Store', 'data': {'treks': treks}},
            timeout=3
        )
    except Exception as e:
        print(f"Cloud trek sync exception: {e}")
