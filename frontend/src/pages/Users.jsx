import { useCallback, useEffect, useState } from "react";
import "./Users.css";

import {
  apiGet,
  apiPut,
  apiDelete,
} from "../api/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // EDIT USER
  // =========================================================

  const [editingUser, setEditingUser] = useState(null);

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    status: "Active",
  });

  const [savingUser, setSavingUser] = useState(false);

  // =========================================================
  // DELETE USER
  // =========================================================

  const [deletingId, setDeletingId] = useState(null);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goToDashboard = () => {
    window.location.assign("/dashboard");
  };

  // =========================================================
  // LOAD USERS
  // =========================================================

  const fetchUsers = useCallback(async () => {
    const data = await apiGet("/users");

    return data?.users || [];
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchUsers();

        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        console.error("User fetch error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load users."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  // =========================================================
  // REFRESH USERS
  // =========================================================

  const refreshUsers = async () => {
    try {
      setError("");
      setLoading(true);

      const data = await fetchUsers();

      setUsers(data);
    } catch (err) {
      console.error("User refresh error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh users."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (user) => {
    setError("");
    setEditingUser(user);

    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "Citizen",
      status: user.status || "Active",
    });
  };

  // =========================================================
  // CLOSE EDIT MODAL
  // =========================================================

  const closeEditModal = () => {
    if (savingUser) {
      return;
    }

    setEditingUser(null);

    setEditForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role: "",
      status: "Active",
    });
  };

  // =========================================================
  // EDIT FORM CHANGE
  // =========================================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // UPDATE USER
  // =========================================================

  const updateUser = async (event) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    try {
      setSavingUser(true);
      setError("");

      if (!editForm.full_name.trim()) {
        throw new Error("Full name is required.");
      }

      if (!editForm.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!editForm.phone.trim()) {
        throw new Error("Phone number is required.");
      }

      if (!editForm.role.trim()) {
        throw new Error("Role is required.");
      }

      if (!editForm.status.trim()) {
        throw new Error("Status is required.");
      }

      if (!editForm.password.trim()) {
        throw new Error(
          "Please enter a new password when updating the user."
        );
      }

      const data = await apiPut(
        `/users/${editingUser.id}`,
        {
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          password: editForm.password,
          role: editForm.role,
          status: editForm.status,
        }
      );

      // Update user immediately in the table.
      if (data?.data) {
        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user.id === editingUser.id
              ? data.data
              : user
          )
        );
      } else {
        const updatedUsers = await fetchUsers();
        setUsers(updatedUsers);
      }

      closeEditModal();

      console.log("User updated successfully:", data);
    } catch (err) {
      console.error("User update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user."
      );
    } finally {
      setSavingUser(false);
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.full_name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(user.id);
      setError("");

      const data = await apiDelete(
        `/users/${user.id}`
      );

      // Remove deleted user immediately.
      setUsers((previousUsers) =>
        previousUsers.filter(
          (existingUser) =>
            existingUser.id !== user.id
        )
      );

      console.log("User deleted successfully:", data);
    } catch (err) {
      console.error("User delete error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete user."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) =>
      user.status?.toLowerCase() === "active"
  ).length;

  const inactiveUsers = users.filter(
    (user) =>
      user.status?.toLowerCase() === "inactive"
  ).length;

  const adminUsers = users.filter(
    (user) =>
      user.role?.toLowerCase() === "admin"
  ).length;

  const staffUsers = users.filter(
    (user) =>
      user.role?.toLowerCase() !== "admin"
  ).length;

  // =========================================================
  // ROLE CLASS
  // =========================================================

  const getRoleClass = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "user-role admin";

      case "dispatcher":
        return "user-role dispatcher";

      case "hospital":
        return "user-role hospital";

      case "citizen":
        return "user-role citizen";

      default:
        return "user-role";
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "user-status active";

      case "inactive":
        return "user-status inactive";

      default:
        return "user-status";
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="users-main">
        <div className="users-loading">
          <div className="users-loading-icon">
            👤
          </div>

          <h2>Loading Users...</h2>

          <p>
            Fetching the current RapidResQ users.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="users-main">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="users-header">

        <div className="users-header-left">

          <button
            type="button"
            className="back-button"
            onClick={goToDashboard}
          >
            ← Back to Dashboard
          </button>

          <h1>Users</h1>

          <p>
            Manage and monitor RapidResQ users
          </p>

        </div>

        <div className="users-header-actions">

          <button
            type="button"
            className="refresh-button"
            onClick={refreshUsers}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="add-user-button"
            onClick={() =>
              alert(
                "Add User functionality will be developed next."
              )
            }
          >
            + Add User
          </button>

        </div>

      </header>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="users-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="users-stats">

        <div className="user-stat-card total">
          <div className="stat-icon">👥</div>

          <div>
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
            <small>Registered users</small>
          </div>
        </div>

        <div className="user-stat-card active">
          <div className="stat-icon">✓</div>

          <div>
            <span>Active</span>
            <strong>{activeUsers}</strong>
            <small>Active accounts</small>
          </div>
        </div>

        <div className="user-stat-card inactive">
          <div className="stat-icon">!</div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveUsers}</strong>
            <small>Inactive accounts</small>
          </div>
        </div>

        <div className="user-stat-card admins">
          <div className="stat-icon">🛡</div>

          <div>
            <span>Admins</span>
            <strong>{adminUsers}</strong>
            <small>Administrator accounts</small>
          </div>
        </div>

        <div className="user-stat-card staff">
          <div className="stat-icon">👤</div>

          <div>
            <span>Other Users</span>
            <strong>{staffUsers}</strong>
            <small>Non-admin accounts</small>
          </div>
        </div>

      </section>

      {/* =====================================================
          USER TABLE
      ===================================================== */}

      <section className="users-table-card">

        <div className="users-table-header">

          <div>
            <h2>User Directory</h2>

            <p>
              All registered RapidResQ users
            </p>
          </div>

          <span className="user-count">
            {users.length}{" "}
            {users.length === 1
              ? "user"
              : "users"}
          </span>

        </div>

        {users.length === 0 ? (

          <div className="empty-users">

            <div className="empty-icon">
              👥
            </div>

            <h3>No Users Found</h3>

            <p>
              There are currently no registered users.
            </p>

          </div>

        ) : (

          <div className="users-table-wrapper">

            <table className="users-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {users.map((user) => (

                  <tr key={user.id}>

                    <td>
                      #{String(user.id).padStart(3, "0")}
                    </td>

                    <td>

                      <div className="user-name-cell">

                        <div className="user-avatar">
                          {user.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>

                        <div>

                          <strong>
                            {user.full_name || "N/A"}
                          </strong>

                          <small>
                            User account
                          </small>

                        </div>

                      </div>

                    </td>

                    <td>
                      {user.email || "N/A"}
                    </td>

                    <td>
                      {user.phone || "N/A"}
                    </td>

                    <td>

                      <span
                        className={getRoleClass(
                          user.role
                        )}
                      >
                        {user.role || "Unknown"}
                      </span>

                    </td>

                    <td>

                      <span
                        className={getStatusClass(
                          user.status
                        )}
                      >

                        <span className="status-dot"></span>

                        {user.status || "Unknown"}

                      </span>

                    </td>

                    <td>

                      <div className="user-actions">

                        <button
                          type="button"
                          className="edit-user-button"
                          onClick={() =>
                            openEditModal(user)
                          }
                          disabled={
                            deletingId === user.id
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-user-button"
                          onClick={() =>
                            deleteUser(user)
                          }
                          disabled={
                            deletingId === user.id
                          }
                        >
                          {deletingId === user.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {editingUser && (

        <div
          onClick={closeEditModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              boxShadow:
                "0 20px 50px rgba(0, 0, 0, 0.18)",
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    color: "#171717",
                  }}
                >
                  Edit User
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Update user account details
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingUser}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

            </div>

            {/* EDIT FORM */}

            <form onSubmit={updateUser}>

              {/* FULL NAME */}

              <div style={{ marginBottom: "16px" }}>

                <label
                  htmlFor="edit-full-name"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Full Name
                </label>

                <input
                  id="edit-full-name"
                  type="text"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />

              </div>

              {/* EMAIL */}

              <div style={{ marginBottom: "16px" }}>

                <label
                  htmlFor="edit-email"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Email
                </label>

                <input
                  id="edit-email"
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />

              </div>

              {/* PHONE */}

              <div style={{ marginBottom: "16px" }}>

                <label
                  htmlFor="edit-phone"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Phone
                </label>

                <input
                  id="edit-phone"
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />

              </div>

              {/* ROLE */}

              <div style={{ marginBottom: "16px" }}>

                <label
                  htmlFor="edit-role"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Role
                </label>

                <select
                  id="edit-role"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Citizen">Citizen</option>
                  <option value="Dispatcher">
                    Dispatcher
                  </option>
                  <option value="Hospital">
                    Hospital
                  </option>
                </select>

              </div>

              {/* STATUS */}

              <div style={{ marginBottom: "16px" }}>

                <label
                  htmlFor="edit-status"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Status
                </label>

                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

              </div>

              {/* PASSWORD */}

              <div style={{ marginBottom: "22px" }}>

                <label
                  htmlFor="edit-password"
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  New Password
                </label>

                <input
                  id="edit-password"
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  required
                  placeholder="Enter new password"
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#6b7280",
                    fontSize: "12px",
                  }}
                >
                  The current backend requires a
                  password when updating a user.
                </small>

              </div>

              {/* BUTTONS */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingUser}
                  style={{
                    padding: "10px 18px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: savingUser
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingUser}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#ef1b2d",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: savingUser
                      ? "not-allowed"
                      : "pointer",
                    opacity: savingUser ? 0.7 : 1,
                  }}
                >
                  {savingUser
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}

export default Users;