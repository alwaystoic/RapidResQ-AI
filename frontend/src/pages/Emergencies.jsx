import { useEffect, useState } from "react";
import "./Emergencies.css";

const API_URL = "http://127.0.0.1:8000";

function Emergencies() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToDashboard = () => {
    window.location.assign("/dashboard");
  };

  // ==========================================
  // LOAD EMERGENCIES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadEmergencies = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          if (!cancelled) {
            setError("You are not logged in.");
            setLoading(false);
          }
          return;
        }

        const response = await fetch(`${API_URL}/emergencies`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load emergencies."
          );
        }

        if (!cancelled) {
          setEmergencies(data.emergencies || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error("Emergency fetch error:", err);

        if (!cancelled) {
          setError(
            err.message || "Unable to load emergencies."
          );
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
  // REFRESH EMERGENCIES
  // ==========================================

  const refreshEmergencies = async () => {
    try {
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(`${API_URL}/emergencies`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load emergencies."
        );
      }

      setEmergencies(data.emergencies || []);
    } catch (err) {
      console.error("Emergency refresh error:", err);

      setError(
        err.message || "Unable to refresh emergencies."
      );
    }
  };

  // ==========================================
  // COMPLETE EMERGENCY
  // ==========================================

  const completeEmergency = async (emergencyId) => {
    try {
      setCompletingId(emergencyId);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(
        `${API_URL}/emergencies/${emergencyId}/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to complete emergency."
        );
      }

      await refreshEmergencies();
    } catch (err) {
      console.error("Complete emergency error:", err);

      setError(
        err.message || "Unable to complete emergency."
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

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(
        `${API_URL}/emergencies/${emergencyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete emergency."
        );
      }

      // Remove immediately from the table
      setEmergencies((currentEmergencies) =>
        currentEmergencies.filter(
          (emergency) => emergency.id !== emergencyId
        )
      );

    } catch (err) {
      console.error("Delete emergency error:", err);

      setError(
        err.message || "Unable to delete emergency."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // SEVERITY CLASS
  // ==========================================

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "Critical":
        return "severity critical";

      case "High":
        return "severity high";

      case "Medium":
        return "severity medium";

      case "Low":
        return "severity low";

      default:
        return "severity";
    }
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "status pending";

      case "Assigned":
        return "status assigned";

      case "Completed":
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

      {/* Header */}
      <header className="emergencies-header">

        <div>

          {/* BACK TO DASHBOARD */}
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
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
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
          className="refresh-button"
          onClick={refreshEmergencies}
        >
          ↻ Refresh
        </button>

      </header>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistics */}
      <section className="emergency-stats">

        <div className="emergency-stat-card">
          <span>Total Emergencies</span>

          <strong>
            {emergencies.length}
          </strong>
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

      {/* Emergency Card */}
      <section className="emergencies-card">

        <div className="card-header">

          <div>
            <h2>
              All Emergencies
            </h2>

            <p>
              All reported emergency cases
            </p>
          </div>

          <span className="case-count">
            {emergencies.length} cases
          </span>

        </div>

        {/* Empty */}
        {emergencies.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🚨
            </div>

            <h3>
              No emergencies found
            </h3>

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
                        #{String(emergency.id).padStart(3, "0")}
                      </strong>
                    </td>

                    {/* Patient */}
                    <td>
                      <div className="patient-info">

                        <strong>
                          {emergency.patient_name}
                        </strong>

                        <span>
                          {emergency.phone}
                        </span>

                      </div>
                    </td>

                    {/* Emergency */}
                    <td>
                      {emergency.emergency_type}
                    </td>

                    {/* Location */}
                    <td>
                      <div className="location-info">

                        <span>
                          {emergency.location}
                        </span>

                        {emergency.latitude !== undefined &&
                          emergency.longitude !== undefined && (
                            <small>
                              {emergency.latitude},{" "}
                              {emergency.longitude}
                            </small>
                          )}

                      </div>
                    </td>

                    {/* Severity */}
                    <td>
                      <span
                        className={getSeverityClass(
                          emergency.severity
                        )}
                      >
                        {emergency.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={getStatusClass(
                          emergency.status
                        )}
                      >
                        {emergency.status}
                      </span>
                    </td>

                    {/* Ambulance */}
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

                    {/* Hospital */}
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

                    {/* Created */}
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

                        {/* COMPLETE */}
                        {emergency.status !== "Completed" ? (

                          <button
                            className="complete-button"
                            onClick={() =>
                              completeEmergency(
                                emergency.id
                              )
                            }
                            disabled={
                              completingId === emergency.id ||
                              deletingId === emergency.id
                            }
                          >
                            {completingId === emergency.id
                              ? "Completing..."
                              : "Complete"}
                          </button>

                        ) : (

                          <span className="completed-label">
                            ✓ Completed
                          </span>

                        )}

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() =>
                            deleteEmergency(
                              emergency.id
                            )
                          }
                          disabled={
                            deletingId === emergency.id ||
                            completingId === emergency.id
                          }
                          style={{
                            minWidth: "65px",
                            height: "30px",
                            padding: "0 10px",
                            border: "1px solid #dc2626",
                            borderRadius: "7px",
                            background: "#ffffff",
                            color: "#dc2626",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor:
                              deletingId === emergency.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              deletingId === emergency.id
                                ? 0.6
                                : 1,
                            transition: "0.2s ease",
                          }}
                        >
                          {deletingId === emergency.id
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