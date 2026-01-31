import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PasswordGate } from "@/components/auth/PasswordGate";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Public pages - outside PasswordGate */}
          <Route path="/agreement/:studentId" element={<Agreement />} />
          <Route path="/agreement/demo" element={<AgreementPreview />} />
          <Route path="/portal/:studentId" element={<StudentPortal />} />
          <Route path="/advisor/:advisorId" element={<AdvisorPortal />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PasswordGate><Index /></PasswordGate>} />
          <Route path="/analytics" element={<PasswordGate><Analytics /></PasswordGate>} />
          <Route path="/leads" element={<PasswordGate><Leads /></PasswordGate>} />
          <Route path="/students" element={<PasswordGate><Students /></PasswordGate>} />
          <Route path="/advisors" element={<PasswordGate><Advisors /></PasswordGate>} />
          <Route path="/past-advisors" element={<PasswordGate><PastAdvisors /></PasswordGate>} />
          <Route path="/did-not-continue/:year" element={<PasswordGate><DidNotContinue /></PasswordGate>} />
          <Route path="/agreement-template" element={<PasswordGate><AgreementTemplate /></PasswordGate>} />
          <Route path="/student-portal/:studentId" element={<PasswordGate><StudentPortalManagement /></PasswordGate>} />
          <Route path="/past-clients/:year" element={<PasswordGate><PastClients /></PasswordGate>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
