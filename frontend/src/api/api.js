const API_URL = "http://127.0.0.1:8000";

// ============================================================
// TOKEN
// ============================================================

export function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

// ============================================================
// COMMON API REQUEST
// ============================================================

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Session expired. Please login again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "You do not have permission to perform this action."
      );
    }

    throw new Error(
      data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

// ============================================================
// GET
// ============================================================

export async function apiGet(endpoint) {
  return apiRequest(endpoint, {
    method: "GET",
  });
}

// ============================================================
// POST
// ============================================================

export async function apiPost(endpoint, body = {}) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ============================================================
// PUT
// ============================================================

export async function apiPut(endpoint, body = {}) {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ============================================================
// DELETE
// ============================================================

export async function apiDelete(endpoint) {
  return apiRequest(endpoint, {
    method: "DELETE",
  });
}

// ============================================================
// API URL
// ============================================================

export { API_URL };