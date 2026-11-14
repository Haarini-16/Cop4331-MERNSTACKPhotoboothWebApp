import React, { useEffect, useMemo, useState } from 'react';
import {
  getAllUsers,
  updateUserStatus,
  overridePassword,
} from '../api/adminApi.js';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [updatingUserId, setUpdatingUserId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const activeUsers = users.filter((user) => !user.disabled).length;
  const disabledUsers = users.filter((user) => user.disabled).length;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase();

      const matchesSearch = [
        user.username,
        user.email,
        user.firstName,
        user.lastName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchText));

      const matchesFilter =
        filter === 'All' ||
        (filter === 'Active' && !user.disabled) ||
        (filter === 'Disabled' && user.disabled);

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const handleStatusChange = async (user) => {
    const isActive = Boolean(user.disabled);

    const confirmed = window.confirm(
      `Are you sure you want to ${
        isActive ? 'enable' : 'disable'
      } ${user.username}'s account?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user._id);
      setError('');
      setMessage('');

      await updateUserStatus(user._id, isActive);

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item._id === user._id
            ? { ...item, disabled: !isActive }
            : item
        )
      );

      setMessage(
        `${user.username}'s account was ${
          isActive ? 'enabled' : 'disabled'
        } successfully.`
      );
    } catch (err) {
      setError(err.message || 'Unable to update account status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setError('');
    setMessage('');
  };

  const closePasswordModal = () => {
    setSelectedUser(null);
    setNewPassword('');
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    if (newPassword.length < 5) {
      setError('Password must contain at least 5 characters.');
      return;
    }

    try {
      setSavingPassword(true);
      setError('');

      await overridePassword(selectedUser._id, newPassword);

      setMessage(
        `Password updated successfully for ${selectedUser.username}.`
      );

      closePasswordModal();
    } catch (err) {
      setError(err.message || 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');

    window.location.href = '/login';
  };

  const formatDate = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-icon">P</div>
          <span>Photobooth</span>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <div className="sidebar-link active">
          <span>▦</span>
          Dashboard
        </div>

        <div className="sidebar-link">
          <span>♙</span>
          User Management
        </div>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="profile-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <small>Admin Account</small>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="breadcrumb">Workspace / Dashboard</div>
            <h1>Admin Dashboard</h1>
            <p>Manage your Photobooth platform and registered users.</p>
          </div>

          <button
            className="refresh-button"
            onClick={loadUsers}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon purple">♙</div>
            <div>
              <span>Total Users</span>
              <h2>{loading ? '—' : users.length}</h2>
              <small>Registered accounts</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <span>Active Users</span>
              <h2>{loading ? '—' : activeUsers}</h2>
              <small>Accounts with access</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">⊘</div>
            <div>
              <span>Disabled Users</span>
              <h2>{loading ? '—' : disabledUsers}</h2>
              <small>Accounts restricted</small>
            </div>
          </div>
        </section>

        {message && (
          <div className="admin-alert success-alert">
            <span>✓</span>
            {message}
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}

        {error && (
          <div className="admin-alert error-alert">
            <span>!</span>
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <section className="users-panel">
          <div className="panel-heading">
            <div>
              <h2>User Management</h2>
              <p>View and manage registered platform accounts.</p>
            </div>

            <span className="user-count">
              {filteredUsers.length} users
            </span>
          </div>

          <div className="users-toolbar">
            <div className="search-wrapper">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search username, email, or name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="status-filter"
            >
              <option value="All">All accounts</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>

          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>JOINED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="table-message">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-message">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {(user.firstName?.[0] ||
                              user.username?.[0] ||
                              'U').toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${
                                    user.lastName || ''
                                  }`.trim()
                                : user.username}
                            </strong>
                            <small>@{user.username}</small>
                          </div>
                        </div>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span
                          className={`role-badge ${
                            user.role === 'Admin' ? 'admin-role' : ''
                          }`}
                        >
                          {user.role || 'User'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            user.disabled ? 'disabled-status' : 'active-status'
                          }`}
                        >
                          <span className="status-dot"></span>
                          {user.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>

                      <td>{formatDate(user.createdAt)}</td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="password-action"
                            onClick={() => openPasswordModal(user)}
                          >
                            Password
                          </button>

                          <button
                            className={
                              user.disabled
                                ? 'enable-action'
                                : 'disable-action'
                            }
                            onClick={() => handleStatusChange(user)}
                            disabled={updatingUserId === user._id}
                          >
                            {updatingUserId === user._id
                              ? 'Saving...'
                              : user.disabled
                              ? 'Enable'
                              : 'Disable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="admin-footer">
          Photobooth Administration
          <span>Platform Management</span>
        </footer>
      </main>

      {selectedUser && (
        <div
          className="modal-overlay"
          onClick={closePasswordModal}
        >
          <div
            className="password-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closePasswordModal}
            >
              ×
            </button>

            <div className="modal-icon">♙</div>

            <h2>Reset User Password</h2>

            <p>
              Set a new password for{' '}
              <strong>@{selectedUser.username}</strong>.
            </p>

            <form onSubmit={handlePasswordReset}>
              <label htmlFor="newPassword">New Password</label>

              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                minLength={5}
                required
              />

              <small>Minimum 5 characters.</small>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closePasswordModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-password-button"
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
