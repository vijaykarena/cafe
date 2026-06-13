"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Product, Category } from "@/lib/types";
import { getProductImageUrl } from "@/lib/supabase";
import { ProductModal } from "@/components/manager/product-modal";
import { DeleteDialog } from "@/components/manager/delete-dialog";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncer } from "@/hooks/debounce";
import { MoreHorizontal, Plus, Search, Package, ImageOff } from "lucide-react";

type AvailabilityFilter = "all" | "available" | "unavailable";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch, debouncedSearch] = useDebouncer("", 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk actions states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchProducts = useCallback(
    async (p: number, s: string, catF: string, availF: string) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(p),
          limit: String(pageSize),
          search: s,
          category_id: catF,
          availability: availF,
        });
        const res = await fetch(
          `/api/manager/products?${queryParams.toString()}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProducts(data.data || []);
        setTotalItems(data.total || 0);
      } catch (err: any) {
        toast.error(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/manager/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    }
  }, []);

  // Fetch initial categories once
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch products when page, search, or filters change
  useEffect(() => {
    fetchProducts(page, debouncedSearch, categoryFilter, availabilityFilter);
  }, [
    page,
    debouncedSearch,
    categoryFilter,
    availabilityFilter,
    fetchProducts,
  ]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  // Keep selectedIds in sync with visible products
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => products.some((p) => p.id === id)),
    );
  }, [products]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length < 2) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} products?`,
    );
    if (!confirmDelete) return;

    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/manager/products/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} products.`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} products.`);
      }

      setSelectedIds([]);
      const remainingTotal = totalItems - successCount;
      const maxPages = Math.max(Math.ceil(remainingTotal / pageSize), 1);
      if (page > maxPages) {
        setPage(maxPages);
      } else {
        fetchProducts(
          page,
          debouncedSearch,
          categoryFilter,
          availabilityFilter,
        );
      }
    } catch {
      toast.error("An error occurred during bulk delete.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length < 2) return;
    const confirmArchive = window.confirm(
      `Are you sure you want to archive ${selectedIds.length} products?`,
    );
    if (!confirmArchive) return;

    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const id of selectedIds) {
        const product = products.find((p) => p.id === id);
        if (!product) continue;

        const res = await fetch(`/api/manager/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name,
            category_id: product.category_id,
            price: Number(product.price),
            tax: Number(product.tax),
            is_available: false,
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully archived ${successCount} products.`);
      }
      if (failCount > 0) {
        toast.error(`Failed to archive ${failCount} products.`);
      }

      setSelectedIds([]);
      fetchProducts(page, debouncedSearch, categoryFilter, availabilityFilter);
    } catch {
      toast.error("An error occurred during bulk archive.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleProductSuccess = () => {
    fetchProducts(page, debouncedSearch, categoryFilter, availabilityFilter);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/manager/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete product");
        return;
      }

      toast.success("Product deleted");
      setDeleteOpen(false);

      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchProducts(
          page,
          debouncedSearch,
          categoryFilter,
          availabilityFilter,
        );
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAvailabilityToggle = async (product: Product) => {
    const newValue = !product.is_available;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_available: newValue } : p,
      ),
    );

    try {
      const res = await fetch(`/api/manager/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          category_id: product.category_id,
          price: product.price,
          tax: Number(product.tax),
          is_available: newValue,
        }),
      });

      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_available: !newValue } : p,
          ),
        );
        const data = await res.json();
        toast.error(data.error || "Failed to update availability");
      } else {
        toast.success(
          newValue ? "Product is now available" : "Product is now unavailable",
        );
        fetchProducts(
          page,
          debouncedSearch,
          categoryFilter,
          availabilityFilter,
        );
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !newValue } : p,
        ),
      );
      toast.error("Network error");
    }
  };

  const handleCategoryChange = (val: string | null) => {
    setCategoryFilter(val ?? "all");
    setPage(1);
  };

  const handleAvailabilityChange = (val: string | null) => {
    setAvailabilityFilter((val ?? "all") as AvailabilityFilter);
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your menu items, pricing, images, and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length >= 2 && (
            <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                size="sm"
                className="cursor-pointer"
              >
                Delete Selected ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkArchive}
                disabled={bulkLoading}
                size="sm"
                className="cursor-pointer border-zinc-800 hover:bg-zinc-800 hover:text-white"
              >
                Archive Selected ({selectedIds.length})
              </Button>
            </div>
          )}
          <Button onClick={handleCreate} disabled={bulkLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories">
              {(val: string) => {
                if (val === "all" || !val) return "All Categories";
                const cat = categories.find((c) => c.id === val);
                return cat ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                ) : (
                  "All Categories"
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={availabilityFilter}
          onValueChange={handleAvailabilityChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {search || categoryFilter !== "all" || availabilityFilter !== "all"
              ? "No products match your filters"
              : "No products found"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search || categoryFilter !== "all" || availabilityFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first menu item to get started"}
          </p>
          {!search &&
            categoryFilter === "all" &&
            availabilityFilter === "all" && (
              <Button onClick={handleCreate} className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Button>
            )}
        </div>
      ) : (
        <div className="rounded-lg border bg-zinc-950/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 &&
                      selectedIds.length === products.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-950 text-[#F9F5F2] focus:ring-[#F9F5F2] focus:ring-offset-zinc-900 cursor-pointer h-4 w-4"
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tax</TableHead>

                <TableHead>Availability</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const cat = categoryMap[product.category_id];
                const isSelected = selectedIds.includes(product.id);
                return (
                  <TableRow
                    key={product.id}
                    className={isSelected ? "bg-zinc-900/50" : undefined}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectOne(product.id, e.target.checked)
                        }
                        className="rounded border-zinc-800 bg-zinc-950 text-[#F9F5F2] focus:ring-[#F9F5F2] focus:ring-offset-zinc-900 cursor-pointer h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>
                      {product.image_url &&
                        product.image_url !== "pending-upload" ? (
                        <img
                          src={getProductImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md border bg-muted flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <Badge variant="outline" className="gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(product.price), "INR", "en-IN")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.tax}%
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_available}
                          onCheckedChange={() =>
                            handleAvailabilityToggle(product)
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {product.is_available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editingProduct}
        categories={categories}
        onSuccess={handleProductSuccess}
        onCategoriesChanged={fetchCategories}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product"
        description="This product will be removed from product listing but can still exist in historical data."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
