// Mock API functions for development
let mockEmployees = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@company.com",
    role: "Software Engineer",
    department: "Engineering",
    hireDate: "2023-01-15",
    salary: 1200000,
    status: "active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@company.com",
    role: "Product Manager",
    department: "Product",
    hireDate: "2022-08-20",
    salary: 1500000,
    status: "active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    role: "Sales Representative",
    department: "Sales",
    hireDate: "2023-03-10",
    salary: 800000,
    status: "active",
  },
];

// Initialize localStorage with default data if empty
const initializeEmployees = () => {
  const storedEmployees = localStorage.getItem("employees");
  if (!storedEmployees) {
    localStorage.setItem("employees", JSON.stringify(mockEmployees));
  } else {
    mockEmployees = JSON.parse(storedEmployees);
  }
};

// Initialize on module load
initializeEmployees();

// --- Auth/User store (localStorage-backed) ---
const defaultUsers = [
  {
    email: "admin@company.com",
    password: "admin123",
    role: "admin",
    name: "Admin User",
    mustChangePassword: false,
  },
  {
    email: "manager@company.com",
    password: "manager123",
    role: "manager",
    name: "Manager User",
    mustChangePassword: true,
  },
  {
    email: "employee@company.com",
    password: "employee123",
    role: "employee",
    name: "Employee User",
    mustChangePassword: true,
  },
];

const getUsersFromStorage = () => {
  const stored = localStorage.getItem("users");
  if (!stored) {
    localStorage.setItem("users", JSON.stringify(defaultUsers));
    return [...defaultUsers];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    // Reset on parse error
    localStorage.setItem("users", JSON.stringify(defaultUsers));
    return [...defaultUsers];
  }
};

const saveUsersToStorage = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  login: async (email, password) => {
    // Backend only to avoid logging in with stale mock credentials
    const res = await apiClient.post("/auth/login", { email, password });
    if (res?.token) return res;
    throw new Error("Login failed");
  },

  logout: async () => {
    await delay(200);
    return { success: true };
  },

  updatePassword: async (email, newPassword) => {
    // Backend only
    const res = await apiClient.post("/auth/update-password", {
      email,
      newPassword,
    });
    if (res?.success) return res;
    throw new Error("Failed to update password");
  },

  createUserForEmployee: async ({ name, email, role = "employee" }) => {
    // Mock-only helper; backend creates user when /employees POST occurs
    const users = getUsersFromStorage();
    const exists = users.some((u) => u.email === email);
    if (!exists) {
      users.push({
        email,
        password: "temp123",
        role:
          role === "HR Manager" || role === "Manager" ? "manager" : "employee",
        name: name || email,
        mustChangePassword: true,
      });
      saveUsersToStorage(users);
    }
    return { success: true };
  },
};

export const employeeService = {
  getEmployees: async () => {
    // Try backend first with cache busting
    try {
      const res = await apiClient.get(`/employees?t=${Date.now()}`);
      if (Array.isArray(res)) return res;
    } catch (error) {
      console.warn("Backend employees API failed, using fallback:", error);
    }
    await delay(400);
    const storedEmployees = localStorage.getItem("employees");
    return storedEmployees ? JSON.parse(storedEmployees) : mockEmployees;
  },

  getEmployee: async (id) => {
    try {
      const res = await apiClient.get(`/employees/${id}`);
      if (res?.id) return res;
    } catch (_) {}
    await delay(300);
    const employees = await employeeService.getEmployees();
    const employee = employees.find((emp) => emp.id === parseInt(id));
    if (!employee) throw new Error("Employee not found");
    return employee;
  },

  getEmployeeByEmail: async (email) => {
    try {
      const res = await apiClient.get(`/employees/email/${email}`);
      if (res?.id) return res;
    } catch (_) {}
    await delay(300);
    const employees = await employeeService.getEmployees();
    const employee = employees.find((emp) => emp.email === email);
    if (!employee) throw new Error("Employee not found");
    return employee;
  },

  createEmployee: async (employeeData) => {
    // Try backend first
    try {
      const res = await apiClient.post("/employees", employeeData);
      if (res?.id) return res;
    } catch (error) {
      console.error("Backend employee creation failed:", error);
      // Continue to fallback
    }
    await delay(500);
    const employees = await employeeService.getEmployees();
    const newEmployee = {
      id: Math.max(...employees.map((emp) => emp.id)) + 1,
      ...employeeData,
      hireDate: employeeData.hireDate || new Date().toISOString().split("T")[0],
      status: "active",
    };
    const updatedEmployees = [...employees, newEmployee];
    localStorage.setItem("employees", JSON.stringify(updatedEmployees));
    try {
      await authService.createUserForEmployee({
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
      });
    } catch (_) {}
    return newEmployee;
  },

  updateEmployee: async (id, employeeData) => {
    try {
      const res = await apiClient.put(`/employees/${id}`, employeeData);
      if (res?.id) return res;
    } catch (_) {}
    await delay(300);
    const employees = await employeeService.getEmployees();
    const index = employees.findIndex((emp) => emp.id === parseInt(id));
    if (index === -1) throw new Error("Employee not found");
    const updatedEmployee = { ...employees[index], ...employeeData };
    employees[index] = updatedEmployee;
    localStorage.setItem("employees", JSON.stringify(employees));
    return updatedEmployee;
  },

  deleteEmployee: async (id) => {
    try {
      const res = await apiClient.delete(`/employees/${id}`);
      if (res?.success) return res;
    } catch (_) {}
    await delay(250);
    const employees = await employeeService.getEmployees();
    const index = employees.findIndex((emp) => emp.id === parseInt(id));
    if (index === -1) throw new Error("Employee not found");
    employees.splice(index, 1);
    localStorage.setItem("employees", JSON.stringify(employees));
    return { success: true };
  },
};

// Real API configuration for future use
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://13.233.73.43:3001/api";

export const apiClient = {
  get: async (endpoint) => {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return ct.includes("application/json") ? res.json() : res.text();
  },

  post: async (endpoint, data) => {
    const token = localStorage.getItem("token");
    const isForm = typeof FormData !== "undefined" && data instanceof FormData;
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!isForm) headers["Content-Type"] = "application/json";
    const body = isForm ? data : JSON.stringify(data);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body,
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return ct.includes("application/json") ? res.json() : res.text();
  },

  put: async (endpoint, data) => {
    const token = localStorage.getItem("token");
    const isForm = typeof FormData !== "undefined" && data instanceof FormData;
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!isForm) headers["Content-Type"] = "application/json";
    const body = isForm ? data : JSON.stringify(data);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body,
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return ct.includes("application/json") ? res.json() : res.text();
  },

  delete: async (endpoint) => {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return ct.includes("application/json") ? res.json() : res.text();
  },
};

// KYC service
export const kycService = {
  submit: async (payload) => {
    try {
      const res = await apiClient.post("/kyc", payload);
      if (res?.id) return res;
    } catch (_) {}
    // fallback to localStorage for demo
    const list = JSON.parse(localStorage.getItem("kyc_requests") || "[]");
    const nextId = (list[list.length - 1]?.id || 0) + 1;
    const created = {
      id: nextId,
      status: "pending",
      submittedAt: new Date().toISOString(),
      ...payload,
    };
    list.push(created);
    localStorage.setItem("kyc_requests", JSON.stringify(list));
    return created;
  },
  list: async () => {
    try {
      const res = await apiClient.get("/kyc");
      if (Array.isArray(res)) return res;
    } catch (_) {}
    return JSON.parse(localStorage.getItem("kyc_requests") || "[]");
  },
  review: async (id, { status, reviewedBy, remarks }) => {
    try {
      const res = await apiClient.post(`/kyc/${id}/review`, {
        status,
        reviewedBy,
        remarks,
      });
      if (res?.id) return res;
    } catch (_) {}
    // fallback update
    const list = JSON.parse(localStorage.getItem("kyc_requests") || "[]");
    const idx = list.findIndex((i) => i.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        remarks,
      };
      localStorage.setItem("kyc_requests", JSON.stringify(list));
      return list[idx];
    }
    throw new Error("KYC not found");
  },
  checkStatus: async (email) => {
    try {
      const res = await apiClient.get(`/kyc?email=${email}`);
      console.log("KYC service response:", res);
      return res;
    } catch (error) {
      console.error("Error checking KYC status:", error);
      return { status: "pending", message: "Error checking KYC status" };
    }
  },
};

// Attendance service
export const attendanceService = {
  getToday: async (email) => {
    try {
      const res = await apiClient.get(
        `/attendance/today?email=${encodeURIComponent(email)}`
      );
      return res && typeof res === "string" ? null : res; // be resilient if server returns empty
    } catch (_) {
      return null;
    }
  },
  getAll: async (filter = "today") => {
    try {
      const res = await apiClient.get(`/attendance?filter=${filter}`);
      return res || [];
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      return [];
    }
  },
  checkIn: async ({ email, name, latitude, longitude, address }) => {
    const res = await apiClient.post("/attendance/checkin", {
      email,
      name,
      latitude,
      longitude,
      address,
    });
    return res;
  },
  checkOut: async ({ email, latitude, longitude, address }) => {
    const res = await apiClient.post("/attendance/checkout", {
      email,
      latitude,
      longitude,
      address,
    });
    return res;
  },
};

// Leave service
export const leaveService = {
  apply: async (payload) => apiClient.post("/leaves", payload),
  listMine: async (email) =>
    apiClient.get(`/leaves?email=${encodeURIComponent(email)}`),
  listAll: async () => apiClient.get("/leaves"),
  review: async (id, data) => apiClient.post(`/leaves/${id}/review`, data),
};
