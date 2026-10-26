// Tailwind CSS v4 through PostCSS. Works with both the webpack build (used for production,
// see package.json) and Turbopack in development.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
