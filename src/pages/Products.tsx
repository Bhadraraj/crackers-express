import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Star,
  Package,
} from "lucide-react";
import { productsAPI, categoriesAPI } from "../services/api";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  price: number;
  discount: number;
  finalPrice: number;
  content: string;
  image: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
  isLowStock: boolean;
}

interface Category {
  _id: string;
  name: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      toast.error("Failed to fetch products");
      console.error("Fetch products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(true);
      setCategories(response.data);
    } catch (error: any) {
      console.error("Fetch categories error:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      await productsAPI.delete(id);
      setProducts(products.filter((product) => product._id !== id));
      toast.success("Product deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your fireworks inventory</p>
        </div>
        <Link to="/products/new" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 w-full"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image ? (
                        <img
                          src={`https://admin.vishalinifireworks.com/${product.image}`}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover mr-3"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 max-w-xs truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.content}
                        </p>
                        {product.isFeatured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        ₹{product.finalPrice}
                      </p>
                      {product.discount > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          ₹{product.price}
                        </p>
                      )}
                      {product.discount > 0 && (
                        <span className="text-xs text-green-600">
                          {product.discount}% off
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`font-medium ${
                          product.isLowStock ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {product.stock}
                      </span>
                      {product.isLowStock && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.isActive ? (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {product.rating}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({product.reviews})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        disabled={deleteLoading === product._id}
                        className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                      >
                        {deleteLoading === product._id ? (
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

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory
                ? "No products found matching your criteria."
                : "No products found."}
            </p>
            {!searchTerm && !selectedCategory && (
              <Link
                to="/products/new"
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
