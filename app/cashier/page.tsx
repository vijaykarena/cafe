"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Product, Category, Table, Floor } from "@/lib/types";
import { supabase, getProductImageUrl } from "@/lib/supabase";
import {
  formatCurrency,
  calculateTaxAmount,
  formatDate,
  cn,
} from "@/lib/utils";
import {
  Minus,
  Plus,
  Send,
  Search,
  ShoppingCart,
  RotateCcw,
  Wifi,
  Banknote,
  Smartphone,
  CreditCard,
  X,
  Delete,
  CheckCircle2,
  ImageOff,
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  isServed?: boolean;
}

type PaymentMethod = "cash" | "upi" | "card";
type NumpadMode = "qty" | "price";

export default function PosTerminalPage() {
  const router = useRouter();

  // Database state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Active orders and toggles
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [orderMode, setOrderMode] = useState<"counter" | "table">("counter");
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedCounterOrderId, setSelectedCounterOrderId] = useState<
    string | null
  >(null);

  // Selector/Interaction state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);

  // Numpad state
  const [numpadBuffer, setNumpadBuffer] = useState("");
  const [numpadMode, setNumpadMode] = useState<NumpadMode>("qty");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");

  // Modals overlays
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [receiptEmail, setReceiptEmail] = useState("");
  const [cashReceived, setCashReceived] = useState("");

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get active session
        const sessRes = await fetch("/api/sessions");
        const sessData = await sessRes.json();
        let sessionId = null;
        if (sessData.active) {
          setActiveSessionId(sessData.session.id);
          sessionId = sessData.session.id;
        } else {
          // Automatically create a new open session
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const createRes = await fetch("/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ opened_by: user.id, opening_balance: 0 }),
            });
            const newSession = await createRes.json();
            if (newSession.id) {
              setActiveSessionId(newSession.id);
              sessionId = newSession.id;
            }
          }
        }

        // 1. Fetch categories
        const catsRes = await fetch("/api/categories");
        const cats = await catsRes.json();
        setCategories(cats || []);
        if (cats && cats.length > 0) setSelectedCategory(cats[0].id);

        // 2. Fetch products
        const prodsRes = await fetch("/api/products");
        const prods = await prodsRes.json();
        setProducts(prods || []);

        // 3. Fetch floors & tables
        const tablesRes = await fetch("/api/tables");
        const tablesData = await tablesRes.json();
        const loadedFloors = tablesData.floors || [];
        setFloors(loadedFloors);
        setTables(tablesData.tables || []);
        if (loadedFloors.length > 0) {
          setSelectedFloorId(loadedFloors[0].id);
        }

        if (sessionId) {
          await fetchActiveOrders(sessionId);
        }
      } catch (err) {
        console.error("API connection error. Using mock fallback.", err);
      }
    };
    loadData();
  }, []);

  const fetchActiveOrders = async (sessionId: string) => {
    try {
      const ordersRes = await fetch(`/api/orders?session_id=${sessionId}`);
      const orders = await ordersRes.json();
      if (Array.isArray(orders)) {
        setActiveOrders(orders);
      } else {
        console.error("Failed to load active orders:", orders);
        setActiveOrders([]);
      }
    } catch (err) {
      console.error("Error refreshing active orders:", err);
    }
  };

  // Setup Supabase Realtime Listener for live updates
  useEffect(() => {
    if (!activeSessionId) return;

    const handleRealtimeActiveOrders = (payload: any) => {
      const { eventType, table, new: newRow, old: oldRow } = payload;

      setActiveOrders((prevOrders) => {
        if (table === "orders") {
          if (eventType === "INSERT") {
            if (newRow.session_id !== activeSessionId) return prevOrders;
            if (prevOrders.some((o) => o.id === newRow.id)) return prevOrders;
            return [
              { ...newRow, order_items: [], kds_tickets: [] },
              ...prevOrders,
            ];
          }
          if (eventType === "UPDATE") {
            return prevOrders.map((o) =>
              o.id === newRow.id ? { ...o, ...newRow } : o,
            );
          }
          if (eventType === "DELETE") {
            return prevOrders.filter((o) => o.id !== oldRow.id);
          }
        }

        if (table === "order_items") {
          if (eventType === "INSERT") {
            return prevOrders.map((o) => {
              if (o.id !== newRow.order_id) return o;
              if (
                (o.order_items || []).some((item: any) => item.id === newRow.id)
              )
                return o;
              return {
                ...o,
                order_items: [...(o.order_items || []), newRow],
              };
            });
          }
          if (eventType === "UPDATE") {
            return prevOrders.map((o) => {
              if (o.id !== newRow.order_id) return o;
              return {
                ...o,
                order_items: (o.order_items || []).map((item: any) =>
                  item.id === newRow.id ? { ...item, ...newRow } : item,
                ),
              };
            });
          }
          if (eventType === "DELETE") {
            return prevOrders.map((o) => {
              if (o.id !== oldRow.order_id) return o;
              return {
                ...o,
                order_items: (o.order_items || []).filter(
                  (item: any) => item.id !== oldRow.id,
                ),
              };
            });
          }
        }

        if (table === "kds_tickets") {
          if (eventType === "INSERT") {
            return prevOrders.map((o) => {
              if (o.id !== newRow.order_id) return o;
              if (
                (o.kds_tickets || []).some(
                  (ticket: any) => ticket.id === newRow.id,
                )
              )
                return o;
              return {
                ...o,
                kds_tickets: [...(o.kds_tickets || []), newRow],
              };
            });
          }
          if (eventType === "UPDATE") {
            return prevOrders.map((o) => {
              if (o.id !== newRow.order_id) return o;
              return {
                ...o,
                kds_tickets: (o.kds_tickets || []).map((ticket: any) =>
                  ticket.id === newRow.id ? { ...ticket, ...newRow } : ticket,
                ),
              };
            });
          }
          if (eventType === "DELETE") {
            return prevOrders.map((o) => {
              if (o.id !== oldRow.order_id) return o;
              return {
                ...o,
                kds_tickets: (o.kds_tickets || []).filter(
                  (ticket: any) => ticket.id !== oldRow.id,
                ),
              };
            });
          }
        }

        return prevOrders;
      });
    };

    const channel = supabase
      .channel("cashier_terminal_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        handleRealtimeActiveOrders,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kds_tickets" },
        handleRealtimeActiveOrders,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        handleRealtimeActiveOrders,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  // Derived visible products
  const visibleProducts = useMemo(() => {
    const byCat = products.filter((p) => p.category_id === selectedCategory);
    if (!search.trim()) return byCat;
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [selectedCategory, products, search]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price =
        item.customPrice !== undefined ? item.customPrice : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const taxTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price =
        item.customPrice !== undefined ? item.customPrice : item.product.price;
      return (
        sum +
        calculateTaxAmount(price * item.quantity, parseFloat(item.product.tax))
      );
    }, 0);
  }, [cartItems]);

  const total = Math.round(subtotal + taxTotal);

  // Helper: Find active draft order for selected table
  const activeOrderForTable = useMemo(() => {
    if (orderMode !== "table" || !selectedTable) return null;
    return activeOrders.find(
      (o) => o.table_id === selectedTable.id && o.status === "draft",
    );
  }, [activeOrders, selectedTable, orderMode]);

  // Helper: Find active counter draft order
  const activeCounterDraftOrder = useMemo(() => {
    if (orderMode !== "counter" || !selectedCounterOrderId) return null;
    return activeOrders.find(
      (o) =>
        o.id === selectedCounterOrderId && o.status === "draft" && !o.table_id,
    );
  }, [activeOrders, selectedCounterOrderId, orderMode]);

  // Resolve KDS ticket and preparation status for a table
  const getTableStatus = (tableId: string) => {
    const order = activeOrders.find(
      (o) => o.table_id === tableId && o.status === "draft",
    );
    if (!order) return { state: "empty", label: "Empty" };

    const kdsTicket = order.kds_tickets?.[0];
    if (!kdsTicket) {
      return { state: "served", label: "Served" };
    }

    const kdsStatus = kdsTicket.status || "to_cook";

    if (kdsStatus === "to_cook") {
      return { state: "pending", label: "Pending" };
    }
    if (kdsStatus === "preparing") {
      return { state: "preparing", label: "Preparing" };
    }
    if (kdsStatus === "completed") {
      return { state: "ready", label: "Ready" };
    }

    return { state: "occupied", label: "Occupied" };
  };

  // Sync cart when table/counter selection changes
  const prevSelectedTableRef = useRef<any>(null);
  const prevSelectedCounterOrderIdRef = useRef<string | null>(null);
  const prevOrderModeRef = useRef<string>("counter");

  useEffect(() => {
    const selectionChanged =
      prevSelectedTableRef.current !== selectedTable ||
      prevSelectedCounterOrderIdRef.current !== selectedCounterOrderId ||
      prevOrderModeRef.current !== orderMode;

    prevSelectedTableRef.current = selectedTable;
    prevSelectedCounterOrderIdRef.current = selectedCounterOrderId;
    prevOrderModeRef.current = orderMode;

    const activeOrder =
      orderMode === "table" ? activeOrderForTable : activeCounterDraftOrder;

    if (activeOrder) {
      const dbCartItems = (activeOrder.order_items || []).map((oi: any) => {
        const prod = products.find((p) => p.id === oi.product_id) || {
          id: oi.product_id || "",
          name: oi.products?.name || "Unknown Item",
          price: Number(oi.unit_price),
          tax: String(oi.tax_rate),
          category_id: "",
          is_available: true,
          status: "enable",
          manager_id: "",
          description: null,
          image_url: "",
          created_at: "",
        };
        return {
          product: prod as Product,
          quantity: oi.quantity,
          isServed: oi.is_served || false,
        };
      });

      if (selectionChanged) {
        setCartItems(dbCartItems);
      } else {
        // Selection did not change: merge database items and unsaved items
        setCartItems((prevCart) => {
          // Identify unsaved items
          const unsavedItems: CartItem[] = [];

          prevCart.forEach((prevItem) => {
            if (prevItem.isServed) return;

            // Calculate total quantity of this product in dbCartItems (both served and unserved)
            const dbTotalQty = dbCartItems
              .filter((di: CartItem) => di.product.id === prevItem.product.id)
              .reduce((sum: number, di: CartItem) => sum + di.quantity, 0);

            // Calculate total quantity of this product in prevCart
            const prevTotalQty = prevCart
              .filter(
                (pi: CartItem) =>
                  pi.product.id === prevItem.product.id && !pi.isServed,
              )
              .reduce((sum: number, pi: CartItem) => sum + pi.quantity, 0);

            // If we have more in the cart than in the database, the difference is unsaved
            if (prevTotalQty > dbTotalQty) {
              const delta = prevTotalQty - dbTotalQty;
              // To prevent duplicate additions, only add to unsavedItems once per product
              const alreadyAdded = unsavedItems.some(
                (ui) => ui.product.id === prevItem.product.id,
              );
              if (!alreadyAdded) {
                unsavedItems.push({
                  product: prevItem.product,
                  quantity: delta,
                  isServed: false,
                });
              }
            }
          });

          // Helper to combine items by product and isServed status
          const combineCartItems = (items: CartItem[]): CartItem[] => {
            const map = new Map<string, CartItem>();
            items.forEach((item) => {
              const key = `${item.product.id}-${item.isServed ? "served" : "new"}`;
              const existing = map.get(key);
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                map.set(key, { ...item });
              }
            });
            return Array.from(map.values());
          };

          return combineCartItems([...dbCartItems, ...unsavedItems]);
        });
      }
    } else {
      setCartItems([]);
    }
    setActiveCartItemId(null);
  }, [
    selectedTable,
    selectedCounterOrderId,
    orderMode,
    activeOrderForTable,
    activeCounterDraftOrder,
    products,
  ]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (orderMode === "table" && !selectedTable) {
      return;
    }
    setCartItems((prev) => {
      const hit = prev.find(
        (item) => item.product.id === product.id && !item.isServed,
      );
      let updated;
      if (hit) {
        updated = prev.map((item) =>
          item.product.id === product.id && !item.isServed
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        updated = [...prev, { product, quantity: 1, isServed: false }];
      }
      setActiveCartItemId(product.id);
      return updated;
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const updated = prev
        .map((item) => {
          if (item.product.id === productId && !item.isServed) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      const remains = updated.find(
        (i) => i.product.id === productId && !i.isServed,
      );
      if (!remains && activeCartItemId === productId) {
        setActiveCartItemId(null);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems((prev) => prev.filter((item) => item.isServed));
    setActiveCartItemId(null);
    setNumpadBuffer("");
  };

  // Numpad key input handler
  const handleNumpadKey = (key: string) => {
    if (key === "backspace") {
      const next = numpadBuffer.slice(0, -1);
      setNumpadBuffer(next);
      applyNumpadValue(next);
      return;
    }
    if (key === "+/-") return;
    const next = numpadBuffer + key;
    setNumpadBuffer(next);
    applyNumpadValue(next);
  };

  const applyNumpadValue = (valStr: string) => {
    const num = parseInt(valStr) || 0;
    if (numpadMode === "qty" && activeCartItemId) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === activeCartItemId && !item.isServed
            ? { ...item, quantity: Math.max(num, 1) }
            : item,
        ),
      );
    } else if (numpadMode === "price" && activeCartItemId) {
      const floatVal = parseFloat(valStr) || 0;
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === activeCartItemId && !item.isServed
            ? { ...item, customPrice: floatVal > 0 ? floatVal : undefined }
            : item,
        ),
      );
    }
  };

  // Send draft to kitchen (KDS)
  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    const activeOrder =
      orderMode === "table" ? activeOrderForTable : activeCounterDraftOrder;
    setActionLoading(true);

    try {
      if (!activeSessionId) {
        throw new Error("No active POS session.");
      }

      if (activeOrder) {
        const dbItems = (activeOrder.order_items || []).filter(
          (oi: any) => !oi.is_served,
        );
        const itemsToAppend: any[] = [];

        cartItems
          .filter((item) => !item.isServed)
          .forEach((cartItem) => {
            const dbItem = dbItems.find(
              (di: any) => di.product_id === cartItem.product.id,
            );
            const dbQty = dbItem ? dbItem.quantity : 0;
            if (cartItem.quantity > dbQty) {
              itemsToAppend.push({
                product: cartItem.product,
                quantity: cartItem.quantity - dbQty,
              });
            }
          });

        if (itemsToAppend.length === 0) {
          alert("Kitchen order is already up to date!");
          setActionLoading(false);
          return;
        }

        const res = await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: activeOrder.id,
            items: itemsToAppend,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } else {
        const orderNum = "ORD-" + Math.floor(Math.random() * 90000 + 10000);
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: activeSessionId,
            table_id: orderMode === "table" ? selectedTable?.id : null,
            customer_id: null,
            order_number: orderNum,
            subtotal,
            tax: taxTotal,
            total,
            status: "draft",
            payment_method: null,
            items: cartItems.map((item) => ({
              product: item.product,
              quantity: item.quantity,
            })),
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (orderMode === "counter") {
          setSelectedCounterOrderId(data.order.id);
        }
      }

      alert("Draft order successfully sent to kitchen!");
      await fetchActiveOrders(activeSessionId);
    } catch (err: any) {
      alert(`Failed to send to kitchen: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Checkout payment handler
  const checkout = async () => {
    if (cartItems.length === 0) return;
    setActionLoading(true);
    try {
      if (!activeSessionId) {
        throw new Error("No active POS session.");
      }

      const activeOrder =
        orderMode === "table" ? activeOrderForTable : activeCounterDraftOrder;
      const orderNum = activeOrder
        ? activeOrder.order_number
        : "ORD-" + Math.floor(Math.random() * 90000 + 10000);

      let orderPayload: any;

      if (activeOrder) {
        const dbItems = (activeOrder.order_items || []).filter(
          (oi: any) => !oi.is_served,
        );
        const itemsToAppend: any[] = [];

        cartItems
          .filter((item) => !item.isServed)
          .forEach((cartItem) => {
            const dbItem = dbItems.find(
              (di: any) => di.product_id === cartItem.product.id,
            );
            const dbQty = dbItem ? dbItem.quantity : 0;
            if (cartItem.quantity > dbQty) {
              itemsToAppend.push({
                product: cartItem.product,
                quantity: cartItem.quantity - dbQty,
              });
            }
          });

        const res = await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: activeOrder.id,
            status: "paid",
            payment_method: paymentMethod,
            subtotal,
            tax: taxTotal,
            total,
            items: itemsToAppend,
          }),
        });

        const orderResult = await res.json();
        if (orderResult.error) throw new Error(orderResult.error);

        orderPayload = {
          order_number: orderNum,
          table:
            orderMode === "table"
              ? selectedTable?.table_number || "Table"
              : "Takeaway",
          customer: "Guest Customer",
          subtotal,
          tax: taxTotal,
          total,
          payment_method: paymentMethod,
          items: cartItems,
          date: new Date().toISOString(),
        };
      } else {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: activeSessionId,
            table_id: orderMode === "table" ? selectedTable?.id : null,
            customer_id: null,
            order_number: orderNum,
            subtotal,
            tax: taxTotal,
            total,
            status: "paid",
            payment_method: paymentMethod,
            items: cartItems,
          }),
        });

        const orderResult = await res.json();
        if (orderResult.error) throw new Error(orderResult.error);

        orderPayload = {
          order_number: orderNum,
          table:
            orderMode === "table"
              ? selectedTable?.table_number || "Table"
              : "Takeaway",
          customer: "Guest Customer",
          subtotal,
          tax: taxTotal,
          total,
          payment_method: paymentMethod,
          items: cartItems,
          date: new Date().toISOString(),
        };
      }

      setLastOrderDetails(orderPayload);
      setReceiptEmail("");

      // Reset cart and states
      setCartItems([]);
      setSelectedTable(null);
      setSelectedCounterOrderId(null);
      setActiveCartItemId(null);
      setNumpadBuffer("");
      setCashReceived("");
      setShowReceiptModal(true);

      await fetchActiveOrders(activeSessionId);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden font-sans select-none text-zinc-200">
      {/* ── TOP BAR ── */}
      <header className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0 text-white">
        <div className="flex items-center justify-center rounded-xl bg-[#F9F5F2] text-black font-bold text-xs px-4 py-2 shrink-0 select-none tracking-tight">
          CAFE POS
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 ml-4 shrink-0">
          <button
            onClick={() => {
              setOrderMode("counter");
              setSelectedTable(null);
              setSelectedCounterOrderId(null);
            }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              orderMode === "counter"
                ? "bg-[#F9F5F2] text-black"
                : "bg-transparent text-zinc-400 hover:text-white",
            )}
          >
            Counter Service
          </button>
          <button
            onClick={() => {
              setOrderMode("table");
              setSelectedTable(null);
              setSelectedCounterOrderId(null);
              if (floors.length > 0) {
                setSelectedFloorId(floors[0].id);
              }
            }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              orderMode === "table"
                ? "bg-[#F9F5F2] text-black"
                : "bg-transparent text-zinc-400 hover:text-white",
            )}
          >
            Table Service
          </button>
        </div>

        <div className="relative flex-1 max-w-xs ml-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-xl border border-zinc-800 pl-4 pr-9 py-2 text-sm outline-none focus:border-[#F9F5F2] transition-colors bg-zinc-950 text-zinc-100 placeholder-zinc-650"
          />
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={clearCart}
            className="flex items-center justify-center rounded-xl border border-zinc-800 p-2.5 text-zinc-500 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer"
            title="Clear Cart"
          >
            <RotateCcw size={15} />
          </button>

          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-350 bg-zinc-900">
            <Wifi size={13} className="text-[#F9F5F2]" />{" "}
            <span className="font-semibold">Terminal Connected</span>
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              document.cookie =
                "sb-access-token=; path=/; max-age=0; SameSite=Lax";
              router.push("/login");
            }}
            className="flex items-center justify-center rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-500 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ── */}
        <section className="flex flex-col flex-1 p-4 overflow-hidden border-r border-zinc-800">
          {orderMode === "table" && !selectedTable ? (
            /* ── FLOOR PLAN MAP ── */
            <div className="flex flex-col gap-4 overflow-y-auto h-full pr-1">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Restaurant Floor Plan
                  </h3>
                  <span className="text-[10px] text-[#F9F5F2] font-semibold px-2.5 py-1 rounded bg-[#F9F5F2]/10 border border-[#F9F5F2]/20">
                    Select a Table to Begin
                  </span>
                </div>

                {/* Floor tabs */}
                <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar border-b border-zinc-800">
                  {floors.map((floor) => (
                    <button
                      key={floor.id}
                      onClick={() => {
                        setSelectedFloorId(floor.id);
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                        selectedFloorId === floor.id
                          ? "bg-[#F9F5F2] text-black border-[#F9F5F2] font-bold shadow-sm"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900",
                      )}
                    >
                      {floor.name}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedFloorId("takeaway-drafts");
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                      selectedFloorId === "takeaway-drafts"
                        ? "bg-[#F9F5F2] text-black border-[#F9F5F2] font-bold shadow-sm"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900",
                    )}
                  >
                    Takeaway Drafts
                  </button>
                </div>

                {/* Tables Grid or Takeaway Drafts List */}
                {selectedFloorId === "takeaway-drafts" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {activeOrders
                      .filter((o) => !o.table_id && o.status === "draft")
                      .map((order) => (
                        <button
                          key={order.id}
                          onClick={() => {
                            setSelectedCounterOrderId(order.id);
                            setOrderMode("counter");
                            setSelectedTable(null);
                          }}
                          className="p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-zinc-950 border-zinc-850 hover:border-[#F9F5F2]/50 hover:bg-zinc-900 group"
                        >
                          <span className="text-sm font-extrabold text-[#F9F5F2] group-hover:scale-105 transition-transform">
                            {order.order_number}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold">
                            {formatCurrency(
                              Number(order.total),
                              "INR",
                              "en-IN",
                            )}
                          </span>
                        </button>
                      ))}
                    {activeOrders.filter(
                      (o) => !o.table_id && o.status === "draft",
                    ).length === 0 && (
                      <p className="col-span-full text-center text-zinc-500 py-12 text-sm">
                        No active takeaway drafts.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {tables
                      .filter((t) => t.floor_id === selectedFloorId)
                      .map((tbl) => {
                        const status = getTableStatus(tbl.id);
                        const isSelected = false;

                        let buttonStyles = "";
                        let statusLabelStyles = "";

                        if (isSelected) {
                          buttonStyles =
                            "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-lg shadow-[#F9F5F2]/10 font-bold scale-[1.02]";
                          statusLabelStyles = "text-black/70";
                        } else if (status.state === "pending") {
                          buttonStyles =
                            "bg-amber-955/20 border-amber-500/50 text-amber-200 hover:border-amber-400";
                          statusLabelStyles = "text-amber-400";
                        } else if (status.state === "preparing") {
                          buttonStyles =
                            "bg-orange-955/20 border-orange-500/50 text-orange-200 hover:border-orange-400";
                          statusLabelStyles = "text-orange-400";
                        } else if (status.state === "ready") {
                          buttonStyles =
                            "bg-emerald-955/20 border-emerald-500/50 text-emerald-200 hover:border-emerald-400 animate-pulse";
                          statusLabelStyles = "text-emerald-400 font-bold";
                        } else if (status.state === "served") {
                          buttonStyles =
                            "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-650";
                          statusLabelStyles = "text-zinc-500 font-semibold";
                        } else {
                          buttonStyles =
                            "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700";
                          statusLabelStyles = "text-zinc-600";
                        }

                        return (
                          <button
                            key={tbl.id}
                            onClick={() => {
                              setSelectedTable(tbl);
                              setSelectedCounterOrderId(null);
                            }}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${buttonStyles}`}
                          >
                            <span className="text-lg font-extrabold">
                              {tbl.table_number}
                            </span>
                            <span
                              className={`text-[9px] uppercase tracking-wider ${statusLabelStyles}`}
                            >
                              {status.label}
                            </span>
                          </button>
                        );
                      })}
                    {tables.filter((t) => t.floor_id === selectedFloorId)
                      .length === 0 && (
                      <p className="col-span-full text-center text-zinc-500 py-12 text-sm">
                        No tables registered on this floor.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── MENU CATALOG PANEL ── */
            <div className="flex flex-col gap-3 h-full overflow-hidden">
              {/* Context Bar */}
              {orderMode === "table" && selectedTable && (
                <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0">
                  <span className="text-xs font-bold text-[#F9F5F2]">
                    Table {selectedTable.table_number} Service Active
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      setSelectedCounterOrderId(null);
                    }}
                    className="text-[10px] bg-zinc-850 hover:bg-zinc-800 text-white font-bold px-3 py-1 rounded-xl transition-all cursor-pointer"
                  >
                    Change Table
                  </button>
                </div>
              )}
              {orderMode === "counter" && selectedCounterOrderId && (
                <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0">
                  <span className="text-xs font-bold text-[#F9F5F2]">
                    Takeaway Draft:{" "}
                    {activeCounterDraftOrder?.order_number ||
                      selectedCounterOrderId}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      setSelectedCounterOrderId(null);
                    }}
                    className="text-[10px] bg-zinc-850 hover:bg-zinc-800 text-white font-bold px-3 py-1 rounded-xl transition-all cursor-pointer"
                  >
                    New Counter Order
                  </button>
                </div>
              )}

              {/* Category and Product Grid */}
              <div className="flex gap-3 flex-1 overflow-hidden min-h-0">
                {/* Category sidebar */}
                <aside className="flex flex-col gap-2 w-36 shrink-0 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSearch("");
                      }}
                      className={cn(
                        "rounded-xl px-4 py-3 text-xs font-bold text-left transition-all border cursor-pointer",
                        selectedCategory === cat.id && !search
                          ? "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-sm"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2] hover:text-[#F9F5F2]",
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </aside>

                {/* Product grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 content-start pr-1">
                  {visibleProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="relative flex flex-col items-center justify-between rounded-2xl border px-3 py-3 text-center transition-all bg-zinc-900 border-zinc-800 hover:border-[#F9F5F2] hover:shadow-md cursor-pointer group overflow-hidden h-[160px]"
                    >
                      <span className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full bg-emerald-500 z-10" />
                      {product.image_url &&
                      product.image_url !== "pending-upload" ? (
                        <img
                          src={getProductImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-20 shrink-0 object-cover rounded-xl mb-1"
                        />
                      ) : (
                        <div className="w-full h-20 shrink-0 rounded-xl mb-1 bg-zinc-800 flex items-center justify-center">
                          <ImageOff size={18} className="text-zinc-600" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-zinc-350 leading-tight group-hover:text-[#F9F5F2] transition-colors line-clamp-2">
                        {product.name}
                      </span>
                      <span className="mt-1.5 text-xs font-extrabold text-[#F9F5F2]">
                        {formatCurrency(Number(product.price), "INR", "en-IN")}
                      </span>
                    </button>
                  ))}
                  {visibleProducts.length === 0 && (
                    <p className="col-span-3 text-center text-zinc-500 mt-16 text-sm">
                      No products found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── CART PANEL ── */}
        <section className="w-80 shrink-0 flex flex-col p-4 overflow-hidden border-r border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider truncate max-w-[120px]">
              {orderMode === "table"
                ? selectedTable
                  ? `Table ${selectedTable.table_number}`
                  : "No Table"
                : selectedCounterOrderId
                  ? `Takeaway ${activeCounterDraftOrder?.order_number || "Draft"}`
                  : "Counter Order"}
            </h3>
            {cartItems.some((item) => !item.isServed) && (
              <button
                onClick={clearCart}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold cursor-pointer transition-colors"
              >
                Clear New
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {cartItems.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center text-zinc-500 mt-16 text-xs gap-1.5">
                <ShoppingCart size={24} className="text-zinc-400" />
                <p>Cart is empty</p>
                <p className="text-[10px] text-zinc-650">
                  {orderMode === "table"
                    ? "Select a table and choose menu items"
                    : "Choose menu items to begin"}
                </p>
              </div>
            )}
            {cartItems.map((item) => {
              const price =
                item.customPrice !== undefined
                  ? item.customPrice
                  : item.product.price;
              const isActive =
                activeCartItemId === item.product.id && !item.isServed;
              const isItemServed = item.isServed || false;

              return (
                <div
                  key={`${item.product.id}-${isItemServed ? "served" : "new"}`}
                  onClick={() => {
                    if (!isItemServed) {
                      setActiveCartItemId(item.product.id);
                      setNumpadBuffer("");
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all cursor-pointer border",
                    isActive
                      ? "bg-[#F9F5F2]/10 border-[#F9F5F2]/30 shadow-sm"
                      : "bg-zinc-950/50 border-zinc-850 hover:bg-zinc-800",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {formatCurrency(price, "INR", "en-IN")}{" "}
                      {item.customPrice !== undefined && "(Custom)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isItemServed ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            changeQty(item.product.id, -1);
                          }}
                          className="h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-colors cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            changeQty(item.product.id, 1);
                          }}
                          className="h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-colors cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg select-none flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse"></span>
                        {item.quantity} Served
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-extrabold text-zinc-400 w-16 text-right shrink-0">
                    {formatCurrency(price * item.quantity, "INR", "en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cart footer */}
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <button
              onClick={handleSendToKitchen}
              disabled={!cartItems.length || actionLoading}
              className={cn(
                "w-full flex items-center justify-between rounded-xl px-4 py-2.5 font-semibold text-xs transition-all cursor-pointer",
                cartItems.length
                  ? "bg-[#F9F5F2] text-black hover:bg-[#e5e1de]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
              )}
            >
              <span>
                {actionLoading ? "Sending..." : "Send Draft to Kitchen (KDS)"}
              </span>
              <Send size={13} />
            </button>

            {/* Totals */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400 font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, "INR", "en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-400 font-semibold">
                <span>Tax (GST)</span>
                <span>{formatCurrency(taxTotal, "INR", "en-IN")}</span>
              </div>
              <div className="flex justify-between font-extrabold text-zinc-100 border-t border-zinc-800 pt-1.5 text-sm">
                <span>Total</span>
                <span className="text-[#F9F5F2]">
                  {formatCurrency(total, "INR", "en-IN")}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#F9F5F2] mb-2">
                Payment Method
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "cash" as PaymentMethod,
                    label: "Cash",
                    Icon: Banknote,
                  },
                  {
                    id: "upi" as PaymentMethod,
                    label: "UPI",
                    Icon: Smartphone,
                  },
                  {
                    id: "card" as PaymentMethod,
                    label: "Card",
                    Icon: CreditCard,
                  },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setPaymentMethod(id);
                      if (id === "cash") setCashReceived("");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-[10px] font-bold transition-all cursor-pointer",
                      paymentMethod === id
                        ? "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-sm"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2] hover:text-[#F9F5F2]",
                    )}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={checkout}
              disabled={!cartItems.length || actionLoading}
              className={cn(
                "w-full rounded-xl py-3 mt-1 text-xs font-bold transition-all cursor-pointer uppercase flex items-center justify-center gap-2",
                cartItems.length
                  ? "bg-[#F9F5F2] text-black hover:bg-[#e5e1de]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
              )}
            >
              {actionLoading
                ? "Processing..."
                : `Checkout • ${formatCurrency(total, "INR", "en-IN")}`}
            </button>
          </div>
        </section>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 3. Receipt Success Modal */}
      {showReceiptModal && lastOrderDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <h2 className="text-base font-extrabold text-center text-zinc-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" /> Order
              Completed!
            </h2>

            {/* Paper Receipt Box */}
            <div className="bg-gray-50 border border-gray-200 text-zinc-800 p-6 rounded-xl font-mono text-[10px] space-y-4 shadow-sm select-text">
              <div className="text-center space-y-0.5">
                <h3 className="font-bold text-xs uppercase tracking-tight text-zinc-900">
                  CAFE POS SYSTEM
                </h3>
                <p className="text-zinc-500 text-[9px]">
                  123 Gourmet Lane, Food City
                </p>
                <p className="text-zinc-500 text-[9px]">Tel: 1800-CAFE-POS</p>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
                <p>Order Ref: {lastOrderDetails.order_number}</p>
                <p>Date: {formatDate(lastOrderDetails.date)}</p>
                <p>Table: {lastOrderDetails.table}</p>
                <p>Customer: {lastOrderDetails.customer}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1.5">
                {lastOrderDetails.items.map((item: any) => {
                  const price =
                    item.customPrice !== undefined
                      ? item.customPrice
                      : item.product.price;
                  return (
                    <div key={item.product.id} className="flex justify-between">
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>
                        {formatCurrency(price * item.quantity, "INR", "en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(lastOrderDetails.subtotal, "INR", "en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Total:</span>
                  <span>
                    {formatCurrency(lastOrderDetails.tax, "INR", "en-IN")}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-xs text-zinc-900">
                  <span>TOTAL PAID:</span>
                  <span>
                    {formatCurrency(lastOrderDetails.total, "INR", "en-IN")}
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-300 pt-3 text-[9px] text-gray-500 uppercase tracking-wider">
                Thank you! Scan QR to review.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-zinc-900 focus:outline-none focus:border-zinc-400 placeholder:text-gray-400"
                />
                <button
                  onClick={() =>
                    alert(`Receipt has been emailed to ${receiptEmail}`)
                  }
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  Email
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer"
              >
                Print Receipt Invoice
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 bg-[#F9F5F2] hover:bg-[#e5e1de] text-black text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
