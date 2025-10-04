import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, X, Plus, Minus } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  discount: number;
  content: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviews: number;
  sortOrder: number;
}

interface Category {
  _id: string;
  name: string;
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImage, setExistingImage] = useState<string>('');
  const [features, setFeatures] = useState<string[]>(['']);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      discount: 0,
      content: '',
      stock: 0,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      rating: 4.0,
      reviews: 0,
      sortOrder: 0
    }
  });

  const watchPrice = watch('price');
  const watchDiscount = watch('discount');

  useEffect(() => {
    fetchCategories();
    if (isEdit && id) {
      fetchProduct();
    }
  }, [isEdit, id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(true);
      setCategories(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id!);
      const product = response.data;
      
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('category', product.category._id);
      setValue('price', product.price);
      setValue('discount', product.discount);
      setValue('content', product.content);
      setValue('stock', product.stock);
      setValue('lowStockThreshold', product.lowStockThreshold);
      setValue('isActive', product.isActive);
      setValue('isFeatured', product.isFeatured);
      setValue('rating', product.rating);
      setValue('reviews', product.reviews);
      setValue('sortOrder', product.sortOrder);
      
      if (product.features && product.features.length > 0) {
        setFeatures(product.features);
      }
      
      if (product.image) {
        setExistingImage(product.image);
      }
    } catch (error: any) {
      toast.error('Failed to fetch product');
      navigate('/products');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setExistingImage('');
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const calculateFinalPrice = () => {
    const price = watchPrice || 0;
    const discount = watchDiscount || 0;
    return price - (price * discount / 100);
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('price', data.price.toString());
      formData.append('discount', data.discount.toString());
      formData.append('content', data.content);
      formData.append('stock', data.stock.toString());
      formData.append('lowStockThreshold', data.lowStockThreshold.toString());
      formData.append('isActive', data.isActive.toString());
      formData.append('isFeatured', data.isFeatured.toString());
      formData.append('rating', data.rating.toString());
      formData.append('reviews', data.reviews.toString());
      formData.append('sortOrder', data.sortOrder.toString());
      formData.append('features', JSON.stringify(features.filter(f => f.trim())));
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEdit) {
        await productsAPI.update(id!, formData);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(formData);
        toast.success('Product created successfully');
      }
      
      navigate('/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update product information' : 'Create a new fireworks product'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  {...register('name', { 
                    required: 'Product name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="form-select"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="form-textarea"
                placeholder="Enter product description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Content */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content/Package Details
              </label>
              <input
                {...register('content')}
                type="text"
                className="form-input"
                placeholder="e.g., 10 pieces per box"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  {...register('discount', { 
                    min: { value: 0, message: 'Discount cannot be negative' },
                    max: { value: 100, message: 'Discount cannot exceed 100%' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="0"
                />
                {errors.discount && (
                  <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Price (₹)
                </label>
                <div className="form-input bg-gray-50 text-gray-700">
                  ₹{calculateFinalPrice().toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  {...register('stock', { 
                    min: { value: 0, message: 'Stock cannot be negative' }
                  })}
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  {...register('lowStockThreshold', { 
                    min: { value: 0, message: 'Threshold cannot be negative' }
                  })}
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="10"
                />
                {errors.lowStockThreshold && (
                  <p className="mt-1 text-sm text-red-600">{errors.lowStockThreshold.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="form-input flex-1"
                    placeholder="Enter product feature"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-m d"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Feature
              </button>
            </div>
          </div>

          {/* Additional Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <input
                  {...register('rating', { 
                    min: { value: 0, message: 'Rating cannot be negative' },
                    max: { value: 5, message: 'Rating cannot exceed 5' }
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  className="form-input"
                  placeholder="4.0"
                />
                {errors.rating && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reviews Count
                </label>
                <input
                  {...register('reviews', { 
                    min: { value: 0, message: 'Reviews cannot be negative' }
                  })}
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                />
                {errors.reviews && (
                  <p className="mt-1 text-sm text-red-600">{errors.reviews.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  {...register('sortOrder', { 
                    min: { value: 0, message: 'Sort order cannot be negative' }
                  })}
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                />
                {errors.sortOrder && (
                  <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  {...register('isFeatured')}
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Featured product
                </label>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Image</h3>
            
            {(imagePreview || existingImage) && (
              <div className="mb-4 relative inline-block">
                <img
                  src={imagePreview || `https://admin.vishalinifireworks.com/${existingImage}`}
                  alt="Product preview"
                  className="h-32 w-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="image" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload product image
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </span>
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;