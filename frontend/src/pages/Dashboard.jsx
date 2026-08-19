import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "No authentication token found. Please login again."
          );
        }

        const response = await fetch(
          "http://localhost:8000/dashboard/admin",
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
            "Failed to load dashboard data."
          );
        }

        const data = await response.json();

        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading RapidResQ Dashboard...</h2>
        <p>Fetching real-time emergency data.</p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Unable to load dashboard</h2>

        <p>{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="login-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  // =========================
  // SAFETY CHECK
  // =========================

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <h2>No dashboard data available</h2>

        <button
          onClick={() => window.location.reload()}
          className="login-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  const emergencies = dashboardData.emergencies;
  const ambulances = dashboardData.ambulances;
  const hospitals = dashboardData.hospitals;

  const totalAmbulances =
    ambulances.available + ambulances.busy;

  const availablePercentage =
    totalAmbulances > 0
      ? (ambulances.available / totalAmbulances) * 100
      : 0;

  const busyPercentage =
    totalAmbulances > 0
      ? (ambulances.busy / totalAmbulances) * 100
      : 0;

  return (
    <div className="dashboard">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            ✚
          </div>

          <span>
            RapidResQ
          </span>

        </div>


        {/* =========================
            MAIN NAVIGATION
        ========================= */}

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className="nav-item active"
            onClick={() => navigateTo("/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>


          {/* EMERGENCIES */}

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("/emergencies")}
          >
            <span>🚨</span>
            Emergencies
          </button>


          {/* AMBULANCES */}

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("/ambulances")}
          >
            <span>🚑</span>
            Ambulances
          </button>


          {/* HOSPITALS */}

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("/hospitals")}
          >
            <span>🏥</span>
            Hospitals
          </button>


          {/* USERS */}

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("/users")}
          >
            <span>👥</span>
            Users
          </button>

        </nav>


        {/* =========================
            BOTTOM NAVIGATION
        ========================= */}

        <div className="sidebar-bottom">

          {/* SETTINGS */}

          <button
            type="button"
            className="nav-item"
            onClick={() => {
              console.log("Settings page coming soon.");
            }}
          >
            <span>⚙</span>
            Settings
          </button>


          {/* LOGOUT */}

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
          MAIN CONTENT
      ========================= */}

      <main className="dashboard-main">

        {/* =========================
            HEADER
        ========================= */}

        <header className="dashboard-header">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Real-time emergency response overview
            </p>

          </div>


          {/* ADMIN PROFILE */}

          <div className="admin-profile">

            <div className="notification">
              🔔
            </div>

            <div className="profile-avatar">
              A
            </div>

            <div className="profile-info">

              <strong>
                Admin
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>

        </header>


        {/* =========================
            WELCOME SECTION
        ========================= */}

        <section className="welcome-section">

          <div>

            <h2>
              Good morning, Admin 👋
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
            STATISTICS
        ========================= */}

        <section className="stats-grid">

          {/* TOTAL EMERGENCIES */}

          <div className="stat-card">

            <div className="stat-icon emergency-icon">
              🚨
            </div>

            <div>

              <p>
                Total Emergencies
              </p>

              <h3>
                {emergencies.total}
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
                {emergencies.pending}
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
                {emergencies.assigned}
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
                {emergencies.completed}
              </h3>

              <span className="stat-description">
                Successfully resolved
              </span>

            </div>

          </div>

        </section>


        {/* =========================
            MAIN GRID
        ========================= */}

        <section className="dashboard-grid">


          {/* =========================
              EMERGENCY OVERVIEW
          ========================= */}

          <div className="dashboard-card emergencies-card">

            <div className="card-header">

              <div>

                <h3>
                  Emergency Overview
                </h3>

                <p>
                  Current emergency statistics
                </p>

              </div>


              {/* VIEW ALL */}

              <button
                type="button"
                className="view-all"
                onClick={() => navigateTo("/emergencies")}
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
                  {emergencies.total}
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
                  {emergencies.pending}
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
                  {emergencies.critical}
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
                  {emergencies.completed}
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

          <div className="dashboard-card ambulance-card">

            <div className="card-header">

              <div>

                <h3>
                  Ambulance Status
                </h3>

                <p>
                  Current fleet availability
                </p>

              </div>

            </div>


            {/* AVAILABLE */}

            <div className="ambulance-stat">

              <div className="ambulance-stat-top">

                <span>
                  Available
                </span>

                <strong>
                  {ambulances.available}
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
                  {ambulances.busy}
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


            {/* TOTAL FLEET */}

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

          <div className="small-card">

            <div className="small-card-icon">
              🏥
            </div>

            <div>

              <span>
                Hospitals
              </span>

              <strong>
                {hospitals.total}
              </strong>

              <small>
                Connected hospitals
              </small>

            </div>

          </div>


          {/* AVAILABLE BEDS */}

          <div className="small-card">

            <div className="small-card-icon">
              🛏️
            </div>

            <div>

              <span>
                Available Beds
              </span>

              <strong>
                {hospitals.available_beds}
              </strong>

              <small>
                Currently available
              </small>

            </div>

          </div>


          {/* CRITICAL CASES */}

          <div className="small-card">

            <div className="small-card-icon">
              ⚠️
            </div>

            <div>

              <span>
                Critical Cases
              </span>

              <strong>
                {emergencies.critical}
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