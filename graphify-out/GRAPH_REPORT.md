# Graph Report - cafe  (2026-06-13)

## Corpus Check
- 55 files · ~27,725 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 228 nodes · 354 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5840f4a3`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 20 edges
2. `supabase` - 19 edges
3. `compilerOptions` - 16 edges
4. `supabaseServer` - 13 edges
5. `formatDate()` - 10 edges
6. `Profile` - 10 edges
7. `Product` - 8 edges
8. `scripts` - 6 edges
9. `cn()` - 6 edges
10. `Category` - 6 edges

## Surprising Connections (you probably didn't know these)
- `POSSystem()` --calls--> `cn()`  [EXTRACTED]
  demo.tsx → lib/utils.ts
- `PosTerminalPage()` --calls--> `cn()`  [EXTRACTED]
  app/cashier/terminal/page.tsx → lib/utils.ts
- `DraggableTicketCard()` --calls--> `formatDate()`  [EXTRACTED]
  app/kds/page.tsx → lib/utils.ts
- `AdminDashboardPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/admin/page.tsx → lib/utils.ts
- `ManagerDashboardPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/manager/page.tsx → lib/utils.ts

## Communities (19 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (4): supabaseAdmin, supabaseServer, DELETE(), GET()

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (27): dependencies, @dnd-kit/core, lucide-react, next, react, react-dom, @supabase/supabase-js, devDependencies (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (14): AdminDashboardPage(), PosDashboardPage(), DraggableTicketCard(), KdsItem, KdsTicket, MOCK_TICKETS, Session, formatCurrency() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (4): createUserAction(), supabase, Profile, AdminStaffPage()

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (21): Category, Coupon, Customer, Floor, KDSTicket, KDSTicketStatus, Order, OrderItem (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (10): CartItem, CATEGORIES, Category, NumpadMode, PAYMENT_METHODS, PaymentMethod, POSSystem(), Product (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (4): name, organization_id, organization_slug, ref

## Knowledge Gaps
- **87 isolated node(s):** `Category`, `Product`, `CartItem`, `PaymentMethod`, `NumpadMode` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Community 4` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `Category`, `Product`, `CartItem` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07396870554765292 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._