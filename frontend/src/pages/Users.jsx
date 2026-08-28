import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api";
import "./Users.css";


function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit user
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

  // Add user
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

  // Delete user
  const [deletingId, setDeletingId] = useState(null);

  // =========================================================
  // HELPERS
  // =========================================================

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goToDashboard = () => {
    window.location.assign("/dashboard");
  };

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = useCallback(async () => {
    const data = await apiGet("/users");

    return Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data)
          ? data.data
          : [];
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
  }, [fetchUsers]);

  // =========================================================
  // REFRESH
  // =========================================================

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

  // =========================================================
  // ADD USER
  // =========================================================

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
    if (creatingUser) return;

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

      const data = await apiPost("/users", {
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        role: addForm.role,
        status: addForm.status,
      });

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
      setError(err.message || "Unable to create user.");
    } finally {
      setCreatingUser(false);
    }
  };

  // =========================================================
  // EDIT USER
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

  const closeEditModal = () => {
    if (savingUser) return;

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

    if (!editingUser) return;

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
      setError(err.message || "Unable to update user.");
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

    if (!confirmed) return;

    try {
      setDeletingId(user.id);
      setError("");

      const data = await apiDelete(
        `/users/${user.id}`
      );

      setUsers((previousUsers) =>
        previousUsers.filter(
          (existingUser) =>
            existingUser.id !== user.id
        )
      );

      console.log("User deleted successfully:", data);
    } catch (err) {
      console.error("User delete error:", err);
      setError(err.message || "Unable to delete user.");
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

      {/* HEADER */}
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

      {/* ERROR */}
      {error && (
        <div className="users-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* STATISTICS */}
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
            <small>Currently active</small>
          </div>
        </div>

        <div className="user-stat-card inactive">
          <div className="stat-icon">!</div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveUsers}</strong>
            <small>Not active</small>
          </div>
        </div>

        <div className="user-stat-card admins">
          <div className="stat-icon">🛡</div>

          <div>
            <span>Admins</span>
            <strong>{adminUsers}</strong>
            <small>Administrators</small>
          </div>
        </div>

        <div className="user-stat-card staff">
          <div className="stat-icon">👤</div>

          <div>
            <span>Staff / Citizens</span>
            <strong>{staffUsers}</strong>
            <small>Non-admin users</small>
          </div>
        </div>

      </section>

      {/* USER TABLE */}
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
                            {user.full_name || "N/A"}
                          </strong>

                          <small>
                            User ID: {user.id}
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
          ADD USER MODAL
      ===================================================== */}

      {addingUser && (

        <div
          className="modal-overlay"
          onClick={closeAddModal}
        >

          <div
            className="user-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>Add User</h2>

                <p>
                  Create a new RapidResQ user account
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAddModal}
                disabled={creatingUser}
              >
                ×
              </button>

            </div>

            <form onSubmit={createUser}>

              <div className="form-group">
                <label htmlFor="add-full-name">
                  Full Name
                </label>

                <input
                  id="add-full-name"
                  type="text"
                  name="full_name"
                  value={addForm.full_name}
                  onChange={handleAddChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-email">
                  Email
                </label>

                <input
                  id="add-email"
                  type="email"
                  name="email"
                  value={addForm.email}
                  onChange={handleAddChange}
                  required
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-phone">
                  Phone
                </label>

                <input
                  id="add-phone"
                  type="text"
                  name="phone"
                  value={addForm.phone}
                  onChange={handleAddChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-role">
                  Role
                </label>

                <select
                  id="add-role"
                  name="role"
                  value={addForm.role}
                  onChange={handleAddChange}
                  required
                >
                  <option value="Admin">
                    Admin
                  </option>

                  <option value="Citizen">
                    Citizen
                  </option>

                  <option value="Dispatcher">
                    Dispatcher
                  </option>

                  <option value="Hospital">
                    Hospital
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="add-status">
                  Status
                </label>

                <select
                  id="add-status"
                  name="status"
                  value={addForm.status}
                  onChange={handleAddChange}
                  required
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="add-password">
                  Password
                </label>

                <input
                  id="add-password"
                  type="password"
                  name="password"
                  value={addForm.password}
                  onChange={handleAddChange}
                  required
                  placeholder="Enter password"
                />
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeAddModal}
                  disabled={creatingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
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

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {editingUser && (

        <div
          className="modal-overlay"
          onClick={closeEditModal}
        >

          <div
            className="user-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>Edit User</h2>

                <p>
                  Update user account details
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeEditModal}
                disabled={savingUser}
              >
                ×
              </button>

            </div>

            <form onSubmit={updateUser}>

              <div className="form-group">
                <label htmlFor="edit-full-name">
                  Full Name
                </label>

                <input
                  id="edit-full-name"
                  type="text"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">
                  Email
                </label>

                <input
                  id="edit-email"
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-phone">
                  Phone
                </label>

                <input
                  id="edit-phone"
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-role">
                  Role
                </label>

                <select
                  id="edit-role"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  required
                >
                  <option value="Admin">
                    Admin
                  </option>

                  <option value="Citizen">
                    Citizen
                  </option>

                  <option value="Dispatcher">
                    Dispatcher
                  </option>

                  <option value="Hospital">
                    Hospital
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">
                  Status
                </label>

                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  required
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-password">
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
                />

                <small className="form-help">
                  Enter a new password when updating
                  the user.
                </small>
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeEditModal}
                  disabled={savingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
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

export default Users;