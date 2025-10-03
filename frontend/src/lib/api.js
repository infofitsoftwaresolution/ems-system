// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Get headers with auth token
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });
  }

  async verifyToken() {
    return this.request('/api/auth/verify');
  }

  async updatePassword(email, newPassword) {
    return this.request('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
      includeAuth: false,
    });
  }

  // Employee endpoints
  async getEmployees() {
    return this.request('/api/employees');
  }

  async getEmployee(id) {
    return this.request(`/api/employees/${id}`);
  }

  async createEmployee(employeeData) {
    return this.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id, employeeData) {
    return this.request(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id) {
    return this.request(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUsers() {
    return this.request('/api/users');
  }

  async getUser(id) {
    return this.request(`/api/users/${id}`);
  }

  // KYC endpoints
  async getKycSubmissions() {
    return this.request('/api/kyc');
  }

  async submitKyc(kycData) {
    return this.request('/api/kyc', {
      method: 'POST',
      body: JSON.stringify(kycData),
    });
  }

  async reviewKyc(id, reviewData) {
    return this.request(`/api/kyc/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async updateKycStatus(id, status) {
    return this.request(`/api/kyc/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ 
        status: status,
        reviewedBy: 'admin',
        remarks: `Status updated to ${status}`
      }),
    });
  }

  async getKycStatus(email) {
    return this.request(`/api/kyc?email=${email}`);
  }

  // Attendance endpoints
  async getTodayAttendance(email = null) {
    const userEmail = email || this.getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('User email is required for attendance data');
    }
    return this.request(`/api/attendance/today?email=${encodeURIComponent(userEmail)}`);
  }

  async getAllAttendance(filter = 'today') {
    return this.request(`/api/attendance?filter=${filter}`);
  }

  // Helper method to get current user email from token
  getCurrentUserEmail() {
    // Try to get email from localStorage first
    const storedEmail = localStorage.getItem('currentUserEmail');
    if (storedEmail) {
      return storedEmail;
    }
    
    // Try to get email from token
    const token = this.getAuthToken();
    if (token) {
      try {
        // Decode JWT token to get user info (basic decode without verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          // Store email in localStorage for future use
          localStorage.setItem('currentUserEmail', payload.email);
          return payload.email;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    // Try to get from user context if available
    const userContext = JSON.parse(localStorage.getItem('userContext') || '{}');
    if (userContext.email) {
      localStorage.setItem('currentUserEmail', userContext.email);
      return userContext.email;
    }
    
    return null;
  }

  async checkIn(locationData = null, fallbackEmail = null) {
    const userEmail = this.getCurrentUserEmail() || fallbackEmail;
    if (!userEmail) {
      throw new Error('User email is required for check-in');
    }
    
    const body = {
      email: userEmail
    };
    
    if (locationData) {
      body.latitude = locationData.latitude;
      body.longitude = locationData.longitude;
      body.address = locationData.fullAddress || locationData.address;
    }
    
    return this.request('/api/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async checkOut(locationData = null, fallbackEmail = null) {
    const userEmail = this.getCurrentUserEmail() || fallbackEmail;
    if (!userEmail) {
      throw new Error('User email is required for check-out');
    }
    
    const body = {
      email: userEmail
    };
    
    if (locationData) {
      body.latitude = locationData.latitude;
      body.longitude = locationData.longitude;
      body.address = locationData.fullAddress || locationData.address;
    }
    
    return this.request('/api/attendance/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }


  // Leave endpoints
  async getLeaves() {
    return this.request('/api/leaves');
  }

  async createLeave(leaveData) {
    return this.request('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async checkOut() {
    return this.request('/api/attendance/checkout', {
      method: 'POST',
    });
  }

  // Leave endpoints
  async getLeaves() {
    return this.request('/api/leaves');
  }


  async reviewLeave(id, reviewData) {
    return this.request(`/api/leaves/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Payslip endpoints
  async getPayslips() {
    return this.request('/api/payslip/all');
  }

  async getPayslip(id) {
    return this.request(`/api/payslip/${id}`);
  }

  async getEmployeePayslips(employeeId, month = null, year = null) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const queryString = params.toString();
    const endpoint = `/api/payslip/employee/${employeeId}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async generatePayslip(payslipData) {
    return this.request('/api/payslip/generate', {
      method: 'POST',
      body: JSON.stringify(payslipData),
    });
  }

  async updatePayslipStatus(id, status) {
    return this.request(`/api/payslip/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deletePayslip(id) {
    return this.request(`/api/payslip/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health', {
      includeAuth: false,
    });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
