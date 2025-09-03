import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-100 via-gray-100 to-indigo-200 p-6">
      {/* Animated Spinner SVG */}
      <div className="mb-8">
        <svg
          className="animate-spin h-20 w-20 text-indigo-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>

      {/* Error Content */}
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-indigo-600 mb-4">404</h1>
        <p className="text-2xl text-gray-700 mb-6">Oops! Jadid Dead.</p>
        <a
          href="/"
          className="px-6 py-3 rounded-2xl bg-indigo-500 text-white text-lg font-medium shadow-md hover:bg-indigo-600 transition"
        >
          Back to Home
        </a>
      </div>
      </div>
    </Layout>
  );
};

export default NotFound;
