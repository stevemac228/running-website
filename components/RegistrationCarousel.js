import { useState } from "react";
import UpcomingRegistrationCard from "./UpcomingRegistrationCard";

export default function RegistrationCarousel({ races }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 3;
  const totalCards = races.length;
  const maxIndex = Math.max(0, totalCards - cardsPerView);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <div className="registration-carousel-container">
      <button
        className="carousel-nav-btn carousel-nav-prev"
        onClick={handlePrevious}
        disabled={currentIndex === 0}
        aria-label="Previous cards"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="registration-carousel-viewport">
        <div
          className="registration-carousel-track"
          style={{
            transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
          }}
        >
          {races.map((race, index) => (
            <div key={race.id || index} className="registration-carousel-item">
              <UpcomingRegistrationCard race={race} />
            </div>
          ))}
        </div>
      </div>

      <button
        className="carousel-nav-btn carousel-nav-next"
        onClick={handleNext}
        disabled={currentIndex >= maxIndex}
        aria-label="Next cards"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className="carousel-dots">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
