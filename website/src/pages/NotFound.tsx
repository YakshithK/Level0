import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="text-center p-8 rounded-xl shadow-lg bg-white max-w-md">
        <div className="text-7xl mb-4" aria-label="Lost Astronaut">🚀</div>
        <h1 className="text-5xl font-extrabold text-blue-600 mb-2">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mb-2">Lost in Space</p>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or has drifted away.</p>
        <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition">Back to Home</a>
      </div>
    </div>
  );
};

export default NotFound;
