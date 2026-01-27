import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PostsPage } from './features/posts/pages/PostsPage';
import { PostDetailPage } from './features/posts/pages/PostDetailPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">HATEOAS Blog</h1>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<PostsPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
