const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function with better error handling
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Handle network errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    // Return empty data structure instead of throwing to prevent app crashes
    if (endpoint.includes('/groups')) {
      return [];
    } else if (endpoint.includes('/expenses')) {
      return [];
    } else if (endpoint.includes('/settlements')) {
      return [];
    } else if (endpoint.includes('/users')) {
      return [];
    }
    throw error;
  }
};

// User API functions
export const userAPI = {
  getAll: () => apiCall('/users').catch(() => []),
  create: (userData) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }).catch(() => ({})),
  getById: (id) => apiCall(`/users/${id}`).catch(() => ({})),
};

// Group API functions
export const groupAPI = {
  getAll: () => apiCall('/groups').catch(() => []),
  create: (groupData) => apiCall('/groups', {
    method: 'POST',
    body: JSON.stringify({
      ...groupData,
      id: Date.now().toString(),
      createdBy: 'current-user', // Will be updated with actual user system
    }),
  }).catch(() => ({})),
  getById: (id) => apiCall(`/groups/${id}`).catch(() => ({})),
  update: (id, groupData) => apiCall(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(groupData),
  }).catch(() => ({})),
  delete: (id) => apiCall(`/groups/${id}`, {
    method: 'DELETE',
  }).catch(() => ({})),
};

// Expense API functions
export const expenseAPI = {
  getAll: () => apiCall('/expenses').catch(() => []),
  create: (expenseData) => apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      ...expenseData,
      id: Date.now().toString(),
      date: new Date(),
    }),
  }).catch(() => ({})),
  getByGroup: (groupId) => apiCall(`/expenses/group/${groupId}`).catch(() => []),
  update: (id, expenseData) => apiCall(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  }).catch(() => ({})),
  delete: (id) => apiCall(`/expenses/${id}`, {
    method: 'DELETE',
  }).catch(() => ({})),
};

// Settlement API functions
export const settlementAPI = {
  getAll: () => apiCall('/settlements').catch(() => []),
  create: (settlementData) => apiCall('/settlements', {
    method: 'POST',
    body: JSON.stringify({
      ...settlementData,
      id: Date.now().toString(),
      date: new Date(),
    }),
  }).catch(() => ({})),
  confirm: (id) => apiCall(`/settlements/${id}/confirm`, {
    method: 'PATCH',
  }).catch(() => ({})),
  delete: (id) => apiCall(`/settlements/${id}`, {
    method: 'DELETE',
  }).catch(() => ({})),
};

// Health check
export const healthAPI = {
  check: () => apiCall('/health').catch(() => ({ status: 'offline' })),
};

export default {
  userAPI,
  groupAPI,
  expenseAPI,
  settlementAPI,
  healthAPI,
};