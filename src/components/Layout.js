import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import styles from './Layout.module.css';

// SVG icon components for sidebar navigation
const Icons = {
  admins: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  stores: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  employees: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  products: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  ),
  stock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  billing: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  report: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M7 15l4-4 4 4 5-7"/>
    </svg>
  ),
  customers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
};

const NAV_CONFIG = {
  super_admin: [
    { label: 'Admins', to: '/super-admin/admins', icon: Icons.admins },
  ],
  admin: [
    { label: 'Stores', to: '/admin/stores', icon: Icons.stores },
    { label: 'Employees', to: '/admin/employees', icon: Icons.employees },
  ],
  employee: [
    { label: 'Products',  to: '/app/products',  icon: Icons.products,  permKey: 'products'  },
    { label: 'Stock',     to: '/app/stock',     icon: Icons.stock,     permKey: 'stock'     },
    { label: 'Billing',   to: '/app/billing',   icon: Icons.billing,   permKey: 'billing'   },
    { label: 'Customers', to: '/app/customers', icon: Icons.customers, permKey: 'customers' },
    { label: 'Report',    to: '/app/report',    icon: Icons.report,    permKey: 'report'    },
  ],
};

export default function Layout() {
  const { user } = useAuth();
  // For employees: hide tabs the admin has disabled via permissions.
  const allLinks = NAV_CONFIG[user?.role] || [];
  const links = user?.role === 'employee'
    ? allLinks.filter((link) => !link.permKey || user.permissions?.[link.permKey] !== false)
    : allLinks;

  // Mobile sidebar drawer (open/closed)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Close sidebar on route change (mobile)
  const handleLinkClick = () => setSidebarOpen(false);

  const sidebarClass = [
    styles.sidebar,
    sidebarOpen ? styles.sidebarOpen : '',
  ].filter(Boolean).join(' ');

  const mainClass = styles.main;

  return (
    <div className={styles.shell}>
      {/* Fixed top navbar */}
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Below navbar: sidebar + main */}
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={sidebarClass}>
          <nav className={styles.nav}>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <span className={styles.navIcon}>{link.icon}</span>
                <span className={styles.navLabel}>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Scrollable main content */}
        <main className={mainClass}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
