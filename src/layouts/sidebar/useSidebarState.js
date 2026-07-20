import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getActiveBranchIds } from "./navUtils";

const EXPANDED_KEY = "mrs-sidebar-expanded";
const COLLAPSED_KEY = "mrs-sidebar-collapsed";

function readExpanded() {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function useSidebarState(navTree) {
  const { pathname } = useLocation();
  const [expandedIds, setExpandedIds] = useState(readExpanded);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeBranchIds = useMemo(
    () => getActiveBranchIds(navTree, pathname),
    [navTree, pathname]
  );

  const effectiveExpanded = useMemo(() => {
    const set = new Set([...expandedIds, ...activeBranchIds]);
    return set;
  }, [expandedIds, activeBranchIds]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expandedIds]));
  }, [expandedIds]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleExpanded = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return [...next];
    });
  }, []);

  const isExpanded = useCallback((id) => effectiveExpanded.has(id), [effectiveExpanded]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return {
    pathname,
    activeBranchIds,
    expandedIds: effectiveExpanded,
    isExpanded,
    toggleExpanded,
    collapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    closeMobile,
  };
}
