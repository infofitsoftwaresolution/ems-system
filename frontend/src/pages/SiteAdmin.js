import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SiteAdmin.css';

const SiteAdmin = () => {
  const [activeTab, setActiveTab] = useState('site-admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [blocksEditing, setBlocksEditing] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [comingSoon, setComingSoon] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { id: 'site-admin', label: 'Site administration', icon: '🔧' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'grades', label: 'Grades', icon: '📊' },
    { id: 'plugins', label: 'Plugins', icon: '🔌' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'server', label: 'Server', icon: '🖥️' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'development', label: 'Development', icon: '⚙️' }
  ];

  const adminSections = {
    'site-admin': [
      {
        title: 'Notifications',
        items: [
          { 
            label: 'Notifications', 
            icon: '🔔', 
            disabled: false,
            action: () => handleAdminAction('notifications', 'Configure system notifications and alerts')
          },
          { 
            label: 'Registration', 
            icon: '📝', 
            disabled: false,
            action: () => handleAdminAction('registration', 'Manage user registration settings and policies')
          },
          { 
            label: 'System services', 
            icon: '🔧', 
            disabled: false,
            action: () => handleAdminAction('system-services', 'Configure system services and integrations')
          },
          { 
            label: 'Feedback settings', 
            icon: '💬', 
            disabled: false,
            action: () => handleAdminAction('feedback', 'Manage feedback collection and display settings')
          },
          { 
            label: 'Advanced features', 
            icon: '⚡', 
            disabled: false,
            action: () => handleAdminAction('advanced-features', 'Enable or disable advanced system features')
          },
          { 
            label: 'Admin presets', 
            icon: '🎛️', 
            disabled: false,
            action: () => handleAdminAction('admin-presets', 'Manage administrator preset configurations')
          }
        ]
      },
      {
        title: 'Analytics',
        items: [
          { 
            label: 'Site information', 
            icon: 'ℹ️', 
            disabled: false,
            action: () => handleAdminAction('site-info', 'View detailed system information and statistics')
          },
          { 
            label: 'Analytics settings', 
            icon: '📊', 
            disabled: false,
            action: () => handleAdminAction('analytics-settings', 'Configure analytics and reporting settings')
          },
          { 
            label: 'Analytics models', 
            icon: '📈', 
            disabled: false,
            action: () => handleAdminAction('analytics-models', 'Manage predictive analytics models')
          }
        ]
      },
      {
        title: 'Access Control',
        items: [
          { 
            label: 'Site Admin Access', 
            icon: '🔐', 
            disabled: false,
            action: () => handleAdminAction('site-admin-access', 'Control who can access Site Administration panel')
          },
          { 
            label: 'Role Permissions', 
            icon: '👥', 
            disabled: false,
            action: () => handleAdminAction('role-permissions', 'Manage role-based access to Site Administration')
          },
          { 
            label: 'Access Logs', 
            icon: '📋', 
            disabled: false,
            action: () => handleAdminAction('access-logs', 'View logs of Site Administration access attempts')
          }
        ]
      }
    ],
    'users': [
      {
        title: 'User Management',
        items: [
          { 
            label: 'Add new user', 
            icon: '➕', 
            disabled: false,
            action: () => handleAdminAction('add-user', 'Create a new user account with specified permissions')
          },
          { 
            label: 'User accounts', 
            icon: '👤', 
            disabled: false,
            action: () => handleAdminAction('user-accounts', 'View and manage all user accounts')
          },
          { 
            label: 'User permissions', 
            icon: '🔐', 
            disabled: false,
            action: () => handleAdminAction('user-permissions', 'Configure user permissions and access levels')
          },
          { 
            label: 'User roles', 
            icon: '🎭', 
            disabled: false,
            action: () => handleAdminAction('user-roles', 'Manage user roles and role assignments')
          }
        ]
      }
    ],
    'courses': [
      {
        title: 'Course Management',
        items: [
          { 
            label: 'Add new course', 
            icon: '➕', 
            disabled: false,
            action: () => handleAdminAction('add-course', 'Create a new course with settings and structure')
          },
          { 
            label: 'Course categories', 
            icon: '📁', 
            disabled: false,
            action: () => handleAdminAction('course-categories', 'Organize courses into categories and subcategories')
          },
          { 
            label: 'Course settings', 
            icon: '⚙️', 
            disabled: false,
            action: () => handleAdminAction('course-settings', 'Configure global course settings and defaults')
          }
        ]
      }
    ],
    'grades': [
      {
        title: 'Grade Management',
        items: [
          { 
            label: 'Grade settings', 
            icon: '📊', 
            disabled: false,
            action: () => handleAdminAction('grade-settings', 'Configure grading scales and calculation methods')
          },
          { 
            label: 'Grade categories', 
            icon: '📁', 
            disabled: false,
            action: () => handleAdminAction('grade-categories', 'Manage grade categories and weightings')
          },
          { 
            label: 'Grade reports', 
            icon: '📈', 
            disabled: false,
            action: () => handleAdminAction('grade-reports', 'Generate and export grade reports')
          }
        ]
      }
    ],
    'plugins': [
      {
        title: 'Plugin Management',
        items: [
          { 
            label: 'Installed plugins', 
            icon: '🔌', 
            disabled: false,
            action: () => handleAdminAction('installed-plugins', 'View and manage installed plugins')
          },
          { 
            label: 'Plugin settings', 
            icon: '⚙️', 
            disabled: false,
            action: () => handleAdminAction('plugin-settings', 'Configure plugin-specific settings')
          },
          { 
            label: 'Plugin updates', 
            icon: '🔄', 
            disabled: false,
            action: () => handleAdminAction('plugin-updates', 'Check for and install plugin updates')
          }
        ]
      }
    ],
    'appearance': [
      {
        title: 'Appearance Settings',
        items: [
          { 
            label: 'Theme settings', 
            icon: '🎨', 
            disabled: false,
            action: () => handleAdminAction('theme-settings', 'Customize site theme and appearance')
          },
          { 
            label: 'Navigation', 
            icon: '🧭', 
            disabled: false,
            action: () => handleAdminAction('navigation', 'Configure site navigation and menus')
          },
          { 
            label: 'Logo settings', 
            icon: '🖼️', 
            disabled: false,
            action: () => handleAdminAction('logo-settings', 'Upload and configure site logo')
          }
        ]
      }
    ],
    'server': [
      {
        title: 'Server Management',
        items: [
          { 
            label: 'System paths', 
            icon: '🖥️', 
            disabled: false,
            action: () => handleAdminAction('system-paths', 'Configure system file paths and directories')
          },
          { 
            label: 'Performance', 
            icon: '⚡', 
            disabled: false,
            action: () => handleAdminAction('performance', 'Monitor and optimize system performance')
          },
          { 
            label: 'Security', 
            icon: '🔒', 
            disabled: false,
            action: () => handleAdminAction('security', 'Configure security settings and policies')
          }
        ]
      }
    ],
    'reports': [
      {
        title: 'Reports & Analytics',
        items: [
          { 
            label: 'System reports', 
            icon: '📊', 
            disabled: false,
            action: () => handleAdminAction('system-reports', 'Generate system-wide reports and analytics')
          },
          { 
            label: 'User reports', 
            icon: '👥', 
            disabled: false,
            action: () => handleAdminAction('user-reports', 'Generate user activity and performance reports')
          },
          { 
            label: 'Course reports', 
            icon: '📚', 
            disabled: false,
            action: () => handleAdminAction('course-reports', 'Generate course-specific reports and analytics')
          }
        ]
      }
    ],
    'development': [
      {
        title: 'Development Tools',
        items: [
          { 
            label: 'Debugging', 
            icon: '🐛', 
            disabled: false,
            action: () => handleAdminAction('debugging', 'Access debugging tools and error logs')
          },
          { 
            label: 'API settings', 
            icon: '🔗', 
            disabled: false,
            action: () => handleAdminAction('api-settings', 'Configure API endpoints and authentication')
          },
          { 
            label: 'Development mode', 
            icon: '⚙️', 
            disabled: false,
            action: () => handleAdminAction('dev-mode', 'Enable development mode and testing features')
          }
        ]
      }
    ]
  };

  const handleAdminAction = (action, description) => {
    setModalContent({
      title: action.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: description,
      action: action
    });
    setShowModal(true);
  };

  const handleBlocksEditing = () => {
    setBlocksEditing(!blocksEditing);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const allItems = [];
      Object.values(adminSections).forEach(sections => {
        sections.forEach(section => {
          section.items.forEach(item => {
            if (item.label.toLowerCase().includes(query.toLowerCase())) {
              allItems.push({ ...item, section: section.title });
            }
          });
        });
      });
      setFilteredItems(allItems);
    } else {
      setFilteredItems([]);
    }
  };

  const handleModalAction = () => {
    // Map actions to navigation or real features
    const navMap = {
      // User Management
      'add-user': '/add-employee',
      'user-accounts': '/employees',
      'user-permissions': '/user-permissions',
      'user-roles': '/user-roles',
      
      // Course Management
      'add-course': '/add-course',
      'course-categories': '/courses',
      'course-settings': '/courses',
      
      // Grade Management
      'grade-settings': 'coming-soon',
      'grade-categories': 'coming-soon',
      'grade-reports': '/reports',
      
      // Plugin Management
      'installed-plugins': 'coming-soon',
      'plugin-settings': 'coming-soon',
      'plugin-updates': 'coming-soon',
      
      // Appearance
      'theme-settings': 'coming-soon',
      'navigation': 'coming-soon',
      'logo-settings': 'coming-soon',
      
      // Server Management
      'system-paths': 'coming-soon',
      'performance': '/dashboard',
      'security': 'coming-soon',
      
      // Reports
      'system-reports': '/reports',
      'user-reports': '/reports',
      'course-reports': '/reports',
      
      // Development
      'debugging': 'coming-soon',
      'api-settings': 'coming-soon',
      'dev-mode': 'coming-soon',
      
      // Site Administration
      'notifications': '/notifications-settings',
      'registration': '/registration-settings',
      'system-services': '/system-services',
      'feedback': '/feedback-settings',
      'advanced-features': '/advanced-features',
      'admin-presets': '/admin-presets',
      'site-info': '/site-information',
      'analytics-settings': '/analytics-settings',
      'analytics-models': '/analytics-models',
      
      // Access Control
      'site-admin-access': '/site-admin-access',
      'role-permissions': '/role-permissions',
      'access-logs': '/access-logs'
    };
    
    if (modalContent && navMap[modalContent.action]) {
      if (navMap[modalContent.action] === 'coming-soon') {
        setShowModal(false);
        setComingSoon(true);
      } else {
        setShowModal(false);
        navigate(navMap[modalContent.action]);
      }
    } else {
      setShowModal(false);
      setComingSoon(true);
    }
  };

  const handleCloseComingSoon = () => {
    setComingSoon(false);
    setShowModal(false);
  };

  const currentSections = adminSections[activeTab] || [];

  return (
    <div className="site-admin-container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item" onClick={() => window.location.href = '/dashboard'}>🏠 Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item">Site administration</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">
          {searchQuery ? 'Search Results' : activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>

      {/* Header with action button */}
      <div className="admin-header">
        <h1>Site Administration</h1>
        <button 
          className={`blocks-editing-btn ${blocksEditing ? 'active' : ''}`}
          onClick={handleBlocksEditing}
        >
          Blocks editing {blocksEditing ? 'on' : 'off'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search in site administration..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="admin-content">
        {searchQuery && filteredItems.length > 0 ? (
          // Search Results
          <div className="search-results">
            <h3>Search Results for "{searchQuery}"</h3>
            <div className="section-items">
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className={`section-item ${item.disabled ? 'disabled' : ''}`}
                  onClick={item.disabled ? undefined : item.action}
                >
                  <span className="item-icon">{item.icon}</span>
                  <div className="item-details">
                    <span className="item-label">{item.label}</span>
                    <span className="item-section">{item.section}</span>
                  </div>
                  {item.disabled && (
                    <span className="coming-soon">Coming Soon</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery && filteredItems.length === 0 ? (
          // No Search Results
          <div className="no-results">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No Results Found</h3>
              <p>No administration items match your search query.</p>
            </div>
          </div>
        ) : (
          // Regular Content
          <>
        {currentSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="admin-section">
            <h3 className="section-title">{section.title}</h3>
            <div className="section-items">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`section-item ${item.disabled ? 'disabled' : ''}`}
                      onClick={item.disabled ? undefined : item.action}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-label">{item.label}</span>
                  {item.disabled && (
                    <span className="coming-soon">Coming Soon</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Default content for other tabs */}
        {!currentSections.length && (
          <div className="default-content">
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <h3>Administration Panel</h3>
              <p>Select a tab above to access different administration features.</p>
            </div>
          </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && modalContent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{modalContent.description}</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleModalAction}>
                  Execute Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Coming Soon Modal */}
      {comingSoon && (
        <div className="modal-overlay" onClick={handleCloseComingSoon}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Coming Soon</h3>
              <button className="modal-close" onClick={handleCloseComingSoon}>×</button>
            </div>
            <div className="modal-body">
              <p>This feature is not implemented yet. Please check back later!</p>
              <div className="modal-actions">
                <button className="btn-primary" onClick={handleCloseComingSoon}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteAdmin; 