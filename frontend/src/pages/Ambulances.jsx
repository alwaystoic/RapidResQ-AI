import { useCallback, useEffect, useState } from "react";
import "./Ambulances.css";

function Ambulances({ onNavigate }) {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);

  const [formData, setFormData] = useState({
    vehicle: "",
    location: "",
    latitude: "",
    longitude: "",
    status: "Available",
  });

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  // =========================
  // FETCH AMBULANCES
  // =========================

  const fetchAmbulances = useCallback(async () => {
  try {
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(
      "http://127.0.0.1:8000/ambulances",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view ambulances."
          );
        }

        throw new Error("Failed to load ambulances.");
      }

      const data = await response.json();

      setAmbulances(data.ambulances || []);
    } catch (err) {
      console.error("Ambulance error:", err);
      setError(err.message);
      } finally {
    setLoading(false);
  }
}, [token]);

  useEffect(() => {
  const loadAmbulances = async () => {
    await fetchAmbulances();
  };

  loadAmbulances();
}, [fetchAmbulances]);
  // =========================
  // STATISTICS
  // =========================

  const total = ambulances.length;

  const available = ambulances.filter(
    (ambulance) =>
      ambulance.status?.toLowerCase() === "available"
  ).length;

  const busy = ambulances.filter(
    (ambulance) =>
      ambulance.status?.toLowerCase() === "busy"
  ).length;

  const maintenance = ambulances.filter(
    (ambulance) =>
      ambulance.status?.toLowerCase() === "maintenance"
  ).length;

  // =========================
  // FORM
  // =========================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingAmbulance(null);

    setFormData({
      vehicle: "",
      location: "",
      latitude: "",
      longitude: "",
      status: "Available",
    });

    setShowForm(true);
  };

  const openEditForm = (ambulance) => {
    setEditingAmbulance(ambulance);

    setFormData({
      vehicle: ambulance.vehicle || "",
      location: ambulance.location || "",
      latitude: ambulance.latitude ?? "",
      longitude: ambulance.longitude ?? "",
      status: ambulance.status || "Available",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAmbulance(null);
  };

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const url = editingAmbulance
        ? `http://127.0.0.1:8000/ambulances/${editingAmbulance.id}`
        : "http://127.0.0.1:8000/ambulances";

      const method = editingAmbulance ? "PUT" : "POST";

      const payload = {
        vehicle: formData.vehicle,
        location: formData.location,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        status: formData.status,
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail ||
            `Failed to ${
              editingAmbulance ? "update" : "create"
            } ambulance.`
        );
      }

      closeForm();
      await fetchAmbulances();
    } catch (err) {
      console.error("Save ambulance error:", err);
      alert(err.message);
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (ambulance) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${ambulance.vehicle}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/ambulances/${ambulance.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to delete ambulance."
        );
      }

      await fetchAmbulances();
    } catch (err) {
      console.error("Delete ambulance error:", err);
      alert(err.message);
    }
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status) => {
    const normalized = status?.toLowerCase();

    if (normalized === "available") {
      return "available";
    }

    if (normalized === "busy") {
      return "busy";
    }

    if (normalized === "maintenance") {
      return "maintenance";
    }

    return "unknown";
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="ambulances-page">
        <div className="ambulances-loading">
          <div className="loading-icon">🚑</div>
          <h2>Loading Ambulances...</h2>
          <p>Fetching the current ambulance fleet.</p>
        </div>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="ambulances-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="ambulances-header">

        <div className="ambulances-header-left">

          <button
            className="back-dashboard"
            onClick={() => {
              if (onNavigate) {
                onNavigate("/dashboard");
              } else {
                window.location.href = "/dashboard";
              }
            }}
          >
            ← Dashboard
          </button>

          <div>
            <h1>Ambulances</h1>

            <p>
              Manage and monitor the RapidResQ ambulance fleet
            </p>
          </div>

        </div>

        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={fetchAmbulances}
          >
            ↻ Refresh
          </button>

          <button
            className="add-ambulance-button"
            onClick={openAddForm}
          >
            + Add Ambulance
          </button>

        </div>

      </header>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="ambulance-error">
          <span>⚠️</span>
          <div>
            <strong>Unable to load ambulances</strong>
            <p>{error}</p>
          </div>

          <button onClick={fetchAmbulances}>
            Try Again
          </button>
        </div>
      )}

      {/* =========================
          STATISTICS
      ========================= */}

      <section className="ambulance-stats">

        <div className="ambulance-stat-card total-card">
          <div className="ambulance-stat-icon">
            🚑
          </div>

          <div>
            <span>Total Fleet</span>
            <strong>{total}</strong>
            <small>Registered ambulances</small>
          </div>
        </div>

        <div className="ambulance-stat-card available-card">
          <div className="ambulance-stat-icon">
            ✓
          </div>

          <div>
            <span>Available</span>
            <strong>{available}</strong>
            <small>Ready for dispatch</small>
          </div>
        </div>

        <div className="ambulance-stat-card busy-card">
          <div className="ambulance-stat-icon">
            🚨
          </div>

          <div>
            <span>Busy</span>
            <strong>{busy}</strong>
            <small>Currently assigned</small>
          </div>
        </div>

        <div className="ambulance-stat-card maintenance-card">
          <div className="ambulance-stat-icon">
            🔧
          </div>

          <div>
            <span>Maintenance</span>
            <strong>{maintenance}</strong>
            <small>Unavailable for service</small>
          </div>
        </div>

      </section>

      {/* =========================
          FLEET TABLE
      ========================= */}

      <section className="fleet-card">

        <div className="fleet-header">

          <div>
            <h2>Ambulance Fleet</h2>

            <p>
              All registered RapidResQ ambulances
            </p>
          </div>

          <span className="fleet-count">
            {total} {total === 1 ? "ambulance" : "ambulances"}
          </span>

        </div>

        {ambulances.length === 0 ? (

          <div className="empty-fleet">
            <div>🚑</div>

            <h3>No ambulances found</h3>

            <p>
              There are currently no ambulances registered
              in the system.
            </p>

            <button onClick={openAddForm}>
              + Add First Ambulance
            </button>
          </div>

        ) : (

          <div className="fleet-table-wrapper">

            <table className="fleet-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>GPS Coordinates</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {ambulances.map((ambulance) => (

                  <tr key={ambulance.id}>

                    <td>
                      <span className="ambulance-id">
                        #{String(ambulance.id).padStart(3, "0")}
                      </span>
                    </td>

                    <td>
                      <div className="vehicle-cell">

                        <div className="vehicle-icon">
                          🚑
                        </div>

                        <div>
                          <strong>
                            {ambulance.vehicle}
                          </strong>

                          <small>
                            Ambulance Unit
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <div className="location-cell">
                        <span>📍</span>
                        <span>
                          {ambulance.location || "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          ambulance.status
                        )}`}
                      >
                        <span className="status-dot"></span>
                        {ambulance.status || "Unknown"}
                      </span>
                    </td>

                    <td>
                      <div className="coordinates">
                        <span>
                          {ambulance.latitude}
                        </span>

                        <span>
                          {ambulance.longitude}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="edit-button"
                          onClick={() =>
                            openEditForm(ambulance)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(ambulance)
                          }
                        >
                          Delete
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

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showForm && (

        <div
          className="modal-overlay"
          onClick={closeForm}
        >

          <div
            className="ambulance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {editingAmbulance
                    ? "Edit Ambulance"
                    : "Add Ambulance"}
                </h2>

                <p>
                  {editingAmbulance
                    ? "Update ambulance information"
                    : "Register a new ambulance"}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
              >
                ×
              </button>

            </div>

            <form
              className="ambulance-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Vehicle ID
                </label>

                <input
                  type="text"
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  placeholder="e.g. MH12AB1234"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. FC Road, Pune"
                  required
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="18.5204"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="73.8567"
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Available">
                    Available
                  </option>

                  <option value="Busy">
                    Busy
                  </option>

                  <option value="Maintenance">
                    Maintenance
                  </option>
                </select>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingAmbulance
                    ? "Save Changes"
                    : "Add Ambulance"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Ambulances;