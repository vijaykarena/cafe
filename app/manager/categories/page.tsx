'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Category } from '@/lib/types';
import { CategoryModal } from '@/components/manager/category-modal';
import { DeleteDialog } from '@/components/manager/delete-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { MoreHorizontal, Plus, Search, FolderOpen } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/manager/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const handleCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleCategorySuccess = (updated: Category) => {
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } else {
      setCategories((prev) => [...prev, updated]);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/manager/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete category');
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      toast.success('Category deleted');
      setDeleteOpen(false);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize your menu items into categories with color labels
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {search ? 'No categories match your search' : 'No categories found'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search
              ? 'Try a different search term'
              : 'Create your first category to get started'}
          </p>
          {!search && (
            <Button onClick={handleCreate} className="mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(category.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(category)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
        onSuccess={handleCategorySuccess}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Category"
        description="Deleting category may affect linked products. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
