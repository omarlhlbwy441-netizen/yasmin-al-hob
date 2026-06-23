import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                yasmin: {
                    50: "#ecfdf5",
                    100: "#d1fae5",
                    200: "#a7f3d0",
                    300: "#6ee7b7",
                    400: "#34d399",
                    500: "#10b981",
                    600: "#059669",
                    700: "#047857",
                    800: "#065f46",
                    900: "#064e3b",
                    950: "#022c22",
                },
                silver: {
                    100: "#f8f9fa",
                    200: "#e9ecef",
                    300: "#dee2e6",
                    400: "#ced4da",
                    500: "#adb5bd",
                    600: "#6c757d",
                    700: "#495057",
                    800: "#343a40",
                    900: "#212529",
                },
                crystal: {
                    light: "rgba(255,255,255,0.1)",
                    DEFAULT: "rgba(255,255,255,0.15)",
                    dark: "rgba(255,255,255,0.05)",
                },
            },
            fontFamily: {
                arabic: ["'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"],
            },
            backgroundImage: {
                "marble": "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)",
                "crystal-gradient": "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                "silver-gradient": "linear-gradient(135deg, #495057 0%, #adb5bd 50%, #f8f9fa 100%)",
            },
            animation: {
                "float": "float 6s ease-in-out infinite",
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "shimmer": "shimmer 2s linear infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(16,185,129,0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(16,185,129,0.6)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};

export default config;
