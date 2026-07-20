import {
  rewriteActionUrlForPortal,
  isCrossPortalUrl,
  RECORD_UNAVAILABLE_MESSAGE,
} from './notificationPortal.js';

export { RECORD_UNAVAILABLE_MESSAGE };

export function resolveNotificationTarget(item) {
  return item?.actionUrl || null;
}

export async function handleNotificationClick({
  item,
  navigate,
  markReadFn,
  fetchNotificationFn,
  onUnreadCountChange,
  onItemsUpdate,
  onClose,
  onEntityLoadFailed,
}) {
  if (!item) return;

  let target = resolveNotificationTarget(item);
  let entityExists = true;

  if (fetchNotificationFn) {
    try {
      const detail = await fetchNotificationFn(item.id);
      target = detail?.actionUrl || target;
      entityExists = detail?.entityExists !== false;
    } catch {
      // Fall back to cached notification data.
    }
  }

  if (!target) {
    onEntityLoadFailed?.(RECORD_UNAVAILABLE_MESSAGE);
    return;
  }

  target = rewriteActionUrlForPortal(target);

  if (isCrossPortalUrl(target)) {
    onEntityLoadFailed?.('This notification belongs to a different portal.');
    return;
  }

  if (entityExists === false) {
    onEntityLoadFailed?.(RECORD_UNAVAILABLE_MESSAGE);
    return;
  }

  try {
    if (!item.isRead && markReadFn) {
      await markReadFn(item.id);
      onUnreadCountChange?.((count) => Math.max(0, count - 1));
      onItemsUpdate?.((prev) => prev.map((row) => (
        row.id === item.id ? { ...row, isRead: true } : row
      )));
    }
  } catch {
    // Mark-read failures should not block navigation.
  }

  onClose?.();
  navigate(target);
}
