import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const EMPTY_FORM = {
  patient_name: "",
  phone: "",
  emergency_type: "",
  location: "",
  severity: "High",
  latitude: "",
  longitude: "",
};

function CitizenDashboard({ onLogout }) {
  const [emergency, setEmergency] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken = () => {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  // ==========================================================
  // GET EMERGENCY ID
  // ==========================================================

  const getEmergencyId = () => {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("emergency_id") ||
      params.get("emergencyId") ||
      params.get("id") ||
      localStorage.getItem("emergency_id") ||
      localStorage.getItem("emergencyId") ||
      localStorage.getItem("current_emergency_id") ||
      ""
    );
  };

  // ==========================================================
  // SAVE EMERGENCY ID
  // ==========================================================

  const saveEmergencyId = (id) => {
    if (!id) {
      return;
    }

    const stringId = String(id);

    localStorage.setItem("emergency_id", stringId);
    localStorage.setItem("emergencyId", stringId);
    localStorage.setItem("current_emergency_id", stringId);

    const url = new URL(window.location.href);

    url.searchParams.set("emergency_id", stringId);

    window.history.replaceState({}, "", url.toString());
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    const keys = [
      "access_token",
      "token",
      "user_role",
      "user_email",
      "emergency_id",
      "emergencyId",
      "current_emergency_id",
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    window.location.assign("/");
  };

  // ==========================================================
  // API ERROR MESSAGE
  // ==========================================================

  const getApiErrorMessage = (data, fallback) => {
    if (!data) {
      return fallback;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          const field = Array.isArray(item?.loc)
            ? item.loc[item.loc.length - 1]
            : "field";

          return `${field}: ${item?.msg || "Invalid value"}`;
        })
        .join(" | ");
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return fallback;
  };

  // ==========================================================
  // LOAD SINGLE EMERGENCY
  // ==========================================================

  const loadEmergency = async (idOverride = null) => {
    const token = getToken();

    if (!token) {
      setError("No authentication token found. Please login again.");
      setLoading(false);
      return;
    }

    const id = idOverride || getEmergencyId();

    // Citizen can open dashboard even without an emergency.
    if (!id) {
      setEmergency(null);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

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
          throw new Error(
            "You do not have permission to view this emergency."
          );
        }

        if (response.status === 404) {
          throw new Error(`Emergency #${id} was not found.`);
        }

        throw new Error(
          getApiErrorMessage(
            data,
            `Unable to load emergency (${response.status}).`
          )
        );
      }

      setEmergency(data);
      saveEmergencyId(data?.id || id);
    } catch (err) {
      console.error("Emergency fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load emergency."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      const token = getToken();

      if (!token) {
        if (!cancelled) {
          setError(
            "No authentication token found. Please login again."
          );
          setLoading(false);
        }

        return;
      }

      const id = getEmergencyId();

      // No emergency yet is NOT an error.
      if (!id) {
        if (!cancelled) {
          setEmergency(null);
          setError("");
          setLoading(false);
        }

        return;
      }

      try {
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
          let message;

          if (response.status === 401) {
            message = "Session expired. Please login again.";
          } else if (response.status === 403) {
            message =
              "You do not have permission to view this emergency.";
          } else if (response.status === 404) {
            message = `Emergency #${id} was not found.`;
          } else {
            message = getApiErrorMessage(
              data,
              `Unable to load emergency (${response.status}).`
            );
          }

          throw new Error(message);
        }

        if (!cancelled) {
          setEmergency(data);
          setError("");

          if (data?.id) {
            saveEmergencyId(data.id);
          }
        }
      } catch (err) {
        console.error("Initial emergency load error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load emergency."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  // ==========================================================
  // OPEN CREATE FORM
  // ==========================================================

  const openCreateForm = () => {
    setFormError("");
    setLocationMessage("");

    setForm({
      ...EMPTY_FORM,
    });

    setShowCreateForm(true);
  };

  // ==========================================================
  // CLOSE CREATE FORM
  // ==========================================================

  const closeCreateForm = () => {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    setFormError("");
    setLocationMessage("");

    setForm({
      ...EMPTY_FORM,
    });
  };

  // ==========================================================
  // GET CURRENT LOCATION FOR FORM
  // ==========================================================

  const useCurrentLocation = () => {
    setFormError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setFormError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude.toFixed(6);

        const longitude =
          position.coords.longitude.toFixed(6);

        setForm((current) => ({
          ...current,
          latitude,
          longitude,
        }));

        setLocationMessage(
          "Current location detected successfully."
        );

        setLocationLoading(false);
      },
      (geoError) => {
        const messages = {
          1: "Location permission was denied. Allow location access and try again.",
          2: "Your current location could not be determined.",
          3: "Location request timed out. Please try again.",
        };

        setFormError(
          messages[geoError.code] ||
            "Unable to get your current location."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // ==========================================================
  // CREATE NEW EMERGENCY
  // ==========================================================

  const createEmergency = async (event) => {
    event.preventDefault();

    if (creating) {
      return;
    }

    setFormError("");
    setError("");

    const patientName = form.patient_name.trim();
    const phone = form.phone.trim();
    const emergencyType =
      form.emergency_type.trim();
    const location = form.location.trim();

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!patientName) {
      setFormError("Please enter the patient's name.");
      return;
    }

    if (!phone) {
      setFormError("Please enter a phone number.");
      return;
    }

    if (!emergencyType) {
      setFormError("Please enter the emergency type.");
      return;
    }

    if (!location) {
      setFormError("Please enter the emergency location.");
      return;
    }

    if (!form.severity) {
      setFormError("Please select a severity.");
      return;
    }

    if (
      form.latitude.trim() === "" ||
      form.longitude.trim() === ""
    ) {
      setFormError(
        "Please provide your location using GPS or enter latitude and longitude manually."
      );
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setFormError(
        "Latitude and longitude must be valid numbers."
      );
      return;
    }

    if (latitude < -90 || latitude > 90) {
      setFormError("Latitude must be between -90 and 90.");
      return;
    }

    if (longitude < -180 || longitude > 180) {
      setFormError(
        "Longitude must be between -180 and 180."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setFormError(
        "You are not logged in. Please login again."
      );
      return;
    }

    // --------------------------------------------------------
    // CREATE REQUEST
    // --------------------------------------------------------

    try {
      setCreating(true);

      const response = await fetch(
        `${API_URL}/emergencies`,
        {
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
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            `Failed to create emergency (${response.status}).`
          )
        );
      }

      // ------------------------------------------------------
      // GET CREATED EMERGENCY ID
      // ------------------------------------------------------

      const createdEmergency =
        data?.data || data?.emergency || data;

      const newEmergencyId =
        createdEmergency?.id ||
        data?.id ||
        null;

      if (!newEmergencyId) {
        throw new Error(
          "Emergency was created, but the server did not return an emergency ID."
        );
      }

      // ------------------------------------------------------
      // SAVE NEW ID
      // ------------------------------------------------------

      saveEmergencyId(newEmergencyId);

      // ------------------------------------------------------
      // CLOSE FORM
      // ------------------------------------------------------

      setShowCreateForm(false);
      setFormError("");
      setForm({
        ...EMPTY_FORM,
      });

      // ------------------------------------------------------
      // LOAD COMPLETE EMERGENCY DETAILS
      // ------------------------------------------------------

      await loadEmergency(newEmergencyId);
    } catch (err) {
      console.error("Create emergency error:", err);

      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create emergency."
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingIcon}>🚑</div>

        <h2 style={{ margin: 0 }}>
          Loading RapidResQ...
        </h2>

        <p style={styles.muted}>
          Preparing your citizen dashboard.
        </p>
      </div>
    );
  }

  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error && !emergency) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div>
            <strong style={styles.brand}>
              RapidResQ AI 🚑
            </strong>

            <small style={styles.small}>
              Citizen Dashboard
            </small>
          </div>

          <button
            type="button"
            style={styles.logout}
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <main style={styles.container}>
          <div style={styles.errorCard}>
            <div style={{ fontSize: 42 }}>
              ⚠️
            </div>

            <h2>
              Unable to load dashboard
            </h2>

            <p style={styles.muted}>
              {error}
            </p>

            <div style={styles.buttonRow}>
              <button
                type="button"
                style={styles.primary}
                onClick={() => loadEmergency()}
              >
                ↻ Try Again
              </button>

              <button
                type="button"
                style={styles.secondary}
                onClick={openCreateForm}
              >
                🚨 Create Emergency
              </button>
            </div>
          </div>
        </main>

        {showCreateForm && (
          <CreateEmergencyModal
            form={form}
            creating={creating}
            formError={formError}
            locationLoading={locationLoading}
            locationMessage={locationMessage}
            onChange={handleFormChange}
            onSubmit={createEmergency}
            onClose={closeCreateForm}
            onUseCurrentLocation={useCurrentLocation}
          />
        )}
      </div>
    );
  }

  // ==========================================================
  // AMBULANCE DATA
  // ==========================================================

  const ambulance =
    emergency?.ambulance || null;

  const distance =
    ambulance?.distance_km != null
      ? `${Number(
          ambulance.distance_km
        ).toFixed(2)} km`
      : "—";

  const eta =
    ambulance?.estimated_arrival_minutes != null
      ? `${Math.max(
          0,
          Math.round(
            Number(
              ambulance.estimated_arrival_minutes
            )
          )
        )} minutes`
      : "—";

  // ==========================================================
  // MAIN DASHBOARD
  // ==========================================================

  return (
    <div style={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header style={styles.header}>
        <div>
          <strong style={styles.brand}>
            RapidResQ AI 🚑
          </strong>

          <small style={styles.small}>
            Citizen Dashboard
          </small>
        </div>

        <button
          type="button"
          style={styles.logout}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main style={styles.container}>
        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <div style={styles.topRow}>
          <div>
            <h1 style={styles.title}>
              {emergency
                ? `Emergency #${emergency.id}`
                : "Citizen Dashboard"}
            </h1>

            <p style={styles.muted}>
              {emergency
                ? "Real-time emergency response information"
                : "Manage your RapidResQ emergency requests"}
            </p>
          </div>

          <div style={styles.buttonRow}>
            {emergency && (
              <button
                type="button"
                style={styles.secondary}
                onClick={() => loadEmergency()}
              >
                ↻ Refresh
              </button>
            )}

            <button
              type="button"
              style={styles.primary}
              onClick={openCreateForm}
            >
              🚨 Create New Emergency
            </button>
          </div>
        </div>

        {/* ====================================================
            GENERAL ERROR
        ==================================================== */}

        {error && emergency && (
          <div style={styles.warning}>
            ⚠️ {error}
          </div>
        )}

        {/* ====================================================
            NO EMERGENCY STATE
        ==================================================== */}

        {!emergency && (
          <section style={styles.emptyDashboard}>
            <div style={styles.bigEmergencyIcon}>
              🚨
            </div>

            <h2 style={{ margin: "10px 0 8px" }}>
              No Active Emergency
            </h2>

            <p style={styles.muted}>
              You currently do not have an emergency
              request registered with RapidResQ.
            </p>

            <button
              type="button"
              style={styles.primary}
              onClick={openCreateForm}
            >
              🚨 Create New Emergency
            </button>
          </section>
        )}

        {/* ====================================================
            EMERGENCY STATUS
        ==================================================== */}

        {emergency && (
          <>
            <section style={styles.card}>
              <span style={styles.label}>
                EMERGENCY STATUS
              </span>

              <div style={styles.statusRow}>
                <span style={styles.status}>
                  {emergency.status || "Unknown"}
                </span>

                <span style={styles.severity}>
                  {emergency.severity || "Unknown"} Severity
                </span>
              </div>

              <div style={styles.emergencyInfo}>
                <strong>
                  {emergency.emergency_type ||
                    "Emergency"}
                </strong>

                <span>
                  {emergency.location ||
                    "Location unavailable"}
                </span>
              </div>
            </section>

            {/* ==================================================
                ASSIGNED AMBULANCE
            ================================================== */}

            <section style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.label}>
                    ASSIGNED AMBULANCE
                  </span>

                  <h2 style={styles.cardTitle}>
                    🚑{" "}
                    {ambulance?.vehicle ||
                      (ambulance?.id
                        ? `Ambulance #${String(
                            ambulance.id
                          ).padStart(3, "0")}`
                        : "Not assigned")}
                  </h2>
                </div>

                <span style={styles.ambulanceStatus}>
                  {ambulance?.status ||
                    "Not assigned"}
                </span>
              </div>

              {ambulance ? (
                <>
                  <div style={styles.grid3}>
                    <Info
                      label="Vehicle"
                      value={ambulance.vehicle}
                    />

                    <Info
                      label="Ambulance ID"
                      value={ambulance.id}
                    />

                    <Info
                      label="Location"
                      value={ambulance.location}
                    />
                  </div>

                  <div style={styles.locationBox}>
                    <h3 style={{ margin: 0 }}>
                      📍 Ambulance Location
                    </h3>

                    <p style={styles.muted}>
                      Current ambulance GPS coordinates
                    </p>

                    <div style={styles.grid2}>
                      <Info
                        label="Latitude"
                        value={formatCoord(
                          ambulance.latitude
                        )}
                      />

                      <Info
                        label="Longitude"
                        value={formatCoord(
                          ambulance.longitude
                        )}
                      />
                    </div>
                  </div>

                  <div style={styles.grid2}>
                    <Metric
                      icon="📏"
                      label="Distance to emergency"
                      value={distance}
                    />

                    <Metric
                      icon="⏱"
                      label="Estimated arrival"
                      value={eta}
                    />
                  </div>
                </>
              ) : (
                <div style={styles.empty}>
                  <div style={{ fontSize: 38 }}>
                    🚑
                  </div>

                  <h3>
                    Ambulance not assigned yet
                  </h3>

                  <p style={styles.muted}>
                    RapidResQ will assign an available
                    ambulance when one is available.
                  </p>
                </div>
              )}
            </section>

            {/* ==================================================
                HOSPITAL
            ================================================== */}

            <section style={styles.card}>
              <span style={styles.label}>
                HOSPITAL
              </span>

              <h2 style={styles.cardTitle}>
                🏥 Hospital Assignment
              </h2>

              <div style={styles.grid2}>
                <Info
                  label="Hospital ID"
                  value={
                    emergency.hospital_id ??
                    "Not assigned"
                  }
                />

                <Info
                  label="Assignment Status"
                  value={
                    emergency.hospital_id
                      ? "Hospital Assigned"
                      : "Pending Assignment"
                  }
                />
              </div>
            </section>

            {/* ==================================================
                EMERGENCY LOCATION
            ================================================== */}

            <section style={styles.card}>
              <span style={styles.label}>
                EMERGENCY LOCATION
              </span>

              <h2 style={styles.cardTitle}>
                📍 Your Emergency Location
              </h2>

              <div style={styles.grid3}>
                <Info
                  label="Location"
                  value={emergency.location}
                />

                <Info
                  label="Latitude"
                  value={formatCoord(
                    emergency.latitude
                  )}
                />

                <Info
                  label="Longitude"
                  value={formatCoord(
                    emergency.longitude
                  )}
                />
              </div>
            </section>

            {/* ==================================================
                DEVICE LOCATION
            ================================================== */}

            <section style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.label}>
                    DEVICE LOCATION
                  </span>

                  <h2 style={styles.cardTitle}>
                    📡 Current Location
                  </h2>
                </div>

                <button
                  type="button"
                  style={{
                    ...styles.primary,
                    opacity:
                      locationLoading
                        ? 0.65
                        : 1,
                  }}
                  onClick={useCurrentLocationForDashboard}
                  disabled={locationLoading}
                >
                  {locationLoading
                    ? "Detecting..."
                    : "Get Current Location"}
                </button>
              </div>

              {locationMessage && (
                <p style={styles.message}>
                  {locationMessage}
                </p>
              )}
            </section>

            {/* ==================================================
                PATIENT INFORMATION
            ================================================== */}

            <section style={styles.card}>
              <span style={styles.label}>
                PATIENT INFORMATION
              </span>

              <div style={styles.grid4}>
                <Info
                  label="Patient"
                  value={emergency.patient_name}
                />

                <Info
                  label="Phone"
                  value={emergency.phone}
                />

                <Info
                  label="Emergency Type"
                  value={emergency.emergency_type}
                />

                <Info
                  label="Hospital ID"
                  value={
                    emergency.hospital_id ??
                    "Not assigned"
                  }
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* ======================================================
          CREATE EMERGENCY MODAL
      ====================================================== */}

      {showCreateForm && (
        <CreateEmergencyModal
          form={form}
          creating={creating}
          formError={formError}
          locationLoading={locationLoading}
          locationMessage={locationMessage}
          onChange={handleFormChange}
          onSubmit={createEmergency}
          onClose={closeCreateForm}
          onUseCurrentLocation={useCurrentLocation}
        />
      )}
    </div>
  );

  // ==========================================================
  // CURRENT LOCATION FOR EXISTING DASHBOARD
  // ==========================================================

  function useCurrentLocationForDashboard() {
    setLocationMessage("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationMessage(
        "Geolocation is not supported by this browser."
      );
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationMessage(
          `Current location: ${position.coords.latitude.toFixed(
            6
          )}, ${position.coords.longitude.toFixed(6)}`
        );

        setLocationLoading(false);
      },
      (geoError) => {
        const messages = {
          1: "Location permission was denied.",
          2: "Your current location could not be determined.",
          3: "Location request timed out.",
        };

        setLocationMessage(
          messages[geoError.code] ||
            "Unable to get your current location."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }
}

// ============================================================
// CREATE EMERGENCY MODAL
// ============================================================

function CreateEmergencyModal({
  form,
  creating,
  formError,
  locationLoading,
  locationMessage,
  onChange,
  onSubmit,
  onClose,
  onUseCurrentLocation,
}) {
  return (
    <div
      style={styles.modalOverlay}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !creating
        ) {
          onClose();
        }
      }}
    >
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              🚨 Create New Emergency
            </h2>

            <p style={styles.muted}>
              Submit an emergency request to RapidResQ.
            </p>
          </div>

          <button
            type="button"
            style={styles.closeButton}
            onClick={onClose}
            disabled={creating}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* ==================================================
              PATIENT NAME
          ================================================== */}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Patient Name
            </label>

            <input
              type="text"
              name="patient_name"
              value={form.patient_name}
              onChange={onChange}
              placeholder="Enter patient name"
              style={styles.input}
              disabled={creating}
            />
          </div>

          {/* ==================================================
              PHONE
          ================================================== */}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="Enter phone number"
              style={styles.input}
              disabled={creating}
            />
          </div>

          {/* ==================================================
              EMERGENCY TYPE
          ================================================== */}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Emergency Type
            </label>

            <input
              type="text"
              name="emergency_type"
              value={form.emergency_type}
              onChange={onChange}
              placeholder="Example: Accident, Medical, Fire"
              style={styles.input}
              disabled={creating}
            />
          </div>

          {/* ==================================================
              LOCATION
          ================================================== */}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Emergency Location
            </label>

            <input
              type="text"
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="Example: Pune"
              style={styles.input}
              disabled={creating}
            />
          </div>

          {/* ==================================================
              SEVERITY
          ================================================== */}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Severity
            </label>

            <select
              name="severity"
              value={form.severity}
              onChange={onChange}
              style={styles.input}
              disabled={creating}
            >
              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>

              <option value="Critical">
                Critical
              </option>
            </select>

            <small style={styles.helperText}>
              RapidResQ will determine the final severity
              using the backend AI service.
            </small>
          </div>

          {/* ==================================================
              GPS BUTTON
          ================================================== */}

          <div style={styles.locationActionBox}>
            <div>
              <strong>
                📍 Emergency Coordinates
              </strong>

              <p style={styles.muted}>
                Use your current GPS location or enter
                coordinates manually.
              </p>
            </div>

            <button
              type="button"
              style={styles.secondary}
              onClick={onUseCurrentLocation}
              disabled={creating || locationLoading}
            >
              {locationLoading
                ? "Detecting..."
                : "📍 Use Current Location"}
            </button>
          </div>

          {locationMessage && (
            <div style={styles.successMessage}>
              ✓ {locationMessage}
            </div>
          )}

          {/* ==================================================
              LATITUDE / LONGITUDE
          ================================================== */}

          <div style={styles.grid2}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Latitude
              </label>

              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={onChange}
                placeholder="18.5204"
                style={styles.input}
                disabled={creating}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Longitude
              </label>

              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={onChange}
                placeholder="73.8567"
                style={styles.input}
                disabled={creating}
              />
            </div>
          </div>

          {/* ==================================================
              FORM ERROR
          ================================================== */}

          {formError && (
            <div style={styles.formError}>
              ⚠️ {formError}
            </div>
          )}

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div style={styles.modalActions}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                ...styles.primary,
                opacity: creating ? 0.7 : 1,
              }}
              disabled={creating}
            >
              {creating
                ? "Creating Emergency..."
                : "🚨 Create Emergency"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// FORMAT COORDINATE
// ============================================================

function formatCoord(value) {
  return value == null ||
    Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(4);
}

// ============================================================
// INFO COMPONENT
// ============================================================

function Info({ label, value }) {
  return (
    <div style={styles.info}>
      <span style={styles.infoLabel}>
        {label}
      </span>

      <strong style={styles.infoValue}>
        {value ?? "—"}
      </strong>
    </div>
  );
}

// ============================================================
// METRIC COMPONENT
// ============================================================

function Metric({ icon, label, value }) {
  return (
    <div style={styles.metric}>
      <div style={{ fontSize: 25 }}>
        {icon}
      </div>

      <span style={styles.infoLabel}>
        {label}
      </span>

      <strong style={styles.metricValue}>
        {value}
      </strong>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 8,
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, sans-serif",
  },

  loadingIcon: {
    fontSize: 46,
  },

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

  brand: {
    display: "block",
    fontSize: 22,
  },

  small: {
    display: "block",
    marginTop: 4,
    color: "#6b7280",
    fontSize: 13,
  },

  container: {
    width: "min(1100px, 92%)",
    margin: "0 auto",
    padding: "30px 0 50px",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    marginBottom: 20,
  },

  title: {
    margin: 0,
    fontSize: 30,
  },

  muted: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.5,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
    boxShadow:
      "0 5px 18px rgba(15,23,42,.05)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  cardTitle: {
    margin: "5px 0 0",
    fontSize: 21,
  },

  label: {
    display: "block",
    color: "#6b7280",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
  },

  statusRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    margin: "10px 0",
  },

  status: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 999,
    padding: "7px 12px",
    fontWeight: 800,
    fontSize: 13,
  },

  severity: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 999,
    padding: "7px 12px",
    fontWeight: 800,
    fontSize: 13,
  },

  ambulanceStatus: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 999,
    padding: "7px 12px",
    fontWeight: 800,
    fontSize: 13,
  },

  emergencyInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 14,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: 12,
  },

  grid3: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: 12,
  },

  grid4: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",
    gap: 12,
    marginTop: 15,
  },

  info: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 11,
    padding: 14,
    minWidth: 0,
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 6,
  },

  infoValue: {
    display: "block",
    color: "#111827",
    fontSize: 15,
    overflowWrap: "anywhere",
  },

  locationBox: {
    background: "#fbfdff",
    border: "1px solid #e5e7eb",
    borderRadius: 13,
    padding: 17,
    margin: "16px 0",
  },

  metric: {
    border: "1px solid #e5e7eb",
    borderRadius: 13,
    padding: 18,
    background: "#fff",
  },

  metricValue: {
    display: "block",
    fontSize: 24,
    marginTop: 3,
  },

  empty: {
    textAlign: "center",
    padding: 28,
    background: "#fafafa",
    border: "1px dashed #d1d5db",
    borderRadius: 13,
  },

  emptyDashboard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 60,
    textAlign: "center",
    boxShadow:
      "0 5px 18px rgba(15,23,42,.05)",
  },

  bigEmergencyIcon: {
    fontSize: 60,
  },

  message: {
    padding: 11,
    background: "#f1f5f9",
    borderRadius: 9,
    color: "#475569",
    fontSize: 13,
  },

  warning: {
    padding: 14,
    marginBottom: 18,
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
  },

  successMessage: {
    marginTop: 10,
    marginBottom: 12,
    padding: 11,
    background: "#f0fdf4",
    color: "#166534",
    border:
      "1px solid #bbf7d0",
    borderRadius: 9,
    fontSize: 13,
  },

  formError: {
    marginTop: 15,
    padding: 12,
    background: "#fef2f2",
    color: "#991b1b",
    border:
      "1px solid #fecaca",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
  },

  buttonRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  primary: {
    border: 0,
    background: "#dc2626",
    color: "#fff",
    borderRadius: 9,
    padding: "11px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondary: {
    border:
      "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    borderRadius: 9,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  logout: {
    border:
      "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 9,
    padding: "10px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  errorCard: {
    maxWidth: 650,
    margin: "70px auto",
    padding: 35,
    background: "#fff",
    border:
      "1px solid #fecaca",
    borderRadius: 16,
    textAlign: "center",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(15,23,42,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
    overflowY: "auto",
  },

  modal: {
    width: "min(720px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 18,
    padding: 24,
    boxShadow:
      "0 20px 60px rgba(0,0,0,.2)",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    marginBottom: 20,
  },

  modalTitle: {
    margin: 0,
    fontSize: 24,
  },

  closeButton: {
    width: 38,
    height: 38,
    border:
      "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 9,
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
  },

  formGroup: {
    marginBottom: 16,
  },

  formLabel: {
    display: "block",
    marginBottom: 7,
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d1d5db",
    borderRadius: 9,
    padding: "12px 13px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#111827",
  },

  helperText: {
    display: "block",
    marginTop: 6,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 1.4,
  },

  locationActionBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    background: "#f8fafc",
    border:
      "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
    paddingTop: 18,
    borderTop:
      "1px solid #e5e7eb",
  },

  cancelButton: {
    border:
      "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    borderRadius: 9,
    padding: "11px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default CitizenDashboard;