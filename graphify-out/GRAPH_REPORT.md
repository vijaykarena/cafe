# Graph Report - cafe  (2026-06-13)

## Corpus Check
- 89 files · ~39,652 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 408 nodes · 826 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79ecc2f4`
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 86 edges
2. `formatCurrency()` - 20 edges
3. `supabase` - 19 edges
4. `compilerOptions` - 16 edges
5. `requireManager()` - 15 edges
6. `supabaseServer` - 13 edges
7. `Button()` - 12 edges
8. `formatDate()` - 12 edges
9. `supabaseAdmin` - 10 edges
10. `Profile` - 10 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `POSSystem()` --calls--> `cn()`  [EXTRACTED]
  demo.tsx → lib/utils.ts
- `DraggableTicketCard()` --calls--> `formatDate()`  [EXTRACTED]
  app/kds/page.tsx → lib/utils.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogMedia()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts

## Communities (22 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (23): GET(), POST(), DELETE(), GET(), PUT(), POST(), getAuthUser(), getManagerId() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (37): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, @dnd-kit/core, lucide-react, next (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (48): cn(), CategoryFormData, CategoryModal(), CategoryModalProps, PRESET_COLORS, ProductFormData, ProductModal(), ProductModalProps (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (8): createUserAction(), DraggableTicketCard(), KdsItem, KdsTicket, MOCK_TICKETS, supabase, Profile, Toaster()

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (34): AdminDashboardPage(), PosDashboardPage(), Category, Coupon, Customer, Floor, KDSTicket, KDSTicketStatus (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (9): CartItem, CATEGORIES, Category, NumpadMode, PAYMENT_METHODS, PaymentMethod, POSSystem(), Product (+1 more)

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

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (11): DeleteDialogProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (32): CategoriesPage(), UseDebouncer, DeleteDialog(), AdminProductsPage(), AvailabilityFilter, ProductsPage(), AdminStaffPage(), Badge() (+24 more)

## Knowledge Gaps
- **128 isolated node(s):** `Category`, `Product`, `CartItem`, `PaymentMethod`, `NumpadMode` (+123 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 2` to `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 20`, `Community 21`?**
  _High betweenness centrality (0.266) - this node is a cross-community bridge._
- **Why does `clsx` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `Category`, `Product`, `CartItem` to the rest of the system?**
  _128 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06830601092896176 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07213114754098361 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._