import { useEffect, useState } from "react";
import "./Emergencies.css";

const API_URL = "http://127.0.0.1:8000";

function Emergencies() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToDashboard = () => {
    window.location.assign("/dashboard");
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

        <button
          type="button"
          className="refresh-button"
          onClick={refreshEmergencies}
          disabled={refreshing}
        >
          {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
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
                  <tr key={emergency.id}>
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
                            onClick={() =>
                              completeEmergency(
                                emergency.id
                              )
                            }
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
                          onClick={() =>
                            deleteEmergency(
                              emergency.id
                            )
                          }
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

export default Emergencies;