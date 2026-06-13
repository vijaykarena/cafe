"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CategoryModal } from "@/components/manager/category-modal";
import { Product, Category } from "@/lib/types";
import { getProductImageUrl } from "@/lib/supabase";
import { productValidation } from "@/lib/validations/product";
import { ImagePlus, Loader2, X } from "lucide-react";

interface ProductFormData {
  name: string;
  category_id: string;
  price: string;
  tax: string;
  description: string;
  is_available: boolean;
}

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  onSuccess: () => void;
  onCategoriesChanged: () => void;
}

export function ProductModal({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
  onCategoriesChanged,
}: ProductModalProps) {
  const isEditing = !!product;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      category_id: "",
      price: "",
      tax: "5",
      description: "",
      is_available: true,
    },
  });

  const watchedCategoryId = watch("category_id");
  const watchedAvailable = watch("is_available");

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          category_id: product.category_id,
          price: String(product.price),
          tax: product.tax,
          description: product.description || "",
          is_available: product.is_available,
        });
        setImagePreview(getProductImageUrl(product.image_url) || null);
        setImageFile(null);
      } else {
        reset({
          name: "",
          category_id: categories.length > 0 ? categories[0].id : "",
          price: "",
          tax: "5",
          description: "",
          is_available: true,
        });
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [open, product, categories, reset]);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        toast.error("Invalid file type. Allowed: JPEG, PNG, WebP");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [],
  );

  const removeImage = () => {
    setImageFile(null);
    if (!isEditing) setImagePreview(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!isEditing && !imageFile) {
      toast.error("Product image is required");
      return;
    }

    try {
      if (isEditing) {
        const res = await fetch(`/api/manager/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            category_id: data.category_id,
            price: parseFloat(data.price),
            tax: parseFloat(data.tax),
            description: data.description || null,
            is_available: data.is_available,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          toast.error(result.error || "Failed to update product");
          return;
        }

        if (imageFile) {
          const formData = new FormData();
          formData.append("image", imageFile);
          const imgRes = await fetch(
            `/api/manager/products/${product.id}/image`,
            { method: "POST", body: formData },
          );
          if (!imgRes.ok) {
            const imgErr = await imgRes.json();
            toast.error(imgErr.error || "Image upload failed");
          }
        }

        toast.success("Product updated");
        onSuccess();
        onOpenChange(false);
      } else {
        const createRes = await fetch("/api/manager/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            category_id: data.category_id,
            price: parseFloat(data.price),
            tax: parseFloat(data.tax),
            description: data.description || null,
            image_url: "pending-upload",
            is_available: data.is_available,
          }),
        });

        const created = await createRes.json();
        if (!createRes.ok) {
          toast.error(created.error || "Failed to create product");
          return;
        }

        const formData = new FormData();
        formData.append("image", imageFile!);
        const imgRes = await fetch(
          `/api/manager/products/${created.id}/image`,
          { method: "POST", body: formData },
        );

        if (!imgRes.ok) {
          await fetch(`/api/manager/products/${created.id}`, {
            method: "DELETE",
          });
          const imgErr = await imgRes.json();
          toast.error(
            imgErr.error || "Image upload failed. Product was not created.",
          );
          return;
        }

        toast.success("Product created");
        onSuccess();
        onOpenChange(false);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    onCategoriesChanged();
    setValue("category_id", newCategory.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Product" : "Create Product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                placeholder="e.g. Cappuccino"
                {...register("name", productValidation.name)}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watchedCategoryId}
                onValueChange={(val) => {
                  if (val) setValue("category_id", val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  <Separator className="my-1" />
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm cursor-pointer transition-colors"
                  >
                    + Create Category
                  </button>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("category_id", productValidation.category_id)}
              />
              {errors.category_id && (
                <p className="text-sm text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", productValidation.price)}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-tax">Tax (%)</Label>
                <Input
                  id="product-tax"
                  type="number"
                  step="0.01"
                  placeholder="5"
                  {...register("tax", productValidation.tax)}
                />
                {errors.tax && (
                  <p className="text-sm text-destructive">
                    {errors.tax.message}
                  </p>
                )}
              </div>
            </div>



            <div className="space-y-2">
              <Label htmlFor="product-desc">Description (optional)</Label>
              <Textarea
                id="product-desc"
                placeholder="Brief product description..."
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background border cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors bg-muted/30">
                  <ImagePlus className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                  <span className="text-xs text-muted-foreground/60 mt-1">
                    JPEG, PNG, WebP (max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              {!isEditing && !imageFile && !imagePreview && (
                <p className="text-xs text-muted-foreground">
                  Image is required
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Availability</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {watchedAvailable
                    ? "Visible in POS terminal"
                    : "Hidden from POS terminal"}
                </p>
              </div>
              <Switch
                checked={watchedAvailable}
                onCheckedChange={(checked) => setValue("is_available", checked)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Product"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onSuccess={handleCategoryCreated}
      />
    </>
  );
}
