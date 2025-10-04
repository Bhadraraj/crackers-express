import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import CategoryForm from './pages/CategoryForm';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <Layout>
                  <Categories />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/categories/new" element={
              <ProtectedRoute>
                <Layout>
                  <CategoryForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/categories/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <CategoryForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/products/new" element={
              <ProtectedRoute>
                <Layout>
                  <ProductForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/products/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ProductForm />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;