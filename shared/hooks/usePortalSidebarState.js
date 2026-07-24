import { useCallback, useState } from 'react';

export function usePortalSidebarState() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => {
    setMobileOpen((open) => !open);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return {
    mobileOpen,
    toggleMobile,
    closeMobile,
  };
}
