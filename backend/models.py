from datetime import datetime
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(20), nullable=False, default='trekker') # trekker, guide, admin
    profile_photo = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='active') # active, deactivated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    treks_guided = db.relationship('Trek', backref='guide', lazy=True, foreign_keys='Trek.guide_id')
    bookings = db.relationship('Booking', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    sos_alerts = db.relationship('SosAlert', backref='user', lazy=True)
    messages = db.relationship('Message', backref='sender', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'status': self.status,
            'profile_photo': self.profile_photo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Trek(db.Model):
    __tablename__ = 'treks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    difficulty = db.Column(db.String(50), nullable=False) # Easy, Moderate, Challenging, Strenuous
    duration = db.Column(db.String(50), nullable=False) # e.g. "3 Days / 2 Nights"
    distance = db.Column(db.String(50), nullable=False) # e.g. "25 km"
    max_participants = db.Column(db.Integer, nullable=False, default=15)
    price = db.Column(db.Float, nullable=False, default=0.0)
    start_date = db.Column(db.String(50), nullable=True)
    end_date = db.Column(db.String(50), nullable=True)
    meeting_point = db.Column(db.String(255), nullable=True)
    required_equipment = db.Column(db.Text, nullable=True)
    safety_instructions = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=False)
    itinerary = db.Column(db.Text, nullable=True) # JSON or text breakdown
    status = db.Column(db.String(20), nullable=False, default='draft') # draft, published, active, completed, cancelled
    image_url = db.Column(db.String(255), nullable=True)
    guide_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings = db.relationship('Booking', backref='trek', lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship('Review', backref='trek', lazy=True, cascade="all, delete-orphan")
    sos_alerts = db.relationship('SosAlert', backref='trek', lazy=True, cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='trek', lazy=True, cascade="all, delete-orphan")
    gps_locations = db.relationship('GpsLocation', backref='trek', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        booked_count = sum(b.num_participants for b in self.bookings if b.booking_status != 'cancelled')
        avg_rating = 0.0
        if self.reviews:
            avg_rating = round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)

        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'difficulty': self.difficulty,
            'duration': self.duration,
            'distance': self.distance,
            'max_participants': self.max_participants,
            'available_slots': max(0, self.max_participants - booked_count),
            'booked_count': booked_count,
            'price': self.price,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'meeting_point': self.meeting_point,
            'required_equipment': self.required_equipment,
            'safety_instructions': self.safety_instructions,
            'description': self.description,
            'itinerary': self.itinerary,
            'status': self.status,
            'image_url': self.image_url,
            'guide_id': self.guide_id,
            'guide_name': self.guide.name if self.guide else 'Unassigned',
            'guide_phone': self.guide.phone if self.guide else None,
            'guide_email': self.guide.email if self.guide else None,
            'rating': avg_rating,
            'review_count': len(self.reviews),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    num_participants = db.Column(db.Integer, nullable=False, default=1)
    total_price = db.Column(db.Float, nullable=False)
    booking_status = db.Column(db.String(20), nullable=False, default='upcoming') # upcoming, active, completed, cancelled
    payment_status = db.Column(db.String(20), nullable=False, default='pending') # pending, paid, refunded
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    participants = db.relationship('Participant', backref='booking', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'trek_id': self.trek_id,
            'trek_name': self.trek.name if self.trek else '',
            'trek_location': self.trek.location if self.trek else '',
            'start_date': self.trek.start_date if self.trek else '',
            'end_date': self.trek.end_date if self.trek else '',
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else '',
            'user_email': self.user.email if self.user else '',
            'user_phone': self.user.phone if self.user else '',
            'num_participants': self.num_participants,
            'total_price': self.total_price,
            'booking_status': self.booking_status,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Participant(db.Model):
    __tablename__ = 'participants'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    check_in_status = db.Column(db.String(20), nullable=False, default='pending') # pending, checked_in, absent
    location_status = db.Column(db.String(20), nullable=False, default='unknown') # active, idle, safe, help_needed, offline
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        user = User.query.get(self.user_id)
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'trek_id': self.trek_id,
            'user_id': self.user_id,
            'user_name': user.name if user else '',
            'user_email': user.email if user else '',
            'user_phone': user.phone if user else '',
            'check_in_status': self.check_in_status,
            'location_status': self.location_status,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class GpsLocation(db.Model):
    __tablename__ = 'gps_locations'
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    altitude = db.Column(db.Float, nullable=True, default=0.0)
    battery_level = db.Column(db.Integer, nullable=True, default=100)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        user = User.query.get(self.user_id)
        return {
            'id': self.id,
            'trek_id': self.trek_id,
            'user_id': self.user_id,
            'user_name': user.name if user else '',
            'role': user.role if user else 'trekker',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude': self.altitude,
            'battery_level': self.battery_level,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class SosAlert(db.Model):
    __tablename__ = 'sos_alerts'
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, nullable=True, default='Emergency assistance requested!')
    status = db.Column(db.String(20), nullable=False, default='active') # active, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'trek_id': self.trek_id,
            'trek_name': self.trek.name if self.trek else '',
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else '',
            'user_phone': self.user.phone if self.user else '',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class WeatherAlert(db.Model):
    __tablename__ = 'weather_alerts'
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    condition = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False, default='warning') # info, warning, severe
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trek_id': self.trek_id,
            'condition': self.condition,
            'severity': self.severity,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trek_id': self.trek_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else 'User',
            'sender_role': self.sender.role if self.sender else 'trekker',
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='system') # booking, weather, sos, trek, announcement, system
    read_status = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'read_status': self.read_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trek_id': self.trek_id,
            'trek_name': self.trek.name if self.trek else '',
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Anonymous',
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Document(db.Model):
    __tablename__ = 'documents'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False, default='general') # safety, gear, rules, weather, app
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
