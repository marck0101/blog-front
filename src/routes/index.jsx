import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AnalyticsTracker from "../components/AnalyticsTracker";
import lazyPage from "../utils/lazyPage";

import BlogHome from "../pages/Blog/BlogHome";
import Post from "../pages/Blog/Post";

// Admin e páginas secundárias em chunks separados — o leitor do blog não baixa
// editor (TipTap), Firebase, datepicker etc. lazyPage recarrega se a aba ficou
// com a versão de antes de um deploy.
const PrivacyPolicy = lazyPage(() => import("../pages/Blog/PrivacyPolicy"));
const Login = lazyPage(() => import("../pages/Admin/Login"));
const ForgotPassword = lazyPage(() => import("../pages/Admin/ForgotPassword"));
const ResetPassword = lazyPage(() => import("../pages/Admin/ResetPassword"));
const Dashboard = lazyPage(() => import("../pages/Admin/Dashboard"));
const PostsList = lazyPage(() => import("../pages/Admin/PostsList"));
const CreatePost = lazyPage(() => import("../pages/Admin/CreatePost"));
const EditPost = lazyPage(() => import("../pages/Admin/EditPost"));
const Trash = lazyPage(() => import("../pages/Admin/Trash"));
const Subscribers = lazyPage(() => import("../pages/Admin/Subscribers"));
const Campaigns = lazyPage(() => import("../pages/Admin/Campaigns"));
const CampaignEditor = lazyPage(() => import("../pages/Admin/CampaignEditor"));
const Calendar = lazyPage(() => import("../pages/Admin/Calendar"));
const Metrics = lazyPage(() => import("../pages/Admin/Metrics"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Suspense fallback={<div className="min-h-screen" />}>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/blog" replace />} />
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/posts"
          element={
            <PrivateRoute>
              <PostsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/create-post"
          element={
            <PrivateRoute>
              <CreatePost />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/posts/:id"
          element={
            <PrivateRoute>
              <EditPost />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/trash"
          element={
            <PrivateRoute>
              <Trash />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/subscribers"
          element={
            <PrivateRoute>
              <Subscribers />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/campaigns"
          element={
            <PrivateRoute>
              <Campaigns />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/campaigns/new"
          element={
            <PrivateRoute>
              <CampaignEditor />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/campaigns/:id"
          element={
            <PrivateRoute>
              <CampaignEditor />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/metrics"
          element={
            <PrivateRoute>
              <Metrics />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/calendar"
          element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/blog" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
