export const categoryValidation = {
  name: {
    required: 'Category name is required',
    maxLength: { value: 50, message: 'Category name must be 50 characters or less' },
    minLength: { value: 2, message: 'Category name must be at least 2 characters' },
  },
  color: {
    required: 'Color is required',
    pattern: {
      value: /^#[0-9A-Fa-f]{6}$/,
      message: 'Color must be a valid hex color (e.g. #FF5500)',
    },
  },
};

export function validateCategoryInput(body: { name?: string; color?: string }) {
  const errors: string[] = [];

  if (!body.name || body.name.trim().length === 0) {
    errors.push('Category name is required');
  } else if (body.name.trim().length < 2) {
    errors.push('Category name must be at least 2 characters');
  } else if (body.name.trim().length > 50) {
    errors.push('Category name must be 50 characters or less');
  }

  if (!body.color) {
    errors.push('Color is required');
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    errors.push('Color must be a valid hex color (e.g. #FF5500)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
