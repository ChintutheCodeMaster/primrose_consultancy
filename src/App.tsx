import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Leads from "./pages/Leads";
import Students from "./pages/Students";
import PastClients from "./pages/PastClients";
import Advisors from "./pages/Advisors";
import PastAdvisors from "./pages/PastAdvisors";
import Agreement from "./pages/Agreement";
import AgreementPreview from "./pages/AgreementPreview";
import AgreementTemplate from "./pages/AgreementTemplate";
import StudentPortal from "./pages/StudentPortal";
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
import { FollowUpReminderPopup } from "./components/FollowUpReminderPopup";

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
          <Route path="/portal/:studentId" element={<StudentPortal />} />
          <Route path="/advisor/:advisorId" element={<AdvisorPortal />} />
          
          {/* Public marketing site */}
          <Route path="/" element={<Landing />} />

          {/* App routes (authentication temporarily disabled) */}
          <Route path="/app" element={<Index />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leads/:year" element={<Leads />} />
            <Route path="/students" element={<Students />} />
            <Route path="/onboarding/new-student" element={<OnboardingWizard />} />
          <Route path="/advisors" element={<Advisors />} />
          <Route path="/past-advisors" element={<PastAdvisors />} />
          <Route path="/did-not-continue/:year" element={<DidNotContinue />} />
          <Route path="/agreement-template" element={<AgreementTemplate />} />
          <Route path="/student-portal/:studentId" element={<StudentPortalManagement />} />
          <Route path="/past-clients/:year" element={<PastClients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/signed-agreements" element={<SignedAgreements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/temp-export" element={<TempExportEmails />} />
          <Route path="/temp-import-dnc" element={<TempImportDidNotContinue />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
