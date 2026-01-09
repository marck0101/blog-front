import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

import Login from "../pages/Admin/Login";
import PostsList from "../pages/Admin/PostsList";
import CreatePost from "../pages/Admin/CreatePost";
import EditPost from "../pages/Admin/EditPost";
import Trash from "../pages/Admin/Trash";

import BlogHome from "../pages/Blog/BlogHome";
import Post from "../pages/Blog/Post";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/blog" />} />
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:id" element={<Post />} />
        <Route path="/admin/login" element={<Login />} />

        {/* ADMIN */}
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

        <Route path="*" element={<Navigate to="/blog" />} />
      </Routes>
    </BrowserRouter>
  );
}
