import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function CitizenDashboard({ onLogout }) {
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const getEmergencyId = () => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("emergency_id") ||
      params.get("emergencyId") ||
      params.get("id") ||
      localStorage.getItem("emergency_id") ||
      localStorage.getItem("emergencyId") ||
      localStorage.getItem("current_emergency_id")
    );
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    [
      "access_token",
      "token",
      "user_role",
      "user_email",
      "emergency_id",
      "emergencyId",
      "current_emergency_id",
    ].forEach((key) => localStorage.removeItem(key));
    window.location.assign("/");
  };

  const loadEmergency = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const id = getEmergencyId();

      if (!id) {
        throw new Error(
          "No emergency ID found. Open this page with ?emergency_id=19 or store emergency_id in localStorage."
        );
      }

      const response = await fetch(
        `${API_URL}/emergencies/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (response.status === 403) {
          throw new Error("You do not have permission to view this emergency.");
        }
        if (response.status === 404) {
          throw new Error(`Emergency #${id} was not found.`);
        }
        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to load emergency (${response.status}).`
        );
      }

      setEmergency(data);
    } catch (err) {
      console.error("Emergency fetch error:", err);
      setError(err instanceof Error ? err.message : "Unable to load emergency.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("token");
        const id = getEmergencyId();

        if (!token) throw new Error("No authentication token found. Please login again.");
        if (!id) {
          throw new Error(
            "No emergency ID found. Open this page with ?emergency_id=19 or store emergency_id in localStorage."
          );
        }

        const response = await fetch(
          `${API_URL}/emergencies/${encodeURIComponent(id)}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (response.status === 401) throw new Error("Session expired. Please login again.");
          if (response.status === 403) throw new Error("You do not have permission to view this emergency.");
          if (response.status === 404) throw new Error(`Emergency #${id} was not found.`);
          throw new Error(data?.detail || data?.message || `Unable to load emergency (${response.status}).`);
        }

        if (active) setEmergency(data);
      } catch (err) {
        console.error("Emergency fetch error:", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load emergency.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  const getCurrentLocation = () => {
    setLocationMessage("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage("Current location detected successfully.");
        setLocationLoading(false);
      },
      (geoError) => {
        const messages = {
          1: "Location permission was denied. Allow location access and try again.",
          2: "Your current location could not be determined.",
          3: "Location request timed out. Please try again.",
        };
        setLocationMessage(
          messages[geoError.code] || "Unable to get your current location."
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingIcon}>🚑</div>
        <h2>Loading RapidResQ...</h2>
        <p>Fetching your emergency response details.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div>
            <strong style={styles.brand}>RapidResQ AI 🚑</strong>
            <small style={styles.small}>Citizen Dashboard</small>
          </div>
          <button style={styles.logout} onClick={handleLogout}>Logout</button>
        </header>
        <main style={styles.container}>
          <div style={styles.errorCard}>
            <div style={{ fontSize: 42 }}>⚠️</div>
            <h2>Unable to load emergency</h2>
            <p>{error}</p>
            <button style={styles.primary} onClick={loadEmergency}>↻ Try Again</button>
          </div>
        </main>
      </div>
    );
  }

  const ambulance = emergency?.ambulance;
  const distance =
    ambulance?.distance_km != null
      ? `${Number(ambulance.distance_km).toFixed(2)} km`
      : "—";
  const eta =
    ambulance?.estimated_arrival_minutes != null
      ? `${Math.max(0, Math.round(Number(ambulance.estimated_arrival_minutes)))} minutes`
      : "—";

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <strong style={styles.brand}>RapidResQ AI 🚑</strong>
          <small style={styles.small}>Citizen Dashboard</small>
        </div>
        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </header>

      <main style={styles.container}>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.title}>Emergency #{emergency?.id ?? getEmergencyId()}</h1>
            <p style={styles.muted}>Real-time emergency response information</p>
          </div>
          <button style={styles.secondary} onClick={loadEmergency}>↻ Refresh</button>
        </div>

        <section style={styles.card}>
          <span style={styles.label}>EMERGENCY STATUS</span>
          <div style={styles.statusRow}>
            <span style={styles.status}>{emergency?.status || "Unknown"}</span>
            <span style={styles.severity}>{emergency?.severity || "Unknown"} Severity</span>
          </div>
          <div style={styles.emergencyInfo}>
            <strong>{emergency?.emergency_type || "Emergency"}</strong>
            <span>{emergency?.location || "Location unavailable"}</span>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardTop}>
            <div>
              <span style={styles.label}>ASSIGNED AMBULANCE</span>
              <h2 style={styles.cardTitle}>
                🚑 {ambulance?.vehicle || (ambulance?.id ? `Ambulance #${String(ambulance.id).padStart(3, "0")}` : "Not assigned")}
              </h2>
            </div>
            <span style={styles.ambulanceStatus}>{ambulance?.status || "Not assigned"}</span>
          </div>

          {ambulance ? (
            <>
              <div style={styles.grid3}>
                <Info label="Vehicle" value={ambulance.vehicle} />
                <Info label="Ambulance ID" value={ambulance.id} />
                <Info label="Location" value={ambulance.location} />
              </div>

              <div style={styles.locationBox}>
                <h3 style={{ margin: 0 }}>📍 Ambulance Location</h3>
                <p style={styles.muted}>Current GPS coordinates</p>
                <div style={styles.grid2}>
                  <Info label="Latitude" value={formatCoord(ambulance.latitude)} />
                  <Info label="Longitude" value={formatCoord(ambulance.longitude)} />
                </div>
              </div>

              <div style={styles.grid2}>
                <Metric icon="📏" label="Distance to emergency" value={distance} />
                <Metric icon="⏱" label="Estimated arrival" value={eta} />
              </div>
            </>
          ) : (
            <div style={styles.empty}>
              <div style={{ fontSize: 38 }}>🚑</div>
              <h3>Ambulance not assigned yet</h3>
              <p style={styles.muted}>
                RapidResQ will assign an available ambulance when one becomes available.
              </p>
            </div>
          )}
        </section>

        <section style={styles.card}>
          <span style={styles.label}>EMERGENCY LOCATION</span>
          <h2 style={styles.cardTitle}>📍 Your Emergency</h2>
          <div style={styles.grid3}>
            <Info label="Location" value={emergency?.location} />
            <Info label="Latitude" value={formatCoord(emergency?.latitude)} />
            <Info label="Longitude" value={formatCoord(emergency?.longitude)} />
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardTop}>
            <div>
              <span style={styles.label}>DEVICE LOCATION</span>
              <h2 style={styles.cardTitle}>📡 Current Location</h2>
            </div>
            <button
              style={{ ...styles.primary, opacity: locationLoading ? 0.65 : 1 }}
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? "Detecting..." : "Get Current Location"}
            </button>
          </div>

          {locationMessage && <p style={styles.message}>{locationMessage}</p>}
          {location && (
            <div style={styles.grid2}>
              <Info label="Latitude" value={location.latitude.toFixed(6)} />
              <Info label="Longitude" value={location.longitude.toFixed(6)} />
            </div>
          )}
        </section>

        <section style={styles.card}>
          <span style={styles.label}>PATIENT INFORMATION</span>
          <div style={styles.grid4}>
            <Info label="Patient" value={emergency?.patient_name} />
            <Info label="Phone" value={emergency?.phone} />
            <Info label="Emergency Type" value={emergency?.emergency_type} />
            <Info label="Hospital ID" value={emergency?.hospital_id ?? "Not assigned"} />
          </div>
        </section>
      </main>
    </div>
  );
}

function formatCoord(value) {
  return value == null || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(4);
}

function Info({ label, value }) {
  return (
    <div style={styles.info}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value ?? "—"}</strong>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div style={styles.metric}>
      <div style={{ fontSize: 25 }}>{icon}</div>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 8,
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  loadingIcon: { fontSize: 46 },
  header: {
    minHeight: 72,
    padding: "0 5%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },
  brand: { display: "block", fontSize: 22 },
  small: { display: "block", marginTop: 4, color: "#6b7280", fontSize: 13 },
  container: { width: "min(1100px, 92%)", margin: "0 auto", padding: "30px 0 50px" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap", marginBottom: 20 },
  title: { margin: 0, fontSize: 30 },
  muted: { margin: "6px 0 0", color: "#6b7280", fontSize: 14, lineHeight: 1.5 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 22, marginBottom: 18, boxShadow: "0 5px 18px rgba(15,23,42,.05)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap", marginBottom: 18 },
  cardTitle: { margin: "5px 0 0", fontSize: 21 },
  label: { display: "block", color: "#6b7280", fontSize: 11, fontWeight: 800, letterSpacing: 1 },
  statusRow: { display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" },
  status: { background: "#dcfce7", color: "#166534", borderRadius: 999, padding: "7px 12px", fontWeight: 800, fontSize: 13 },
  severity: { background: "#fee2e2", color: "#991b1b", borderRadius: 999, padding: "7px 12px", fontWeight: 800, fontSize: 13 },
  ambulanceStatus: { background: "#dbeafe", color: "#1d4ed8", borderRadius: 999, padding: "7px 12px", fontWeight: 800, fontSize: 13 },
  emergencyInfo: { display: "flex", flexDirection: "column", gap: 4, fontSize: 14 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 15 },
  info: { background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 11, padding: 14, minWidth: 0 },
  infoLabel: { display: "block", color: "#6b7280", fontSize: 12, marginBottom: 6 },
  infoValue: { display: "block", color: "#111827", fontSize: 15, overflowWrap: "anywhere" },
  locationBox: { background: "#fbfdff", border: "1px solid #e5e7eb", borderRadius: 13, padding: 17, margin: "16px 0" },
  metric: { border: "1px solid #e5e7eb", borderRadius: 13, padding: 18, background: "#fff" },
  metricValue: { display: "block", fontSize: 24, marginTop: 3 },
  empty: { textAlign: "center", padding: 28, background: "#fafafa", border: "1px dashed #d1d5db", borderRadius: 13 },
  message: { padding: 11, background: "#f1f5f9", borderRadius: 9, color: "#475569", fontSize: 13 },
  primary: { border: 0, background: "#dc2626", color: "#fff", borderRadius: 9, padding: "11px 16px", fontWeight: 700, cursor: "pointer" },
  secondary: { border: "1px solid #d1d5db", background: "#fff", color: "#374151", borderRadius: 9, padding: "10px 16px", fontWeight: 700, cursor: "pointer" },
  logout: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 9, padding: "10px 15px", fontWeight: 700, cursor: "pointer" },
  errorCard: { maxWidth: 650, margin: "70px auto", padding: 35, background: "#fff", border: "1px solid #fecaca", borderRadius: 16, textAlign: "center" },
};

export default CitizenDashboard;