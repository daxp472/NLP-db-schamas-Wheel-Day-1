import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicLayout } from './components/common/PublicLayout';
import { Navbar } from './components/common/Navbar';

// Public Marketing Pages
import { LandingPage } from './pages/LandingPage';
import { ProductPage } from './pages/ProductPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { UseCasesPage } from './pages/UseCasesPage';
import { FAQPage } from './pages/FAQPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

// Authentication Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { SettingsPage } from './pages/SettingsPage';

// Studio & Workbench Pages
import { DashboardPage } from './pages/DashboardPage';
import { RequirementWorkspacePage } from './pages/RequirementWorkspacePage';
import { StudioPage } from './pages/StudioPage';
import { ExplorePage } from './pages/ExplorePage';
import { PublicProjectPage } from './pages/PublicProjectPage';
import { CollaborationPage } from './pages/CollaborationPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website Routes (Header + Footer) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/use-cases" element={<UseCasesPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Route>

          {/* Dedicated Public Project Detail Page (Standalone Explorer) */}
          <Route path="/p/:projectId" element={<PublicProjectPage />} />
          <Route path="/projects/public/:projectId" element={<PublicProjectPage />} />

          {/* Dedicated Authentication Flow Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Workbench Shell Layout for Studio Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col font-sans">
                  <Navbar />
                  <div className="flex-1">
                    <DashboardPage />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/collaboration"
            element={
              <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col font-sans">
                <Navbar />
                <div className="flex-1">
                  <CollaborationPage />
                </div>
              </div>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col font-sans">
                  <Navbar />
                  <div className="flex-1">
                    <SettingsPage />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/workspace"
            element={
              <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col font-sans">
                <Navbar />
                <div className="flex-1">
                  <RequirementWorkspacePage />
                </div>
              </div>
            }
          />

          <Route
            path="/studio"
            element={
              <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col font-sans">
                <Navbar />
                <div className="flex-1">
                  <StudioPage />
                </div>
              </div>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
