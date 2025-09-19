import React, { useEffect, useState } from 'react';
import { leaveService } from '../services/api';
import LeaveApprovalPopup from '../components/LeaveApprovalPopup';
import LeaveActionSuccessPopup from '../components/LeaveActionSuccessPopup';
import './LeaveReview.css';

const LeaveReview = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupData, setPopupData] = useState({
    isOpen: false,
    leaveData: null,
    action: null
  });
  const [successPopup, setSuccessPopup] = useState({
    isOpen: false,
    leaveData: null,
    action: null
  });

  const load = async () => {
    setLoading(true);
    const rows = await leaveService.listAll();
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showPopup = (leaveData, action) => {
    setPopupData({
      isOpen: true,
      leaveData,
      action
    });
  };

  const closePopup = () => {
    setPopupData({
      isOpen: false,
      leaveData: null,
      action: null
    });
  };

  const act = async (leaveData, status) => {
    try {
      await leaveService.review(leaveData.id, { 
        status, 
        reviewedBy: user.email || 'admin', 
        remarks: '' 
      });
      await load();
      
      // Show success popup
      setSuccessPopup({
        isOpen: true,
        leaveData,
        action: status
      });
    } catch (error) {
      console.error('Error processing leave:', error);
      alert('Error processing leave application. Please try again.');
    }
  };

  const closeSuccessPopup = () => {
    setSuccessPopup({
      isOpen: false,
      leaveData: null,
      action: null
    });
  };

  return (
    <div className="leave-review-container">
      <div className="leave-card">
        <h2>Leave Requests</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="leave-table">
            <thead>
              <tr>
                <th>ID</th><th>User</th><th>Type</th><th>Date Range</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name} ({r.email})</td>
                  <td>{r.type}</td>
                  <td>{r.startDate} → {r.endDate}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.status === 'pending' ? (
                      <>
                        <button 
                          className="btn-approve" 
                          onClick={() => showPopup(r, 'approve')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-reject" 
                          onClick={() => showPopup(r, 'reject')}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="action-status">
                        <span className={`status-badge status-${r.status}`}>
                          {r.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                        {r.reviewedBy && (
                          <div className="reviewed-by">
                            by {r.reviewedBy}
                          </div>
                        )}
                        {r.reviewedAt && (
                          <div className="reviewed-date">
                            {new Date(r.reviewedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Leave Approval Popup */}
      <LeaveApprovalPopup
        isOpen={popupData.isOpen}
        onClose={closePopup}
        onConfirm={() => act(popupData.leaveData, popupData.action === 'approve' ? 'approved' : 'rejected')}
        leaveData={popupData.leaveData}
        action={popupData.action}
      />

      {/* Leave Action Success Popup */}
      <LeaveActionSuccessPopup
        isOpen={successPopup.isOpen}
        onClose={closeSuccessPopup}
        leaveData={successPopup.leaveData}
        action={successPopup.action}
      />
    </div>
  );
};

export default LeaveReview;


