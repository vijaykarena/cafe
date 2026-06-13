# Graph Report - cafe  (2026-06-14)

## Corpus Check
- 91 files · ~40,526 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 422 nodes · 897 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56fc374b`
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 86 edges
2. `formatCurrency()` - 21 edges
3. `useAuth()` - 20 edges
4. `supabase` - 20 edges
5. `compilerOptions` - 16 edges
6. `requireManager()` - 15 edges
7. `supabaseAdmin` - 14 edges
8. `supabaseServer` - 13 edges
9. `Button()` - 12 edges
10. `formatDate()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `POSSystem()` --calls--> `cn()`  [EXTRACTED]
  demo.tsx → lib/utils.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogMedia()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AdminDashboardPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/admin/page.tsx → lib/utils.ts

## Communities (21 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (26): GET(), POST(), DELETE(), GET(), PUT(), POST(), DELETE(), GET() (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (38): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, @dnd-kit/core, lucide-react, next (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (55): getProductImageUrl(), cn(), CategoryFormData, CategoryModal(), CategoryModalProps, PRESET_COLORS, ProductFormData, ProductModal() (+47 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (21): AdminLayout(), AdminDashboardPage(), AdminManagersPage(), geistMono, geistSans, metadata, PosLayout(), createUserAction() (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (38): PosDashboardPage(), DraggableTicketCard(), KdsItem, KdsTicket, MOCK_TICKETS, Category, Coupon, Customer (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (9): CartItem, CATEGORIES, Category, NumpadMode, PAYMENT_METHODS, PaymentMethod, POSSystem(), Product (+1 more)

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

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (11): DeleteDialogProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (27): CategoriesPage(), UseDebouncer, KdsPage(), formatDateDDMMYYYY(), DeleteDialog(), AdminProductsPage(), AvailabilityFilter, ProductsPage() (+19 more)

## Knowledge Gaps
- **132 isolated node(s):** `Category`, `Product`, `CartItem`, `PaymentMethod`, `NumpadMode` (+127 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 2` to `Community 1`, `Community 5`, `Community 6`, `Community 20`, `Community 21`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `clsx` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `Category`, `Product`, `CartItem` to the rest of the system?**
  _132 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06758832565284179 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05745814307458143 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._