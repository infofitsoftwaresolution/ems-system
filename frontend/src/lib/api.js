// API service for communicating with the backend
// Use relative path in production (empty string means same origin), or environment variable
// In production, use relative paths so it works through Nginx proxy
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem("authToken");
  }

  // Get headers with auth token
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
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
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        
        // Provide more specific error messages for common status codes
        if (response.status === 403) {
          throw new Error(errorData.message || "Insufficient permissions");
        } else if (response.status === 401) {
          throw new Error(errorData.message || "Authentication required");
        } else if (response.status === 404) {
          throw new Error(errorData.message || "Resource not found");
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);

      // Check if it's a connection error (backend server not running)
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("ERR_CONNECTION_REFUSED") ||
        error.name === "TypeError" ||
        error.message.includes("NetworkError")
      ) {
        throw new Error(
          "Backend server is not running. Please start the backend server on port 3001."
        );
      }

      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });
  }

  async verifyToken() {
    return this.request("/api/auth/verify");
  }

  // Employee endpoints
  async getEmployees() {
    return this.request("/api/employees");
  }

  async getEmployee(id) {
    return this.request(`/api/employees/${id}`);
  }

  async createEmployee(employeeData) {
    return this.request("/api/employees", {
      method: "POST",
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id, employeeData) {
    return this.request(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id) {
    return this.request(`/api/employees/${id}`, {
      method: "DELETE",
    });
  }

  // Export employees as CSV
  async exportEmployeesCSV() {
    const url = `${this.baseURL}/api/employees/export/csv`;
    const token = this.getAuthToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Export failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "employees.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Export single employee as CSV
  async exportEmployeeCSV(id) {
    const url = `${this.baseURL}/api/employees/${id}/export/csv`;
    const token = this.getAuthToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Export failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `employee_${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // User endpoints
  async getUsers() {
    return this.request("/api/users");
  }

  async getUser(id) {
    return this.request(`/api/users/${id}`);
  }

  async getUserProfile() {
    return this.request("/api/users/me/profile");
  }

  async updateUserProfile(email, profileData) {
    return this.request(`/api/users/${email}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async updatePassword(currentPassword, newPassword) {
    return this.request("/api/auth/update-password", {
      method: "POST",
      body: JSON.stringify({
        email: this.getCurrentUserEmail(),
        currentPassword,
        newPassword,
      }),
    });
  }

  // Force password change (for mustChangePassword scenarios)
  async forcePasswordChange(newPassword) {
    return this.request("/api/auth/update-password", {
      method: "POST",
      body: JSON.stringify({
        email: this.getCurrentUserEmail(),
        newPassword,
        forceChange: true,
      }),
    });
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = this.getAuthToken();

    // For FormData, don't set Content-Type - browser will set it automatically with boundary
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}/api/users/upload-avatar`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({
            message: `Upload failed with status ${response.status}`,
          }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Avatar upload error:", error);
      // Check if it's a network error
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("ERR_CONNECTION_REFUSED") ||
        error.name === "TypeError"
      ) {
        throw new Error(
          "Backend server is not running. Please start the backend server."
        );
      }
      throw error;
    }
  }

  async removeAvatar() {
    return this.request("/api/users/remove-avatar", {
      method: "DELETE",
    });
  }

  getCurrentUserEmail() {
    // Try to get from localStorage - check multiple possible keys
    try {
      // First, try currentUserEmail (set by auth context)
      const currentUserEmail = localStorage.getItem("currentUserEmail");
      if (currentUserEmail) {
        return currentUserEmail;
      }

      // Second, try userContext (set by auth context)
      const userContextStr = localStorage.getItem("userContext");
      if (userContextStr) {
        const user = JSON.parse(userContextStr);
        if (user && user.email) {
          return user.email;
        }
      }

      // Third, try user (legacy key)
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.email) {
          return user.email;
        }
      }
    } catch (error) {
      console.error("Error getting current user email:", error);
    }
    return null;
  }

  // KYC endpoints
  async getKycSubmissions() {
    return this.request("/api/kyc");
  }

  async submitKyc(kycData) {
    return this.request("/api/kyc", {
      method: "POST",
      body: JSON.stringify(kycData),
    });
  }

  async reviewKyc(id, reviewData) {
    return this.request(`/api/kyc/${id}/review`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  }

  async updateKycStatus(id, status) {
    return this.request(`/api/kyc/${id}/review`, {
      method: "POST",
      body: JSON.stringify({
        status: status,
        reviewedBy: "admin",
        remarks: `Status updated to ${status}`,
      }),
    });
  }

  async getKycStatus(email) {
    return this.request(`/api/kyc?email=${email}`);
  }

  // Document-level review endpoints
  async reviewDocument(kycId, documentType, action, remark = null) {
    return this.request(`/api/kyc/${kycId}/document/${documentType}/review`, {
      method: "POST",
      body: JSON.stringify({ action, remark }),
    });
  }

  async reviewEducationDocument(kycId, index, action, remark = null) {
    return this.request(`/api/kyc/${kycId}/document/education/${index}/review`, {
      method: "POST",
      body: JSON.stringify({ action, remark }),
    });
  }

  async reuploadDocument(kycId, documentType, file, documentIndex = null) {
    const formData = new FormData();
    formData.append("file", file);
    
    // Add documentIndex for education documents
    if (documentIndex !== null && documentIndex !== undefined) {
      formData.append("documentIndex", documentIndex.toString());
    }

    const url = `${this.baseURL}/api/kyc/${kycId}/document/${documentType}/reupload`;
    const token = this.getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser sets it automatically with boundary

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getRejectedDocuments() {
    return this.request("/api/kyc/rejected-documents");
  }

  // Attendance endpoints
  async getTodayAttendance(email = null) {
    const userEmail = email || this.getCurrentUserEmail();
    if (!userEmail) {
      throw new Error("User email is required for attendance data");
    }
    return this.request(
      `/api/attendance/today?email=${encodeURIComponent(userEmail)}`
    );
  }

  async getAllAttendance(filter = "today") {
    return this.request(`/api/attendance?filter=${filter}`);
  }

  // Get employee's own attendance history
  async getMyAttendance(filter = "all") {
    return this.request(`/api/attendance/my?filter=${filter}`);
  }

  async checkIn(locationData = null, fallbackEmail = null, photoBase64 = null) {
    const userEmail = this.getCurrentUserEmail() || fallbackEmail;
    if (!userEmail) {
      throw new Error("User email is required for check-in");
    }

    const body = {
      email: userEmail,
    };

    if (locationData) {
      body.latitude = locationData.latitude;
      body.longitude = locationData.longitude;
      body.address = locationData.fullAddress || locationData.address;
    }

    if (photoBase64) {
      body.photoBase64 = photoBase64;
    }

    return this.request("/api/attendance/checkin", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async checkOut(
    locationData = null,
    fallbackEmail = null,
    photoBase64 = null
  ) {
    const userEmail = this.getCurrentUserEmail() || fallbackEmail;
    if (!userEmail) {
      throw new Error("User email is required for check-out");
    }

    const body = {
      email: userEmail,
    };

    if (locationData) {
      body.latitude = locationData.latitude;
      body.longitude = locationData.longitude;
      body.address = locationData.fullAddress || locationData.address;
    }

    if (photoBase64) {
      body.photoBase64 = photoBase64;
    }

    console.log("🔍 Checkout API call:", {
      userEmail,
      locationData,
      hasPhoto: !!photoBase64,
      body,
    });

    return this.request("/api/attendance/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Leave endpoints
  async getLeaves(email = null) {
    const url = email
      ? `/api/leaves?email=${encodeURIComponent(email)}`
      : "/api/leaves";
    return this.request(url);
  }

  async createLeave(leaveData) {
    return this.request("/api/leaves", {
      method: "POST",
      body: JSON.stringify(leaveData),
    });
  }

  async reviewLeave(id, reviewData) {
    return this.request(`/api/leaves/${id}/review`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  }

  // Payslip endpoints
  async getPayslips() {
    return this.request("/api/payslip/all");
  }

  async getPayslip(id) {
    return this.request(`/api/payslip/${id}`);
  }

  async getEmployeePayslips(employeeId, month = null, year = null) {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);

    const queryString = params.toString();
    const endpoint = `/api/payslip/employee/${employeeId}${
      queryString ? `?${queryString}` : ""
    }`;
    return this.request(endpoint);
  }

  async generatePayslip(payslipData) {
    return this.request("/api/payslip/generate", {
      method: "POST",
      body: JSON.stringify(payslipData),
    });
  }

  async updatePayslipStatus(id, status) {
    return this.request(`/api/payslip/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deletePayslip(id) {
    return this.request(`/api/payslip/${id}`, {
      method: "DELETE",
    });
  }

  // Health check
  async healthCheck() {
    return this.request("/api/health", {
      includeAuth: false,
    });
  }

  // Course request endpoints
  async requestCourse(courseData) {
    return this.request("/api/courses/request", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
  }

  async getCourses() {
    return this.request("/api/courses");
  }

  // Task endpoints
  async getMyTasks() {
    return this.request("/api/tasks/feed/my-tasks");
  }

  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.assigneeId) params.append("assigneeId", filters.assigneeId);

    const queryString = params.toString();
    const response = await this.request(
      `/api/tasks${queryString ? `?${queryString}` : ""}`
    );
    // Handle new response format: { success: true, data: [...] }
    return response.success ? response.data : response;
  }

  async getTask(id) {
    return this.request(`/api/tasks/${id}`);
  }

  async createTask(taskData) {
    const response = await this.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async updateTask(id, taskData) {
    const response = await this.request(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async updateTaskStatus(id, status) {
    const response = await this.request(`/api/tasks/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async markTaskAsComplete(id) {
    const response = await this.request(`/api/tasks/${id}/complete`, {
      method: "PUT",
    });
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  }

  // Event endpoints
  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.start) params.append("start", filters.start);
    if (filters.end) params.append("end", filters.end);

    const queryString = params.toString();
    const response = await this.request(
      `/api/events${queryString ? `?${queryString}` : ""}`
    );
    // Handle new response format: { success: true, data: [...] }
    return response.success ? response.data : response;
  }

  async getEvent(id) {
    const response = await this.request(`/api/events/${id}`);
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async createEvent(eventData) {
    const response = await this.request("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async updateEvent(id, eventData) {
    const response = await this.request(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
    // Handle new response format: { success: true, data: {...} }
    return response.success ? response.data : response;
  }

  async deleteEvent(id) {
    return this.request(`/api/events/${id}`, {
      method: "DELETE",
    });
  }

  // Message endpoints
  async getMessages() {
    return this.request("/api/messages");
  }

  async getConversations() {
    return this.request("/api/messages/conversations");
  }

  async getConversation(recipientEmail) {
    return this.request(
      `/api/messages/conversation/${encodeURIComponent(recipientEmail)}`
    );
  }

  async sendMessage(
    recipientEmail,
    content,
    channelId = null,
    channelName = null
  ) {
    return this.request("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientEmail,
        content,
        channelId,
        channelName,
      }),
    });
  }

  async markMessagesAsRead(senderEmail) {
    return this.request("/api/messages/read", {
      method: "PUT",
      body: JSON.stringify({ senderEmail }),
    });
  }

  async getUnreadCount() {
    return this.request("/api/messages/unread-count");
  }

  async getChannels() {
    return this.request("/api/messages/channels");
  }

  async getChannelMessages(channelId) {
    return this.request(
      `/api/messages/channel/${encodeURIComponent(channelId)}`
    );
  }

  // Event endpoints
  async getMyEvents() {
    return this.request("/api/events/feed/my-events");
  }

  // Notification endpoints
  async getNotifications(
    limit = 50,
    offset = 0,
    unreadOnly = false,
    eventId = null
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    if (eventId) {
      params.append("eventId", eventId.toString());
    }
    return this.request(`/api/notifications?${params}`);
  }

  async getUnreadNotificationCount() {
    return this.request("/api/notifications/unread-count");
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead() {
    return this.request("/api/notifications/read-all", {
      method: "PUT",
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  async createNotification(data) {
    return this.request("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getChannels() {
    return this.request("/api/messages/channels");
  }

  async getChannelMessages(channelId) {
    return this.request(
      `/api/messages/channel/${encodeURIComponent(channelId)}`
    );
  }

  // Analytics endpoints
  async getTeamActivity(period = "week") {
    const response = await this.request(
      `/api/analytics/team-activity?period=${period}`
    );
    return response.success ? response.data : response;
  }

  async getTrainingMetrics() {
    const response = await this.request("/api/analytics/training-metrics");
    return response.success ? response.data : response;
  }

  async getDepartmentStats() {
    const response = await this.request("/api/analytics/departments");
    return response.success ? response.data : response;
  }

  // Session management endpoints
  async getMySessions() {
    return this.request("/api/sessions/me");
  }

  async revokeSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    });
  }

  async revokeAllOtherSessions() {
    return this.request("/api/sessions/me/others", {
      method: "DELETE",
    });
  }

  async revokeAllSessions() {
    return this.request("/api/sessions/me/all", {
      method: "DELETE",
    });
  }

  // Two-factor authentication endpoints
  async setupTwoFactor() {
    return this.request("/api/two-factor/setup", {
      method: "POST",
    });
  }

  async verifyTwoFactor(token, backupCodes) {
    return this.request("/api/two-factor/verify", {
      method: "POST",
      body: JSON.stringify({ token, backupCodes }),
    });
  }

  async disableTwoFactor() {
    return this.request("/api/two-factor/disable", {
      method: "POST",
    });
  }

  async getTwoFactorStatus() {
    return this.request("/api/two-factor/status");
  }

  async verifyBackupCode(email, backupCode) {
    return this.request("/api/two-factor/verify-backup", {
      method: "POST",
      body: JSON.stringify({ email, backupCode }),
    });
  }

  // Reset security settings
  async resetSecuritySettings() {
    return this.request(`/api/users/${this.getCurrentUserEmail()}`, {
      method: "PUT",
      body: JSON.stringify({
        securitySettings: {
          twoFactor: false,
          sessionTimeout: "30",
          rememberDevices: true,
          loginAlerts: true,
        },
      }),
    });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
