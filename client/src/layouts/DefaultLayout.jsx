import Navbar from "../components/Navbar";

export default function DefaultLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* Add padding-top equal to navbar height (e.g., 64px = 16*4) */}
      <main className="flex-1 container mx-auto p-6 pt-24">
        {children}
      </main>
      <footer className="bg-gray-600 text-white text-center py-3 mt-auto">
        © {new Date().getFullYear()} My Recipes
      </footer>
    </div>
  );
}
