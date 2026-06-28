import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "./api";

// naprawa domyślnych ikon markerów Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  if (!token) {
    return <AuthPage onLogin={(t) => { localStorage.setItem("token", t); setToken(t); }} />;
  }
  return <Dashboard onLogout={() => { localStorage.removeItem("token"); setToken(null); }} />;
}

// ---------------- LOGOWANIE / REJESTRACJA ----------------
function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      if (isRegister) {
        await api.post("/register", { email, password });
      }
      // logowanie używa formularza (OAuth2)
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const res = await api.post("/login", params);
      onLogin(res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || "Coś poszło nie tak");
    }
  }

  return (
    <div className="auth-box">
      <h2>{isRegister ? "Rejestracja" : "Logowanie"} — WanderMap</h2>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn" style={{ width: "100%" }} onClick={handleSubmit}>
        {isRegister ? "Zarejestruj się" : "Zaloguj się"}
      </button>
      <span className="link" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Masz już konto? Zaloguj się" : "Nie masz konta? Zarejestruj się"}
      </span>
    </div>
  );
}

// ---------------- PANEL GŁÓWNY ----------------
function Dashboard({ onLogout }) {
  const [destinations, setDestinations] = useState([]);

  async function load() {
    try {
      const res = await api.get("/destinations");
      setDestinations(res.data);
    } catch {
      onLogout(); // token wygasł
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="navbar">
        <h1>🗺️ WanderMap</h1>
        <button className="btn" onClick={onLogout}>Wyloguj</button>
      </div>
      <div className="container">
        <div className="layout">
          <div>
            <DestinationForm onAdded={load} />
            <h2 style={{ margin: "20px 0 10px" }}>Moje miejsca ({destinations.length})</h2>
            {destinations.map((d) => (
              <DestinationCard key={d.id} dest={d} onChange={load} />
            ))}
            {destinations.length === 0 && <p>Brak miejsc. Dodaj pierwsze!</p>}
          </div>
          <div>
            <div className="map-wrap">
              <MapContainer center={[50, 19]} zoom={3} style={{ height: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                {destinations
                  .filter((d) => d.latitude && d.longitude)
                  .map((d) => (
                    <Marker key={d.id} position={[parseFloat(d.latitude), parseFloat(d.longitude)]}>
                      <Popup>
                        <b>{d.name}</b><br />{d.country}
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------- FORMULARZ DODAWANIA ----------------
function DestinationForm({ onAdded }) {
  const [form, setForm] = useState({
    name: "", country: "", description: "",
    status: "planned", latitude: "", longitude: "",
  });

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function submit() {
    if (!form.name || !form.country) {
      alert("Nazwa i kraj są wymagane");
      return;
    }
    await api.post("/destinations", form);
    setForm({ name: "", country: "", description: "", status: "planned", latitude: "", longitude: "" });
    onAdded();
  }

  return (
    <div className="card">
      <h3>Dodaj destynację</h3>
      <input placeholder="Nazwa miejsca" value={form.name} onChange={(e) => update("name", e.target.value)} />
      <input placeholder="Kraj" value={form.country} onChange={(e) => update("country", e.target.value)} />
      <textarea placeholder="Opis (opcjonalnie)" value={form.description} onChange={(e) => update("description", e.target.value)} />
      <select value={form.status} onChange={(e) => update("status", e.target.value)}>
        <option value="planned">Planowane</option>
        <option value="visited">Odwiedzone</option>
      </select>
      <div style={{ display: "flex", gap: "8px" }}>
        <input placeholder="Szer. geo (np. 48.85)" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} />
        <input placeholder="Dł. geo (np. 2.35)" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} />
      </div>
      <button className="btn" onClick={submit}>Dodaj</button>
    </div>
  );
}

// ---------------- KARTA DESTYNACJI ----------------
function DestinationCard({ dest, onChange }) {
  const [weather, setWeather] = useState(null);

  async function remove() {
    await api.delete(`/destinations/${dest.id}`);
    onChange();
  }

  async function toggleStatus() {
    const newStatus = dest.status === "planned" ? "visited" : "planned";
    await api.put(`/destinations/${dest.id}`, { ...dest, status: newStatus });
    onChange();
  }

  async function loadWeather() {
    try {
      const res = await api.get(`/weather?city=${encodeURIComponent(dest.name)}`);
      setWeather(res.data);
    } catch {
      setWeather({ error: true });
    }
  }

  return (
    <div className="card">
      <h3>{dest.name}</h3>
      <p style={{ color: "#666", marginBottom: "8px" }}>{dest.country}</p>
      {dest.description && <p style={{ marginBottom: "8px" }}>{dest.description}</p>}
      <span className={`badge ${dest.status === "visited" ? "badge-visited" : "badge-planned"}`}>
        {dest.status === "visited" ? "Odwiedzone" : "Planowane"}
      </span>
      {weather && !weather.error && (
        <p style={{ marginTop: "8px" }}>🌡️ {weather.temp}°C, {weather.description}</p>
      )}
      {weather && weather.error && (
        <p style={{ marginTop: "8px", color: "#c0392b" }}>Brak pogody dla tego miejsca</p>
      )}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button className="btn btn-small" onClick={toggleStatus}>
          {dest.status === "planned" ? "Oznacz odwiedzone" : "Cofnij"}
        </button>
        <button className="btn btn-small" onClick={loadWeather}>Pogoda</button>
        <button className="btn btn-small btn-danger" onClick={remove}>Usuń</button>
      </div>
    </div>
  );
}