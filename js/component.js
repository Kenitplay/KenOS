(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // BOOT SEQUENCE
  // ============================================================
  const bootScreen = document.getElementById('bootScreen');
  const bootProgress = document.getElementById('bootProgressBar');
  const bootStatusText = document.getElementById('bootStatusText');
  const bootCommandText = document.getElementById('bootCommandText');
  const bootCommandText2 = document.getElementById('bootCommandText2');
  const desktop = document.getElementById('desktopArea');
  const taskbar = document.getElementById('taskbar');

  const bootMessages = [
    'Loading KenOS kernel...',
    'Initializing hardware...',
    'Setting up network interfaces...',
    'Mounting filesystems...',
    'Starting system services...',
    'Loading user profile...',
    'Starting desktop environment...',
    'Welcome to KenOS Portfolio!'
  ];

  const bootCommands = [
    'loading kernel modules',
    'initializing hardware',
    'setting up network interfaces',
    'mounting filesystems',
    'starting system services',
    'loading user profile',
    'starting desktop environment',
    'system ready'
  ].map(cmd => '<span class="ok">[  OK  ]</span> ' + cmd);

  let progress = 0;
  let messageIndex = 0;
  let bootFinished = false;

  // Short ascending chime when the desktop appears
  function playBootSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [[440, 0, 0.1, 0.08], [660, 0.15, 0.25, 0.07], [880, 0.35, 0.5, 0.06], [1100, 0.55, 0.65, 0.05]]
        .forEach(([freq, start, stop, vol]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = vol;
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + stop);
        });
    } catch (e) {
      // Audio not permitted / supported
    }
  }

  function finishBoot(withSound) {
    if (bootFinished || !bootScreen) return;
    bootFinished = true;
    bootScreen.classList.add('hidden');
    if (document.body.classList.contains('layout-normal')) {
      const normalSite = document.getElementById('normalSite');
      if (normalSite) normalSite.style.display = 'block';
    } else {
      if (desktop) desktop.classList.add('visible');
      if (taskbar) taskbar.classList.add('visible');
      if (withSound) playBootSound();
    }
    document.removeEventListener('keydown', skipOnKey);
  }

  function skipOnKey() {
    finishBoot(false);
  }

  function updateBootScreen() {
    if (bootFinished) return;
    // Reduced-motion visitors get a much quicker boot
    progress += prefersReducedMotion ? 25 : Math.random() * 2.5 + 1;
    if (progress > 100) progress = 100;

    if (bootProgress) bootProgress.style.width = progress + '%';

    if (messageIndex < bootMessages.length) {
      if (bootStatusText) bootStatusText.textContent = bootMessages[messageIndex];
      if (bootCommandText) bootCommandText.innerHTML = bootCommands[messageIndex];
      if (bootCommandText2 && messageIndex > 0) bootCommandText2.innerHTML = bootCommands[messageIndex - 1];
      messageIndex++;
    }

    if (progress < 100) {
      setTimeout(updateBootScreen, Math.random() * 120 + 80);
    } else {
      setTimeout(() => finishBoot(true), 500);
    }
  }

  if (bootScreen && bootScreen.style.display !== 'none') {
    // Any key or click skips the boot animation
    document.addEventListener('keydown', skipOnKey);
    bootScreen.addEventListener('click', () => finishBoot(false));
  }
  setTimeout(updateBootScreen, prefersReducedMotion ? 100 : 500);

  // ============================================================
  // WINDOW MANAGER
  // ============================================================
  const container = document.getElementById('windowContainer');
  const windows = {};          // iconId -> window element
  let zCounter = 1000;         // monotonically increasing stack order

  function bringToFront(win) {
    zCounter += 1;
    win.style.zIndex = zCounter;
  }

  function hideWindow(win) {
    win.style.display = 'none';
    win.classList.remove('fullscreen');
  }

  function topVisibleWindow() {
    let top = null;
    Object.values(windows).forEach(win => {
      if (win.style.display === 'none') return;
      if (!top || (parseInt(win.style.zIndex, 10) || 0) > (parseInt(top.style.zIndex, 10) || 0)) {
        top = win;
      }
    });
    return top;
  }

  function setupWindow(windowEl) {
    windowEl.setAttribute('role', 'dialog');
    const titleEl = windowEl.querySelector('.window-title');
    if (titleEl) windowEl.setAttribute('aria-label', titleEl.textContent.trim());

    // Clicking anywhere in a window raises it
    windowEl.addEventListener('mousedown', () => bringToFront(windowEl));
    windowEl.addEventListener('touchstart', () => bringToFront(windowEl), { passive: true });

    // Make the traffic-light controls real, keyboard-reachable buttons
    [
      ['#closeWindowBtn', 'Close window'],
      ['#minimizeWindowBtn', 'Minimize window'],
      ['#zoomWindowBtn', 'Toggle full screen']
    ].forEach(([sel, label]) => {
      const btn = windowEl.querySelector(sel);
      if (!btn) return;
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    const closeBtn = windowEl.querySelector('#closeWindowBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        hideWindow(windowEl);
      });
    }

    const minBtn = windowEl.querySelector('#minimizeWindowBtn');
    if (minBtn) {
      minBtn.addEventListener('click', e => {
        e.stopPropagation();
        hideWindow(windowEl);
      });
    }

    const zoomBtn = windowEl.querySelector('#zoomWindowBtn');
    if (zoomBtn) {
      zoomBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!windowEl.classList.contains('fullscreen')) {
          // Remember current geometry before going full screen
          windowEl.dataset.origWidth = windowEl.style.width || '700px';
          windowEl.dataset.origHeight = windowEl.style.height || 'auto';
          windowEl.dataset.origTop = windowEl.style.top || '';
          windowEl.dataset.origLeft = windowEl.style.left || '';
          windowEl.classList.add('fullscreen');
        } else {
          windowEl.classList.remove('fullscreen');
          windowEl.style.width = windowEl.dataset.origWidth || '700px';
          windowEl.style.height = windowEl.dataset.origHeight || 'auto';
          windowEl.style.top = windowEl.dataset.origTop || '';
          windowEl.style.left = windowEl.dataset.origLeft || '';
        }
        bringToFront(windowEl);
      });
    }

    // Double-click title bar toggles full screen, like a real OS
    const header = windowEl.querySelector('#windowHeader');
    if (header && zoomBtn) {
      header.addEventListener('dblclick', e => {
        if (e.target.closest('.window-controls')) return;
        zoomBtn.click();
      });
    }

    // ----- Resize (drag bottom-right corner) -----
    const resizeHandle = windowEl.querySelector('.resize-handle');
    if (resizeHandle) {
      let isResizing = false;
      let startX, startY, startWidth, startHeight;

      resizeHandle.addEventListener('mousedown', e => {
        if (windowEl.classList.contains('fullscreen')) return;
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const cs = getComputedStyle(windowEl);
        startWidth = parseInt(cs.width, 10);
        startHeight = parseInt(cs.height, 10);
        document.body.style.cursor = 'nwse-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });

      document.addEventListener('mousemove', e => {
        if (!isResizing) return;
        windowEl.style.width = Math.max(300, startWidth + (e.clientX - startX)) + 'px';
        windowEl.style.height = Math.max(200, startHeight + (e.clientY - startY)) + 'px';
      });

      document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      });
    }

    // ----- Drag by title bar -----
    if (header) {
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;

      header.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('.window-controls')) return;
        if (windowEl.style.display === 'none') return;
        if (windowEl.classList.contains('fullscreen')) return;
        isDragging = true;
        const rect = windowEl.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        header.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });

      document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 180;
        windowEl.style.left = Math.min(Math.max(e.clientX - offsetX, 10), maxX) + 'px';
        windowEl.style.top = Math.min(Math.max(e.clientY - offsetY, 10), maxY) + 'px';
        windowEl.style.right = 'auto';
        windowEl.style.bottom = 'auto';
      });

      document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        header.style.cursor = '';
        document.body.style.userSelect = '';
      });
    }
  }

  // ----- Component loader (fetch external HTML) -----
  function loadComponent(url, callback) {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(html => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html.trim();
        callback(wrapper.firstElementChild);
      })
      .catch(err => {
        console.warn('Component load failed:', err);
        const fallback = document.createElement('div');
        fallback.innerHTML =
          `<div style="background:rgba(0,212,255,0.03);padding:20px;border-radius:6px;color:#00d4ff;border:1px solid rgba(0,212,255,0.06);font-family:'Courier New',monospace;">⚠️ Could not load component. Please check network.</div>`;
        callback(fallback.firstElementChild);
      });
  }

  function showWindow(win) {
    win.style.display = 'flex';
    win.classList.remove('fullscreen');
    bringToFront(win);
    const closeBtn = win.querySelector('#closeWindowBtn');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  const loading = {};
  function openWindow(iconId, url) {
    if (windows[iconId]) {
      showWindow(windows[iconId]);
      return;
    }
    if (loading[iconId]) return; // ignore repeat clicks while fetching
    loading[iconId] = true;
    loadComponent(url, element => {
      loading[iconId] = false;
      windows[iconId] = element;
      container.appendChild(element);
      setupWindow(element);
      showWindow(element);
    });
  }

  const windowComponents = {
    experienceIcon: 'html/experience-component.html',
    projectsIcon: 'html/projects-component.html',
    toolsIcon: 'html/tools-component.html',
    whoamiIcon: 'html/whoami-component.html',
    certificatesIcon: 'html/certificates-component.html',
    contactIcon: 'html/contact-component.html'
  };

  Object.keys(windowComponents).forEach(iconId => {
    const icon = document.getElementById(iconId);
    if (!icon) return;
    icon.addEventListener('dblclick', e => {
      e.stopPropagation();
      openWindow(iconId, windowComponents[iconId]);
    });
  });

  // Link-style desktop icons (GitHub, Resume) open on single click
  document.querySelectorAll('.desktop-icon[data-href]').forEach(icon => {
    icon.addEventListener('click', () => {
      window.open(icon.dataset.href, '_blank', 'noopener');
    });
  });

  // Keyboard: Enter / Space on a focused desktop icon opens it
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (icon.dataset.href) {
        window.open(icon.dataset.href, '_blank', 'noopener');
      } else if (windowComponents[icon.id]) {
        openWindow(icon.id, windowComponents[icon.id]);
      }
    });
  });

  // Keyboard: Escape closes the top-most window
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !bootFinished) return;
    const top = topVisibleWindow();
    if (top) {
      hideWindow(top);
      const iconId = Object.keys(windows).find(k => windows[k] === top);
      const icon = iconId && document.getElementById(iconId);
      if (icon) icon.focus({ preventScroll: true });
    }
  });

  // Double-click empty desktop → close all windows
  if (desktop) {
    desktop.addEventListener('dblclick', e => {
      if (e.target === desktop) {
        Object.values(windows).forEach(hideWindow);
      }
    });
  }

  // Reset-icons button is a div: give it keyboard activation too
  const resetBtn = document.getElementById('resetIconsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resetBtn.click();
      }
    });
  }
})();
