import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // NAVIGATION
  // =========================

  const navigateTo = (path) => {
    window.location.assign(path);
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");

    window.location.assign("/");
  };

  // =========================
  // FETCH DASHBOARD DATA
  // =========================

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setError("");
        }

        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "No authentication token found. Please login again."
          );
        }

        const response = await fetch(
          `${API_URL}/dashboard/admin`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Session expired. Please login again."
            );
          }

          if (response.status === 403) {
            throw new Error(
              "You do not have permission to access this dashboard."
            );
          }

          throw new Error(
            data?.detail ||
              "Failed to load dashboard data."
          );
        }

        setDashboardData(data);
        setError("");
      } catch (err) {
        console.error("Dashboard error:", err);

        setError(
          err?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchDashboard(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchDashboard]);

  // =========================
  // LOADING SCREEN
  // =========================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>
          Loading RapidResQ Dashboard...
        </h2>

        <p>
          Fetching real-time emergency data.
        </p>
      </div>
    );
  }

  // =========================
  // ERROR SCREEN
  // =========================

  if (error && !dashboardData) {
    return (
      <div className="dashboard-error">
        <h2>
          Unable to load dashboard
        </h2>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          className="login-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  // =========================
  // SAFE DATA
  // =========================

  const emergencies =
    dashboardData?.emergencies || {
      total: 0,
      pending: 0,
      assigned: 0,
      completed: 0,
      critical: 0,
    };

  const ambulances =
    dashboardData?.ambulances || {
      available: 0,
      busy: 0,
    };

  const hospitals =
    dashboardData?.hospitals || {
      total: 0,
      available_beds: 0,
    };

  // =========================
  // ADMIN INFORMATION
  // =========================

  const loggedInEmail =
    dashboardData?.logged_in_as ||
    localStorage.getItem("user_email") ||
    "Administrator";

  const displayName = loggedInEmail.includes("@")
    ? loggedInEmail.split("@")[0]
    : loggedInEmail;

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || "A";

  // =========================
  // NUMERIC VALUES
  // =========================

  const totalEmergencies = Number(
    emergencies.total || 0
  );

  const pendingEmergencies = Number(
    emergencies.pending || 0
  );

  const assignedEmergencies = Number(
    emergencies.assigned || 0
  );

  const completedEmergencies = Number(
    emergencies.completed || 0
  );

  const criticalEmergencies = Number(
    emergencies.critical || 0
  );

  const availableAmbulances = Number(
    ambulances.available || 0
  );

  const busyAmbulances = Number(
    ambulances.busy || 0
  );

  const totalAmbulances =
    availableAmbulances + busyAmbulances;

  const totalHospitals = Number(
    hospitals.total || 0
  );

  const availableBeds = Number(
    hospitals.available_beds || 0
  );

  // =========================
  // AMBULANCE PERCENTAGES
  // =========================

  const availablePercentage =
    totalAmbulances > 0
      ? (availableAmbulances /
          totalAmbulances) *
        100
      : 0;

  const busyPercentage =
    totalAmbulances > 0
      ? (busyAmbulances /
          totalAmbulances) *
        100
      : 0;

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="dashboard">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            +
          </div>

          <span>
            RapidResQ
          </span>

        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          <button
            type="button"
            className="nav-item active"
            onClick={() =>
              navigateTo("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigateTo("/emergencies")
            }
          >
            <span>🚨</span>
            Emergencies
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigateTo("/ambulances")
            }
          >
            <span>🚑</span>
            Ambulances
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigateTo("/hospitals")
            }
          >
            <span>🏥</span>
            Hospitals
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigateTo("/users")
            }
          >
            <span>👥</span>
            Users
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              console.log(
                "Settings page coming soon."
              )
            }
          >
            <span>⚙</span>
            Settings
          </button>

          <button
            type="button"
            className="nav-item logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Real-time emergency response overview
            </p>

          </div>

          <div className="admin-profile">

            <button
              type="button"
              className="notification"
              title="Notifications"
              onClick={() =>
                console.log(
                  "Notifications coming soon."
                )
              }
            >
              🔔
            </button>

            <div className="profile-avatar">
              {avatarLetter}
            </div>

            <div className="profile-info">

              <strong>
                {displayName}
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>

        </header>

        {/* =========================
            WELCOME
        ========================= */}

        <section className="welcome-section">

          <div>

            <h2>
              Good day, {displayName} 👋
            </h2>

            <p>
              Here's what's happening with
              RapidResQ right now.
            </p>

          </div>

          <div className="live-status">

            <span></span>

            System operational

          </div>

        </section>

        {/* =========================
            REFRESH
        ========================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "14px",
          }}
        >

          <button
            type="button"
            onClick={() =>
              fetchDashboard(true)
            }
            disabled={refreshing}
            style={{
              minWidth: "95px",
              height: "36px",
              padding: "0 14px",
              border:
                "1px solid #dedede",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#444444",
              fontSize: "12px",
              fontWeight: 600,
              cursor: refreshing
                ? "not-allowed"
                : "pointer",
              opacity: refreshing
                ? 0.6
                : 1,
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* =========================
            STAT CARDS
        ========================= */}

        <section className="stats-grid">

          {/* TOTAL */}

          <div className="stat-card">

            <div className="stat-icon emergency-icon">
              🚨
            </div>

            <div>

              <p>
                Total Emergencies
              </p>

              <h3>
                {totalEmergencies}
              </h3>

              <span className="stat-description">
                All reported cases
              </span>

            </div>

          </div>

          {/* PENDING */}

          <div className="stat-card">

            <div className="stat-icon pending-icon">
              ⏳
            </div>

            <div>

              <p>
                Pending
              </p>

              <h3>
                {pendingEmergencies}
              </h3>

              <span className="stat-description">
                Awaiting assignment
              </span>

            </div>

          </div>

          {/* ASSIGNED */}

          <div className="stat-card">

            <div className="stat-icon assigned-icon">
              🚑
            </div>

            <div>

              <p>
                Assigned
              </p>

              <h3>
                {assignedEmergencies}
              </h3>

              <span className="stat-description">
                Ambulances assigned
              </span>

            </div>

          </div>

          {/* COMPLETED */}

          <div className="stat-card">

            <div className="stat-icon completed-icon">
              ✓
            </div>

            <div>

              <p>
                Completed
              </p>

              <h3>
                {completedEmergencies}
              </h3>

              <span className="stat-description">
                Successfully resolved
              </span>

            </div>

          </div>

        </section>

        {/* =========================
            DASHBOARD GRID
        ========================= */}

        <section className="dashboard-grid">

          {/* =========================
              EMERGENCY OVERVIEW
          ========================= */}

          <div className="dashboard-card">

            <div className="card-header">

              <div>

                <h3>
                  Emergency Overview
                </h3>

                <p>
                  Current emergency statistics
                </p>

              </div>

              <button
                type="button"
                className="view-all"
                onClick={() =>
                  navigateTo(
                    "/emergencies"
                  )
                }
              >
                View all →
              </button>

            </div>

            <div className="emergency-list">

              {/* TOTAL */}

              <div className="emergency-row">

                <div className="emergency-number">
                  🚨
                </div>

                <div className="emergency-details">

                  <strong>
                    Total Emergencies
                  </strong>

                  <span>
                    All reported emergency cases
                  </span>

                </div>

                <span className="severity critical">
                  {totalEmergencies}
                </span>

                <span className="status assigned">
                  Total
                </span>

              </div>

              {/* PENDING */}

              <div className="emergency-row">

                <div className="emergency-number">
                  ⏳
                </div>

                <div className="emergency-details">

                  <strong>
                    Pending Cases
                  </strong>

                  <span>
                    Awaiting ambulance assignment
                  </span>

                </div>

                <span className="severity high">
                  {pendingEmergencies}
                </span>

                <span className="status pending">
                  Pending
                </span>

              </div>

              {/* CRITICAL */}

              <div className="emergency-row">

                <div className="emergency-number">
                  ⚠️
                </div>

                <div className="emergency-details">

                  <strong>
                    Critical Cases
                  </strong>

                  <span>
                    Require immediate attention
                  </span>

                </div>

                <span className="severity critical">
                  {criticalEmergencies}
                </span>

                <span className="status pending">
                  Critical
                </span>

              </div>

              {/* COMPLETED */}

              <div className="emergency-row">

                <div className="emergency-number">
                  ✓
                </div>

                <div className="emergency-details">

                  <strong>
                    Completed Cases
                  </strong>

                  <span>
                    Successfully resolved emergencies
                  </span>

                </div>

                <span className="severity medium">
                  {completedEmergencies}
                </span>

                <span className="status completed">
                  Completed
                </span>

              </div>

            </div>

          </div>

          {/* =========================
              AMBULANCE STATUS
          ========================= */}

          <div className="dashboard-card">

            <div className="card-header">

              <div>

                <h3>
                  Ambulance Status
                </h3>

                <p>
                  Current fleet availability
                </p>

              </div>

              <button
                type="button"
                className="view-all"
                onClick={() =>
                  navigateTo(
                    "/ambulances"
                  )
                }
              >
                View all →
              </button>

            </div>

            {/* AVAILABLE */}

            <div className="ambulance-stat">

              <div className="ambulance-stat-top">

                <span>
                  Available
                </span>

                <strong>
                  {availableAmbulances}
                </strong>

              </div>

              <div className="progress-bar">

                <div
                  className="progress available-progress"
                  style={{
                    width: `${availablePercentage}%`,
                  }}
                ></div>

              </div>

            </div>

            {/* BUSY */}

            <div className="ambulance-stat">

              <div className="ambulance-stat-top">

                <span>
                  Busy
                </span>

                <strong>
                  {busyAmbulances}
                </strong>

              </div>

              <div className="progress-bar">

                <div
                  className="progress busy-progress"
                  style={{
                    width: `${busyPercentage}%`,
                  }}
                ></div>

              </div>

            </div>

            {/* TOTAL */}

            <div className="ambulance-stat">

              <div className="ambulance-stat-top">

                <span>
                  Total Fleet
                </span>

                <strong>
                  {totalAmbulances}
                </strong>

              </div>

              <div className="progress-bar">

                <div
                  className="progress maintenance-progress"
                  style={{
                    width: "100%",
                  }}
                ></div>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            BOTTOM CARDS
        ========================= */}

        <section className="bottom-grid">

          {/* HOSPITALS */}

          <div
            className="small-card"
            style={{
              cursor: "pointer",
            }}
            onClick={() =>
              navigateTo(
                "/hospitals"
              )
            }
          >

            <div className="small-card-icon">
              🏥
            </div>

            <div>

              <span>
                Hospitals
              </span>

              <strong>
                {totalHospitals}
              </strong>

              <small>
                Connected hospitals
              </small>

            </div>

          </div>

          {/* AVAILABLE BEDS */}

          <div
            className="small-card"
            style={{
              cursor: "pointer",
            }}
            onClick={() =>
              navigateTo(
                "/hospitals"
              )
            }
          >

            <div className="small-card-icon">
              🛏️
            </div>

            <div>

              <span>
                Available Beds
              </span>

              <strong>
                {availableBeds}
              </strong>

              <small>
                Currently available
              </small>

            </div>

          </div>

          {/* CRITICAL CASES */}

          <div
            className="small-card"
            style={{
              cursor: "pointer",
            }}
            onClick={() =>
              navigateTo(
                "/emergencies"
              )
            }
          >

            <div className="small-card-icon">
              ⚠️
            </div>

            <div>

              <span>
                Critical Cases
              </span>

              <strong>
                {criticalEmergencies}
              </strong>

              <small>
                Require attention
              </small>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;