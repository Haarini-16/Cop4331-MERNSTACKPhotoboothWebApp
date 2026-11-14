const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://147.182.191.129/api';

async function adminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed: ${response.status}`
    );
  }

  return data;
}

export function getAllUsers() {
  return adminRequest('/admin/users');
}

export function updateUserStatus(userId, isActive) {
  return adminRequest(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export function overridePassword(userId, newPassword) {
  return adminRequest(`/admin/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  });
}
