import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddCourse.css';

const AddCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    category: '',
    instructor: '',
    duration: '',
    maxStudents: '',
    startDate: '',
    endDate: '',
    schedule: {
      days: [],
      startTime: '',
      endTime: ''
    },
    prerequisites: '',
    objectives: '',
    materials: '',
    assessment: {
      assignments: 0,
      quizzes: 0,
      exams: 0,
      participation: 0
    },
    status: 'active'
  });

  const categories = [
    'Computer Science',
    'Business Administration',
    'Engineering',
    'Human Resources',
    'Marketing',
    'Finance',
    'Operations',
    'Sales',
    'Customer Service',
    'Leadership'
  ];

  const instructors = [
    { id: 1, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@company.com', department: 'Computer Science' },
    { id: 2, name: 'Prof. Michael Chen', email: 'michael.chen@company.com', department: 'Engineering' },
    { id: 3, name: 'Ms. Emily Davis', email: 'emily.davis@company.com', department: 'Business Administration' },
    { id: 4, name: 'Dr. Robert Wilson', email: 'robert.wilson@company.com', department: 'Human Resources' },
    { id: 5, name: 'Mr. David Brown', email: 'david.brown@company.com', department: 'Marketing' }
  ];

  const weekDays = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const handleInputChange = (e) => {
    const fieldName = e.target.name;
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleScheduleChange = (e) => {
    const fieldName = e.target.name;
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [fieldName]: value
      }
    }));
  };

  const handleDayToggle = (dayId) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: prev.schedule.days.includes(dayId)
          ? prev.schedule.days.filter(day => day !== dayId)
          : [...prev.schedule.days, dayId]
      }
    }));
  };

  const handleAssessmentChange = (e) => {
    const fieldName = e.target.name;
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        [fieldName]: parseInt(value) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage
      const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      const newCourse = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        enrolledStudents: 0
      };
      
      localStorage.setItem('courses', JSON.stringify([...existingCourses, newCourse]));

      alert(`Course "${formData.title}" created successfully!`);
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/courses');
    }
  };

  const totalAssessment = Object.values(formData.assessment).reduce((sum, value) => sum + value, 0);

  return (
    <div className="add-course-container">
      <div className="content-header">
        <h1>Create New Course</h1>
        <p>Add a new course to the system with comprehensive details and settings</p>
      </div>

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-sections">
          {/* Basic Information */}
          <div className="form-section">
            <h3>📋 Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Course Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter course title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="code">Course Code *</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CS101, BUS201"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Course Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Provide a detailed description of the course"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="instructor">Instructor *</label>
                <select
                  id="instructor"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.name}>
                      {instructor.name} - {instructor.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Course Schedule */}
          <div className="form-section">
            <h3>📅 Course Schedule</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (weeks)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="e.g., 12"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxStudents">Maximum Students</label>
                <input
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="e.g., 30"
                />
              </div>

              <div className="form-group full-width">
                <label>Class Days</label>
                <div className="days-selector">
                  {weekDays.map(day => (
                    <label key={day.id} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.schedule.days.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.schedule.startTime}
                  onChange={handleScheduleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.schedule.endTime}
                  onChange={handleScheduleChange}
                />
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="form-section">
            <h3>📚 Course Content</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="prerequisites">Prerequisites</label>
                <textarea
                  id="prerequisites"
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="List any prerequisites for this course"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="objectives">Learning Objectives</label>
                <textarea
                  id="objectives"
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="List the learning objectives for this course"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="materials">Required Materials</label>
                <textarea
                  id="materials"
                  name="materials"
                  value={formData.materials}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="List required textbooks, software, or other materials"
                />
              </div>
            </div>
          </div>

          {/* Assessment Structure */}
          <div className="form-section">
            <h3>📊 Assessment Structure</h3>
            <div className="assessment-grid">
              <div className="form-group">
                <label htmlFor="assignments">Assignments (%)</label>
                <input
                  type="number"
                  id="assignments"
                  name="assignments"
                  value={formData.assessment.assignments}
                  onChange={handleAssessmentChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quizzes">Quizzes (%)</label>
                <input
                  type="number"
                  id="quizzes"
                  name="quizzes"
                  value={formData.assessment.quizzes}
                  onChange={handleAssessmentChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="exams">Exams (%)</label>
                <input
                  type="number"
                  id="exams"
                  name="exams"
                  value={formData.assessment.exams}
                  onChange={handleAssessmentChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="participation">Participation (%)</label>
                <input
                  type="number"
                  id="participation"
                  name="participation"
                  value={formData.assessment.participation}
                  onChange={handleAssessmentChange}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="assessment-total">
              <span className="total-label">Total Assessment Weight:</span>
              <span className={`total-value ${totalAssessment !== 100 ? 'warning' : 'success'}`}>
                {totalAssessment}%
              </span>
              {totalAssessment !== 100 && (
                <span className="total-note">
                  {totalAssessment < 100 ? 'Assessment weights should total 100%' : 'Assessment weights exceed 100%'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            ❌ Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '💾 Creating Course...' : '💾 Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse; 