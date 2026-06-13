import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Plus, Coffee, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
}

const menuItems: MenuItem[] = [
  { id: 1, name: "Espresso Double", price: 3.50, category: "Hot Coffee", description: "Rich and concentrated shot of espresso.", available: true },
  { id: 2, name: "Caffè Latte", price: 4.50, category: "Hot Coffee", description: "Espresso, steamed milk, and a layer of foam.", available: true },
  { id: 3, name: "Iced Caramel Macchiato", price: 5.00, category: "Cold Coffee", description: "Espresso with milk and sweet caramel drizzle over ice.", available: true },
  { id: 4, name: "Butter Croissant", price: 3.00, category: "Bakery", description: "Flaky, buttery, and freshly baked croissant.", available: true },
  { id: 5, name: "Avocado Toast", price: 8.50, category: "Breakfast", description: "Sourdough bread topped with mashed avocado, cherry tomatoes, and red pepper flakes.", available: true },
  { id: 6, name: "Matcha Latte", price: 4.75, category: "Teas", description: "Japanese ceremonial green tea mixed with creamy steamed milk.", available: false },
];

export default function Menu() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Coffee className="h-8 w-8 text-primary" />
            Menu Management
          </h1>
          <p className="text-muted-foreground mt-1">Add, edit, or toggle availability of menu products.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.id} className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${!item.available ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" /> {item.category}
                </span>
                <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
              </div>
              <CardTitle className="text-xl font-bold mt-2">{item.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center pt-3 border-t">
              <span className={`text-xs font-semibold flex items-center gap-1 ${item.available ? 'text-green-500' : 'text-amber-500'}`}>
                <Sparkles className="h-3 w-3" />
                {item.available ? "In Stock" : "Out of Stock"}
              </span>
              <Button size="sm" variant="outline">Edit</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
