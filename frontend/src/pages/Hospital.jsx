import { useCallback, useEffect, useState } from "react";
import "./Hospital.css";

const API_URL = "http://127.0.0.1:8000";

function Hospital({ onNavigate }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contact: "",
    available_beds: "",
    latitude: "",
    longitude: "",
    status: "Available",
  });

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  // ==========================================
  // FETCH HOSPITALS
  // ==========================================

  const fetchHospitals = useCallback(async () => {
    try {
      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const response = await fetch(`${API_URL}/hospitals`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view hospitals."
          );
        }

        throw new Error(
          data?.detail || "Failed to load hospitals."
        );
      }

      /*
       * Backend currently returns:
       *
       * {
       *   logged_in_as: "...",
       *   hospitals: [...]
       * }
       *
       * This also safely supports a direct array response.
       */

      const hospitalList = Array.isArray(data)
        ? data
        : Array.isArray(data?.hospitals)
          ? data.hospitals
          : [];

      setHospitals(hospitalList);
      setError("");
    } catch (err) {
      console.error("Hospital fetch error:", err);

      setError(
        err?.message || "Unable to load hospitals."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHospitals();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchHospitals]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const total = hospitals.length;

  const available = hospitals.filter(
    (hospital) =>
      hospital.status?.toLowerCase() === "available"
  ).length;

  const limited = hospitals.filter((hospital) => {
    const beds = Number(hospital.available_beds || 0);

    return (
      beds > 0 &&
      beds <= 10 &&
      hospital.status?.toLowerCase() !== "unavailable"
    );
  }).length;

  const full = hospitals.filter((hospital) => {
    const beds = Number(hospital.available_beds || 0);
    const normalizedStatus =
      hospital.status?.toLowerCase();

    return (
      beds === 0 ||
      normalizedStatus === "unavailable" ||
      normalizedStatus === "full"
    );
  }).length;

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // OPEN ADD FORM
  // ==========================================

  const openAddForm = () => {
    setEditingHospital(null);

    setFormData({
      name: "",
      location: "",
      contact: "",
      available_beds: "",
      latitude: "",
      longitude: "",
      status: "Available",
    });

    setShowForm(true);
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const openEditForm = (hospital) => {
    setEditingHospital(hospital);

    setFormData({
      name: hospital.name || "",
      location: hospital.location || "",
      contact: hospital.contact || "",
      available_beds:
        hospital.available_beds ?? "",
      latitude:
        hospital.latitude ?? "",
      longitude:
        hospital.longitude ?? "",
      status:
        hospital.status || "Available",
    });

    setShowForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    setShowForm(false);
    setEditingHospital(null);

    setFormData({
      name: "",
      location: "",
      contact: "",
      available_beds: "",
      latitude: "",
      longitude: "",
      status: "Available",
    });
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!token) {
        throw new Error(
          "Session expired. Please login again."
        );
      }

      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        contact: formData.contact.trim(),
        available_beds:
          Number(formData.available_beds),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        status: formData.status,
      };

      if (!payload.name) {
        throw new Error(
          "Hospital name is required."
        );
      }

      if (!payload.location) {
        throw new Error(
          "Hospital location is required."
        );
      }

      if (!payload.contact) {
        throw new Error(
          "Hospital contact is required."
        );
      }

      if (
        !Number.isFinite(payload.available_beds) ||
        payload.available_beds < 0
      ) {
        throw new Error(
          "Available beds must be 0 or greater."
        );
      }

      if (
        !Number.isFinite(payload.latitude) ||
        !Number.isFinite(payload.longitude)
      ) {
        throw new Error(
          "Please enter valid latitude and longitude."
        );
      }

      const isEditing =
        Boolean(editingHospital);

      const url = isEditing
        ? `${API_URL}/hospitals/${editingHospital.id}`
        : `${API_URL}/hospitals`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Failed to ${
              isEditing
                ? "update"
                : "create"
            } hospital.`
        );
      }

      closeForm();

      await fetchHospitals();
    } catch (err) {
      console.error(
        "Save hospital error:",
        err
      );

      alert(
        err?.message ||
          "Unable to save hospital."
      );
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (hospital) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${hospital.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      if (!token) {
        throw new Error(
          "Session expired. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/hospitals/${hospital.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to delete hospital."
        );
      }

      // Immediately remove deleted hospital
      // from the current UI.
      setHospitals((current) =>
        current.filter(
          (item) =>
            item.id !== hospital.id
        )
      );
    } catch (err) {
      console.error(
        "Delete hospital error:",
        err
      );

      alert(
        err?.message ||
          "Unable to delete hospital."
      );
    }
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    const normalized =
      status?.toLowerCase();

    if (normalized === "available") {
      return "available";
    }

    if (
      normalized === "full" ||
      normalized === "unavailable"
    ) {
      return "full";
    }

    if (
      normalized === "limited" ||
      normalized === "busy"
    ) {
      return "limited";
    }

    return "unknown";
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="hospital-page">

        <div className="hospital-loading">

          <div className="loading-icon">
            🏥
          </div>

          <h2>
            Loading Hospitals...
          </h2>

          <p>
            Fetching connected hospital
            information.
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="hospital-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="hospital-header">

        <div className="hospital-header-left">

          <button
            className="back-dashboard"
            onClick={() => {
              if (onNavigate) {
                onNavigate("/dashboard");
              } else {
                window.location.href =
                  "/dashboard";
              }
            }}
          >
            ← Dashboard
          </button>

          <div>

            <h1>
              Hospitals
            </h1>

            <p>
              Manage and monitor connected
              RapidResQ hospitals
            </p>

          </div>

        </div>

        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={fetchHospitals}
          >
            ↻ Refresh
          </button>

          <button
            className="add-hospital-button"
            onClick={openAddForm}
          >
            + Add Hospital
          </button>

        </div>

      </header>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="hospital-error">

          <span>⚠️</span>

          <div>

            <strong>
              Unable to load hospitals
            </strong>

            <p>
              {error}
            </p>

          </div>

          <button
            onClick={fetchHospitals}
          >
            Try Again
          </button>

        </div>
      )}

      {/* =========================
          STATISTICS
      ========================= */}

      <section className="hospital-stats">

        <div className="hospital-stat-card total-card">

          <div className="hospital-stat-icon">
            🏥
          </div>

          <div>

            <span>
              Total Hospitals
            </span>

            <strong>
              {total}
            </strong>

            <small>
              Connected hospitals
            </small>

          </div>

        </div>

        <div className="hospital-stat-card available-card">

          <div className="hospital-stat-icon">
            ✓
          </div>

          <div>

            <span>
              Available
            </span>

            <strong>
              {available}
            </strong>

            <small>
              Operational hospitals
            </small>

          </div>

        </div>

        <div className="hospital-stat-card limited-card">

          <div className="hospital-stat-icon">
            🛏️
          </div>

          <div>

            <span>
              Limited Beds
            </span>

            <strong>
              {limited}
            </strong>

            <small>
              Low bed availability
            </small>

          </div>

        </div>

        <div className="hospital-stat-card full-card">

          <div className="hospital-stat-icon">
            ⚠️
          </div>

          <div>

            <span>
              Full / Unavailable
            </span>

            <strong>
              {full}
            </strong>

            <small>
              Require attention
            </small>

          </div>

        </div>

      </section>

      {/* =========================
          HOSPITAL TABLE
      ========================= */}

      <section className="hospitals-card">

        <div className="hospitals-card-header">

          <div>

            <h2>
              Hospital Network
            </h2>

            <p>
              All connected hospitals in
              RapidResQ
            </p>

          </div>

          <span className="hospital-count">

            {total}{" "}

            {total === 1
              ? "hospital"
              : "hospitals"}

          </span>

        </div>

        {hospitals.length === 0 ? (

          <div className="empty-hospitals">

            <div>
              🏥
            </div>

            <h3>
              No hospitals found
            </h3>

            <p>
              There are currently no hospitals
              registered in the system.
            </p>

            <button
              onClick={openAddForm}
            >
              + Add First Hospital
            </button>

          </div>

        ) : (

          <div className="hospital-table-wrapper">

            <table className="hospital-table">

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Hospital
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Available Beds
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    GPS
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {hospitals.map(
                  (hospital) => (

                    <tr
                      key={hospital.id}
                    >

                      <td>

                        <span className="hospital-id">

                          #
                          {String(
                            hospital.id
                          ).padStart(
                            3,
                            "0"
                          )}

                        </span>

                      </td>

                      <td>

                        <div className="hospital-name-cell">

                          <div className="hospital-icon">
                            🏥
                          </div>

                          <div>

                            <strong>
                              {hospital.name}
                            </strong>

                            <small>
                              Medical facility
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="location-cell">

                          <span>
                            📍
                          </span>

                          <span>
                            {hospital.location ||
                              "Unknown"}
                          </span>

                        </div>

                      </td>

                      <td>

                        <div className="contact-cell">

                          📞{" "}
                          {hospital.contact ||
                            "N/A"}

                        </div>

                      </td>

                      <td>

                        <div className="beds-cell">

                          <strong>
                            {hospital.available_beds}
                          </strong>

                          <span>
                            beds available
                          </span>

                        </div>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${getStatusClass(
                            hospital.status
                          )}`}
                        >

                          <span className="status-dot"></span>

                          {hospital.status ||
                            "Unknown"}

                        </span>

                      </td>

                      <td>

                        <div className="coordinates">

                          <span>
                            {hospital.latitude}
                          </span>

                          <span>
                            {hospital.longitude}
                          </span>

                        </div>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditForm(
                                hospital
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                hospital
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

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
            className="hospital-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>

                  {editingHospital
                    ? "Edit Hospital"
                    : "Add Hospital"}

                </h2>

                <p>

                  {editingHospital
                    ? "Update hospital information"
                    : "Register a new hospital"}

                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                type="button"
              >
                ×
              </button>

            </div>

            <form
              className="hospital-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Hospital Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. City Care Hospital"
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
                  placeholder="e.g. Shivajinagar, Pune"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Contact Number
                </label>

                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="e.g. 020-12345678"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Available Beds
                </label>

                <input
                  type="number"
                  min="0"
                  name="available_beds"
                  value={
                    formData.available_beds
                  }
                  onChange={handleInputChange}
                  placeholder="e.g. 50"
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
                    value={
                      formData.latitude
                    }
                    onChange={
                      handleInputChange
                    }
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
                    value={
                      formData.longitude
                    }
                    onChange={
                      handleInputChange
                    }
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

                  <option value="Limited">
                    Limited
                  </option>

                  <option value="Full">
                    Full
                  </option>

                  <option value="Unavailable">
                    Unavailable
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

                  {editingHospital
                    ? "Save Changes"
                    : "Add Hospital"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Hospital;