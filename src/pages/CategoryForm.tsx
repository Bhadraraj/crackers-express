import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { categoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

interface CategoryFormData {
  name: string;
  description: string;
  globalDiscount: number;
  sortOrder: number;
  isActive: boolean;
}

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImage, setExistingImage] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      globalDiscount: 0,
      sortOrder: 0,
      isActive: true
    }
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchCategory();
    }
  }, [isEdit, id]);

  const fetchCategory = async () => {
    try {
      const response = await categoriesAPI.getById(id!);
      const category = response.data;
      
      setValue('name', category.name);
      setValue('description', category.description);
      setValue('globalDiscount', category.globalDiscount);
      setValue('sortOrder', category.sortOrder);
      setValue('isActive', category.isActive);
      
      if (category.image) {
        setExistingImage(category.image);
      }
    } catch (error: any) {
      toast.error('Failed to fetch category');
      navigate('/categories');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
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

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('globalDiscount', data.globalDiscount.toString());
      formData.append('sortOrder', data.sortOrder.toString());
      formData.append('isActive', data.isActive.toString());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEdit) {
        await categoriesAPI.update(id!, formData);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Category created successfully');
      }
      
      navigate('/categories');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} category`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/categories')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update category information' : 'Create a new product category'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                {...register('name', { 
                  required: 'Category name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                type="text"
                className="form-input"
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Global Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Global Discount (%)
              </label>
              <input
                {...register('globalDiscount', { 
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
              {errors.globalDiscount && (
                <p className="mt-1 text-sm text-red-600">{errors.globalDiscount.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="form-textarea"
              placeholder="Enter category description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sort Order */}
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            
            {(imagePreview || existingImage) && (
              <div className="mb-4 relative inline-block">
                <img
                  src={imagePreview || `https://admin.vishalinifireworks.com/${existingImage}`}
                  alt="Category preview"
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
                    Upload category image
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
              onClick={() => navigate('/categories')}
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
                isEdit ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;