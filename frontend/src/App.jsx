import { useState } from "react";
import Dashboard from "./pages/Dashboard";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already logged in
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      console.log("Login successful:", data);

      // Store JWT token
      localStorage.setItem("access_token", data.access_token);

      // Store user information if returned by backend
      if (data.role) {
        localStorage.setItem("user_role", data.role);
      }

      if (data.email) {
        localStorage.setItem("user_email", data.email);
      }

      // Show dashboard
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Unable to connect to RapidResQ server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");

    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  // If logged in, show Dashboard
  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  // Login page
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f8fa",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8e8e8",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#e5252a",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            +
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                color: "#171717",
              }}
            >
              RapidResQ
            </h1>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12px",
                color: "#888",
              }}
            >
              Emergency Response System
            </p>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "25px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              color: "#171717",
            }}
          >
            Welcome back
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#777",
              fontSize: "13px",
            }}
          >
            Sign in to your RapidResQ account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fff0f0",
              border: "1px solid #ffd0d0",
              color: "#d71920",
              padding: "11px 13px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#444",
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 13px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#444",
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 13px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "9px",
              background: loading ? "#ef6b6f" : "#e5252a",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            marginTop: "25px",
            marginBottom: 0,
            textAlign: "center",
            color: "#999",
            fontSize: "11px",
          }}
        >
          RapidResQ • Emergency Response Platform
        </p>
      </div>
    </div>
  );
}

export default App;