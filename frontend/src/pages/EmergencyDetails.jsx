import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function EmergencyDetails({ emergencyId, onLogout, onNavigate }) {
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const goBack = () => {
    if (typeof onNavigate === "function") {
      onNavigate("/emergencies");
    } else {
      window.location.assign("/emergencies");
    }
  };

  const logout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");

    window.location.assign("/");
  };

  const loadEmergency = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error("You are not logged in. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/emergencies/${encodeURIComponent(emergencyId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view this emergency."
          );
        }

        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to load emergency (${response.status}).`
        );
      }

      setEmergency(data?.emergency || data);
    } catch (err) {
      console.error("Emergency details error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load emergency details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
  let cancelled = false;

  const fetchEmergency = async () => {
    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "You are not logged in. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/emergencies/${encodeURIComponent(emergencyId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Session expired. Please login again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view this emergency."
          );
        }

        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to load emergency (${response.status}).`
        );
      }

      if (!cancelled) {
        setEmergency(data?.emergency || data);
        setError("");
        setLoading(false);
      }
    } catch (err) {
      console.error("Emergency details error:", err);

      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load emergency details."
        );
        setLoading(false);
      }
    }
  };

  fetchEmergency();

  return () => {
    cancelled = true;
  };
}, [emergencyId]);

  const completeEmergency = async () => {
    if (!emergency) return;

    if (emergency.status === "Completed") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this emergency as completed?"
    );

    if (!confirmed) return;

    try {
      setCompleting(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error("You are not logged in. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/emergencies/${encodeURIComponent(
          emergencyId
        )}/complete`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error(
            "Only an Admin can complete an emergency."
          );
        }

        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to complete emergency (${response.status}).`
        );
      }

      setSuccess(
        data?.message || "Emergency completed successfully."
      );

      await loadEmergency(false);
    } catch (err) {
      console.error("Complete emergency error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete emergency."
      );
    } finally {
      setCompleting(false);
    }
  };

  const value = (key, fallback = "Not available") => {
    const item = emergency?.[key];

    return item === null ||
      item === undefined ||
      item === ""
      ? fallback
      : item;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    const date = new Date(dateString);

    return Number.isNaN(date.getTime())
      ? String(dateString)
      : date.toLocaleString();
  };

  const normalizeStatus = (status) =>
    String(status || "").toLowerCase();

  const normalizeSeverity = (severity) =>
    String(severity || "").toLowerCase();

  const statusClass = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "completed") return "completed";
    if (normalized === "assigned") return "assigned";

    return "pending";
  };

  const severityClass = (severity) => {
    const normalized = normalizeSeverity(severity);

    if (normalized === "critical") return "critical";
    if (normalized === "high") return "high";
    if (normalized === "medium") return "medium";

    return "low";
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>
          <div style={spinnerStyle}>⏳</div>
          <h2 style={{ margin: "10px 0 5px" }}>
            Loading Emergency
          </h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Fetching emergency details...
          </p>
        </div>
      </main>
    );
  }

  if (error && !emergency) {
    return (
      <main style={pageStyle}>
        <header style={topBarStyle}>
          <div>
            <div style={brandStyle}>RapidResQ AI 🚑</div>
            <div style={subtitleStyle}>
              Emergency Details
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={logoutButtonStyle}
          >
            Logout
          </button>
        </header>

        <div style={contentStyle}>
          <section style={cardStyle}>
            <button
              type="button"
              onClick={goBack}
              style={secondaryButtonStyle}
            >
              ← Back
            </button>

            <h2 style={{ marginTop: 25 }}>
              Unable to load emergency
            </h2>

            <p style={errorTextStyle}>{error}</p>

            <button
              type="button"
              onClick={() => loadEmergency(true)}
              style={primaryButtonStyle}
            >
              ↻ Try Again
            </button>
          </section>
        </div>
      </main>
    );
  }

  const status = value("status");
  const severity = value("severity");

  const ambulance =
    emergency?.ambulance ||
    null;

  const hospital =
    emergency?.hospital ||
    null;

  const ambulanceDistance =
    emergency?.ambulance_distance ??
    emergency?.distance_km ??
    ambulance?.distance_km;

  const eta =
    emergency?.eta_minutes ??
    ambulance?.eta_minutes;

  return (
    <main style={pageStyle}>
      {/* HEADER */}
      <header style={topBarStyle}>
        <div>
          <div style={brandStyle}>
            RapidResQ AI 🚑
          </div>

          <div style={subtitleStyle}>
            Emergency Management
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          style={logoutButtonStyle}
        >
          Logout
        </button>
      </header>

      {/* CONTENT */}
      <div style={contentStyle}>
        {/* TOP ROW */}
        <div style={headingRowStyle}>
          <div>
            <button
              type="button"
              onClick={goBack}
              style={secondaryButtonStyle}
            >
              ← Back to Emergencies
            </button>

            <h1 style={titleStyle}>
              Emergency #{emergency.id}
            </h1>

            <p style={descriptionStyle}>
              Detailed emergency response information
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadEmergency(false)}
            disabled={refreshing || completing}
            style={{
              ...secondaryButtonStyle,
              opacity:
                refreshing || completing ? 0.6 : 1,
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </div>

        {/* SUCCESS */}
        {success && (
          <div style={successBoxStyle}>
            ✅ {success}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={errorBoxStyle}>
            ⚠️ {error}
          </div>
        )}

        {/* STATUS / SEVERITY */}
        <section style={overviewGridStyle}>
          <div style={overviewCardStyle}>
            <div style={overviewLabelStyle}>
              STATUS
            </div>

            <div
              className={`status-badge ${statusClass(status)}`}
              style={badgeStyle}
            >
              {status}
            </div>
          </div>

          <div style={overviewCardStyle}>
            <div style={overviewLabelStyle}>
              SEVERITY
            </div>

            <div
              className={`severity-badge ${severityClass(
                severity
              )}`}
              style={badgeStyle}
            >
              {severity}
            </div>
          </div>

          <div style={overviewCardStyle}>
            <div style={overviewLabelStyle}>
              EMERGENCY TYPE
            </div>

            <div style={overviewValueStyle}>
              {value("emergency_type")}
            </div>
          </div>

          <div style={overviewCardStyle}>
            <div style={overviewLabelStyle}>
              CREATED
            </div>

            <div style={overviewValueStyle}>
              {formatDate(emergency.created_at)}
            </div>
          </div>
        </section>

        {/* PATIENT */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            👤 Patient Information
          </h2>

          <div style={detailsGridStyle}>
            <DetailItem
              label="Patient Name"
              value={value("patient_name")}
            />

            <DetailItem
              label="Phone"
              value={value("phone")}
            />

            <DetailItem
              label="Emergency Type"
              value={value("emergency_type")}
            />

            <DetailItem
              label="Emergency ID"
              value={`#${emergency.id}`}
            />
          </div>
        </section>

        {/* LOCATION */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            📍 Emergency Location
          </h2>

          <div style={locationBoxStyle}>
            <div>
              <div style={locationLabelStyle}>
                Address
              </div>

              <div style={locationValueStyle}>
                {value("location")}
              </div>
            </div>

            <div style={coordinatesStyle}>
              <div>
                <strong>Latitude</strong>
                <br />
                {value("latitude")}
              </div>

              <div>
                <strong>Longitude</strong>
                <br />
                {value("longitude")}
              </div>
            </div>
          </div>
        </section>

        {/* RESPONSE */}
        <div style={responseGridStyle}>
          {/* AMBULANCE */}
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              🚑 Ambulance
            </h2>

            {ambulance ? (
              <div>
                <DetailItem
                  label="Ambulance ID"
                  value={
                    ambulance.id
                      ? `#${ambulance.id}`
                      : "Assigned"
                  }
                />

                <DetailItem
                  label="Vehicle Number"
                  value={
                    ambulance.vehicle_number ||
                    ambulance.registration_number ||
                    ambulance.number ||
                    "Not available"
                  }
                />

                <DetailItem
                  label="Driver"
                  value={
                    ambulance.driver_name ||
                    ambulance.driver ||
                    "Not available"
                  }
                />

                <div style={metricBoxStyle}>
                  <div>
                    <span style={metricLabelStyle}>
                      Distance
                    </span>

                    <strong>
                      {ambulanceDistance !== undefined &&
                      ambulanceDistance !== null
                        ? `${ambulanceDistance} km`
                        : "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span style={metricLabelStyle}>
                      ETA
                    </span>

                    <strong>
                      {eta !== undefined &&
                      eta !== null
                        ? `${eta} min`
                        : "Not available"}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState text="No ambulance assigned yet." />
            )}
          </section>

          {/* HOSPITAL */}
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              🏥 Hospital
            </h2>

            {hospital ? (
              <div>
                <DetailItem
                  label="Hospital ID"
                  value={
                    hospital.id
                      ? `#${hospital.id}`
                      : "Assigned"
                  }
                />

                <DetailItem
                  label="Hospital Name"
                  value={
                    hospital.name ||
                    hospital.hospital_name ||
                    "Not available"
                  }
                />

                <DetailItem
                  label="Location"
                  value={
                    hospital.location ||
                    hospital.address ||
                    "Not available"
                  }
                />

                <DetailItem
                  label="Available Beds"
                  value={
                    hospital.available_beds ??
                    "Not available"
                  }
                />
              </div>
            ) : (
              <EmptyState text="No hospital assigned yet." />
            )}
          </section>
        </div>

        {/* COMPLETE EMERGENCY */}
        <section style={actionCardStyle}>
          <div>
            <h2 style={{ margin: 0 }}>
              Emergency Actions
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
              }}
            >
              {status === "Completed"
                ? "This emergency has been completed."
                : "Complete this emergency after the response has been handled."}
            </p>
          </div>

          {status === "Completed" ? (
            <div style={completedMessageStyle}>
              ✅ Emergency Completed
            </div>
          ) : (
            <button
              type="button"
              onClick={completeEmergency}
              disabled={completing}
              style={{
                ...completeButtonStyle,
                opacity: completing ? 0.65 : 1,
              }}
            >
              {completing
                ? "Completing..."
                : "✓ Complete Emergency"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>
        {label}
      </span>

      <strong style={detailValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={emptyStateStyle}>
      {text}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fb",
  color: "#111827",
  fontFamily:
    "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const topBarStyle = {
  height: "72px",
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const brandStyle = {
  fontSize: "20px",
  fontWeight: 800,
};

const subtitleStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "2px",
};

const contentStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "28px 22px 50px",
};

const headingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
};

const titleStyle = {
  fontSize: "30px",
  margin: "18px 0 4px",
};

const descriptionStyle = {
  margin: 0,
  color: "#6b7280",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "22px",
  marginBottom: "20px",
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
};

const actionCardStyle = {
  ...cardStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
};

const overviewGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const overviewCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
};

const overviewLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6b7280",
  letterSpacing: "0.06em",
  marginBottom: "10px",
};

const overviewValueStyle = {
  fontSize: "18px",
  fontWeight: 700,
};

const badgeStyle = {
  display: "inline-block",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 700,
  background: "#eef2ff",
};

const sectionTitleStyle = {
  margin: "0 0 20px",
  fontSize: "19px",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const detailItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  paddingBottom: "10px",
};

const detailLabelStyle = {
  fontSize: "12px",
  color: "#6b7280",
};

const detailValueStyle = {
  fontSize: "15px",
  color: "#111827",
};

const locationBoxStyle = {
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "18px",
};

const locationLabelStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "5px",
};

const locationValueStyle = {
  fontWeight: 700,
  fontSize: "16px",
};

const coordinatesStyle = {
  display: "flex",
  gap: "40px",
  marginTop: "18px",
  fontSize: "13px",
  color: "#4b5563",
};

const responseGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px",
};

const metricBoxStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginTop: "12px",
};

const metricLabelStyle = {
  display: "block",
  color: "#6b7280",
  fontSize: "11px",
  marginBottom: "3px",
};

const emptyStateStyle = {
  background: "#f8fafc",
  borderRadius: "10px",
  padding: "18px",
  color: "#6b7280",
  textAlign: "center",
};

const loadingCardStyle = {
  maxWidth: "500px",
  margin: "120px auto",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "40px",
  textAlign: "center",
};

const spinnerStyle = {
  fontSize: "30px",
};

const primaryButtonStyle = {
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  padding: "9px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
};

const logoutButtonStyle = {
  border: "none",
  background: "#111827",
  color: "#ffffff",
  padding: "9px 15px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
};

const completeButtonStyle = {
  border: "none",
  background: "#16a34a",
  color: "#ffffff",
  padding: "12px 18px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const completedMessageStyle = {
  background: "#dcfce7",
  color: "#166534",
  padding: "11px 15px",
  borderRadius: "9px",
  fontWeight: 700,
};

const successBoxStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #bbf7d0",
  padding: "12px 15px",
  borderRadius: "9px",
  marginBottom: "18px",
};

const errorBoxStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: "12px 15px",
  borderRadius: "9px",
  marginBottom: "18px",
};

const errorTextStyle = {
  color: "#b91c1c",
  background: "#fee2e2",
  padding: "12px",
  borderRadius: "8px",
};

export default EmergencyDetails;