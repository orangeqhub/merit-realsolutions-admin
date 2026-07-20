import { Outlet, Link } from 'react-router-dom';
import Sidebar from './sidebar/Sidebar';
import { useSidebarState } from './sidebar/useSidebarState';
import { NAV_TREE } from './sidebar/navConfig';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell';
import './DashboardLayout.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD';
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const {
    pathname,
    activeBranchIds,
    isExpanded,
    toggleExpanded,
    collapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    closeMobile,
  } = useSidebarState(NAV_TREE);

  const displayName = user?.name || 'Admin';
  const displayRole = user?.role?.replace(/_/g, ' ') || 'Administrator';
  const initials = getInitials(displayName);

  return (
    <div className={`dash-layout ${collapsed ? 'dash-layout--sidebar-collapsed' : ''}`}>
      {mobileOpen && (
        <button
          type="button"
          className="dash-layout__backdrop"
          onClick={closeMobile}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        toggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        closeMobile={closeMobile}
        pathname={pathname}
        activeBranchIds={activeBranchIds}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
        onLogout={logout}
      />

      <div className="dash-layout__main">
        <header className="dash-header">
          <button
            type="button"
            className="dash-header__menu-btn"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="dash-header__search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
            <input type="search" placeholder="Search ventures, customers..." />
          </div>

          <div className="dash-header__actions">
            <NotificationBell />

            <div className="dash-header__profile">
              <span className="dash-header__avatar">{initials}</span>
              <div className="dash-header__profile-info">
                <span className="dash-header__profile-name">{displayName}</span>
                <span className="dash-header__profile-role">{displayRole}</span>
                <Link to="/dashboard/security/change-password" className="dash-header__security-link">
                  Change Password
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="dash-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
