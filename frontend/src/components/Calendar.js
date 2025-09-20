import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import "./Calendar.css";

// Enhanced sample events data with more Moodle-like features
const sampleEvents = [
  {
    id: 1,
    title: "Team Meeting",
    description: "Weekly team sync meeting",
    date: new Date(2025, 7, 5), // August 5, 2025
    time: "10:00",
    type: "meeting",
    course: "course1",
    location: "Conference Room A",
    attendees: ["John Doe", "Jane Smith", "Mike Johnson"],
    priority: "high",
    duration: 60,
    recurring: false,
    reminder: 15,
  },
  {
    id: 2,
    title: "Employee Review",
    description: "Annual performance review for John Doe",
    date: new Date(2025, 7, 8), // August 8, 2025
    time: "14:00",
    type: "review",
    course: "course2",
    location: "HR Office",
    attendees: ["John Doe", "HR Manager"],
    priority: "normal",
    duration: 90,
    recurring: false,
    reminder: 30,
  },
  {
    id: 3,
    title: "Training Session",
    description: "New software training for IT department",
    date: new Date(2025, 7, 12), // August 12, 2025
    time: "11:00",
    type: "training",
    course: "course3",
    location: "Training Room",
    attendees: ["IT Team"],
    priority: "normal",
    duration: 120,
    recurring: true,
    reminder: 60,
  },
  {
    id: 4,
    title: "Holiday",
    description: "Independence Day",
    date: new Date(2025, 7, 15), // August 15, 2025
    time: "00:00",
    type: "holiday",
    course: "",
    location: "",
    attendees: [],
    priority: "low",
    duration: 1440,
    recurring: true,
    reminder: 0,
  },
  {
    id: 5,
    title: "Project Deadline",
    description: "Q3 Project submission deadline",
    date: new Date(2025, 7, 20), // August 20, 2025
    time: "17:00",
    type: "deadline",
    course: "course1",
    location: "",
    attendees: ["Project Team"],
    priority: "high",
    duration: 0,
    recurring: false,
    reminder: 120,
  },
];

const CalendarComponent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [viewMode, setViewMode] = useState("month");
  const [analyticsView, setAnalyticsView] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickEvent, setQuickEvent] = useState({
    title: "",
    type: "meeting",
    date: new Date(),
  });
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: "09:00",
    type: "meeting",
    course: "",
    location: "",
    attendees: [],
    priority: "normal",
    duration: 60,
    recurring: false,
    reminder: 15,
  });

  const courses = [
    { id: "course1", name: "Employee Training", color: "#4CAF50" },
    { id: "course2", name: "Team Building", color: "#2196F3" },
    { id: "course3", name: "Leadership Development", color: "#FF9800" },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const getFilteredEvents = () => {
    if (selectedCourse === "all") {
      return events;
    }
    return events.filter((event) => event.course === selectedCourse);
  };

  const getEventsForDate = (date) => {
    const filteredEvents = getFilteredEvents();
    return filteredEvents.filter((event) =>
      isSameDay(new Date(event.date), date)
    );
  };

  // Enhanced tile content with priority indicators
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        const highPriorityEvents = dayEvents.filter(
          (event) => event.priority === "high"
        );
        const normalPriorityEvents = dayEvents.filter(
          (event) => event.priority === "normal"
        );
        const lowPriorityEvents = dayEvents.filter(
          (event) => event.priority === "low"
        );

        return (
          <div className="calendar-event-indicator">
            {highPriorityEvents.length > 0 && (
              <span className="event-dot high-priority"></span>
            )}
            {normalPriorityEvents.length > 0 && (
              <span className="event-dot normal-priority"></span>
            )}
            {lowPriorityEvents.length > 0 && (
              <span className="event-dot low-priority"></span>
            )}
            {dayEvents.length > 3 && (
              <span className="event-count">{dayEvents.length}</span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        const hasHighPriority = dayEvents.some(
          (event) => event.priority === "high"
        );
        return hasHighPriority ? "has-high-priority-events" : "has-events";
      }
    }
    return null;
  };

  // Analytics functions
  const getMonthlyStats = () => {
    const currentMonth = selectedDate;
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const monthEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    const stats = {
      totalEvents: monthEvents.length,
      meetings: monthEvents.filter((e) => e.type === "meeting").length,
      trainings: monthEvents.filter((e) => e.type === "training").length,
      reviews: monthEvents.filter((e) => e.type === "review").length,
      holidays: monthEvents.filter((e) => e.type === "holiday").length,
      deadlines: monthEvents.filter((e) => e.type === "deadline").length,
      highPriority: monthEvents.filter((e) => e.priority === "high").length,
      busyDays: monthDays.filter((day) => getEventsForDate(day).length > 0)
        .length,
      recurringEvents: monthEvents.filter((e) => e.recurring).length,
    };

    return stats;
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: selectedDate,
      time: "09:00",
      type: "meeting",
      course: "",
      location: "",
      attendees: [],
      priority: "normal",
      duration: 60,
      recurring: false,
      reminder: 15,
    });
    setShowEventModal(true);
  };

  const handleQuickAdd = () => {
    setShowQuickAdd(true);
  };

  const handleQuickAddSave = () => {
    if (quickEvent.title.trim()) {
      const newQuickEvent = {
        id: Date.now(),
        ...quickEvent,
        description: "",
        time: "09:00",
        course: "",
        location: "",
        attendees: [],
        priority: "normal",
        duration: 60,
        recurring: false,
        reminder: 15,
      };
      setEvents([...events, newQuickEvent]);
      setQuickEvent({ title: "", type: "meeting", date: new Date() });
      setShowQuickAdd(false);
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    const filteredEvents = getFilteredEvents();
    let exportData = "";

    if (exportFormat === "csv") {
      exportData = "Title,Date,Time,Type,Priority,Location\n";
      filteredEvents.forEach((event) => {
        exportData += `"${event.title}","${format(
          new Date(event.date),
          "yyyy-MM-dd"
        )}","${event.time}","${event.type}","${event.priority}","${
          event.location
        }"\n`;
      });
    } else if (exportFormat === "json") {
      exportData = JSON.stringify(filteredEvents, null, 2);
    }

    const blob = new Blob([exportData], {
      type: exportFormat === "csv" ? "text/csv" : "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar-events-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.${exportFormat}`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      type: event.type,
      course: event.course,
      location: event.location,
      attendees: event.attendees,
      priority: event.priority,
      duration: event.duration,
      recurring: event.recurring,
      reminder: event.reminder,
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((event) => event.id !== eventId));
    }
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      // Update existing event
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id
            ? { ...event, ...newEvent, id: event.id }
            : event
        )
      );
    } else {
      // Add new event
      const eventToAdd = {
        id: Date.now(),
        ...newEvent,
        date: newEvent.date,
      };
      setEvents([...events, eventToAdd]);
    }

    setShowEventModal(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      time: "09:00",
      type: "meeting",
      course: "",
      location: "",
      attendees: [],
      priority: "normal",
      duration: 60,
      recurring: false,
      reminder: 15,
    });
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case "meeting":
        return "📅";
      case "review":
        return "📋";
      case "training":
        return "🎓";
      case "holiday":
        return "🎉";
      case "deadline":
        return "⏰";
      default:
        return "📌";
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "meeting":
        return "#4CAF50";
      case "review":
        return "#2196F3";
      case "training":
        return "#FF9800";
      case "holiday":
        return "#F44336";
      case "deadline":
        return "#9C27B0";
      default:
        return "#9E9E9E";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#F44336";
      case "normal":
        return "#2196F3";
      case "low":
        return "#4CAF50";
      default:
        return "#9E9E9E";
    }
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const monthlyStats = getMonthlyStats();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>📅 Calendar & Events Analytics</h2>
        <div className="calendar-controls">
          <button
            className={`analytics-toggle ${analyticsView ? "active" : ""}`}
            onClick={() => setAnalyticsView(!analyticsView)}>
            {analyticsView ? "📊 Hide Analytics" : "📊 Show Analytics"}
          </button>
          <button className="export-btn" onClick={handleExport}>
            📤 Export
          </button>
          <button className="quick-add-btn" onClick={handleQuickAdd}>
            ⚡ Quick Add
          </button>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-filter">
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <button className="add-event-btn" onClick={handleAddEvent}>
            + Add Event
          </button>
        </div>
      </div>

      {analyticsView && (
        <div className="calendar-analytics">
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">📅</div>
              <div className="analytics-content">
                <h4>{monthlyStats.totalEvents}</h4>
                <p>Total Events</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">🔥</div>
              <div className="analytics-content">
                <h4>{monthlyStats.highPriority}</h4>
                <p>High Priority</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">📊</div>
              <div className="analytics-content">
                <h4>{monthlyStats.busyDays}</h4>
                <p>Busy Days</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">🎯</div>
              <div className="analytics-content">
                <h4>{monthlyStats.deadlines}</h4>
                <p>Deadlines</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">🔄</div>
              <div className="analytics-content">
                <h4>{monthlyStats.recurringEvents}</h4>
                <p>Recurring</p>
              </div>
            </div>
          </div>
          <div className="analytics-breakdown">
            <h4>Event Breakdown</h4>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span className="breakdown-label">Meetings:</span>
                <span className="breakdown-value">{monthlyStats.meetings}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Trainings:</span>
                <span className="breakdown-value">
                  {monthlyStats.trainings}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Reviews:</span>
                <span className="breakdown-value">{monthlyStats.reviews}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Holidays:</span>
                <span className="breakdown-value">{monthlyStats.holidays}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="calendar-content">
        <div className="calendar-main">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="react-calendar"
            view={viewMode}
            onViewChange={setViewMode}
          />
        </div>

        <div className="calendar-sidebar">
          <div className="selected-date-info">
            <h3>Events for {format(selectedDate, "MMMM d, yyyy")}</h3>
            {selectedDateEvents.length === 0 ? (
              <p className="no-events">No events scheduled for this date.</p>
            ) : (
              <div className="events-list">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="event-item"
                    style={{
                      borderLeftColor: getEventTypeColor(event.type),
                      borderLeftWidth:
                        event.priority === "high" ? "6px" : "4px",
                    }}>
                    <div className="event-header">
                      <span className="event-icon">
                        {getEventTypeIcon(event.type)}
                      </span>
                      <span className="event-title">{event.title}</span>
                      <span className="event-time">{event.time}</span>
                    </div>
                    <p className="event-description">{event.description}</p>
                    {event.location && (
                      <p className="event-location">📍 {event.location}</p>
                    )}
                    <div className="event-meta">
                      <span
                        className="priority-badge"
                        style={{
                          backgroundColor: getPriorityColor(event.priority),
                        }}>
                        {event.priority} priority
                      </span>
                      {event.duration > 0 && (
                        <span className="duration-badge">
                          {event.duration} min
                        </span>
                      )}
                      {event.recurring && (
                        <span className="recurring-badge">🔄 Recurring</span>
                      )}
                      {event.reminder > 0 && (
                        <span className="reminder-badge">
                          ⏰ {event.reminder}min
                        </span>
                      )}
                    </div>
                    <div className="event-actions">
                      <button
                        className="event-action-btn edit"
                        onClick={() => handleEditEvent(event)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="event-action-btn delete"
                        onClick={() => handleDeleteEvent(event.id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="upcoming-events">
            <h3>Upcoming Events</h3>
            <div className="upcoming-list">
              {getFilteredEvents()
                .filter((event) => new Date(event.date) > new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="upcoming-event">
                    <div className="upcoming-date">
                      {format(new Date(event.date), "MMM d")}
                    </div>
                    <div className="upcoming-details">
                      <div className="upcoming-title">{event.title}</div>
                      <div className="upcoming-time">{event.time}</div>
                      <div
                        className="upcoming-priority"
                        style={{
                          backgroundColor: getPriorityColor(event.priority),
                        }}>
                        {event.priority}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Event Modal */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEvent ? "Edit Event" : "Add New Event"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowEventModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Event Title:</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="Enter event title"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  placeholder="Enter event description"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={format(newEvent.date, "yyyy-MM-dd")}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        date: new Date(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Time:</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Type:</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value })
                    }>
                    <option value="meeting">Meeting</option>
                    <option value="review">Review</option>
                    <option value="training">Training</option>
                    <option value="holiday">Holiday</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority:</label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, priority: e.target.value })
                    }>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Course:</label>
                  <select
                    value={newEvent.course}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, course: e.target.value })
                    }>
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (minutes):</label>
                  <input
                    type="number"
                    value={newEvent.duration}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location:</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    placeholder="Enter location"
                  />
                </div>
                <div className="form-group">
                  <label>Reminder (minutes):</label>
                  <input
                    type="number"
                    value={newEvent.reminder}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        reminder: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newEvent.recurring}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, recurring: e.target.checked })
                    }
                  />
                  Recurring Event
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowEventModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEvent}
                disabled={!newEvent.title}>
                {editingEvent ? "Update Event" : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="modal-overlay">
          <div className="modal-content quick-add-modal">
            <div className="modal-header">
              <h3>Quick Add Event</h3>
              <button
                className="modal-close"
                onClick={() => setShowQuickAdd(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Event Title:</label>
                <input
                  type="text"
                  value={quickEvent.title}
                  onChange={(e) =>
                    setQuickEvent({ ...quickEvent, title: e.target.value })
                  }
                  placeholder="Enter event title"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={format(quickEvent.date, "yyyy-MM-dd")}
                    onChange={(e) =>
                      setQuickEvent({
                        ...quickEvent,
                        date: new Date(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={quickEvent.type}
                    onChange={(e) =>
                      setQuickEvent({ ...quickEvent, type: e.target.value })
                    }>
                    <option value="meeting">Meeting</option>
                    <option value="review">Review</option>
                    <option value="training">Training</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowQuickAdd(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleQuickAddSave}
                disabled={!quickEvent.title}>
                Quick Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content export-modal">
            <div className="modal-header">
              <h3>Export Events</h3>
              <button
                className="modal-close"
                onClick={() => setShowExportModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Export Format:</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <p className="export-info">
                Exporting {getFilteredEvents().length} events from the current
                view.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowExportModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleExportConfirm}>
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
