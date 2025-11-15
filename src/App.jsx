import { useState } from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
const BASE = "https://api.openweathermap.org/data/2.5";

export default function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const units = "metric"; // Use "imperial" for Fahrenheit

  const fetchWeather = async (location) => {
    setError("");
    setLoading(true);

    // Decide whether user entered ZIP code or city
    const isZip = /^\d+$/.test(location); // true if only numbers
    const paramsKey = isZip ? "zip" : "q";
    const queryValue = isZip ? `${location},US` : location; // Add ",US" for US ZIP codes

    try {
      const current = await axios.get(`${BASE}/weather`, {
        params: { [paramsKey]: queryValue, appid: API_KEY, units },
      });
      const forecastRes = await axios.get(`${BASE}/forecast`, {
        params: { [paramsKey]: queryValue, appid: API_KEY, units },
      });
      setWeather(current.data);
      setForecast(forecastRes.data.list.slice(0, 5 * 8)); // 5 days
    } catch {
      setError("Could not find this location. Try another city or ZIP.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a city or ZIP.");
      return;
    }
    fetchWeather(query.trim());
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLoading(true);
        try {
          const res = await axios.get(`${BASE}/weather`, {
            params: { lat: latitude, lon: longitude, appid: API_KEY, units },
          });
          setWeather(res.data);
          setError("");
        } catch {
          setError("Unable to fetch your location weather.");
        } finally {
          setLoading(false);
        }
      },
      () => setError("Permission denied for geolocation.")
    );
  };

  const infoUrl = "https://www.linkedin.com/company/product-manager-accelerator/";

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: "1rem" }}>
      <h1>Weather App — Lifei Liu</h1>
      <a href={infoUrl} target="_blank" rel="noreferrer">ℹ️ About PM Accelerator</a>

      <form onSubmit={handleSearch} style={{ marginTop: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter city or ZIP"
          style={{ padding: "0.6rem", width: "60%" }}
        />
        <button type="submit" style={{ marginLeft: 10 }}>Search</button>
        <button type="button" onClick={useMyLocation} style={{ marginLeft: 10 }}>
          Use My Location
        </button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {weather && (
        <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 15, borderRadius: 8 }}>
          <h2>
            {weather.name}, {weather.sys?.country}
          </h2>
          <p>
            {Math.round(weather.main.temp)}° {units === "metric" ? "C" : "F"} —{" "}
            {weather.weather?.[0]?.description}
          </p>
          <p>Feels like: {Math.round(weather.main.feels_like)}°</p>
          <p>Humidity: {weather.main.humidity}%</p>
          <p>
            Wind: {weather.wind.speed} {units === "metric" ? "m/s" : "mph"}
          </p>
        </div>
      )}

      {/* --- 5-Day Forecast Section --- */}
      {forecast.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>5-Day Forecast</h3>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            {forecast
              // Select one record every 8 (3-hour intervals × 8 = 24h)
              .filter((_, idx) => idx % 8 === 0)
              .map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    width: 120,
                    textAlign: "center",
                    background: "#f9f9f9",
                  }}
                >
                  <p style={{ fontWeight: "bold" }}>
                    {new Date(item.dt_txt).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                    alt={item.weather[0].description}
                    style={{ width: 50, height: 50 }}
                  />
                  <p>{Math.round(item.main.temp)}° {units === "metric" ? "C" : "F"}</p>
                  <p style={{ fontSize: 12 }}>{item.weather[0].description}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}