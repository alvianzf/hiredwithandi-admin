import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#111111] text-gray-200">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-extrabold text-[#D2FF00] drop-shadow-lg">
          404
        </h1>
        <p className="text-2xl font-semibold opacity-80">
          Oops! Looks like this page got rejected.
        </p>
        <p className="text-lg opacity-60 max-w-md mx-auto">
          We couldn&apos;t find the page you&apos;re looking for, but there are plenty of bright candidates on the dashboard.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-[#D2FF00] hover:bg-[#b8e600] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D2FF00]"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
