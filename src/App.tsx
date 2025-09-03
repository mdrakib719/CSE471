import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Clubs from "./pages/Clubs";
import Events from "./pages/Events";
import Forum from "./pages/Forum";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
// import UserDashboard from "./pages/Profile";
import Chat from "./pages/Chat";
import Chat2 from "./pages/Chat2";
import JoinClub from "./pages/JoinClub";
import ClubDetails from "./pages/ClubDetails";
import ClubDashboard from "./pages/ClubDashboard";
import EventsManagement from "./pages/EventsManagement";
import EventRegistration from "./pages/EventRegistration";
import Resources from "./pages/Resources";
import LearnMore from "./pages/LearnMore";

import SocialFeed from "./pages/SocialFeed";
import Careers from "./pages/Careers";
import Assistant from "./pages/Assistant";
import LostFound from "./pages/LostFound";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/clubs"
              element={
                <ProtectedRoute>
                  <Clubs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources"
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/careers"
              element={
                <ProtectedRoute>
                  <Careers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <Assistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lost-found"
              element={
                <ProtectedRoute>
                  <LostFound />
                </ProtectedRoute>
              }
            />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat2"
              element={
                <ProtectedRoute>
                  <Chat2 />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/club-dashboard"
              element={
                <ProtectedRoute>
                  <ClubDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events-management"
              element={
                <ProtectedRoute>
                  <EventsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-club/:id"
              element={
                <ProtectedRoute>
                  <JoinClub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event-registration/:id"
              element={
                <ProtectedRoute>
                  <EventRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club-details/:id"
              element={
                <ProtectedRoute>
                  <ClubDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social-feed"
              element={
                <ProtectedRoute>
                  <SocialFeed />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
