import React, { useState, useEffect, useRef } from 'react';
import './Email.css';

const Email = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState([
    {
      id: 1,
      from: 'hr@company.com',
      subject: 'Monthly Newsletter - August 2025',
      preview: 'This month\'s company newsletter includes updates on new policies, upcoming events, and employee spotlights...',
      time: '1 hour ago',
      unread: true,
      starred: false,
      attachments: 0
    },
    {
      id: 2,
      from: 'admin@company.com',
      subject: 'System Maintenance Notice',
      preview: 'Scheduled maintenance will occur on Saturday, August 10th from 2:00 AM to 6:00 AM...',
      time: '3 hours ago',
      unread: true,
      starred: true,
      attachments: 1
    },
    {
      id: 3,
      from: 'training@company.com',
      subject: 'New Training Modules Available',
      preview: 'We have added new training modules for cybersecurity and data privacy. Please complete these by the end of the month...',
      time: '1 day ago',
      unread: false,
      starred: false,
      attachments: 2
    },
    {
      id: 4,
      from: 'payroll@company.com',
      subject: 'Payroll Processing Complete',
      preview: 'Your salary for August has been processed and will be deposited to your account on August 15th...',
      time: '2 days ago',
      unread: false,
      starred: false,
      attachments: 0
    }
  ]);

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, starred
  const emailRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emailRef.current && !emailRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAsRead = (id) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === id 
          ? { ...email, unread: false }
          : email
      )
    );
  };

  const toggleStar = (id) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === id 
          ? { ...email, starred: !email.starred }
          : email
      )
    );
  };

  const deleteEmail = (id) => {
    setEmails(prev => prev.filter(email => email.id !== id));
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (filter === 'unread') return email.unread;
    if (filter === 'starred') return email.starred;
    return true;
  });

  const unreadCount = emails.filter(e => e.unread).length;

  if (!isOpen) return null;

  return (
    <div className="email-dropdown" ref={emailRef}>
      <div className="email-header">
        <h3>Email ({unreadCount})</h3>
        <div className="email-actions">
          <button className="compose-btn">✏️ Compose</button>
          <button className="refresh-btn">🔄</button>
        </div>
      </div>

      <div className="email-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <button 
          className={`filter-btn ${filter === 'starred' ? 'active' : ''}`}
          onClick={() => setFilter('starred')}
        >
          Starred
        </button>
      </div>
      
      <div className="email-content">
        <div className="email-list">
          {filteredEmails.length === 0 ? (
            <div className="no-emails">
              <p>No emails found</p>
            </div>
          ) : (
            filteredEmails.map(email => (
              <div 
                key={email.id} 
                className={`email-item ${!email.unread ? 'read' : 'unread'} ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedEmail(email);
                  markAsRead(email.id);
                }}
              >
                <div className="email-actions-mini">
                  <button 
                    className={`star-btn ${email.starred ? 'starred' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email.id);
                    }}
                  >
                    {email.starred ? '⭐' : '☆'}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEmail(email.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="email-content-mini">
                  <div className="email-header-mini">
                    <span className="email-from">{email.from}</span>
                    <span className="email-time">{email.time}</span>
                  </div>
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-preview">{email.preview}</div>
                  {email.attachments > 0 && (
                    <div className="email-attachments">
                      📎 {email.attachments} attachment{email.attachments > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {email.unread && <div className="unread-indicator"></div>}
              </div>
            ))
          )}
        </div>

        {selectedEmail && (
          <div className="email-detail">
            <div className="email-detail-header">
              <div className="email-detail-subject">{selectedEmail.subject}</div>
              <div className="email-detail-meta">
                <span className="email-detail-from">From: {selectedEmail.from}</span>
                <span className="email-detail-time">{selectedEmail.time}</span>
              </div>
            </div>
            
            <div className="email-detail-body">
              <p>{selectedEmail.preview}</p>
              <p>This is a detailed view of the email content. In a real application, this would show the full email body with proper formatting, images, and attachments.</p>
            </div>
            
            <div className="email-detail-actions">
              <button className="reply-btn">Reply</button>
              <button className="forward-btn">Forward</button>
              <button className="delete-detail-btn" onClick={() => deleteEmail(selectedEmail.id)}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="email-footer">
        <button className="view-all-btn">View All Emails</button>
      </div>
    </div>
  );
};

export default Email; 