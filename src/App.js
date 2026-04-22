import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShopProvider } from './context/ShopContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Login from './pages/Login';
import SuperAdminAdmins from './pages/SuperAdminAdmins';
import AdminStores from './pages/AdminStores';
import AdminEmployees from './pages/AdminEmployees';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Billing from './pages/Billing';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* ShopProvider wraps all authenticated routes — only fetches for employees */}
        <ShopProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Super Admin routes */}
            <Route
              path="/super-admin/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="super_admin">
                    <Layout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="admins" element={<SuperAdminAdmins />} />
              <Route index element={<Navigate to="admins" replace />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="admin">
                    <Layout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="stores" element={<AdminStores />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route index element={<Navigate to="stores" replace />} />
            </Route>

            {/* Employee routes */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="employee">
                    <Layout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="products" element={<Products />} />
              <Route path="stock" element={<Stock />} />
              <Route path="billing" element={<Billing />} />
              <Route index element={<Navigate to="products" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
