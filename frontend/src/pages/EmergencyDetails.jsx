import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../api/api";


// ============================================================
// EMERGENCY DETAILS
// ============================================================

export default function EmergencyDetails() {
  const { emergencyId } = getEmergencyId();

  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD EMERGENCY
  // ==========================================================

  const loadEmergency = useCallback(
    async (showRefresh = false) => {
      if (!emergencyId) {
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await apiGet(
          `/emergencies/${emergencyId}`
        );

        setEmergency(data);
        setError("");
      } catch (err) {
        setError(
          err?.message ||
            "Failed to load emergency details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [emergencyId]
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (!emergencyId) {
      return;
    }

    let cancelled = false;

    const fetchEmergency = async () => {
      try {
        const data = await apiGet(
          `/emergencies/${emergencyId}`
        );

        if (cancelled) {
          return;
        }

        setEmergency(data);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err?.message ||
            "Failed to load emergency details."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchEmergency();

    return () => {
      cancelled = true;
    };
  }, [emergencyId]);

  // ==========================================================
  // MISSING EMERGENCY ID
  // ==========================================================

  if (!emergencyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Emergency ID is missing
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Unable to load emergency details because
              no emergency ID was provided.
            </p>

            <Link
              to="/emergencies"
              className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Emergencies
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading emergency details...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !emergency) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-red-700">
              Unable to load emergency
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {error}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => loadEmergency()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Try Again
              </button>

              <Link
                to="/emergencies"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to Emergencies
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================
  // NO DATA
  // ==========================================================

  if (!emergency) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Emergency not found
            </h1>

            <Link
              to="/emergencies"
              className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Back to Emergencies
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================
  // EMERGENCY VALUES
  // ==========================================================

  const ambulance = emergency.ambulance;

  const severity =
    emergency.severity || "Medium";

  const emergencyStatus =
    emergency.status || "Pending";

  const priorityScore =
    emergency.priority_score ?? 50;

  const aiReason =
    emergency.ai_reason ||
    "Emergency classified based on available information.";

  const distance =
    emergency.distance_km ??
    ambulance?.distance_km ??
    null;

  const eta =
    emergency.estimated_arrival_minutes ??
    ambulance?.estimated_arrival_minutes ??
    null;

  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  const getStatusClass = () => {
    if (emergencyStatus === "Completed") {
      return "bg-green-100 text-green-700";
    }

    if (emergencyStatus === "Assigned") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  // ==========================================================
  // SEVERITY CLASS
  // ==========================================================

  const getSeverityClass = () => {
    if (severity === "Critical") {
      return "text-red-600";
    }

    if (severity === "High") {
      return "text-orange-600";
    }

    if (severity === "Low") {
      return "text-green-600";
    }

    return "text-yellow-600";
  };

  // ==========================================================
  // COMPLETE EMERGENCY
  // ==========================================================

  const completeEmergency = async () => {
    if (emergencyStatus === "Completed") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this emergency as completed?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await apiPut(
        `/emergencies/${emergencyId}/complete`
      );

      await loadEmergency();
    } catch (err) {
      setError(
        err?.message ||
          "Failed to complete emergency."
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-8">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <div className="mb-5 flex items-center justify-between">
          <div>
            <Link
              to="/emergencies"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← Back to Emergencies
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Emergency #
              {String(emergency.id).padStart(3, "0")}
            </h1>

            <p className="text-sm text-slate-500">
              Complete emergency response information
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadEmergency(true)}
            disabled={refreshing}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && emergency && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* EMERGENCY STATUS */}
        {/* ================================================== */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Emergency Status" />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass()}`}
            >
              {emergencyStatus}
            </span>

            <span
              className={`text-sm font-semibold ${getSeverityClass()}`}
            >
              {severity} Severity
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-slate-900">
            {emergency.emergency_type}
          </p>

          {emergency.location && (
            <p className="mt-1 text-sm text-slate-500">
              {emergency.location}
            </p>
          )}
        </section>

        {/* ================================================== */}
        {/* PATIENT INFORMATION */}
        {/* ================================================== */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Patient Information" />

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox
              label="Patient Name"
              value={emergency.patient_name}
            />

            <InfoBox
              label="Phone"
              value={emergency.phone}
            />

            <InfoBox
              label="User ID"
              value={emergency.user_id}
            />

            <InfoBox
              label="Created"
              value={formatDate(emergency.created_at)}
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* EMERGENCY LOCATION */}
        {/* ================================================== */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Emergency Location" />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoBox
              label="Location"
              value={emergency.location}
            />

            <InfoBox
              label="Latitude"
              value={emergency.latitude}
            />

            <InfoBox
              label="Longitude"
              value={emergency.longitude}
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* AMBULANCE */}
        {/* ================================================== */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Assigned Ambulance" />

          {ambulance ? (
            <div className="mt-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoBox
                  label="Vehicle"
                  value={ambulance.vehicle}
                />

                <InfoBox
                  label="Status"
                  value={ambulance.status}
                />

                <InfoBox
                  label="Location"
                  value={ambulance.location}
                />

                <InfoBox
                  label="Ambulance ID"
                  value={ambulance.id}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoBox
                  label="Distance"
                  value={
                    distance !== null
                      ? `${distance} km`
                      : "Not available"
                  }
                />

                <InfoBox
                  label="Estimated Arrival"
                  value={
                    eta !== null
                      ? `${eta} minutes`
                      : "Not available"
                  }
                />

                <InfoBox
                  label="GPS"
                  value={`${ambulance.latitude}, ${ambulance.longitude}`}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                🚑 Ambulance not assigned yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                The system will automatically assign
                the next available ambulance.
              </p>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* HOSPITAL */}
        {/* ================================================== */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Hospital Assignment" />

          {emergency.hospital_id ? (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoBox
                label="Hospital ID"
                value={emergency.hospital_id}
              />

              <InfoBox
                label="Assignment Status"
                value="Assigned"
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoBox
                label="Hospital ID"
                value="Not available"
              />

              <InfoBox
                label="Assignment Status"
                value="Pending Assignment"
              />
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* AI ANALYSIS */}
        {/* ================================================== */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="AI Emergency Analysis" />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoBox
              label="Severity"
              value={severity}
            />

            <InfoBox
              label="Priority Score"
              value={priorityScore}
            />
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              AI Reason
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {aiReason}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* ACTIONS */}
        {/* ================================================== */}

        {emergencyStatus === "Assigned" && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle title="Emergency Actions" />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={completeEmergency}
                className="rounded-md bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Mark Emergency Completed
              </button>
            </div>
          </section>
        )}

        {/* ================================================== */}
        {/* COMPLETED */}
        {/* ================================================== */}

        {emergencyStatus === "Completed" && (
          <section className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-700">
              ✓ This emergency has been completed.
            </p>

            <p className="mt-1 text-xs text-green-600">
              The assigned ambulance and hospital
              resources have been released.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}


// ============================================================
// GET EMERGENCY ID
// ============================================================

function getEmergencyId() {
  const params = new URLSearchParams(
    window.location.search
  );

  const pathParts =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  const emergencyId =
    pathParts[pathParts.length - 1] ||
    params.get("emergencyId");

  return {
    emergencyId,
  };
}


// ============================================================
// HEADER
// ============================================================

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            RapidResQ AI 🚑
          </h2>

          <p className="text-xs text-slate-500">
            Emergency Details
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(
              "access_token"
            );
            localStorage.removeItem("token");

            window.location.href = "/login";
          }}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}


// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({ title }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
      {title}
    </h2>
  );
}


// ============================================================
// INFO BOX
// ============================================================

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "Not available"}
      </p>
    </div>
  );
}


// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}