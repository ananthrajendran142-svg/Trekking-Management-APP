import os
from datetime import timedelta

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, 'trekmate.db')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'trekmate-super-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-trekmate-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
