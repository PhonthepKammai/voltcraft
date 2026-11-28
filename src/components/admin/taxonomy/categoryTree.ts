import { Category } from '@/types/voltcraft';

export interface CategoryTreeNode {
  category: Category;
  depth: number;
  parentName?: string;
  childCount: number;
  pathLabel: string;
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const byId = new Map<string, Category>();
  const childrenMap = new Map<string, Category[]>();

  for (const cat of categories) {
    byId.set(cat._id, cat);
  }

  const roots: Category[] = [];
  for (const cat of categories) {
    const pid = cat.parentId ? String(cat.parentId) : '';
    if (pid && byId.has(pid) && pid !== cat._id) {
      const list = childrenMap.get(pid) ?? [];
      list.push(cat);
      childrenMap.set(pid, list);
    } else {
      roots.push(cat);
    }
  }

  const result: CategoryTreeNode[] = [];
  const visited = new Set<string>();

  const walk = (node: Category, depth: number, ancestors: string[]) => {
    if (visited.has(node._id)) return;
    visited.add(node._id);

    const children = childrenMap.get(node._id) ?? [];
    const pathNames = [...ancestors, node.name];

    result.push({
      category: node,
      depth,
      parentName: ancestors[ancestors.length - 1],
      childCount: children.length,
      pathLabel: pathNames.join(' › '),
    });

    for (const child of children) {
      walk(child, depth + 1, pathNames);
    }
  };

  for (const root of roots) {
    walk(root, 0, []);
  }

  return result;
}