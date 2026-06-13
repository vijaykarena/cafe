import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ClipboardList, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  table: number | string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "completed";
  time: string;
}

const orders: Order[] = [
  {
    id: "#1001",
    table: 4,
    items: [
      { name: "Espresso Double", qty: 2, price: 3.50 },
      { name: "Butter Croissant", qty: 1, price: 3.00 },
    ],
    total: 10.00,
    status: "preparing",
    time: "5 mins ago",
  },
  {
    id: "#1002",
    table: "Takeaway",
    items: [
      { name: "Iced Caramel Macchiato", qty: 1, price: 5.00 },
      { name: "Avocado Toast", qty: 1, price: 8.50 },
    ],
    total: 13.50,
    status: "pending",
    time: "Just now",
  },
  {
    id: "#1003",
    table: 2,
    items: [
      { name: "Caffè Latte", qty: 1, price: 4.50 },
    ],
    total: 4.50,
    status: "completed",
    time: "25 mins ago",
  },
];

export default function Orders() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          Active Orders
        </h1>
        <p className="text-muted-foreground mt-1">Track and manage incoming customer and takeaway orders.</p>
      </div>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Order {order.id}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    order.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : order.status === "preparing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {order.status === "pending" && <AlertCircle className="h-3 w-3" />}
                    {order.status === "preparing" && <Loader2 className="h-3 w-3 animate-spin" />}
                    {order.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {order.status.toUpperCase()}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Table {order.table} • Ordered {order.time}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-primary">${order.total.toFixed(2)}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-2 border-t">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</span>
                <div className="flex flex-col gap-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">
                        {item.qty}x {item.name}
                      </span>
                      <span className="text-muted-foreground">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {order.status === "pending" && (
                  <Button size="sm">Start Preparing</Button>
                )}
                {order.status === "preparing" && (
                  <Button size="sm" variant="secondary">Mark Completed</Button>
                )}
                <Button size="sm" variant="outline">View Receipt</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
