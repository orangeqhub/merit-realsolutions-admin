/**
 * Navigation utilities — path matching & active-branch resolution.
 */

export function isPathActive(pathname, path, end = false) {
  if (!path) return false;
  if (end) return pathname === path;
  if (pathname === path) return true;
  return pathname.startsWith(`${path}/`);
}

/** Collect every navigable path in the tree for best-match resolution. */
export function collectNavPaths(nodes, ancestors = []) {
  const results = [];
  for (const node of nodes) {
    const chain = [...ancestors, node.id];
    if (node.path) {
      results.push({ id: node.id, path: node.path, end: Boolean(node.end), chain });
    }
    if (node.children?.length) {
      results.push(...collectNavPaths(node.children, chain));
    }
  }
  return results;
}

/** Return ids of the best-matching branch for the current pathname. */
export function getActiveBranchIds(nodes, pathname) {
  const paths = collectNavPaths(nodes);
  const matches = paths
    .filter((entry) => isPathActive(pathname, entry.path, entry.end))
    .sort((a, b) => b.path.length - a.path.length);

  if (!matches.length) return [];
  return matches[0].chain;
}

/** Return true if node or any descendant matches the current route. */
export function isBranchActive(node, pathname) {
  if (node.path && isPathActive(pathname, node.path, node.end)) return true;
  return node.children?.some((child) => isBranchActive(child, pathname)) ?? false;
}

/**
 * Visual nav level for children of an accordion node.
 * Level 1 sections → level 2 modules; level 2 nested accordions → level 3 submenus.
 */
export function childNavLevel(parentLevel) {
  return parentLevel === 1 ? 2 : parentLevel + 1;
}

/** Walk tree and return all ancestor ids for a given node id. */
export function getAncestorIds(nodes, targetId, ancestors = []) {
  for (const node of nodes) {
    if (node.id === targetId) return ancestors;
    if (node.children?.length) {
      const found = getAncestorIds(node.children, targetId, [...ancestors, node.id]);
      if (found) return found;
    }
  }
  return null;
}
