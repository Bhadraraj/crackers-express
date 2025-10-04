import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import logo from "../images/logo.png";
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Categories", href: "/categories", icon: FolderOpen },
    { name: "Products", href: "/products", icon: Package },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg">
              {/* <Sparkles className="h-6 w-6" /> */}
              <img src={logo} alt="" className="h-6 w-6" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">
                Vishalini
              </h1>{" "}
              <p className="text-xs text-gray-600">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`${
                  isActiveLink(item.href)
                    ? "bg-orange-100 text-orange-700 border-r-2 border-orange-500"
                    : "text-gray-700 hover:bg-gray-100"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <item.icon
                  className={`${
                    isActiveLink(item.href)
                      ? "text-orange-500"
                      : "text-gray-400"
                  } mr-3 h-5 w-5`}
                />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="bg-gray-200 rounded-full p-2">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.username}
              </p>
              <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Vishalini Fireworks Admin
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
