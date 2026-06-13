export const productValidation = {
  name: {
    required: "Product name is required",
    maxLength: {
      value: 100,
      message: "Product name must be 100 characters or less",
    },
    minLength: {
      value: 2,
      message: "Product name must be at least 2 characters",
    },
  },
  category_id: { required: "Category is required" },
  price: {
    required: "Price is required",
    min: { value: 0.01, message: "Price must be greater than 0" },
  },
  tax: {
    required: "Tax is required",
    min: { value: 0, message: "Tax cannot be negative" },
  },
  image: { required: "Product image is required" },
  description: {},
  is_available: {},
};

interface ProductInput {
  name?: string;
  category_id?: string;
  price?: number;
  tax?: number;
  image_url?: string;
  description?: string;
  is_available?: boolean;
}

export function validateProductInput(body: ProductInput, requireImage = true) {
  const errors: string[] = [];

  if (!body.name || body.name.trim().length === 0) {
    errors.push("Product name is required");
  } else if (body.name.trim().length < 2) {
    errors.push("Product name must be at least 2 characters");
  } else if (body.name.trim().length > 100) {
    errors.push("Product name must be 100 characters or less");
  }

  if (!body.category_id) {
    errors.push("Category is required");
  }

  if (body.price === undefined || body.price === null) {
    errors.push("Price is required");
  } else if (body.price < 0.01) {
    errors.push("Price must be greater than 0");
  }

  if (body.tax === undefined || body.tax === null) {
    errors.push("Tax is required");
  } else if (typeof body.tax !== 'number') {
    errors.push("Tax must be a number");
  } else if (body.tax < 0) {
    errors.push("Tax cannot be negative");
  }

  if (requireImage && !body.image_url) {
    errors.push("Product image is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
