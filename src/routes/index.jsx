import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import ClarityTracker from "../components/ClarityTracker";

import BlogHome from "../pages/Blog/BlogHome";
import Post from "../pages/Blog/Post";

// Admin e páginas secundárias em chunks separados — o leitor do blog não baixa
// editor (TipTap), Firebase, datepicker etc.
const PrivacyPolicy = lazy(() => import("../pages/Blog/PrivacyPolicy"));
const Login = lazy(() => import("../pages/Admin/Login"));
const ForgotPassword = lazy(() => import("../pages/Admin/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/Admin/ResetPassword"));
const Dashboard = lazy(() => import("../pages/Admin/Dashboard"));
const PostsList = lazy(() => import("../pages/Admin/PostsList"));
const CreatePost = lazy(() => import("../pages/Admin/CreatePost"));
const EditPost = lazy(() => import("../pages/Admin/EditPost"));
const Trash = lazy(() => import("../pages/Admin/Trash"));
const Subscribers = lazy(() => import("../pages/Admin/Subscribers"));
const Campaigns = lazy(() => import("../pages/Admin/Campaigns"));
const CampaignEditor = lazy(() => import("../pages/Admin/CampaignEditor"));
const Calendar = lazy(() => import("../pages/Admin/Calendar"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ClarityTracker />
      <Suspense fallback={<div className="min-h-screen" />}>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/blog" />} />
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
          path="/admin/calendar"
          element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/blog" />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
