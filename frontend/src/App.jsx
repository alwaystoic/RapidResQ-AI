import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CitizenDashboard from "./pages/CitizenDashboard";

import Ambulances from "./pages/Ambulances";
import Emergencies from "./pages/Emergencies";
import Hospital from "./pages/Hospital";
import Users from "./pages/Users";

import "./App.css";


// ============================================================
// BACKEND URL
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// GET ROLE FROM JWT TOKEN
// ============================================================

function getRoleFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    let base64 = parts[1];

    base64 = base64
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const decoded = atob(base64);

    const payload = JSON.parse(decoded);

    return (
      payload.role ||
      payload.user_role ||
      payload.userRole ||
      null
    );
  } catch (error) {
    console.error("JWT decoding error:", error);
    return null;
  }
}


// ============================================================
// NORMALIZE ROLE
// ============================================================

function normalizeRole(role) {
  if (!role) {
    return "";
  }

  return String(role).trim().toLowerCase();
}


// ============================================================
// GET CURRENT USER ROLE
// ============================================================

function getCurrentRole() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const storedRole =
    localStorage.getItem("user_role");

  const tokenRole =
    getRoleFromToken(token);

  const role =
    tokenRole || storedRole || "";

  if (tokenRole) {
    localStorage.setItem(
      "user_role",
      tokenRole
    );
  }

  return normalizeRole(role);
}


// ============================================================
// CHECK LOGIN
// ============================================================

function isAuthenticated() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  return Boolean(token);
}


// ============================================================
// LOGIN PAGE
// ============================================================

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );


      // ------------------------------------------------------
      // Read response
      // ------------------------------------------------------

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }


      // ------------------------------------------------------
      // Login failed
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          `Login failed. Status: ${response.status}`
        );
      }


      // ------------------------------------------------------
      // Get access token
      // ------------------------------------------------------

      const token =
        data.access_token ||
        data.accessToken ||
        data.token;


      if (!token) {
        throw new Error(
          "Login succeeded but the server did not return an access token."
        );
      }


      // ------------------------------------------------------
      // Get role
      // ------------------------------------------------------

      const tokenRole =
        getRoleFromToken(token);

      const role =
        tokenRole ||
        data.role ||
        data.user_role ||
        data.userRole ||
        "";


      if (!role) {
        throw new Error(
          "Login succeeded but the user role could not be determined."
        );
      }


      const normalizedRole =
        normalizeRole(role);


      // ------------------------------------------------------
      // Store authentication
      // ------------------------------------------------------

      localStorage.setItem(
        "access_token",
        token
      );

      localStorage.setItem(
        "user_role",
        normalizedRole
      );

      localStorage.setItem(
        "user_email",
        email.trim()
      );


      // ------------------------------------------------------
      // ROLE BASED REDIRECTION
      // ------------------------------------------------------

      if (normalizedRole === "citizen") {
        navigate(
          "/citizen-dashboard",
          {
            replace: true,
          }
        );

        return;
      }


      if (
        normalizedRole === "admin" ||
        normalizedRole === "administrator"
      ) {
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

        return;
      }


      // ------------------------------------------------------
      // Unknown role
      // ------------------------------------------------------

      throw new Error(
        `Unknown user role: ${role}`
      );

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOGIN UI
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6fa",
        padding: "20px",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          boxShadow:
            "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >

        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#111827",
            }}
          >
            RapidResQ AI 🚑
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
            }}
          >
            Emergency Response Management System
          </p>

        </div>


        <form onSubmit={handleLogin}>

          {/* EMAIL */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >

            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "7px",
                fontSize: "15px",
              }}
            />

          </div>


          {/* PASSWORD */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >

            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "7px",
                fontSize: "15px",
              }}
            />

          </div>


          {/* ERROR */}

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                border:
                  "1px solid #fecaca",
                borderRadius: "7px",
                padding: "11px",
                marginBottom: "18px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "7px",
              background: loading
                ? "#9ca3af"
                : "#dc2626",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({
  allowedRole,
  children,
}) {
  const authenticated =
    isAuthenticated();

  const role =
    getCurrentRole();


  // ----------------------------------------------------------
  // NOT LOGGED IN
  // ----------------------------------------------------------

  if (!authenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  // ----------------------------------------------------------
  // ROLE NOT FOUND
  // ----------------------------------------------------------

  if (!role) {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user_role"
    );

    localStorage.removeItem(
      "user_email"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  // ----------------------------------------------------------
  // ROLE DOES NOT MATCH
  // ----------------------------------------------------------

  const requiredRole =
    normalizeRole(allowedRole);


  if (role !== requiredRole) {

    // Citizen attempting admin page
    if (role === "citizen") {
      return (
        <Navigate
          to="/citizen-dashboard"
          replace
        />
      );
    }


    // Admin attempting citizen page
    if (
      role === "admin" ||
      role === "administrator"
    ) {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }


    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  return children;
}


// ============================================================
// HOME REDIRECT
// ============================================================

function HomeRedirect() {
  const authenticated =
    isAuthenticated();

  if (!authenticated) {
    return <LoginPage />;
  }


  const role =
    getCurrentRole();


  if (role === "citizen") {
    return (
      <Navigate
        to="/citizen-dashboard"
        replace
      />
    );
  }


  if (
    role === "admin" ||
    role === "administrator"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  // Invalid authentication
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user_role"
  );

  localStorage.removeItem(
    "user_email"
  );

  return (
    <Navigate
      to="/"
      replace
    />
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            LOGIN / HOME
            ================================================== */}

        <Route
          path="/"
          element={
            <HomeRedirect />
          }
        />


        {/* ==================================================
            ADMIN DASHBOARD
            ================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRole="admin"
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            ADMIN PAGES
            ================================================== */}

        <Route
          path="/ambulances"
          element={
            <ProtectedRoute
              allowedRole="admin"
            >
              <Ambulances />
            </ProtectedRoute>
          }
        />


        <Route
          path="/emergencies"
          element={
            <ProtectedRoute
              allowedRole="admin"
            >
              <Emergencies />
            </ProtectedRoute>
          }
        />


        <Route
          path="/hospital"
          element={
            <ProtectedRoute
              allowedRole="admin"
            >
              <Hospital />
            </ProtectedRoute>
          }
        />


        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRole="admin"
            >
              <Users />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            CITIZEN DASHBOARD
            ================================================== */}

        <Route
          path="/citizen-dashboard"
          element={
            <ProtectedRoute
              allowedRole="citizen"
            >
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            FALLBACK
            ================================================== */}

        <Route
          path="*"
          element={
            <HomeRedirect />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;