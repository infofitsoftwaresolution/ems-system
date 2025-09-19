import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const location = useLocation();

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

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const storedCourses = localStorage.getItem('courses');
      const data = storedCourses ? JSON.parse(storedCourses) : [];
      setCourses(data);

      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userInfo);
    } catch (err) {
      setError('Failed to load courses');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [location.pathname]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#28a745', label: 'Active' },
      inactive: { color: '#6c757d', label: 'Inactive' },
      completed: { color: '#17a2b8', label: 'Completed' },
      upcoming: { color: '#ffc107', label: 'Upcoming' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const getEnrollmentStatus = (enrolled, maxStudents) => {
    if (!maxStudents) return 'No limit';
    const percentage = Math.round((enrolled / maxStudents) * 100);
    return `${enrolled}/${maxStudents} (${percentage}%)`;
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || course.category === categoryFilter;
    const matchesStatus = !statusFilter || course.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const updatedCourses = courses.filter(course => course.id !== courseId);
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        setCourses(updatedCourses);
        alert('Course deleted successfully!');
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course. Please try again.');
      }
    }
  };

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      const updatedCourses = courses.map(course => 
        course.id === courseId ? { ...course, status: newStatus } : course
      );
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      setCourses(updatedCourses);
      alert('Course status updated successfully!');
    } catch (error) {
      console.error('Error updating course status:', error);
      alert('Error updating course status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="courses-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Courses</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadCourses}>🔄 Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="content-header">
        <h1>Course Management</h1>
        <p>View and manage all courses in the system</p>
      </div>

      <div className="courses-content">
        <div className="courses-header">
          <div className="header-info">
            <h2>Course Directory</h2>
            <span className="course-count">{filteredCourses.length} of {courses.length} courses</span>
          </div>
          <div className="header-actions">
            {user?.role === 'admin' && (
              <button
                className="btn-primary"
                onClick={() => window.location.href = '/add-course'}
              >
                ➕ Add Course
              </button>
            )}
            <button className="btn-secondary" disabled>📊 Export</button>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-filter">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search courses by title, code, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <button 
              className="btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
            >
              🗑️ Clear Filters
            </button>
          </div>
        </div>

        <div className="courses-table-container">
          {filteredCourses.length > 0 ? (
            <div className="courses-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Category</th>
                    <th>Schedule</th>
                    <th>Enrollment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(course => (
                    <tr key={course.id}>
                      <td className="course-info">
                        <div className="course-title">{course.title}</div>
                        <div className="course-code">{course.code}</div>
                        <div className="course-dates">
                          {formatDate(course.startDate)} - {formatDate(course.endDate)}
                        </div>
                      </td>
                      <td>
                        <div className="instructor-info">
                          <div className="instructor-name">{course.instructor}</div>
                          <div className="instructor-dept">{course.category}</div>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">{course.category}</span>
                      </td>
                      <td>
                        <div className="schedule-info">
                          <div className="schedule-days">
                            {course.schedule?.days?.length > 0 
                              ? course.schedule.days.map(day => day.charAt(0).toUpperCase()).join(', ')
                              : 'TBD'
                            }
                          </div>
                          {course.schedule?.startTime && course.schedule?.endTime && (
                            <div className="schedule-time">
                              {course.schedule.startTime} - {course.schedule.endTime}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="enrollment-info">
                          <div className="enrollment-count">
                            {getEnrollmentStatus(course.enrolledStudents || 0, course.maxStudents)}
                          </div>
                          {course.maxStudents && (
                            <div className="enrollment-bar">
                              <div 
                                className="enrollment-fill"
                                style={{ 
                                  width: `${Math.min((course.enrolledStudents || 0) / course.maxStudents * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(course.status)}
                      </td>
                      <td>
                        <div className="course-actions">
                          <button 
                            className="btn-icon"
                            title="View Details"
                            onClick={() => alert(`View details for ${course.title}`)}
                          >
                            👁️
                          </button>
                          {user?.role === 'admin' && (
                            <>
                              <button 
                                className="btn-icon"
                                title="Edit Course"
                                onClick={() => alert(`Edit ${course.title}`)}
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-icon"
                                title="Delete Course"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No Courses Found</h3>
              <p>
                {searchQuery || categoryFilter || statusFilter 
                  ? 'No courses match your current filters. Try adjusting your search criteria.'
                  : 'No courses have been created yet. Create your first course to get started!'
                }
              </p>
              {user?.role === 'admin' && !searchQuery && !categoryFilter && !statusFilter && (
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = '/add-course'}
                >
                  ➕ Create First Course
                </button>
              )}
            </div>
          )}
        </div>

        <div className="courses-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Courses:</span>
              <span className="stat-value">{courses.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Courses:</span>
              <span className="stat-value">
                {courses.filter(c => c.status === 'active').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Enrollments:</span>
              <span className="stat-value">
                {courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Categories:</span>
              <span className="stat-value">
                {new Set(courses.map(c => c.category)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses; 