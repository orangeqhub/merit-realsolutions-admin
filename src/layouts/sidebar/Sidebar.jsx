import { NavLink } from "react-router-dom";
import { NAV_TREE } from "./navConfig";
import { NavIcons } from "./navIcons";
import SidebarAccordion from "./SidebarAccordion";
import "./sidebar.css";

export default function Sidebar({
  collapsed,
  toggleCollapsed,
  mobileOpen,
  closeMobile,
  pathname,
  activeBranchIds,
  isExpanded,
  toggleExpanded,
  onLogout,
}) {
  const handleNavigate = () => closeMobile?.();

  return (
    <aside
      className={[
        "dash-sidebar",
        "sidebar-nav",
        collapsed ? "dash-sidebar--collapsed sidebar-nav--collapsed" : "",
        mobileOpen ? "dash-sidebar--open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="dash-sidebar__brand">
        <span className="dash-sidebar__logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M16 4L28 16V26H4V16L16 4Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <rect x="13" y="18" width="6" height="8" fill="currentColor" />
          </svg>
        </span>
        {!collapsed && (
          <div className="dash-sidebar__brand-text">
            <p className="dash-sidebar__name">Merit Real Solutions</p>
            <p className="dash-sidebar__tagline">Admin Portal</p>
          </div>
        )}
      </div>

      <nav className="dash-sidebar__nav sidebar-nav__scroll" aria-label="Main navigation">
        {NAV_TREE.map((item) => {
          if (item.path && !item.children) {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "sidebar-nav__link",
                    "sidebar-nav__link--root",
                    isActive ? "sidebar-nav__link--active" : "",
                    item.placeholder ? "sidebar-nav__link--placeholder" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                title={collapsed ? item.label : undefined}
                onClick={handleNavigate}
              >
                {item.icon && <span className="sidebar-nav__icon">{item.icon}</span>}
                {!collapsed && <span className="sidebar-nav__label">{item.label}</span>}
                {collapsed && !item.icon && (
                  <span className="sidebar-nav__abbr">{item.label.charAt(0)}</span>
                )}
              </NavLink>
            );
          }

          return (
            <SidebarAccordion
              key={item.id}
              item={item}
              level={1}
              collapsed={collapsed}
              pathname={pathname}
              activeBranchIds={activeBranchIds}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              onNavigate={handleNavigate}
            />
          );
        })}
      </nav>

      <div className="sidebar-nav__footer">
        <button
          type="button"
          className="sidebar-nav__collapse-btn"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className={`sidebar-nav__collapse-icon ${collapsed ? "is-flipped" : ""}`}>
            {NavIcons.collapse}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>

        <button type="button" className="dash-sidebar__logout" onClick={onLogout}>
          <span className="sidebar-nav__icon">{NavIcons.logout}</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
