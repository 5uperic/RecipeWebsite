import { Link, useLocation } from "react-router-dom";
import { ChefHat, Home, Plus } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm z-50">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo/Brand */}
        <Link 
          to="/" 
          className="flex items-center space-x-2 text-2xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ChefHat className="w-8 h-8" />
          <span>My Recipes</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-8">
          <Link 
            to="/" 
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              isActive('/') 
                ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="font-medium">Home</span>
          </Link>
          
          <Link 
            to="/add-recipe" 
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              isActive('/add-recipe') 
                ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Recipe</span>
          </Link>
          
        </div>
      </div>
    </nav>
  );
}