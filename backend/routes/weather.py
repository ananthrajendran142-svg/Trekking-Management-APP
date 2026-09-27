from flask import Blueprint, jsonify
from models import Trek
from services.weather_service import fetch_weather_by_coords

weather_bp = Blueprint('weather', __name__, url_prefix='/api/weather')

@weather_bp.route('/<int:trek_id>', methods=['GET'])
def get_trek_weather(trek_id):
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404

    lat = trek.latitude or 32.2432
    lon = trek.longitude or 77.1892

    weather_data = fetch_weather_by_coords(lat, lon)
    weather_data['trek_name'] = trek.name
    weather_data['location'] = trek.location

    return jsonify(weather_data), 200
