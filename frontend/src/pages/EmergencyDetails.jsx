import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../api/api";


// ============================================================
// EMERGENCY DETAILS
// DAY 9.3 — EMERGENCY LIFECYCLE UI
// ============================================================

export default function EmergencyDetails() {
  const { emergencyId } = getEmergencyId();

  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

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
        const data = await apiGet(`/emergencies/${emergencyId}`);

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
  // MISSING ID
  // ==========================================================

  if (!emergencyId) {
    return (
      <PageShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <EmptyState
            icon="⚠️"
            title="Emergency ID is missing"
            message="Unable to load emergency details because no emergency ID was provided."
          />

          <div className="mt-5 text-center">
            <Link
              to="/emergencies"
              className={buttonPrimary}
            >
              ← Back to Emergencies
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className={cardClass + " p-12 text-center"}>
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading emergency details...
            </p>
          </div>
        </main>
      </PageShell>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !emergency) {
    return (
      <PageShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
              ⚠️
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Unable to load emergency
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {error}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadEmergency()}
                className={buttonPrimary}
              >
                Try Again
              </button>

              <Link
                to="/emergencies"
                className={buttonSecondary}
              >
                Back to Emergencies
              </Link>
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  // ==========================================================
  // NO DATA
  // ==========================================================

  if (!emergency) {
    return (
      <PageShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <EmptyState
            icon="📋"
            title="Emergency not found"
            message="The requested emergency could not be found."
          />

          <div className="mt-5 text-center">
            <Link
              to="/emergencies"
              className={buttonPrimary}
            >
              ← Back to Emergencies
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  // ==========================================================
  // VALUES
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

  const hospitalAssigned =
    emergency.hospital_id !== null &&
    emergency.hospital_id !== undefined;

  const ambulanceAssigned =
    ambulance !== null &&
    ambulance !== undefined;

  // ==========================================================
  // COMPLETE EMERGENCY
  // ==========================================================

  const completeEmergency = async () => {
    if (
      emergencyStatus === "Completed" ||
      completing
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this emergency as completed?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setCompleting(true);

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
    } finally {
      setCompleting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/emergencies"
              className="text-sm font-semibold text-slate-500 transition hover:text-red-600"
            >
              ← Back to Emergencies
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Emergency #
                {String(emergency.id).padStart(3, "0")}
              </h1>

              <StatusBadge status={emergencyStatus} />
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Complete emergency response information
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadEmergency(true)}
            disabled={refreshing}
            className={buttonSecondary}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* LIFECYCLE */}
        {/* ================================================== */}

        <section className={cardClass + " mb-6 p-5 sm:p-6"}>
          <SectionHeading
            eyebrow="Response Progress"
            title="Emergency Lifecycle"
            description="Track the emergency from initial report through resolution."
          />

          <EmergencyTimeline
            status={emergencyStatus}
            ambulanceAssigned={ambulanceAssigned}
            hospitalAssigned={hospitalAssigned}
          />
        </section>

        {/* ================================================== */}
        {/* EMERGENCY SUMMARY */}
        {/* ================================================== */}

        <section className={cardClass + " mb-6 overflow-hidden"}>
          <div className="border-b border-slate-100 bg-gradient-to-r from-red-50 to-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                  Emergency Report
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {emergency.emergency_type}
                </h2>

                {emergency.location && (
                  <p className="mt-1 text-sm text-slate-500">
                    📍 {emergency.location}
                  </p>
                )}
              </div>

              <SeverityBadge severity={severity} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem
              label="Status"
              value={emergencyStatus}
              highlight
            />

            <SummaryItem
              label="Severity"
              value={severity}
            />

            <SummaryItem
              label="Priority Score"
              value={priorityScore}
            />

            <SummaryItem
              label="Reported"
              value={formatDate(emergency.created_at)}
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* PATIENT + LOCATION */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          <section className={cardClass + " p-5 sm:p-6"}>
            <SectionHeading
              title="Patient Information"
            />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoBox
                label="Patient Name"
                value={emergency.patient_name}
                icon="👤"
              />

              <InfoBox
                label="Phone"
                value={emergency.phone}
                icon="📞"
              />

              <InfoBox
                label="User ID"
                value={emergency.user_id}
                icon="🆔"
              />

              <InfoBox
                label="Emergency ID"
                value={emergency.id}
                icon="🚨"
              />
            </div>
          </section>

          <section className={cardClass + " p-5 sm:p-6"}>
            <SectionHeading
              title="Emergency Location"
            />

            <div className="mt-4 space-y-3">
              <InfoBox
                label="Location"
                value={emergency.location}
                icon="📍"
              />

              <div className="grid grid-cols-2 gap-3">
                <InfoBox
                  label="Latitude"
                  value={emergency.latitude}
                />

                <InfoBox
                  label="Longitude"
                  value={emergency.longitude}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ================================================== */}
        {/* AMBULANCE */}
        {/* ================================================== */}

        <section className={cardClass + " mt-5 overflow-hidden"}>
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                  Ambulance Response
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Ambulance Assignment
                </h2>
              </div>

              {ambulanceAssigned && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  ✓ Dispatched
                </span>
              )}
            </div>
          </div>

          {ambulanceAssigned ? (
            <div className="p-5 sm:p-6">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBox
                  label="Vehicle"
                  value={ambulance.vehicle}
                  icon="🚑"
                />

                <InfoBox
                  label="Ambulance ID"
                  value={ambulance.id}
                  icon="🆔"
                />

                <InfoBox
                  label="Status"
                  value={ambulance.status}
                  icon="●"
                />

                <InfoBox
                  label="Current Location"
                  value={ambulance.location}
                  icon="📍"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <MetricCard
                  label="Distance"
                  value={
                    distance !== null
                      ? `${distance} km`
                      : "N/A"
                  }
                  icon="📏"
                />

                <MetricCard
                  label="Estimated Arrival"
                  value={
                    eta !== null
                      ? `${eta} min`
                      : "N/A"
                  }
                  icon="⏱️"
                />

                <MetricCard
                  label="Ambulance Status"
                  value={ambulance.status || "N/A"}
                  icon="🚑"
                />

              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold text-blue-800">
                  Ambulance tracking
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  GPS: {ambulance.latitude ?? "N/A"},{" "}
                  {ambulance.longitude ?? "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <div className="text-3xl">🚑</div>

                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  Ambulance not assigned yet
                </h3>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                  The emergency is waiting for an available ambulance.
                  Assignment will happen when a suitable resource becomes available.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* HOSPITAL */}
        {/* ================================================== */}

        <section className={cardClass + " mt-5 p-5 sm:p-6"}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title="Hospital Assignment"
            />

            {hospitalAssigned && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                ✓ Hospital Assigned
              </span>
            )}
          </div>

          {hospitalAssigned ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoBox
                label="Hospital ID"
                value={emergency.hospital_id}
                icon="🏥"
              />

              <InfoBox
                label="Assignment Status"
                value="Assigned"
                icon="✓"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
              <div className="text-3xl">🏥</div>

              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Hospital assignment pending
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                No hospital has been assigned to this emergency yet.
              </p>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* AI ANALYSIS */}
        {/* ================================================== */}

        <section className={cardClass + " mt-5 p-5 sm:p-6"}>
          <SectionHeading
            eyebrow="Artificial Intelligence"
            title="AI Emergency Analysis"
            description="Classification and priority information generated by RapidResQ AI."
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              label="Severity"
              value={severity}
              icon="⚠️"
            />

            <MetricCard
              label="Priority Score"
              value={priorityScore}
              icon="🎯"
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              AI Reason
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {aiReason}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* ACTIONS */}
        {/* ================================================== */}

        {emergencyStatus === "Assigned" && (
          <section className={cardClass + " mt-5 p-5 sm:p-6"}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Administration
                </p>

                <h2 className="mt-1 text-base font-bold text-slate-900">
                  Emergency Actions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Mark the emergency as completed once the response has been resolved.
                </p>
              </div>

              <button
                type="button"
                onClick={completeEmergency}
                disabled={completing}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completing
                  ? "Completing..."
                  : "✓ Mark Emergency Completed"}
              </button>
            </div>
          </section>
        )}

        {/* ================================================== */}
        {/* COMPLETED */}
        {/* ================================================== */}

        {emergencyStatus === "Completed" && (
          <section className="mt-5 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xl text-green-700">
                ✓
              </div>

              <div>
                <h2 className="text-base font-bold text-green-800">
                  Emergency Completed
                </h2>

                <p className="mt-1 text-sm leading-6 text-green-700">
                  This emergency has been successfully completed.
                  The assigned ambulance and hospital resources have been released.
                </p>
              </div>
            </div>
          </section>
        )}

      </main>
    </PageShell>
  );
}


// ============================================================
// PAGE SHELL
// ============================================================

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      {children}
    </div>
  );
}


// ============================================================
// HEADER
// ============================================================

function Header() {
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-xl text-white shadow-sm">
            +
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              RapidResQ AI 🚑
            </h2>

            <p className="text-[10px] text-slate-500 sm:text-xs">
              Emergency Details
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className={buttonSecondary}
        >
          Logout
        </button>
      </div>
    </header>
  );
}


// ============================================================
// EMERGENCY TIMELINE
// ============================================================

function EmergencyTimeline({
  status,
  ambulanceAssigned,
  hospitalAssigned,
}) {
  const completed = status === "Completed";

  const steps = [
    {
      title: "Reported",
      description: "Emergency received",
      icon: "✓",
      active: true,
    },
    {
      title: "Assigned",
      description:
        ambulanceAssigned || hospitalAssigned
          ? "Response resources assigned"
          : "Waiting for assignment",
      icon: "✓",
      active:
        status === "Assigned" ||
        status === "Completed" ||
        ambulanceAssigned ||
        hospitalAssigned,
    },
    {
      title: "Ambulance Dispatched",
      description: ambulanceAssigned
        ? "Ambulance assigned"
        : "Waiting for ambulance",
      icon: "🚑",
      active:
        ambulanceAssigned ||
        completed,
    },
    {
      title: "Hospital Assigned",
      description: hospitalAssigned
        ? "Hospital assigned"
        : "Waiting for hospital",
      icon: "🏥",
      active:
        hospitalAssigned ||
        completed,
    },
    {
      title: "Completed",
      description: completed
        ? "Emergency resolved"
        : "Response in progress",
      icon: "✓",
      active: completed,
    },
  ];

  return (
    <div className="mt-6">
      <div className="hidden items-start md:flex">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex min-w-0 flex-1 items-start"
          >
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <TimelineCircle
                active={step.active}
                completed={
                  step.active &&
                  (index === 0 ||
                    index < steps.length - 1 ||
                    completed)
                }
                icon={step.icon}
              />

              <p
                className={`mt-3 text-xs font-bold ${
                  step.active
                    ? "text-slate-900"
                    : "text-slate-400"
                }`}
              >
                {step.title}
              </p>

              <p className="mt-1 max-w-[130px] text-[10px] leading-4 text-slate-400">
                {step.description}
              </p>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`mt-5 h-1 flex-1 rounded-full ${
                  steps[index + 1].active
                    ? "bg-green-500"
                    : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {steps.map((step) => (
          <div
            key={step.title}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              step.active
                ? "border-green-200 bg-green-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <TimelineCircle
              active={step.active}
              completed={step.active}
              icon={step.icon}
            />

            <div className="min-w-0">
              <p
                className={`text-xs font-bold ${
                  step.active
                    ? "text-slate-900"
                    : "text-slate-400"
                }`}
              >
                {step.title}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// TIMELINE CIRCLE
// ============================================================

function TimelineCircle({
  active,
  completed,
  icon,
}) {
  return (
    <div
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
        active
          ? completed
            ? "border-green-500 bg-green-500 text-white"
            : "border-red-500 bg-red-50 text-red-600"
          : "border-slate-200 bg-white text-slate-300"
      }`}
    >
      {active ? icon : "•"}
    </div>
  );
}


// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-1 text-base font-bold text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  let classes =
    "bg-yellow-100 text-yellow-700";

  if (status === "Assigned") {
    classes = "bg-blue-100 text-blue-700";
  }

  if (status === "Completed") {
    classes = "bg-green-100 text-green-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}
    >
      {status}
    </span>
  );
}


// ============================================================
// SEVERITY BADGE
// ============================================================

function SeverityBadge({ severity }) {
  let classes =
    "bg-yellow-100 text-yellow-700";

  if (severity === "Critical") {
    classes = "bg-red-100 text-red-700";
  }

  if (severity === "High") {
    classes = "bg-orange-100 text-orange-700";
  }

  if (severity === "Low") {
    classes = "bg-green-100 text-green-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${classes}`}
    >
      {severity} Severity
    </span>
  );
}


// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-bold ${
          highlight
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
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
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-slate-300 hover:bg-white">
      <div className="flex items-start gap-3">

        {icon && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-800">
            {value !== null &&
            value !== undefined &&
            value !== ""
              ? value
              : "Not available"}
          </p>
        </div>

      </div>
    </div>
  );
}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-base">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-base font-bold text-slate-900">
            {value}
          </p>
        </div>

      </div>
    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon,
  title,
  message,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
      <div className="text-4xl">
        {icon}
      </div>

      <h1 className="mt-4 text-xl font-bold text-slate-900">
        {title}
      </h1>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>
    </div>
  );
}


// ============================================================
// BUTTON STYLES
// ============================================================

const buttonPrimary =
  "inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700";

const buttonSecondary =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm";


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