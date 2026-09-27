import re
from models import Document, Trek

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

def query_rag_assistant(query, user_id=None):
    if not query or not query.strip():
        return {
            "answer": "Please ask a specific trekking, safety, equipment, or route question.",
            "sources": [],
            "confidence": 0.0
        }

    q_lower = query.strip().lower()

    # Fetch active & published treks from DB
    treks = Trek.query.filter(Trek.status.in_(['published', 'active'])).all()
    documents = Document.query.all()

    # INTENT 1: LIST ALL AVAILABLE TREKS
    list_keywords = ['available', 'list', 'show', 'all treks', 'what treks', 'which treks', 'bookable', 'treks available', 'options', 'catalog', 'find treks']
    if any(k in q_lower for k in list_keywords) or q_lower.strip() == 'treks':
        if treks:
            answer = f"### 🏕️ Currently Available Expeditions ({len(treks)})\n\n"
            sources = []
            for idx, t in enumerate(treks, 1):
                td = t.to_dict()
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
            answer += "\n👉 You can click on **Explore Treks** in the navigation bar to view full itineraries and register your slots!"
            return {
                "answer": answer,
                "sources": sources,
                "confidence": 1.0
            }
        else:
            return {
                "answer": "Currently, there are no active or published treks registered in the TrekMate database. Expedition guides or administrators can publish new treks from their dashboard.",
                "sources": [],
                "confidence": 0.9
            }

    # INTENT 2: SPECIFIC TREK QUERY BY NAME OR LOCATION
    matched_trek = None
    for t in treks:
        if t.name.lower() in q_lower or any(word in q_lower for word in t.name.lower().split() if len(word) > 3):
            matched_trek = t
            break
        if t.location.lower() in q_lower or any(word in q_lower for word in t.location.lower().split() if len(word) > 3):
            matched_trek = t
            break

    if matched_trek:
        td = matched_trek.to_dict()
        price_str = f"${int(td['price'])}" if float(td['price']).is_integer() else f"${td['price']}"
        answer = f"### 🏔️ Trek Overview: {td['name']}\n\n"
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

    # INTENT 3: GENERAL / SAFETY / RAG DOCUMENT RETRIEVAL
    corpus_texts = []
    corpus_meta = []

    for doc in documents:
        corpus_texts.append(f"{doc.title}\n{doc.content}")
        corpus_meta.append({
            "id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "content": doc.content,
            "type": "document"
        })

    for trek in treks:
        t_text = f"Trek Name: {trek.name}. Location: {trek.location}. Difficulty: {trek.difficulty}. Duration: {trek.duration}. Distance: {trek.distance}. Required Equipment: {trek.required_equipment}. Safety Instructions: {trek.safety_instructions}. Itinerary: {trek.itinerary}. Description: {trek.description}"
        corpus_texts.append(t_text)
        corpus_meta.append({
            "id": trek.id,
            "title": f"Trek Guide: {trek.name}",
            "category": "trek_guide",
            "content": t_text,
            "type": "trek"
        })

    matched_sources = []
    top_score = 0.0

    if SKLEARN_AVAILABLE and corpus_texts:
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            all_texts = corpus_texts + [query]
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            
            query_vec = tfidf_matrix[-1]
            doc_vecs = tfidf_matrix[:-1]
            
            similarities = cosine_similarity(query_vec, doc_vecs).flatten()
            top_indices = similarities.argsort()[::-1]
            
            for idx in top_indices:
                score = float(similarities[idx])
                if score > 0.03 and len(matched_sources) < 3:
                    meta = corpus_meta[idx]
                    matched_sources.append({
                        "title": meta["title"],
                        "category": meta["category"],
                        "content": meta["content"],
                        "score": round(score, 3)
                    })
                    if score > top_score:
                        top_score = score
        except Exception as e:
            print("TFIDF RAG Error:", e)

    # Fallback keyword matching
    if not matched_sources and corpus_texts:
        words = [w.lower() for w in re.findall(r'\w+', query) if len(w) > 2]
        scored_docs = []
        for i, text in enumerate(corpus_texts):
            score = sum(1 for w in words if w in text.lower())
            if score > 0:
                scored_docs.append((score, corpus_meta[i]))
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        for score, meta in scored_docs[:3]:
            matched_sources.append({
                "title": meta["title"],
                "category": meta["category"],
                "content": meta["content"],
                "score": round(score / max(len(words), 1), 3)
            })
            if top_score == 0:
                top_score = 0.5

    if matched_sources:
        answer = f"### 📚 TrekMate Knowledge Base Results\n\n"
        for s in matched_sources:
            answer += f"#### • {s['title']}\n{s['content']}\n\n"

        answer += "---\n💡 *Tip*: You can ask about available treks, difficulty levels, required gear, weather hazards, or emergency rescue procedures!"
        
        return {
            "answer": answer.strip(),
            "sources": matched_sources,
            "confidence": round(top_score, 2)
        }
    else:
        # Fallback informative trekking advice
        answer = f"### Regarding '{query}'\n\n"
        answer += "• **Expeditions & Bookings**: Browse upcoming treks under 'Explore Treks' and book slots directly.\n"
        answer += "• **High-Altitude Safety**: Always allow adequate acclimatization time above 2,500m, stay hydrated, and carry thermal layers.\n"
        answer += "• **Live Tracking & SOS**: During active treks, use the Live Tracking page to broadcast satellite GPS telemetry and trigger emergency SOS assistance if needed.\n"
        answer += "\n💡 *Tip*: Try asking 'what treks are available' or ask about specific gear checklists!"
        
        return {
            "answer": answer,
            "sources": [],
            "confidence": 0.5
        }
