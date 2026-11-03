// ============================================================
// KenOS Portfolio - Layout Switching & Normal Site Controller
// Seamlessly toggles between Desktop OS Simulation & Standard Portfolio Site
// ============================================================

(function() {
  'use strict';

  const STORAGE_KEY = 'kenos_preferred_layout';
  const MOBILE_BREAKPOINT = 768;

  function isSmallDevice() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  // Determine initial layout mode:
  // 1. Check user's saved preference
  // 2. If none, SMALL DEVICES DEFAULT TO 'normal', DESKTOP DEFAULTS TO 'desktop'
  function getInitialMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'normal' || saved === 'desktop') {
      return saved;
    }
    return isSmallDevice() ? 'normal' : 'desktop';
  }

  let currentMode = getInitialMode();
  let userExplicitlyToggled = localStorage.getItem(STORAGE_KEY) !== null;

  // Apply layout mode
  function setLayoutMode(mode, userInitiated = false) {
    currentMode = mode;
    const body = document.body;
    const desktopArea = document.getElementById('desktopArea');
    const normalSite = document.getElementById('normalSite');
    const taskbar = document.getElementById('taskbar');

    if (userInitiated) {
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

      console.log('🌐 Switched to Normal Website Mode');
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

      console.log('💻 Switched to KenOS Desktop Mode');
    }

    updateToggleButtons();
  }

  // Update button icons/titles
  function updateToggleButtons() {
    const taskbarBtn = document.getElementById('taskbarLayoutToggleBtn');
    if (taskbarBtn) {
      taskbarBtn.title = currentMode === 'desktop' 
        ? 'Switch to Normal Website View' 
        : 'Switch to KenOS Desktop View';
    }

    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      floatingBtn.style.display = currentMode === 'normal' ? 'flex' : 'none';
    }
  }

  // Fast boot / skip boot helper
  function setupBootSkip() {
    const bootScreen = document.getElementById('bootScreen');
    if (!bootScreen) return;

    // Allow user to click boot screen to skip immediately
    bootScreen.addEventListener('click', function() {
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

    // If initial mode is normal on mobile, finish boot screen quickly
    if (currentMode === 'normal' && isSmallDevice()) {
      setTimeout(function() {
        if (!bootScreen.classList.contains('hidden')) {
          bootScreen.classList.add('hidden');
          const normalSite = document.getElementById('normalSite');
          if (normalSite) normalSite.style.display = 'block';
        }
      }, 700);
    }
  }

  // Mobile menu dropdown
  function setupMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('normalMobileMenu');
    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', function(e) {
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
      item.addEventListener('click', function() {
        menu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== toggleBtn) {
        menu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      }
    });
  }

  // Contact form submission
  function setupContactForm() {
    const form = document.getElementById('normalContactForm');
    const statusMsg = document.getElementById('formStatusMsg');
    if (!form || !statusMsg) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transmitting...';
        submitBtn.disabled = true;

        setTimeout(function() {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          statusMsg.className = 'form-status-msg success';
          statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> Message received! Thank you, Ken will get back to you shortly.';
          form.reset();

          setTimeout(function() {
            statusMsg.style.display = 'none';
          }, 6000);
        }, 800);
      }
    });
  }

  // Smooth scroll for nav anchor links
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#normal-"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
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
    // 1. Taskbar toggle button
    const taskbarBtn = document.getElementById('taskbarLayoutToggleBtn');
    if (taskbarBtn) {
      taskbarBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const nextMode = currentMode === 'desktop' ? 'normal' : 'desktop';
        setLayoutMode(nextMode, true);
      });
    }

    // 2. Normal navbar desktop toggle button
    const navBtn = document.getElementById('navDesktopToggleBtn');
    if (navBtn) {
      navBtn.addEventListener('click', function(e) {
        e.preventDefault();
        setLayoutMode('desktop', true);
      });
    }

    // 3. Hero desktop toggle button
    const heroBtn = document.getElementById('heroDesktopToggleBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', function(e) {
        e.preventDefault();
        setLayoutMode('desktop', true);
      });
    }

    // 4. Footer desktop toggle button
    const footerBtn = document.getElementById('footerDesktopToggleBtn');
    if (footerBtn) {
      footerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        setLayoutMode('desktop', true);
      });
    }

    // 5. Floating toggle button
    const floatingBtn = document.getElementById('floatingLayoutToggleBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const nextMode = currentMode === 'normal' ? 'desktop' : 'normal';
        setLayoutMode(nextMode, true);
      });
    }

    // 6. Mobile menu desktop toggle button
    const mobileMenuDesktopBtn = document.getElementById('mobileMenuDesktopBtn');
    if (mobileMenuDesktopBtn) {
      mobileMenuDesktopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        setLayoutMode('desktop', true);
      });
    }
  }

  // Responsive resize handler:
  // If user hasn't explicitly chosen a mode, adapt automatically across breakpoint
  let resizeTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (!userExplicitlyToggled) {
        const shouldBeNormal = isSmallDevice();
        const targetMode = shouldBeNormal ? 'normal' : 'desktop';
        if (targetMode !== currentMode) {
          setLayoutMode(targetMode, false);
        }
      }
      updateToggleButtons();
    }, 150);
  });

  // Early setup (before full page load)
  // Set class on body immediately to prevent layout flash
  (function earlyInit() {
    const initialMode = getInitialMode();
    if (initialMode === 'normal') {
      document.body.classList.add('layout-normal');
    } else {
      document.body.classList.add('layout-desktop');
    }
  })();

  // Document ready
  document.addEventListener('DOMContentLoaded', function() {
    setLayoutMode(currentMode, false);
    bindToggleTriggers();
    setupBootSkip();
    setupMobileMenu();
    setupContactForm();
    setupSmoothScroll();
    updateToggleButtons();
  });

  // Expose global controller for debugging or external calls
  window.KenOSLayout = {
    getMode: () => currentMode,
    setMode: (mode) => setLayoutMode(mode, true),
    toggle: () => setLayoutMode(currentMode === 'normal' ? 'desktop' : 'normal', true)
  };

})();

