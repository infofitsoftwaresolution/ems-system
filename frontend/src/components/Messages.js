import React, { useState, useEffect, useRef } from 'react';
import './Messages.css';

const Messages = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'John Doe',
      avatar: 'JD',
      lastMessage: 'Can you review the quarterly report?',
      time: '2 min ago',
      unread: true,
      online: true
    },
    {
      id: 2,
      sender: 'Jane Smith',
      avatar: 'JS',
      lastMessage: 'Meeting scheduled for tomorrow at 10 AM',
      time: '1 hour ago',
      unread: true,
      online: false
    },
    {
      id: 3,
      sender: 'Mike Johnson',
      avatar: 'MJ',
      lastMessage: 'Thanks for the update!',
      time: '3 hours ago',
      unread: false,
      online: true
    },
    {
      id: 4,
      sender: 'Sarah Wilson',
      avatar: 'SW',
      lastMessage: 'Please check the new employee onboarding process',
      time: '1 day ago',
      unread: false,
      online: false
    }
  ]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messageRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageRef.current && !messageRef.current.contains(event.target)) {
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
    setMessages(prev => 
      prev.map(message => 
        message.id === id 
          ? { ...message, unread: false }
          : message
      )
    );
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedMessage) {
      // In a real app, this would send the message to the backend
      setNewMessage('');
      // Update the last message for the selected conversation
      setMessages(prev => 
        prev.map(message => 
          message.id === selectedMessage.id 
            ? { ...message, lastMessage: newMessage, time: 'Just now' }
            : message
        )
      );
    }
  };

  const unreadCount = messages.filter(m => m.unread).length;

  if (!isOpen) return null;

  return (
    <div className="messages-dropdown" ref={messageRef}>
      <div className="messages-header">
        <h3>Messages ({unreadCount})</h3>
        <button className="new-message-btn">+ New</button>
      </div>
      
      <div className="messages-content">
        <div className="conversations-list">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`conversation-item ${!message.unread ? 'read' : 'unread'} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedMessage(message);
                markAsRead(message.id);
              }}
            >
              <div className="conversation-avatar">
                <span className="avatar-text">{message.avatar}</span>
                {message.online && <div className="online-indicator"></div>}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <span className="sender-name">{message.sender}</span>
                  <span className="message-time">{message.time}</span>
                </div>
                <div className="last-message">{message.lastMessage}</div>
              </div>
              {message.unread && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>

        {selectedMessage && (
          <div className="message-detail">
            <div className="message-detail-header">
              <div className="selected-avatar">
                <span>{selectedMessage.avatar}</span>
                {selectedMessage.online && <div className="online-indicator"></div>}
              </div>
              <div className="selected-info">
                <span className="selected-name">{selectedMessage.sender}</span>
                <span className="selected-status">
                  {selectedMessage.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="message-input-area">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button onClick={sendMessage} disabled={!newMessage.trim()}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="messages-footer">
        <button className="view-all-btn">View All Messages</button>
      </div>
    </div>
  );
};

export default Messages; 