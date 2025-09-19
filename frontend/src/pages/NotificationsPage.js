import React, { useEffect, useState } from 'react';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
      setItems(Array.isArray(stored) ? stored : []);
    } catch {
      setItems([]);
    }
  }, []);

  const markAllAsRead = () => {
    const next = items.map(n => ({ ...n, read: true }));
    setItems(next);
    localStorage.setItem('notifications', JSON.stringify(next));
  };

  return (
    <div className="notifications-page">
      <div className="np-header">
        <h1>Notifications</h1>
        <button className="np-btn" onClick={markAllAsRead}>Mark all as read</button>
      </div>
      {items.length === 0 ? (
        <div className="np-empty">No notifications</div>
      ) : (
        <ul className="np-list">
          {items.map(n => (
            <li key={n.id} className={`np-item ${n.read ? '' : 'unread'}`}>
              <div className="np-title">{n.title}</div>
              <div className="np-msg">{n.message}</div>
              <div className="np-meta">{n.time}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;


