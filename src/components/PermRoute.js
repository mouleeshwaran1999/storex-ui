import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Ordered list used to find the first allowed tab when redirecting
const PERM_ORDER = [
  { key: 'products',  to: '/app/products'  },
  { key: 'stock',     to: '/app/stock'     },
  { key: 'billing',   to: '/app/billing'   },
  { key: 'customers', to: '/app/customers' },
  { key: 'report',    to: '/app/report'    },
];

function NoAccessScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 16, color: '#94a3b8',
      textAlign: 'center', padding: '32px',
    }}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
        stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#475569', margin: 0 }}>No Access</h2>
      <p style={{ margin: 0, fontSize: 14, maxWidth: 320 }}>
        None of your tabs are currently enabled. Please contact your administrator to grant access.
      </p>
    </div>
  );
}

/**
 * PermRoute — guards an employee route by checking user.permissions[permKey].
 * - Non-employees and users with no permissions object (old token): always allowed.
 * - Explicitly false: redirects to the first allowed tab.
 * - All tabs false: shows a "no access" message (keeps employee logged in so they can log out).
 */
export default function PermRoute({ permKey, children }) {
  const { user } = useAuth();

  // Only applies to employees with a permissions object
  if (!permKey || user?.role !== 'employee' || !user?.permissions) {
    return children;
  }

  if (user.permissions[permKey] === false) {
    const first = PERM_ORDER.find((p) => user.permissions[p.key] !== false);
    // If another tab is allowed, redirect there
    if (first) return <Navigate to={first.to} replace />;
    // All tabs disabled — show message instead of bouncing to /login
    return <NoAccessScreen />;
  }

  return children;
}
