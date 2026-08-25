import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import CitizenDashboard from "./pages/CitizenDashboard";
import CitizenReportEmergency from "./pages/CitizenReportEmergency";
import Emergencies from "./pages/Emergencies";
import EmergencyDetails from "./pages/EmergencyDetails";
import Ambulances from "./pages/Ambulances";
import Hospital from "./pages/Hospital";
import Users from "./pages/Users";

import "./App.css";


// ============================================================
// JWT ROLE HELPER
// ============================================================

function getRoleFromToken(token) {
  if (!token) {
    return "";
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return "";
    }

    const base64Url = parts[1];

    const base64 = base64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 =
      base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const payload = JSON.parse(atob(paddedBase64));

    return payload.role || "";
  } catch (error) {
    console.error("Unable to decode access token:", error);
    return "";
  }
}


// ============================================================
// LOGIN PAGE
// ============================================================

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          data.detail ||
            data.message ||
            "Invalid email or password."
        );
        return;
      }

      if (!data.access_token) {
        setError(
          "Login successful, but no access token was received."
        );
        return;
      }

      // Store authentication information
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // Store email
      localStorage.setItem(
        "user_email",
        data.email || email
      );

      // Determine role
      const tokenRole = getRoleFromToken(
        data.access_token
      );

      const role =
        data.role ||
        tokenRole ||
        "";

      if (role) {
        localStorage.setItem(
          "user_role",
          role
        );
      }

      console.log("Login successful");
      console.log("User role:", role);

      // Tell App that login was successful
      onLogin({
        ...data,
        role,
      });

    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Unable to connect to RapidResQ server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOGIN UI
  // ==========================================================

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">

          <div className="login-logo-icon">
            +
          </div>

          <div>
            <h1>RapidResQ</h1>
            <p>Emergency Response System</p>
          </div>

        </div>


        {/* Heading */}
        <div className="login-heading">

          <h2>Welcome back</h2>

          <p>
            Sign in to your RapidResQ account
          </p>

        </div>


        {/* Error */}
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        {/* Login Form */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="login-field">

            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

          </div>


          {/* Password */}
          <div className="login-field login-password-field">

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

          </div>


          {/* Login Button */}
          <button
            type="submit"
            className={`login-button ${
              loading ? "loading" : ""
            }`}
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>


        {/* Footer */}
        <p className="login-footer">
          RapidResQ • Emergency Response Platform
        </p>

      </div>

    </div>
  );
}


// ============================================================
// PLACEHOLDER PAGE
// ============================================================

function PlaceholderPage({
  title,
  icon,
  description,
  onNavigate,
}) {
  return (
    <div className="placeholder-page">

      <div className="placeholder-card">

        <div className="placeholder-icon">
          {icon}
        </div>

        <h1>{title}</h1>

        <p>{description}</p>

        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate("/dashboard");
            }
          }}
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("access_token")
  );


  // ==========================================================
  // USER ROLE
  // ==========================================================

  const [userRole, setUserRole] = useState(() => {

    const storedRole =
      localStorage.getItem("user_role");

    if (storedRole) {
      return storedRole;
    }

    const token =
      localStorage.getItem("access_token");

    const tokenRole =
      getRoleFromToken(token);

    if (tokenRole) {
      localStorage.setItem(
        "user_role",
        tokenRole
      );
    }

    return tokenRole;
  });


  // ==========================================================
  // CURRENT ROUTE
  // ==========================================================

  const [currentPath, setCurrentPath] =
    useState(
      window.location.pathname
    );


  // ==========================================================
  // BROWSER NAVIGATION
  // ==========================================================

  useEffect(() => {

    const handlePopState = () => {
      setCurrentPath(
        window.location.pathname
      );
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };

  }, []);


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = (path) => {

    if (
      window.location.pathname !== path
    ) {
      window.history.pushState(
        {},
        "",
        path
      );
    }

    setCurrentPath(path);
  };


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = (data) => {

    const token =
      localStorage.getItem("access_token");

    const tokenRole =
      getRoleFromToken(token);

    const role =
      data?.role ||
      tokenRole ||
      localStorage.getItem("user_role") ||
      "";

    console.log(
      "Logged-in role:",
      role
    );

    if (role) {
      localStorage.setItem(
        "user_role",
        role
      );

      setUserRole(role);
    }

    setIsLoggedIn(true);


    // Citizen dashboard
    if (
      role.toLowerCase() === "citizen"
    ) {
      navigate("/citizen-dashboard");
      return;
    }


    // Admin / other staff dashboard
    navigate("/dashboard");
  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user_role"
    );

    localStorage.removeItem(
      "user_email"
    );

    setIsLoggedIn(false);
    setUserRole("");

    navigate("/");
  };


  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!isLoggedIn) {

    return (
      <LoginPage
        onLogin={handleLogin}
      />
    );
  }


  // ==========================================================
  // NORMALIZE ROLE
  // ==========================================================

  const normalizedRole =
    userRole.toLowerCase();


  // ==========================================================
  // CITIZEN DASHBOARD
  // ==========================================================

  if (
    normalizedRole === "citizen" &&
    (
      currentPath === "/" ||
      currentPath === "/dashboard" ||
      currentPath === "/citizen-dashboard"
    )
  ) {

    return (
      <CitizenDashboard
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }


  // ==========================================================
  // ADMIN / STAFF DASHBOARD
  // ==========================================================

  if (
    currentPath === "/" ||
    currentPath === "/dashboard"
  ) {

    return (
      <Dashboard
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }


  // ==========================================================
  // CITIZEN DASHBOARD DIRECT ROUTE
  // ==========================================================

  if (
    currentPath === "/citizen-dashboard"
  ) {

    if (
      normalizedRole === "citizen"
    ) {

      return (
        <CitizenDashboard
          onLogout={handleLogout}
          onNavigate={navigate}
        />
      );
    }

    navigate("/dashboard");

    return null;
  }


  // ============================================================
  // CITIZEN REPORT EMERGENCY
  // ============================================================

  if (
    currentPath === "/report-emergency"
  ) {

    if (
      normalizedRole === "citizen"
    ) {

      return (
        <CitizenReportEmergency
          onLogout={handleLogout}
          onNavigate={navigate}
        />
      );
    }

    navigate("/dashboard");

    return null;
  }


  // ============================================================
  // EMERGENCY DETAILS
  // ============================================================

  if (
    currentPath.startsWith("/emergencies/")
  ) {

    const emergencyId =
      currentPath.split("/")[2];

    if (emergencyId) {

      return (
        <EmergencyDetails
          emergencyId={emergencyId}
          onLogout={handleLogout}
          onNavigate={navigate}
        />
      );
    }
  }


  // ============================================================
  // EMERGENCIES
  // ============================================================

  if (
    currentPath === "/emergencies"
  ) {

    return (
      <Emergencies
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }


  // ============================================================
  // AMBULANCES
  // ============================================================

  if (
    currentPath === "/ambulances"
  ) {

    return (
      <Ambulances
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }


  // ============================================================
  // HOSPITALS
  // ============================================================

  if (
    currentPath === "/hospitals"
  ) {

    return (
      <Hospital
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }


  // ============================================================
  // USERS
  // ============================================================

  if (
    currentPath === "/users"
  ) {

    return (
      <Users
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }


  // ============================================================
  // SETTINGS
  // ============================================================

  if (
    currentPath === "/settings"
  ) {

    return (
      <PlaceholderPage
        title="Settings"
        icon="⚙️"
        description="Settings will be developed next."
        onNavigate={navigate}
      />
    );
  }


  // ============================================================
  // UNKNOWN ROUTE
  // ============================================================

  return (
    <PlaceholderPage
      title="Page Not Found"
      icon="⚠️"
      description="The page you are trying to access does not exist."
      onNavigate={navigate}
    />
  );
}


export default App;