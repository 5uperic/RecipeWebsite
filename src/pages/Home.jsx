import { useState, useEffect } from "react";
import { Clock, DollarSign, Star, Plus, X, Utensils, List, Image, Menu } from "lucide-react";
import DefaultLayout from "../layouts/DefaultLayout";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/recipes");
      
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      
      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeDetails = async (recipeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${recipeId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch recipe details");
      }
      
      const recipe = await response.json();
      setSelectedRecipe(recipe);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching recipe details:", err);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return "---";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPrice = (price) => {
    if (!price) return "---";
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="text-center text-red-600 p-8">
          <p>Error: {error}</p>
          <button
            onClick={fetchRecipes}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center justify-between sm:block">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Recipes</h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <a
            href="/add-recipe"
            className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm sm:text-base ${
              isMobileMenuOpen ? 'flex' : 'hidden sm:flex'
            }`}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Recipe
          </a>
        </div>

        {/* Recipes Grid - Mobile Responsive */}
        {recipes.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-gray-100 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
              <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No recipes yet</h3>
              <p className="text-gray-500 text-sm sm:text-base mb-4">Start by adding your first recipe!</p>
              <a
                href="/add-recipe"
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                Create Recipe
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-200 overflow-hidden hover:shadow-lg sm:hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => fetchRecipeDetails(recipe.id)}
              >
                {/* Image with placeholder */}
                {recipe.picture_path ? (
                  <img
                    src={`http://localhost:5000${recipe.picture_path}`}
                    alt={recipe.name}
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-40 sm:h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <Image className="w-8 h-8 sm:w-10 sm:h-10 mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm">No picture yet</span>
                  </div>
                )}
                
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                    {recipe.name}
                  </h3>
                  
                  {/* Additional Info - Horizontal Layout */}
                  <div className="flex items-center justify-between gap-1 sm:gap-2 text-xs text-gray-500 mb-2 sm:mb-3">
                    {/* Cooking Time */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="hidden xs:inline">{formatTime(recipe.cooking_time)}</span>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="hidden xs:inline">{formatPrice(recipe.estimated_price)}</span>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{recipe.rating || "---"}</span>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400">
                      {new Date(recipe.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recipe Detail Modal - Mobile Responsive */}
        {isModalOpen && selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedRecipe.name}</h2>
                <button
                  onClick={closeModal}
                  className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                {/* Image with placeholder */}
                {selectedRecipe.picture_path ? (
                  <img
                    src={`http://localhost:5000${selectedRecipe.picture_path}`}
                    alt={selectedRecipe.name}
                    className="w-full h-48 sm:h-64 object-cover rounded-lg sm:rounded-xl mb-4 sm:mb-6"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-64 bg-gray-100 rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-gray-400 mb-4 sm:mb-6">
                    <Image className="w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
                    <span className="text-sm sm:text-lg">No picture available</span>
                  </div>
                )}

                {/* Recipe Info - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
                    <p className="font-semibold text-blue-900 text-sm sm:text-base">
                      {formatTime(selectedRecipe.cooking_time)}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-600">Time</p>
                  </div>

                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-1 sm:mb-2" />
                    <p className="font-semibold text-green-900 text-sm sm:text-base">
                      {formatPrice(selectedRecipe.estimated_price)}
                    </p>
                    <p className="text-xs sm:text-sm text-green-600">Cost</p>
                  </div>

                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg text-center">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
                    <div className="flex justify-center gap-1 mb-1">
                      {selectedRecipe.rating ? (
                        [...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              i < selectedRecipe.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-yellow-200"
                            }`}
                          />
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">---</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-yellow-700">Rating</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    Ingredients
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-200 last:border-b-0 text-sm sm:text-base">
                            <span className="font-medium text-gray-900">{ingredient.name}</span>
                            <span className="text-gray-600">
                              {ingredient.amount} {ingredient.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-3 sm:py-4 text-sm sm:text-base">No ingredients listed</p>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                    Instructions
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                      selectedRecipe.steps.map((step, index) => (
                        <div key={index} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                            {step.step_number || index + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{step.instruction}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-3 sm:py-4 text-sm sm:text-base">No instructions available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}