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
import Agreement from "./pages/Agreement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Public agreement signing page - outside PasswordGate */}
          <Route path="/agreement/:studentId" element={<Agreement />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PasswordGate><Index /></PasswordGate>} />
          <Route path="/leads" element={<PasswordGate><Leads /></PasswordGate>} />
          <Route path="/students" element={<PasswordGate><Students /></PasswordGate>} />
          <Route path="/advisors" element={<PasswordGate><Advisors /></PasswordGate>} />
          <Route path="/past-clients/:year" element={<PasswordGate><PastClients /></PasswordGate>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
