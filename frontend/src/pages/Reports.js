import React, { useState, useEffect } from "react";
import { employeeService } from "../services/api";
import "./Reports.css";

const Reports = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState("overview");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "admin";

  console.log("Current user data:", currentUser);
  console.log("Is admin:", isAdmin);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        if (isAdmin) {
          // Admin can see all employees
          const data = await employeeService.getEmployees();
          setAllEmployees(data);
          setEmployees(data);
        } else {
          // Non-admin users only see their own data
          try {
            const userData = await employeeService.getEmployeeByEmail(
              currentUser.email
            );
            if (userData && userData.id) {
              setEmployees([userData]);
              console.log("User data found:", userData);
            } else {
              // If user data not found, create a placeholder with user info
              console.log(
                "User data not found, creating placeholder for:",
                currentUser.email
              );
              const placeholderData = {
                id: 0,
                name: currentUser.name || "Current User",
                email: currentUser.email,
                department: currentUser.department || "Not Assigned",
                salary: currentUser.salary || 0,
                role: currentUser.role || "Employee",
                status: "active",
              };
              setEmployees([placeholderData]);
              console.log("Created placeholder data:", placeholderData);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Create placeholder with user info
            const placeholderData = {
              id: 0,
              name: currentUser.name || "Current User",
              email: currentUser.email,
              department: currentUser.department || "Not Assigned",
              salary: currentUser.salary || 0,
              role: currentUser.role || "Employee",
              status: "active",
            };
            setEmployees([placeholderData]);
            console.log(
              "Created placeholder data after error:",
              placeholderData
            );
          }
        }
      } catch (error) {
        console.error("Error loading employees:", error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [
    isAdmin,
    currentUser.email,
    currentUser.department,
    currentUser.name,
    currentUser.role,
    currentUser.salary,
  ]);

  // Handle employee selection for admin
  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId);
    if (employeeId === "all") {
      setEmployees(allEmployees);
    } else {
      const selectedEmp = allEmployees.find(
        (emp) => emp.id === parseInt(employeeId)
      );
      setEmployees(selectedEmp ? [selectedEmp] : []);
    }
  };

  const generateReport = () => {
    // Simulate report generation
    alert("Generating report...");
  };

  const exportReport = () => {
    // Simulate report export
    alert("Exporting report...");
  };

  const getDepartmentStats = () => {
    const deptStats = {};
    employees.forEach((emp) => {
      deptStats[emp.department] = (deptStats[emp.department] || 0) + 1;
    });
    return deptStats;
  };

  const getSalaryStats = () => {
    if (!employees || employees.length === 0) {
      return { avgSalary: 0, maxSalary: 0, minSalary: 0 };
    }

    const salaries = employees
      .map((emp) => {
        // Ensure salary is a valid number
        const salary = parseFloat(emp.salary) || 0;
        return salary;
      })
      .filter((salary) => salary > 0); // Filter out invalid salaries

    if (salaries.length === 0) {
      return { avgSalary: 0, maxSalary: 0, minSalary: 0 };
    }

    const avgSalary =
      salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
    const maxSalary = Math.max(...salaries);
    const minSalary = Math.min(...salaries);

    console.log("Salary calculation:", {
      salaries,
      avgSalary,
      maxSalary,
      minSalary,
    });

    return { avgSalary, maxSalary, minSalary };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  const departmentStats = getDepartmentStats();
  const salaryStats = getSalaryStats();
  const currentEmployee = employees.length === 1 ? employees[0] : null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{isAdmin ? "Reports & Analytics" : "My Reports"}</h1>
        <p>
          {isAdmin
            ? selectedEmployee === "all"
              ? "Comprehensive employee analytics and insights"
              : currentEmployee
              ? `Reports for ${currentEmployee.name} (${currentEmployee.email})`
              : "Select an employee to view their reports"
            : "Your personal reports and analytics"}
        </p>

        {/* Employee selector for admin */}
        {isAdmin && (
          <div className="employee-selector">
            <label htmlFor="employee-select">Select Employee:</label>
            <select
              id="employee-select"
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="employee-select">
              <option value="all">📊 All Employees (Overview)</option>
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  👤 {emp.name} - {emp.department}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="dashboard-controls">
          <div className="report-filters">
            <select
              className="report-type-select"
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}>
              <option value="overview">Overview Report</option>
              {isAdmin && selectedEmployee === "all" && (
                <option value="department">Department Report</option>
              )}
              <option value="salary">Salary Report</option>
              <option value="performance">Performance Report</option>
              <option value="attendance">Attendance Report</option>
            </select>
            <div className="date-range">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                placeholder="End Date"
              />
            </div>
          </div>
          <div className="report-actions">
            <button className="generate-report-btn" onClick={generateReport}>
              📊 Generate Report
            </button>
            <button className="export-report-btn" onClick={exportReport}>
              📤 Export
            </button>
          </div>
        </div>
      </div>

      <div className="reports-content">
        {selectedReport === "overview" && (
          <div className="report-section">
            <h2>
              {isAdmin
                ? selectedEmployee === "all"
                  ? "Overview Report"
                  : `${currentEmployee?.name || "Employee"}'s Overview`
                : "My Overview"}
            </h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{employees.length}</h3>
                  <p>
                    {isAdmin
                      ? selectedEmployee === "all"
                        ? "Total Employees"
                        : "Employee Profile"
                      : "My Profile"}
                  </p>
                </div>
              </div>
              {isAdmin && selectedEmployee === "all" && (
                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>{Object.keys(departmentStats).length}</h3>
                    <p>Departments</p>
                  </div>
                </div>
              )}
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>₹{salaryStats.avgSalary.toLocaleString("en-IN")}</h3>
                  <p>
                    {isAdmin
                      ? selectedEmployee === "all"
                        ? "Average Salary"
                        : "Employee Salary"
                      : "My Salary"}
                  </p>
                </div>
              </div>
              {isAdmin && selectedEmployee === "all" && (
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>₹{salaryStats.maxSalary.toLocaleString("en-IN")}</h3>
                    <p>Highest Salary</p>
                  </div>
                </div>
              )}
            </div>

            {/* Employee details for individual employee view */}
            {isAdmin && selectedEmployee !== "all" && currentEmployee && (
              <div className="employee-details">
                <h3>Employee Details</h3>
                <div className="employee-info-grid">
                  <div className="info-item">
                    <strong>Name:</strong> {currentEmployee.name}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {currentEmployee.email}
                  </div>
                  <div className="info-item">
                    <strong>Department:</strong> {currentEmployee.department}
                  </div>
                  <div className="info-item">
                    <strong>Role:</strong> {currentEmployee.role}
                  </div>
                  <div className="info-item">
                    <strong>Salary:</strong> ₹
                    {currentEmployee.salary?.toLocaleString("en-IN") || "0"}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong> {currentEmployee.status}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedReport === "department" &&
          isAdmin &&
          selectedEmployee === "all" && (
            <div className="report-section">
              <h2>Department Report</h2>
              <div className="department-chart">
                {Object.entries(departmentStats).map(([dept, count]) => (
                  <div key={dept} className="department-bar">
                    <div className="department-info">
                      <span className="department-name">{dept}</span>
                      <span className="department-count">
                        {count} employees
                      </span>
                    </div>
                    <div className="department-progress">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${(count / employees.length) * 100}%`,
                        }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {selectedReport === "salary" && (
          <div className="report-section">
            <h2>
              {isAdmin
                ? selectedEmployee === "all"
                  ? "Salary Report"
                  : `${currentEmployee?.name || "Employee"}'s Salary Report`
                : "My Salary Report"}
            </h2>
            <div className="salary-stats">
              <div className="salary-card">
                <h3>
                  {isAdmin
                    ? selectedEmployee === "all"
                      ? "Average Salary"
                      : "Employee Salary"
                    : "My Salary"}
                </h3>
                <p className="salary-amount">
                  ₹{salaryStats.avgSalary.toLocaleString("en-IN")}
                </p>
              </div>
              {isAdmin && selectedEmployee === "all" && (
                <>
                  <div className="salary-card">
                    <h3>Highest Salary</h3>
                    <p className="salary-amount">
                      ₹{salaryStats.maxSalary.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="salary-card">
                    <h3>Lowest Salary</h3>
                    <p className="salary-amount">
                      ₹{salaryStats.minSalary.toLocaleString("en-IN")}
                    </p>
                  </div>
                </>
              )}
            </div>
            {isAdmin && selectedEmployee === "all" && (
              <div className="salary-distribution">
                <h3>Salary Distribution by Department</h3>
                <div className="salary-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Average Salary</th>
                        <th>Employee Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(departmentStats).map((dept) => {
                        const deptEmployees = employees.filter(
                          (emp) => emp.department === dept
                        );
                        const deptAvgSalary =
                          deptEmployees.reduce(
                            (sum, emp) => sum + (parseFloat(emp.salary) || 0),
                            0
                          ) / deptEmployees.length;
                        return (
                          <tr key={dept}>
                            <td>{dept}</td>
                            <td>₹{deptAvgSalary.toLocaleString("en-IN")}</td>
                            <td>{deptEmployees.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedReport === "performance" && (
          <div className="report-section">
            <h2>
              {isAdmin
                ? selectedEmployee === "all"
                  ? "Performance Report"
                  : `${
                      currentEmployee?.name || "Employee"
                    }'s Performance Report`
                : "My Performance Report"}
            </h2>
            <div className="performance-metrics">
              <div className="metric-card">
                <h3>Performance Overview</h3>
                <p>
                  {isAdmin
                    ? selectedEmployee === "all"
                      ? "Performance tracking and evaluation data will be displayed here."
                      : `${
                          currentEmployee?.name || "Employee"
                        }'s performance tracking and evaluation data will be displayed here.`
                    : "Your performance tracking and evaluation data will be displayed here."}
                </p>
                <div className="metric-placeholder">
                  <span>📊 Performance metrics coming soon...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === "attendance" && (
          <div className="report-section">
            <h2>
              {isAdmin
                ? selectedEmployee === "all"
                  ? "Attendance Report"
                  : `${currentEmployee?.name || "Employee"}'s Attendance Report`
                : "My Attendance Report"}
            </h2>
            <div className="attendance-metrics">
              <div className="metric-card">
                <h3>Attendance Overview</h3>
                <p>
                  {isAdmin
                    ? selectedEmployee === "all"
                      ? "Attendance tracking and reporting data will be displayed here."
                      : `${
                          currentEmployee?.name || "Employee"
                        }'s attendance tracking and reporting data will be displayed here.`
                    : "Your attendance tracking and reporting data will be displayed here."}
                </p>
                <div className="metric-placeholder">
                  <span>📅 Attendance data coming soon...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
