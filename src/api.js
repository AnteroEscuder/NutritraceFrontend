const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function authHeaders(token) {
  const headers = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(res) {
  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return data?.detail || data?.message || JSON.stringify(data);
    }
    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function request(path, { method = "GET", token, headers, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...authHeaders(token),
      ...headers,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  // 204 No Content
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

// --- Auth
export async function registerUser({ name, email, password }) {
  return request(`/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser({ email, password }) {
  const body = new URLSearchParams();
  body.append("username", email); // FastAPI OAuth2PasswordRequestForm
  body.append("password", password);

  const data = await request(`/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return data.access_token;
}

export async function getMe(token) {
  return request(`/auth/me`, { token });
}

// --- Users
export async function updateMe({ userId, payload, token }) {
  return request(`/users/${userId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteMe({ userId, token }) {
  return request(`/users/${userId}`, { method: "DELETE", token });
}

export async function getDailySummary({ userId, date, token }) {
  const qs = new URLSearchParams({ date });
  return request(`/users/${userId}/summary?${qs.toString()}`, { token });
}

// --- Foods
export async function listFoods({ token, search }) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/foods/${suffix}`, { token });
}

export async function createFood({ token, payload }) {
  return request(`/foods/`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateFood({ token, id, payload }) {
  return request(`/foods/${id}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteFood({ token, id }) {
  return request(`/foods/${id}`, { method: "DELETE", token });
}

// --- Meals
export async function listMeals({ token, day }) {
  const qs = new URLSearchParams();
  if (day) qs.set("day", day);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/meals/${suffix}`, { token });
}

export async function createMeal({ token, payload }) {
  return request(`/meals/`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateMeal({ token, id, payload }) {
  return request(`/meals/${id}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteMeal({ token, id }) {
  return request(`/meals/${id}`, { method: "DELETE", token });
}

// --- Goals
export async function getGoal(token) {
  return request(`/goals/`, { token });
}

export async function upsertGoal({ token, payload }) {
  return request(`/goals/`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


export async function listAllergens() {
  const res = await fetch(`${API_BASE}/allergens/`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("No se ha podido cargar la lista de alérgenos");
  }
  return res.json();
}

export async function getMyAllergies(token) {
  const res = await fetch(`${API_BASE}/profile/allergies`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error("No se han podido cargar tus alergias");
  }
  return res.json();
}

export async function updateMyAllergies(allergenIds, token) {
  const res = await fetch(`${API_BASE}/profile/allergies`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ allergen_ids: allergenIds }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "No se han podido guardar tus alergias");
  }
  return res.json();
}


export { API_BASE };
