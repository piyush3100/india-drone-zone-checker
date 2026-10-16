import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Crosshair, Plane, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, LocateFixed, Info, Navigation, SlidersHorizontal } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune
const demoFeatures = [
  { id: 'demo-airport-pune', name: 'Pune Airport (demo marker)', category: 'airport', lat: 18.5822, lon: 73.9197, note: 'Illustrative airport marker only. Verify actual controlled airspace and applicable rules.' },
  { id: 'demo-zone-1', name: 'Illustrative restricted area A', category: 'restricted', lat: 18.531, lon: 73.846, radiusM: 650, note: 'Synthetic example geometry. Not an official restriction.' },
  { id: 'demo-zone-2', name: 'Illustrative caution area B', category: 'caution', lat: 18.505, lon: 73.875, radiusM: 420, note: 'Synthetic example geometry. Not an official restriction.' },
  { id: 'demo-zone-3', name: 'Illustrative restricted area C', category: 'restricted', lat: 18.548, lon: 73.895, radiusM: 500, note: 'Synthetic example geometry. Not an official restriction.' }
];

function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 13, { duration: 0.8 }); }, [center, map]);
  return null;
}
function pinIcon(color) {
  return L.divIcon({
    className: 'custom-pin-wrap',
    html: `<span class="custom-pin" style="--pin-color:${color}"></span>`,
    iconSize: [18,18], iconAnchor: [9,9]
  });
}
const fmt = n => Number(n).toFixed(5);

function App() {
  const [mode, setMode] = useState('city');
  const [city, setCity] = useState('Pune');
  const [country, setCountry] = useState('India');
  const [lat, setLat] = useState('18.5204');
  const [lon, setLon] = useState('73.8567');
  const [radius, setRadius] = useState(2);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [locationLabel, setLocationLabel] = useState('Pune, India');
  const [features, setFeatures] = useState(demoFeatures);
  const [status, setStatus] = useState('demo');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);

  const nearby = useMemo(() => features.map(f => ({
    ...f, distance: distanceKm(center[0], center[1], f.lat, f.lon)
  })).filter(f => f.distance <= radius).sort((a,b) => a.distance - b.distance), [features, center, radius]);

  async function citySearch(e) {
    e?.preventDefault();
    setError(''); setBusy(true);
    try {
      const q = `${city.trim()}, ${country.trim()}`;
      if (!city.trim() || !country.trim()) throw new Error('Enter both a city and country.');
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) throw new Error('Geocoding service is unavailable. Try coordinates instead.');
      const data = await res.json();
      if (!data.length) throw new Error('Could not find that location. Check the city and country.');
      const next = [Number(data[0].lat), Number(data[0].lon)];
      setCenter(next); setLat(String(next[0])); setLon(String(next[1]));
      setLocationLabel(data[0].display_name || q);
      setStatus('demo'); setSelected(null);
    } catch (err) { setError(err.message || 'Search failed.'); }
    finally { setBusy(false); }
  }
  function coordinateSearch(e) {
    e?.preventDefault(); setError('');
    const la = Number(lat), lo = Number(lon);
    if (!lat.trim() || !lon.trim() || !Number.isFinite(la) || la < -90 || la > 90) return setError('Latitude must be a number between -90 and 90.');
    if (!lon.trim() || !Number.isFinite(lo) || lo < -180 || lo > 180) return setError('Longitude must be a number between -180 and 180.');
    setCenter([la, lo]); setLocationLabel(`${fmt(la)}, ${fmt(lo)}`); setStatus('demo'); setSelected(null);
  }
  function useBrowserLocation() {
    setError('');
    if (!navigator.geolocation) return setError('This browser does not support location access.');
    navigator.geolocation.getCurrentPosition(pos => {
      const la = pos.coords.latitude, lo = pos.coords.longitude;
      setLat(String(la)); setLon(String(lo)); setCenter([la,lo]);
      setLocationLabel(`Current location (${fmt(la)}, ${fmt(lo)})`); setMode('advanced'); setStatus('demo');
    }, () => setError('Could not access location. Allow location permission or enter coordinates manually.'), { enableHighAccuracy: true, timeout: 10000 });
  }
  const categoryLabel = c => c === 'restricted' ? 'Demo restricted zone' : c === 'airport' ? 'Airport marker' : 'Demo caution zone';
  const colorFor = c => c === 'restricted' ? '#dc4545' : c === 'airport' ? '#dc8a20' : '#d6a52d';

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark"><Plane size={23}/></div>
      <div><div className="brand-title">Drone Zone Checker</div><div className="brand-subtitle">India · Airspace discovery prototype</div></div>
      <div className="top-pill"><span className="live-dot"/> DEMO DATA</div>
    </header>

    <main>
      <section className="intro">
        <div><p className="eyebrow">DRONE AIRSPACE EXPLORER</p><h1>Know the airspace before you fly.</h1><p className="intro-copy">Search by city or pinpoint a location to inspect nearby example zones.</p></div>
        <div className="disclaimer"><AlertTriangle size={18}/><span><b>Prototype only.</b> This app does not contain live or official DigitalSky restrictions.</span></div>
      </section>

      <section className="workspace">
        <aside className="panel search-panel">
          <div className="panel-heading"><div><SlidersHorizontal size={18}/><h2>Find airspace</h2></div><span className="step-tag">01 / SEARCH</span></div>
          <div className="tabs">
            <button className={mode === 'city' ? 'tab active' : 'tab'} onClick={() => setMode('city')}><MapPin size={15}/> City search</button>
            <button className={mode === 'advanced' ? 'tab active' : 'tab'} onClick={() => setMode('advanced')}><Crosshair size={15}/> Advanced</button>
          </div>
          {mode === 'city' ? <form onSubmit={citySearch} className="form-stack">
            <label>Country <select value={country} onChange={e => setCountry(e.target.value)}><option>India</option></select></label>
            <label>City or locality<input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Pune" /></label>
            <button className="primary-button" disabled={busy}><Search size={16}/>{busy ? 'Searching…' : 'Search city'}</button>
            <p className="helper">City search uses OpenStreetMap Nominatim to find coordinates. It does not fetch official airspace restrictions.</p>
          </form> : <form onSubmit={coordinateSearch} className="form-stack">
            <div className="coordinate-grid">
              <label>Latitude<input inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} placeholder="18.5204"/></label>
              <label>Longitude<input inputMode="decimal" value={lon} onChange={e => setLon(e.target.value)} placeholder="73.8567"/></label>
            </div>
            <label className="range-label">Search radius <strong>{radius} km</strong></label>
            <input className="range" type="range" min="0.5" max="10" step="0.5" value={radius} onChange={e => setRadius(Number(e.target.value))}/>
            <div className="range-ends"><span>0.5 km</span><span>10 km</span></div>
            <button className="primary-button"><Crosshair size={16}/>Search coordinates</button>
            <button type="button" className="secondary-button" onClick={useBrowserLocation}><LocateFixed size={16}/>Use my current location</button>
          </form>}
          {error && <div className="error-box" role="alert">{error}</div>}
          <div className="location-card"><MapPin size={17}/><div><small>SEARCH CENTER</small><b>{locationLabel}</b><span>{fmt(center[0])}, {fmt(center[1])}</span></div></div>
          <div className="data-note"><Info size={16}/><p>Zone shapes and airport markers are synthetic examples. They are not safe-to-fly guidance.</p></div>
        </aside>

        <section className="map-panel">
          <div className="map-topline"><span><span className="map-dot"/> Interactive map</span><span className="map-coords">{fmt(center[0])}° N · {fmt(center[1])}° E</span></div>
          <div className="map-container">
            <MapContainer center={center} zoom={12} scrollWheelZoom={true} className="leaflet-map">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <MapFlyTo center={center}/>
              <Circle center={center} radius={radius * 1000} pathOptions={{ color:'#2563eb', fillColor:'#3b82f6', fillOpacity:0.08, weight:2, dashArray:'6 6' }}/>
              <Marker position={center} icon={pinIcon('#2563eb')}><Popup><b>Search center</b><br/>{locationLabel}</Popup></Marker>
              {features.map(f => <React.Fragment key={f.id}>
                {f.radiusM && <Circle center={[f.lat,f.lon]} radius={f.radiusM} pathOptions={{color:colorFor(f.category),fillColor:colorFor(f.category),fillOpacity:.22,weight:2}}/>}
                <CircleMarker center={[f.lat,f.lon]} radius={6} pathOptions={{color:'#fff',weight:2,fillColor:colorFor(f.category),fillOpacity:1}} eventHandlers={{click:()=>setSelected(f.id)}}><Popup><b>{f.name}</b><br/>{f.note}</Popup></CircleMarker>
              </React.Fragment>)}
            </MapContainer>
            <div className="map-legend"><span><i className="legend-swatch red"/>Example restricted</span><span><i className="legend-swatch amber"/>Airport / caution</span><span><i className="legend-swatch blue"/>Search radius</span></div>
          </div>
          <div className="map-footer"><span><Navigation size={14}/>{nearby.length} demo features within {radius} km</span><span>Map tiles © OpenStreetMap</span></div>
        </section>
      </section>

      <section className="results-section">
        <div className="results-title"><div><p className="eyebrow">02 / NEARBY RESULTS</p><h2>What’s around this point?</h2></div><span className="count-badge">{nearby.length} found</span></div>
        <div className="result-grid">
          <article className="summary-card red-card"><div className="summary-icon"><ShieldAlert size={19}/></div><div><span>DEMO RESTRICTED ZONES</span><strong>{nearby.filter(f => f.category === 'restricted').length}</strong><p>Illustrative polygons only</p></div></article>
          <article className="summary-card amber-card"><div className="summary-icon"><Plane size={19}/></div><div><span>AIRPORT MARKERS</span><strong>{nearby.filter(f => f.category === 'airport').length}</strong><p>Not an official airport buffer</p></div></article>
          <article className="summary-card blue-card"><div className="summary-icon"><Crosshair size={19}/></div><div><span>SEARCH RADIUS</span><strong>{radius} km</strong><p>Distance from your selected point</p></div></article>
        </div>
        <div className="panel list-panel">
          <div className="list-header"><h3>Nearby features</h3><span>Sorted by distance</span></div>
          {nearby.length ? nearby.map(f => <button className={`feature-row ${selected === f.id ? 'selected' : ''}`} key={f.id} onClick={() => setSelected(f.id)}>
            <span className="feature-symbol" style={{'--feature-color':colorFor(f.category)}}>{f.category === 'airport' ? <Plane size={17}/> : f.category === 'restricted' ? <ShieldAlert size={17}/> : <AlertTriangle size={17}/>}</span>
            <span className="feature-main"><b>{f.name}</b><small>{categoryLabel(f.category)} · {fmt(f.lat)}, {fmt(f.lon)}</small></span>
            <span className="feature-distance">{f.distance < 1 ? `${Math.round(f.distance*1000)} m` : `${f.distance.toFixed(2)} km`}<small>from center</small></span>
          </button>) : <div className="empty-state"><MapPin size={25}/><b>No demo features within this radius</b><span>This means only that the sample dataset has no nearby entries. It does not mean flying is permitted.</span></div>}
        </div>
      </section>

      <section className="next-step"><div className="next-icon"><CheckCircle2 size={21}/></div><div><b>Ready for official data integration?</b><p>Connect an authorized DigitalSky / airspace data provider through a backend API. Replace the demo features before using this for real-world decisions.</p></div><a href="https://digitalsky.dgca.gov.in/" target="_blank" rel="noreferrer">DigitalSky portal <ExternalLink size={14}/></a></section>
    </main>
    <footer><span>Drone Zone Checker <span className="footer-dot">·</span> India prototype</span><span>Always verify current official airspace restrictions before flight.</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
