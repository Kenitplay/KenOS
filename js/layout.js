// ============================================================
// KenOS Portfolio - Layout Switching & Mode Transition Controller
// Cinematic circular-reveal transition between Web Mode and Desktop OS
// Desktops & laptops (>= 1024px with a mouse/trackpad) default to Desktop OS;
// phones, tablets and smaller windows default to the website
// ============================================================

(function () {
  'use strict';

  // Desktop OS is the default on desktops & laptops (wide screen + mouse/trackpad);
  // phones, tablets and narrow windows default to the website.
  const LARGE_SCREEN_MIN = 1024;
  const STORAGE_PREFIX = 'kenos_layout_mode_v4_';

  function isLargeScreen() {
    const wide = window.innerWidth >= LARGE_SCREEN_MIN;
    const finePointer = !window.matchMedia ||
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return wide && finePointer;
  }

  function screenClass() {
    return isLargeScreen() ? 'large' : 'small';
  }

  function defaultModeFor(cls) {
    return cls === 'large' ? 'desktop' : 'normal';
  }

  // A visitor's explicit choice is remembered per screen class, so switching to
  // the website on a laptop doesn't force the OS view onto their phone (or vice versa).
  // localStorage can throw (private mode, sandboxed iframes) — never let that break the page.
  function readSavedMode(cls) {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + (cls || screenClass()));
      return saved === 'normal' || saved === 'desktop' ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(STORAGE_PREFIX + screenClass(), mode);
    } catch (e) {
      // Storage unavailable — the choice just won't persist
    }
  }

  // Kept for the public API (older callers)
  function isPhoneOrTablet() {
    return !isLargeScreen();
  }

  function getInitialMode() {
    return readSavedMode() || defaultModeFor(screenClass());
  }

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let currentMode = getInitialMode();
  let isTransitioning = false;
  let activeTransitionTimeouts = [];

  // Play subtle futuristic cyber chime (Web Audio API)
  function playCyberTone(freq, type = 'sine', duration = 0.16) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + duration);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio not permitted / supported, fail silently
    }
  }

  // Apply layout mode DOM classes and styles
  function setLayoutMode(mode, userInitiated = false) {
    currentMode = mode;
    const body = document.body;
    const desktopArea = document.getElementById('desktopArea');
    const normalSite = document.getElementById('normalSite');
    const taskbar = document.getElementById('taskbar');

    if (userInitiated) {
      saveMode(mode);
    }

    if (mode === 'normal') {
      body.classList.remove('layout-desktop');
      body.classList.add('layout-normal');

      if (normalSite) {
        normalSite.style.display = 'block';
      }
      if (desktopArea) {
        desktopArea.classList.remove('visible');
      }

      // Close open desktop windows
      const windowContainer = document.getElementById('windowContainer');
      if (windowContainer) {
        const openWindows = windowContainer.querySelectorAll('.kenos-window');
        openWindows.forEach(win => {
          win.style.display = 'none';
        });
      }

      // Reset scroll position to top
      if (userInitiated) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

    } else {
      body.classList.remove('layout-normal');
      body.classList.add('layout-desktop');

      if (normalSite) {
        normalSite.style.display = 'none';
      }
      if (desktopArea) {
        desktopArea.classList.add('visible');
      }
      if (taskbar) {
        taskbar.classList.add('visible');
      }

      // Re-align desktop icons if function exists
      if (typeof window.resetIconPositions === 'function') {
        window.resetIconPositions({ animate: false });
      }

    }

    updateToggleButtons();
  }

  // Clear any existing transition timeouts
  function clearTransitionTimeouts() {
    activeTransitionTimeouts.forEach(t => clearTimeout(t));
    activeTransitionTimeouts = [];
  }

  // ------------------------------------------------------------
  // Entrance choreography after boot / mode switch
  // ------------------------------------------------------------
  let entranceTimer = null;
  function playEntrance(mode) {
    const body = document.body;
    if (prefersReducedMotion) return;

    // Index icons / hero items so CSS can stagger them
    document.querySelectorAll('#desktopArea .desktop-icon').forEach((el, i) => el.style.setProperty('--i', i));
    document.querySelectorAll('.normal-hero > *').forEach((el, i) => el.style.setProperty('--i', i));

    body.classList.remove('enter-desktop', 'enter-normal');
    void body.offsetWidth; // restart animations
    body.classList.add(mode === 'normal' ? 'enter-normal' : 'enter-desktop');

    clearTimeout(entranceTimer);
    entranceTimer = setTimeout(() => {
      body.classList.remove('enter-desktop', 'enter-normal');
    }, 1800);
  }

  // Smooth ease used for both the bar and the % counter so they stay in sync
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Swap status text with a quick slide/fade
  function swapText(el, text) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove('text-swap');
    void el.offsetWidth;
    el.classList.add('text-swap');
  }

  // Orchestrate the cinematic switch between modes:
  //  1. overlay irises open from the button that was clicked
  //  2. HUD card + progress bar run on one eased timeline
  //  3. layout swaps underneath, overlay dissolves, new view cascades in
  function switchModeWithTransition(targetMode, userInitiated = true, originEl = null) {
    if (isTransitioning) return;
    if (targetMode === currentMode) return;

    const overlay = document.getElementById('kenosModeTransition');

    if (!overlay) {
      setLayoutMode(targetMode, userInitiated);
      playEntrance(targetMode);
      return;
    }

    isTransitioning = true;
    clearTransitionTimeouts();

    const icon = document.getElementById('transitionIcon');
    const actionLabel = document.getElementById('transitionActionLabel');
    const targetTitle = document.getElementById('transitionTargetTitle');
    const statusDesc = document.getElementById('transitionStatusDesc');
    const modeTag = document.getElementById('transitionModeTag');
    const sysCode = document.getElementById('transitionSysCode');
    const stageText = document.getElementById('transitionStageText');
    const progressFill = document.getElementById('transitionProgressFill');
    const percentText = document.getElementById('transitionPercentText');

    // Timeline (ms). Reduced-motion visitors get a short, simple crossfade.
    const T = prefersReducedMotion
      ? { progress: 300, swap: 250, out: 350, done: 600 }
      : { progress: 1900, swap: 1750, out: 2050, done: 2650 };

    const toWeb = targetMode === 'normal';
    const header = toWeb
      ? { code: 'SYS::VIEW_WEB_0x5F', tag: 'WEB_MODE', title: 'WEB PORTFOLIO', icon: 'fas fa-globe' }
      : { code: 'SYS::KERNEL_RESTORE_0x8C', tag: 'DESKTOP_OS', title: 'KENOS DESKTOP OS', icon: 'fas fa-desktop' };

    // Stages fire when the eased progress crosses each threshold
    const stages = toWeb ? [
      { at: 0, desc: 'Disconnecting KenOS Desktop workspace...', stage: 'DISCONNECTING_SESSION', tone: [440, 'sine'] },
      { at: 0.3, desc: 'Unmounting desktop window managers & widgets...', stage: 'UNMOUNTING_WORKSPACE', tone: [520, 'sine'] },
      { at: 0.55, desc: 'Compiling responsive web layout & navigation...', stage: 'COMPILING_WEB_COMPONENTS', tone: [660, 'sine'] },
      { at: 0.8, desc: 'Mounting portfolio sections & DOM viewport...', stage: 'RENDERING_VIEWPORT', tone: [784, 'sine'] },
      { at: 1, desc: 'Web portfolio interface ready.', stage: 'SYSTEM_SYNCHRONIZED', tone: [880, 'sine', 0.22], ok: true }
    ] : [
      { at: 0, desc: 'Suspending Web Portfolio runtime...', stage: 'SUSPENDING_WEB_VIEW', tone: [520, 'triangle'] },
      { at: 0.3, desc: 'Initializing KenOS Kernel v2.0 subsystems...', stage: 'LOADING_KERNEL_MODULES', tone: [620, 'triangle'] },
      { at: 0.55, desc: 'Mounting desktop filesystem & taskbar services...', stage: 'MOUNTING_ENVIRONMENT', tone: [740, 'triangle'] },
      { at: 0.8, desc: 'Aligning desktop coordinates & widgets...', stage: 'ATTACHING_DESKTOP_ENV', tone: [880, 'triangle'] },
      { at: 1, desc: 'KenOS Desktop OS ready.', stage: 'KERNEL_ATTACHED', tone: [987, 'triangle', 0.22], ok: true }
    ];

    // HUD setup
    if (icon) icon.className = header.icon;
    if (actionLabel) actionLabel.textContent = 'SWITCHING SYSTEM INTERFACE';
    if (targetTitle) targetTitle.textContent = header.title;
    if (modeTag) modeTag.textContent = header.tag;
    if (sysCode) sysCode.textContent = header.code;
    if (statusDesc) statusDesc.textContent = stages[0].desc;
    if (stageText) stageText.textContent = '[ 0% ] ' + stages[0].stage;
    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
    }
    if (percentText) percentText.textContent = '0%';

    // Iris origin: centre of the clicked control (falls back to screen centre)
    let ox = window.innerWidth / 2;
    let oy = window.innerHeight / 2;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      if (r.width || r.height) {
        ox = r.left + r.width / 2;
        oy = r.top + r.height / 2;
      }
    }
    const radius = Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)) + 40;
    overlay.style.setProperty('--tx', ox + 'px');
    overlay.style.setProperty('--ty', oy + 'px');
    overlay.style.setProperty('--tr', radius + 'px');
    overlay.style.setProperty('--tr-n', (radius / 10).toFixed(1));
    overlay.classList.toggle('to-web', toWeb);
    overlay.classList.toggle('to-desktop', !toWeb);

    // Step 1: open overlay (old view recedes underneath)
    document.body.classList.add('mode-transitioning');
    overlay.classList.remove('closing', 'complete');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    // Step 2: one eased timeline drives bar, %, and stage text together
    let stageIndex = 0;
    playCyberTone(stages[0].tone[0], stages[0].tone[1], stages[0].tone[2] || 0.14);
    const startTime = performance.now();
    function tick(now) {
      if (!isTransitioning) return;
      const t = Math.min(1, (now - startTime) / T.progress);
      const p = easeInOutCubic(t);
      const pct = Math.round(p * 100);
      if (progressFill) progressFill.style.width = (p * 100).toFixed(2) + '%';
      if (percentText) percentText.textContent = pct + '%';

      while (stageIndex < stages.length - 1 && p >= stages[stageIndex + 1].at) {
        stageIndex++;
        const st = stages[stageIndex];
        swapText(statusDesc, st.desc);
        playCyberTone(st.tone[0], st.tone[1], st.tone[2] || 0.12);
        if (st.ok) overlay.classList.add('complete');
      }
      if (stageText) {
        const st = stages[stageIndex];
        stageText.textContent = (st.ok ? '[ OK ] ' : '[ ' + pct + '% ] ') + st.stage;
      }
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Step 3: swap layout underneath the overlay
    activeTransitionTimeouts.push(setTimeout(() => {
      if (!isTransitioning) return;
      setLayoutMode(targetMode, userInitiated);
    }, T.swap));

    // Step 4: dissolve overlay and play the new view's entrance
    activeTransitionTimeouts.push(setTimeout(() => {
      if (!isTransitioning) return;
      document.body.classList.remove('mode-transitioning');
      overlay.classList.remove('active');
      overlay.classList.add('closing');
      playEntrance(targetMode);
    }, T.out));

    // Step 5: cleanup
    activeTransitionTimeouts.push(setTimeout(() => {
      overlay.classList.remove('closing', 'complete', 'to-web', 'to-desktop');
      isTransitioning = false;
      clearTransitionTimeouts();
    }, T.done));
  }

  // Update button visibility & titles
  function updateToggleButtons() {
    const taskbarBtn = document.getElementById('taskbarLayoutToggleBtn');
    if (taskbarBtn) {
      taskbarBtn.title = currentMode === 'desktop'
        ? 'Switch to Normal Website View'
        : 'Switch to KenOS Desktop View';
      taskbarBtn.style.display = currentMode === 'desktop' ? 'flex' : 'none';
    }

    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      floatingBtn.style.display = currentMode === 'normal' ? 'flex' : 'none';
    }

    const navDesktopBtn = document.getElementById('navDesktopToggleBtn');
    if (navDesktopBtn) {
      navDesktopBtn.style.display = currentMode === 'normal' ? 'inline-flex' : 'none';
    }

    const heroDesktopBtn = document.getElementById('heroDesktopToggleBtn');
    if (heroDesktopBtn) {
      heroDesktopBtn.style.display = currentMode === 'normal' ? 'inline-flex' : 'none';
    }

    const footerDesktopBtn = document.getElementById('footerDesktopToggleBtn');
    if (footerDesktopBtn) {
      footerDesktopBtn.style.display = currentMode === 'normal' ? 'inline-flex' : 'none';
    }

    const mobileMenuDesktopBtn = document.getElementById('mobileMenuDesktopBtn');
    if (mobileMenuDesktopBtn) {
      mobileMenuDesktopBtn.style.display = currentMode === 'normal' ? 'flex' : 'none';
    }

    const mobileDesktopPill = document.getElementById('desktopMobileToggleBtn');
    if (mobileDesktopPill) {
      mobileDesktopPill.style.display = currentMode === 'desktop' ? '' : 'none';
    }
  }

  // Mobile menu dropdown
  function setupMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('normalMobileMenu');
    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = menu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
      }
    });

    menu.querySelectorAll('a, button').forEach(item => {
      item.addEventListener('click', function () {
        menu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });

    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== toggleBtn) {
        menu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      }
    });
  }

  // Highlight the nav link of the section currently in view
  function setupScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const links = document.querySelectorAll('.normal-nav-links .normal-nav-link, .normal-mobile-menu .normal-nav-link');
    const sections = document.querySelectorAll('#normalSite section[id^="normal-"]');
    const visible = new Map();

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      let bestId = null;
      let bestRatio = 0;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
      });
      links.forEach(link => {
        const isActive = bestId && link.getAttribute('href') === '#' + bestId;
        link.classList.toggle('active', !!isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-72px 0px -45% 0px', threshold: [0, 0.15, 0.35, 0.6] });

    sections.forEach(section => observer.observe(section));
  }

  // Fade sections/cards in as they scroll into view (skipped for reduced motion)
  function setupScrollReveal() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll(
      '#normalSite .section-header, #normalSite .cyber-window-card, #normalSite .about-side-cards, ' +
      '#normalSite .exp-timeline-card, #normalSite .normal-project-card, #normalSite .skills-category-card, ' +
      '#normalSite .cert-item-card, #normalSite .contact-method-card, #normalSite .contact-response-note'
    );
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(el => {
      // Stagger siblings slightly for a cascading effect
      const siblings = Array.from(el.parentElement ? el.parentElement.children : []);
      const index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--reveal-delay', Math.min(index, 6) * 60 + 'ms');
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  // Smooth scroll for nav anchor links
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#normal-"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetElem = document.querySelector(targetId);
          if (targetElem) {
            e.preventDefault();
            const navHeight = 72;
            const elementPosition = targetElem.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  // Attach event listeners to all layout switch buttons
  function bindToggleTriggers() {
    // 1. Taskbar toggle button (Desktop OS view -> switch to Normal Web Mode)
    const taskbarBtn = document.getElementById('taskbarLayoutToggleBtn');
    if (taskbarBtn) {
      taskbarBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchModeWithTransition('normal', true, e.currentTarget);
      });
      taskbarBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchModeWithTransition('normal', true, e.currentTarget);
        }
      });
    }

    // 2. Normal navbar desktop toggle button (Web Mode -> switch to Desktop OS)
    const navBtn = document.getElementById('navDesktopToggleBtn');
    if (navBtn) {
      navBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchModeWithTransition('desktop', true, e.currentTarget);
      });
    }

    // 3. Hero desktop toggle button
    const heroBtn = document.getElementById('heroDesktopToggleBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchModeWithTransition('desktop', true, e.currentTarget);
      });
    }

    // 4. Footer desktop toggle button
    const footerBtn = document.getElementById('footerDesktopToggleBtn');
    if (footerBtn) {
      footerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchModeWithTransition('desktop', true, e.currentTarget);
      });
    }

    // 5. Floating toggle button
    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const nextMode = currentMode === 'normal' ? 'desktop' : 'normal';
        switchModeWithTransition(nextMode, true, e.currentTarget);
      });
      floatingBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const nextMode = currentMode === 'normal' ? 'desktop' : 'normal';
          switchModeWithTransition(nextMode, true, e.currentTarget);
        }
      });
    }

    // 6. Mobile dropdown menu desktop toggle button
    const mobileMenuDesktopBtn = document.getElementById('mobileMenuDesktopBtn');
    if (mobileMenuDesktopBtn) {
      mobileMenuDesktopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const menu = document.getElementById('normalMobileMenu');
        if (menu) menu.classList.remove('open');
        const toggleBtn = document.getElementById('mobileMenuToggle');
        if (toggleBtn) {
          const icon = toggleBtn.querySelector('i');
          if (icon) icon.className = 'fas fa-bars';
        }
        switchModeWithTransition('desktop', true, e.currentTarget);
      });
    }

    // 7. Mobile desktop pill (when taskbar is hidden on phone screens in desktop mode)
    const mobileDesktopPill = document.getElementById('desktopMobileToggleBtn');
    if (mobileDesktopPill) {
      mobileDesktopPill.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchModeWithTransition('normal', true, e.currentTarget);
      });
      mobileDesktopPill.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchModeWithTransition('normal', true, e.currentTarget);
        }
      });
    }
  }

  // Early setup (before first paint): pick the mode, and skip the OS boot screen for the website
  (function earlyInit() {
    const initialMode = getInitialMode();
    document.body.classList.toggle('layout-normal', initialMode === 'normal');
    document.body.classList.toggle('layout-desktop', initialMode !== 'normal');
    if (initialMode === 'normal') {
      const bootScreen = document.getElementById('bootScreen');
      if (bootScreen) {
        bootScreen.classList.add('hidden');
        bootScreen.style.display = 'none';
      }
    }
  })();

  // Follow the screen-size default live (e.g. resizing a browser window or rotating a tablet),
  // unless the visitor has picked a mode for that screen class themselves.
  let lastScreenClass = screenClass();
  let resizeModeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeModeTimer);
    resizeModeTimer = setTimeout(function () {
      const cls = screenClass();
      if (cls === lastScreenClass) return;
      lastScreenClass = cls;
      if (isTransitioning) return;
      const next = readSavedMode(cls) || defaultModeFor(cls);
      if (next === currentMode) return;
      const bootScreen = document.getElementById('bootScreen');
      if (bootScreen) {
        bootScreen.classList.add('hidden');
        bootScreen.style.display = 'none';
      }
      setLayoutMode(next, false);
      playEntrance(next);
    }, 250);
  });

  // Document ready
  document.addEventListener('DOMContentLoaded', function () {
    setLayoutMode(getInitialMode(), false);
    bindToggleTriggers();
    setupMobileMenu();
    setupSmoothScroll();
    setupScrollSpy();
    setupScrollReveal();
    updateToggleButtons();
  });

  window.KenOSMotion = { playEntrance: playEntrance };

  // Expose global controller for external triggers or debugging
  window.KenOSLayout = {
    getMode: () => currentMode,
    isPhoneOrTablet: isPhoneOrTablet,
    isLargeScreen: isLargeScreen,
    setMode: (mode) => switchModeWithTransition(mode, true),
    toggle: () => switchModeWithTransition(currentMode === 'normal' ? 'desktop' : 'normal', true)
  };

})();
