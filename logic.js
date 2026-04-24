function isValidEdge(str) {
  const s = str.trim();
  if (!/^[A-Z]->[A-Z]$/.test(s)) return false;
  if (s[0] === s[3]) return false; 
  return true;
}
 
function processData(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const firstDuplicateSeen = new Set();
  const validEdges = [];
 
  for (const raw of data) {
    const trimmed = typeof raw === "string" ? raw.trim() : String(raw).trim();
 
    if (!isValidEdge(trimmed)) {
      invalidEntries.push(raw);
      continue;
    }
 
    if (seenEdges.has(trimmed)) {
     
      if (!firstDuplicateSeen.has(trimmed)) {
        duplicateEdges.push(trimmed);
        firstDuplicateSeen.add(trimmed);
      }
      continue;
    }
 
    seenEdges.add(trimmed);
    validEdges.push(trimmed);
  }
 

  const childToParent = {}; 
  const parentToChildren = {}; // parent -> [children]
  const allNodes = new Set();
 
  for (const edge of validEdges) {
    const [parent, child] = edge.split("->");
    allNodes.add(parent);
    allNodes.add(child);
 
    // Diamond: skip if child already has a parent
    if (childToParent[child] !== undefined) continue;
 
    childToParent[child] = parent;
    if (!parentToChildren[parent]) parentToChildren[parent] = [];
    parentToChildren[parent].push(child);
  }
 
  // Find roots: nodes that are never a child (after diamond resolution)
  // Group nodes into connected components first
  const visited = new Set();
  const hierarchies = [];
 
  // Get all true roots (never appear as child)
  const trueRoots = [];
  for (const node of allNodes) {
    if (childToParent[node] === undefined) {
      trueRoots.push(node);
    }
  }
 
  // Process each root's subtree
  for (const root of trueRoots.sort()) {
    const group = getSubtreeNodes(root, parentToChildren);
    group.forEach((n) => visited.add(n));
 
    const cycleDetected = hasCycle(root, parentToChildren);
 
    if (cycleDetected) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree = buildTree(root, parentToChildren);
      const depth = calcDepth(root, parentToChildren);
      hierarchies.push({ root, tree, depth });
    }
  }
 
  // Handle remaining nodes not yet visited (pure cycles — no external root)
  const remaining = [...allNodes].filter((n) => !visited.has(n));
  if (remaining.length > 0) {
    // Group them into connected components
    const components = groupComponents(remaining, parentToChildren, childToParent);
    for (const component of components) {
      component.sort();
      const root = component[0]; // lexicographically smallest
      component.forEach((n) => visited.add(n));
      hierarchies.push({ root, tree: {}, has_cycle: true });
    }
  }
 
  // Sort hierarchies: non-cyclic first by root, then cyclic
  hierarchies.sort((a, b) => {
    if (a.has_cycle && !b.has_cycle) return 1;
    if (!a.has_cycle && b.has_cycle) return -1;
    return a.root.localeCompare(b.root);
  });
 
  // Summary
  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  const totalTrees = nonCyclic.length;
  const totalCycles = hierarchies.filter((h) => h.has_cycle).length;
 
  let largestTreeRoot = "";
  let maxDepth = -1;
  for (const h of nonCyclic) {
    if (
      h.depth > maxDepth ||
      (h.depth === maxDepth && h.root < largestTreeRoot)
    ) {
      maxDepth = h.depth;
      largestTreeRoot = h.root;
    }
  }
 
  return {
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot,
    },
  };
}
 
function getSubtreeNodes(root, parentToChildren) {
  const nodes = new Set();
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (nodes.has(node)) continue;
    nodes.add(node);
    const children = parentToChildren[node] || [];
    queue.push(...children);
  }
  return nodes;
}
 
function hasCycle(root, parentToChildren) {
  const visited = new Set();
  const stack = new Set();
 
  function dfs(node) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const child of parentToChildren[node] || []) {
      if (dfs(child)) return true;
    }
    stack.delete(node);
    return false;
  }
 
  return dfs(root);
}
 
function buildTree(node, parentToChildren) {
  const children = parentToChildren[node] || [];
  const result = {};
  const sorted = [...children].sort();
  for (const child of sorted) {
    result[child] = buildTree(child, parentToChildren);
  }
  return { [node]: result };
}
 
function calcDepth(node, parentToChildren) {
  const children = parentToChildren[node] || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => calcDepth(c, parentToChildren)));
}
 
function groupComponents(nodes, parentToChildren, childToParent) {
  const visited = new Set();
  const components = [];
 
  for (const node of nodes) {
    if (visited.has(node)) continue;
    const component = [];
    const queue = [node];
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      component.push(cur);
      for (const child of parentToChildren[cur] || []) {
        if (!visited.has(child)) queue.push(child);
      }
      const parent = childToParent[cur];
      if (parent && !visited.has(parent)) queue.push(parent);
    }
    components.push(component);
  }
 
  return components;
}
 
module.exports = { processData };