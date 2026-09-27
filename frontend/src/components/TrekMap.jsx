import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function TrekMap({ lat = 32.2432, lng = 77.1892, zoom = 11, markers = [], height = "350px" }) {
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : (parseFloat(lat) || 32.2432);
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : (parseFloat(lng) || 77.1892);
  const center = [safeLat, safeLng];

  const validMarkers = (markers || []).filter(
    m => m && !isNaN(parseFloat(m.lat)) && !isNaN(parseFloat(m.lng))
  );

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 relative z-10">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Main Base Marker */}
        <Marker position={center} icon={goldIcon}>
          <Popup>
            <div className="font-sans text-xs">
              <strong className="block text-navy-900 text-sm mb-1">Trek Base Coordinates</strong>
              <span>({safeLat.toFixed(4)}, {safeLng.toFixed(4)})</span>
            </div>
          </Popup>
        </Marker>

        {/* Dynamic Markers */}
        {validMarkers.map((m, idx) => (
          <Marker
            key={idx}
            position={[parseFloat(m.lat), parseFloat(m.lng)]}
            icon={m.isSos ? redIcon : blueIcon}
          >
            <Popup>
              <div className="font-sans text-xs space-y-1">
                <strong className="block text-navy-900">{m.title || 'Participant'}</strong>
                {m.subtitle && <p className="text-slate-600">{m.subtitle}</p>}
                {m.isSos && <p className="text-red-600 font-bold">🚨 ACTIVE SOS DISTRESS</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
