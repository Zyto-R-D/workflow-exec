export type Node = { id: string; type: string; input?: any; next?: string[] };
export type Graph = { nodes: Record<string, Node>; entry: string };
export async function run(graph: Graph) {
  // naive DFS executor (placeholder)
  const visited = new Set<string>();
  async function exec(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = graph.nodes[id];
    // TODO: resolve by node.type → action impl
    for (const n of node.next ?? []) await exec(n);
  }
  await exec(graph.entry);
}
