import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/api';
import SuccessPopup from '../components/SuccessPopup';
import './AddEmployee.css';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [addedEmployeeName, setAddedEmployeeName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee', // Default role for new employees
    salary: '',
    hireDate: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    skills: '',
    education: '',
    experience: ''
  });

  const departments = [
    'IT',
    'HR',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Customer Support',
    'Research & Development'
  ];

  const positions = [
    'Software Engineer',
    'HR Manager',
    'Financial Analyst',
    'Marketing Specialist',
    'Sales Representative',
    'Operations Manager',
    'Customer Support Specialist',
    'Research Analyst',
    'Project Manager',
    'Team Lead',
    'Senior Developer',
    'Junior Developer',
    'Intern'
  ];

  const handleInputChange = (e) => {
    const fieldName = e.target.name;
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the employeeService to create the employee
      const newEmployee = await employeeService.createEmployee({
        name: formData.name,
        email: formData.email,
        role: formData.role, // Use separate role field
        position: formData.position, // Keep position separate
        department: formData.department,
        hireDate: formData.hireDate,
        salary: parseFloat(formData.salary),
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        skills: formData.skills,
        education: formData.education,
        experience: formData.experience
      });

      // Show success popup
      setAddedEmployeeName(formData.name);
      setSuccessMessage('Employee has been successfully added to the system!');
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    setSuccessMessage('');
    setAddedEmployeeName('');
    // Reset form data
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      role: 'employee', // Reset to default employee role
      salary: '',
      hireDate: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      skills: '',
      education: '',
      experience: ''
    });
    // Navigate to employees list after popup closes
    navigate('/employees');
  };

  return (
    <div className="add-employee-container">
      <div className="add-employee-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleCancel}>
            ← Back to Employees
          </button>
          <div className="header-text">
            <h1>Add New Employee</h1>
            <p>Fill in the details below to add a new employee to the system</p>
          </div>
        </div>
      </div>

      <div className="add-employee-content">
        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
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
                <small className="form-hint">Names are automatically converted to uppercase</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hireDate">Hire Date *</label>
                <input
                  type="date"
                  id="hireDate"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Job Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="position">Position *</label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="role">System Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <small className="form-hint">This determines what features the user can access</small>
              </div>

              <div className="form-group">
                <label htmlFor="salary">Annual Salary *</label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter annual salary in INR"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                rows="3"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Emergency contact name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyPhone">Emergency Phone</label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Background Information</h3>
            <div className="form-group">
              <label htmlFor="skills">Skills & Certifications</label>
              <textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="Enter skills, certifications, or specializations"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="education">Education</label>
              <textarea
                id="education"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="Enter educational background"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="experience">Work Experience</label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Enter relevant work experience"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding Employee...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessPopupClose}
        message={successMessage}
        employeeName={addedEmployeeName}
        autoClose={false}
      />
    </div>
  );
};

export default AddEmployee; 