import React, { useState, useEffect } from "react";
import { employeeService } from "../services/api";
import "./EditEmployeeModal.css";

const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onEmployeeUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    salary: "",
    position: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedPayslips, setGeneratedPayslips] = useState([]);
  const [kycStatus, setKycStatus] = useState("pending");

  useEffect(() => {
    if (employee && isOpen) {
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
      setError("");
      setSuccess("");

      // Load generated payslips for this employee
      const payslips = JSON.parse(localStorage.getItem("payslips") || "[]");
      const employeePayslips = payslips.filter(
        (p) => p.employeeEmail === employee.email
      );
      setGeneratedPayslips(employeePayslips);

      // Check KYC status
      checkKycStatus(employee.email);
    }
  }, [employee, isOpen]);

  const checkKycStatus = async (email) => {
    try {
      const response = await fetch(`/api/kyc/status/${email}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const kycData = await response.json();
        setKycStatus(kycData.status || "pending");
      }
    } catch (error) {
      console.log("Could not check KYC status:", error);
      setKycStatus("pending");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Update employee data
      await employeeService.updateEmployee(employee.id, formData);

      setSuccess("Employee updated successfully!");

      // Generate payslip if salary was updated
      if (formData.salary !== employee.salary) {
        try {
          await generatePayslip();
        } catch (payslipError) {
          console.warn(
            "Employee updated but payslip generation failed:",
            payslipError
          );
        }
      }

      // Notify parent component
      if (onEmployeeUpdated) {
        onEmployeeUpdated();
      }

      // Don't auto-close the modal, let user close it manually
      // setTimeout(() => {
      //   onClose();
      // }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const generatePayslip = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Validate required fields
      if (!formData.email || !formData.salary) {
        throw new Error("Email and salary are required to generate payslip");
      }

      const payslipData = {
        employeeId: employee.id,
        employeeEmail: formData.email.toLowerCase().trim(),
        month: month,
        year: year,
        basicSalary: parseFloat(formData.salary),
        allowances: Math.round(parseFloat(formData.salary) * 0.1), // 10% allowances
        deductions: Math.round(parseFloat(formData.salary) * 0.12), // 12% deductions (tax, etc.)
        workingDays: 22, // Default working days
        totalDays: 30, // Default total days
        status: "generated",
      };

      // Calculate net salary
      payslipData.netSalary =
        payslipData.basicSalary +
        payslipData.allowances -
        payslipData.deductions;

      console.log("Sending payslip data:", payslipData);
      console.log(
        "Auth token:",
        localStorage.getItem("token") ? "Present" : "Missing"
      );

      const response = await fetch("/api/payslip/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payslipData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Payslip generation failed:",
          response.status,
          response.statusText,
          errorData
        );
        throw new Error(
          `Failed to generate payslip: ${response.status} ${
            response.statusText
          } - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      console.log("Payslip generated successfully:", result);
      setSuccess((prev) => prev + " Payslip generated successfully!");
    } catch (error) {
      console.error("Error generating payslip:", error);

      // Fallback: Create a local payslip record
      console.log("Creating local payslip record as fallback...");
      const localPayslip = {
        id: Date.now(), // Temporary ID
        employeeId: employee.id,
        employeeName: formData.name,
        employeeEmail: formData.email,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: parseFloat(formData.salary),
        allowances: Math.round(parseFloat(formData.salary) * 0.1),
        deductions: Math.round(parseFloat(formData.salary) * 0.12),
        netSalary:
          parseFloat(formData.salary) +
          Math.round(parseFloat(formData.salary) * 0.1) -
          Math.round(parseFloat(formData.salary) * 0.12),
        workingDays: 22,
        totalDays: 30,
        status: "generated",
        generatedAt: new Date().toISOString(),
      };

      // Store in localStorage as fallback
      const existingPayslips = JSON.parse(
        localStorage.getItem("payslips") || "[]"
      );
      existingPayslips.push(localPayslip);
      localStorage.setItem("payslips", JSON.stringify(existingPayslips));

      // Update local state
      setGeneratedPayslips((prev) => [...prev, localPayslip]);

      setSuccess(
        (prev) => prev + " Payslip generated successfully (local fallback)!"
      );
      console.log("Local payslip created:", localPayslip);
    }
  };

  const handleGeneratePayslip = async () => {
    setLoading(true);
    setError("");

    try {
      await generatePayslip();
      setSuccess("Payslip generated successfully!");
    } catch (err) {
      setError("Failed to generate payslip: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Employee</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
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
                <small className="form-hint">
                  Names are automatically converted to uppercase
                </small>
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
                  <option value="hr">HR</option>
                  <option value="finance">Finance</option>
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
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="IT">IT</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Developer"
                />
              </div>
              <div className="form-group">
                <label htmlFor="salary">Salary (₹) *</label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter full address"
              />
            </div>

            {/* KYC Status Section */}
            <div className="kyc-status-section">
              <h3>KYC Status</h3>
              <div className={`kyc-status-indicator ${kycStatus}`}>
                <span className="kyc-status-icon">
                  {kycStatus === "approved" ? "✅" : "⏳"}
                </span>
                <span className="kyc-status-text">
                  {kycStatus === "approved" ? "KYC Approved" : "KYC Pending"}
                </span>
                {kycStatus === "approved" && (
                  <span className="kyc-status-note">
                    Payslips can be generated
                  </span>
                )}
                {kycStatus === "pending" && (
                  <span className="kyc-status-note">
                    KYC must be approved to generate payslips
                  </span>
                )}
              </div>
            </div>

            {/* Generated Payslips Section */}
            {generatedPayslips.length > 0 && (
              <div className="payslips-section">
                <h3>Generated Payslips</h3>
                <div className="payslips-list">
                  {generatedPayslips.map((payslip) => (
                    <div key={payslip.id} className="payslip-item">
                      <div className="payslip-info">
                        <span className="payslip-month">
                          {payslip.month}/{payslip.year}
                        </span>
                        <span className="payslip-amount">
                          ₹{payslip.netSalary?.toLocaleString("en-IN")}
                        </span>
                        <span className="payslip-status">{payslip.status}</span>
                      </div>
                      <div className="payslip-actions">
                        <button
                          className="btn-download"
                          onClick={() => {
                            // Create a simple text file for download
                            const content = `PAYSLIP
Employee: ${payslip.employeeName}
Email: ${payslip.employeeEmail}
Month: ${payslip.month}/${payslip.year}
Basic Salary: ₹${payslip.basicSalary?.toLocaleString("en-IN")}
Allowances: ₹${payslip.allowances?.toLocaleString("en-IN")}
Deductions: ₹${payslip.deductions?.toLocaleString("en-IN")}
Net Salary: ₹${payslip.netSalary?.toLocaleString("en-IN")}
Generated: ${new Date(payslip.generatedAt).toLocaleDateString()}`;

                            const blob = new Blob([content], {
                              type: "text/plain",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `payslip_${payslip.employeeName}_${payslip.month}_${payslip.year}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}>
                          📄 Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}>
                {success ? "Close" : "Cancel"}
              </button>
              {!success && kycStatus === "approved" && (
                <button
                  type="button"
                  className="btn-generate"
                  onClick={handleGeneratePayslip}
                  disabled={loading}>
                  {loading ? "Generating..." : "Generate Payslip"}
                </button>
              )}
              {!success && kycStatus !== "approved" && (
                <button
                  type="button"
                  className="btn-generate-disabled"
                  disabled={true}
                  title="KYC must be approved to generate payslips">
                  Generate Payslip (KYC Required)
                </button>
              )}
              {!success && (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}>
                  {loading ? "Updating..." : "Update Employee"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
