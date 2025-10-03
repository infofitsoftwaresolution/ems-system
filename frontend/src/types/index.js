// Core entity types - converted from TypeScript to JavaScript
// Note: Type annotations removed, but JSDoc comments added for better IDE support

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {string} [avatar]
 * @property {string} [department]
 * @property {string} [position]
 * @property {string} dateJoined
 * @property {"active" | "inactive" | "onLeave"} status
 */

/**
 * @typedef {Object} Department
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} managerId
 * @property {number} employeeCount
 */

/**
 * @typedef {Object} Role
 * @property {string} id
 * @property {string} name
 * @property {string[]} permissions
 * @property {string} description
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {number} duration - in minutes
 * @property {string} instructor
 * @property {string[]} requiredFor
 * @property {number} completionRate
 * @property {"active" | "draft" | "archived"} status
 */

/**
 * @typedef {Object} PerformanceReview
 * @property {string} id
 * @property {string} employeeId
 * @property {string} reviewerId
 * @property {string} date
 * @property {Object[]} scores
 * @property {string} scores[].category
 * @property {number} scores[].score
 * @property {string} scores[].comment
 * @property {number} overallScore
 * @property {"draft" | "submitted" | "acknowledged"} status
 * @property {string} feedback
 * @property {string[]} goals
 */

/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} start
 * @property {string} end
 * @property {string} organizer
 * @property {string[]} attendees
 * @property {string} location
 * @property {"meeting" | "training" | "holiday" | "other"} type
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} message
 * @property {"info" | "warning" | "success" | "error"} type
 * @property {boolean} isRead
 * @property {string} date
 * @property {string} [link]
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalEmployees
 * @property {number} activeEmployees
 * @property {number} departmentsCount
 * @property {number} newHires
 * @property {number} upcomingReviews
 * @property {number} trainingCompletionRate
 * @property {number} employeeSatisfactionRate
 */

/**
 * @typedef {Object} TeamActivity
 * @property {string} date
 * @property {number} activeUsers
 * @property {number} completedTasks
 * @property {number} newDocuments
 */

/**
 * @typedef {"today" | "week" | "month" | "quarter" | "year"} TimeRange
 */

// Export types as constants for runtime use
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_LEAVE: "onLeave",
};

export const COURSE_STATUS = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
};

export const REVIEW_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  ACKNOWLEDGED: "acknowledged",
};

export const EVENT_TYPE = {
  MEETING: "meeting",
  TRAINING: "training",
  HOLIDAY: "holiday",
  OTHER: "other",
};

export const NOTIFICATION_TYPE = {
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  ERROR: "error",
};

export const TIME_RANGE = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
};
