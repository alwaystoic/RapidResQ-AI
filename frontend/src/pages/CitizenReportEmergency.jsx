import { useState } from "react";
import { apiPost } from "../api";
import "./CitizenReportEmergency.css";

function CitizenReportEmergency({ onNavigate, onLogout }) {
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // GET CURRENT LOCATION
  // ==========================================================

  const getCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));

        setGettingLocation(false);

        if (!location) {
          setLocation("Current GPS Location");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);

        setGettingLocation(false);
        setError(
          "Unable to get your location. Please allow location access and try again."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ==========================================================
  // SUBMIT EMERGENCY
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!latitude || !longitude) {
      setError("Please provide your emergency location.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiPost("/emergencies", {
        patient_name: patientName,
        phone: phone,
        emergency_type: emergencyType,
        location: location,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      console.log("Emergency created successfully:", data);

      /*
       * The backend returns:
       * data.data.id
       *
       * Store it so the Citizen Dashboard can display
       * the newly created emergency.
       */
      if (data?.data?.id) {
        localStorage.setItem(
          "citizen_emergency_id",
          String(data.data.id)
        );
      }

      // Return to Citizen Dashboard
      if (typeof onNavigate === "function") {
        onNavigate("/citizen-dashboard");
      }
    } catch (err) {
      console.error("Emergency submission error:", err);

      setError(
        err?.message ||
          "Unable to connect to RapidResQ server. Make sure the backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="citizen-report-page">
      {/* HEADER */}
      <header className="citizen-report-header">
        <div
          className="citizen-report-brand"
          onClick={() => {
            if (typeof onNavigate === "function") {
              onNavigate("/citizen-dashboard");
            }
          }}
        >
          <div className="citizen-report-logo">+</div>

          <div>
            <h1>RapidResQ</h1>
            <p>Emergency Response System</p>
          </div>
        </div>

        <div className="citizen-report-header-actions">
          <button
            className="citizen-back-button"
            type="button"
            onClick={() => {
              if (typeof onNavigate === "function") {
                onNavigate("/citizen-dashboard");
              }
            }}
          >
            ← Back to Dashboard
          </button>

          <button
            className="citizen-logout-button"
            type="button"
            onClick={() => {
              if (typeof onLogout === "function") {
                onLogout();
              }
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="citizen-report-content">
        {/* PAGE HEADING */}
        <div className="citizen-report-heading">
          <h2>Report an Emergency</h2>
          <p>
            Provide the details below so emergency assistance can be
            dispatched quickly.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="citizen-report-error">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* FORM */}
        <form
          className="citizen-report-card"
          onSubmit={handleSubmit}
        >
          {/* PATIENT INFORMATION */}
          <section className="report-section">
            <div className="section-heading">
              <span>👤</span>

              <div>
                <h3>Patient Information</h3>
                <p>
                  Enter the details of the person requiring assistance.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="patientName">
                  Patient Name
                </label>

                <input
                  id="patientName"
                  type="text"
                  value={patientName}
                  onChange={(e) =>
                    setPatientName(e.target.value)
                  }
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
          </section>

          {/* EMERGENCY INFORMATION */}
          <section className="report-section">
            <div className="section-heading">
              <span>🥵</span>

              <div>
                <h3>Emergency Information</h3>
                <p>
                  Tell us what type of emergency has occurred.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="emergencyType">
                Emergency Type
              </label>

              <select
                id="emergencyType"
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(e.target.value)
                }
                required
              >
                <option value="">
                  Select emergency type
                </option>

                <option value="Accident">
                  Accident
                </option>

                <option value="Medical Emergency">
                  Medical Emergency
                </option>

                <option value="Fire">
                  Fire
                </option>

                <option value="Trauma">
                  Trauma
                </option>

                <option value="Cardiac Emergency">
                  Cardiac Emergency
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>
          </section>

          {/* LOCATION */}
          <section className="report-section">
            <div className="section-heading">
              <span>📍</span>

              <div>
                <h3>Emergency Location</h3>

                <p>
                  Provide the location where assistance is required.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">
                Location
              </label>

              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                placeholder="Enter location / landmark"
                required
              />
            </div>

            <div className="coordinates-grid">
              <div className="form-group">
                <label htmlFor="latitude">
                  Latitude
                </label>

                <input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value)
                  }
                  placeholder="18.xxxxxx"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">
                  Longitude
                </label>

                <input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value)
                  }
                  placeholder="73.xxxxxx"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              className="location-button"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation
                ? "📍 Getting Location..."
                : "📍 Use My Current Location"}
            </button>
          </section>

          {/* SUBMIT */}
          <div className="report-submit-section">
            <div className="submit-warning">
              <span>⚠️</span>

              <p>
                Only submit an emergency request when
                immediate assistance is required.
              </p>
            </div>

            <button
              type="submit"
              className="report-emergency-button"
              disabled={submitting}
            >
              {submitting
                ? "🚑 Processing Emergency..."
                : "🚨 REQUEST EMERGENCY ASSISTANCE"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CitizenReportEmergency;