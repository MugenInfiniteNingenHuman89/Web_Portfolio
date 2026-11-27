import portfolioData from './data.json';

const RADIUS = 60;

// Gambar yang dipakai animasi hover navbar & kuas: preload sekali supaya
// tidak ada stutter saat pertama kali muncul.
const PRELOAD_IMAGES = [
  './src/assets/brushp.png',
  './src/assets/brush1.png',
  './src/assets/brush2.png',
  './src/assets/brush3.png',
  './src/assets/brush4.png',
];

export function portfolioMenu() {
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  let rafId = null;
  let lastEvent = null;
  let areaRect = null;
  let onResize = null;

  return {
    // =========================================
    // 1. STATE & DATA
    // =========================================
    scene: 'home',
    scenes: ['home', 'profile', 'about', 'skills', 'experience', 'achievements', 'projects', 'contact', 'games'],
    portfolio: portfolioData,
    prevSceneIndex: 0,
    flipDir: 'up',

    hoveredIndex: null,
    itemTransforms: [],
    darkMode: prefersDark,

    activeModal: null,

    loadedScenes: {},
    loadingScenes: {},

    // =========================================
    // 2. COMPUTED / GETTERS
    // =========================================
    get sceneIndex() {
      const idx = this.scenes.indexOf(this.scene);
      return idx === -1 ? 0 : idx;
    },

    get sceneNumber() {
      return `${String(this.sceneIndex).padStart(2, '0')}.`;
    },

    // Konten scene aktif (satu binding saja, bukan 8 x-html terpisah)
    get sceneHtml() {
      if (this.scene === 'home') return '';
      return (
        this.loadedScenes[this.scene] ??
        "<p class='text-sm opacity-60'>Memuat konten...</p>"
      );
    },

    get modalItem() {
      return this.activeModal?.item ?? null;
    },

    get activeAchievement() {
      return this.activeModal?.section === 'achievements'
        ? this.activeModal.item
        : null;
    },

    set activeAchievement(val) {
      if (!val) {
        if (this.activeModal?.section === 'achievements') {
          this.activeModal = null;
        }
        return;
      }
      this.activeModal = { section: 'achievements', item: val };
    },

    // =========================================
    // 3. LIFECYCLE
    // =========================================
    init() {
      this.setupNavTransforms();
      this.applyTheme();

      // Preload semua gambar berat di awal (idle) agar tidak lag saat dipakai
      const preload = () => PRELOAD_IMAGES.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
      if ('requestIdleCallback' in window) requestIdleCallback(preload);
      else setTimeout(preload, 300);

      // Cache ukuran area supaya tidak memanggil getBoundingClientRect tiap mousemove
      onResize = () => { areaRect = null; };
      window.addEventListener('resize', onResize, { passive: true });

      this.$watch('scene', (val) => {
        const nextIdx = this.scenes.indexOf(val);
        const safeNextIdx = nextIdx === -1 ? 0 : nextIdx;

        this.flipDir = safeNextIdx >= this.prevSceneIndex ? 'up' : 'down';
        this.prevSceneIndex = safeNextIdx;
        this.closeModal();

        if (val !== 'home') {
          this.loadScene(val);
        } else {
          this.resetTeks();
        }

        this.$nextTick(() => {
          this.triggerBrushReveal();
          this.triggerSceneReveal();
          this.triggerNumAnim();
        });
      });
    },

    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      if (onResize) window.removeEventListener('resize', onResize);
    },

    toggleTheme() {
      this.darkMode = !this.darkMode;
      this.applyTheme();
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.darkMode);
    },

    // =========================================
    // 4. SCENE NAVIGATION, MODAL & LOADER
    // =========================================
    selectScene(target) {
      if (!this.scenes.includes(target)) return;
      this.scene = target;
    },

    backToHome() {
      this.closeModal();
      this.scene = 'home';
    },

    openModal(section, item) {
      this.activeModal = { section, item };
    },

    closeModal() {
      this.activeModal = null;
    },

    isModalOpen(section = null) {
      if (!this.activeModal) return false;
      if (!section) return true;
      return this.activeModal.section === section;
    },

    async loadScene(name) {
      if (!name || name === 'home') return;
      if (this.loadedScenes[name] || this.loadingScenes[name]) return;

      this.loadingScenes[name] = true;
      try {
        const res = await fetch(`/pages/${name}.html`);
        this.loadedScenes[name] = res.ok
          ? await res.text()
          : "<p class='text-sm opacity-60'>Konten tidak ditemukan.</p>";
      } catch (err) {
        console.error(`Gagal memuat scene "${name}":`, err);
        this.loadedScenes[name] =
          "<p class='text-sm opacity-60'>Gagal memuat konten.</p>";
      } finally {
        this.loadingScenes[name] = false;
      }
    },

    // =========================================
    // 5. NAVBAR 3D & HOVER
    // =========================================
    setupNavTransforms() {
      const navEl = this.$refs.navBar;
      if (!navEl) return;

      const items = [...navEl.children];
      this.itemTransforms = items.map((_, index) => {
        const angle = (index - (items.length - 1) / 2) * 0.10;
        const x = Math.cos(angle) * RADIUS - RADIUS;
        const y = Math.sin(angle) * RADIUS - 20;
        const rot = angle * (90 / Math.PI);
        const scaleValue = 1.6 - (Math.pow(angle, 2) * 4);
        const zValue = -Math.abs(angle) * 120;

        const base = `translate3d(${-x + 30}vh, ${y}px, ${zValue}px) scale(${scaleValue}) rotateY(${rot + 20}deg) rotateZ(${-rot}deg)`;
        const hover = `translate3d(${-x + 34}vh, ${y}px, ${zValue + 20}px) scale(${scaleValue * 1.08}) rotateY(${rot + 20}deg) rotateZ(${-rot}deg)`;

        return { base, hover };
      });
    },

    getItemStyle(index) {
      const t = this.itemTransforms[index];
      if (!t) return {};
      return {
        transformOrigin: 'right center',
        transform: this.hoveredIndex === index ? t.hover : t.base,
      };
    },

    onItemEnter(index) {
      this.hoveredIndex = index;
    },

    onItemLeave() {
      this.hoveredIndex = null;
    },

    // =========================================
    // 6. HOME PARALLAX (CSS variables, tanpa reaktivitas Alpine)
    // =========================================
    onAreaMove(event) {
      if (this.scene !== 'home') return;

      lastEvent = event;
      if (rafId) return; // maksimal 1 update per frame

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const teks = this.$refs.teks;
        const area = this.$refs.areaDiv;
        if (!teks || !area || !lastEvent) return;

        areaRect ??= area.getBoundingClientRect();
        const x = (lastEvent.clientX - areaRect.left) / areaRect.width - 0.5;
        const y = (lastEvent.clientY - areaRect.top) / areaRect.height - 0.5;

        teks.style.setProperty('--px', x.toFixed(3));
        teks.style.setProperty('--py', y.toFixed(3));
      });
    },

    resetTeks() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const teks = this.$refs.teks;
      if (!teks) return;
      teks.style.setProperty('--px', 0);
      teks.style.setProperty('--py', 0);
    },

    // =========================================
    // 7. SCENE ANIMATIONS
    // =========================================
    triggerNumAnim() {
      const el = this.$refs.sceneNum;
      if (!el) return;

      el.classList.remove('animate-scene-change');
      void el.offsetWidth;
      el.classList.add('animate-scene-change');
    },

    triggerBrushReveal() {
      const brush = this.$refs.brushBg;
      if (!brush) return;

      // Sudut acak kecil supaya tiap scene terasa beda
      const rot = (Math.random() * 4 - 2).toFixed(2);
      brush.style.setProperty('--brush-rot', `${rot}deg`);

      brush.classList.remove('is-drawing');
      void brush.offsetWidth;
      brush.classList.add('is-drawing');
    },

    triggerSceneReveal() {
      const wrap = this.$refs.sceneContent;
      if (!wrap) return;

      wrap.classList.remove('is-shown');
      void wrap.offsetWidth;
      wrap.classList.add('is-shown');
    },
  };
}
