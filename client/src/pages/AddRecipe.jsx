import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Camera, AlertCircle } from "lucide-react";
import DefaultLayout from "../layouts/DefaultLayout";
import StarRating from "../components/StarRating";

export default function AddRecipe() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", amount: "", unit: "" }]);
  const [steps, setSteps] = useState([{ instruction: "" }]);
  const [picture, setPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', 'warning'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [cookingTime, setCookingTime] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [rating, setRating] = useState("");

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
    
    // Clear validation errors for this field
    if (errors[`ingredient_${index}_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`ingredient_${index}_${field}`];
      setErrors(newErrors);
    }
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index].instruction = value;
    setSteps(newSteps);
    
    // Clear validation errors for this field
    if (errors[`step_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`step_${index}`];
      setErrors(newErrors);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
  };

  const addStep = () => {
    setSteps([...steps, { instruction: "" }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
      // Clean up any errors for removed ingredient
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`ingredient_${index}_`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
      // Clean up any errors for removed step
      const newErrors = { ...errors };
      delete newErrors[`step_${index}`];
      setErrors(newErrors);
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("File size must be less than 5MB");
        setMessageType("error");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage("Please select an image file");
        setMessageType("error");
        return;
      }
      
      setPicture(file);
      
      const reader = new FileReader();
      reader.onload = (e) => setPicturePreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Clear any previous error messages
      if (messageType === 'error') {
        setMessage("");
        setMessageType("");
      }
    } else {
      setPicture(null);
      setPicturePreview(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate recipe name
    if (!name.trim()) {
      newErrors.name = "Recipe name is required";
    }
    
    // Validate ingredients
    ingredients.forEach((ingredient, index) => {
      if (!ingredient.name.trim()) {
        newErrors[`ingredient_${index}_name`] = "Ingredient name is required";
      }
      if (!ingredient.amount || parseFloat(ingredient.amount) <= 0) {
        newErrors[`ingredient_${index}_amount`] = "Valid amount is required";
      }
    });
    
    // Validate steps
    steps.forEach((step, index) => {
      if (!step.instruction.trim()) {
        newErrors[`step_${index}`] = "Step instruction is required";
      }
    });

    // Validate cooking time if provided
    if (cookingTime && parseFloat(cookingTime) <= 0) {
      newErrors.cookingTime = "Cooking time must be positive";
    }

    // Validate estimated price if provided
    if (estimatedPrice && parseFloat(estimatedPrice) < 0) {
      newErrors.estimatedPrice = "Price cannot be negative";
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      newErrors.rating = "Rating must be between 1 and 5";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage("Please fix the errors below");
      setMessageType("error");
      return;
    }
    
    setIsSubmitting(true);
    setMessage("");
    setMessageType("");
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("ingredients", JSON.stringify(ingredients.filter(ing => ing.name.trim())));
      formData.append("steps", JSON.stringify(steps.filter(step => step.instruction.trim())));
      
      // Add the new fields
      if (cookingTime) formData.append("cooking_time", cookingTime);
      if (estimatedPrice) formData.append("estimated_price", estimatedPrice);
      if (rating) formData.append("rating", rating);
      
      if (picture) {
        formData.append("picture", picture);
      }

      // Make API call
      const response = await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Recipe "${name}" added successfully! ID: ${result.id}`);
        setMessageType("success");
        
        // Reset form
        setName("");
        setIngredients([{ name: "", amount: "", unit: "" }]);
        setSteps([{ instruction: "" }]);
        setPicture(null);
        setPicturePreview(null);
        setCookingTime("");
        setEstimatedPrice("");
        setRating("");
        setErrors({});
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(result.error || "Failed to add recipe");
      }
    } catch (error) {
      console.error("Error adding recipe:", error);
      
      if (error.message.includes('fetch')) {
        setMessage("Unable to connect to server. Please make sure the server is running on port 5000.");
      } else {
        setMessage(error.message || "Failed to add recipe. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName];
  };

  const hasFieldError = (fieldName) => {
    return !!errors[fieldName];
  };

  return (
    <DefaultLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Add New Recipe</h1>
          <p className="text-lg text-gray-600">Share your culinary creation with the community</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : messageType === 'warning'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : messageType === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Recipe Name */}
            <div className="space-y-3">
              <label className="block text-xl font-semibold text-gray-800">
                Recipe Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    const newErrors = { ...errors };
                    delete newErrors.name;
                    setErrors(newErrors);
                  }
                }}
                className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:outline-none transition-all duration-200 ${
                  hasFieldError('name')
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                placeholder="What's your delicious creation called?"
              />
              {hasFieldError('name') && (
                <p className="text-red-600 text-sm font-medium">{getFieldError('name')}</p>
              )}
            </div>

            {/* Picture Upload */}
            <div className="space-y-4">
              <label className="block text-xl font-semibold text-gray-800">
                Recipe Photo
              </label>
              <div className="flex flex-col items-center">
                {picturePreview ? (
                  <div className="relative">
                    <img 
                      src={picturePreview} 
                      alt="Recipe preview" 
                      className="w-64 h-48 object-cover rounded-xl shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPicture(null);
                        setPicturePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-64 h-48 border-3 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-600 font-medium">Upload Photo</span>
                    <span className="text-sm text-gray-400">JPG, PNG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6">
              <label className="block text-xl font-semibold text-gray-800">
                Additional Information
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cooking Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cooking Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cookingTime}
                    onChange={(e) => {
                      setCookingTime(e.target.value);
                      if (errors.cookingTime) {
                        const newErrors = { ...errors };
                        delete newErrors.cookingTime;
                        setErrors(newErrors);
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                      errors.cookingTime
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    placeholder="e.g., 30"
                  />
                  {errors.cookingTime && (
                    <p className="text-red-600 text-xs">{errors.cookingTime}</p>
                  )}
                </div>

                {/* Estimated Price */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Estimated Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedPrice}
                    onChange={(e) => {
                      setEstimatedPrice(e.target.value);
                      if (errors.estimatedPrice) {
                        const newErrors = { ...errors };
                        delete newErrors.estimatedPrice;
                        setErrors(newErrors);
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                      errors.estimatedPrice
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    placeholder="e.g., 15.99"
                  />
                  {errors.estimatedPrice && (
                    <p className="text-red-600 text-xs">{errors.estimatedPrice}</p>
                  )}
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Rating
                  </label>
                  <StarRating
                    rating={parseInt(rating) || 0}
                    setRating={(newRating) => {
                      setRating(newRating.toString());
                      if (errors.rating) {
                        const newErrors = { ...errors };
                        delete newErrors.rating;
                        setErrors(newErrors);
                      }
                    }}
                    error={errors.rating}
                    setErrors={setErrors}
                    size="lg"
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                All additional fields are optional
              </p>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xl font-semibold text-gray-800">
                  Ingredients *
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </button>
              </div>
              
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1 space-y-2">
                      <input
                        placeholder="e.g., Fresh tomatoes, Olive oil..."
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                        className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                          hasFieldError(`ingredient_${idx}_name`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />
                      {hasFieldError(`ingredient_${idx}_name`) && (
                        <p className="text-red-600 text-xs">{getFieldError(`ingredient_${idx}_name`)}</p>
                      )}
                    </div>
                    <div className="w-28 space-y-2">
                      <input
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={ing.amount}
                        onChange={(e) => handleIngredientChange(idx, "amount", e.target.value)}
                        className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all text-center ${
                          hasFieldError(`ingredient_${idx}_amount`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />
                      {hasFieldError(`ingredient_${idx}_amount`) && (
                        <p className="text-red-600 text-xs">{getFieldError(`ingredient_${idx}_amount`)}</p>
                      )}
                    </div>
                    <div className="w-24">
                      <input
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-center"
                      />
                    </div>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors mt-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xl font-semibold text-gray-800">
                  Instructions *
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>
              
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        placeholder={`Describe step ${idx + 1} in detail...`}
                        value={step.instruction}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all resize-none ${
                          hasFieldError(`step_${idx}`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-300 focus:border-green-500 focus:ring-green-100'
                        }`}
                        rows="3"
                      />
                      {hasFieldError(`step_${idx}`) && (
                        <p className="text-red-600 text-xs">{getFieldError(`step_${idx}`)}</p>
                      )}
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-4 px-8 text-lg font-semibold rounded-xl transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Adding Recipe...
                  </div>
                ) : (
                  'Add Recipe to Collection'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Fields marked with * are required</p>
        </div>
      </div>
    </DefaultLayout>
  );
}