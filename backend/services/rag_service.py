import re
from models import Document, Trek
from persistent_store import load_custom_treks

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

def get_all_active_treks():
    treks_db = Trek.query.filter(Trek.status.in_(['published', 'active'])).all()
    treks_list = [t.to_dict() for t in treks_db]
    db_names = {t['name'].lower() for t in treks_list}

    # Also include custom treks from persistent cloud store
    try:
        custom_treks = load_custom_treks()
        for c_t in custom_treks:
            c_name = c_t.get('name', '')
            if c_name and c_name.lower() not in db_names:
                treks_list.append({
                    'id': c_t.get('id', 999),
                    'name': c_name,
                    'location': c_t.get('location', 'High Altitude Region'),
                    'difficulty': c_t.get('difficulty', 'Moderate'),
                    'duration': c_t.get('duration', '3 Days'),
                    'distance': c_t.get('distance', '20 km'),
                    'price': c_t.get('price', 250.0),
                    'available_slots': c_t.get('available_slots', c_t.get('max_participants', 15)),
                    'max_participants': c_t.get('max_participants', 15),
                    'meeting_point': c_t.get('meeting_point', 'Base Camp'),
                    'guide_name': c_t.get('guide_name', 'Himalayan Guide'),
                    'description': c_t.get('description', ''),
                    'itinerary': c_t.get('itinerary', ''),
                    'required_equipment': c_t.get('required_equipment', ''),
                    'safety_instructions': c_t.get('safety_instructions', '')
                })
    except Exception as e:
        print("RAG custom trek load notice:", e)

    return treks_list

def query_rag_assistant(query, user_id=None):
    if not query or not query.strip():
        query = "show available treks"

    q_lower = query.strip().lower()

    treks = get_all_active_treks()
    documents = Document.query.all()

    # INTENT 0: GREETINGS & INTRO
    greetings = ['hi', 'hello', 'hey', 'greetings', 'who are you', 'help', 'start']
    if any(q_lower == g for g in greetings) or q_lower.startswith('hi ') or q_lower.startswith('hello '):
        answer = "### 👋 Welcome to TrekMate AI Assistant!\n\n"
        answer += "I am your high-altitude trekking guide and expedition assistant. How can I help you today?\n\n"
        if treks:
            answer += f"#### 🏕️ Available Expeditions ({len(treks)})\n"
            for t in treks:
                answer += f"• **{t['name']}** ({t['location']}) — {t['difficulty']} | ${t['price']}\n"
        answer += "\n💡 *You can ask me about available treks, difficulty levels, required gear, safety protocols, or pricing details!*"
        return {
            "answer": answer,
            "sources": [],
            "confidence": 1.0
        }

    # INTENT 1: LIST / EXPLORE / FIND ALL TREKS
    list_keywords = [
        'available', 'list', 'show', 'all treks', 'what treks', 'which treks', 'bookable',
        'treks available', 'options', 'catalog', 'find treks', 'trek', 'treks', 'explore',
        'difficulty', 'price', 'cost', 'cheap', 'beginner', 'easy', 'moderate'
    ]
    if any(k in q_lower for k in list_keywords):
        if treks:
            answer = f"### 🏕️ Currently Available Expeditions ({len(treks)})\n\n"
            sources = []
            for idx, td in enumerate(treks, 1):
                price_str = f"${int(td['price'])}" if float(td['price']).is_integer() else f"${td['price']}"
                answer += f"#### {idx}. {td['name']}\n"
                answer += f"• **Location**: {td['location']}\n"
                answer += f"• **Difficulty**: {td['difficulty']}\n"
                answer += f"• **Duration**: {td['duration']} • **Distance**: {td['distance']}\n"
                answer += f"• **Price**: {price_str} per trekker\n"
                answer += f"• **Slots Available**: {td['available_slots']} / {td['max_participants']} slots\n"
                answer += f"• **Meeting Point**: {td['meeting_point'] or 'Base village'}\n"
                answer += f"• **Assigned Guide**: {td['guide_name']}\n\n"
                if idx < len(treks):
                    answer += "---\n\n"

                sources.append({
                    "title": f"Expedition: {td['name']}",
                    "category": "available_trek",
                    "content": f"{td['name']} in {td['location']}, Difficulty: {td['difficulty']}, Price: ${td['price']}, Slots Left: {td['available_slots']}",
                    "score": 1.0
                })
            answer += "\n👉 Click on **Explore Treks** in the navigation bar to view full details and book your slots!"
            return {
                "answer": answer,
                "sources": sources,
                "confidence": 1.0
            }

    # INTENT 2: MATCH SPECIFIC TREK BY NAME OR LOCATION OR KEYWORDS
    matched_trek = None
    for td in treks:
        t_name = td['name'].lower()
        t_loc = td['location'].lower()
        if t_name in q_lower or any(word in q_lower for word in t_name.split() if len(word) > 2):
            matched_trek = td
            break
        if t_loc in q_lower or any(word in q_lower for word in t_loc.split() if len(word) > 2):
            matched_trek = td
            break

    if matched_trek:
        td = matched_trek
        price_str = f"${int(td['price'])}" if float(td['price']).is_integer() else f"${td['price']}"
        answer = f"### 🏔️ Trek Details: {td['name']}\n\n"
        answer += f"• **Location**: {td['location']}\n"
        answer += f"• **Difficulty**: {td['difficulty']}\n"
        answer += f"• **Duration**: {td['duration']} • **Distance**: {td['distance']}\n"
        answer += f"• **Price**: {price_str} per participant\n"
        answer += f"• **Availability**: {td['available_slots']} slots remaining out of {td['max_participants']}\n"
        answer += f"• **Assigned Guide**: {td['guide_name']}\n"
        answer += f"• **Meeting Point**: {td['meeting_point'] or 'Base village'}\n\n"
        
        if td.get('description'):
            answer += f"#### 📋 Description\n{td['description']}\n\n"
        if td.get('itinerary'):
            answer += f"#### 🗺️ Itinerary\n{td['itinerary']}\n\n"
        if td.get('required_equipment'):
            answer += f"#### 🎒 Required Gear\n{td['required_equipment']}\n\n"
        if td.get('safety_instructions'):
            answer += f"#### ⚠️ Safety Protocol\n{td['safety_instructions']}\n"

        return {
            "answer": answer.strip(),
            "sources": [{
                "title": f"Trek Guide: {td['name']}",
                "category": "trek_details",
                "content": td['description'][:300] if td.get('description') else '',
                "score": 0.95
            }],
            "confidence": 0.95
        }

    # INTENT 3: GENERAL / SAFETY / KNOWLEDGE BASE
    answer = f"### 🏕️ TrekMate Expedition & Safety Knowledge Base\n\n"
    if treks:
        answer += f"#### Available Expeditions ({len(treks)})\n"
        for t in treks:
            answer += f"• **{t['name']}** ({t['location']}) — {t['difficulty']} difficulty | ${t['price']}\n"
        answer += "\n---\n\n"

    answer += "#### 🏔️ High-Altitude Safety Guidelines\n"
    answer += "• **Acclimatization**: Ascend gradually, limit height gain to 300-500m daily above 2,500m.\n"
    answer += "• **Hydration**: Drink 4-5 liters of water daily; avoid alcohol and sedatives.\n"
    answer += "• **Essential Gear**: Carry thermal base layers, Gore-Tex waterproof jacket, ankle-support boots, headlamp, and thermal blanket.\n"
    answer += "• **Live Tracking & SOS**: Use the TrekMate Live Tracking feature during your trek to broadcast real-time GPS telemetry to your expedition guide.\n"

    return {
        "answer": answer.strip(),
        "sources": [],
        "confidence": 0.8
    }

