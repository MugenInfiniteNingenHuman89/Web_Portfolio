// main.js
import './style.css'; // Tailwind + CSS kustom (di-build lewat PostCSS, bukan CDN)
import Alpine from 'alpinejs';
import { portfolioMenu } from './menu.js';

Alpine.data('portfolioMenu', portfolioMenu);
window.Alpine = Alpine;
Alpine.start();
