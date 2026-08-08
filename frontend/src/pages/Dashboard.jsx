import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">✚</div>
          <span>RapidResQ</span>
        </div>

        <nav className="sidebar-nav">

          <button className="nav-item active">
            <span>▦</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>🚨</span>
            Emergencies
          </button>

          <button className="nav-item">
            <span>🚑</span>
            Ambulances
          </button>

          <button className="nav-item">
            <span>🏥</span>
            Hospitals
          </button>

          <button className="nav-item">
            <span>👥</span>
            Users
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>

          <button className="nav-item logout">
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <h1>Dashboard</h1>
            <p>Real-time emergency response overview</p>
          </div>

          <div className="admin-profile">
            <div className="notification">🔔</div>

            <div className="profile-avatar">
              A
            </div>

            <div className="profile-info">
              <strong>Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

        </header>


        {/* Welcome */}
        <section className="welcome-section">

          <div>
            <h2>Good morning, Admin 👋</h2>
            <p>
              Here's what's happening with RapidResQ right now.
            </p>
          </div>

          <div className="live-status">
            <span></span>
            System operational
          </div>

        </section>


        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon emergency-icon">
              🚨
            </div>

            <div>
              <p>Total Emergencies</p>
              <h3>6</h3>
              <span className="stat-description">
                All reported cases
              </span>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon pending-icon">
              ⏳
            </div>

            <div>
              <p>Pending</p>
              <h3>2</h3>
              <span className="stat-description">
                Awaiting assignment
              </span>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon assigned-icon">
              🚑
            </div>

            <div>
              <p>Assigned</p>
              <h3>2</h3>
              <span className="stat-description">
                Ambulances assigned
              </span>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon completed-icon">
              ✓
            </div>

            <div>
              <p>Completed</p>
              <h3>2</h3>
              <span className="stat-description">
                Successfully resolved
              </span>
            </div>
          </div>

        </section>


        {/* Main Dashboard Grid */}
        <section className="dashboard-grid">

          {/* Recent Emergencies */}
          <div className="dashboard-card emergencies-card">

            <div className="card-header">
              <div>
                <h3>Recent Emergencies</h3>
                <p>Latest emergency cases</p>
              </div>

              <button className="view-all">
                View all →
              </button>
            </div>


            <div className="emergency-list">

              <div className="emergency-row">

                <div className="emergency-number">
                  #006
                </div>

                <div className="emergency-details">
                  <strong>Heart Attack</strong>
                  <span>Shivajinagar • Patient: John Doe</span>
                </div>

                <span className="severity critical">
                  Critical
                </span>

                <span className="status assigned">
                  Assigned
                </span>

              </div>


              <div className="emergency-row">

                <div className="emergency-number">
                  #005
                </div>

                <div className="emergency-details">
                  <strong>Accident</strong>
                  <span>Kothrud • Patient: Jane Doe</span>
                </div>

                <span className="severity high">
                  High
                </span>

                <span className="status pending">
                  Pending
                </span>

              </div>


              <div className="emergency-row">

                <div className="emergency-number">
                  #004
                </div>

                <div className="emergency-details">
                  <strong>Chest Pain</strong>
                  <span>Baner • Patient: Rahul Patil</span>
                </div>

                <span className="severity medium">
                  Medium
                </span>

                <span className="status completed">
                  Completed
                </span>

              </div>

            </div>

          </div>


          {/* Ambulance Status */}
          <div className="dashboard-card ambulance-card">

            <div className="card-header">
              <div>
                <h3>Ambulance Status</h3>
                <p>Current fleet availability</p>
              </div>
            </div>


            <div className="ambulance-stat">

              <div className="ambulance-stat-top">
                <span>Available</span>
                <strong>2</strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress available-progress"
                  style={{ width: "40%" }}
                ></div>
              </div>

            </div>


            <div className="ambulance-stat">

              <div className="ambulance-stat-top">
                <span>Busy</span>
                <strong>2</strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress busy-progress"
                  style={{ width: "40%" }}
                ></div>
              </div>

            </div>


            <div className="ambulance-stat">

              <div className="ambulance-stat-top">
                <span>Maintenance</span>
                <strong>1</strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress maintenance-progress"
                  style={{ width: "20%" }}
                ></div>
              </div>

            </div>

          </div>

        </section>


        {/* Bottom Cards */}
        <section className="bottom-grid">

          <div className="small-card">

            <div className="small-card-icon">
              🏥
            </div>

            <div>
              <span>Hospitals</span>
              <strong>12</strong>
              <small>Connected hospitals</small>
            </div>

          </div>


          <div className="small-card">

            <div className="small-card-icon">
              🛏️
            </div>

            <div>
              <span>Available Beds</span>
              <strong>12</strong>
              <small>Currently available</small>
            </div>

          </div>


          <div className="small-card">

            <div className="small-card-icon">
              ⚠️
            </div>

            <div>
              <span>Critical Cases</span>
              <strong>2</strong>
              <small>Require attention</small>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;