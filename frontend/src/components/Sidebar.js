import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { kycService } from '../services/api';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [kycStatus, setKycStatus] = useState('pending');

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Check KYC status for non-admin users
  useEffect(() => {
    const checkKycStatus = async () => {
      if (user?.email && user?.role !== 'admin') {
        try {
          const kycStatusData = await kycService.checkStatus(user.email);
          setKycStatus(kycStatusData.status);
        } catch (error) {
          console.error('Error checking KYC status in sidebar:', error);
          setKycStatus('pending');
        }
      } else {
        setKycStatus('approved'); // Admin users don't need KYC
      }
    };

    checkKycStatus();
  }, [user?.email, user?.role]);

  // Define all possible menu items
  const allMenuItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: '🏠',
      description: 'Main dashboard',
      roles: ['admin', 'manager', 'employee'],
      requiresKyc: false
    },
    {
      path: '/employees',
      label: 'Employees',
      icon: '👥',
      description: 'Manage employees',
      roles: ['admin', 'manager'],
      requiresKyc: false
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: '📄',
      description: 'View reports',
      roles: ['admin', 'manager', 'employee'],
      requiresKyc: false
    },
    {
      path: '/kyc-review',
      label: 'KYC Review',
      icon: '🪪',
      description: 'Review KYC submissions',
      roles: ['admin', 'manager'],
      requiresKyc: false
    },
    {
      path: '/attendance',
      label: 'Attendance',
      icon: '📍',
      description: 'Check in/out and view attendance',
      roles: ['employee'],
      requiresKyc: true
    },
    {
      path: '/attendance-management',
      label: 'Attendance Management',
      icon: '📍',
      description: 'Monitor attendance and locations',
      roles: ['admin', 'manager'],
      requiresKyc: false
    },
    {
      path: '/leave-apply',
      label: 'Leave Apply',
      icon: '📅',
      description: 'Apply for leave',
      roles: ['employee'],
      requiresKyc: true
    },
    {
      path: '/leave-review',
      label: 'Leave Approval',
      icon: '📅',
      description: 'Approve leave requests',
      roles: ['admin', 'manager'],
      requiresKyc: false
    },
    {
      path: '/payslips',
      label: 'Payslips',
      icon: '💰',
      description: 'View and download payslips',
      roles: ['employee'],
      requiresKyc: true
    },
    {
      path: '/salary-slips',
      label: 'Salary Slips',
      icon: '💰',
      description: 'Manage salary slips',
      roles: ['admin', 'manager'],
      requiresKyc: false
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'User settings',
      roles: ['admin', 'manager', 'employee'],
      requiresKyc: false
    },
    {
      path: '/admin',
      label: 'Site Administration',
      icon: '🔧',
      description: 'System administration',
      roles: ['admin'],
      requiresKyc: false
    }
  ];

  // Filter menu items based on user role and KYC status
  const getMenuItems = () => {
    return allMenuItems.filter(item => {
      // Check if user role is allowed
      const roleAllowed = item.roles.includes(user?.role);
      
      // Check KYC requirement
      const kycRequired = item.requiresKyc;
      const kycApproved = kycStatus === 'approved';
      
      // Show item if:
      // 1. Role is allowed AND
      // 2. Either KYC is not required OR KYC is approved
      return roleAllowed && (!kycRequired || kycApproved);
    });
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h3>Navigation</h3>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.disabled ? '#' : item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={item.disabled ? (e) => e.preventDefault() : undefined}
            >
              <div className="sidebar-item-icon">
                {item.icon}
              </div>
              <div className="sidebar-item-content">
                <span className="sidebar-item-label">{item.label}</span>
                <span className="sidebar-item-description">{item.description}</span>
              </div>
              {item.disabled && (
                <span className="coming-soon">Coming Soon</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name || 'User'}</span>
              <span className="user-role">{user.role || 'Employee'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 