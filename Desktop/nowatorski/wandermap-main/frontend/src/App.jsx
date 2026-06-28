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

  // ---- ETAP 2: filtrowanie i sortowanie ----
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCountry, setFilterCountry] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name" | "country" | "status"

  async function load() {
    try {
      const res = await api.get("/destinations");
      setDestinations(res.data);
    } catch {
      onLogout();
    }
  }

  useEffect(() => { load(); }, []);

  // filtrowanie i sortowanie po stronie frontendu
  const filtered = destinations
    .filter((d) => {
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      if (filterCountry && !d.country.toLowerCase().includes(filterCountry.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "country") return a.country.localeCompare(b.country);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  // ---- ETAP 2: statystyki ----
  const visited = destinations.filter((d) => d.status === "visited").length;
  const planned = destinations.filter((d) => d.status === "planned").length;
  const countries = new Set(destinations.map((d) => d.country)).size;

  return (
    <>
      <div className="navbar">
        <h1>🗺️ WanderMap</h1>
        <button className="btn" onClick={onLogout}>Wyloguj</button>
      </div>
      <div className="container">

        {/* ---- ETAP 2: statystyki użytkownika ---- */}
        <div className="stats-bar">
          <div className="stat-item">📍 <strong>{destinations.length}</strong> miejsc</div>
          <div className="stat-item">✅ <strong>{visited}</strong> odwiedzonych</div>
          <div className="stat-item">🗓️ <strong>{planned}</strong> planowanych</div>
          <div className="stat-item">🌍 <strong>{countries}</strong> krajów</div>
        </div>

        <div className="layout">
          <div>
            <DestinationForm onAdded={load} />

            {/* ---- ETAP 2: filtry i sortowanie ---- */}
            <div className="filters-bar">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Wszystkie</option>
                <option value="planned">Planowane</option>
                <option value="visited">Odwiedzone</option>
              </select>
              <input
                placeholder="Szukaj po kraju..."
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Sortuj: A–Z nazwa</option>
                <option value="country">Sortuj: A–Z kraj</option>
                <option value="status">Sortuj: status</option>
              </select>
            </div>

            <h2 style={{ margin: "20px 0 10px" }}>
              Moje miejsca ({filtered.length}{filtered.length !== destinations.length ? ` z ${destinations.length}` : ""})
            </h2>
            {filtered.map((d) => (
              <DestinationCard key={d.id} dest={d} onChange={load} />
            ))}
            {filtered.length === 0 && destinations.length > 0 && (
              <p>Brak wyników dla wybranych filtrów.</p>
            )}
            {destinations.length === 0 && <p>Brak miejsc. Dodaj pierwsze!</p>}
          </div>
          <div>
            <div className="map-wrap">
              <MapContainer center={[50, 19]} zoom={3} style={{ height: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                {filtered
                  .filter((d) => d.latitude && d.longitude)
                  .map((d) => (
                    <Marker key={d.id} position={[parseFloat(d.latitude), parseFloat(d.longitude)]}>
                      <Popup>
                        <b>{d.name}</b><br />{d.country}<br />
                        <span style={{ fontSize: "12px", color: d.status === "visited" ? "green" : "#888" }}>
                          {d.status === "visited" ? "✅ Odwiedzone" : "🗓️ Planowane"}
                        </span>
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
  // ---- ETAP 2: Unsplash ----
  const [photo, setPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

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

  // ---- ETAP 2: ładowanie zdjęcia z Unsplash ----
  async function loadPhoto() {
    setPhotoLoading(true);
    try {
      const res = await api.get(`/unsplash?query=${encodeURIComponent(dest.name)}`);
      setPhoto(res.data);
    } catch {
      setPhoto({ error: true });
    } finally {
      setPhotoLoading(false);
    }
  }

  // ---- ETAP 2: link do Google Flights ----
  function openGoogleFlights() {
    const query = encodeURIComponent(dest.name);
    window.open(`https://www.google.com/travel/flights?q=Flights+to+${query}`, "_blank");
  }

  return (
    <div className="card">
      {/* ---- ETAP 2: zdjęcie z Unsplash ---- */}
      {photo && !photo.error && photo.url && (
        <div style={{ marginBottom: "10px", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
          <img
            src={photo.url}
            alt={dest.name}
            style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
          />
          <a
            href={photo.author_link + "?utm_source=wandermap&utm_medium=referral"}
            target="_blank"
            rel="noreferrer"
            style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "10px", color: "#fff", background: "rgba(0,0,0,0.5)", padding: "2px 5px", borderRadius: "4px", textDecoration: "none" }}
          >
            📷 {photo.author} / Unsplash
          </a>
        </div>
      )}

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
      {photo && photo.error && (
        <p style={{ marginTop: "8px", color: "#c0392b" }}>Brak zdjęcia dla tego miejsca</p>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button className="btn btn-small" onClick={toggleStatus}>
          {dest.status === "planned" ? "Oznacz odwiedzone" : "Cofnij"}
        </button>
        <button className="btn btn-small" onClick={loadWeather}>🌤️ Pogoda</button>
        {/* ---- ETAP 2: przyciski Unsplash i Google Flights ---- */}
        <button className="btn btn-small" onClick={loadPhoto} disabled={photoLoading}>
          {photoLoading ? "Ładuję..." : "🖼️ Zdjęcie"}
        </button>
        <button className="btn btn-small" onClick={openGoogleFlights}>✈️ Loty</button>
        <button className="btn btn-small btn-danger" onClick={remove}>Usuń</button>
      </div>
    </div>
  );
}
