import { useEffect, useState } from "react";
import "./Emergencies.css";

const API_URL = "http://127.0.0.1:8000";

function Emergencies({ onNavigate }) {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    patient_name: "",
    phone: "",
    emergency_type: "",
    location: "",
    severity: "High",
    latitude: "",
    longitude: "",
  });

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToDashboard = () => {
    window.location.assign("/dashboard");
  };

  const openEmergency = (emergencyId) => {
    const path = `/emergencies/${emergencyId}`;

    if (typeof onNavigate === "function") {
      onNavigate(path);
      return;
    }

    window.location.assign(path);
  };

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // ==========================================
  // FETCH EMERGENCIES
  // ==========================================

  const fetchEmergencies = async () => {
    const token = getToken();

    if (!token) {
      throw new Error("You are not logged in.");
    }

    const response = await fetch(`${API_URL}/emergencies`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to load emergencies."
      );
    }

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.emergencies)) {
      return data.emergencies;
    }

    return [];
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadEmergencies = async () => {
      try {
        const data = await fetchEmergencies();

        if (!cancelled) {
          setEmergencies(data);
          setError("");
        }
      } catch (err) {
        console.error("Emergency fetch error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load emergencies."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEmergencies();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // REFRESH
  // ==========================================

  const refreshEmergencies = async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await fetchEmergencies();

      setEmergencies(data);
    } catch (err) {
      console.error("Emergency refresh error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh emergencies."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================

  // ==========================================
  // CREATE EMERGENCY
  // ==========================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const closeCreateForm = () => {
    if (creating) return;
    setShowCreateForm(false);
    setFormError("");
    setForm({
      patient_name: "",
      phone: "",
      emergency_type: "",
      location: "",
      severity: "High",
      latitude: "",
      longitude: "",
    });
  };

  const useCurrentLocation = () => {
    setFormError("");
    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        setFormError(
          "Unable to get your current location. Enter latitude and longitude manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const createEmergency = async (event) => {
    event.preventDefault();
    if (creating) return;

    setFormError("");
    setError("");

    const patientName = form.patient_name.trim();
    const phone = form.phone.trim();
    const emergencyType = form.emergency_type.trim();
    const location = form.location.trim();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      !patientName ||
      !phone ||
      !emergencyType ||
      !location ||
      !form.severity ||
      form.latitude.trim() === "" ||
      form.longitude.trim() === ""
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setFormError("Latitude and longitude must be valid numbers.");
      return;
    }

    const token = getToken();
    if (!token) {
      setFormError("You are not logged in.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(`${API_URL}/emergencies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: patientName,
          phone,
          emergency_type: emergencyType,
          location,
          severity: form.severity,
          latitude,
          longitude,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let message = "Failed to create emergency.";

        if (Array.isArray(data.detail)) {
          message = data.detail
            .map((item) => {
              if (typeof item === "string") return item;
              const field = Array.isArray(item?.loc)
                ? item.loc[item.loc.length - 1]
                : "field";
              return `${field}: ${item?.msg || "Invalid value"}`;
            })
            .join(" | ");
        } else if (typeof data.detail === "string") {
          message = data.detail;
        } else if (typeof data.message === "string") {
          message = data.message;
        }

        throw new Error(message);
      }

      const updatedEmergencies = await fetchEmergencies();
      setEmergencies(updatedEmergencies);
      closeCreateForm();
    } catch (err) {
      console.error("Create emergency error:", err);
      setFormError(
        err instanceof Error ? err.message : "Unable to create emergency."
      );
    } finally {
      setCreating(false);
    }
  };

  // COMPLETE EMERGENCY
  // ==========================================

  const completeEmergency = async (emergencyId) => {
    try {
      setCompletingId(emergencyId);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_URL}/emergencies/${emergencyId}/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to complete emergency."
        );
      }

      const updatedEmergencies = await fetchEmergencies();

      setEmergencies(updatedEmergencies);
    } catch (err) {
      console.error("Complete emergency error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete emergency."
      );
    } finally {
      setCompletingId(null);
    }
  };

  // ==========================================
  // DELETE EMERGENCY
  // ==========================================

  const deleteEmergency = async (emergencyId) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Emergency #${String(
        emergencyId
      ).padStart(3, "0")}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(emergencyId);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_URL}/emergencies/${emergencyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete emergency."
        );
      }

      setEmergencies((currentEmergencies) =>
        currentEmergencies.filter(
          (emergency) => emergency.id !== emergencyId
        )
      );
    } catch (err) {
      console.error("Delete emergency error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete emergency."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // SEVERITY CLASS
  // ==========================================

  const getSeverityClass = (severity) => {
    switch (String(severity || "").toLowerCase()) {
      case "critical":
        return "severity critical";

      case "high":
        return "severity high";

      case "medium":
        return "severity medium";

      case "low":
        return "severity low";

      default:
        return "severity";
    }
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "status pending";

      case "assigned":
        return "status assigned";

      case "completed":
        return "status completed";

      default:
        return "status";
    }
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="emergencies-main">
        <header className="emergencies-header">
          <div>
            <h1>Emergencies</h1>
            <p>Manage and monitor emergency cases</p>
          </div>
        </header>

        <div className="emergencies-card">
          <div className="loading-state">
            Loading emergencies...
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="emergencies-main">
      {/* HEADER */}
      <header className="emergencies-header">
        <div>
          <button
            type="button"
            onClick={goToDashboard}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
              padding: "9px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow:
                "0 2px 6px rgba(0, 0, 0, 0.06)",
            }}
          >
            ← Back to Dashboard
          </button>

          <h1>Emergencies</h1>

          <p>
            Manage and monitor emergency cases
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          className="refresh-button"
          onClick={refreshEmergencies}
          disabled={refreshing}
        >
          {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
        </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setFormError("");
              setError("");
            }}
            style={{
              minHeight: "40px",
              padding: "0 16px",
              border: "1px solid #dc2626",
              borderRadius: "8px",
              background: "#dc2626",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            + Create Emergency
          </button>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {showCreateForm && (
        <section
          className="emergencies-card"
          style={{ marginBottom: "18px", border: "1px solid #fecaca" }}
        >
          <div className="card-header">
            <div>
              <h2>Create Emergency</h2>
              <p>Submit a new emergency to the RapidResQ backend</p>
            </div>
          </div>

          <form
            onSubmit={createEmergency}
            style={{
              padding: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <label style={labelStyle}>
              Patient Name
              <input
                name="patient_name"
                value={form.patient_name}
                onChange={handleFormChange}
                placeholder="e.g. Rahul Sharma"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="e.g. 9876543210"
                inputMode="tel"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Emergency Type
              <input
                name="emergency_type"
                value={form.emergency_type}
                onChange={handleFormChange}
                placeholder="e.g. Accident, Heart Attack"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Severity
              <select
                name="severity"
                value={form.severity}
                onChange={handleFormChange}
                style={inputStyle}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            <label style={labelStyle}>
              Location
              <input
                name="location"
                value={form.location}
                onChange={handleFormChange}
                placeholder="e.g. Shivajinagar, Pune"
                style={inputStyle}
              />
            </label>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                type="button"
                onClick={useCurrentLocation}
                style={secondaryButtonStyle}
              >
                📍 Use Current Location
              </button>
            </div>

            <label style={labelStyle}>
              Latitude
              <input
                name="latitude"
                value={form.latitude}
                onChange={handleFormChange}
                placeholder="e.g. 18.5304"
                inputMode="decimal"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Longitude
              <input
                name="longitude"
                value={form.longitude}
                onChange={handleFormChange}
                placeholder="e.g. 73.8567"
                inputMode="decimal"
                style={inputStyle}
              />
            </label>

            {formError && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "11px 13px",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {formError}
              </div>
            )}

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeCreateForm}
                disabled={creating}
                style={cancelButtonStyle}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                style={{
                  ...primaryButtonStyle,
                  opacity: creating ? 0.65 : 1,
                  cursor: creating ? "not-allowed" : "pointer",
                }}
              >
                {creating ? "Creating..." : "Create Emergency"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STATISTICS */}
      <section className="emergency-stats">
        <div className="emergency-stat-card">
          <span>Total Emergencies</span>
          <strong>{emergencies.length}</strong>
        </div>

        <div className="emergency-stat-card pending-stat">
          <span>Pending</span>
          <strong>
            {
              emergencies.filter(
                (emergency) =>
                  emergency.status === "Pending"
              ).length
            }
          </strong>
        </div>

        <div className="emergency-stat-card assigned-stat">
          <span>Assigned</span>
          <strong>
            {
              emergencies.filter(
                (emergency) =>
                  emergency.status === "Assigned"
              ).length
            }
          </strong>
        </div>

        <div className="emergency-stat-card critical-stat">
          <span>Critical</span>
          <strong>
            {
              emergencies.filter(
                (emergency) =>
                  emergency.severity === "Critical"
              ).length
            }
          </strong>
        </div>

        <div className="emergency-stat-card completed-stat">
          <span>Completed</span>
          <strong>
            {
              emergencies.filter(
                (emergency) =>
                  emergency.status === "Completed"
              ).length
            }
          </strong>
        </div>
      </section>

      {/* EMERGENCIES CARD */}
      <section className="emergencies-card">
        <div className="card-header">
          <div>
            <h2>All Emergencies</h2>
            <p>All reported emergency cases</p>
          </div>

          <span className="case-count">
            {emergencies.length}{" "}
            {emergencies.length === 1 ? "case" : "cases"}
          </span>
        </div>

        {/* EMPTY STATE */}
        {emergencies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🚨
            </div>

            <h3>No emergencies found</h3>

            <p>
              There are currently no emergency cases
              in the system.
            </p>
          </div>
        ) : (
          <div className="emergency-table-wrapper">
            <table className="emergency-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Emergency</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Ambulance</th>
                  <th>Hospital</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {emergencies.map((emergency) => (
                  <tr
                    key={emergency.id}
                    onClick={() => openEmergency(emergency.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEmergency(emergency.id);
                      }
                    }}
                    tabIndex={0}
                    title={`Open Emergency #${String(emergency.id).padStart(3, "0")}`}
                    style={{ cursor: "pointer" }}
                  >
                    {/* ID */}
                    <td>
                      <strong>
                        #
                        {String(emergency.id).padStart(
                          3,
                          "0"
                        )}
                      </strong>
                    </td>

                    {/* PATIENT */}
                    <td>
                      <div className="patient-info">
                        <strong>
                          {emergency.patient_name ||
                            "N/A"}
                        </strong>

                        <span>
                          {emergency.phone || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* EMERGENCY */}
                    <td>
                      {emergency.emergency_type ||
                        "N/A"}
                    </td>

                    {/* LOCATION */}
                    <td>
                      <div className="location-info">
                        <span>
                          {emergency.location || "N/A"}
                        </span>

                        {emergency.latitude !==
                          undefined &&
                          emergency.longitude !==
                            undefined && (
                            <small>
                              {emergency.latitude},{" "}
                              {emergency.longitude}
                            </small>
                          )}
                      </div>
                    </td>

                    {/* SEVERITY */}
                    <td>
                      <span
                        className={getSeverityClass(
                          emergency.severity
                        )}
                      >
                        {emergency.severity ||
                          "Unknown"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={getStatusClass(
                          emergency.status
                        )}
                      >
                        {emergency.status ||
                          "Unknown"}
                      </span>
                    </td>

                    {/* AMBULANCE */}
                    <td>
                      {emergency.ambulance_id ? (
                        <span>
                          #{emergency.ambulance_id}
                        </span>
                      ) : (
                        <span className="not-assigned">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* HOSPITAL */}
                    <td>
                      {emergency.hospital_id ? (
                        <span>
                          #{emergency.hospital_id}
                        </span>
                      ) : (
                        <span className="not-assigned">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* CREATED */}
                    <td>
                      <span className="created-date">
                        {formatDate(
                          emergency.created_at
                        )}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        {emergency.status !==
                        "Completed" ? (
                          <button
                            type="button"
                            className="complete-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              completeEmergency(emergency.id);
                            }}
                            disabled={
                              completingId ===
                                emergency.id ||
                              deletingId ===
                                emergency.id
                            }
                          >
                            {completingId ===
                            emergency.id
                              ? "Completing..."
                              : "Complete"}
                          </button>
                        ) : (
                          <span className="completed-label">
                            ✓ Completed
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEmergency(emergency.id);
                          }}
                          style={{
                            minWidth: "58px",
                            height: "30px",
                            padding: "0 10px",
                            border: "1px solid #2563eb",
                            borderRadius: "7px",
                            background: "#ffffff",
                            color: "#2563eb",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteEmergency(emergency.id);
                          }}
                          disabled={
                            deletingId ===
                              emergency.id ||
                            completingId ===
                              emergency.id
                          }
                          style={{
                            minWidth: "65px",
                            height: "30px",
                            padding: "0 10px",
                            border:
                              "1px solid #dc2626",
                            borderRadius: "7px",
                            background: "#ffffff",
                            color: "#dc2626",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor:
                              deletingId ===
                              emergency.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              deletingId ===
                              emergency.id
                                ? 0.6
                                : 1,
                            transition:
                              "0.2s ease",
                          }}
                        >
                          {deletingId ===
                          emergency.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}


const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "7px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "40px",
  boxSizing: "border-box",
  padding: "9px 11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "13px",
};

const primaryButtonStyle = {
  minHeight: "40px",
  padding: "0 17px",
  border: "1px solid #dc2626",
  borderRadius: "8px",
  background: "#dc2626",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "700",
};

const secondaryButtonStyle = {
  width: "100%",
  minHeight: "40px",
  padding: "0 13px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const cancelButtonStyle = {
  minHeight: "40px",
  padding: "0 17px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
};

export default Emergencies;