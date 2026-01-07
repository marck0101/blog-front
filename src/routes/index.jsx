import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreatePost from "../pages/Admin/CreatePost";
import PostsList from "../pages/Admin/PostsList";
import BlogHome from "../pages/Blog/BlogHome";
import Post from "../pages/Blog/Post";
import EditPost from "../pages/Admin/EditPost";
import Trash from "../pages/Admin/Trash";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/create-post" element={<CreatePost />} />
        <Route path="/admin/posts" element={<PostsList />} />
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/" element={<BlogHome />} />
        <Route path="/blog/:slug" element={<Post />} />

        <Route path="/admin/posts/:id" element={<EditPost />} />
        <Route path="/admin/trash" element={<Trash />} />

      </Routes>
    </BrowserRouter>
  );
}
