import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Vishalini Fireworks</h2>
            <p className="text-gray-600 mt-2">Admin Panel Login</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
                type="text"
                className="form-input"
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          {/* <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 text-center">
              <strong>Demo Credentials:</strong><br />
              Username: admin<br />
              Password: admin123
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;