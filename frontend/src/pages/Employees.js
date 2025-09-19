import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { employeeService } from "../services/api";
import "./Employees.css";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [updateError, setUpdateError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // Force refresh from server to get latest data
      const data = await employeeService.getEmployees();
      setEmployees(data);

      // Get user info for role-based features
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userInfo);
    } catch (err) {
      setError("Failed to load employees");
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [location.pathname]); // Refresh when navigating back to this page

  const formatSalary = (salary) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditMode(true);
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      role: employee.role || "",
      department: employee.department || "",
      salary: employee.salary || "",
      position: employee.position || "",
      phone: employee.phone || "",
      address: employee.address || "",
    });
    setUpdateSuccess("");
    setUpdateError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      await employeeService.updateEmployee(selectedEmployee.id, formData);
      setUpdateSuccess("Employee updated successfully!");

      // Update the selected employee data
      setSelectedEmployee((prev) => ({
        ...prev,
        ...formData,
      }));

      // Refresh the employee list
      await loadEmployees();

      // Hide the employee details after successful update
      setTimeout(() => {
        setSelectedEmployee(null);
        setEditMode(false);
        setFormData({});
        setUpdateSuccess("");
        setUpdateError("");
      }, 1500);
    } catch (err) {
      setUpdateError(err.message || "Failed to update employee");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({});
    setUpdateSuccess("");
    setUpdateError("");
  };

  const handleCloseDetails = () => {
    setSelectedEmployee(null);
    setEditMode(false);
    setFormData({});
    setUpdateSuccess("");
    setUpdateError("");
  };

  const handleDeleteEmployee = async (employee) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${employee.name?.toUpperCase()}? This action cannot be undone and will prevent them from logging in.`
      )
    ) {
      return;
    }

    setDeleteLoading(employee.id);
    try {
      await employeeService.deleteEmployee(employee.id);

      // Also delete the user account to prevent login
      try {
        const response = await fetch(`/api/users/${employee.email}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          console.warn("Employee deleted but user account deletion failed");
        }
      } catch (userError) {
        console.warn(
          "Employee deleted but user account deletion failed:",
          userError
        );
      }

      // Force refresh the employee list to get latest data
      await forceRefresh();
      alert(
        `${employee.name?.toUpperCase()} has been deleted successfully and can no longer login.`
      );
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEmployeeUpdated = () => {
    forceRefresh(); // Force refresh the employee list to get latest data
  };

  const forceRefresh = async () => {
    // Clear any cached data and force refresh from server
    localStorage.removeItem("employees");
    await loadEmployees();
  };

  if (loading) {
    return (
      <div className="employees-container">
        <div className="loading">Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employees-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="employees-container">
      <div className="content-header">
        <h1>Employee Directory</h1>
        <div className="content-actions">
          {user?.role === "admin" && (
            <button
              className="action-btn"
              onClick={() => (window.location.href = "/add-employee")}>
              ➕ Add Employee
            </button>
          )}
          <button className="action-btn" onClick={() => navigate("/settings")}>
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Employee Details View */}
      {selectedEmployee && (
        <div className="employee-details-container">
          <div className="employee-details-header">
            <h2>Employee Details</h2>
            <button className="close-details-btn" onClick={handleCloseDetails}>
              ✕
            </button>
          </div>

          {updateError && <div className="error-message">{updateError}</div>}
          {updateSuccess && (
            <div className="success-message">{updateSuccess}</div>
          )}

          {editMode ? (
            <form
              onSubmit={handleUpdateEmployee}
              className="employee-edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Name will be stored in UPPERCASE"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required>
                    <option value="">Select Role</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required>
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="salary">Salary *</label>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="1000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Job position/title"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full address"
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={updateLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateLoading}>
                  {updateLoading ? "Updating..." : "Update Employee"}
                </button>
              </div>
            </form>
          ) : (
            <div className="employee-info-grid">
              <div className="info-item">
                <strong>Name:</strong> {selectedEmployee.name}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {selectedEmployee.email}
              </div>
              <div className="info-item">
                <strong>Department:</strong> {selectedEmployee.department}
              </div>
              <div className="info-item">
                <strong>Role:</strong> {selectedEmployee.role}
              </div>
              <div className="info-item">
                <strong>Salary:</strong> ₹
                {selectedEmployee.salary?.toLocaleString("en-IN") || "0"}
              </div>
              <div className="info-item">
                <strong>Status:</strong> {selectedEmployee.status}
              </div>
              <div className="info-item">
                <strong>Hire Date:</strong>{" "}
                {formatDate(selectedEmployee.hireDate)}
              </div>
              <div className="info-item">
                <strong>Employee ID:</strong> {selectedEmployee.id}
              </div>
            </div>
          )}

          {!editMode && (
            <div className="employee-actions">
              <button
                className="btn-primary"
                onClick={() => handleEditEmployee(selectedEmployee)}>
                ✏️ Edit Employee
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDeleteEmployee(selectedEmployee)}
                disabled={deleteLoading === selectedEmployee.id}>
                {deleteLoading === selectedEmployee.id
                  ? "⏳ Deleting..."
                  : "🗑️ Delete Employee"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="employees-table-container">
        <div className="table-header">
          <h3>Employee List ({employees.length} employees)</h3>
          <div className="table-actions">
            <button
              className="table-btn refresh-btn"
              onClick={forceRefresh}
              title="Refresh employee list">
              🔄 Refresh
            </button>
            <button className="table-btn" disabled>
              📊 Export
            </button>
            <button className="table-btn" disabled>
              🔍 Filter
            </button>
          </div>
        </div>

        <table className="employees-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Hire Date</th>
              <th>Salary</th>
              {user?.role === "admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td className="employee-name">
                  {employee.name?.toUpperCase()}
                </td>
                <td>{employee.email}</td>
                <td>
                  <span className="role-badge">{employee.role}</span>
                </td>
                <td>{employee.department}</td>
                <td>{formatDate(employee.hireDate)}</td>
                <td className="salary">{formatSalary(employee.salary)}</td>
                {user?.role === "admin" && (
                  <td className="actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditEmployee(employee)}>
                      ✏️ Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteEmployee(employee)}
                      disabled={deleteLoading === employee.id}>
                      {deleteLoading === employee.id
                        ? "⏳ Deleting..."
                        : "🗑️ Delete"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="employees-summary">
        <div className="summary-card">
          <h3>Total Employees</h3>
          <p>{employees.length}</p>
        </div>
        <div className="summary-card">
          <h3>Average Salary</h3>
          <p>
            {formatSalary(
              employees.reduce((sum, emp) => sum + emp.salary, 0) /
                employees.length
            )}
          </p>
        </div>
        <div className="summary-card">
          <h3>Departments</h3>
          <p>{new Set(employees.map((emp) => emp.department)).size}</p>
        </div>
      </div>
    </div>
  );
};

export default Employees;
