from flask_socketio import emit, join_room, leave_room
from extensions import db, socketio
from models import Message, GpsLocation, SosAlert, User, Trek, Notification

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room')
    user_id = data.get('user_id')
    if room:
        join_room(room)
        emit('room_notice', {'message': f'User {user_id} joined room {room}'}, room=room)

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room')
    user_id = data.get('user_id')
    if room:
        leave_room(room)
        emit('room_notice', {'message': f'User {user_id} left room {room}'}, room=room)

@socketio.on('send_chat')
def handle_send_chat(data):
    try:
        trek_id = int(data.get('trek_id'))
        sender_id = int(data.get('sender_id'))
        content = data.get('content', '').strip()

        if not trek_id or not sender_id or not content:
            return

        user = User.query.get(sender_id)
        if not user:
            return

        msg = Message(trek_id=trek_id, sender_id=sender_id, content=content)
        db.session.add(msg)
        db.session.commit()
        db.session.refresh(msg)

        msg_dict = msg.to_dict()
        room = f"trek_{trek_id}"
        emit('receive_chat', msg_dict, room=room)
    except Exception as e:
        print("Socket send_chat error:", e)

@socketio.on('send_gps')
def handle_send_gps(data):
    trek_id = data.get('trek_id')
    user_id = data.get('user_id')
    lat = data.get('latitude')
    lng = data.get('longitude')
    alt = data.get('altitude', 0.0)
    batt = data.get('battery_level', 100)

    if not trek_id or not user_id or lat is None or lng is None:
        return

    gps = GpsLocation.query.filter_by(trek_id=trek_id, user_id=user_id).first()
    if not gps:
        gps = GpsLocation(trek_id=trek_id, user_id=user_id, latitude=lat, longitude=lng, altitude=alt, battery_level=batt)
        db.session.add(gps)
    else:
        gps.latitude = lat
        gps.longitude = lng
        gps.altitude = alt
        gps.battery_level = batt

    db.session.commit()

    room = f"trek_{trek_id}"
    emit('receive_gps', gps.to_dict(), room=room)

@socketio.on('trigger_sos')
def handle_trigger_sos(data):
    trek_id = data.get('trek_id')
    user_id = data.get('user_id')
    lat = data.get('latitude', 32.2432)
    lng = data.get('longitude', 77.1892)
    msg_text = data.get('message', 'Emergency SOS signal!')

    if not trek_id or not user_id:
        return

    sos = SosAlert(trek_id=trek_id, user_id=user_id, latitude=lat, longitude=lng, message=msg_text, status='active')
    db.session.add(sos)
    db.session.commit()

    room = f"trek_{trek_id}"
    emit('receive_sos', sos.to_dict(), room=room, broadcast=True)
