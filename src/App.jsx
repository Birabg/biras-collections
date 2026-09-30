import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import {
  ADMIN_ROLES,
  BACKOFFICE_ROLES,
  REPORTING_ROLES,
  STOREFRONT_ROLES,
} from './auth/roles';
import { PublicGate, ProtectedGate, RoleGate } from './components/auth/RouteGuards';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { UIProvider } from './context/UIContext';
import { ToastProvider } from './components/ui/Toast';
import StorefrontLayout from './components/layout/StorefrontLayout';
import AdminLayout from './components/admin/AdminLayout';

/* Storefront */
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import Shipping from './pages/Shipping';
import Returns from './pages/Returns';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import StaticPage from './pages/StaticPage';

/* Account (customer) */
import Account from './pages/Account';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';

/* Authentication */
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';

/* Administration */
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminInventory from './pages/admin/Inventory';
import AdminCustomers from './pages/admin/Customers';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

/**
 * Route table.
 *
 * Access control is expressed once, here, as a route tree:
 *   StorefrontLayout  public browsing
 *   PublicGate        signed-out only
 *   ProtectedGate     signed-in (customers and staff)
 *   RoleGate          specific roles, nested under AdminLayout
 *
 * `defaultPath` sends each actor to the surface that matches their role.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ---------------- Public storefront ---------------- */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/faq" element={<FAQ />} />

        {/* Static content */}
        <Route path="/about" element={<StaticPage page="about" />} />
        <Route path="/privacy" element={<StaticPage page="privacy" />} />
        <Route path="/terms" element={<StaticPage page="terms" />} />

        {/* Signed-in only */}
        <Route
          path="/cart"
          element={
            <ProtectedGate>
              <Cart />
            </ProtectedGate>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedGate>
              <Checkout />
            </ProtectedGate>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <ProtectedGate>
              <CheckoutSuccess />
            </ProtectedGate>
          }
        />

        {/*
          Customer account surfaces. Wrapped in a role gate as well as a session
          gate: back-office staff are signed in, but they are not customers and
          should land on /admin, not on a shopper's order history.
        */}
        <Route
          path="/account"
          element={
            <RoleGate roles={STOREFRONT_ROLES}>
              <Account />
            </RoleGate>
          }
        />
        <Route
          path="/account/orders"
          element={
            <RoleGate roles={STOREFRONT_ROLES}>
              <Orders />
            </RoleGate>
          }
        />
        <Route
          path="/account/orders/:id"
          element={
            <RoleGate roles={STOREFRONT_ROLES}>
              <OrderDetails />
            </RoleGate>
          }
        />
        <Route
          path="/account/profile"
          element={
            <RoleGate roles={STOREFRONT_ROLES}>
              <Profile />
            </RoleGate>
          }
        />
        <Route
          path="/account/addresses"
          element={
            <RoleGate roles={STOREFRONT_ROLES}>
              <Addresses />
            </RoleGate>
          }
        />

        {/* Signed-out only */}
        <Route
          path="/login"
          element={
            <PublicGate>
              <Login />
            </PublicGate>
          }
        />
        <Route
          path="/register"
          element={
            <PublicGate>
              <Register />
            </PublicGate>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicGate>
              <ForgotPassword />
            </PublicGate>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicGate>
              <ResetPassword />
            </PublicGate>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ---------------- Administration ---------------- */}
      <Route
        element={
          <RoleGate roles={BACKOFFICE_ROLES}>
            <AdminLayout />
          </RoleGate>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />

        <Route
          path="/admin/orders"
          element={
            <RoleGate roles={BACKOFFICE_ROLES}>
              <AdminOrders />
            </RoleGate>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RoleGate roles={BACKOFFICE_ROLES}>
              <AdminProducts />
            </RoleGate>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RoleGate roles={BACKOFFICE_ROLES}>
              <AdminInventory />
            </RoleGate>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <RoleGate roles={BACKOFFICE_ROLES}>
              <AdminCustomers />
            </RoleGate>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleGate roles={REPORTING_ROLES}>
              <AdminReports />
            </RoleGate>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleGate roles={ADMIN_ROLES}>
              <AdminSettings />
            </RoleGate>
          }
        />
      </Route>

      {/* Legacy/duplicate path safety net */}
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <UIProvider>
                <AppRoutes />
              </UIProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
