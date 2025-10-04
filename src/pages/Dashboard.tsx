import React, { useState, useEffect } from 'react';
import { 
  Package, 
  FolderOpen, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Eye,
  Star
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  overview: {
    totalProducts: number;
    totalCategories: number;
    activeProducts: number;
    inactiveProducts: number;
    featuredProducts: number;
    lowStockCount: number;
    totalStock: number;
    averagePrice: number;
  };
  categoryStats: Array<{
    _id: string;
    name: string;
    count: number;
    totalStock: number;
    averagePrice: number;
  }>;
  lowStockProducts: Array<{
    _id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
    category: { name: string };
  }>;
  recentProducts: Array<{
    _id: string;
    name: string;
    price: number;
    finalPrice: number;
    category: { name: string };
    createdAt: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { overview, categoryStats, lowStockProducts, recentProducts } = stats;

  const statCards = [
    {
      title: 'Total Products',
      value: overview.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      change: `${overview.activeProducts} active`
    },
    {
      title: 'Categories',
      value: overview.totalCategories,
      icon: FolderOpen,
      color: 'bg-green-500',
      change: 'All categories'
    },
    {
      title: 'Total Stock',
      value: overview.totalStock,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: `${overview.lowStockCount} low stock`
    },
    {
      title: 'Average Price',
      value: `₹${overview.averagePrice.toFixed(0)}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      change: 'Per product'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your fireworks inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${card.color} rounded-lg p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Statistics */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Category Statistics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {categoryStats.map((category) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">
                      {category.count} products • Stock: {category.totalStock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ₹{category.averagePrice.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">avg price</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alert</h3>
            </div>
          </div>
          <div className="p-6">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{product.stock}</p>
                      <p className="text-sm text-gray-500">
                        threshold: {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No low stock items</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Products</h3>
        </div>
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
                  Final Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProducts.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{product.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    ₹{product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-green-600">₹{product.finalPrice}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;