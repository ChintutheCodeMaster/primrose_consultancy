import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";


import Landing from "./pages/Landing";
import Leads from "./pages/Leads";
import Students from "./pages/Students";
import PastClients from "./pages/PastClients";
import Advisors from "./pages/Advisors";
import PastAdvisors from "./pages/PastAdvisors";
import Agreement from "./pages/Agreement";
import AgreementPreview from "./pages/AgreementPreview";
import AgreementTemplate from "./pages/AgreementTemplate";

import StudentPortalManagement from "./pages/StudentPortalManagement";
import AdvisorPortal from "./pages/AdvisorPortal";
import DidNotContinue from "./pages/DidNotContinue";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import TempExportEmails from "./pages/TempExportEmails";
import TempImportDidNotContinue from "./pages/TempImportDidNotContinue";
import Projects from "./pages/Projects";
import SignedAgreements from "./pages/SignedAgreements";
import AiChat from "./pages/AiChat";
import OnboardingWizard from "./pages/OnboardingWizard";
import Deadlines from "./pages/Deadlines";
import { FollowUpReminderPopup } from "./components/FollowUpReminderPopup";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentHome from "./pages/StudentHome";
import Outcomes from "./pages/Outcomes";
import StudentWorkspace from "./pages/StudentWorkspace";
import ConsultantEssayReview from "./pages/ConsultantEssayReview";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <FollowUpReminderPopup />
        <Routes>
          {/* Public pages - outside PasswordGate */}
          <Route path="/agreement/:studentId" element={<Agreement />} />
          <Route path="/agreement/demo" element={<AgreementPreview />} />
          
          <Route path="/advisor/:advisorId" element={<AdvisorPortal />} />

          {/* Public marketing site */}
          <Route path="/" element={<Landing />} />

          {/* Auth pages (public) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student-facing auth-protected landing */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentHome />
              </ProtectedRoute>
            }
          />

          {/* Consultant / admin app routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Analytics /></ProtectedRoute>} />
          <Route path="/outcomes" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Outcomes /></ProtectedRoute>} />
          <Route path="/leads/:year" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Leads /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Students /></ProtectedRoute>} />
          <Route path="/students/:id/workspace" element={<ProtectedRoute allowedRoles={['consultant', 'admin', 'student']}><StudentWorkspace /></ProtectedRoute>} />
          <Route path="/students/:id/essays" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><ConsultantEssayReview /></ProtectedRoute>} />
          <Route path="/onboarding/new-student" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><OnboardingWizard /></ProtectedRoute>} />
          <Route path="/advisors" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Advisors /></ProtectedRoute>} />
          <Route path="/past-advisors" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><PastAdvisors /></ProtectedRoute>} />
          <Route path="/did-not-continue/:year" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><DidNotContinue /></ProtectedRoute>} />
          <Route path="/agreement-template" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><AgreementTemplate /></ProtectedRoute>} />
          <Route path="/student-portal/:studentId" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><StudentPortalManagement /></ProtectedRoute>} />
          <Route path="/past-clients/:year" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><PastClients /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Projects /></ProtectedRoute>} />
          <Route path="/signed-agreements" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><SignedAgreements /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Settings /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><AiChat /></ProtectedRoute>} />
          <Route path="/deadlines" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><Deadlines /></ProtectedRoute>} />
          <Route path="/temp-export" element={<ProtectedRoute allowedRoles={['admin']}><TempExportEmails /></ProtectedRoute>} />
          <Route path="/temp-import-dnc" element={<ProtectedRoute allowedRoles={['admin']}><TempImportDidNotContinue /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
