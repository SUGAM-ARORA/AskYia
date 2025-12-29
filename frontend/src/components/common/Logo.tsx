import React from "react";
import "./Logo.css";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, showText = true, className = "" }) => {
  return (
    <div className={`logo-container ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
        
        {/* A Letter stylized */}
        <path
          d="M24 14L16 34H20L21.5 30H26.5L28 34H32L24 14ZM22.5 26L24 20L25.5 26H22.5Z"
          fill="white"
        />
        
        {/* Circuit dots */}
        <circle cx="14" cy="24" r="2" fill="white" />
        <circle cx="34" cy="24" r="2" fill="white" />
        <circle cx="24" cy="14" r="2" fill="white" />
        <circle cx="24" cy="34" r="2" fill="white" />
        
        {/* Connecting lines */}
        <path
          d="M16 24H22M26 24H32M24 16V22M24 26V32"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4CAF50" />
            <stop offset="1" stopColor="#2E7D32" />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <span className="logo-text">AskYia</span>
      )}
    </div>
  );
};

export default Logo;