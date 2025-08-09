import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import AuthGuard from "@/components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import AdAccounts from "./pages/AdAccounts";
import AddBalance from "./pages/AddBalance";
import UsersManagement from "./pages/UsersManagement";
import UserAccounts from "./pages/UserAccounts";
import Payments from "./pages/Payments";
import TopUpRequests from "./pages/TopUpRequests";
import TopUpHistory from "./pages/TopUpHistory";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <AuthGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tickets" element={<Tickets />} />
                    <Route path="/ad-accounts" element={<AdAccounts />} />
                    <Route path="/add-balance" element={<AddBalance />} />
                    <Route path="/users-management" element={<UsersManagement />} />
                    <Route path="/user-accounts" element={<UserAccounts />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/top-up-requests" element={<TopUpRequests />} />
                    <Route path="/top-up-history" element={<TopUpHistory />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </AuthGuard>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
