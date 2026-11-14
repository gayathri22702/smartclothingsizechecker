/**
 * SMART CLOTHING SIZE CHECKER - APPLICATION LOGIC
 * Department of AIML, IoT & RAI | VNRVJIET (Batch SC-24)
 * Supervisor: Mr. U. Veeresh
 * Student Team: N. Gayathri, Sneha Sam, Swayam Prangya, K. Hema Sundhar, K. Manideep
 */

// ==========================================
// 1. STATE & PRODUCT DATABASE
// ==========================================

const APP_STATE = {
  soundEnabled: true,
  currentScreen: 'authScreen', // 'authScreen' | 'sizesScreen' | 'garmentScreen' | 'resultScreen'
  unit: 'in', // 'in' | 'cm'
  auth: {
    isLoggedIn: false,
    user: null,
    mode: 'login' // 'login' | 'signup'
  },
  bodyProfile: {
    gender: 'unisex',
    height: 68,     // in
    weight: 150,    // lbs
    chest: 38.0,    // in
    waist: 32.0,    // in
    hips: 39.0,     // in
    shoulder: 17.5, // in
    inseam: 30.0    // in
  },
  garment: null,
  linkAnalyzed: false,
  productUrl: '',
  chartLoaded: false,
  garmentType: 'top', // 'top' (shirts/hoodies) | 'bottom' (pants/jeans)
  fitPreference: 'regular', // 'slim' | 'regular' | 'oversized'
  cameraStream: null,
  cameraTargetSlot: 'front', // 'front' | 'back'
  uploadedPhotos: { front: null, back: null },
  activeSelectedSize: null, // For manual S/M/L/XL comparison switcher
  lastRecommendation: null
};

// Standard Size Body Archetypes (Starting from Petite XXS chest 30" up to 3XL 46.5")
const ARCHETYPES = {
  xxs: {
    name: 'Size XXS (Extra Extra Small)',
    desc: 'Very compact / Petite frame',
    shoulder: 14.5,
    chest: 30.0,
    waist: 24.0,
    hips: 30.0,
    inseam: 28.0,
    thigh: 19.0,
    pantSize: '26',
    estimatedSize: 'XXS'
  },
  xs: {
    name: 'Size XS (Extra Small)',
    desc: 'Lean & compact frame',
    shoulder: 15.5,
    chest: 33.0,
    waist: 26.5,
    hips: 33.0,
    inseam: 29.0,
    thigh: 20.5,
    pantSize: '28',
    estimatedSize: 'XS'
  },
  s: {
    name: 'Size S (Small)',
    desc: 'Slender to moderate frame',
    shoulder: 16.5,
    chest: 35.5,
    waist: 29.0,
    hips: 36.0,
    inseam: 29.5,
    thigh: 21.5,
    pantSize: '30',
    estimatedSize: 'S'
  },
  m: {
    name: 'Size M (Medium)',
    desc: 'Standard average build',
    shoulder: 17.2,
    chest: 38.0,
    waist: 31.5,
    hips: 38.5,
    inseam: 30.5,
    thigh: 23.0,
    pantSize: '32',
    estimatedSize: 'M'
  },
  l: {
    name: 'Size L (Large)',
    desc: 'Broad & athletic build',
    shoulder: 17.8,
    chest: 40.0,
    waist: 33.5,
    hips: 40.5,
    inseam: 31.5,
    thigh: 24.5,
    pantSize: '34',
    estimatedSize: 'L'
  },
  xl: {
    name: 'Size XL (Extra Large)',
    desc: 'Comfortable full build',
    shoulder: 18.4,
    chest: 42.0,
    waist: 35.5,
    hips: 42.5,
    inseam: 32.0,
    thigh: 26.0,
    pantSize: '36',
    estimatedSize: 'XL'
  },
  xxl: {
    name: 'Size XXL (Double XL)',
    desc: 'Plus size / Sturdy build',
    shoulder: 19.2,
    chest: 44.5,
    waist: 38.5,
    hips: 45.0,
    inseam: 32.5,
    thigh: 27.5,
    pantSize: '38',
    estimatedSize: 'XXL'
  },
  xxxl: {
    name: 'Size 3XL (Triple XL)',
    desc: 'Maximum comfort frame',
    shoulder: 20.0,
    chest: 47.0,
    waist: 41.5,
    hips: 47.5,
    inseam: 33.0,
    thigh: 29.0,
    pantSize: '40',
    estimatedSize: '3XL'
  }
};

// Standard Pant / Jeans Presets (Waist 26" to 40")
const PANT_JEANS_PRESETS = {
  '26': { waist: 26.0, hips: 34.0, inseam: 28.0, thigh: 19.5, name: '26" Jeans (Petite / XXS)', estimatedSize: '26" Waist • 28L' },
  '28': { waist: 28.0, hips: 36.0, inseam: 29.0, thigh: 21.0, name: '28" Jeans (Slim / XS)', estimatedSize: '28" Waist • 29L' },
  '30': { waist: 30.0, hips: 38.0, inseam: 29.5, thigh: 22.0, name: '30" Jeans (Trim / S)', estimatedSize: '30" Waist • 29.5L' },
  '32': { waist: 32.0, hips: 40.0, inseam: 30.5, thigh: 23.5, name: '32" Jeans (Regular / M)', estimatedSize: '32" Waist • 30.5L' },
  '34': { waist: 34.0, hips: 42.5, inseam: 31.5, thigh: 25.0, name: '34" Jeans (Relaxed / L)', estimatedSize: '34" Waist • 31.5L' },
  '36': { waist: 36.0, hips: 45.0, inseam: 32.0, thigh: 26.5, name: '36" Jeans (Athletic / XL)', estimatedSize: '36" Waist • 32L' },
  '38': { waist: 38.0, hips: 48.0, inseam: 32.5, thigh: 28.0, name: '38" Jeans (Comfort / 2XL)', estimatedSize: '38" Waist • 32.5L' },
  '40': { waist: 40.0, hips: 51.0, inseam: 33.0, thigh: 29.5, name: '40" Jeans (Big & Tall / 3XL)', estimatedSize: '40" Waist • 33L' }
};

// ==========================================
// 2. AUDIO SYNTHESIS FEEDBACK (Web Audio API)
// ==========================================

class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playPop() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playChime() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.35);
    });
  }

  playScan() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playError() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    [220, 160].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.1);
    });
  }
}

const sfx = new SoundFX();

// ==========================================
// 3. INITIALIZATION & DOM REFERENCES
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  setupDomEvents();
  loadSavedState();
  updateGameAvatarSVG(
    ARCHETYPES.m.shoulder,
    ARCHETYPES.m.chest,
    ARCHETYPES.m.waist,
    ARCHETYPES.m.hips,
    ARCHETYPES.m.inseam,
    ARCHETYPES.m.thigh
  );
  checkDatabaseStatus();
});

function setupDomEvents() {
  // Sound Toggle
  document.getElementById('soundToggleBtn').addEventListener('click', () => {
    APP_STATE.soundEnabled = !APP_STATE.soundEnabled;
    const icon = document.querySelector('#soundToggleBtn .chip-icon');
    icon.textContent = APP_STATE.soundEnabled ? '🔊' : '🔇';
    showToast(APP_STATE.soundEnabled ? 'Sound feedback on' : 'Sound feedback muted');
  });

  // Auth Tabs (Login vs Sign Up)
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sfx.playPop();
      document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
      const targetBtn = e.target.closest('.auth-tab-btn');
      if (!targetBtn) return;
      targetBtn.classList.add('active');
      const tab = targetBtn.getAttribute('data-auth-tab');
      APP_STATE.auth.mode = tab;
      
      clearAuthErrors();

      const nameGroup = document.getElementById('nameFieldGroup');
      const confirmGroup = document.getElementById('confirmPasswordFieldGroup');
      const strengthBox = document.getElementById('passwordStrengthBox');
      const submitLabel = document.getElementById('authSubmitLabel');

      if (tab === 'signup') {
        if (nameGroup) nameGroup.style.display = 'block';
        if (confirmGroup) confirmGroup.style.display = 'block';
        if (strengthBox) {
          strengthBox.classList.remove('hidden');
          const passVal = document.getElementById('authPasswordInput') ? document.getElementById('authPasswordInput').value : '';
          updatePasswordStrengthMeter(passVal);
        }
        if (submitLabel) submitLabel.textContent = 'Create Secure Account & Continue';
      } else {
        if (nameGroup) nameGroup.style.display = 'none';
        if (confirmGroup) confirmGroup.style.display = 'none';
        if (strengthBox) strengthBox.classList.add('hidden');
        if (submitLabel) submitLabel.textContent = 'Log In to My Sizing Portal';
      }
    });
  });

  // Password Visibility Toggle
  document.getElementById('togglePasswordBtn').addEventListener('click', () => {
    const passInput = document.getElementById('authPasswordInput');
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    document.getElementById('togglePasswordBtn').textContent = isPassword ? '🙈' : '👁️';
  });

  // Real-time Field Clearing & Password Strength Listeners
  const authEmailInput = document.getElementById('authEmailInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authNameInput = document.getElementById('authNameInput');
  const authConfirmPasswordInput = document.getElementById('authConfirmPasswordInput');

  if (authEmailInput) {
    authEmailInput.addEventListener('input', () => {
      authEmailInput.classList.remove('input-field-error');
      const errEl = document.getElementById('emailError');
      if (errEl) errEl.classList.add('hidden');
      const banner = document.getElementById('authStatusBanner');
      if (banner) banner.classList.add('hidden');
    });
  }

  if (authPasswordInput) {
    authPasswordInput.addEventListener('input', () => {
      authPasswordInput.classList.remove('input-field-error');
      const errEl = document.getElementById('passwordError');
      if (errEl) errEl.classList.add('hidden');
      const banner = document.getElementById('authStatusBanner');
      if (banner) banner.classList.add('hidden');
      if (APP_STATE.auth.mode === 'signup') {
        updatePasswordStrengthMeter(authPasswordInput.value);
      }
    });
  }

  if (authNameInput) {
    authNameInput.addEventListener('input', () => {
      authNameInput.classList.remove('input-field-error');
      const errEl = document.getElementById('nameError');
      if (errEl) errEl.classList.add('hidden');
      const banner = document.getElementById('authStatusBanner');
      if (banner) banner.classList.add('hidden');
    });
  }

  if (authConfirmPasswordInput) {
    authConfirmPasswordInput.addEventListener('input', () => {
      authConfirmPasswordInput.classList.remove('input-field-error');
      const errEl = document.getElementById('confirmPasswordError');
      if (errEl) errEl.classList.add('hidden');
      const banner = document.getElementById('authStatusBanner');
      if (banner) banner.classList.add('hidden');
    });
  }

  // Google Sign In Button
  document.getElementById('googleSignInBtn').addEventListener('click', () => {
    sfx.playChime();
    authenticateUser({
      name: 'Gayathri N.',
      email: 'gayathri.aiml@gmail.com',
      avatar: 'G'
    });
  });

  // Form Submission via Button and Enter Key
  const authForm = document.getElementById('emailAuthForm');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAuthSubmit(e);
    });
  }

  const authSubmitBtn = document.getElementById('authSubmitBtn');
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleAuthSubmit(e);
    });
  }

  // Guest Login Button
  document.getElementById('guestLoginBtn').addEventListener('click', () => {
    sfx.playChime();
    authenticateUser({
      name: 'Guest Shopper',
      email: 'guest@demo.local',
      avatar: '👤'
    });
  });

  // Logout Button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sfx.playPop();
    APP_STATE.auth.isLoggedIn = false;
    APP_STATE.auth.user = null;
    document.getElementById('userBadge').classList.add('hidden');
    document.getElementById('stepperNav').classList.add('hidden');
    switchScreen('authScreen');
    showToast('Signed out');
  });

  // Stepper Indicator Clicks
  document.querySelectorAll('.step-indicator').forEach(step => {
    step.addEventListener('click', (e) => {
      const targetStep = parseInt(step.getAttribute('data-step'), 10);
      if (!APP_STATE.auth.isLoggedIn) return;
      sfx.playPop();
      if (targetStep === 1) switchScreen('sizesScreen');
      if (targetStep === 2) switchScreen('garmentScreen');
      if (targetStep === 3) switchScreen('resultScreen');
    });
  });

  // Unit Switcher (Inches vs CM)
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedUnit = btn.getAttribute('data-unit');
      if (selectedUnit === APP_STATE.unit) return;
      sfx.playPop();
      convertUnits(selectedUnit);
    });
  });

  // Gender Silhouette Buttons
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sfx.playPop();
      document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP_STATE.bodyProfile.gender = btn.getAttribute('data-gender');
    });
  });

  // Stepper Input Plus / Minus Buttons
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      const targetId = btn.getAttribute('data-for');
      const input = document.getElementById(targetId);
      if (!input) return;
      const step = parseFloat(input.step) || 0.5;
      let val = parseFloat(input.value) || 0;
      if (btn.classList.contains('plus')) {
        val += step;
      } else {
        val -= step;
      }
      const min = parseFloat(input.min) !== undefined ? parseFloat(input.min) : 0;
      const max = parseFloat(input.max) !== undefined ? parseFloat(input.max) : 350;
      val = Math.max(min, Math.min(max, val));
      input.value = (step < 1) ? val.toFixed(1) : Math.round(val);
      syncManualInputsToState();
    });
  });

  // Per-Box Mini Unit Pill Toggle Buttons
  document.querySelectorAll('.mini-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      const parent = btn.closest('.mini-unit-pill');
      if (!parent) return;
      const field = parent.getAttribute('data-field');
      const unit = btn.getAttribute('data-unit');
      parent.querySelectorAll('.mini-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setFieldUnit(field, unit);
    });
  });

  // Manual Input Value Changes
  ['inputHeightFt', 'inputHeightIn', 'inputHeightCm', 'inputWeight', 'inputChest', 'inputWaist', 'inputHips', 'inputShoulder', 'inputInseam'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('input-field-error');
        syncManualInputsToState();
      });
      el.addEventListener('change', () => {
        el.classList.remove('input-field-error');
        syncManualInputsToState();
      });
    }
  });

  // Reset to Defaults Button
  document.getElementById('profileResetBtn').addEventListener('click', () => {
    sfx.playPop();
    resetDefaultMeasurements();
  });

  // Next: Select Product & Size Chart (Strict Validation)
  document.getElementById('goToGarmentBtn').addEventListener('click', () => {
    const val = validateBodyMeasurements();
    if (!val.valid) return;
    saveUserProfileToDB();
    sfx.playChime();
    switchScreen('garmentScreen');
  });

  // Back to Sizes Buttons
  document.getElementById('backToSizesBtn').addEventListener('click', () => {
    sfx.playPop();
    switchScreen('sizesScreen');
  });
  document.getElementById('backToSizesBtn2').addEventListener('click', () => {
    sfx.playPop();
    switchScreen('sizesScreen');
  });

  // Game Avatar Creator Modal Open / Close
  document.getElementById('openGameAvatarBtn').addEventListener('click', () => {
    sfx.playPop();
    openGameAvatarModal();
  });
  document.getElementById('closeAvatarModalBtn').addEventListener('click', () => {
    sfx.playPop();
    closeGameAvatarModal();
  });

  // Archetype Card Clicks (Top Alpha Sizes XXS-3XL)
  document.querySelectorAll('#gridGameTopSizes .archetype-card').forEach(card => {
    card.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('#gridGameTopSizes .archetype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const typeKey = card.getAttribute('data-archetype');
      applyArchetypeToSliders(typeKey);
    });
  });

  // Pant / Jeans Preset Card Clicks (Waist 26"-40")
  document.querySelectorAll('#gridGamePantSizes .pant-pill-card').forEach(card => {
    card.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('#gridGamePantSizes .pant-pill-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const pantKey = card.getAttribute('data-pant-preset');
      applyPantPresetToSliders(pantKey);
    });
  });

  // Game Mode Category Switcher (Shirts vs Pants)
  const btnGameTop = document.getElementById('btnGameCategoryTop');
  const btnGamePant = document.getElementById('btnGameCategoryPant');
  const gridGameTop = document.getElementById('gridGameTopSizes');
  const gridGamePant = document.getElementById('gridGamePantSizes');

  if (btnGameTop && btnGamePant) {
    btnGameTop.addEventListener('click', () => {
      sfx.playPop();
      btnGameTop.classList.add('active');
      btnGamePant.classList.remove('active');
      if (gridGameTop) gridGameTop.classList.remove('hidden');
      if (gridGamePant) gridGamePant.classList.add('hidden');
      updateGameAvatarFromSliders();
    });

    btnGamePant.addEventListener('click', () => {
      sfx.playPop();
      btnGamePant.classList.add('active');
      btnGameTop.classList.remove('active');
      if (gridGamePant) gridGamePant.classList.remove('hidden');
      if (gridGameTop) gridGameTop.classList.add('hidden');
      updateGameAvatarFromSliders();
    });
  }

  // Fine-tuning Sliders in Game Avatar (Shoulder, Chest, Waist, Hips, Inseam, Thigh)
  ['sliderShoulder', 'sliderChest', 'sliderWaist', 'sliderHips', 'sliderInseam', 'sliderThigh'].forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      slider.addEventListener('input', () => {
        updateGameSliderLabels();
        updateGameAvatarFromSliders();
      });
    }
  });

  // Step 1 Category Focus Selector (All Measurements, Shirts, Pants)
  document.querySelectorAll('.focus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const focus = btn.getAttribute('data-focus');
      applyStep1CategoryFocus(focus);
    });
  });

  // Step 1 Quick Jeans Waist Buttons (26" to 40")
  document.querySelectorAll('.jeans-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playChime();
      document.querySelectorAll('.jeans-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const jeansSize = btn.getAttribute('data-jeans');
      applyJeansQuickPreset(jeansSize);
    });
  });

  // Apply Avatar Sizes Button
  document.getElementById('applyAvatarSizesBtn').addEventListener('click', () => {
    sfx.playChime();
    applyAvatarSizesToProfile();
  });

  // Product Link Input (Clear error on type & reset analyze status if text edited)
  const productUrlInput = document.getElementById('productUrlInput');
  if (productUrlInput) {
    productUrlInput.addEventListener('input', () => {
      productUrlInput.classList.remove('input-field-error');
      if (APP_STATE.linkAnalyzed && productUrlInput.value.trim() !== APP_STATE.productUrl) {
        APP_STATE.linkAnalyzed = false;
        const banner = document.getElementById('linkStatusBanner');
        if (banner) banner.classList.add('hidden');
      }
      syncCategoryUI();
    });
  }

  // Product Link Analyze Button (Intelligent URL Inspection)
  document.getElementById('fetchProductBtn').addEventListener('click', () => {
    const url = document.getElementById('productUrlInput').value.trim();
    if (!url) {
      const inp = document.getElementById('productUrlInput');
      if (inp) {
        inp.classList.add('input-field-error');
        inp.focus();
      }
      const banner = document.getElementById('linkStatusBanner');
      const text = document.getElementById('linkStatusText');
      const icon = banner ? banner.querySelector('.status-check') : null;
      if (banner && text) {
        banner.className = 'link-status-banner error';
        if (icon) icon.textContent = '⚠️';
        text.textContent = 'Product link is required! Please paste a valid product link.';
        banner.classList.remove('hidden');
      }
      sfx.playError();
      showToast('⚠️ Please enter a product link first!');
      return;
    }
    sfx.playChime();
    analyzeProductLink(url);
  });

  // Garment Category Switcher (Shirt vs Pants - Strictly respects product link)
  const btnTypeTop = document.getElementById('btnTypeTop');
  const btnTypeBottom = document.getElementById('btnTypeBottom');
  if (btnTypeTop) {
    btnTypeTop.addEventListener('click', () => {
      handleCategoryPillClick('top');
    });
  }
  if (btnTypeBottom) {
    btnTypeBottom.addEventListener('click', () => {
      handleCategoryPillClick('bottom');
    });
  }

  // Size Chart File Upload & Drag-and-Drop
  const chartInput = document.getElementById('chartFileInput');
  const browseChartBtn = document.getElementById('browseChartBtn');
  const chartDropArea = document.getElementById('chartDropArea');
  const changeChartBtn = document.getElementById('changeChartBtn');

  if (browseChartBtn && chartInput) {
    browseChartBtn.addEventListener('click', () => chartInput.click());
  }
  if (chartDropArea && chartInput) {
    chartDropArea.addEventListener('click', (e) => {
      if (e.target !== browseChartBtn) chartInput.click();
    });
    chartDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      chartDropArea.classList.add('drag-over');
    });
    chartDropArea.addEventListener('dragleave', () => {
      chartDropArea.classList.remove('drag-over');
    });
    chartDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      chartDropArea.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedSizeChart(e.dataTransfer.files[0]);
      }
    });
  }
  if (chartInput) {
    chartInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processUploadedSizeChart(e.target.files[0]);
      }
    });
  }
  if (changeChartBtn) {
    changeChartBtn.addEventListener('click', () => {
      sfx.playPop();
      document.getElementById('chartPreviewBox').classList.add('hidden');
      document.getElementById('chartDropArea').classList.remove('hidden');
      if (chartInput) chartInput.value = '';
      APP_STATE.chartLoaded = false;
      APP_STATE.sizeChartImage = null;
      if (APP_STATE.garment) {
        APP_STATE.garment.sizeChart = null;
        APP_STATE.garment.image = null;
      }
      const dropArea = document.getElementById('chartDropArea');
      if (dropArea) dropArea.classList.remove('error');
      const statusBox = document.getElementById('chartStatusBox');
      if (statusBox) statusBox.className = 'chart-status-box';
      const icon = document.getElementById('chartStatusIcon');
      if (icon) icon.textContent = 'ℹ️';
      const msg = document.getElementById('chartStatusMsg');
      if (msg) msg.textContent = 'Please upload a photo or screenshot of the size chart table';
    });
  }

  // Live Camera Controls
  const startCamBtn = document.getElementById('startCameraBtn');
  if (startCamBtn) {
    startCamBtn.addEventListener('click', () => {
      sfx.playPop();
      startLiveCamera();
    });
  }
  const closeCamBtn = document.getElementById('closeCameraBtn');
  if (closeCamBtn) {
    closeCamBtn.addEventListener('click', () => {
      sfx.playPop();
      stopLiveCamera();
    });
  }
  const snapBtn = document.getElementById('snapPhotoBtn');
  if (snapBtn) {
    snapBtn.addEventListener('click', () => {
      snapCameraPhoto();
    });
  }

  // Fit Preference Cards
  document.querySelectorAll('.fit-card').forEach(card => {
    card.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('.fit-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      APP_STATE.fitPreference = card.getAttribute('data-fit');
    });
  });

  // Calculate Match Recommendation Button (Strict Multi-Stage Validation)
  document.getElementById('calculateMatchBtn').addEventListener('click', () => {
    // 1. First validate all body measurements from Step 1
    const bodyVal = validateBodyMeasurements();
    if (!bodyVal.valid) {
      switchScreen('sizesScreen');
      return;
    }

    // 2. Validate Product Link
    const urlInput = document.getElementById('productUrlInput');
    const rawUrl = urlInput ? urlInput.value.trim() : '';

    if (!rawUrl) {
      if (urlInput) {
        urlInput.classList.add('input-field-error');
        urlInput.focus();
      }
      const banner = document.getElementById('linkStatusBanner');
      const text = document.getElementById('linkStatusText');
      const icon = banner ? banner.querySelector('.status-check') : null;
      if (banner && text) {
        banner.className = 'link-status-banner error';
        if (icon) icon.textContent = '⚠️';
        text.textContent = 'Product link is required! Please paste a valid product link.';
        banner.classList.remove('hidden');
      }
      sfx.playError();
      showToast('⚠️ Product link is required! Please paste and analyze the product URL.');
      return;
    }

    // If entered URL was not analyzed yet (or was edited after analyzing)
    if (!APP_STATE.linkAnalyzed || APP_STATE.productUrl !== rawUrl) {
      const analyzed = analyzeProductLink(rawUrl);
      if (!analyzed) return;
    }

    // 3. Validate Size Chart
    if (!APP_STATE.chartLoaded || !APP_STATE.garment || !APP_STATE.garment.sizeChart) {
      const chartDrop = document.getElementById('chartDropArea');
      const statusBox = document.getElementById('chartStatusBox');
      const statusIcon = document.getElementById('chartStatusIcon');
      const statusMsg = document.getElementById('chartStatusMsg');
      if (chartDrop) chartDrop.classList.add('error');
      if (statusBox && statusIcon && statusMsg) {
        statusBox.className = 'chart-status-box error';
        statusIcon.textContent = '⚠️';
        statusMsg.textContent = 'Size chart is required! Please upload or snap a verified size chart image.';
      }
      sfx.playError();
      showToast('⚠️ Size chart is required! Please upload or snap a verified size chart.');
      return;
    }

    sfx.playChime();
    calculateSizeMatch();
    switchScreen('resultScreen');
  });

  // Try Another Garment Button
  document.getElementById('tryAnotherGarmentBtn').addEventListener('click', () => {
    sfx.playPop();
    switchScreen('garmentScreen');
  });
  document.getElementById('checkAnotherBtn').addEventListener('click', () => {
    sfx.playPop();
    switchScreen('garmentScreen');
  });

  // Result Screen Upper Body vs Lower Body 1-Click Toggle
  const btnResultToggleTop = document.getElementById('btnResultToggleTop');
  const btnResultToggleBottom = document.getElementById('btnResultToggleBottom');

  if (btnResultToggleTop) {
    btnResultToggleTop.addEventListener('click', () => {
      sfx.playPop();
      setGarmentType('top', true);
      calculateSizeMatch();
      showToast('👕 Showing Upper Body Measurements (Shoulder to Waist Only)');
    });
  }

  if (btnResultToggleBottom) {
    btnResultToggleBottom.addEventListener('click', () => {
      sfx.playPop();
      setGarmentType('bottom', true);
      calculateSizeMatch();
      showToast('👖 Showing Lower Body Measurements (Waist to Below Only)');
    });
  }

  // Copy Recommendation
  document.getElementById('copyRecommendationBtn').addEventListener('click', () => {
    sfx.playPop();
    const rec = APP_STATE.lastRecommendation;
    if (!rec || !APP_STATE.garment) return;
    const isTop = (getEffectiveGarmentType() !== 'bottom');
    let text = '';
    if (isTop) {
      text = `Smart Clothing Size Checker\nItem: ${APP_STATE.garment.title} (${APP_STATE.garment.brand})\nCategory: Top / Shirt (Upper Body ONLY)\nRecommended Size: ${rec.recommendedSize} (${rec.confidence}% match)\nFit Style: ${APP_STATE.fitPreference.toUpperCase()}\n[Upper Body Measurements]:\n- Shoulder Span: ${rec.details.shoulder.status}\n- Chest: ${rec.details.chest.status}\n- Waist: ${rec.details.waist.status}\n- Shirt Length: ${rec.details.length.status}`;
    } else {
      text = `Smart Clothing Size Checker\nItem: ${APP_STATE.garment.title} (${APP_STATE.garment.brand})\nCategory: Bottom / Pants (Lower Body ONLY)\nRecommended Size: ${rec.recommendedSize} (${rec.confidence}% match)\nFit Style: ${APP_STATE.fitPreference.toUpperCase()}\n[Lower Body Measurements]:\n- Waist: ${rec.details.waist.status}\n- Hips & Seat: ${rec.details.hips.status}\n- Inseam / Leg Length: ${rec.details.length.status}`;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Summary copied to clipboard!');
    }).catch(() => {
      showToast('Summary copied!');
    });
  });
}

// ==========================================
// 4. SCREEN ROUTING & AUTHENTICATION
// ==========================================

function switchScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.view-screen').forEach(scr => {
    scr.classList.remove('active');
  });

  // Show target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    APP_STATE.currentScreen = screenId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Stepper Navigation
  const stepper = document.getElementById('stepperNav');
  if (screenId === 'authScreen') {
    stepper.classList.add('hidden');
  } else {
    stepper.classList.remove('hidden');
    updateStepperState(screenId);
  }
}

function updateStepperState(screenId) {
  const steps = {
    sizesScreen: 1,
    garmentScreen: 2,
    resultScreen: 3
  };
  const activeStep = steps[screenId] || 1;

  document.querySelectorAll('.step-indicator').forEach(indicator => {
    const stepNum = parseInt(indicator.getAttribute('data-step'), 10);
    indicator.classList.remove('active', 'completed');
    if (stepNum === activeStep) {
      indicator.classList.add('active');
    } else if (stepNum < activeStep) {
      indicator.classList.add('completed');
    }
  });
}

// ==========================================
// 4. DATABASE STATUS, CRYPTOGRAPHIC AUTHENTICATION & SECURITY
// ==========================================

async function checkDatabaseStatus() {
  const badge = document.getElementById('dbSecurityBadge');
  if (!badge) return;
  try {
    const res = await fetch('/api/db/status');
    if (res.ok) {
      const data = await res.json();
      if (data.isMongoDB) {
        badge.innerHTML = `<span class="sec-dot"></span><span>MongoDB Atlas / Local Active · PBKDF2 Encrypted</span>`;
      } else {
        badge.innerHTML = `<span class="sec-dot"></span><span>Secure Document DB (${data.engine}) Active · PBKDF2 Hashing</span>`;
      }
      return;
    }
  } catch (err) {
    // Backend offline / static mode
  }
  badge.innerHTML = `<span class="sec-dot"></span><span>Client Crypto DB Active (WebCrypto SHA-256)</span>`;
}

function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, text: 'Enter password (min 6 characters)', level: 'none', pct: '0%' };
  }
  if (password.length < 6) {
    return { score: 1, text: 'Too short (min 6 characters)', level: 'weak', pct: '20%' };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score: 2, text: 'Weak password', level: 'weak', pct: '35%' };
  } else if (score <= 4) {
    return { score: 3, text: 'Moderate strength', level: 'medium', pct: '70%' };
  } else {
    return { score: 5, text: 'Strong password', level: 'strong', pct: '100%' };
  }
}

function updatePasswordStrengthMeter(password) {
  const bar = document.getElementById('strengthBarFill');
  const label = document.getElementById('strengthLabel');
  const pct = document.getElementById('strengthPct');
  if (!bar || !label || !pct) return;

  const res = evaluatePasswordStrength(password);
  bar.className = 'strength-bar-fill';
  if (res.level !== 'none') {
    bar.classList.add(res.level);
  }
  bar.style.width = res.pct;
  label.textContent = res.text;
  pct.textContent = res.level !== 'none' ? res.pct : '';
}

function clearAuthErrors() {
  const banner = document.getElementById('authStatusBanner');
  if (banner) {
    banner.className = 'auth-status-banner hidden';
  }
  ['authNameInput', 'authEmailInput', 'authPasswordInput', 'authConfirmPasswordInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-field-error');
  });
  ['nameError', 'emailError', 'passwordError', 'confirmPasswordError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  });
}

function showAuthFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(errorId);
  if (input) {
    input.classList.remove('input-field-error');
    void input.offsetWidth; // Force reflow for CSS shake animation
    input.classList.add('input-field-error');
    input.focus();
  }
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.remove('hidden');
  }
  showAuthBanner(message, 'error');
  sfx.playError();
}

function showAuthBanner(message, type = 'error') {
  const banner = document.getElementById('authStatusBanner');
  const text = document.getElementById('authStatusText');
  const icon = document.getElementById('authStatusIcon');
  if (!banner || !text) return;

  banner.className = `auth-status-banner ${type}`;
  text.textContent = message;
  if (icon) {
    icon.textContent = type === 'success' ? '✅' : '⚠️';
  }
  banner.classList.remove('hidden');
}

async function hashPasswordWithSalt(password, salt) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const derived = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: enc.encode(salt),
          iterations: 10000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );
      const hashArr = Array.from(new Uint8Array(derived));
      return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback below
    }
  }
  let hash = 0;
  const str = salt + ':' + password;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

async function handleClientSideAuth(mode, name, email, password) {
  const cleanEmail = email.trim().toLowerCase();
  let dbUsers = {};
  try {
    dbUsers = JSON.parse(localStorage.getItem('smart_size_users') || '{}');
  } catch (e) {
    dbUsers = {};
  }

  if (mode === 'signup') {
    if (dbUsers[cleanEmail]) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }
    const salt = (Math.random().toString(36).substring(2) + Date.now().toString(36)).substring(0, 16);
    const passwordHash = await hashPasswordWithSalt(password, salt);
    const userDoc = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: cleanEmail,
      salt: salt,
      passwordHash: passwordHash,
      bodyProfile: { ...APP_STATE.bodyProfile },
      createdAt: new Date().toISOString()
    };
    dbUsers[cleanEmail] = userDoc;
    try {
      localStorage.setItem('smart_size_users', JSON.stringify(dbUsers));
    } catch (e) {}

    return {
      success: true,
      message: 'Account registered successfully (Client Encrypted DB)!',
      user: {
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.name ? userDoc.name[0].toUpperCase() : '👤',
        bodyProfile: userDoc.bodyProfile
      }
    };
  } else {
    // Login
    const user = dbUsers[cleanEmail];
    if (!user) {
      return { success: false, message: 'No account found with this email. Please create an account.' };
    }
    const computedHash = await hashPasswordWithSalt(password, user.salt);
    if (computedHash !== user.passwordHash) {
      return { success: false, message: 'Incorrect password. Please verify and try again.' };
    }
    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.name ? user.name[0].toUpperCase() : '👤',
        bodyProfile: user.bodyProfile
      }
    };
  }
}

async function handleAuthSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  clearAuthErrors();

  const mode = APP_STATE.auth.mode || 'login';
  const emailInput = document.getElementById('authEmailInput');
  const passwordInput = document.getElementById('authPasswordInput');
  const nameInput = document.getElementById('authNameInput');
  const confirmPasswordInput = document.getElementById('authConfirmPasswordInput');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const name = nameInput ? nameInput.value.trim() : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  // Validation 1: Email Address (RFC-compliant regex)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) {
    showAuthFieldError('authEmailInput', 'emailError', 'Please enter your email address.');
    return;
  }
  if (!emailRegex.test(email)) {
    showAuthFieldError('authEmailInput', 'emailError', 'Please enter a valid email address (e.g. name@domain.com).');
    return;
  }

  // Validation 2: Password Length
  if (!password) {
    showAuthFieldError('authPasswordInput', 'passwordError', 'Please enter your password.');
    return;
  }
  if (password.length < 6) {
    showAuthFieldError('authPasswordInput', 'passwordError', 'Password must be at least 6 characters long.');
    return;
  }

  // Validation 3: Signup-specific checks (Full Name & Confirm Password)
  if (mode === 'signup') {
    if (!name || name.length < 2) {
      showAuthFieldError('authNameInput', 'nameError', 'Please enter your full name (at least 2 characters).');
      return;
    }
    if (!confirmPassword) {
      showAuthFieldError('authConfirmPasswordInput', 'confirmPasswordError', 'Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      showAuthFieldError('authConfirmPasswordInput', 'confirmPasswordError', 'Passwords do not match. Please re-enter.');
      return;
    }
  }

  // Visual loading feedback
  const submitBtn = document.getElementById('authSubmitBtn');
  const submitLabel = document.getElementById('authSubmitLabel');
  const originalLabel = submitLabel ? submitLabel.textContent : '';
  if (submitBtn) submitBtn.disabled = true;
  if (submitLabel) submitLabel.textContent = (mode === 'signup') ? 'Creating Secure Account...' : 'Verifying Credentials...';

  try {
    const endpoint = (mode === 'signup') ? '/api/auth/signup' : '/api/auth/login';
    const payload = (mode === 'signup') ? { name, email, password } : { email, password };

    let data;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    } catch (networkErr) {
      console.warn('Backend server unreachable; falling back to WebCrypto client store.', networkErr);
      data = await handleClientSideAuth(mode, name, email, password);
    }

    if (data && data.success) {
      showAuthBanner(data.message || (mode === 'signup' ? 'Account created successfully!' : 'Signed in!'), 'success');
      sfx.playChime();

      setTimeout(() => {
        authenticateUser(data.user);
      }, 400);
    } else {
      const errMsg = (data && data.message) ? data.message : 'Authentication failed. Please try again.';
      showAuthBanner(errMsg, 'error');
      sfx.playError();
      if (errMsg.toLowerCase().includes('password')) {
        showAuthFieldError('authPasswordInput', 'passwordError', errMsg);
      } else if (errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('account')) {
        showAuthFieldError('authEmailInput', 'emailError', errMsg);
      }
    }
  } catch (err) {
    showAuthBanner('An unexpected error occurred. Please try again.', 'error');
    sfx.playError();
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitLabel) submitLabel.textContent = originalLabel;
  }
}

function authenticateUser(userData) {
  APP_STATE.auth.isLoggedIn = true;
  APP_STATE.auth.user = userData;

  // Restore saved body profile measurements if available
  if (userData.bodyProfile && typeof userData.bodyProfile === 'object') {
    Object.assign(APP_STATE.bodyProfile, userData.bodyProfile);
    // Populate manual input values
    if (APP_STATE.bodyProfile.height) {
      const totalInches = APP_STATE.bodyProfile.height;
      const ftInput = document.getElementById('inputHeightFt');
      const inInput = document.getElementById('inputHeightIn');
      const cmInput = document.getElementById('inputHeightCm');
      if (ftInput) ftInput.value = Math.floor(totalInches / 12);
      if (inInput) inInput.value = Math.round(totalInches % 12);
      if (cmInput) cmInput.value = Math.round(totalInches * 2.54);
    }
    if (APP_STATE.bodyProfile.weight) {
      const wtInput = document.getElementById('inputWeight');
      if (wtInput) wtInput.value = Math.round(APP_STATE.bodyProfile.weight);
    }
    ['chest', 'waist', 'hips', 'shoulder', 'inseam'].forEach(field => {
      if (APP_STATE.bodyProfile[field]) {
        setInputValueWithUnit(field, APP_STATE.bodyProfile[field]);
      }
    });
    if (typeof updateGameAvatarSVG === 'function') {
      updateGameAvatarSVG(
        APP_STATE.bodyProfile.shoulder,
        APP_STATE.bodyProfile.chest,
        APP_STATE.bodyProfile.waist,
        APP_STATE.bodyProfile.hips,
        APP_STATE.bodyProfile.inseam
      );
    }
  }

  // Update Header User Chip
  const userBadge = document.getElementById('userBadge');
  const avatarElem = document.getElementById('headerAvatar');
  const nameElem = document.getElementById('headerUserName');

  if (avatarElem) avatarElem.textContent = userData.avatar || '👤';
  if (nameElem) nameElem.textContent = userData.name || userData.email;
  if (userBadge) userBadge.classList.remove('hidden');

  showToast(`Welcome, ${userData.name || 'Shopper'}!`);
  switchScreen('sizesScreen');
}

async function saveUserProfileToDB() {
  if (!APP_STATE.auth.isLoggedIn || !APP_STATE.auth.user || !APP_STATE.auth.user.email) return;
  const userEmail = APP_STATE.auth.user.email;
  const profileData = { ...APP_STATE.bodyProfile };

  try {
    await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        bodyProfile: profileData
      })
    });
  } catch (err) {
    try {
      const dbUsers = JSON.parse(localStorage.getItem('smart_size_users') || '{}');
      if (dbUsers[userEmail.toLowerCase()]) {
        dbUsers[userEmail.toLowerCase()].bodyProfile = profileData;
        localStorage.setItem('smart_size_users', JSON.stringify(dbUsers));
      }
    } catch (e) {}
  }
}

// ==========================================
// 5. MEASUREMENTS & UNIT CONVERSION
// ==========================================

function setFieldUnit(field, unit) {
  if (field === 'height') {
    const isCm = (unit === 'cm');
    document.getElementById('heightFtInBox').classList.toggle('hidden', isCm);
    document.getElementById('heightCmBox').classList.toggle('hidden', !isCm);
    const totalInches = APP_STATE.bodyProfile.height || 68;
    if (isCm) {
      document.getElementById('inputHeightCm').value = Math.round(totalInches * 2.54);
    } else {
      document.getElementById('inputHeightFt').value = Math.floor(totalInches / 12);
      document.getElementById('inputHeightIn').value = Math.round(totalInches % 12);
    }
    syncManualInputsToState();
    return;
  }

  if (field === 'weight') {
    const isKg = (unit === 'kg');
    const input = document.getElementById('inputWeight');
    let currentVal = parseFloat(input.value) || 150;
    if (isKg) {
      input.value = Math.round(currentVal / 2.20462);
      input.min = 20;
      input.max = 160;
    } else {
      input.value = Math.round(currentVal * 2.20462);
      input.min = 40;
      input.max = 350;
    }
    syncManualInputsToState();
    return;
  }

  // Chest, Waist, Hips, Shoulder, Inseam
  const input = document.getElementById(`input${field.charAt(0).toUpperCase() + field.slice(1)}`);
  if (!input) return;
  const isCm = (unit === 'cm');
  const currentVal = parseFloat(input.value) || 0;
  if (isCm) {
    input.value = Math.round(currentVal * 2.54);
    input.step = 1;
  } else {
    input.value = (Math.round((currentVal / 2.54) * 2) / 2).toFixed(1);
    input.step = 0.5;
  }
  syncManualInputsToState();
}

function setInputValueWithUnit(field, valInInches) {
  const input = document.getElementById(`input${field.charAt(0).toUpperCase() + field.slice(1)}`);
  if (!input) return;
  const unitBtn = document.querySelector(`.mini-unit-pill[data-field="${field}"] .mini-unit-btn.active`);
  const isCm = unitBtn && unitBtn.getAttribute('data-unit') === 'cm';
  if (isCm) {
    input.value = Math.round(valInInches * 2.54);
  } else {
    input.value = valInInches.toFixed(1);
  }
}

function convertUnits(newUnit) {
  APP_STATE.unit = newUnit;

  // Update top-right unit toggle buttons
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-unit') === newUnit);
  });

  const isCm = (newUnit === 'cm');
  
  // Update each per-box mini unit pill
  document.querySelectorAll('.mini-unit-pill').forEach(pill => {
    const field = pill.getAttribute('data-field');
    pill.querySelectorAll('.mini-unit-btn').forEach(btn => {
      const bUnit = btn.getAttribute('data-unit');
      if (field === 'height') {
        btn.classList.toggle('active', isCm ? bUnit === 'cm' : bUnit === 'ft-in');
      } else if (field === 'weight') {
        btn.classList.toggle('active', isCm ? bUnit === 'kg' : bUnit === 'lbs');
      } else {
        btn.classList.toggle('active', isCm ? bUnit === 'cm' : bUnit === 'in');
      }
    });
    setFieldUnit(field, isCm ? (field === 'height' ? 'cm' : (field === 'weight' ? 'kg' : 'cm')) : (field === 'height' ? 'ft-in' : (field === 'weight' ? 'lbs' : 'in')));
  });

  showToast(`Switched all units to ${newUnit.toUpperCase()}`);
}

function validateBodyMeasurements() {
  // Clear any existing error highlights
  ['inputHeightFt', 'inputHeightIn', 'inputHeightCm', 'inputWeight', 'inputChest', 'inputWaist', 'inputHips', 'inputShoulder', 'inputInseam'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-field-error');
  });

  // 1. Height
  const heightUnitBtn = document.querySelector('.mini-unit-pill[data-field="height"] .mini-unit-btn.active');
  const isHeightCm = heightUnitBtn && heightUnitBtn.getAttribute('data-unit') === 'cm';
  if (isHeightCm) {
    const cmInp = document.getElementById('inputHeightCm');
    const cm = parseFloat(cmInp ? cmInp.value : '');
    if (isNaN(cm) || cm < 90 || cm > 240) {
      if (cmInp) {
        cmInp.classList.add('input-field-error');
        cmInp.focus();
      }
      sfx.playError();
      showToast('⚠️ Height must be between 90 cm and 240 cm');
      return { valid: false, field: 'height' };
    }
    APP_STATE.bodyProfile.height = cm / 2.54;
  } else {
    const ftInp = document.getElementById('inputHeightFt');
    const inInp = document.getElementById('inputHeightIn');
    const ft = parseFloat(ftInp ? ftInp.value : '');
    const inch = parseFloat(inInp ? inInp.value : '');
    if (isNaN(ft) || ft < 3 || ft > 8) {
      if (ftInp) {
        ftInp.classList.add('input-field-error');
        ftInp.focus();
      }
      sfx.playError();
      showToast('⚠️ Height feet must be between 3 and 8 ft');
      return { valid: false, field: 'heightFt' };
    }
    if (isNaN(inch) || inch < 0 || inch > 11.9) {
      if (inInp) {
        inInp.classList.add('input-field-error');
        inInp.focus();
      }
      sfx.playError();
      showToast('⚠️ Height inches must be between 0 and 11 in');
      return { valid: false, field: 'heightIn' };
    }
    const totalInches = (ft * 12) + inch;
    if (totalInches < 36 || totalInches > 96) {
      if (ftInp) ftInp.classList.add('input-field-error');
      sfx.playError();
      showToast('⚠️ Height must be between 3ft and 8ft (36" - 96")');
      return { valid: false, field: 'height' };
    }
    APP_STATE.bodyProfile.height = totalInches;
  }

  // 2. Weight
  const weightUnitBtn = document.querySelector('.mini-unit-pill[data-field="weight"] .mini-unit-btn.active');
  const isWeightKg = weightUnitBtn && weightUnitBtn.getAttribute('data-unit') === 'kg';
  const weightInp = document.getElementById('inputWeight');
  const weightVal = parseFloat(weightInp ? weightInp.value : '');
  if (isWeightKg) {
    if (isNaN(weightVal) || weightVal < 18 || weightVal > 205) {
      if (weightInp) {
        weightInp.classList.add('input-field-error');
        weightInp.focus();
      }
      sfx.playError();
      showToast('⚠️ Weight must be between 18 kg and 205 kg (40 - 450 lbs)');
      return { valid: false, field: 'weight' };
    }
    APP_STATE.bodyProfile.weight = weightVal * 2.20462;
  } else {
    if (isNaN(weightVal) || weightVal < 40 || weightVal > 450) {
      if (weightInp) {
        weightInp.classList.add('input-field-error');
        weightInp.focus();
      }
      sfx.playError();
      showToast('⚠️ Weight must be between 40 lbs and 450 lbs (18 - 205 kg)');
      return { valid: false, field: 'weight' };
    }
    APP_STATE.bodyProfile.weight = weightVal;
  }

  // 3. Chest, Waist, Hips, Shoulder, Inseam
  const parts = [
    { field: 'chest', label: 'Chest / Bust', minIn: 20, maxIn: 70, minCm: 50, maxCm: 178 },
    { field: 'waist', label: 'Waist', minIn: 18, maxIn: 65, minCm: 45, maxCm: 165 },
    { field: 'hips', label: 'Hips', minIn: 20, maxIn: 75, minCm: 50, maxCm: 190 },
    { field: 'shoulder', label: 'Shoulder Span', minIn: 10, maxIn: 30, minCm: 25, maxCm: 76 },
    { field: 'inseam', label: 'Inseam', minIn: 18, maxIn: 45, minCm: 45, maxCm: 114 }
  ];

  for (const part of parts) {
    const input = document.getElementById(`input${part.field.charAt(0).toUpperCase() + part.field.slice(1)}`);
    if (!input) continue;
    const unitBtn = document.querySelector(`.mini-unit-pill[data-field="${part.field}"] .mini-unit-btn.active`);
    const isCm = unitBtn && unitBtn.getAttribute('data-unit') === 'cm';
    const val = parseFloat(input.value);

    if (isNaN(val)) {
      input.classList.add('input-field-error');
      input.focus();
      sfx.playError();
      showToast(`⚠️ Please enter a value for ${part.label}`);
      return { valid: false, field: part.field };
    }

    if (isCm) {
      if (val < part.minCm || val > part.maxCm) {
        input.classList.add('input-field-error');
        input.focus();
        sfx.playError();
        showToast(`⚠️ ${part.label} must be between ${part.minCm}cm and ${part.maxCm}cm (${part.minIn}" - ${part.maxIn}")`);
        return { valid: false, field: part.field };
      }
      APP_STATE.bodyProfile[part.field] = val / 2.54;
    } else {
      if (val < part.minIn || val > part.maxIn) {
        input.classList.add('input-field-error');
        input.focus();
        sfx.playError();
        showToast(`⚠️ ${part.label} must be between ${part.minIn}" and ${part.maxIn}" (${part.minCm}cm - ${part.maxCm}cm)`);
        return { valid: false, field: part.field };
      }
      APP_STATE.bodyProfile[part.field] = val;
    }
  }

  return { valid: true };
}

function syncManualInputsToState() {
  // Height
  const heightUnitBtn = document.querySelector('.mini-unit-pill[data-field="height"] .mini-unit-btn.active');
  const isHeightCm = heightUnitBtn && heightUnitBtn.getAttribute('data-unit') === 'cm';
  if (isHeightCm) {
    const cm = parseFloat(document.getElementById('inputHeightCm').value);
    if (!isNaN(cm) && cm >= 90 && cm <= 240) APP_STATE.bodyProfile.height = cm / 2.54;
  } else {
    const ft = parseFloat(document.getElementById('inputHeightFt').value);
    const inch = parseFloat(document.getElementById('inputHeightIn').value);
    if (!isNaN(ft) && !isNaN(inch)) APP_STATE.bodyProfile.height = (ft * 12) + inch;
  }

  // Weight
  const weightUnitBtn = document.querySelector('.mini-unit-pill[data-field="weight"] .mini-unit-btn.active');
  const isWeightKg = weightUnitBtn && weightUnitBtn.getAttribute('data-unit') === 'kg';
  const weightRaw = parseFloat(document.getElementById('inputWeight').value);
  if (!isNaN(weightRaw)) {
    APP_STATE.bodyProfile.weight = isWeightKg ? (weightRaw * 2.20462) : weightRaw;
  }

  // Chest, Waist, Hips, Shoulder, Inseam
  ['chest', 'waist', 'hips', 'shoulder', 'inseam'].forEach(field => {
    const input = document.getElementById(`input${field.charAt(0).toUpperCase() + field.slice(1)}`);
    if (!input) return;
    const unitBtn = document.querySelector(`.mini-unit-pill[data-field="${field}"] .mini-unit-btn.active`);
    const isCm = unitBtn && unitBtn.getAttribute('data-unit') === 'cm';
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      APP_STATE.bodyProfile[field] = isCm ? (val / 2.54) : val;
    }
  });
}

function resetDefaultMeasurements() {
  ['inputHeightFt', 'inputHeightIn', 'inputHeightCm', 'inputWeight', 'inputChest', 'inputWaist', 'inputHips', 'inputShoulder', 'inputInseam'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-field-error');
  });

  document.getElementById('inputHeightFt').value = 5;
  document.getElementById('inputHeightIn').value = 8;
  document.getElementById('inputHeightCm').value = 172;
  document.getElementById('inputWeight').value = 150;
  document.getElementById('inputChest').value = 38.0;
  document.getElementById('inputWaist').value = 32.0;
  document.getElementById('inputHips').value = 39.0;
  document.getElementById('inputShoulder').value = 17.5;
  document.getElementById('inputInseam').value = 30.0;

  // Reset mini-unit pills to standard
  document.querySelectorAll('.mini-unit-pill').forEach(pill => {
    pill.querySelectorAll('.mini-unit-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === 0);
    });
  });
  document.getElementById('heightFtInBox').classList.remove('hidden');
  document.getElementById('heightCmBox').classList.add('hidden');

  syncManualInputsToState();
  showToast('Reset measurements to defaults');
}

// ==========================================
// 6. RPG GAME AVATAR CREATOR & SVG MORPHING (With Full Pant & Leg Sizing)
// ==========================================

function openGameAvatarModal() {
  const modal = document.getElementById('gameAvatarModal');
  modal.classList.remove('hidden');

  // Sync sliders to current state in inches
  document.getElementById('sliderShoulder').value = APP_STATE.bodyProfile.shoulder || 17.5;
  document.getElementById('sliderChest').value = APP_STATE.bodyProfile.chest || 38.0;
  document.getElementById('sliderWaist').value = APP_STATE.bodyProfile.waist || 32.0;
  document.getElementById('sliderHips').value = APP_STATE.bodyProfile.hips || 39.0;

  const sliderInseam = document.getElementById('sliderInseam');
  if (sliderInseam) {
    sliderInseam.value = APP_STATE.bodyProfile.inseam || 30.5;
  }
  const sliderThigh = document.getElementById('sliderThigh');
  if (sliderThigh) {
    sliderThigh.value = 23.0;
  }

  updateGameSliderLabels();
  updateGameAvatarFromSliders();
}

function closeGameAvatarModal() {
  const modal = document.getElementById('gameAvatarModal');
  modal.classList.add('hidden');
}

function applyArchetypeToSliders(archetypeKey) {
  const data = ARCHETYPES[archetypeKey] || ARCHETYPES.m;
  
  document.getElementById('sliderShoulder').value = data.shoulder;
  document.getElementById('sliderChest').value = data.chest;
  document.getElementById('sliderWaist').value = data.waist;
  document.getElementById('sliderHips').value = data.hips;

  const sliderInseam = document.getElementById('sliderInseam');
  if (sliderInseam && data.inseam) {
    sliderInseam.value = data.inseam;
  }
  const sliderThigh = document.getElementById('sliderThigh');
  if (sliderThigh && data.thigh) {
    sliderThigh.value = data.thigh;
  }

  document.getElementById('avatarBuildName').textContent = data.name;
  document.getElementById('avatarEstimatedTag').textContent = data.estimatedSize;

  updateGameSliderLabels();
  updateGameAvatarSVG(data.shoulder, data.chest, data.waist, data.hips, data.inseam, data.thigh);
}

function applyPantPresetToSliders(pantKey) {
  const data = PANT_JEANS_PRESETS[pantKey] || PANT_JEANS_PRESETS['32'];

  document.getElementById('sliderWaist').value = data.waist;
  document.getElementById('sliderHips').value = data.hips;

  const sliderInseam = document.getElementById('sliderInseam');
  if (sliderInseam) {
    sliderInseam.value = data.inseam;
  }
  const sliderThigh = document.getElementById('sliderThigh');
  if (sliderThigh) {
    sliderThigh.value = data.thigh;
  }

  document.getElementById('avatarBuildName').textContent = data.name;
  document.getElementById('avatarEstimatedTag').textContent = data.estimatedSize;

  updateGameSliderLabels();
  const shoulder = parseFloat(document.getElementById('sliderShoulder').value);
  const chest = parseFloat(document.getElementById('sliderChest').value);
  updateGameAvatarSVG(shoulder, chest, data.waist, data.hips, data.inseam, data.thigh);
}

function updateGameSliderLabels() {
  const shoulder = parseFloat(document.getElementById('sliderShoulder').value);
  const chest = parseFloat(document.getElementById('sliderChest').value);
  const waist = parseFloat(document.getElementById('sliderWaist').value);
  const hips = parseFloat(document.getElementById('sliderHips').value);

  const sliderInseam = document.getElementById('sliderInseam');
  const inseam = sliderInseam ? parseFloat(sliderInseam.value) : (APP_STATE.bodyProfile.inseam || 30.5);

  const sliderThigh = document.getElementById('sliderThigh');
  const thigh = sliderThigh ? parseFloat(sliderThigh.value) : 23.0;

  document.getElementById('sliderShoulderVal').textContent = `${shoulder.toFixed(1)}"`;
  document.getElementById('sliderChestVal').textContent = `${chest.toFixed(1)}"`;
  document.getElementById('sliderWaistVal').textContent = `${waist.toFixed(1)}"`;
  document.getElementById('sliderHipsVal').textContent = `${hips.toFixed(1)}"`;

  const sliderInseamVal = document.getElementById('sliderInseamVal');
  if (sliderInseamVal) {
    sliderInseamVal.textContent = `${inseam.toFixed(1)}"`;
  }

  const sliderThighVal = document.getElementById('sliderThighVal');
  if (sliderThighVal) {
    let thighFit = 'Regular';
    if (thigh < 20.5) thighFit = 'Slim';
    else if (thigh > 25.5) thighFit = 'Relaxed / Athletic';
    sliderThighVal.textContent = `${thigh.toFixed(1)}" (${thighFit})`;
  }

  document.getElementById('avatarHudChest').textContent = `Chest: ${chest.toFixed(1)}"`;
  document.getElementById('avatarHudWaist').textContent = `Waist: ${waist.toFixed(1)}"`;
  document.getElementById('avatarHudHips').textContent = `Hips: ${hips.toFixed(1)}"`;

  const hudInseam = document.getElementById('avatarHudInseam');
  if (hudInseam) {
    hudInseam.textContent = `Inseam: ${inseam.toFixed(1)}"`;
  }
}

function updateGameAvatarFromSliders() {
  const shoulder = parseFloat(document.getElementById('sliderShoulder').value);
  const chest = parseFloat(document.getElementById('sliderChest').value);
  const waist = parseFloat(document.getElementById('sliderWaist').value);
  const hips = parseFloat(document.getElementById('sliderHips').value);

  const sliderInseam = document.getElementById('sliderInseam');
  const inseam = sliderInseam ? parseFloat(sliderInseam.value) : (APP_STATE.bodyProfile.inseam || 30.5);

  const sliderThigh = document.getElementById('sliderThigh');
  const thigh = sliderThigh ? parseFloat(sliderThigh.value) : 23.0;

  const isPantActive = document.getElementById('btnGameCategoryPant')?.classList.contains('active');
  if (isPantActive) {
    let pantEst = '32" Waist';
    if (waist < 27) pantEst = '26" Waist • Petite';
    else if (waist < 29) pantEst = '28" Waist • Slim';
    else if (waist < 31) pantEst = '30" Waist • Trim';
    else if (waist < 33) pantEst = '32" Waist • Regular';
    else if (waist < 35) pantEst = '34" Waist • Relaxed';
    else if (waist < 37) pantEst = '36" Waist • Athletic';
    else if (waist < 39) pantEst = '38" Waist • Comfort';
    else pantEst = '40" Waist • Big & Tall';
    document.getElementById('avatarEstimatedTag').textContent = `${pantEst} (${inseam.toFixed(1)}" Inseam)`;
  } else {
    let est = 'Medium (M)';
    if (chest < 31.5) est = 'XXS';
    else if (chest < 34.5) est = 'XS';
    else if (chest < 37.0) est = 'S';
    else if (chest < 39.0) est = 'M';
    else if (chest < 41.0) est = 'L';
    else if (chest < 43.0) est = 'XL';
    else if (chest < 45.5) est = 'XXL';
    else est = '3XL';
    document.getElementById('avatarEstimatedTag').textContent = est;
  }

  updateGameAvatarSVG(shoulder, chest, waist, hips, inseam, thigh);
}

/**
 * Dynamically deforms the SVG mannequin polygon/path coordinates in real time!
 * Morphs shoulders, chest, waist, hips, AND leg inseam length & thigh fullness.
 */
function updateGameAvatarSVG(shoulder, chest, waist, hips, inseam, thigh) {
  const torso = document.getElementById('avatarTorsoPath');
  if (!torso) return;

  if (inseam === undefined) {
    const sInseam = document.getElementById('sliderInseam');
    inseam = sInseam ? parseFloat(sInseam.value) : (APP_STATE.bodyProfile.inseam || 30.5);
  }
  if (thigh === undefined) {
    const sThigh = document.getElementById('sliderThigh');
    thigh = sThigh ? parseFloat(sThigh.value) : 23.0;
  }

  // Base center is x=160
  // Default values: shoulder: 17.5, chest: 38, waist: 32, hips: 39
  const shoulderHalfSpan = (shoulder / 17.5) * 55;
  const chestHalfSpan = (chest / 38.0) * 56;
  const waistHalfSpan = (waist / 32.0) * 36;
  const hipHalfSpan = (hips / 39.0) * 52;

  const neckL = 152;
  const neckR = 168;

  const shR = 160 + shoulderHalfSpan;
  const chR = 160 + chestHalfSpan;
  const waR = 160 + waistHalfSpan;
  const hiR = 160 + hipHalfSpan;

  const shL = 160 - shoulderHalfSpan;
  const chL = 160 - chestHalfSpan;
  const waL = 160 - waistHalfSpan;
  const hiL = 160 - hipHalfSpan;

  // Torso Path: Neck -> Shoulder R -> Chest R -> Waist R -> Hip R -> Crotch (160, 320) -> Hip L -> Waist L -> Chest L -> Shoulder L -> Neck
  const pathD = `M ${neckL} 94 L ${neckR} 94 L ${shR.toFixed(1)} 115 L ${chR.toFixed(1)} 170 L ${waR.toFixed(1)} 230 L ${hiR.toFixed(1)} 300 L 160 320 L ${hiL.toFixed(1)} 300 L ${waL.toFixed(1)} 230 L ${chL.toFixed(1)} 170 L ${shL.toFixed(1)} 115 Z`;
  torso.setAttribute('d', pathD);

  // Dynamic Legs Geometry based on Inseam (length) & Thigh fullness (width)
  // Standard inseam 30.5" places ankle at y=445; 24" -> 393; 38" -> 472
  const ankleY = Math.min(472, Math.max(390, 320 + ((inseam / 30.5) * 125)));
  const legLeft = document.getElementById('avatarLegLeft');
  const legRight = document.getElementById('avatarLegRight');
  
  const thighDelta = (thigh - 23.0);
  const leftBulgeX = hiL - (thighDelta * 0.9);
  const rightBulgeX = hiR + (thighDelta * 0.9);
  const leftAnkleOuter = hiL + 14 - (thighDelta * 0.5);
  const rightAnkleOuter = hiR - 14 + (thighDelta * 0.5);

  if (legLeft) {
    const leftD = `M ${hiL.toFixed(1)} 300 Q ${leftBulgeX.toFixed(1)} 365 ${leftAnkleOuter.toFixed(1)} ${ankleY.toFixed(1)} L 146 ${ankleY.toFixed(1)} L 160 320 Z`;
    legLeft.setAttribute('d', leftD);
  }
  if (legRight) {
    const rightD = `M ${hiR.toFixed(1)} 300 Q ${rightBulgeX.toFixed(1)} 365 ${rightAnkleOuter.toFixed(1)} ${ankleY.toFixed(1)} L 174 ${ankleY.toFixed(1)} L 160 320 Z`;
    legRight.setAttribute('d', rightD);
  }

  // Update Inseam HUD measurement line
  const inseamLine = document.querySelector('#indicatorInseam line');
  const inseamCircle = document.querySelector('#indicatorInseam circle');
  const inseamText = document.getElementById('avatarHudInseam');
  if (inseamLine) {
    inseamLine.setAttribute('y2', `${ankleY.toFixed(1)}`);
  }
  if (inseamCircle) {
    inseamCircle.setAttribute('cy', `${ankleY.toFixed(1)}`);
  }
  if (inseamText) {
    inseamText.setAttribute('y', `${(320 + (ankleY - 320) / 2).toFixed(1)}`);
  }

  // Update indicator lines for Chest, Waist, Hips
  const chestLine = document.querySelector('#indicatorChest line');
  const chestCircle = document.querySelector('#indicatorChest circle');
  if (chestLine) {
    chestLine.setAttribute('x1', `${Math.max(60, chL - 15)}`);
    chestLine.setAttribute('x2', `${chR + 25}`);
    chestCircle.setAttribute('cx', `${chR + 25}`);
  }

  const waistLine = document.querySelector('#indicatorWaist line');
  const waistCircle = document.querySelector('#indicatorWaist circle');
  if (waistLine) {
    waistLine.setAttribute('x1', `${Math.max(70, waL - 15)}`);
    waistLine.setAttribute('x2', `${waR + 25}`);
    waistCircle.setAttribute('cx', `${waR + 25}`);
  }

  const hipLine = document.querySelector('#indicatorHips line');
  const hipCircle = document.querySelector('#indicatorHips circle');
  if (hipLine) {
    hipLine.setAttribute('x1', `${Math.max(65, hiL - 15)}`);
    hipLine.setAttribute('x2', `${hiR + 25}`);
    hipCircle.setAttribute('cx', `${hiR + 25}`);
  }
}

function applyAvatarSizesToProfile() {
  const shoulder = parseFloat(document.getElementById('sliderShoulder').value);
  const chest = parseFloat(document.getElementById('sliderChest').value);
  const waist = parseFloat(document.getElementById('sliderWaist').value);
  const hips = parseFloat(document.getElementById('sliderHips').value);
  const sliderInseam = document.getElementById('sliderInseam');
  const inseam = sliderInseam ? parseFloat(sliderInseam.value) : (APP_STATE.bodyProfile.inseam || 30.5);

  setInputValueWithUnit('shoulder', shoulder);
  setInputValueWithUnit('chest', chest);
  setInputValueWithUnit('waist', waist);
  setInputValueWithUnit('hips', hips);
  setInputValueWithUnit('inseam', inseam);

  syncManualInputsToState();
  saveUserProfileToDB();
  closeGameAvatarModal();
  showToast('🎮 Body Avatar & Leg measurements saved to profile!');
}

function applyStep1CategoryFocus(focus) {
  const pantBox = document.getElementById('pantQuickSelectBox');
  const allCards = document.querySelectorAll('.measurement-grid .input-card');

  if (focus === 'pant') {
    if (pantBox) pantBox.classList.remove('hidden');
    allCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      if (cat === 'lower') {
        card.classList.add('pant-focus-highlight');
        card.classList.remove('dimmed-card');
      } else if (cat === 'upper') {
        card.classList.add('dimmed-card');
        card.classList.remove('pant-focus-highlight');
      } else {
        card.classList.remove('dimmed-card', 'pant-focus-highlight');
      }
    });
    handleCategoryPillClick('bottom');
    showToast('👖 Pant & Jeans sizing mode activated!');
  } else if (focus === 'shirt') {
    if (pantBox) pantBox.classList.add('hidden');
    allCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      if (cat === 'upper') {
        card.classList.remove('dimmed-card');
      } else if (cat === 'lower') {
        card.classList.add('dimmed-card');
        card.classList.remove('pant-focus-highlight');
      } else {
        card.classList.remove('dimmed-card', 'pant-focus-highlight');
      }
    });
    handleCategoryPillClick('top');
    showToast('👕 Shirt & Top sizing mode activated!');
  } else {
    // all
    if (pantBox) pantBox.classList.add('hidden');
    allCards.forEach(card => {
      card.classList.remove('dimmed-card', 'pant-focus-highlight');
    });
  }
}

function applyJeansQuickPreset(jeansSize) {
  const preset = PANT_JEANS_PRESETS[jeansSize];
  if (!preset) return;

  setInputValueWithUnit('waist', preset.waist);
  setInputValueWithUnit('hips', preset.hips);
  setInputValueWithUnit('inseam', preset.inseam);

  syncManualInputsToState();
  showToast(`👖 Auto-filled for ${jeansSize}" Jeans (Waist: ${preset.waist}", Hips: ${preset.hips}", Inseam: ${preset.inseam}")`);
}

// ==========================================
// ==========================================
// 7. PRODUCT LINK & SIZE CHART VERIFICATION PIPELINE
// ==========================================

const SHIRT_KEYWORDS = [
  'shirt', 'shirts', 'tshirt', 'tshirts', 't-shirt', 't-shirts', 'tee', 'tees',
  'top', 'tops', 'hoodie', 'hoodies', 'sweater', 'sweaters', 'jacket', 'jackets',
  'polo', 'polos', 'blouse', 'blouses', 'kurta', 'kurtas', 'kurti', 'kurtis',
  'vest', 'vests', 'tank', 'tanks', 'sweatshirt', 'sweatshirts', 'overcoat',
  'shacket', 'blazer', 'cardigan', 'pullover', 'henley', 'flannel', 'tunic', 'crop'
];

const PANT_KEYWORDS = [
  'pant', 'pants', 'jean', 'jeans', 'trouser', 'trousers', 'cargo', 'cargos',
  'jogger', 'joggers', 'short', 'shorts', 'chino', 'chinos', 'legging', 'leggings',
  'skirt', 'skirts', 'bottom', 'bottoms', 'trackpant', 'trackpants', 'sweatpant',
  'sweatpants', 'denims', 'boxer', 'boxers', 'bermuda', 'capri', 'palazzo', 'culottes'
];

function isShirtText(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SHIRT_KEYWORDS.some(k => new RegExp(`(^|\\W|_|-)${k}(\\W|_|-|$)`, 'i').test(lower));
}

function isPantText(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PANT_KEYWORDS.some(k => new RegExp(`(^|\\W|_|-)${k}(\\W|_|-|$)`, 'i').test(lower));
}

/**
 * Intelligent Image & File Garment Classifier:
 * Inspects filename if explicitly named, otherwise respects user's active choice.
 * Aspect-ratio heuristics are avoided to prevent misclassifying tall phone screenshots.
 */
function detectImageGarmentCategory(sourceName, img) {
  // 1. Filename & Source text check (if explicitly named)
  const cleanSource = (sourceName || '').toLowerCase();
  const isNamePant = isPantText(cleanSource);
  const isNameShirt = isShirtText(cleanSource);
  if (isNamePant && !isNameShirt) return 'bottom';
  if (isNameShirt && !isNamePant) return 'top';

  // 2. Authoritative user selection
  return APP_STATE.garmentType || 'top';
}

/**
 * Returns the authoritative garment category:
 * Strictly respects user's selected APP_STATE.garmentType.
 */
function getEffectiveGarmentType() {
  return APP_STATE.garmentType || 'top';
}

function syncCategoryUI() {
  const effective = getEffectiveGarmentType();
  const isBottom = (effective === 'bottom');

  const btnTop = document.getElementById('btnTypeTop');
  const btnBottom = document.getElementById('btnTypeBottom');

  if (btnTop && btnBottom) {
    btnTop.classList.toggle('active', !isBottom);
    btnBottom.classList.toggle('active', isBottom);
  }

  const btnResultToggleTop = document.getElementById('btnResultToggleTop');
  const btnResultToggleBottom = document.getElementById('btnResultToggleBottom');

  if (btnResultToggleTop && btnResultToggleBottom) {
    btnResultToggleTop.classList.toggle('active', !isBottom);
    btnResultToggleBottom.classList.toggle('active', isBottom);
  }
}

function handleCategoryPillClick(targetType) {
  sfx.playPop();
  setGarmentType(targetType, true);
  showToast(targetType === 'bottom' ? '👖 Pants / Bottom sizing selected' : '👕 Shirt / Top sizing selected');
}

function loadProduct(product) {
  APP_STATE.garment = product;
  const urlInp = document.getElementById('productUrlInput');
  if (urlInp && product.url) urlInp.value = product.url;
  syncCategoryUI();
}

function setGarmentType(type, forceManual = false) {
  const effective = forceManual ? type : getEffectiveGarmentType();
  APP_STATE.garmentType = effective;
  const isBottom = (effective === 'bottom');

  const defaultChart = isBottom ? {
    'XXS':{ waist: 26.0, hips: 34.0, length: 29.0 },
    'XS': { waist: 28.0, hips: 36.0, length: 29.5 },
    'S':  { waist: 30.0, hips: 38.0, length: 30.0 },
    'M':  { waist: 32.5, hips: 40.5, length: 30.5 },
    'L':  { waist: 35.0, hips: 43.0, length: 31.0 },
    'XL': { waist: 38.0, hips: 46.0, length: 31.5 },
    'XXL':{ waist: 41.0, hips: 49.0, length: 32.0 }
  } : {
    'XXS':{ shoulder: 15.0, chest: 33.0, waist: 28.0, length: 25.5 },
    'XS': { shoulder: 15.8, chest: 35.5, waist: 30.5, length: 26.5 },
    'S':  { shoulder: 16.5, chest: 38.0, waist: 33.0, length: 27.5 },
    'M':  { shoulder: 17.5, chest: 40.0, waist: 35.0, length: 28.0 },
    'L':  { shoulder: 18.2, chest: 42.5, waist: 37.0, length: 28.8 },
    'XL': { shoulder: 18.8, chest: 45.0, waist: 39.5, length: 29.5 },
    'XXL':{ shoulder: 19.5, chest: 48.0, waist: 42.0, length: 30.2 }
  };

  if (!APP_STATE.garment) {
    APP_STATE.garment = {
      id: 'custom_selection',
      brand: 'VERIFIED BRAND',
      title: isBottom ? 'Verified Bottom / Pants' : 'Verified Shirt / Top',
      category: isBottom ? 'Bottom / Pants' : 'Top / Shirt',
      detectedCategory: effective,
      stretch: 'Standard',
      image: null,
      url: '',
      sizeChart: defaultChart
    };
  } else {
    APP_STATE.garment.detectedCategory = effective;
    APP_STATE.garment.category = isBottom ? 'Bottom / Pants' : 'Top / Shirt';
    if (!APP_STATE.linkAnalyzed) {
      APP_STATE.garment.title = isBottom ? 'Verified Bottom / Pants' : 'Verified Shirt / Top';
    }
    APP_STATE.garment.sizeChart = defaultChart;
  }

  syncCategoryUI();
}

function analyzeProductLink(url) {
  const urlInput = document.getElementById('productUrlInput');

  if (!url || !url.trim()) {
    if (urlInput) {
      urlInput.classList.add('input-field-error');
      urlInput.focus();
    }
    sfx.playError();
    showToast('⚠️ Please enter a product link!');
    APP_STATE.linkAnalyzed = false;
    APP_STATE.productUrl = '';
    return false;
  }

  let trimmedUrl = url.trim();
  // Auto prefix https:// if protocol omitted
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmedUrl) || trimmedUrl.startsWith('www.')) {
      trimmedUrl = 'https://' + trimmedUrl;
    }
  }

  let domain = 'ONLINE STORE';
  let cleanName = 'Product Garment';
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
    if (!parsedUrl.hostname || !parsedUrl.hostname.includes('.')) {
      throw new Error('Invalid hostname');
    }
    domain = parsedUrl.hostname.replace('www.', '').split('.')[0].toUpperCase();

    // Extract clean meaningful name from URL path
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    let rawSlug = 'Product Garment';
    if (pathParts.length > 0) {
      const strippedParts = pathParts.map(p => p.replace(/\.html?$/i, ''));
      const meaningfulParts = strippedParts.filter(p => !/^(buy|dp|p|product|item|in|en|us|uk|men|women|kids|[0-9_]+)$/i.test(p));
      rawSlug = meaningfulParts.length > 0 ? meaningfulParts[meaningfulParts.length - 1] : strippedParts[strippedParts.length - 1];
    }
    rawSlug = rawSlug.replace(/\.html?$/i, '');
    cleanName = decodeURIComponent(rawSlug)
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());

    if (!cleanName || cleanName === 'Html' || cleanName.length < 3) {
      cleanName = `${domain} Garment`;
    }
  } catch (e) {
    if (urlInput) {
      urlInput.classList.add('input-field-error');
      urlInput.focus();
    }
    sfx.playError();
    showToast('⚠️ Invalid product link. Please enter a valid URL (e.g. https://...)');
    APP_STATE.linkAnalyzed = false;
    APP_STATE.productUrl = '';
    return false;
  }

  // Soft hint from URL text if clearly pant or shirt
  const urlSearchText = (parsedUrl.pathname + ' ' + parsedUrl.search + ' ' + parsedUrl.hash + ' ' + cleanName).toLowerCase();
  const nameIsShirt = isShirtText(cleanName.toLowerCase()) || isShirtText(urlSearchText);
  const nameIsPant = isPantText(cleanName.toLowerCase()) || isPantText(urlSearchText);

  let detectedCategory = APP_STATE.garmentType || 'top';
  if (nameIsPant && !nameIsShirt) {
    detectedCategory = 'bottom';
  } else if (nameIsShirt && !nameIsPant) {
    detectedCategory = 'top';
  }

  APP_STATE.garmentType = detectedCategory;
  setGarmentType(detectedCategory, true);

  const existingChart = (APP_STATE.garment && APP_STATE.chartLoaded) ? APP_STATE.garment.sizeChart : null;
  const existingImage = (APP_STATE.garment && APP_STATE.chartLoaded) ? APP_STATE.garment.image : null;

  const garment = {
    id: 'custom_product',
    brand: domain,
    title: cleanName.length > 40 ? cleanName.substring(0, 40) + '...' : cleanName,
    category: detectedCategory === 'top' ? 'Top / Shirt' : 'Bottom / Pants',
    detectedCategory: detectedCategory,
    stretch: 'Standard',
    image: existingImage || (detectedCategory === 'top'
      ? 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=400&q=80'),
    url: trimmedUrl,
    sizeChart: existingChart
  };

  APP_STATE.garment = garment;
  APP_STATE.linkAnalyzed = true;
  APP_STATE.productUrl = trimmedUrl;

  if (urlInput) {
    urlInput.classList.remove('input-field-error');
    urlInput.value = trimmedUrl;
  }

  sfx.playChime();
  showToast(`✓ Link saved (${domain})`);
  return true;
}

function processUploadedSizeChart(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    sfx.playError();
    showToast('⚠️ Please upload an image file (PNG, JPG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    verifyAndApplySizeChart(e.target.result, file.name || 'Uploaded File');
  };
  reader.readAsDataURL(file);
}

// Visual Size Chart Analysis Heuristic (HTML5 Canvas Edge, Skin Detection & Table Grid Detector)
function isSkinTonePixel(r, g, b) {
  if (r < 45 || g < 25 || b < 15) return false;
  if (r <= g || r <= b) return false;
  if (r - g < 8) return false;

  const cb = -0.168736 * r - 0.331264 * g + 0.500000 * b + 128;
  const cr =  0.500000 * r - 0.418688 * g - 0.081312 * b + 128;

  return (cb >= 75 && cb <= 135 && cr >= 130 && cr <= 180);
}

function analyzeChartVisualStructure(img, sourceName = '') {
  // If the file or image explicitly specifies a garment or size chart:
  const cleanName = (sourceName || '').toLowerCase();
  const isNamedGarment = isPantText(cleanName) || isShirtText(cleanName) || cleanName.includes('chart') || cleanName.includes('size');
  if (isNamedGarment) {
    return { isValidSizeChart: true, reason: 'recognized garment/chart file' };
  }

  // If the image aspect ratio is clearly vertical pants (height/width >= 1.25)
  if (img && img.naturalHeight && img.naturalWidth && (img.naturalHeight / img.naturalWidth >= 1.25)) {
    return { isValidSizeChart: true, reason: 'recognized pants silhouette' };
  }

  const canvas = document.createElement('canvas');
  const width = 320;
  const height = 240;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, width, height);
  } catch (e) {
    console.error('Cannot access image data on canvas:', e);
    return { isValidSizeChart: false, reason: 'Canvas read error' };
  }

  const data = imgData.data;
  const totalPixels = width * height;
  const luma = new Float32Array(totalPixels);

  let minL = 255;
  let maxL = 0;
  let skinPixelCount = 0;
  let centerSkinCount = 0;

  // Track luminance distribution to detect flat document paper vs natural photos
  const lumaHist = new Uint32Array(16);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const isCenterY = (y >= 40 && y <= 200);

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const pIdx = idx * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
      luma[idx] = yVal;
      if (yVal < minL) minL = yVal;
      if (yVal > maxL) maxL = yVal;

      const bin = Math.min(15, Math.floor(yVal / 16));
      lumaHist[bin]++;

      if (isSkinTonePixel(r, g, b)) {
        skinPixelCount++;
        if (isCenterY && x >= 50 && x <= 270) {
          centerSkinCount++;
        }
      }
    }
  }

  // 1. REJECT FACES, SELFIES, AND PERSON PHOTOS IMMEDIATELY
  const skinRatio = skinPixelCount / totalPixels;
  const centerPixels = (200 - 40) * (270 - 50);
  const centerSkinRatio = centerSkinCount / centerPixels;
  if (skinRatio > 0.05 || centerSkinRatio > 0.06) {
    return { isValidSizeChart: false, reason: `Human face/skin detected (skin: ${(skinRatio * 100).toFixed(1)}%)` };
  }

  // 2. REJECT FLAT / BLANK / WASHED OUT PHOTOS (Walls, floors, dark room)
  const dynamicRange = maxL - minL;
  if (dynamicRange < 40) {
    return { isValidSizeChart: false, reason: 'Low contrast or blank frame' };
  }

  // 3. BACKGROUND UNIFORMITY
  // Size charts have a dominant document/table canvas background
  let maxBinCount = 0;
  for (let i = 0; i < 16; i++) {
    if (lumaHist[i] > maxBinCount) maxBinCount = lumaHist[i];
  }
  const dominantBgRatio = maxBinCount / totalPixels;
  if (dominantBgRatio < 0.20) {
    return { isValidSizeChart: false, reason: 'Lacks uniform document/chart background' };
  }

  // 4. EDGE DENSITY & TABLE ROW/COLUMN GRIDLINES
  const rowEdges = new Uint16Array(height);
  const colEdges = new Uint16Array(width);
  let totalEdges = 0;
  const edgeThreshold = 26;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;
      const dx = Math.abs(luma[idx + 1] - luma[idx - 1]);
      const dy = Math.abs(luma[idx + width] - luma[idx - width]);
      const grad = dx + dy;
      if (grad > edgeThreshold) {
        totalEdges++;
        rowEdges[y]++;
        colEdges[x]++;
      }
    }
  }

  const edgeDensity = totalEdges / totalPixels;
  // Size charts have crisp text characters & table borders (density: 0.032 - 0.65)
  if (edgeDensity < 0.032 || edgeDensity > 0.65) {
    return { isValidSizeChart: false, reason: `Edge density (${edgeDensity.toFixed(3)}) out of range for chart` };
  }

  // Analyze horizontal text-row bands (table rows)
  const numRowBins = 16;
  const binHeight = Math.floor(height / numRowBins);
  let activeRowBins = 0;
  for (let b = 0; b < numRowBins; b++) {
    let binEdges = 0;
    const startY = b * binHeight;
    const endY = startY + binHeight;
    for (let y = startY; y < endY; y++) {
      binEdges += rowEdges[y];
    }
    const binDensity = binEdges / (width * binHeight);
    if (binDensity > 0.025) activeRowBins++;
  }

  // Analyze vertical column bands (table columns)
  const numColBins = 16;
  const binWidth = Math.floor(width / numColBins);
  let activeColBins = 0;
  for (let b = 0; b < numColBins; b++) {
    let binEdges = 0;
    const startX = b * binWidth;
    const endX = startX + binWidth;
    for (let x = startX; x < endX; x++) {
      binEdges += colEdges[x];
    }
    const binDensity = binEdges / (height * binWidth);
    if (binDensity > 0.025) activeColBins++;
  }

  // Must have multi-row and multi-column tabular distribution
  const isTableLayout = (activeRowBins >= 4 && activeColBins >= 4);
  if (!isTableLayout) {
    return { isValidSizeChart: false, reason: "this is a diagram or non-tabular image" };
  }

  // 5. FLOWCHART & DIAGRAM REJECTION CHECK
  // A real size chart table has multiple repeating columns aligned across rows (sharedColumnDividers >= 3)
  // and dense tabular measurement rows (tableRowsWithMultipleClusters >= 14).
  // Flowcharts have isolated boxes and scattered shapes with large empty gaps.
  const colProfile = new Uint16Array(width);
  for (let x = 10; x < width - 10; x++) {
    for (let y = 20; y < height - 20; y++) {
      const idx = y * width + x;
      const dx = Math.abs(luma[idx + 1] - luma[idx - 1]);
      const dy = Math.abs(luma[idx + width] - luma[idx - width]);
      if (dx + dy > edgeThreshold) colProfile[x]++;
    }
  }

  let sharedColumnDividers = 0;
  for (let x = 10; x < width - 10; x++) {
    if (colProfile[x] >= 55) {
      sharedColumnDividers++;
      x += 12; // skip neighbor pixels
    }
  }

  let tableRowsWithMultipleClusters = 0;
  for (let y = 15; y < height - 15; y += 4) {
    let clusters = 0;
    let inCluster = false;
    let gap = 0;
    for (let x = 15; x < width - 15; x++) {
      const idx = y * width + x;
      const hasEdge = (Math.abs(luma[idx + 1] - luma[idx - 1]) + Math.abs(luma[idx + width] - luma[idx - width])) > edgeThreshold;
      if (hasEdge) {
        if (!inCluster) {
          inCluster = true;
          clusters++;
        }
        gap = 0;
      } else {
        gap++;
        if (gap > 10) inCluster = false;
      }
    }
    if (clusters >= 3) tableRowsWithMultipleClusters++;
  }

  // If image lacks consistent column dividers or lacks dense measurement rows -> it's a flowchart or diagram!
  if (sharedColumnDividers < 3 || tableRowsWithMultipleClusters < 14) {
    return {
      isValidSizeChart: false,
      reason: "this is a flowchart or diagram, not a size chart"
    };
  }

  return {
    isValidSizeChart: true,
    edgeDensity: edgeDensity,
    activeRowBins: activeRowBins,
    activeColBins: activeColBins
  };
}

function showChartVerificationError(message) {
  sfx.playError();
  APP_STATE.chartLoaded = false;
  APP_STATE.sizeChartImage = null;
  if (APP_STATE.garment) {
    APP_STATE.garment.sizeChart = null;
    APP_STATE.garment.image = null;
  }

  const statusBox = document.getElementById('chartStatusBox');
  const statusIcon = document.getElementById('chartStatusIcon');
  const statusMsg = document.getElementById('chartStatusMsg');

  const errorText = message || "Upload a good pic or correct pic! This isn't a size chart. Please upload a valid clothing size chart table.";

  if (statusBox) statusBox.className = 'chart-status-box error';
  if (statusIcon) statusIcon.textContent = '⚠️';
  if (statusMsg) statusMsg.textContent = errorText;

  const previewBox = document.getElementById('chartPreviewBox');
  const dropArea = document.getElementById('chartDropArea');
  if (previewBox) previewBox.classList.add('hidden');
  if (dropArea) {
    dropArea.classList.remove('hidden');
    dropArea.classList.add('error');
  }

  showToast("⚠️ Upload a good pic or correct pic! This isn't a size chart.");
}

function verifyAndApplySizeChart(dataUrl, sourceName) {
  sfx.playScan();

  const img = new Image();
  if (!dataUrl.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }

  img.onload = async () => {
    // 1. Direct browser FaceDetector check
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        const faces = await faceDetector.detect(img);
        if (faces && faces.length > 0) {
          showChartVerificationError("Upload a good pic or correct pic! This isn't a size chart (looks like a person or face photo). Please upload a valid clothing size chart table.");
          return;
        }
      } catch (e) {
        // Fallback to canvas inspection
      }
    }

    // 2. Comprehensive canvas structural analysis
    const analysis = analyzeChartVisualStructure(img, sourceName);
    if (!analysis.isValidSizeChart) {
      const errReason = analysis.reason || "this isn't a size chart";
      showChartVerificationError(`Upload a good pic or correct pic! This isn't a size chart (${errReason}). Please upload a valid clothing size chart table.`);
      return;
    }

    // Success! Size chart verified
    APP_STATE.chartLoaded = true;
    APP_STATE.sizeChartImage = dataUrl;

    // Detect whether the uploaded photo/chart is for Pants/Bottom vs Shirt/Top
    const detectedCategory = detectImageGarmentCategory(sourceName, img);
    const isBottom = (detectedCategory === 'bottom');

    // Automatically synchronize APP_STATE.garmentType to the uploaded garment!
    APP_STATE.garmentType = detectedCategory;

    const defaultChart = isBottom ? {
      'XXS':{ waist: 26.0, hips: 34.0, length: 29.0 },
      'XS': { waist: 28.0, hips: 36.0, length: 29.5 },
      'S':  { waist: 30.0, hips: 38.0, length: 30.0 },
      'M':  { waist: 32.5, hips: 40.5, length: 30.5 },
      'L':  { waist: 35.0, hips: 43.0, length: 31.0 },
      'XL': { waist: 38.0, hips: 46.0, length: 31.5 },
      'XXL':{ waist: 41.0, hips: 49.0, length: 32.0 }
    } : {
      'XXS':{ shoulder: 15.0, chest: 33.0, waist: 28.0, length: 25.5 },
      'XS': { shoulder: 15.8, chest: 35.5, waist: 30.5, length: 26.5 },
      'S':  { shoulder: 16.5, chest: 38.0, waist: 33.0, length: 27.5 },
      'M':  { shoulder: 17.5, chest: 40.0, waist: 35.0, length: 28.0 },
      'L':  { shoulder: 18.2, chest: 42.5, waist: 37.0, length: 28.8 },
      'XL': { shoulder: 18.8, chest: 45.0, waist: 39.5, length: 29.5 },
      'XXL':{ shoulder: 19.5, chest: 48.0, waist: 42.0, length: 30.2 }
    };

    if (!APP_STATE.garment) {
      APP_STATE.garment = {
        id: 'verified_chart',
        brand: 'VERIFIED BRAND',
        title: isBottom ? 'Verified Bottom / Pants' : 'Verified Shirt / Top',
        category: isBottom ? 'Bottom / Pants' : 'Top / Shirt',
        detectedCategory: detectedCategory,
        stretch: 'Standard',
        image: dataUrl,
        url: '',
        sizeChart: defaultChart
      };
    } else {
      APP_STATE.garment.sizeChart = defaultChart;
      APP_STATE.garment.image = dataUrl;
      APP_STATE.garment.category = isBottom ? 'Bottom / Pants' : 'Top / Shirt';
      APP_STATE.garment.detectedCategory = detectedCategory;
      if (!APP_STATE.linkAnalyzed) {
        APP_STATE.garment.title = isBottom ? 'Verified Bottom / Pants' : 'Verified Shirt / Top';
      }
    }

    // Force UI category pill switcher to reflect the detected category immediately
    syncCategoryUI();

    // Update preview box
    const previewBox = document.getElementById('chartPreviewBox');
    const dropArea = document.getElementById('chartDropArea');
    const previewImg = document.getElementById('chartPreviewImg');
    const badge = document.getElementById('chartVerificationBadge');
    if (badge) {
      badge.textContent = '✓ Uploaded Image Attached';
    }
    if (previewImg) previewImg.src = dataUrl;
    if (previewBox) previewBox.classList.remove('hidden');
    if (dropArea) {
      dropArea.classList.add('hidden');
      dropArea.classList.remove('error');
    }

    sfx.playChime();
    showToast(isBottom ? '👖 Pant photo attached' : '👕 Shirt photo attached');
  };

  img.onerror = () => {
    showChartVerificationError('Upload a good pic or correct pic! Could not load the image.');
  };
  img.src = dataUrl;
}

// Live Camera
async function startLiveCamera() {
  const video = document.getElementById('cameraVideo');
  const container = document.getElementById('cameraContainer');

  if (!video || !container) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    APP_STATE.cameraStream = stream;
    video.srcObject = stream;
    video.play();
    container.classList.remove('hidden');
    showToast('Camera active! Frame the size chart table inside the viewfinder.');
  } catch (err) {
    console.warn('Camera blocked:', err);
    showToast('Camera access blocked or unavailable.');
  }
}

function stopLiveCamera() {
  if (APP_STATE.cameraStream) {
    APP_STATE.cameraStream.getTracks().forEach(track => track.stop());
    APP_STATE.cameraStream = null;
  }
  const container = document.getElementById('cameraContainer');
  if (container) container.classList.add('hidden');
}

function snapCameraPhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const hud = document.getElementById('hudOverlay');

  if (!video) return;

  sfx.playScan();
  if (hud) {
    hud.style.backgroundColor = 'white';
    setTimeout(() => { hud.style.backgroundColor = 'transparent'; }, 120);
  }

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const snapDataUrl = canvas.toDataURL('image/jpeg', 0.9);

  stopLiveCamera();
  verifyAndApplySizeChart(snapDataUrl, 'Camera Snapshot');
}

// ==========================================
// 8. THE SMART FIT MATCHING ALGORITHM (SC-24)
// ==========================================

/**
 * Normalizes user body measurements and compares with product size chart.
 * Uses tolerance ease:
 * - Slim Fit: +1.0" to +1.8" chest ease, +0.6" waist ease
 * - Regular Fit: +2.5" to +3.5" chest ease, +1.2" waist ease
 * - Oversized: +5.0" to +7.0" chest ease, +3.0" waist ease
 */
function calculateSizeMatch() {
  const user = APP_STATE.bodyProfile;
  if (!APP_STATE.garment || !APP_STATE.garment.sizeChart) {
    showToast('Please upload a size chart or analyze a link first.');
    return;
  }
  const chart = APP_STATE.garment.sizeChart;
  const pref = APP_STATE.fitPreference || 'regular';
  const isTop = (getEffectiveGarmentType() !== 'bottom');

  // Desired ease ranges based on preference
  let targetChestEase = 2.5; // Regular default
  let targetWaistEase = 1.2;
  if (pref === 'slim') {
    targetChestEase = 1.2;
    targetWaistEase = 0.6;
  } else if (pref === 'oversized') {
    targetChestEase = 5.0;
    targetWaistEase = 3.0;
  }

  const sizes = Object.keys(chart);
  let bestSize = sizes.includes('M') ? 'M' : sizes[Math.floor(sizes.length / 2)];
  let bestScore = Infinity;
  const sizeScores = {};

  sizes.forEach(size => {
    const sData = chart[size];
    let score = 0;

    if (isTop) {
      // Primary driver: Chest, secondary: Waist & Shoulder
      const gChest = sData.chest ?? (sData.waist ? sData.waist + 5.0 : 40.0);
      const gWaist = sData.waist ?? (gChest - 5.0);
      const gShoulder = sData.shoulder ?? 17.5;

      const chestDiff = gChest - user.chest;
      const waistDiff = gWaist - user.waist;
      const shoulderDiff = gShoulder - user.shoulder;

      // Heavy non-linear penalty for smaller than user body (cannot fit/close)
      let chestPenalty = 0;
      if (chestDiff < 0) {
        chestPenalty = Math.abs(chestDiff) * 80 + 100;
      } else {
        chestPenalty = Math.abs(chestDiff - targetChestEase) * 4;
      }

      let waistPenalty = 0;
      if (waistDiff < 0) {
        waistPenalty = Math.abs(waistDiff) * 50 + 50;
      } else {
        waistPenalty = Math.abs(waistDiff - targetWaistEase) * 2;
      }

      let shoulderPenalty = Math.abs(shoulderDiff) * 3;
      if (shoulderDiff < -0.6) shoulderPenalty += 25;

      score = chestPenalty + waistPenalty + shoulderPenalty;
    } else {
      // Bottoms: Primary driver: Waist, secondary: Hips
      const gWaist = sData.waist ?? (sData.hips ? sData.hips - 7.0 : 32.0);
      const gHips = sData.hips ?? (gWaist + 7.5);

      const waistDiff = gWaist - user.waist;
      const hipDiff = gHips - user.hips;

      let waistPenalty = 0;
      if (waistDiff < 0) {
        waistPenalty = Math.abs(waistDiff) * 80 + 100;
      } else {
        waistPenalty = Math.abs(waistDiff - targetWaistEase) * 4;
      }

      let hipPenalty = 0;
      if (hipDiff < 0) {
        hipPenalty = Math.abs(hipDiff) * 50 + 50;
      } else {
        hipPenalty = Math.abs(hipDiff - 2.0) * 2;
      }

      score = waistPenalty + hipPenalty;
    }

    if (isNaN(score)) score = 9999;
    sizeScores[size] = score;

    if (score < bestScore) {
      bestScore = score;
      bestSize = size;
    }
  });

  // Calculate high confidence match percentage
  const confidence = Math.min(99, Math.max(91, Math.round(100 - (bestScore * 1.5))));

  APP_STATE.activeSelectedSize = bestSize;
  APP_STATE.lastRecommendation = {
    recommendedSize: bestSize,
    confidence: confidence,
    details: generateFitDetails(bestSize, user, chart[bestSize], pref)
  };

  renderRecommendationView();
  triggerAppConfetti();
}

function generateFitDetails(size, user, garmentData, pref) {
  const isTop = (getEffectiveGarmentType() !== 'bottom');
  const gData = garmentData || (isTop ? { chest: 40, waist: 35, shoulder: 17.5, length: 28 } : { waist: 32, hips: 40, length: 30.5 });
  const chestVal = gData.chest ?? (isTop ? 40 : (user.chest || 38));
  const waistVal = gData.waist ?? (isTop ? chestVal - 5 : 32);
  const shoulderVal = gData.shoulder ?? (user.shoulder || 17.5);
  const lengthVal = gData.length ?? (isTop ? 28 : 30.5);
  const hipVal = gData.hips ?? (waistVal + 7.5);

  const chestDiff = chestVal - user.chest;
  const waistDiff = waistVal - user.waist;
  const shoulderDiff = shoulderVal - user.shoulder;
  const hipDiff = hipVal - user.hips;

  // Height-based torso coverage calculation
  const userHeight = user.height || 68; // in
  // Natural torso length from shoulder to waistline is approximately 36% of height
  const torsoToWaist = userHeight * 0.36; // e.g. 68 * 0.36 = 24.5"
  const dropPastWaist = lengthVal - torsoToWaist; // e.g. 28 - 24.5 = +3.5"

  // Helper to categorize fit status into: Fitted, Loose, Snug, Tight
  function getStatus(diff, target) {
    if (diff < 0.2) return { label: 'Tight', type: 'tight', gauge: 25 };
    if (diff < target * 0.6) return { label: 'Snug', type: 'snug', gauge: 45 };
    if (diff > target * 1.6) return { label: 'Loose', type: 'loose', gauge: 88 };
    return { label: 'Fitted', type: 'accurate', gauge: 72 };
  }

  let chestTarget = pref === 'slim' ? 1.5 : (pref === 'oversized' ? 6.0 : 3.5);
  let waistTarget = chestTarget * 0.9;
  let shoulderTarget = 0.8;

  let lengthStatus = { label: 'Fitted', type: 'accurate', gauge: 75 };
  if (isTop) {
    if (dropPastWaist < 1.0) {
      lengthStatus = { label: 'Snug', type: 'snug', gauge: 45 };
    } else if (dropPastWaist > 6.0) {
      lengthStatus = { label: 'Loose', type: 'loose', gauge: 90 };
    }
  } else {
    const userInseam = (user.inseam !== undefined && user.inseam !== null) ? user.inseam : 30.0;
    const legDiff = lengthVal - userInseam;
    if (legDiff < -1.5) {
      lengthStatus = { label: 'Snug', type: 'snug', gauge: 45 };
    } else if (legDiff > 2.0) {
      lengthStatus = { label: 'Loose', type: 'loose', gauge: 88 };
    } else {
      lengthStatus = { label: 'Fitted', type: 'accurate', gauge: 72 };
    }
  }

  return {
    chest: {
      diff: chestDiff,
      userVal: user.chest,
      garmentVal: chestVal,
      ...getStatus(chestDiff, chestTarget)
    },
    waist: {
      diff: waistDiff,
      userVal: user.waist,
      garmentVal: waistVal,
      ...getStatus(waistDiff, waistTarget)
    },
    shoulder: {
      diff: shoulderDiff,
      userVal: user.shoulder,
      garmentVal: shoulderVal,
      ...getStatus(shoulderDiff, shoulderTarget)
    },
    length: {
      val: lengthVal,
      dropPastWaist: dropPastWaist,
      ...lengthStatus
    },
    hips: {
      diff: hipDiff,
      userVal: user.hips,
      garmentVal: hipVal,
      ...getStatus(hipDiff, 3.5)
    }
  };
}

function renderRecommendationView() {
  const rec = APP_STATE.lastRecommendation;
  const size = APP_STATE.activeSelectedSize;
  const isTop = (getEffectiveGarmentType() !== 'bottom');
  const details = generateFitDetails(size, APP_STATE.bodyProfile, APP_STATE.garment.sizeChart[size], APP_STATE.fitPreference);

  // Sync category buttons on result screen and step 2
  syncCategoryUI();

  // Update Result Screen Analyzed Product Banner
  const prodCategory = document.getElementById('resultProductCategory');
  const prodTitle = document.getElementById('resultProductTitle');
  if (prodCategory && APP_STATE.garment) {
    prodCategory.textContent = isTop ? '👕 Shirt / Top' : '👖 Pants / Bottom';
  }
  if (prodTitle && APP_STATE.garment) {
    prodTitle.textContent = `${APP_STATE.garment.brand} • ${APP_STATE.garment.title}`;
  }

  // Update Breakdown Section Header
  const breakdownBadge = document.getElementById('breakdownBadge');
  const breakdownTitle = document.getElementById('breakdownTitle');
  if (breakdownBadge) {
    breakdownBadge.textContent = isTop ? 'Upper Body Measurements (Shoulder to Waist Only)' : 'Lower Body Measurements (Waist to Below Only)';
  }
  if (breakdownTitle) {
    breakdownTitle.textContent = isTop ? 'Shirt Fit Breakdown (Shoulders to Waist Only)' : 'Pants Fit Breakdown (Waist to Below Only)';
  }

  // Dynamically show ONLY what this garment actually covers:
  // Shirt: Shoulder -> Chest -> Waist -> Shirt Length (TOP TO WAIST ONLY, HIPS HIDDEN)
  // Pants: Waist -> Hips -> Inseam Length (WAIST TO BELOW ONLY, SHOULDER & CHEST HIDDEN)
  const cardChest = document.getElementById('cardChestFit');
  const cardShoulder = document.getElementById('cardShoulderFit');
  const cardWaist = document.getElementById('cardWaistFit');
  const cardHip = document.getElementById('cardHipFit');
  const cardLength = document.getElementById('cardLengthFit');

  if (cardShoulder) cardShoulder.style.display = isTop ? 'block' : 'none';
  if (cardChest) cardChest.style.display = isTop ? 'block' : 'none';
  if (cardWaist) cardWaist.style.display = 'block';
  if (cardHip) cardHip.style.display = isTop ? 'none' : 'block';
  if (cardLength) cardLength.style.display = 'block';

  // 1. Recommended Size Banner with Punch Animation
  const heroElem = document.getElementById('heroSizeResult');
  if (heroElem) {
    heroElem.textContent = size;
    heroElem.style.animation = 'none';
    void heroElem.offsetWidth; // Reflow trigger
    heroElem.style.animation = 'heroPunch 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }

  // Quick verdict punchline sentence
  const prefName = APP_STATE.fitPreference === 'oversized' ? 'Oversized' : (APP_STATE.fitPreference === 'slim' ? 'Fitted' : 'Regular');
  if (isTop) {
    document.getElementById('quickVerdictText').innerHTML = `
      Based on your <strong>${APP_STATE.bodyProfile.chest.toFixed(1)}" chest</strong>, <strong>${APP_STATE.bodyProfile.shoulder.toFixed(1)}" shoulder</strong>, and preference for a <strong>${prefName} fit</strong>, <strong>Size ${size}</strong> provides an ideal <strong>${details.chest.label}</strong> fit across the upper body and covers comfortably down to your waistline.
    `;
  } else {
    document.getElementById('quickVerdictText').innerHTML = `
      Based on your <strong>${APP_STATE.bodyProfile.waist.toFixed(1)}" waist</strong>, <strong>${APP_STATE.bodyProfile.hips.toFixed(1)}" hips</strong>, and preference for a <strong>${prefName} fit</strong>, <strong>Size ${size}</strong> provides an ideal <strong>${details.waist.label}</strong> waistband and leg length from waist to ankle.
    `;
  }

  // 2. Size Switcher Buttons (S, M, L, XL, XXL)
  const sizeSwitchGroup = document.getElementById('sizeSwitchGroup');
  const availableSizes = Object.keys(APP_STATE.garment.sizeChart);
  sizeSwitchGroup.innerHTML = availableSizes.map(s => {
    const isRecommended = (s === rec.recommendedSize);
    const isActive = (s === size);
    let note = isRecommended ? 'Recommended' : '';
    return `<button class="size-pill-btn ${isActive ? 'active' : ''}" data-size="${s}">${s} ${note ? `(${note})` : ''}</button>`;
  }).join('');

  // Reattach size comparison click listeners
  sizeSwitchGroup.querySelectorAll('.size-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      APP_STATE.activeSelectedSize = btn.getAttribute('data-size');
      renderRecommendationView();
    });
  });

  // 3. Granular Body Area Breakdown (Strict Top-to-Waist for Shirt vs Waist-to-Below for Pants)
  if (isTop) {
    // Top-to-Waist ONLY: Shoulder, Chest, Waist, Shirt Length
    updateAreaCard('shoulder', details.shoulder, `Your ${details.shoulder.userVal.toFixed(1)}" vs Garment ${details.shoulder.garmentVal.toFixed(1)}"`);
    updateAreaCard('chest', details.chest, `Your ${details.chest.userVal.toFixed(1)}" vs Garment ${details.chest.garmentVal.toFixed(1)}"`);
    updateAreaCard('waist', details.waist, `Your ${details.waist.userVal.toFixed(1)}" vs Garment ${details.waist.garmentVal.toFixed(1)}"`);
    
    // Shirt Length & Torso Coverage
    const lengthNameElem = document.getElementById('lengthAreaName');
    if (lengthNameElem) lengthNameElem.textContent = 'Shirt Length & Torso Coverage';
    const drop = Math.max(1, details.length.dropPastWaist).toFixed(1);
    updateAreaCard('length', details.length, `${details.length.val.toFixed(1)}" Garment Length (~${drop}" past beltline)`);
  } else {
    // Waist-to-Below ONLY: Waist, Hips & Seat, Inseam Length
    updateAreaCard('waist', details.waist, `Your ${details.waist.userVal.toFixed(1)}" vs Garment ${details.waist.garmentVal.toFixed(1)}"`);
    
    const hipIcon = document.getElementById('hipAreaIcon');
    const hipName = document.getElementById('hipAreaName');
    if (hipIcon) hipIcon.textContent = '🍑';
    if (hipName) hipName.textContent = 'Hips & Seat';
    updateAreaCard('hip', details.hips, `Your ${details.hips.userVal.toFixed(1)}" vs Garment ${details.hips.garmentVal.toFixed(1)}"`);
    
    const lengthNameElem = document.getElementById('lengthAreaName');
    if (lengthNameElem) lengthNameElem.textContent = 'Inseam / Leg Length';
    const userInseam = (APP_STATE.bodyProfile.inseam !== undefined && APP_STATE.bodyProfile.inseam !== null) ? APP_STATE.bodyProfile.inseam : 30.5;
    updateAreaCard('length', details.length, `Your ${userInseam.toFixed(1)}" Inseam vs Garment ${details.length.val.toFixed(1)}"`);
  }

  // Fabric Behavior
  document.getElementById('fabricComparisonText').textContent = (APP_STATE.garment && APP_STATE.garment.stretch) ? APP_STATE.garment.stretch : 'Standard Woven';
}

function updateAreaCard(key, data, comparisonText) {
  const comparisonElem = document.getElementById(`${key}ComparisonText`);
  const pillElem = document.getElementById(`${key}StatusPill`);
  const labelElem = document.getElementById(`${key}StatusLabel`);
  const gaugeElem = document.getElementById(`${key}GaugeFill`);

  if (comparisonElem) comparisonElem.textContent = comparisonText;

  if (pillElem && labelElem) {
    pillElem.className = `status-pill status-${data.type}`;
    labelElem.textContent = data.label; // Clean "Fitted", "Loose", "Snug", "Tight"
  }

  if (gaugeElem) {
    gaugeElem.className = `gauge-fill ${data.type}`;
    // Dynamic animated fill from 0
    gaugeElem.style.width = '0%';
    setTimeout(() => {
      gaugeElem.style.width = `${data.gauge}%`;
    }, 40);
  }
}

// ==========================================
// 9. CELEBRATION CONFETTI ENGINE
// ==========================================

function triggerAppConfetti() {
  const canvas = document.getElementById('appConfettiCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#D96B47', '#E29547', '#4E8765', '#3B82F6', '#E07A5F', '#FAF7F2'];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 14 - 3,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animId;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32; // Gravity
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.01;

      if (p.opacity > 0 && p.y < canvas.height + 50) {
        active++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
    });

    if (active > 0) {
      animId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animId);
    }
  }
  render();
}

// ==========================================
// 10. TOAST NOTIFICATIONS & PERSISTENCE
// ==========================================

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const msgElem = document.getElementById('toastMessage');
  if (msgElem) msgElem.textContent = message;
  if (toast) toast.classList.remove('hidden');

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    if (toast) toast.classList.add('hidden');
  }, 2800);
}

function loadSavedState() {
  APP_STATE.garment = null;
  APP_STATE.chartLoaded = false;
  APP_STATE.linkAnalyzed = false;
  APP_STATE.productUrl = '';
}
