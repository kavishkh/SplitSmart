const API_BASE_URL = 'http://localhost:40001/api';

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
      // Try to parse error response, but handle case where there's no body
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content response (successful delete)
    if (response.status === 204) {
      return null; // Return null for successful delete operations
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// User API functions
export const userAPI = {
  getAll: () => apiCall('/users'),
  create: (userData) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getById: (id) => apiCall(`/users/${id}`),
};

// Group API functions
export const groupAPI = {
  getAll: () => {
    // Get user ID from localStorage for demo purposes
    // In production, this should come from authenticated session/JWT
    const storedUser = localStorage.getItem("user");
    let userId = 'user-tusha'; // Default demo user
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id || userId;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }
    
    return apiCall(`/groups?userId=${encodeURIComponent(userId)}`);
  },
  create: (groupData) => apiCall('/groups', {
    method: 'POST',
    body: JSON.stringify(groupData),
  }),
  getById: (id) => apiCall(`/groups/${id}`),
  update: (id, groupData) => apiCall(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(groupData),
  }),
  delete: (id) => apiCall(`/groups/${id}`, {
    method: 'DELETE',
  }),
  acceptInvitation: (id, email) => apiCall(`/groups/${id}/accept-invitation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  }),
  // Add function for sending invitation emails
  sendInvitation: (invitationData) => apiCall('/send-invitation-email', {
    method: 'POST',
    body: JSON.stringify(invitationData),
  }),
};

// Expense API functions
export const expenseAPI = {
  getAll: () => {
    // Get user ID from localStorage for demo purposes
    // In production, this should come from authenticated session/JWT
    const storedUser = localStorage.getItem("user");
    let userId = 'user-tusha'; // Default demo user
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id || userId;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }
    
    return apiCall(`/expenses?userId=${encodeURIComponent(userId)}`);
  },
  create: (expenseData) => apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  }),
  getByGroup: (groupId) => {
    // Get user ID from localStorage for demo purposes
    // In production, this should come from authenticated session/JWT
    const storedUser = localStorage.getItem("user");
    let userId = 'user-tusha'; // Default demo user
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id || userId;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }
    
    return apiCall(`/expenses/group/${groupId}?userId=${encodeURIComponent(userId)}`);
  },
  update: (id, expenseData) => apiCall(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  }),
  delete: (id) => apiCall(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

// Settlement API functions
export const settlementAPI = {
  getAll: () => {
    // Get user ID from localStorage for demo purposes
    // In production, this should come from authenticated session/JWT
    const storedUser = localStorage.getItem("user");
    let userId = 'user-tusha'; // Default demo user
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id || userId;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }
    
    return apiCall(`/settlements?userId=${encodeURIComponent(userId)}`);
  },
  getByGroup: (groupId) => {
    // Get user ID from localStorage for demo purposes
    // In production, this should come from authenticated session/JWT
    const storedUser = localStorage.getItem("user");
    let userId = 'user-tusha'; // Default demo user
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id || userId;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }
    
    return apiCall(`/settlements/group/${groupId}?userId=${encodeURIComponent(userId)}`);
  },
  create: (settlementData) => apiCall('/settlements', {
    method: 'POST',
    body: JSON.stringify(settlementData),
  }),
  confirm: (id) => apiCall(`/settlements/${id}/confirm`, {
    method: 'PATCH',
  }),
  delete: (id) => apiCall(`/settlements/${id}`, {
    method: 'DELETE',
  }),
};

// Health check
export const healthAPI = {
  check: () => apiCall('/health'),
};

export default {
  userAPI,
  groupAPI,
  expenseAPI,
  settlementAPI,
  healthAPI,
};