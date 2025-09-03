import { useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, setRating, error, setErrors, size = "md" }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10"
  };

  const handleClick = (starValue) => {
    const newRating = rating === starValue ? 0 : starValue;
    setRating(newRating);
    
    // Clear rating error if any
    if (error && setErrors) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.rating;
        return newErrors;
      });
    }
  };

  const handleMouseEnter = (starValue) => {
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = hoverRating ? star <= hoverRating : star <= rating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              className={`transition-transform duration-150 hover:scale-110 ${
                sizeClasses[size]
              } ${
                isFilled 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            >
              <Star className="w-full h-full" />
            </button>
          );
        })}
      </div>
      
      {rating > 0 && (
        <p className="text-sm text-gray-600">
          {rating} {rating === 1 ? 'star' : 'stars'}
        </p>
      )}
      
      {error && (
        <p className="text-red-600 text-xs">{error}</p>
      )}
    </div>
  );
};

export default StarRating;