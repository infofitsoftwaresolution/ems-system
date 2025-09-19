import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './SetupPassword.css';

const SetupPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) {
        navigate('/');
        return;
      }
      setEmail(storedUser.email);
      if (!storedUser.mustChangePassword) {
        navigate('/dashboard');
      }
    } catch (_) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await authService.updatePassword(email, password);
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...user, mustChangePassword: false }));
      
      // For new employees (non-admin), ensure KYC reminder will show
      if (user.role !== 'admin') {
        // Remove any existing KYC completion flag to trigger reminder
        localStorage.removeItem(`kyc_completed_${user.email}`);
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    }
  };

  const generateStrongPassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '!@#$%^&*()-_=+[]{};:,.<>/?';
    const all = upper + lower + nums + syms;
    const pick = (chars, n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    // Ensure at least one from each set, total length 12
    let pwd = pick(upper, 2) + pick(lower, 6) + pick(nums, 2) + pick(syms, 2);
    // Shuffle
    pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(pwd);
    setConfirmPassword(pwd);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="setup-password-container">
      <div className="setup-card">
        <h2>Set Your Password</h2>
        <p>For security, please create a new password before continuing.</p>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Password updated successfully!</div>}
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="password-row">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter new password"
              />
              <button type="button" className="btn-generate" onClick={generateStrongPassword}>
                Generate
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter new password"
            />
          </div>
          <div className="actions">
            <button type="button" className="btn-secondary" onClick={handleLogout}>Cancel</button>
            <button type="submit" className="btn-primary">Save Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupPassword;


