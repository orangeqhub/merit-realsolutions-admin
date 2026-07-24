import { NavIcons } from "./navIcons";

/**
 * Enterprise sidebar navigation tree.
 * Section headers (Masters, CRM, etc.) have no icon — chevron only.
 * Branch/leaf modules may define `icon`.
 */
export const NAV_TREE = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    end: true,
    icon: NavIcons.dashboard,
  },
  {
    id: "masters",
    label: "Masters",
    children: [
      {
        id: "companies",
        label: "Companies",
        path: "/dashboard/companies",
        icon: NavIcons.companies,
      },
      {
        id: "ventures",
        label: "Ventures",
        icon: NavIcons.ventures,
        children: [
          {
            id: "venture-management",
            label: "Venture Management",
            path: "/dashboard/ventures",
            icon: NavIcons.ventureMgmt,
          },
          {
            id: "layout-management",
            label: "Layout Management",
            path: "/dashboard/layouts",
            icon: NavIcons.layouts,
          },
          {
            id: "plot-inventory",
            label: "Plot Inventory",
            path: "/dashboard/plots",
            icon: NavIcons.plots,
          },
          {
            id: "plot-booking",
            label: "Plot Booking",
            path: "/dashboard/plots",
            icon: NavIcons.plotBooking,
          },
        ],
      },
      {
        id: "properties",
        label: "Properties",
        icon: NavIcons.properties,
        children: [
          {
            id: "property-management",
            label: "Property Management",
            path: "/dashboard/properties",
            icon: NavIcons.properties,
          },
          {
            id: "property-enquiries",
            label: "Property Enquiries",
            path: "/dashboard/property-enquiries",
            icon: NavIcons.leads,
          },
          {
            id: "property-bookings",
            label: "Property Bookings",
            path: "/dashboard/property-bookings",
            icon: NavIcons.bookings,
          },
          {
            id: "property-payments",
            label: "Payment Approvals",
            path: "/dashboard/property-payments",
            icon: NavIcons.payments,
          },
        ],
      },
      {
        id: "user-management",
        label: "User Management",
        icon: NavIcons.customers,
        children: [
          {
            id: "users-all",
            label: "All Users",
            path: "/dashboard/users",
            icon: NavIcons.customers,
          },
          {
            id: "users-abp",
            label: "Area Business Partners",
            path: "/dashboard/users/abp",
            icon: NavIcons.channelPartners,
          },
          {
            id: "users-abc",
            label: "Area Business Coordinators",
            path: "/dashboard/users/abc",
            icon: NavIcons.customers,
          },
          {
            id: "users-abe",
            label: "Area Business Executives",
            path: "/dashboard/users/abe",
            icon: NavIcons.customers,
          },
          {
            id: "users-agents",
            label: "Channel Agents",
            path: "/dashboard/users/agents",
            icon: NavIcons.channelPartners,
          },
          {
            id: "users-customers",
            label: "Customers",
            path: "/dashboard/users/customers",
            icon: NavIcons.customers,
          },
        ],
      },
    ],
  },
  {
    id: "sales-crm",
    label: "Sales CRM",
    children: [
      {
        id: "pcrm-dashboard",
        label: "Dashboard",
        path: "/dashboard/sales-crm",
        end: true,
        icon: NavIcons.dashboard,
      },
      {
        id: "pcrm-area-assignment",
        label: "Area Assignment",
        path: "/dashboard/sales-crm/area-assignment",
        icon: NavIcons.properties,
      },
      {
        id: "pcrm-property-assignment",
        label: "Property Assignment",
        path: "/dashboard/sales-crm/property-assignment",
        icon: NavIcons.properties,
      },
      {
        id: "pcrm-venture-assignment",
        label: "Venture Assignment",
        path: "/dashboard/sales-crm/venture-assignment",
        icon: NavIcons.ventures,
      },
      {
        id: "pcrm-customer-assignment",
        label: "Customer Assignment",
        path: "/dashboard/sales-crm/customer-assignment",
        icon: NavIcons.customers,
      },
      {
        id: "pcrm-leads",
        label: "Leads",
        path: "/dashboard/sales-crm/leads",
        icon: NavIcons.leads,
      },
      {
        id: "pcrm-follow-ups",
        label: "Customer Follow Ups",
        path: "/dashboard/sales-crm/follow-ups",
        icon: NavIcons.followUps,
      },
      {
        id: "pcrm-negotiations",
        label: "Negotiations",
        path: "/dashboard/sales-crm/negotiations",
        icon: NavIcons.plotBooking,
      },
      {
        id: "pcrm-lifecycle-documents",
        label: "Legal Documents",
        path: "/dashboard/sales-crm/documents",
        icon: NavIcons.documents,
      },
      {
        id: "pcrm-meetings",
        label: "Meetings",
        path: "/dashboard/sales-crm/meetings",
        icon: NavIcons.plotBooking,
      },
      {
        id: "pcrm-site-visits",
        label: "Site Visits",
        path: "/dashboard/sales-crm/site-visits",
        icon: NavIcons.plotBooking,
      },
      {
        id: "pcrm-performance",
        label: "Performance",
        path: "/dashboard/sales-crm/performance",
        icon: NavIcons.performanceDashboard,
      },
      {
        id: "pcrm-commission-config",
        label: "Commission Config",
        path: "/dashboard/sales-crm/commission-config",
        icon: NavIcons.performanceDashboard,
      },
      {
        id: "pcrm-notifications",
        label: "Notifications",
        path: "/dashboard/sales-crm/notifications",
        icon: NavIcons.followUps,
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    children: [
      {
        id: "bookings",
        label: "Bookings",
        path: "/dashboard/property-bookings",
        icon: NavIcons.bookings,
      },
      {
        id: "payments",
        label: "Payments",
        path: "/dashboard/payments",
        icon: NavIcons.payments,
      },
      {
        id: "receipts",
        label: "Receipts",
        path: "/dashboard/receipts",
        icon: NavIcons.receipts,
      },
      {
        id: "finance-dashboard",
        label: "Finance Dashboard",
        path: "/dashboard/finance",
        icon: NavIcons.financeReports,
      },
      {
        id: "finance-tracker",
        label: "Payment Tracker",
        path: "/dashboard/finance/tracker",
        icon: NavIcons.payments,
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    children: [
      {
        id: "agreements",
        label: "Agreements",
        path: "/dashboard/documents/agreements",
        icon: NavIcons.agreements,
      },
      {
        id: "registrations",
        label: "Registrations",
        path: "/dashboard/documents/registrations",
        icon: NavIcons.registrations,
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    children: [
      {
        id: "sales-reports",
        label: "Sales Reports",
        path: "/dashboard/reports/sales",
        icon: NavIcons.salesReports,
      },
      {
        id: "inventory-reports",
        label: "Inventory Reports",
        path: "/dashboard/reports/inventory",
        icon: NavIcons.inventoryReports,
      },
      {
        id: "finance-reports",
        label: "Finance Reports",
        path: "/dashboard/reports/finance",
        icon: NavIcons.financeReports,
      },
    ],
  },
  {
    id: "content-management",
    label: "Content Management",
    children: [
      {
        id: "cms-about",
        label: "About Company",
        path: "/dashboard/content/about",
        icon: NavIcons.companies,
      },
      {
        id: "cms-statistics",
        label: "Statistics",
        path: "/dashboard/content/statistics",
        icon: NavIcons.dashboard,
      },
      {
        id: "cms-testimonials",
        label: "Testimonials",
        path: "/dashboard/content/testimonials",
        icon: NavIcons.gallery,
      },
      {
        id: "gallery-management",
        label: "Gallery",
        path: "/dashboard/content/gallery",
        icon: NavIcons.gallery,
      },
      {
        id: "builders-management",
        label: "Builders",
        path: "/dashboard/content/builders",
        icon: NavIcons.companies,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    children: [
      {
        id: "my-profile",
        label: "My Profile",
        path: "/dashboard/profile",
        icon: NavIcons.dashboard,
      },
      {
        id: "change-password",
        label: "Change Password",
        path: "/dashboard/security/change-password",
        icon: NavIcons.dashboard,
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    path: "/dashboard/administration",
    placeholder: true,
  },
];
