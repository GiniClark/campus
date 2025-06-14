/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#ffffff",
          "primary-content": "#202225",
          secondary: "#f0f0f0",
          "secondary-content": "#202225",
          accent: "#3b82f6",
          "accent-content": "#ffffff",
          neutral: "#f5f5f5",
          "neutral-content": "#333333",
          "base-100": "#ffffff",
          "base-200": "#f8f9fa",
          "base-300": "#f0f0f0",
          "base-content": "#333333",
          info: "#2563eb",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",

          "--rounded-btn": "0.5rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        dark: {
          primary: "#202225",
          "primary-content": "#ffffff",
          secondary: "#303339",
          "secondary-content": "#f5f5f5",
          accent: "#3b82f6",
          "accent-content": "#ffffff",
          neutral: "#1e1e1e",
          "neutral-content": "#f5f5f5",
          "base-100": "#202225",
          "base-200": "#303339",
          "base-300": "#404349",
          "base-content": "#e6e6e6",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",

          "--rounded-btn": "0.5rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        opensea: {
          primary: "#2081e2",
          "primary-content": "#ffffff",
          secondary: "#353840",
          "secondary-content": "#ffffff",
          accent: "#2081e2",
          "accent-content": "#ffffff",
          neutral: "#202225",
          "neutral-content": "#ffffff",
          "base-100": "#202225",
          "base-200": "#303339",
          "base-300": "#404349",
          "base-content": "#fcfcfc",
          info: "#2081e2",
          success: "#00d18c",
          warning: "#feb240",
          error: "#f25555",

          "--rounded-btn": "0.5rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      colors: {
        opensea: {
          blue: "#2081e2",
          darkBlue: "#1868b7",
          gray: {
            100: "#f8f9fa",
            200: "#e9ecef",
            300: "#dee2e6",
            400: "#ced4da",
            500: "#adb5bd",
            600: "#6c757d",
            700: "#353840",
            800: "#303339",
            900: "#202225",
          },
        },
      },
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
        opensea: "0 4px 8px rgba(0, 0, 0, 0.1)",
        "opensea-hover": "0 8px 16px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "text-fade": "fade 2s infinite",
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) infinite',
      },
      keyframes: {
        fade: {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 1 },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        }
      }
    },
  },
};
