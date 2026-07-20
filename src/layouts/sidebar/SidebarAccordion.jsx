import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NavIcons } from "./navIcons";
import { childNavLevel, isBranchActive } from "./navUtils";

const PANEL_VARIANTS = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

const PANEL_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] };

function Chevron({ open }) {
  return (
    <motion.span
      className="sidebar-nav__chevron"
      animate={{ rotate: open ? 90 : 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      aria-hidden="true"
    >
      {NavIcons.chevron}
    </motion.span>
  );
}

/** Map semantic nav level (0–3) to visual padding steps. */
function levelStyle(level) {
  return { "--sidebar-level": Math.max(0, level - 1) };
}

function SidebarLink({ item, level, collapsed, onNavigate, isActiveBranch }) {
  const linkClass = ({ isActive }) => {
    const classes = ["sidebar-nav__link", `sidebar-nav__link--level-${level}`];
    if (isActive) classes.push("sidebar-nav__link--active");
    if (isActiveBranch) classes.push("sidebar-nav__link--branch-active");
    if (item.placeholder) classes.push("sidebar-nav__link--placeholder");
    return classes.join(" ");
  };

  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={linkClass}
      style={levelStyle(level)}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
    >
      {item.icon && <span className="sidebar-nav__icon">{item.icon}</span>}
      {!collapsed && <span className="sidebar-nav__label">{item.label}</span>}
      {collapsed && !item.icon && (
        <span className="sidebar-nav__abbr">{item.label.charAt(0)}</span>
      )}
    </NavLink>
  );
}

function CollapsedFlyout({ item, open, onClose, anchorRef, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          className="sidebar-flyout"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.18 }}
        >
          <p className="sidebar-flyout__title">{item.label}</p>
          <div className="sidebar-flyout__body">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SidebarAccordion({
  item,
  level = 1,
  collapsed,
  pathname,
  activeBranchIds,
  isExpanded,
  toggleExpanded,
  onNavigate,
}) {
  const hasChildren = Boolean(item.children?.length);
  const branchActive = isBranchActive(item, pathname);
  const expanded = isExpanded(item.id);
  const anchorRef = useRef(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const isOnActiveBranch = activeBranchIds.includes(item.id);
  const isSection = level === 1;
  const isModuleAccordion = level === 2 && hasChildren;
  const nextLevel = childNavLevel(level);

  if (!hasChildren && item.path) {
    return (
      <SidebarLink
        item={item}
        level={level}
        collapsed={collapsed}
        onNavigate={onNavigate}
        isActiveBranch={isOnActiveBranch && !item.end}
      />
    );
  }

  if (!hasChildren) return null;

  const headerClass = [
    "sidebar-nav__header",
    `sidebar-nav__header--level-${level}`,
    isSection ? "sidebar-nav__header--section" : "",
    isModuleAccordion ? "sidebar-nav__header--module" : "",
    branchActive ? "sidebar-nav__header--branch-active" : "",
    expanded ? "sidebar-nav__header--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleHeaderClick = () => {
    if (collapsed) {
      setFlyoutOpen((o) => !o);
      return;
    }
    toggleExpanded(item.id);
  };

  const handleHeaderKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleHeaderClick();
    }
  };

  const childNodes = item.children.map((child) => (
    <SidebarAccordion
      key={child.id}
      item={child}
      level={nextLevel}
      collapsed={collapsed}
      pathname={pathname}
      activeBranchIds={activeBranchIds}
      isExpanded={isExpanded}
      toggleExpanded={toggleExpanded}
      onNavigate={onNavigate}
    />
  ));

  if (collapsed) {
    return (
      <div
        className="sidebar-nav__group sidebar-nav__group--collapsed"
        ref={anchorRef}
        onMouseEnter={() => setFlyoutOpen(true)}
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <button
          type="button"
          className={headerClass}
          style={levelStyle(level)}
          onClick={handleHeaderClick}
          aria-expanded={flyoutOpen}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon ? (
            <span className="sidebar-nav__icon">{item.icon}</span>
          ) : (
            <span className="sidebar-nav__abbr sidebar-nav__abbr--section">
              {item.label.charAt(0)}
            </span>
          )}
        </button>
        <CollapsedFlyout
          item={item}
          open={flyoutOpen}
          onClose={() => setFlyoutOpen(false)}
          anchorRef={anchorRef}
        >
          {item.children.map((child) => (
            <SidebarAccordion
              key={child.id}
              item={child}
              level={nextLevel}
              collapsed={false}
              pathname={pathname}
              activeBranchIds={activeBranchIds}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
              onNavigate={() => {
                setFlyoutOpen(false);
                onNavigate?.();
              }}
            />
          ))}
        </CollapsedFlyout>
      </div>
    );
  }

  return (
    <div className={`sidebar-nav__group ${isModuleAccordion ? "sidebar-nav__group--nested" : ""}`}>
      <button
        type="button"
        className={headerClass}
        style={levelStyle(level)}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
        aria-expanded={expanded}
      >
        {item.icon && <span className="sidebar-nav__icon">{item.icon}</span>}
        <span className="sidebar-nav__label">{item.label}</span>
        <Chevron open={expanded} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className={`sidebar-nav__panel ${nextLevel === 3 ? "sidebar-nav__panel--submenu" : ""}`}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={PANEL_VARIANTS}
            transition={PANEL_TRANSITION}
          >
            <motion.div
              className="sidebar-nav__panel-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {childNodes}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
