import { Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AnalyticsTracker from "../components/AnalyticsTracker";
import ScrollToTop from "../components/ScrollToTop";
import lazyPage from "../utils/lazyPage";

import BlogHome from "../pages/Blog/BlogHome";
import Post from "../pages/Blog/Post";

// Admin e páginas secundárias em chunks separados — o leitor do blog não baixa
// editor (TipTap), Firebase, datepicker etc. lazyPage recarrega se a aba ficou
// com a versão de antes de um deploy.
const PrivacyPolicy = lazyPage(() => import("../pages/Blog/PrivacyPolicy"));
const Seasons = lazyPage(() => import("../pages/Blog/Seasons"));
const SeasonPage = lazyPage(() => import("../pages/Blog/SeasonPage"));
const Favorites = lazyPage(() => import("../pages/Blog/Favorites"));
const Showcase = lazyPage(() => import("../pages/Admin/Showcase"));
const AdminComments = lazyPage(() => import("../pages/Admin/Comments"));
const Audiences = lazyPage(() => import("../pages/Admin/Audiences"));
const AdminSeasons = lazyPage(() => import("../pages/Admin/Seasons"));
const Security = lazyPage(() => import("../pages/Admin/Security"));
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

// Data router: permite useBlocker (aviso de alterações não salvas no editor)
function RootLayout() {
  return (
    <>
      <AnalyticsTracker />
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen" />}>
        <Outlet />
      </Suspense>
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
      <Route element={<RootLayout />}>
        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/blog" replace />} />
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/seasons" element={<Seasons />} />
        <Route path="/seasons/:slug" element={<SeasonPage />} />
        <Route path="/favoritos" element={<Favorites />} />
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

        <Route
          path="/admin/seasons"
          element={
            <PrivateRoute>
              <AdminSeasons />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/showcase"
          element={
            <PrivateRoute>
              <Showcase />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/audiences"
          element={
            <PrivateRoute>
              <Audiences />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/comments"
          element={
            <PrivateRoute>
              <AdminComments />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/security"
          element={
            <PrivateRoute>
              <Security />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/blog" replace />} />
      </Route>
  )
);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
