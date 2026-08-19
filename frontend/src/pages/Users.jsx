import { useCallback, useEffect, useState } from "react";
import "./Users.css";

const API_URL = "http://127.0.0.1:8000";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // EDIT USER
  // ==========================================

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "Citizen",
    status: "Active",
  });
  const [savingUser, setSavingUser] = useState(false);

  // ==========================================
  // ADD USER
  // ==========================================

  const [addingUser, setAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "Citizen",
    status: "Active",
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // ==========================================
  // DELETE
  // ==========================================

  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToDashboard = () => {
    window.location.assign("/dashboard");
  };

  // ==========================================
  // TOKEN
  // ==========================================

  const getToken = () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      throw new Error("You are not logged in.");
    }

    return token;
  };

  // ==========================================
  // API RESPONSE ERROR
  // ==========================================

  const getErrorMessage = (data, fallback) => {
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item) => item.msg || "Validation error")
        .join(", ");
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    return fallback;
  };

  // ==========================================
  // LOAD USERS
  // ==========================================

  const fetchUsers = useCallback(async () => {
    const token = getToken();

    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        getErrorMessage(data, "Failed to load users.")
      );
    }

    return data.users || [];
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

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
          setError(err.message || "Unable to load users.");
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
  }, []);

  // ==========================================
  // REFRESH
  // ==========================================

  const refreshUsers = async () => {
    try {
      setError("");
      setLoading(true);

      const data = await fetchUsers();

      setUsers(data);
    } catch (err) {
      console.error("User refresh error:", err);

      setError(err.message || "Unable to refresh users.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EDIT USER
  // ==========================================

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
      role: "Citizen",
      status: "Active",
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const updateUser = async (event) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    try {
      setSavingUser(true);
      setError("");

      const token = getToken();

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

      const payload = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        status: editForm.status,
      };

      // Password is optional during update.
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const response = await fetch(
        `${API_URL}/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to update user.")
        );
      }

      if (data.data) {
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
        err.message || "Unable to update user."
      );
    } finally {
      setSavingUser(false);
    }
  };

  // ==========================================
  // ADD USER
  // ==========================================

  const openAddModal = () => {
    setError("");

    setAddForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role: "Citizen",
      status: "Active",
    });

    setAddingUser(true);
  };

  const closeAddModal = () => {
    if (creatingUser) {
      return;
    }

    setAddingUser(false);

    setAddForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role: "Citizen",
      status: "Active",
    });
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;

    setAddForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createUser = async (event) => {
    event.preventDefault();

    try {
      setCreatingUser(true);
      setError("");

      const token = getToken();

      if (!addForm.full_name.trim()) {
        throw new Error("Full name is required.");
      }

      if (!addForm.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!addForm.phone.trim()) {
        throw new Error("Phone number is required.");
      }

      if (!addForm.password.trim()) {
        throw new Error("Password is required.");
      }

      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: addForm.full_name.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim(),
          password: addForm.password,
          role: addForm.role,
          status: addForm.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to create user.")
        );
      }

      if (data.data) {
        setUsers((previousUsers) => [
          ...previousUsers,
          data.data,
        ]);
      } else {
        const updatedUsers = await fetchUsers();
        setUsers(updatedUsers);
      }

      closeAddModal();

      console.log("User created successfully:", data);
    } catch (err) {
      console.error("User create error:", err);

      setError(
        err.message || "Unable to create user."
      );
    } finally {
      setCreatingUser(false);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

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

      const token = getToken();

      const response = await fetch(
        `${API_URL}/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to delete user.")
        );
      }

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
        err.message || "Unable to delete user."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================

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

  // ==========================================
  // ROLE CLASS
  // ==========================================

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

  // ==========================================
  // STATUS CLASS
  // ==========================================

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

  // ==========================================
  // LOADING
  // ==========================================

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

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="users-main">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="users-header">

        <div className="users-header-left">

          <button
            type="button"
            className="back-button"
            onClick={goToDashboard}
          >
            ← Dashboard
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
            onClick={openAddModal}
          >
            + Add User
          </button>

        </div>

      </header>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="users-error">
          {error}
        </div>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <section className="users-stats">

        <div className="user-stat-card total">
          <div className="stat-icon">
            👥
          </div>

          <div>
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
            <small>Registered users</small>
          </div>
        </div>

        <div className="user-stat-card active">
          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>Active</span>
            <strong>{activeUsers}</strong>
            <small>Currently active</small>
          </div>
        </div>

        <div className="user-stat-card inactive">
          <div className="stat-icon">
            ⏸
          </div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveUsers}</strong>
            <small>Not active</small>
          </div>
        </div>

        <div className="user-stat-card admins">
          <div className="stat-icon">
            🛡
          </div>

          <div>
            <span>Admins</span>
            <strong>{adminUsers}</strong>
            <small>Administrators</small>
          </div>
        </div>

        <div className="user-stat-card staff">
          <div className="stat-icon">
            👤
          </div>

          <div>
            <span>Staff / Citizens</span>
            <strong>{staffUsers}</strong>
            <small>Non-admin users</small>
          </div>
        </div>

      </section>

      {/* ======================================
          USER TABLE
      ====================================== */}

      <section className="users-table-card">

        <div className="users-table-header">

          <div>
            <h2>User Network</h2>

            <p>
              All registered RapidResQ users
            </p>
          </div>

          <span className="user-count">
            {totalUsers}{" "}
            {totalUsers === 1 ? "user" : "users"}
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
                            {user.full_name}
                          </strong>

                          <small>
                            User ID: {user.id}
                          </small>

                        </div>

                      </div>

                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.phone}
                    </td>

                    <td>
                      <span
                        className={getRoleClass(
                          user.role
                        )}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          user.status
                        )}
                      >
                        <span className="status-dot" />
                        {user.status}
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
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-user-button"
                          disabled={
                            deletingId === user.id
                          }
                          onClick={() =>
                            deleteUser(user)
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

      {/* ======================================
          ADD USER MODAL
      ====================================== */}

      {addingUser && (

        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddModal();
            }
          }}
        >

          <div style={modalStyle}>

            <div style={modalHeaderStyle}>

              <div>
                <h2 style={modalTitleStyle}>
                  Add User
                </h2>

                <p style={modalSubtitleStyle}>
                  Create a new RapidResQ user
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                style={closeButtonStyle}
              >
                ×
              </button>

            </div>

            <form onSubmit={createUser}>

              <div style={formGridStyle}>

                <FormField
                  label="Full Name"
                  name="full_name"
                  value={addForm.full_name}
                  onChange={handleAddChange}
                  placeholder="Enter full name"
                />

                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={addForm.email}
                  onChange={handleAddChange}
                  placeholder="Enter email"
                />

                <FormField
                  label="Phone"
                  name="phone"
                  value={addForm.phone}
                  onChange={handleAddChange}
                  placeholder="Enter phone number"
                />

                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  value={addForm.password}
                  onChange={handleAddChange}
                  placeholder="Enter password"
                />

                <SelectField
                  label="Role"
                  name="role"
                  value={addForm.role}
                  onChange={handleAddChange}
                  options={[
                    "Citizen",
                    "Dispatcher",
                    "Hospital",
                    "Admin",
                  ]}
                />

                <SelectField
                  label="Status"
                  name="status"
                  value={addForm.status}
                  onChange={handleAddChange}
                  options={[
                    "Active",
                    "Inactive",
                  ]}
                />

              </div>

              <div style={modalActionsStyle}>

                <button
                  type="button"
                  onClick={closeAddModal}
                  style={cancelButtonStyle}
                  disabled={creatingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={saveButtonStyle}
                  disabled={creatingUser}
                >
                  {creatingUser
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================
          EDIT USER MODAL
      ====================================== */}

      {editingUser && (

        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >

          <div style={modalStyle}>

            <div style={modalHeaderStyle}>

              <div>
                <h2 style={modalTitleStyle}>
                  Edit User
                </h2>

                <p style={modalSubtitleStyle}>
                  Update user information
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                style={closeButtonStyle}
                disabled={savingUser}
              >
                ×
              </button>

            </div>

            <form onSubmit={updateUser}>

              <div style={formGridStyle}>

                <FormField
                  label="Full Name"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  placeholder="Enter full name"
                />

                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  placeholder="Enter email"
                />

                <FormField
                  label="Phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  placeholder="Enter phone number"
                />

                <FormField
                  label="New Password"
                  name="password"
                  type="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current password"
                />

                <SelectField
                  label="Role"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  options={[
                    "Citizen",
                    "Dispatcher",
                    "Hospital",
                    "Admin",
                  ]}
                />

                <SelectField
                  label="Status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  options={[
                    "Active",
                    "Inactive",
                  ]}
                />

              </div>

              <div
                style={{
                  marginTop: "8px",
                  padding: "10px 12px",
                  borderRadius: "7px",
                  background: "#f9fafb",
                  color: "#6b7280",
                  fontSize: "11px",
                }}
              >
                Leave the password field blank if you do not
                want to change the user's password.
              </div>

              <div style={modalActionsStyle}>

                <button
                  type="button"
                  onClick={closeEditModal}
                  style={cancelButtonStyle}
                  disabled={savingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={saveButtonStyle}
                  disabled={savingUser}
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

// ==========================================
// FORM COMPONENTS
// ==========================================

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <label style={fieldStyle}>

      <span style={fieldLabelStyle}>
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />

    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label style={fieldStyle}>

      <span style={fieldLabelStyle}>
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

    </label>
  );
}

// ==========================================
// MODAL STYLES
// ==========================================

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background: "rgba(17, 24, 39, 0.45)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "620px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "24px",
  borderRadius: "12px",
  background: "#ffffff",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
};

const modalTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "20px",
  fontWeight: 700,
};

const modalSubtitleStyle = {
  margin: "5px 0 0",
  color: "#6b7280",
  fontSize: "12px",
};

const closeButtonStyle = {
  width: "32px",
  height: "32px",
  border: "1px solid #e5e7eb",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#6b7280",
  fontSize: "20px",
  lineHeight: 1,
  cursor: "pointer",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const fieldLabelStyle = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  height: "40px",
  padding: "0 11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  outline: "none",
  background: "#ffffff",
  color: "#111827",
  fontSize: "12px",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "24px",
  paddingTop: "18px",
  borderTop: "1px solid #eeeeee",
};

const cancelButtonStyle = {
  height: "38px",
  padding: "0 16px",
  border: "1px solid #e5e7eb",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const saveButtonStyle = {
  height: "38px",
  padding: "0 18px",
  border: "1px solid #ef2929",
  borderRadius: "7px",
  background: "#ef2929",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

export default Users;