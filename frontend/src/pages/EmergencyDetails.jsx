import { useCallback, useEffect, useState } from "react";
import {
  apiGet,
} from "../api";

function EmergencyDetails({
  emergencyId,
  onLogout,
  onNavigate,
}) {
  const [emergency, setEmergency] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const goBack = () => {
    if (typeof onNavigate === "function") {
      onNavigate("/emergencies");
      return;
    }

    window.location.assign("/emergencies");
  };

  // ============================================================
  // LOGOUT
  // ============================================================

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

  // ============================================================
  // LOAD EMERGENCY
  // ============================================================

  const loadEmergency = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        if (
          emergencyId === null ||
          emergencyId === undefined ||
          emergencyId === ""
        ) {
          throw new Error(
            "Emergency ID is missing."
          );
        }

        const data = await apiGet(
          `/emergencies/${encodeURIComponent(
            emergencyId
          )}`
        );

        setEmergency(
          data?.emergency || data
        );
      } catch (err) {
        console.error(
          "Emergency details error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load emergency details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [emergencyId]
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadOnMount = async () => {
      try {
        setLoading(true);
        setError("");

        if (
          emergencyId === null ||
          emergencyId === undefined ||
          emergencyId === ""
        ) {
          throw new Error(
            "Emergency ID is missing."
          );
        }

        const data = await apiGet(
          `/emergencies/${encodeURIComponent(
            emergencyId
          )}`
        );

        if (!cancelled) {
          setEmergency(
            data?.emergency || data
          );
        }
      } catch (err) {
        console.error(
          "Emergency details error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load emergency details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOnMount();

    return () => {
      cancelled = true;
    };
  }, [emergencyId]);

  // ============================================================
  // VALUE HELPERS
  // ============================================================

  const value = (
    key,
    fallback = "Not available"
  ) => {
    const item = emergency?.[key];

    return item === null ||
      item === undefined ||
      item === ""
      ? fallback
      : item;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Not available";
    }

    const date = new Date(dateString);

    return Number.isNaN(date.getTime())
      ? String(dateString)
      : date.toLocaleString();
  };

  // ============================================================
  // BADGES
  // ============================================================

  const badgeClass = (
    type,
    rawValue
  ) => {
    const normalized = String(
      rawValue || ""
    ).toLowerCase();

    if (type === "status") {
      if (normalized === "completed") {
        return "badge completed";
      }

      if (normalized === "assigned") {
        return "badge assigned";
      }

      return "badge pending";
    }

    if (normalized === "critical") {
      return "badge critical";
    }

    if (normalized === "high") {
      return "badge high";
    }

    if (normalized === "medium") {
      return "badge medium";
    }

    return "badge low";
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>
          Loading emergency details...
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !emergency) {
    return (
      <main style={pageStyle}>
        <div style={topBarStyle}>

          <button
            type="button"
            onClick={goBack}
            style={secondaryButtonStyle}
          >
            ← Back to Emergencies
          </button>

          <button
            type="button"
            onClick={logout}
            style={logoutButtonStyle}
          >
            Logout
          </button>

        </div>

        <section style={errorCardStyle}>

          <div style={{ fontSize: "36px" }}>
            ⚠️
          </div>

          <h2 style={{ margin: "8px 0" }}>
            Unable to load emergency
          </h2>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            {error ||
              "Emergency not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              loadEmergency(true)
            }
            style={primaryButtonStyle}
          >
            ↻ Try Again
          </button>

        </section>
      </main>
    );
  }

  // ============================================================
  // DATA
  // ============================================================

  const status = value("status");
  const severity = value("severity");

  const ambulance =
    emergency.ambulance || null;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main style={pageStyle}>

      {/* HEADER */}

      <header style={topBarStyle}>

        <div>

          <div style={brandStyle}>
            RapidResQ AI 🚑
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
            }}
          >
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

        {/* HEADING */}

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
              Emergency #
              {String(
                value(
                  "id",
                  emergencyId
                )
              ).padStart(3, "0")}
            </h1>

            <p style={subtitleStyle}>
              Complete emergency response
              information
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadEmergency(false)
            }
            disabled={refreshing}
            style={{
              ...secondaryButtonStyle,
              opacity: refreshing
                ? 0.65
                : 1,
              cursor: refreshing
                ? "not-allowed"
                : "pointer",
            }}
          >
            {refreshing
              ? "↻ Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* EMERGENCY STATUS */}

        <section style={cardStyle}>

          <SectionTitle label="Emergency Status" />

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >

            <span
              className={badgeClass(
                "status",
                status
              )}
            >
              {status}
            </span>

            <span
              className={badgeClass(
                "severity",
                severity
              )}
            >
              {severity} Severity
            </span>

          </div>

          <strong
            style={{
              fontSize: "16px",
            }}
          >
            {value(
              "emergency_type"
            )}
          </strong>

          <div style={mutedStyle}>
            {value("location")}
          </div>

        </section>

        {/* PATIENT */}

        <section style={cardStyle}>

          <SectionTitle
            label="Patient Information"
          />

          <div style={gridStyle}>

            <Info
              label="Patient Name"
              value={value(
                "patient_name"
              )}
            />

            <Info
              label="Phone"
              value={value("phone")}
            />

            <Info
              label="User ID"
              value={value("user_id")}
            />

            <Info
              label="Created"
              value={formatDate(
                emergency.created_at
              )}
            />

          </div>

        </section>

        {/* LOCATION */}

        <section style={cardStyle}>

          <SectionTitle
            label="Emergency Location"
          />

          <div style={gridStyle}>

            <Info
              label="Location"
              value={value("location")}
            />

            <Info
              label="Latitude"
              value={value("latitude")}
            />

            <Info
              label="Longitude"
              value={value("longitude")}
            />

          </div>

        </section>

        {/* AMBULANCE */}

        <section style={cardStyle}>

          <SectionTitle
            label="Assigned Ambulance"
          />

          {ambulance ? (
            <>

              <h2
                style={{
                  margin: "0 0 14px",
                  fontSize: "20px",
                }}
              >
                🚑{" "}
                {valueFrom(
                  ambulance,
                  "vehicle"
                )}
              </h2>

              <div style={gridStyle}>

                <Info
                  label="Ambulance ID"
                  value={valueFrom(
                    ambulance,
                    "id"
                  )}
                />

                <Info
                  label="Vehicle"
                  value={valueFrom(
                    ambulance,
                    "vehicle"
                  )}
                />

                <Info
                  label="Status"
                  value={valueFrom(
                    ambulance,
                    "status"
                  )}
                />

                <Info
                  label="Location"
                  value={valueFrom(
                    ambulance,
                    "location"
                  )}
                />

                <Info
                  label="Latitude"
                  value={valueFrom(
                    ambulance,
                    "latitude"
                  )}
                />

                <Info
                  label="Longitude"
                  value={valueFrom(
                    ambulance,
                    "longitude"
                  )}
                />

                <Info
                  label="Distance"
                  value={valueFrom(
                    ambulance,
                    "distance_km"
                  )}
                  suffix=" km"
                />

                <Info
                  label="Estimated Arrival"
                  value={valueFrom(
                    ambulance,
                    "estimated_arrival_minutes"
                  )}
                  suffix=" minutes"
                />

              </div>

            </>
          ) : (
            <div
              style={notAssignedStyle}
            >
              🚑 Ambulance not assigned yet
            </div>
          )}

        </section>

        {/* HOSPITAL */}

        <section style={cardStyle}>

          <SectionTitle
            label="Hospital Assignment"
          />

          <div style={gridStyle}>

            <Info
              label="Hospital ID"
              value={value(
                "hospital_id"
              )}
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

      </div>

    </main>
  );
}

// ============================================================
// HELPERS
// ============================================================

function valueFrom(
  object,
  key,
  fallback = "Not available"
) {
  const item = object?.[key];

  return item === null ||
    item === undefined ||
    item === ""
    ? fallback
    : item;
}

function SectionTitle({ label }) {
  return (
    <div style={sectionLabelStyle}>
      {label}
    </div>
  );
}

function Info({
  label,
  value,
  suffix = "",
}) {
  return (
    <div style={infoStyle}>

      <div style={infoLabelStyle}>
        {label}
      </div>

      <div style={infoValueStyle}>
        {value}
        {value !== "Not available"
          ? suffix
          : ""}
      </div>

    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f7fb",
  color: "#111827",
  fontFamily: "Arial, sans-serif",
};

const topBarStyle = {
  height: "74px",
  padding: "0 5%",
  boxSizing: "border-box",
  background: "#ffffff",
  borderBottom:
    "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
};

const brandStyle = {
  fontSize: "18px",
  fontWeight: "800",
};

const contentStyle = {
  width: "min(920px, 92%)",
  margin: "0 auto",
  padding: "28px 0 50px",
};

const headingRowStyle = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent:
    "space-between",
  gap: "16px",
  marginBottom: "18px",
};

const titleStyle = {
  margin: "14px 0 4px",
  fontSize: "26px",
};

const subtitleStyle = {
  margin: 0,
  color: "#6b7280",
  fontSize: "13px",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const sectionLabelStyle = {
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontSize: "11px",
  fontWeight: "800",
  marginBottom: "12px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "10px",
};

const infoStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "12px",
};

const infoLabelStyle = {
  color: "#64748b",
  fontSize: "11px",
  marginBottom: "6px",
};

const infoValueStyle = {
  fontWeight: "700",
  fontSize: "14px",
  wordBreak: "break-word",
};

const mutedStyle = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "4px",
};

const secondaryButtonStyle = {
  minHeight: "38px",
  padding: "0 14px",
  border:
    "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#374151",
  fontWeight: "700",
  cursor: "pointer",
};

const primaryButtonStyle = {
  minHeight: "40px",
  padding: "0 16px",
  border:
    "1px solid #dc2626",
  borderRadius: "8px",
  background: "#dc2626",
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
};

const logoutButtonStyle = {
  minHeight: "36px",
  padding: "0 13px",
  border:
    "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  fontWeight: "600",
  cursor: "pointer",
};

const loadingCardStyle = {
  width: "min(700px, 90%)",
  margin: "20vh auto",
  background: "#ffffff",
  border:
    "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "35px",
  textAlign: "center",
};

const errorCardStyle = {
  width: "min(650px, 90%)",
  margin: "14vh auto",
  background: "#ffffff",
  border:
    "1px solid #fecaca",
  borderRadius: "12px",
  padding: "35px",
  textAlign: "center",
};

const notAssignedStyle = {
  padding: "28px",
  border:
    "1px dashed #cbd5e1",
  borderRadius: "10px",
  textAlign: "center",
  color: "#64748b",
  fontWeight: "700",
};

export default EmergencyDetails;