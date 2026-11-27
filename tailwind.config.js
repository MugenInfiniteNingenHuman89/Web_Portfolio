/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.js',
    './pages/**/*.html',        // fragment scene (kalau ada di root)
    './public/pages/**/*.html', // fragment scene (kalau ada di public/)
  ],
  theme: {
    extend: {
      fontFamily: {
        bogle: ['"BBH Bogle"', 'sans-serif'],
        redaction: ['"Redaction 50"', 'sans-serif'],
        syne: ['"Syne"', 'sans-serif'],
        blackletter: ['"Blackletter Shadow"', 'serif'],
      },
    },
  },
  plugins: [],
};
