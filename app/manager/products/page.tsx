'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Product, Category } from '@/lib/types';
import { ProductModal } from '@/components/manager/product-modal';
import { DeleteDialog } from '@/components/manager/delete-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Plus, Search, Package, ImageOff } from 'lucide-react';

type AvailabilityFilter = 'all' | 'available' | 'unavailable';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk actions states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load products');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load categories');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).finally(() =>
      setLoading(false)
    );
  }, [fetchProducts, fetchCategories]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(query);
        const categoryName = categoryMap[p.category_id]?.name || '';
        const matchesCategory = categoryName.toLowerCase().includes(query);
        return matchesName || matchesCategory;
      });
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category_id === categoryFilter);
    }

    if (availabilityFilter !== 'all') {
      result = result.filter((p) =>
        availabilityFilter === 'available' ? p.is_available : !p.is_available
      );
    }

    return result;
  }, [products, search, categoryFilter, availabilityFilter, categoryMap]);

  // Keep selectedIds in sync with filtered items
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filtered.some((p) => p.id === id)));
  }, [filtered]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map((p) => p.id));
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
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`);
    if (!confirmDelete) return;

    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/manager/products/${id}`, {
          method: 'DELETE',
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
      
      await fetchProducts();
      setSelectedIds([]);
    } catch {
      toast.error('An error occurred during bulk delete.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length < 2) return;
    const confirmArchive = window.confirm(`Are you sure you want to archive ${selectedIds.length} products?`);
    if (!confirmArchive) return;

    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const id of selectedIds) {
        const product = products.find((p) => p.id === id);
        if (!product) continue;

        const res = await fetch(`/api/manager/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: product.name,
            category_id: product.category_id,
            price: Number(product.price),
            tax: String(product.tax),
            unit_of_measure: product.unit_of_measure,
            is_available: false 
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

      await fetchProducts();
      setSelectedIds([]);
    } catch {
      toast.error('An error occurred during bulk archive.');
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
    fetchProducts();
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
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete product');
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      toast.success('Product deleted');
      setDeleteOpen(false);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAvailabilityToggle = async (product: Product) => {
    const newValue = !product.is_available;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_available: newValue } : p
      )
    );

    try {
      const res = await fetch(`/api/manager/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: product.name,
          category_id: product.category_id,
          price: product.price,
          tax: product.tax,
          unit_of_measure: product.unit_of_measure,
          is_available: newValue 
        }),
      });

      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_available: !newValue } : p
          )
        );
        const data = await res.json();
        toast.error(data.error || 'Failed to update availability');
      } else {
        toast.success(newValue ? 'Product is now available' : 'Product is now unavailable');
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !newValue } : p
        )
      );
      toast.error('Network error');
    }
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

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
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
          onValueChange={(v) => setAvailabilityFilter((v ?? 'all') as AvailabilityFilter)}
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {search || categoryFilter !== 'all' || availabilityFilter !== 'all'
              ? 'No products match your filters'
              : 'No products found'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search || categoryFilter !== 'all' || availabilityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first menu item to get started'}
          </p>
          {!search && categoryFilter === 'all' && availabilityFilter === 'all' && (
            <Button onClick={handleCreate} className="mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-950 text-[#F9F5F2] focus:ring-[#F9F5F2] focus:ring-offset-zinc-900 cursor-pointer h-4 w-4"
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const cat = categoryMap[product.category_id];
                const isSelected = selectedIds.includes(product.id);
                return (
                  <TableRow key={product.id} className={isSelected ? 'bg-zinc-900/50' : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                        className="rounded border-zinc-800 bg-zinc-950 text-[#F9F5F2] focus:ring-[#F9F5F2] focus:ring-offset-zinc-900 cursor-pointer h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>
                      {product.image_url && product.image_url !== 'pending-upload' ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md border bg-muted flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {cat ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5"
                        >
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
                      {formatCurrency(Number(product.price), 'INR', 'en-IN')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.tax}%
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {product.unit_of_measure}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_available}
                          onCheckedChange={() => handleAvailabilityToggle(product)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(product.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
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
