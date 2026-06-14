# Graph Report - cafe  (2026-06-14)

## Corpus Check
- 91 files · ~46,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 438 nodes · 951 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21719053`
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 88 edges
2. `useAuth()` - 22 edges
3. `formatCurrency()` - 22 edges
4. `supabase` - 21 edges
5. `compilerOptions` - 16 edges
6. `requireManager()` - 15 edges
7. `supabaseAdmin` - 14 edges
8. `UseDebouncer` - 13 edges
9. `supabaseServer` - 13 edges
10. `formatDate()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `POSSystem()` --calls--> `cn()`  [EXTRACTED]
  demo.tsx → lib/utils.ts
- `KdsPage()` --calls--> `UseDebouncer`  [EXTRACTED]
  app/kds/page.tsx → hooks/debounce.ts
- `DropdownMenuLabel()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuSubTrigger()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts

## Communities (21 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (27): GET(), POST(), DELETE(), GET(), PUT(), POST(), DELETE(), GET() (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (38): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, @dnd-kit/core, lucide-react, next (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (58): cn(), CategoryFormData, CategoryModal(), CategoryModalProps, PRESET_COLORS, DeleteDialogProps, ProductFormData, ProductModal() (+50 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (27): AdminLayout(), ALLOWED_ROLES, AdminDashboardPage(), AdminManagersPage(), geistMono, geistSans, metadata, ALLOWED_ROLES (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (37): CartItem, NumpadMode, PaymentMethod, PosDashboardPage(), PosTerminalPage(), DraggableTicketCard(), KdsItem, KdsPage() (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (9): CartItem, CATEGORIES, Category, NumpadMode, PAYMENT_METHODS, PaymentMethod, POSSystem(), Product (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): categories, fs, products

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 9 - "Community 9"
Cohesion: 0.60
Nodes (3): config, proxy(), updateSession()

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (4): name, organization_id, organization_slug, ref

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (40): CategoriesPage(), UseDebouncer, getProductImageUrl(), formatDateDDMMYYYY(), DeleteDialog(), AdminProductsPage(), AvailabilityFilter, ProductsPage() (+32 more)

## Knowledge Gaps
- **143 isolated node(s):** `Category`, `Product`, `CartItem`, `PaymentMethod`, `NumpadMode` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 2` to `Community 1`, `Community 21`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.247) - this node is a cross-community bridge._
- **Why does `clsx` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `Category`, `Product`, `CartItem` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06746031746031746 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.058738738738738736 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._