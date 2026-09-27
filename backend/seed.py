from extensions import db
from models import User, Trek, Document, Review, Booking, Participant, SosAlert, Notification, GpsLocation

def _run_seed():
    db.create_all()

    # Seed / Update default Admin
    admin = User.query.filter_by(email='admin@trekmate.com').first()
    if not admin:
        admin = User(
            name='TrekMate Admin',
            email='admin@trekmate.com',
            phone='+1 800-555-0199',
            role='admin'
        )
        db.session.add(admin)
    admin.role = 'admin'
    admin.status = 'active'
    admin.set_password('admin123')

    # Seed / Update default Guide
    guide = User.query.filter_by(email='guide@trekmate.com').first()
    if not guide:
        guide = User(
            name='Himalayan Guide Tenzing',
            email='guide@trekmate.com',
            phone='+91 98765-43210',
            role='guide'
        )
        db.session.add(guide)
    guide.role = 'guide'
    guide.status = 'active'
    guide.set_password('guide123')

    # Seed / Update default Trekkers
    trekkers_data = [
      {'name': 'Ananth', 'email': 'ananthrajendran142@gmail.com', 'phone': '+91 98765-43210'},
      {'name': 'Alex Mercer', 'email': 'trekker@trekmate.com', 'phone': '+1 555-0147'},
      {'name': 'Priya Sharma', 'email': 'priya@trekmate.com', 'phone': '+91 98123-45678'},
      {'name': 'Rohan Gupta', 'email': 'rohan@trekmate.com', 'phone': '+91 97654-32109'}
    ]

    seeded_trekkers = []
    for t_info in trekkers_data:
        u = User.query.filter_by(email=t_info['email']).first()
        if not u:
            u = User(name=t_info['name'], email=t_info['email'], phone=t_info['phone'], role='trekker')
            db.session.add(u)
        u.role = 'trekker'
        u.status = 'active'
        u.set_password('trekker123')
        seeded_trekkers.append(u)

    db.session.commit()

    # Seed AI Knowledge Base Documents
    if Document.query.count() == 0:
        docs = [
            Document(
                title="High Altitude Safety & Acclimatization",
                category="safety",
                content="Always acclimatize properly when ascending above 2,500 meters (8,000 ft). Ascend gradually, limit gain to 300-500m per day, drink 4-5 liters of water daily, avoid alcohol, and carry Acetazolamide (Diamox) under medical supervision. If experiencing severe headache, nausea, or dizziness, descend immediately."
            ),
            Document(
                title="Essential Alpine Trekking Gear Checklist",
                category="gear",
                content="Essential equipment includes: Waterproof thermal jacket (Gore-Tex), sturdy ankle-support trekking boots, 40L waterproof backpack with rain cover, thermal base layers, UV400 polaroid sunglasses, headlamp with extra batteries, trekking poles, personal first-aid kit, emergency thermal blanket, and hydration bladders."
            ),
            Document(
                title="Hampta Pass Expedition Guide",
                category="rules",
                content="Hampta Pass is a famous crossover trek in Himachal Pradesh connecting Kullu valley with Lahaul desert valley. Altitude: 14,100 ft. Difficulty: Moderate. Key highlights include jobra forest, Shea Goru riverside camping, and Chandratal lake excursion. Required fitness: Ability to jog 5km in 35 minutes."
            ),
            Document(
                title="Emergency SOS & Mountain Rescue Protocol",
                category="safety",
                content="In case of emergency: 1. Trigger the TrekMate SOS button on the app to transmit live satellite/GPS coordinates. 2. Stay with your group or assigned guide. 3. Signal with whistle (3 sharp blasts) or mirror if visibility allows. 4. Maintain body heat using survival bivvy sack."
            ),
            Document(
                title="TrekMate Application FAQs & Usage",
                category="app",
                content="TrekMate allows trekkers to discover upcoming expeditions, book slots, view live GPS tracking during active treks, receive real-time Open-Meteo weather hazard alerts, communicate via group chat, and trigger emergency SOS assistance."
            )
        ]
        db.session.add_all(docs)

    # Seed Sample Treks if missing
    trek1 = Trek.query.filter_by(name="Hampta Pass & Chandratal Crossover").first()
    if not trek1:
        trek1 = Trek(
            name="Hampta Pass & Chandratal Crossover",
            location="Manali, Himachal Pradesh",
            latitude=32.2432,
            longitude=77.1892,
            difficulty="Moderate",
            duration="5 Days / 4 Nights",
            distance="35 km",
            max_participants=12,
            price=350.0,
            start_date="2026-10-15",
            end_date="2026-10-20",
            meeting_point="Manali Rambagh Bus Stand, 07:00 AM",
            required_equipment="Trekking boots, 40L backpack, thermal layers, rain poncho, headlamp, poles.",
            safety_instructions="Stay with group, follow guide instructions, report altitude discomfort immediately.",
            description="Experience dramatic valley transitions from lush green pine forests of Manali to the breathtaking high-altitude desert of Lahaul and the crystal-clear Chandratal Moon Lake.",
            itinerary="Day 1: Drive Manali to Jobra, trek to Chika (10,100 ft)\nDay 2: Chika to Balu ka Ghera (11,900 ft)\nDay 3: Balu ka Ghera to Hampta Pass (14,100 ft) to Shea Goru (12,900 ft)\nDay 4: Shea Goru to Chatru, drive to Chandratal Lake\nDay 5: Drive Chatru back to Manali.",
            status="published",
            image_url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
            guide_id=guide.id
        )
        db.session.add(trek1)

    trek2 = Trek.query.filter_by(name="Kangchenjunga").first()
    if not trek2:
        trek2 = Trek(
            name="Kangchenjunga",
            location="Sikkim, India",
            latitude=27.7025,
            longitude=88.1475,
            difficulty="Moderate",
            duration="17 Days",
            distance="25 km",
            max_participants=15,
            price=1250.0,
            start_date="2026-11-01",
            end_date="2026-11-17",
            meeting_point="Base Camp",
            required_equipment="Mountaineering boots, crampons, thermal down suit, ice axe, harness.",
            safety_instructions="Acclimatize at base camp, follow rope lead, carry emergency oxygen.",
            description="Iconic expedition trek near the 3rd highest mountain peak in the world, offering views of pristine Himalayan glaciers and sacred alpine lakes.",
            itinerary="Day 1-3: Trek to Yuksom & Goecha La base\nDay 4-10: Ascend through Kanger high valley\nDay 11-17: Descent & return.",
            status="published",
            image_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
            guide_id=guide.id
        )
        db.session.add(trek2)

    db.session.commit()

    # Seed Bookings, Participants, and initial GPS Locations for all sample trekkers
    for t in [trek1, trek2]:
        for idx, u in enumerate(seeded_trekkers):
            b = Booking.query.filter_by(trek_id=t.id, user_id=u.id).first()
            if not b:
                b = Booking(trek_id=t.id, user_id=u.id, num_participants=1, total_price=t.price, booking_status='active', payment_status='paid')
                db.session.add(b)
                db.session.commit()

            p = Participant.query.filter_by(trek_id=t.id, user_id=u.id).first()
            if not p:
                p = Participant(booking_id=b.id, trek_id=t.id, user_id=u.id, check_in_status='checked_in', location_status='active')
                db.session.add(p)

            gps = GpsLocation.query.filter_by(trek_id=t.id, user_id=u.id).first()
            if not gps:
                offset_lat = t.latitude + (idx * 0.0025)
                offset_lng = t.longitude + (idx * 0.0020)
                gps = GpsLocation(
                    trek_id=t.id,
                    user_id=u.id,
                    latitude=round(offset_lat, 4),
                    longitude=round(offset_lng, 4),
                    altitude=3200 + (idx * 40),
                    battery_level=95 - (idx * 5)
                )
                db.session.add(gps)

    db.session.commit()
    print("Database seeded successfully with group participants & GPS telemetry!")

def seed_database():
    from flask import has_app_context
    if has_app_context():
        _run_seed()
    else:
        from app import create_app
        app = create_app()
        with app.app_context():
            _run_seed()

if __name__ == '__main__':
    seed_database()
