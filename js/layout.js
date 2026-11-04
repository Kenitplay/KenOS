// ============================================================
// KenOS Portfolio - Layout Switching & Normal Site Controller
// Laptops, PCs & 4K displays default onto Desktop OS mode
// Mobile phones default onto Web Mode
// ============================================================

(function () {
  'use strict';

  // Use a fresh storage key so any stale testing values in the user's browser are reset
  const STORAGE_KEY = 'kenos_layout_mode_v3';

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
    if (isPhoneOrTablet()) {
      return 'normal';
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'normal' || saved === 'desktop') {
      return saved;
    }
    // Laptops, PCs, and 4K displays default onto Desktop OS!
    return 'desktop';
  }

  let currentMode = getInitialMode();
  let userExplicitlyToggled = localStorage.getItem(STORAGE_KEY) !== null;

  // Apply layout mode
  function setLayoutMode(mode, userInitiated = false) {
    if (isPhoneOrTablet()) {
      mode = 'normal';
    }

    currentMode = mode;
    const body = document.body;
    const desktopArea = document.getElementById('desktopArea');
    const normalSite = document.getElementById('normalSite');
    const taskbar = document.getElementById('taskbar');

    if (userInitiated && !isPhoneOrTablet()) {
      userExplicitlyToggled = true;
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

      // Scroll to top if user triggered
      if (userInitiated) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setTimeout(window.resetIconPositions, 50);
      }

      console.log('💻 Active: KenOS Desktop Mode');
    }

    updateToggleButtons();
  }

  // Update button visibility & titles
  function updateToggleButtons() {
    const isLockedMobile = isPhoneOrTablet();

    const taskbarBtn = document.getElementById('taskbarLayoutToggleBtn');
    if (taskbarBtn) {
      taskbarBtn.title = currentMode === 'desktop'
        ? 'Switch to Normal Website View'
        : 'Switch to KenOS Desktop View';
      if (isLockedMobile) {
        taskbarBtn.style.display = 'none';
      } else {
        taskbarBtn.style.display = 'flex';
      }
    }

    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      // Floating switch to desktop OS shows on laptops/PCs when in normal mode
      floatingBtn.style.display = (!isLockedMobile && currentMode === 'normal') ? 'flex' : 'none';
    }

    const navDesktopBtn = document.getElementById('navDesktopToggleBtn');
    if (navDesktopBtn) {
      navDesktopBtn.style.display = isLockedMobile ? 'none' : 'inline-flex';
    }

    const heroDesktopBtn = document.getElementById('heroDesktopToggleBtn');
    if (heroDesktopBtn) {
      heroDesktopBtn.style.display = isLockedMobile ? 'none' : 'inline-flex';
    }

    const footerDesktopBtn = document.getElementById('footerDesktopToggleBtn');
    if (footerDesktopBtn) {
      footerDesktopBtn.style.display = isLockedMobile ? 'none' : 'inline-flex';
    }

    const mobileMenuDesktopBtn = document.getElementById('mobileMenuDesktopBtn');
    if (mobileMenuDesktopBtn) {
      mobileMenuDesktopBtn.style.display = isLockedMobile ? 'none' : 'flex';
    }
  }

  // Fast boot on mobile / click to skip on desktop
  function setupBootSkip() {
    const bootScreen = document.getElementById('bootScreen');
    if (!bootScreen) return;

    // Only skip on small mobile phones
    if (isPhoneOrTablet()) {
      bootScreen.classList.add('hidden');
      bootScreen.style.display = 'none';
      const normalSite = document.getElementById('normalSite');
      if (normalSite) normalSite.style.display = 'block';
      return;
    }

    // Allow user to click boot screen to skip immediately if in desktop mode or web mode on laptops/PCs
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
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        if (menu.classList.contains('open')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    });

    // Close menu when clicking links
    menu.querySelectorAll('a, button').forEach(item => {
      item.addEventListener('click', function () {
        menu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== toggleBtn) {
        menu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      }
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
        if (isPhoneOrTablet()) return;
        const nextMode = currentMode === 'desktop' ? 'normal' : 'desktop';
        setLayoutMode(nextMode, true);
      });
    }

    // 2. Normal navbar desktop toggle button (Web Mode -> switch to Desktop OS)
    const navBtn = document.getElementById('navDesktopToggleBtn');
    if (navBtn) {
      navBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isPhoneOrTablet()) return;
        setLayoutMode('desktop', true);
      });
    }

    // 3. Hero desktop toggle button
    const heroBtn = document.getElementById('heroDesktopToggleBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isPhoneOrTablet()) return;
        setLayoutMode('desktop', true);
      });
    }

    // 4. Footer desktop toggle button
    const footerBtn = document.getElementById('footerDesktopToggleBtn');
    if (footerBtn) {
      footerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isPhoneOrTablet()) return;
        setLayoutMode('desktop', true);
      });
    }

    // 5. Floating toggle button
    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isPhoneOrTablet()) return;
        const nextMode = currentMode === 'normal' ? 'desktop' : 'normal';
        setLayoutMode(nextMode, true);
      });
    }
  }

  // Responsive resize handler:
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (isPhoneOrTablet()) {
        if (currentMode !== 'normal') {
          setLayoutMode('normal', false);
        }
      }
      updateToggleButtons();
    }, 150);
  });

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
    updateToggleButtons();
  });

  // Expose global controller for debugging or external calls
  window.KenOSLayout = {
    getMode: () => currentMode,
    isPhoneOrTablet: isPhoneOrTablet,
    setMode: (mode) => setLayoutMode(mode, true),
    toggle: () => setLayoutMode(currentMode === 'normal' ? 'desktop' : 'normal', true)
  };

})();
