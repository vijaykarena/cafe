# Graph Report - cafe  (2026-06-13)

## Corpus Check
- 41 files · ~16,383 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 161 nodes · 204 edges · 17 communities (9 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6b7ed0eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `supabaseServer` - 12 edges
3. `formatCurrency()` - 9 edges
4. `supabase` - 8 edges
5. `formatDate()` - 6 edges
6. `scripts` - 5 edges
7. `Profile` - 4 edges
8. `Product` - 4 edges
9. `PosDashboardPage()` - 3 edges
10. `PosTerminalPage()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AdminDashboardPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/admin/page.tsx → lib/utils.ts
- `PosDashboardPage()` --calls--> `formatDate()`  [EXTRACTED]
  app/pos/page.tsx → lib/utils.ts
- `PosDashboardPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/pos/page.tsx → lib/utils.ts
- `PosTerminalPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/pos/terminal/page.tsx → lib/utils.ts
- `PosTerminalPage()` --calls--> `formatDate()`  [EXTRACTED]
  app/pos/terminal/page.tsx → lib/utils.ts

## Communities (17 total, 8 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (24): dependencies, next, react, react-dom, @supabase/supabase-js, devDependencies, eslint, eslint-config-next (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (14): Category, Coupon, Floor, KDSTicket, KDSTicketStatus, Order, OrderItem, OrderStatus (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (4): KdsItem, KdsTicket, supabase, Profile

### Community 5 - "Community 5"
Cohesion: 0.26
Nodes (9): AdminDashboardPage(), Customer, Session, calculateTaxAmount(), formatCurrency(), formatDate(), PosDashboardPage(), CartItem (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **60 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabaseServer` connect `Community 0` to `Community 6`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08602150537634409 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._