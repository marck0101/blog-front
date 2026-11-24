// Layout de forças do Mapa de conteúdo (admin), no estilo do grafo do Obsidian:
// nós se repelem, ligações puxam como molas e uma gravidade leve segura tudo
// perto do centro. Feito à mão (sem d3) porque o blog tem centenas de nós, não
// milhares: a conta direta de todos contra todos cabe num quadro de animação.
// Funções puras, sem DOM: testadas em graphLayout.test.js.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export const LINK_TYPES = ["link", "related", "tag", "season"];

/**
 * O que o mapa mostra, conforme os filtros da tela.
 * show: { tags, seasons, related, drafts } (true = mostra)
 */
export function filterGraph({ nodes = [], links = [] }, show = {}) {
  // categories: só os posts destas categorias (lista vazia = todas)
  const { tags = true, seasons = true, related = true, drafts = true, categories = [] } = show;
  const keep = new Set(
    nodes
      .filter((n) => {
        if (n.type === "tag") return tags;
        if (n.type === "season") return seasons;
        if (categories.length && !categories.includes(n.category)) return false;
        return drafts || n.status === "published";
      })
      .map((n) => n.id)
  );
  const kept = links.filter((l) => {
    if (l.type === "related" && !related) return false;
    return keep.has(l.source) && keep.has(l.target);
  });
  // Tag/season sem post visível sobra solta: sai também
  const used = new Set(kept.flatMap((l) => [l.source, l.target]));
  return {
    nodes: nodes.filter((n) => keep.has(n.id) && (n.type === "post" || used.has(n.id))),
    links: kept,
  };
}

/** Ids ligados a `id` (nos dois sentidos) */
export function neighborsOf(id, links) {
  const out = new Set();
  for (const l of links) {
    if (l.source === id) out.add(l.target);
    else if (l.target === id) out.add(l.source);
  }
  return out;
}

/** Ligações de um post separadas por sentido e tipo, para o painel lateral */
export function connectionsOf(id, links) {
  const result = { linksOut: [], linksIn: [], relatedOut: [], relatedIn: [], tags: [], seasons: [] };
  for (const l of links) {
    if (l.type === "tag" && l.source === id) result.tags.push(l.target);
    else if (l.type === "season" && l.source === id) result.seasons.push(l.target);
    else if (l.type === "link") {
      if (l.source === id) result.linksOut.push(l.target);
      else if (l.target === id) result.linksIn.push(l.source);
    } else if (l.type === "related") {
      if (l.source === id) result.relatedOut.push(l.target);
      else if (l.target === id) result.relatedIn.push(l.source);
    }
  }
  return result;
}

// Mola de cada tipo: link do texto puxa mais forte e mais perto
const LINK_FORCE = {
  link: { distance: 70, strength: 0.7 },
  related: { distance: 80, strength: 0.4 },
  tag: { distance: 45, strength: 0.5 },
  season: { distance: 60, strength: 0.5 },
};

/**
 * Simulação. Os nós ganham x, y, vx, vy (e fx/fy quando fixados ao arrastar).
 * Posição inicial em espiral (sempre a mesma para os mesmos dados).
 */
export function createSimulation(inputNodes, inputLinks, options = {}) {
  const { charge = -160, gravity = 0.04, velocityDecay = 0.4, alphaMin = 0.005 } = options;
  const nodes = inputNodes.map((n, i) => {
    const radius = 12 * Math.sqrt(0.5 + i);
    const angle = i * GOLDEN_ANGLE;
    return { ...n, x: radius * Math.cos(angle), y: radius * Math.sin(angle), vx: 0, vy: 0 };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = inputLinks
    .map((l) => ({ ...l, s: byId.get(l.source), t: byId.get(l.target) }))
    .filter((l) => l.s && l.t);

  // Nó com muitas ligações cede menos (como no d3): hubs não são arrastados por folhas
  const degree = new Map();
  for (const l of links) {
    degree.set(l.s.id, (degree.get(l.s.id) || 0) + 1);
    degree.set(l.t.id, (degree.get(l.t.id) || 0) + 1);
  }

  let alpha = 1;
  let alphaTarget = 0;
  const alphaDecay = 1 - Math.pow(0.001, 1 / 300);

  function tick() {
    alpha += (alphaTarget - alpha) * alphaDecay;

    for (const l of links) {
      const { distance, strength } = LINK_FORCE[l.type] || LINK_FORCE.link;
      let dx = l.t.x + l.t.vx - l.s.x - l.s.vx || 1e-6;
      let dy = l.t.y + l.t.vy - l.s.y - l.s.vy || 1e-6;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const k = ((dist - distance) / dist) * alpha * strength;
      dx *= k;
      dy *= k;
      const ds = degree.get(l.s.id) || 1;
      const dt = degree.get(l.t.id) || 1;
      const bias = ds / (ds + dt);
      l.t.vx -= dx * bias;
      l.t.vy -= dy * bias;
      l.s.vx += dx * (1 - bias);
      l.s.vy += dy * (1 - bias);
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Mesmo lugar: empurra numa direção fixa por par (sem Math.random: reproduzível)
          dx = ((i % 7) - 3 || 1) * 0.5;
          dy = ((j % 5) - 2 || 1) * 0.5;
          d2 = dx * dx + dy * dy;
        }
        const w = (charge * alpha) / d2;
        a.vx += dx * w;
        a.vy += dy * w;
        b.vx -= dx * w;
        b.vy -= dy * w;
      }
    }

    for (const n of nodes) {
      n.vx -= n.x * gravity * alpha;
      n.vy -= n.y * gravity * alpha;
      if (n.fx != null) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx *= 1 - velocityDecay;
      n.vy *= 1 - velocityDecay;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return {
    nodes,
    links,
    tick,
    /** Roda n passos de uma vez (layout pronto antes de desenhar) */
    run(n) {
      for (let i = 0; i < n; i++) tick();
    },
    get alpha() {
      return alpha;
    },
    /** Esquentar de novo (ao arrastar): os vizinhos se reacomodam */
    reheat(value = 0.3) {
      alpha = Math.max(alpha, value);
    },
    setAlphaTarget(value) {
      alphaTarget = value;
    },
    isSettled() {
      return alpha < alphaMin && alphaTarget === 0;
    },
    node(id) {
      return byId.get(id);
    },
  };
}

/** Raio do nó: post cresce com as leituras (raiz, para o mais lido não engolir os outros) */
export function nodeRadius(node) {
  if (node.type === "tag") return 3 + Math.min(6, Math.sqrt(node.count || 1) * 1.5);
  if (node.type === "season") return 8;
  return 5 + Math.min(13, Math.sqrt(node.views || 0) / 2.5);
}

/** Caixa que contém todos os nós, para enquadrar a tela */
export function bounds(nodes, padding = 40) {
  if (nodes.length === 0) return { x: -100, y: -100, width: 200, height: 200 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  }
  return { x: minX - padding, y: minY - padding, width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 };
}
