import {
  FiBarChart2,
  FiUsers,
  FiCreditCard,
  FiMail,
  FiSend,
  FiFileText,
  FiArrowLeft,
  FiClock,
  FiMessageSquare,
} from 'react-icons/fi';

/**
 * Admin-Navigation Items
 * Alle labelKeys referenzieren i18n-Schlüssel unter "admin.nav.*"
 */
export const ADMIN_NAV_ITEMS = [
  { path: '/admin', labelKey: 'admin.nav.dashboard', icon: FiBarChart2, end: true },
  { path: '/admin/users', labelKey: 'admin.nav.users', icon: FiUsers },
  { path: '/admin/transactions', labelKey: 'admin.nav.transactions', icon: FiCreditCard },
  { path: '/admin/subscribers', labelKey: 'admin.nav.subscribers', icon: FiMail },
  { path: '/admin/campaigns', labelKey: 'admin.nav.campaigns', icon: FiSend },
  { path: '/admin/feedbacks', labelKey: 'admin.nav.feedbacks', icon: FiMessageSquare },
  { path: '/admin/audit-log', labelKey: 'admin.nav.auditLog', icon: FiFileText },
  { path: '/admin/lifecycle', labelKey: 'admin.nav.lifecycle', icon: FiClock },
];

/**
 * Zurück-zur-App Link
 */
export const ADMIN_BACK_LINK = {
  path: '/dashboard',
  labelKey: 'admin.nav.backToApp',
  icon: FiArrowLeft,
};
