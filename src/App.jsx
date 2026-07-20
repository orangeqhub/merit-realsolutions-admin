import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import BackendStatusBanner from "./components/feedback/BackendStatusBanner.jsx";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import DashboardLayout from "./layouts/DashboardLayout";
import SetPermanentPassword from "./pages/security/SetPermanentPassword";
import ChangePassword from "./pages/security/ChangePassword";
import AdminProfile from "./pages/profile/AdminProfile";
import ProtectedRoute from "./routes/ProtectedRoute";
import LegacyBookingRedirect from "./routes/LegacyBookingRedirect.jsx";
import { CompaniesLayout } from "./context/CompaniesContext";
import CompanyList from "./pages/companies/CompanyList";
import CompanyDetails from "./pages/companies/CompanyDetails";
import { VenturesLayout } from "./context/VenturesContext";
import VentureDashboard from "./pages/ventures/VentureDashboard";
import VentureList from "./pages/ventures/VentureList";
import VentureForm from "./pages/ventures/VentureForm";
import VentureDetails from "./pages/ventures/VentureDetails";
import { LayoutsLayout } from "./context/LayoutsContext";
import LayoutDashboard from "./pages/layouts/LayoutDashboard";
import LayoutList from "./pages/layouts/LayoutList";
import LayoutForm from "./pages/layouts/LayoutForm";
import LayoutDetails from "./pages/layouts/LayoutDetails";
import { PlotsLayout } from "./context/PlotsContext";
import PlotDashboard from "./pages/plotInventory/PlotDashboard";
import PlotList from "./pages/plotInventory/PlotList";
import PlotForm from "./pages/plotInventory/PlotForm";
import PlotDetails from "./pages/plotInventory/PlotDetails";
import PlotBulkImport from "./pages/plotInventory/PlotBulkImport";
import { PropertiesLayout } from "./context/PropertiesContext";
import PropertyDashboard from "./pages/properties/PropertyDashboard";
import PropertyList from "./pages/properties/PropertyList";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyDetails from "./pages/properties/PropertyDetails";
import PropertyEnquiryList from "./pages/properties/PropertyEnquiryList";
import PropertyBookingList from "./pages/properties/PropertyBookingList";
import PaymentApprovalList from "./pages/properties/PaymentApprovalList";
import PaymentApprovalDetail from "./pages/properties/PaymentApprovalDetail";
import { CustomersLayout } from "./context/CustomersContext";
import CustomerDashboard from "./pages/customers/CustomerDashboard";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import CustomerDetails from "./pages/customers/CustomerDetails";
import { LeadsLayout } from "./context/LeadsContext";
import LeadDashboard from "./pages/leads/LeadDashboard";
import LeadList from "./pages/leads/LeadList";
import LeadPipeline from "./pages/leads/LeadPipeline";
import LeadDetails from "./pages/leads/LeadDetails";
import { FollowUpsLayout } from "./context/FollowUpsContext";
import FollowUpDashboard from "./pages/followups/FollowUpDashboard";
import FollowUpList from "./pages/followups/FollowUpList";
import FollowUpForm from "./pages/followups/FollowUpForm";
import { PaymentsModuleLayout, ReceiptsModuleLayout } from "./layouts/SalesFinanceLayouts.jsx";
import { BookingsLayout } from "./context/BookingsContext";
import { PaymentsLayout } from "./context/PaymentsContext";
import BookingDetails from "./pages/bookings/BookingDetails";
import PaymentDashboard from "./pages/payments/PaymentDashboard";
import PaymentList from "./pages/payments/PaymentList";
import PaymentCollect from "./pages/payments/PaymentCollect";
import PaymentDetails from "./pages/payments/PaymentDetails";
import ReceiptList from "./pages/receipts/ReceiptList";
import ReceiptDetails from "./pages/receipts/ReceiptDetails";
import { AgreementsLayout } from "./context/AgreementsContext";
import AgreementList from "./pages/documents/agreements/AgreementList";
import AgreementForm from "./pages/documents/agreements/AgreementForm";
import AgreementDetails from "./pages/documents/agreements/AgreementDetails";
import { RegistrationsLayout } from "./context/RegistrationsContext";
import RegistrationList from "./pages/documents/registrations/RegistrationList";
import RegistrationDetails from "./pages/documents/registrations/RegistrationDetails";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import SalesReports from "./pages/reports/SalesReports";
import InventoryReports from "./pages/reports/InventoryReports";
import FinanceReports from "./pages/reports/FinanceReports";
import PartnerCrmDashboard from "./pages/partnerCrm/PartnerCrmDashboard";
import PropertyAssignmentPage from "./pages/partnerCrm/PropertyAssignmentPage";
import AreaAssignmentPage from "./pages/partnerCrm/AreaAssignmentPage";
import CommissionConfigPage from "./pages/partnerCrm/CommissionConfigPage";
import VentureAssignmentPage from "./pages/partnerCrm/VentureAssignmentPage";
import CustomerAssignmentPage from "./pages/partnerCrm/CustomerAssignmentPage";
import PartnerLeadsPage from "./pages/partnerCrm/PartnerLeadsPage";
import PartnerFollowUpsPage from "./pages/partnerCrm/PartnerFollowUpsPage";
import LifecycleFollowUpsPage from "./pages/partnerCrm/LifecycleFollowUpsPage";
import LifecycleNegotiationsPage from "./pages/partnerCrm/LifecycleNegotiationsPage";
import LifecycleDocumentsPage from "./pages/partnerCrm/LifecycleDocumentsPage";
import PartnerMeetingsPage from "./pages/partnerCrm/PartnerMeetingsPage";
import SiteVisitWorkflowPage from "./pages/partnerCrm/SiteVisitWorkflowPage";
import PartnerPerformancePage from "./pages/partnerCrm/PartnerPerformancePage";
import SalesTeamProfilePage from "./pages/partnerCrm/SalesTeamProfilePage";
import SalesCustomer360Page from "./pages/partnerCrm/SalesCustomer360Page";
import PartnerNotificationsPage from "./pages/partnerCrm/PartnerNotificationsPage";
import GalleryList from "./pages/gallery/GalleryList";
import GalleryForm from "./pages/gallery/GalleryForm";
import GalleryDetails from "./pages/gallery/GalleryDetails";
import BuilderList from "./pages/builders/BuilderList";
import BuilderForm from "./pages/builders/BuilderForm";
import BuilderDetails from "./pages/builders/BuilderDetails";
import AboutCompanyPage from "./pages/websiteContent/AboutCompanyPage";
import StatisticsListPage from "./pages/websiteContent/StatisticsListPage";
import StatisticsFormPage from "./pages/websiteContent/StatisticsFormPage";
import TestimonialsListPage from "./pages/websiteContent/TestimonialsListPage";
import TestimonialFormPage from "./pages/websiteContent/TestimonialFormPage";
import TestimonialPreviewPage from "./pages/websiteContent/TestimonialPreviewPage";
import UserList from "./pages/users/UserList";
import UserForm from "./pages/users/UserForm";
import UserDetails from "./pages/users/UserDetails";
import { PartnerAssignmentsLayout } from "./context/PartnerAssignmentsContext";

function App() {
  return (
    <BrowserRouter>
      <BackendStatusBanner />
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/set-password" element={<SetPermanentPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PartnerAssignmentsLayout />
            </ProtectedRoute>
          }
        >
          <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="security/change-password" element={<ChangePassword />} />

          <Route path="companies" element={<CompaniesLayout />}>
            <Route index element={<CompanyList />} />
            <Route path=":id" element={<CompanyDetails />} />
          </Route>

          <Route path="ventures" element={<VenturesLayout />}>
            <Route index element={<VentureDashboard />} />
            <Route path="list" element={<VentureList />} />
            <Route path="new" element={<VentureForm />} />
            <Route path=":id/edit" element={<VentureForm />} />
            <Route path=":id" element={<VentureDetails />} />
          </Route>

          <Route path="layouts" element={<LayoutsLayout />}>
            <Route index element={<LayoutDashboard />} />
            <Route path="list" element={<LayoutList />} />
            <Route path="new" element={<LayoutForm />} />
            <Route path=":id/edit" element={<LayoutForm />} />
            <Route path=":id" element={<LayoutDetails />} />
          </Route>

          <Route path="plots" element={<PlotsLayout />}>
            <Route index element={<PlotDashboard />} />
            <Route path="list" element={<PlotList />} />
            <Route path="new" element={<PlotForm />} />
            <Route path="import" element={<PlotBulkImport />} />
            <Route path=":id/edit" element={<PlotForm />} />
            <Route path=":id" element={<PlotDetails />} />
          </Route>

          <Route path="properties" element={<PropertiesLayout />}>
            <Route index element={<PropertyDashboard />} />
            <Route path="list" element={<PropertyList />} />
            <Route path="new" element={<PropertyForm />} />
            <Route path=":id/edit" element={<PropertyForm />} />
            <Route path=":id" element={<PropertyDetails />} />
          </Route>

          <Route path="property-enquiries" element={<PropertyEnquiryList />} />
          <Route path="property-bookings/:id" element={<BookingDetails />} />
          <Route path="property-bookings" element={<PropertyBookingList />} />
          <Route path="property-payments" element={<PaymentApprovalList />} />
          <Route path="property-payments/:id" element={<PaymentApprovalDetail />} />
          <Route path="channel-partners-api" element={<Navigate to="/dashboard/users/abp" replace />} />

          <Route path="users">
            <Route index element={<UserList />} />
            <Route path="new" element={<UserForm />} />
            <Route path="abp" element={<UserList />} />
            <Route path="abc" element={<UserList />} />
            <Route path="abe" element={<UserList />} />
            <Route path="customers" element={<UserList />} />
            <Route path=":id/edit" element={<UserForm />} />
            <Route path=":id" element={<UserDetails />} />
          </Route>

          <Route path="customers" element={<Navigate to="/dashboard/sales-crm/customer-assignment" replace />} />
          <Route path="leads" element={<Navigate to="/dashboard/sales-crm/leads" replace />} />
          <Route path="follow-ups" element={<Navigate to="/dashboard/sales-crm/follow-ups" replace />} />

          <Route path="bookings/*" element={<LegacyBookingRedirect />} />

          <Route path="payments" element={<PaymentsModuleLayout />}>
            <Route index element={<PaymentDashboard />} />
            <Route path="list" element={<PaymentList />} />
            <Route path="collect" element={<PaymentCollect />} />
            <Route path=":id" element={<PaymentDetails />} />
          </Route>

          <Route path="receipts" element={<ReceiptsModuleLayout />}>
            <Route index element={<ReceiptList />} />
            <Route path=":id" element={<ReceiptDetails />} />
          </Route>

          <Route path="documents">
            <Route path="agreements" element={<AgreementsLayout />}>
              <Route index element={<AgreementList />} />
              <Route element={<BookingsLayout />}>
                <Route path="new" element={<AgreementForm />} />
              </Route>
              <Route path=":id" element={<AgreementDetails />} />
            </Route>
            <Route path="registrations" element={<RegistrationsLayout />}>
              <Route index element={<RegistrationList />} />
              <Route path=":id" element={<RegistrationDetails />} />
            </Route>
          </Route>

          <Route path="reports">
            <Route element={<PlotsLayout />}>
              <Route element={<PropertiesLayout />}>
                <Route element={<BookingsLayout />}>
                  <Route element={<PaymentsLayout />}>
                    <Route index element={<ReportsDashboard />} />
                    <Route path="sales" element={<SalesReports />} />
                    <Route path="inventory" element={<InventoryReports />} />
                    <Route path="finance" element={<FinanceReports />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="sales-crm">
            <Route index element={<PartnerCrmDashboard />} />
            <Route path="property-assignment" element={<PropertyAssignmentPage />} />
            <Route path="area-assignment" element={<AreaAssignmentPage />} />
            <Route path="venture-assignment" element={<VentureAssignmentPage />} />
            <Route path="commission-config" element={<CommissionConfigPage />} />
            <Route path="customer-assignment" element={<CustomerAssignmentPage />} />
            <Route path="leads" element={<PartnerLeadsPage />} />
            <Route path="follow-ups" element={<LifecycleFollowUpsPage />} />
            <Route path="lead-follow-ups" element={<PartnerFollowUpsPage />} />
            <Route path="negotiations" element={<LifecycleNegotiationsPage />} />
            <Route path="documents" element={<LifecycleDocumentsPage />} />
            <Route path="meetings" element={<PartnerMeetingsPage />} />
            <Route path="site-visits" element={<SiteVisitWorkflowPage />} />
            <Route path="performance" element={<PartnerPerformancePage />} />
            <Route path="performance/:userId" element={<SalesTeamProfilePage />} />
            <Route path="customers/:customerId" element={<SalesCustomer360Page />} />
            <Route path="notifications" element={<PartnerNotificationsPage />} />
          </Route>

          <Route path="partner-crm">
            <Route index element={<Navigate to="/dashboard/sales-crm" replace />} />
            <Route path="property-assignment" element={<Navigate to="/dashboard/sales-crm/property-assignment" replace />} />
            <Route path="venture-assignment" element={<Navigate to="/dashboard/sales-crm/venture-assignment" replace />} />
            <Route path="customer-assignment" element={<Navigate to="/dashboard/sales-crm/customer-assignment" replace />} />
            <Route path="leads" element={<Navigate to="/dashboard/sales-crm/leads" replace />} />
            <Route path="follow-ups" element={<Navigate to="/dashboard/sales-crm/follow-ups" replace />} />
            <Route path="meetings" element={<Navigate to="/dashboard/sales-crm/meetings" replace />} />
            <Route path="performance" element={<Navigate to="/dashboard/sales-crm/performance" replace />} />
            <Route path="notifications" element={<Navigate to="/dashboard/sales-crm/notifications" replace />} />
            <Route path="applications" element={<Navigate to="/dashboard/users/abp" replace />} />
            <Route path="channel-partners" element={<Navigate to="/dashboard/users/abp" replace />} />
            <Route path="sub-agents" element={<Navigate to="/dashboard/users/abc" replace />} />
          </Route>

          <Route path="partners/*" element={<Navigate to="/dashboard/users/abp" replace />} />
          <Route path="customers/*" element={<Navigate to="/dashboard/sales-crm/customer-assignment" replace />} />
          <Route path="leads/*" element={<Navigate to="/dashboard/sales-crm/leads" replace />} />
          <Route path="follow-ups/*" element={<Navigate to="/dashboard/sales-crm/follow-ups" replace />} />
          <Route path="reservations/*" element={<Navigate to="/dashboard/sales-crm" replace />} />

          <Route path="content/about" element={<AboutCompanyPage />} />

          <Route path="content/statistics">
            <Route index element={<StatisticsListPage />} />
            <Route path="new" element={<StatisticsFormPage />} />
            <Route path=":id/edit" element={<StatisticsFormPage />} />
          </Route>

          <Route path="content/testimonials">
            <Route index element={<TestimonialsListPage />} />
            <Route path="new" element={<TestimonialFormPage />} />
            <Route path=":id/edit" element={<TestimonialFormPage />} />
            <Route path=":id" element={<TestimonialPreviewPage />} />
          </Route>

          <Route path="content/gallery">
            <Route index element={<GalleryList />} />
            <Route path="new" element={<GalleryForm />} />
            <Route path=":id/edit" element={<GalleryForm />} />
            <Route path=":id" element={<GalleryDetails />} />
          </Route>

          <Route path="content/builders">
            <Route index element={<BuilderList />} />
            <Route path="new" element={<BuilderForm />} />
            <Route path=":id/edit" element={<BuilderForm />} />
            <Route path=":id" element={<BuilderDetails />} />
          </Route>

          <Route path=":section" element={<PlaceholderPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
