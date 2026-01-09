import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import './UserMenu.scss';

const getInitials = (nameOrEmail) => {
  if (!nameOrEmail) return 'U';
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length === 1 && nameOrEmail.includes('@')) {
    const [local] = nameOrEmail.split('@');
    return (local.slice(0, 2) || 'U').toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
};

export default function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim().length > 0) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [user]);

  const email = user?.email || '';
  const initials = useMemo(() => getInitials(user?.name || user?.email || 'User'), [user]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const handleToggle = () => setOpen((prev) => !prev);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed', err);
      showError('Logout failed. Please try again.');
    }
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
        ref={buttonRef}
      >
        <div className="user-menu__avatar" aria-hidden="true">{initials}</div>
        <div className="user-menu__info">
          <span className="user-menu__name">{displayName}</span>
          <span className="user-menu__email">{email}</span>
        </div>
        <span className="user-menu__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="user-menu__dropdown" role="menu">
          <button
            type="button"
            className="user-menu__item"
            role="menuitem"
            onClick={() => handleNavigate('/profile')}
          >
            Profile
          </button>
          <button
            type="button"
            className="user-menu__item"
            role="menuitem"
            onClick={() => handleNavigate('/settings')}
          >
            Settings
          </button>
          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            role="menuitem"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
