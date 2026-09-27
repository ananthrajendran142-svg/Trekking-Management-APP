import requests

# Open-Meteo Weather Codes map
WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

def fetch_weather_by_coords(lat, lon):
    if lat is None or lon is None:
        # Default Himalayan coordinates (e.g., Manali / Himachal Pradesh area)
        lat, lon = 32.2432, 77.1892

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            curr = data.get("current_weather", {})
            wcode = curr.get("weathercode", 0)
            condition = WEATHER_CODES.get(wcode, "Clear sky")
            temp = curr.get("temperature", 18.0)
            wind = curr.get("windspeed", 8.5)
            
            # Simple hazard heuristic based on weather code or wind
            hazard = False
            hazard_msg = ""
            if wcode in [65, 75, 82, 95, 96, 99] or wind > 40:
                hazard = True
                hazard_msg = f"Severe condition alert: {condition} with winds up to {wind} km/h. Exercise extreme caution!"
            elif wcode in [61, 63, 71, 73, 80, 81]:
                hazard = False
                hazard_msg = f"Precipitation warning: {condition}. Ensure waterproof gear."

            return {
                "latitude": lat,
                "longitude": lon,
                "temperature": temp,
                "wind_speed": wind,
                "condition": condition,
                "weather_code": wcode,
                "is_hazard": hazard,
                "hazard_message": hazard_msg,
                "source": "Open-Meteo Live API"
            }
    except Exception as e:
        print("Weather API fetch error:", e)

    # Fallback status if offline/failed
    return {
        "latitude": lat,
        "longitude": lon,
        "temperature": 15.0,
        "wind_speed": 10.0,
        "condition": "Partly cloudy",
        "weather_code": 2,
        "is_hazard": False,
        "hazard_message": "Standard trekking conditions.",
        "source": "Cached / Standard Estimate"
    }
