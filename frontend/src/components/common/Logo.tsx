import "../../styles/Logo.css";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = 32, showText = true, className = "" }: LogoProps) => {
  return (
    <div className={`logo-container ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle with Gradient */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
        
        {/* Inner glow */}
        <circle cx="24" cy="24" r="18" fill="url(#innerGlow)" opacity="0.3" />

        {/* Stylized "A" Letter */}
        <path
          d="M24 12L15 36H19.5L21.5 30H26.5L28.5 36H33L24 12ZM22.5 26L24 19L25.5 26H22.5Z"
          fill="white"
        />

        {/* Circuit nodes */}
        <circle cx="12" cy="24" r="2.5" fill="white" opacity="0.9" />
        <circle cx="36" cy="24" r="2.5" fill="white" opacity="0.9" />
        <circle cx="24" cy="12" r="2" fill="white" opacity="0.7" />
        <circle cx="24" cy="36" r="2" fill="white" opacity="0.7" />

        {/* Connecting lines */}
        <path
          d="M14.5 24H20M28 24H33.5"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />

        {/* AI sparkle dots */}
        <circle cx="18" cy="16" r="1" fill="white" opacity="0.6" />
        <circle cx="30" cy="16" r="1" fill="white" opacity="0.6" />
        <circle cx="18" cy="32" r="1" fill="white" opacity="0.6" />
        <circle cx="30" cy="32" r="1" fill="white" opacity="0.6" />

        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4CAF50" />
            <stop offset="0.5" stopColor="#43A047" />
            <stop offset="1" stopColor="#2E7D32" />
          </linearGradient>
          <radialGradient id="innerGlow" cx="24" cy="24" r="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {showText && (
        <span className="logo-text">AskYia</span>
      )}
    </div>
  );
};

export default Logo;