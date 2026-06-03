import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

import Login from "../pages/Admin/Login";
import Dashboard from "../pages/Admin/Dashboard";
import PostsList from "../pages/Admin/PostsList";
import CreatePost from "../pages/Admin/CreatePost";
import EditPost from "../pages/Admin/EditPost";
import Trash from "../pages/Admin/Trash";
import Subscribers from "../pages/Admin/Subscribers";
import Calendar from "../pages/Admin/Calendar";

import BlogHome from "../pages/Blog/BlogHome";
import Post from "../pages/Blog/Post";
import PrivacyPolicy from "../pages/Blog/PrivacyPolicy";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/blog" />} />
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/admin/login" element={<Login />} />

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
          path="/admin/calendar"
          element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/blog" />} />
      </Routes>
    </BrowserRouter>
  );
}
