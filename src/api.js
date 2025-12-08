const API_BASE = "http://localhost:8000";

function authHeaders(token) {
  const headers = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al registrarse");
  }
  return res.json();
}

export async function loginUser(email, password) {
  const body = new URLSearchParams();
  body.append("username", email);   // FastAPI usa username/password
  body.append("password", password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al iniciar sesión");
  }

  const data = await res.json();
  return data.access_token;
}

export async function getCurrentUser(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error("No se ha podido obtener el usuario");
  }

  return res.json();
}

export async function listFoods(token) {
  const res = await fetch(`${API_BASE}/foods/`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error("No se ha podido cargar la lista de alimentos");
  }
  return res.json();
}

export async function createFood(food, token) {
  const res = await fetch(`${API_BASE}/foods/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(food),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "No se ha podido crear el alimento");
  }
  return res.json();
}

export async function deleteFood(id, token) {
  const res = await fetch(`${API_BASE}/foods/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "No se ha podido borrar el alimento");
  }
  return res.json();
}

export async function updateFood(id, food, token) {
  const res = await fetch(`${API_BASE}/foods/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(food),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "No se ha podido actualizar el alimento");
  }
  return res.json();
}

export async function getGoals(token) {
  const res = await fetch(`${API_BASE}/goals/me`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  return res.json();
}

export async function createGoals(data, token) {
  const res = await fetch(`${API_BASE}/goals/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateGoals(data, token) {
  const res = await fetch(`${API_BASE}/goals/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
