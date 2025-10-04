import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { categoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  globalDiscount: number;
  createdAt: string;
  updatedAt: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch categories');
      console.error('Fetch categories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      await categoriesAPI.delete(id);
      setCategories(categories.filter(cat => cat._id !== id));
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        <Link
          to="/categories/new"
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full
              pl-10 
              pr-4 
              py-3
              text-sm
              text-gray-900
              placeholder-gray-500
              bg-white
              border-2
              border-gray-200
              rounded-lg
              outline-none
              transition-all
              duration-200
              ease-in-out
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
              hover:border-gray-300
              disabled:bg-gray-50
              disabled:border-gray-200
              disabled:cursor-not-allowed
            "
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {category.image && (
                        <img
                          src={`https://admin.vishalinifireworks.com/${category.image}`}
                          alt={category.name}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500">{category.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 max-w-xs truncate">
                      {category.description || 'No description'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.isActive ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.globalDiscount}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.sortOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/categories/edit/${category._id}`}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(category._id, category.name)}
                        disabled={deleteLoading === category._id}
                        className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50 transition-colors duration-200"
                      >
                        {deleteLoading === category._id ? (
                          <div className="loading-spinner"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'No categories found matching your search.' : 'No categories found.'}
            </p>
            {!searchTerm && (
              <Link
                to="/categories/new"
                className="btn-primary mt-4 inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Category
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;