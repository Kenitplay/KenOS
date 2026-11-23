// ============================================================
// KenOS Portfolio - Layout Switching & Mode Transition Controller
// 3-Second Cinematic Cyber Transition between Web Mode and Desktop OS
// Laptops, PCs & 4K displays default onto Desktop OS mode
// Mobile phones default onto Web Mode
// ============================================================

(function () {
  'use strict';

  // Storage key for user preference
  const STORAGE_KEY = 'kenos_layout_mode_v3';

  // localStorage can throw (private mode, sandboxed iframes) — never let that break the page
  function readSavedMode() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  // Accurate detection for mobile phones (small handheld screens)
  function isPhoneOrTablet() {
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 600;
    return isMobileUA || isSmallScreen;
  }

  // Determine initial layout mode:
  // 1. Mobile phones default to 'normal' (Web Mode)
  // 2. Laptops, PCs, and 4K views default onto 'desktop' (Desktop OS Mode)
  function getInitialMode() {
    const saved = readSavedMode();
    if (saved === 'normal' || saved === 'desktop') {
      return saved;
    }
    if (isPhoneOrTablet()) {
      return 'normal';
    }
    return 'desktop';
  }

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
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {
        console.warn('Storage unavailable:', e);
      }
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

      console.log('🌐 Active: Normal Website Mode');
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
        setTimeout(window.resetIconPositions, 40);
      }

      console.log('💻 Active: KenOS Desktop Mode');
    }

    updateToggleButtons();
  }

  // Clear any existing transition timeouts
  function clearTransitionTimeouts() {
    activeTransitionTimeouts.forEach(t => clearTimeout(t));
    activeTransitionTimeouts = [];
  }

  // Orchestrate a rich, ~3-second Cyber Transition sequence between modes
  function switchModeWithTransition(targetMode, userInitiated = true) {
    if (isTransitioning) return;
    if (targetMode === currentMode) return;

    const overlay = document.getElementById('kenosModeTransition');

    // Fallback if overlay element is missing
    if (!overlay) {
      setLayoutMode(targetMode, userInitiated);
      return;
    }

    isTransitioning = true;
    clearTransitionTimeouts();

    // Elements inside overlay
    const icon = document.getElementById('transitionIcon');
    const actionLabel = document.getElementById('transitionActionLabel');
    const targetTitle = document.getElementById('transitionTargetTitle');
    const statusDesc = document.getElementById('transitionStatusDesc');
    const modeTag = document.getElementById('transitionModeTag');
    const sysCode = document.getElementById('transitionSysCode');
    const stageText = document.getElementById('transitionStageText');
    const progressFill = document.getElementById('transitionProgressFill');
    const percentText = document.getElementById('transitionPercentText');

    // Multi-stage message tables for ~3 second sequence
    const stages = targetMode === 'normal' ? [
      {
        time: 0,
        code: 'SYS::VIEW_WEB_0x5F',
        tag: 'WEB_MODE',
        action: 'SWITCHING SYSTEM INTERFACE',
        title: 'WEB PORTFOLIO',
        desc: 'Disconnecting KenOS Desktop workspace...',
        stage: '[ 12% ] DISCONNECTING_SESSION',
        sound: () => playCyberTone(440, 'sine', 0.14)
      },
      {
        time: 650,
        desc: 'Unmounting desktop window managers & widgets...',
        stage: '[ 38% ] UNMOUNTING_WORKSPACE',
        sound: () => playCyberTone(520, 'sine', 0.12)
      },
      {
        time: 1350,
        desc: 'Compiling responsive web layout & navigation...',
        stage: '[ 65% ] COMPILING_WEB_COMPONENTS',
        sound: () => playCyberTone(660, 'sine', 0.14)
      },
      {
        time: 2050,
        desc: 'Mounting portfolio sections & DOM viewport...',
        stage: '[ 88% ] RENDERING_VIEWPORT',
        sound: () => playCyberTone(784, 'sine', 0.12)
      },
      {
        time: 2600,
        desc: 'Web portfolio interface ready.',
        stage: '[ OK ] SYSTEM_SYNCHRONIZED',
        sound: () => playCyberTone(880, 'sine', 0.22)
      }
    ] : [
      {
        time: 0,
        code: 'SYS::KERNEL_RESTORE_0x8C',
        tag: 'DESKTOP_OS',
        action: 'SWITCHING SYSTEM INTERFACE',
        title: 'KENOS DESKTOP OS',
        desc: 'Suspending Web Portfolio runtime...',
        stage: '[ 12% ] SUSPENDING_WEB_VIEW',
        sound: () => playCyberTone(520, 'triangle', 0.14)
      },
      {
        time: 650,
        desc: 'Initializing KenOS Kernel v2.0 subsystems...',
        stage: '[ 38% ] LOADING_KERNEL_MODULES',
        sound: () => playCyberTone(620, 'triangle', 0.12)
      },
      {
        time: 1350,
        desc: 'Mounting desktop filesystem & taskbar services...',
        stage: '[ 65% ] MOUNTING_ENVIRONMENT',
        sound: () => playCyberTone(740, 'triangle', 0.14)
      },
      {
        time: 2050,
        desc: 'Aligning desktop coordinates & widgets...',
        stage: '[ 88% ] ATTACHING_DESKTOP_ENV',
        sound: () => playCyberTone(880, 'triangle', 0.12)
      },
      {
        time: 2600,
        desc: 'KenOS Desktop OS ready.',
        stage: '[ OK ] KERNEL_ATTACHED',
        sound: () => playCyberTone(987, 'triangle', 0.22)
      }
    ];

    // Initial HUD setup
    if (icon) icon.className = targetMode === 'normal' ? 'fas fa-globe' : 'fas fa-desktop';
    if (actionLabel) actionLabel.textContent = stages[0].action;
    if (targetTitle) targetTitle.textContent = stages[0].title;
    if (statusDesc) statusDesc.textContent = stages[0].desc;
    if (modeTag) modeTag.textContent = stages[0].tag;
    if (sysCode) sysCode.textContent = stages[0].code;
    if (stageText) stageText.textContent = stages[0].stage;

    // Reset progress bar
    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
    }
    if (percentText) percentText.textContent = '0%';

    // Step 1: Activate overlay and start departure
    document.body.classList.add('mode-transitioning');
    overlay.classList.remove('closing');
    overlay.classList.add('active');
    stages[0].sound();

    // Animate progress bar fill smoothly over ~2.6s
    requestAnimationFrame(() => {
      if (progressFill) {
        progressFill.style.transition = 'width 2.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
        progressFill.style.width = '100%';
      }
    });

    // Smooth percentage counter 0% -> 100%
    const animStartTime = performance.now();
    const animDuration = 2600;
    function updateCounter(now) {
      if (!isTransitioning) return;
      const elapsed = now - animStartTime;
      const pct = Math.min(100, Math.round((elapsed / animDuration) * 100));
      if (percentText) percentText.textContent = pct + '%';
      if (elapsed < animDuration) {
        requestAnimationFrame(updateCounter);
      }
    }
    requestAnimationFrame(updateCounter);

    // Schedule intermediate stage updates
    for (let i = 1; i < stages.length; i++) {
      const stage = stages[i];
      const tid = setTimeout(() => {
        if (!isTransitioning) return;
        if (statusDesc) statusDesc.textContent = stage.desc;
        if (stageText) stageText.textContent = stage.stage;
        if (typeof stage.sound === 'function') stage.sound();
      }, stage.time);
      activeTransitionTimeouts.push(tid);
    }

    // Step 2: Swap layout underneath overlay at ~2050ms
    const swapTid = setTimeout(() => {
      if (!isTransitioning) return;

      setLayoutMode(targetMode, userInitiated);

      const desktopArea = document.getElementById('desktopArea');
      const normalSite = document.getElementById('normalSite');
      const taskbar = document.getElementById('taskbar');

      if (targetMode === 'normal') {
        if (normalSite) {
          normalSite.classList.remove('mode-entering');
          void normalSite.offsetWidth; // Force reflow
          normalSite.classList.add('mode-entering');
        }
      } else {
        if (desktopArea) {
          desktopArea.classList.remove('mode-entering');
          void desktopArea.offsetWidth;
          desktopArea.classList.add('mode-entering');
        }
        if (taskbar) {
          taskbar.classList.remove('mode-entering');
          void taskbar.offsetWidth;
          taskbar.classList.add('mode-entering');
        }
      }
    }, 2050);
    activeTransitionTimeouts.push(swapTid);

    // Step 3: Transition out (dissolve overlay starting at ~2750ms)
    const outTid = setTimeout(() => {
      if (!isTransitioning) return;
      overlay.classList.remove('active');
      overlay.classList.add('closing');

      // Step 4: Final cleanup at ~3150ms (~3.15s total)
      const finishTid = setTimeout(() => {
        overlay.classList.remove('closing');
        document.body.classList.remove('mode-transitioning');

        const normalSite = document.getElementById('normalSite');
        const desktopArea = document.getElementById('desktopArea');
        const taskbar = document.getElementById('taskbar');

        if (normalSite) normalSite.classList.remove('mode-entering');
        if (desktopArea) desktopArea.classList.remove('mode-entering');
        if (taskbar) taskbar.classList.remove('mode-entering');

        isTransitioning = false;
        clearTransitionTimeouts();
      }, 400);
      activeTransitionTimeouts.push(finishTid);
    }, 2750);
    activeTransitionTimeouts.push(outTid);
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

  // Fast boot on mobile / click to skip on desktop
  function setupBootSkip() {
    const bootScreen = document.getElementById('bootScreen');
    if (!bootScreen) return;

    if (isPhoneOrTablet() && readSavedMode() === null) {
      bootScreen.classList.add('hidden');
      bootScreen.style.display = 'none';
      const normalSite = document.getElementById('normalSite');
      if (normalSite) normalSite.style.display = 'block';
      return;
    }

    bootScreen.addEventListener('click', function () {
      bootScreen.classList.add('hidden');
      const desktop = document.getElementById('desktopArea');
      const taskbar = document.getElementById('taskbar');
      if (currentMode === 'normal') {
        const normalSite = document.getElementById('normalSite');
        if (normalSite) normalSite.style.display = 'block';
      } else {
        if (desktop) desktop.classList.add('visible');
        if (taskbar) taskbar.classList.add('visible');
      }
    });
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
        switchModeWithTransition('normal', true);
      });
      taskbarBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchModeWithTransition('normal', true);
        }
      });
    }

    // 2. Normal navbar desktop toggle button (Web Mode -> switch to Desktop OS)
    const navBtn = document.getElementById('navDesktopToggleBtn');
    if (navBtn) {
      navBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchModeWithTransition('desktop', true);
      });
    }

    // 3. Hero desktop toggle button
    const heroBtn = document.getElementById('heroDesktopToggleBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchModeWithTransition('desktop', true);
      });
    }

    // 4. Footer desktop toggle button
    const footerBtn = document.getElementById('footerDesktopToggleBtn');
    if (footerBtn) {
      footerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchModeWithTransition('desktop', true);
      });
    }

    // 5. Floating toggle button
    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const nextMode = currentMode === 'normal' ? 'desktop' : 'normal';
        switchModeWithTransition(nextMode, true);
      });
      floatingBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const nextMode = currentMode === 'normal' ? 'desktop' : 'normal';
          switchModeWithTransition(nextMode, true);
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
        switchModeWithTransition('desktop', true);
      });
    }

    // 7. Mobile desktop pill (when taskbar is hidden on phone screens in desktop mode)
    const mobileDesktopPill = document.getElementById('desktopMobileToggleBtn');
    if (mobileDesktopPill) {
      mobileDesktopPill.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchModeWithTransition('normal', true);
      });
      mobileDesktopPill.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchModeWithTransition('normal', true);
        }
      });
    }
  }

  // Early setup (before full page load)
  (function earlyInit() {
    const initialMode = getInitialMode();
    if (initialMode === 'normal') {
      document.body.classList.add('layout-normal');
      document.body.classList.remove('layout-desktop');
    } else {
      document.body.classList.add('layout-desktop');
      document.body.classList.remove('layout-normal');
    }
  })();

  // Document ready
  document.addEventListener('DOMContentLoaded', function () {
    setLayoutMode(getInitialMode(), false);
    bindToggleTriggers();
    setupBootSkip();
    setupMobileMenu();
    setupSmoothScroll();
    setupScrollSpy();
    setupScrollReveal();
    updateToggleButtons();
  });

  // Expose global controller for external triggers or debugging
  window.KenOSLayout = {
    getMode: () => currentMode,
    isPhoneOrTablet: isPhoneOrTablet,
    setMode: (mode) => switchModeWithTransition(mode, true),
    toggle: () => switchModeWithTransition(currentMode === 'normal' ? 'desktop' : 'normal', true)
  };

})();
