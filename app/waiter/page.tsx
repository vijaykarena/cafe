"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  Loader2,
  Search,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, getProductImageUrl } from "@/lib/supabase";
import { useDebouncer } from "@/hooks/debounce";

interface Product {
  id: string;
  name: string;
  price: number;
  tax: number;
  category_id: string;
  is_available: boolean;
  image_url: string;
}

interface Category {
  id: string;
  name: string;
}

interface Table {
  id: string;
  floor_id: string;
  table_number: string;
  seats: number;
  is_active: boolean;
}

interface Floor {
  id: string;
  name: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  isServed?: boolean;
}

type PaymentMethod = "cash" | "upi" | "card";

export default function WaiterDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Database loaded states
  const [dbTables, setDbTables] = useState<Table[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Selection states
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [search, setSearch, debouncedSearch] = useDebouncer("", 300);

  // UI States
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Fetch session
        const sessRes = await fetch("/api/sessions");
        const sessData = await sessRes.json();
        let sessionId = null;
        if (sessData.active) {
          setActiveSessionId(sessData.session.id);
          sessionId = sessData.session.id;
        } else {
          toast.warning(
            "No active POS session. Please ask cashier to open a shift.",
          );
        }

        // Fetch categories
        const catsRes = await fetch("/api/categories");
        const cats = await catsRes.json();
        setCategories(cats || []);

        // Fetch products
        const prodsRes = await fetch("/api/products");
        const prods = await prodsRes.json();
        setProducts(prods || []);

        // Fetch tables & floors
        const tablesRes = await fetch("/api/tables");
        const tablesData = await tablesRes.json();
        const loadedTables = tablesData.tables || [];
        const loadedFloors = (tablesData.floors || []).filter((f: any) => f.status !== 'disable');

        setDbTables(loadedTables);
        setFloors(loadedFloors);

        if (loadedFloors.length > 0) {
          setSelectedFloorId(loadedFloors[0].id);
          const firstTable = loadedTables.find(
            (t: any) => t.floor_id === loadedFloors[0].id,
          );
          if (firstTable) {
            setSelectedTableId(firstTable.id);
          }
        }

        // Fetch active session orders to check table occupancy
        if (sessionId) {
          await fetchActiveOrders(sessionId);
        }
      } catch (err) {
        console.error("Error loading waiter data:", err);
        toast.error("Failed to connect to database APIs.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
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
        if (orders?.error) {
          toast.error(`Failed to load active orders: ${orders.error}`);
        }
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
              o.id === newRow.id ? { ...o, ...newRow } : o
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
              if ((o.order_items || []).some((item: any) => item.id === newRow.id)) return o;
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
                  item.id === newRow.id ? { ...item, ...newRow } : item
                ),
              };
            });
          }
          if (eventType === "DELETE") {
            return prevOrders.map((o) => {
              if (o.id !== oldRow.order_id) return o;
              return {
                ...o,
                order_items: (o.order_items || []).filter((item: any) => item.id !== oldRow.id),
              };
            });
          }
        }

        if (table === "kds_tickets") {
          if (eventType === "INSERT") {
            return prevOrders.map((o) => {
              if (o.id !== newRow.order_id) return o;
              if ((o.kds_tickets || []).some((ticket: any) => ticket.id === newRow.id)) return o;
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
                  ticket.id === newRow.id ? { ...ticket, ...newRow } : ticket
                ),
              };
            });
          }
          if (eventType === "DELETE") {
            return prevOrders.map((o) => {
              if (o.id !== oldRow.order_id) return o;
              return {
                ...o,
                kds_tickets: (o.kds_tickets || []).filter((ticket: any) => ticket.id !== oldRow.id),
              };
            });
          }
        }

        return prevOrders;
      });
    };

    const channel = supabase
      .channel("waiter_dashboard_live")
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

  // Helper: Find DB Table mapping for selected table ID
  const dbTableForSelectedId = useMemo(() => {
    return dbTables.find((t) => t.id === selectedTableId);
  }, [dbTables, selectedTableId]);

  // Helper: Find active draft order for a given DB Table
  const activeOrderForTable = useMemo(() => {
    if (!selectedTableId) return null;
    return activeOrders.find(
      (o) => o.table_id === selectedTableId && o.status === "draft",
    );
  }, [activeOrders, selectedTableId]);

  // Sync cart when table selection changes
  const prevSelectedTableIdRef = useRef<string | null>(null);

  useEffect(() => {
    const tableChanged = prevSelectedTableIdRef.current !== selectedTableId;
    prevSelectedTableIdRef.current = selectedTableId;

    if (activeOrderForTable) {
      // Map database order_items to cart structure
      const dbCartItems = (activeOrderForTable.order_items || []).map((oi: any) => {
        // Resolve full product details
        const prod = products.find((p) => p.id === oi.product_id) || {
          id: oi.product_id || oi.id || Math.random().toString(),
          name: oi.products?.name || "Unknown Item",
          price: Number(oi.unit_price),
          tax: Number(oi.tax_rate),
          category_id: "",
          is_available: true,
        };
        return {
          product: prod,
          quantity: oi.quantity,
          isServed: oi.is_served || false,
        };
      });

      if (tableChanged) {
        setCart(dbCartItems);
      } else {
        // Table didn't change: merge database items and unsaved items
        setCart((prevCart) => {
          // Identify unsaved items
          const unsavedItems: OrderItem[] = [];
          
          prevCart.forEach((prevItem) => {
            if (prevItem.isServed) return;
            
            // Calculate total quantity of this product in dbCartItems (both served and unserved)
            const dbTotalQty = dbCartItems
              .filter((di: OrderItem) => di.product.id === prevItem.product.id)
              .reduce((sum: number, di: OrderItem) => sum + di.quantity, 0);
              
            // Calculate total quantity of this product in prevCart
            const prevTotalQty = prevCart
              .filter((pi: OrderItem) => pi.product.id === prevItem.product.id && !pi.isServed)
              .reduce((sum: number, pi: OrderItem) => sum + pi.quantity, 0);

            // If we have more in the cart than in the database, the difference is unsaved
            if (prevTotalQty > dbTotalQty) {
              const delta = prevTotalQty - dbTotalQty;
              // To prevent duplicate additions, only add to unsavedItems once per product
              const alreadyAdded = unsavedItems.some((ui) => ui.product.id === prevItem.product.id);
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
          const combineCartItems = (items: OrderItem[]): OrderItem[] => {
            const map = new Map<string, OrderItem>();
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
      setCart([]);
    }
  }, [selectedTableId, activeOrderForTable, products]);

  // Check if a specific table ID has an active draft order
  const checkOccupied = (tableId: string) => {
    return activeOrders.some(
      (o) => o.table_id === tableId && o.status === "draft",
    );
  };

  // Resolve KDS ticket and preparation status for a table
  const getTableStatus = (tableId: string) => {
    const order = activeOrders.find(
      (o) => o.table_id === tableId && o.status === "draft",
    );
    if (!order) return { state: "empty", label: "Empty" };

    // Find KDS ticket status (from order.kds_tickets)
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

  // Cart operations
  const addToCart = (product: Product) => {
    if (!selectedTableId) {
      toast.error("Please select the table first to place an order");
      return;
    }

    const existing = cart.find(
      (item) => item.product.id === product.id && !item.isServed,
    );
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id && !item.isServed
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { product, quantity: 1, isServed: false }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId && !item.isServed) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[],
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(
      cart.filter((item) => !(item.product.id === productId && !item.isServed)),
    );
  };

  const clearCart = () => {
    setCart(cart.filter((item) => item.isServed));
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const taxTotal = cart.reduce(
    (sum, item) =>
      sum +
      (item.product.price * item.quantity * (item.product.tax || 0)) / 100,
    0,
  );
  const total = subtotal + taxTotal;

  // Book Order (Submit to Kitchen)
  const handleSendToKds = async () => {
    if (cart.length === 0) return;
    setActionLoading(true);

    try {
      if (!activeSessionId) {
        throw new Error("No active store shift session open.");
      }

      // If DB table is not mapped, we set it as null (takeaway fallback)
      let tableId = selectedTableId;
      if (!tableId) {
        // Fallback or alert
        toast.info("No table selected. Setting order as takeaway.");
      }

      // We determine if we need to POST (create new order) or PUT (append to existing)
      if (activeOrderForTable) {
        // Find which items in the current cart are actually NEW or modified
        // To be safe and simple, the PUT route takes the full cart list to append,
        // but wait! The PUT route expects the items that are ADDED.
        // Let's filter the cart items to find which ones are newly added.
        // If an item was already present in database draft with qty Q, and cart has qty C,
        // then we append (C - Q) if C > Q. If C <= Q, we don't append it to kitchen again.
        const dbItems = (activeOrderForTable.order_items || []).filter(
          (oi: any) => !oi.is_served,
        );
        const itemsToAppend: OrderItem[] = [];

        cart
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
          toast.success("Kitchen order is already up to date!");
          setActionLoading(false);
          return;
        }

        const res = await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: activeOrderForTable.id,
            items: itemsToAppend,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } else {
        // Create a new draft order
        const orderNum = "ORD-" + Math.floor(Math.random() * 90000 + 10000);
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: activeSessionId,
            table_id: tableId,
            customer_id: null,
            order_number: orderNum,
            subtotal,
            tax: taxTotal,
            discount_amount: 0,
            total,
            status: "draft",
            payment_method: null,
            items: cart.map((item) => ({
              product: item.product,
              quantity: item.quantity,
            })),
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }

      toast.success("Draft order successfully sent to kitchen!");
      setIsSubmitted(true);

      // Reload active orders
      const ordersRes = await fetch(
        `/api/orders?session_id=${activeSessionId}`,
      );
      const orders = await ordersRes.json();
      if (Array.isArray(orders)) {
        setActiveOrders(orders);
      } else {
        console.error("Failed to reload active orders:", orders);
        setActiveOrders([]);
      }

      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);
    } catch (err: any) {
      toast.error(`Order Booking failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!activeOrderForTable) return;
    setActionLoading(true);

    try {
      if (!activeSessionId) {
        throw new Error("No active store shift session open.");
      }

      const dbItems = (activeOrderForTable.order_items || []).filter(
        (oi: any) => !oi.is_served,
      );
      const itemsToAppend: OrderItem[] = [];

      cart
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
              isServed: false,
            });
          }
        });

      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: activeOrderForTable.id,
          status: "paid",
          payment_method: paymentMethod,
          subtotal,
          tax: taxTotal,
          discount_amount: 0,
          total,
          items: itemsToAppend,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Order marked as paid and table cleared!");
      setShowBillModal(false);

      // Reload active orders
      const ordersRes = await fetch(
        `/api/orders?session_id=${activeSessionId}`,
      );
      const orders = await ordersRes.json();
      if (Array.isArray(orders)) {
        setActiveOrders(orders);
      } else {
        setActiveOrders([]);
      }
      
      setCart([]);
      setSelectedTableId(null);
    } catch (err: any) {
      toast.error(`Checkout failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsServed = async () => {
    if (!selectedTableId || !activeOrderForTable) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/kds?order_id=${activeOrderForTable.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Food marked as served successfully!");

      // Reload active orders
      if (activeSessionId) {
        const ordersRes = await fetch(
          `/api/orders?session_id=${activeSessionId}`,
        );
        const orders = await ordersRes.json();
        if (Array.isArray(orders)) {
          setActiveOrders(orders);
        }
      }
    } catch (err: any) {
      toast.error(`Failed to mark as served: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !debouncedSearch.trim() ||
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      if (debouncedSearch.trim()) {
        return matchesSearch;
      }
      if (activeCategory === "all") return matchesSearch;
      return p.category_id === activeCategory && matchesSearch;
    });
  }, [products, activeCategory, debouncedSearch]);

  const hasServedItems = useMemo(() => {
    return cart.some((item) => item.isServed);
  }, [cart]);

  const hasUnservedItems = useMemo(() => {
    if (cart.length === 0) return false;
    return cart.some((item) => !item.isServed);
  }, [cart]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-[#F9F5F2]" />
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Middle/Left Column: Floor map & Menu Selector */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden pr-2">
        {/* Table & Floor Selector */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-xl shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Restaurant Floor Plan
            </h3>
            <span className="text-[10px] text-[#F9F5F2] font-semibold px-2.5 py-1 rounded bg-[#F9F5F2]/10 border border-[#F9F5F2]/20">
              Waiter Active Session
            </span>
          </div>

          {/* Floor tabs */}
          {floors.length > 0 && (
            <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar border-b border-zinc-800">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => {
                    setSelectedFloorId(floor.id);
                    // Select first table on this floor automatically
                    const firstTable = dbTables.find(
                      (t) => t.floor_id === floor.id,
                    );
                    if (firstTable) {
                      setSelectedTableId(firstTable.id);
                    } else {
                      setSelectedTableId(null);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    selectedFloorId === floor.id
                      ? "bg-[#F9F5F2] text-black border-[#F9F5F2] font-bold shadow-sm"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900"
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto sm:max-w-none pt-2">
            {dbTables
              .filter((t) => t.floor_id === selectedFloorId)
              .map((table) => {
                const status = getTableStatus(table.id);
                const isSelected = selectedTableId === table.id;

                let buttonStyles = "";
                let statusLabelStyles = "";

                if (isSelected) {
                  buttonStyles =
                    "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-lg shadow-[#F9F5F2]/10 font-bold scale-[1.02]";
                  statusLabelStyles = "text-black/70";
                } else if (status.state === "pending") {
                  buttonStyles =
                    "bg-amber-955/20 border-amber-500/50 text-amber-200 hover:border-amber-400";
                  statusLabelStyles = "text-amber-405";
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
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${buttonStyles}`}
                  >
                    <span className="text-lg font-extrabold">
                      {table.table_number}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider ${statusLabelStyles}`}
                    >
                      {status.label}
                    </span>
                  </button>
                );
              })}
            {dbTables.filter((t) => t.floor_id === selectedFloorId).length ===
              0 && (
              <p className="col-span-full text-center text-zinc-500 py-6 text-sm">
                No tables registered on this floor.
              </p>
            )}
          </div>
        </div>

        {/* Menu items Selector */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex-1 space-y-4 shadow-xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Menu Catalog
            </h3>
            <span className="text-[10px] text-zinc-450">
              Tap to add items to cart
            </span>
          </div>

          {/* Search Box on Top */}
          <div className="relative shrink-0">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
              className="w-full rounded-xl border border-zinc-800 pl-4 pr-10 py-2 text-sm outline-none focus:border-[#F9F5F2] transition-colors bg-zinc-950 text-zinc-100 placeholder-zinc-650"
            />
            <Search
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
          </div>

          {/* Category selection and Product grid layout */}
          <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
            {/* Category sidebar */}
            <aside className="flex flex-col gap-2 w-36 shrink-0 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSearch("");
                }}
                className={`rounded-xl px-4 py-3 text-xs font-bold text-left transition-all border cursor-pointer ${
                  activeCategory === "all" && !search
                    ? "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-sm"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2] hover:text-[#F9F5F2]"
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearch("");
                  }}
                  className={`rounded-xl px-4 py-3 text-xs font-bold text-left transition-all border cursor-pointer ${
                    activeCategory === cat.id && !search
                      ? "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-sm"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2] hover:text-[#F9F5F2]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </aside>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto flex-1 content-start pr-1">
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="p-4 bg-zinc-950 border border-zinc-850 hover:border-[#F9F5F2]/50 rounded-xl text-left flex flex-col justify-between cursor-pointer transition-all hover:bg-zinc-900 group overflow-hidden h-[180px]"
                >
                  {prod.image_url && prod.image_url !== "pending-upload" ? (
                    <img
                      src={getProductImageUrl(prod.image_url)}
                      alt={prod.name}
                      className="w-full h-24 shrink-0 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 shrink-0 rounded-lg mb-2 bg-zinc-900 border border-zinc-850 flex items-center justify-center">
                      <ImageOff size={20} className="text-zinc-700" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-xs group-hover:text-[#F9F5F2] transition-colors line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center w-full border-t border-zinc-905 pt-2 mt-2">
                    <span className="text-[#F9F5F2] font-bold text-xs">
                      {formatCurrency(prod.price)}
                    </span>
                    <span className="text-[9px] text-zinc-300 font-bold px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full group-hover:bg-[#F9F5F2] group-hover:text-black transition-colors">
                      + Add
                    </span>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="col-span-full text-center text-zinc-500 py-12 text-sm">
                  No products found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Active Cart and Actions */}
      <div className="lg:col-span-4 flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 overflow-hidden justify-between shadow-2xl">
        {/* Cart Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#F9F5F2]" />
              {dbTableForSelectedId
                ? `Table ${dbTableForSelectedId.table_number}`
                : "No Table Selected"}{" "}
              Order
            </h3>
            {hasUnservedItems && (
              <button
                onClick={clearCart}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold cursor-pointer transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {cart.map((item, index) => {
              const isItemServed = item.isServed || false;

              return (
                <div
                  key={`${item.product.id}-${isItemServed ? "served" : "new"}-${index}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-white truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {formatCurrency(item.product.price)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isItemServed ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-zinc-400 bg-zinc-900/60 border border-zinc-850/80 px-2.5 py-1 rounded-lg select-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"></span>
                        {item.quantity} Served
                      </span>
                    )}

                    {!isItemServed && (
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 cursor-pointer transition-colors ml-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                <p className="text-xs">
                  No items added to this table's cart yet.
                </p>
                <p className="text-[10px] text-zinc-600 max-w-[200px]">
                  Select a table, click on menu items to begin building order.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Total and Action Buttons */}
        <div className="border-t border-zinc-800 pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-450">Subtotal:</span>
            <span className="font-medium text-zinc-300">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-450">Tax:</span>
            <span className="font-medium text-zinc-300">
              {formatCurrency(taxTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-2 mt-1">
            <span className="font-semibold text-zinc-400">Total:</span>
            <span className="font-extrabold text-lg text-white">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="p-3 bg-[#F9F5F2]/5 border border-[#F9F5F2]/15 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#F9F5F2] shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[10px] text-zinc-450 leading-normal">
              <span className="font-semibold text-white">Notice: </span> Waiters
              can only build carts and send drafts to KDS. Checkout and payments
              are restricted to Cashiers.
            </p>
          </div>

          {selectedTableId &&
            getTableStatus(selectedTableId).state === "ready" && (
              <button
                onClick={handleMarkAsServed}
                disabled={actionLoading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-extrabold text-black flex items-center justify-center gap-2 cursor-pointer transition-all mb-3 shadow-lg shadow-emerald-500/10"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" /> Mark as
                    Served
                  </>
                )}
              </button>
            )}

          <div className="flex gap-3">
            {hasUnservedItems && (
              <button
                onClick={handleSendToKds}
                disabled={cart.length === 0 || actionLoading || isSubmitted}
                className="flex-1 h-11 bg-[#F9F5F2] hover:bg-[#e5e1de] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {actionLoading ? (
                  "Sending..."
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Sent!
                  </>
                ) : (
                  "Send to Kitchen"
                )}
              </button>
            )}

            <button
              onClick={() => setShowBillModal(true)}
              disabled={!activeOrderForTable || actionLoading}
              className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              Generate Bill
            </button>
          </div>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {showBillModal && activeOrderForTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-6 text-zinc-150">
            {/* Printable Receipt Container */}
            <div
              id="printable-bill"
              className="space-y-4 p-4 bg-zinc-950 border border-zinc-850 rounded-xl font-mono text-xs text-zinc-300"
            >
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cafe POS Receipt
                </h4>
                <p className="text-[10px] text-zinc-500">Waiter Bill Invoice</p>
              </div>
              <div className="border-t border-zinc-850 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Order:</span>
                  <span className="font-semibold text-white">
                    {activeOrderForTable.order_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Table:</span>
                  <span className="font-semibold text-white">
                    {dbTableForSelectedId
                      ? dbTableForSelectedId.table_number
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>
                    {new Date(activeOrderForTable.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-dashed border-zinc-800 pt-2 space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {activeOrderForTable.order_items?.map((oi: any) => {
                  const prod = products.find((p) => p.id === oi.product_id);
                  const name =
                    prod?.name || oi.products?.name || "Unknown Item";
                  const price = Number(oi.unit_price);
                  return (
                    <div
                      key={oi.id}
                      className="flex justify-between text-[11px]"
                    >
                      <span className="truncate max-w-[180px]">
                        {name} x {oi.quantity}
                      </span>
                      <span>{formatCurrency(price * oi.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-zinc-800 pt-2 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(Number(activeOrderForTable.subtotal))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(Number(activeOrderForTable.tax))}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-zinc-850 pt-1 text-xs text-white">
                  <span>Total Due:</span>
                  <span>
                    {formatCurrency(Number(activeOrderForTable.total))}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Payment Method Selector */}
              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <label className="text-xs font-semibold text-zinc-450">Payment Method</label>
                <div className="flex gap-2">
                  {(["cash", "upi", "card"] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                        paymentMethod === method
                          ? "bg-[#F9F5F2] text-black"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  {actionLoading ? "Processing..." : "Complete Payment & Clear Table"}
                </button>
                <button
                  onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Print Bill - Table ${dbTableForSelectedId?.table_number || ""}</title>
                          <style>
                            body {
                              font-family: monospace;
                              font-size: 12px;
                              color: #000;
                              padding: 20px;
                              max-width: 300px;
                              margin: 0 auto;
                            }
                            .flex { display: flex; justify-content: space-between; }
                            .text-center { text-align: center; }
                            .font-bold { font-weight: bold; }
                            .border-t { border-top: 1px solid #000; }
                            .border-t-dashed { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
                            .space-y-1 > * { margin-bottom: 4px; }
                            .space-y-1.5 > * { margin-bottom: 6px; }
                          </style>
                        </head>
                        <body>
                          <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; text-transform: uppercase;">Cafe POS Bill</h3>
                            <small>Table: ${dbTableForSelectedId?.table_number || ""}</small>
                          </div>
                          <div style="margin-bottom: 10px;">
                            <div class="flex"><span>Order:</span> <span>${activeOrderForTable.order_number}</span></div>
                            <div class="flex"><span>Date:</span> <span>${new Date(activeOrderForTable.created_at).toLocaleString()}</span></div>
                          </div>
                          <div style="border-top: 1px dashed #000; padding: 10px 0;">
                            ${activeOrderForTable.order_items
                              ?.map((oi: any) => {
                                const prod = products.find(
                                  (p) => p.id === oi.product_id,
                                );
                                const name =
                                  prod?.name ||
                                  oi.products?.name ||
                                  "Unknown Item";
                                const price = Number(oi.unit_price);
                                return `<div class="flex"><span>${name} x ${oi.quantity}</span> <span>${formatCurrency(price * oi.quantity)}</span></div>`;
                              })
                              .join("")}
                          </div>
                          <div style="border-top: 1px dashed #000; padding-top: 10px;">
                            <div class="flex"><span>Subtotal:</span> <span>${formatCurrency(Number(activeOrderForTable.subtotal))}</span></div>
                            <div class="flex"><span>Tax:</span> <span>${formatCurrency(Number(activeOrderForTable.tax))}</span></div>
                            <div class="flex font-bold" style="font-size: 14px; margin-top: 5px;"><span>Total:</span> <span>${formatCurrency(Number(activeOrderForTable.total))}</span></div>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                  }
                }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer transition-colors"
              >
                Print Bill Receipt
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                className="w-full py-2.5 bg-[#F9F5F2] hover:bg-[#e5e1de] text-black text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
