// frontend/src/components/common/LoadingSpinner.tsx
import "../../styles/LoadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "white";
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ 
  size = "md", 
  variant = "primary",
  text,
  fullScreen = false 
}: LoadingSpinnerProps) => {
  const spinner = (
    <div className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className={`loading-spinner spinner-${size} spinner-${variant}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-dot"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;