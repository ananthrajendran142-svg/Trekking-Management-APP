import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, jwt, socketio

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*")

    # Import and register Blueprints
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.treks import treks_bp
    from routes.bookings import bookings_bp
    from routes.tracking import tracking_bp
    from routes.sos import sos_bp
    from routes.weather import weather_bp
    from routes.chat import chat_bp
    from routes.notifications import notifications_bp
    from routes.reviews import reviews_bp
    from routes.ai import ai_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(treks_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(tracking_bp)
    app.register_blueprint(sos_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(admin_bp)

    # Register Socket events
    import sockets

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'online',
            'app': 'TrekMate Management API',
            'version': '1.0.0'
        }), 200

    # Auto-create tables on launch and seed if fresh
    with app.app_context():
        db.create_all()
        try:
            from models import User
            if not User.query.filter_by(email='admin@trekmate.com').first():
                from seed import seed_database
                seed_database()
        except Exception as e:
            print(f"Auto-seed warning: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        from seed import seed_database
        seed_database()

    print("Starting TrekMate Backend Server on port 5000...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

