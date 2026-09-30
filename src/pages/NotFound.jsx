import { Link } from 'react-router-dom';
import { Home, Search, ChevronRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-9xl font-light text-gray-100">404</span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
            <Home size={16} strokeWidth={2} />
            Back to Home
          </Link>
          <Link to="/shop" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            Browse Collection
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}