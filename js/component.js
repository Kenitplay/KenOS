(function () {
  'use strict';

  // ============================================================
  // BOOT SEQUENCE (OS mode only)
  // Smooth, eased progress driven by requestAnimationFrame, with
  // boot-log lines scrolling in and a zoom-out exit into the desktop.
  // ============================================================
  const bootScreen = document.getElementById('bootScreen');
  const bootProgress = document.getElementById('bootProgressBar');
  const bootPercent = document.getElementById('bootPercent');
  const bootStatusText = document.getElementById('bootStatusText');
  const bootCommands = document.getElementById('bootCommands');
  const desktop = document.getElementById('desktopArea');
  const taskbar = document.getElementById('taskbar');

  const bootSteps = [
    ['Loading KenOS kernel...', 'loading kernel modules'],
    ['Initializing hardware...', 'initializing hardware'],
    ['Setting up network interfaces...', 'setting up network interfaces'],
    ['Mounting filesystems...', 'mounting filesystems'],
    ['Starting system services...', 'starting system services'],
    ['Loading user profile...', 'loading user profile'],
    ['Starting desktop environment...', 'starting desktop environment'],
    ['Welcome to KenOS Portfolio!', 'system ready']
  ];

  const BOOT_DURATION = 3400; // same length for everyone; reduced motion only calms the visuals
  const MAX_LOG_LINES = 4;
  let bootFinished = false;
  let bootStepShown = -1;
  let bootStart = 0;

  const sfx = () => window.KenOSSound;
  let lastChatter = 0;

  // Progress curve: quick start, a couple of gentle "loading" plateaus, smooth finish
  function bootCurve(t) {
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
    const wobble = Math.sin(t * Math.PI * 3) * 0.025 * (1 - t);              // subtle stalls
    return Math.min(1, Math.max(0, ease + wobble));
  }

  function pushBootLine(text, index) {
    if (!bootCommands) return;
    const isFinal = index === bootSteps.length - 1;
    const line = document.createElement('div');
    line.className = 'boot-line' + (isFinal ? ' boot-line-final' : '');
    line.innerHTML = '<span class="ok">[  OK  ]</span> ' + text;
    bootCommands.appendChild(line);
    // Disk-seek clicks + a tone that climbs with each line (the last one is the chord)
    if (sfx() && !isFinal) sfx().bootStep(index, bootSteps.length);
    while (bootCommands.children.length > MAX_LOG_LINES) {
      bootCommands.removeChild(bootCommands.firstElementChild);
    }
  }

  function setBootStatus(text) {
    if (!bootStatusText) return;
    bootStatusText.textContent = text;
    bootStatusText.classList.remove('boot-status-swap');
    void bootStatusText.offsetWidth;
    bootStatusText.classList.add('boot-status-swap');
  }

  function revealAfterBoot() {
    if (document.body.classList.contains('layout-normal')) {
      const normalSite = document.getElementById('normalSite');
      if (normalSite) normalSite.style.display = 'block';
      if (window.KenOSMotion) window.KenOSMotion.playEntrance('normal');
    } else {
      if (desktop) desktop.classList.add('visible');
      if (taskbar) taskbar.classList.add('visible');
      if (window.KenOSMotion) window.KenOSMotion.playEntrance('desktop');
    }
  }

  function finishBoot() {
    if (bootFinished || !bootScreen) return;
    bootFinished = true;
    document.removeEventListener('keydown', skipOnKey);
    document.removeEventListener('keydown', powerOnFromKey);

    if (bootScreen.style.display === 'none' || bootScreen.classList.contains('hidden')) {
      return; // web mode: boot screen was never shown
    }

    if (sfx()) {
      sfx().humStop();
      sfx().bootExit();
    }

    // Zoom-through exit; the desktop cascades in underneath
    bootScreen.classList.remove('boot-awaiting', 'boot-running');
    bootScreen.classList.add('boot-exit');
    revealAfterBoot();
    setTimeout(() => {
      bootScreen.classList.add('hidden');
      bootScreen.classList.remove('boot-exit');
    }, 750);
  }

  function skipOnKey() {
    finishBoot();
  }

  function bootFrame(now) {
    if (bootFinished) return;
    if (!bootStart) bootStart = now;
    const t = Math.min(1, (now - bootStart) / BOOT_DURATION);
    const p = bootCurve(t);

    if (bootProgress) bootProgress.style.width = (p * 100).toFixed(2) + '%';
    if (bootPercent) bootPercent.textContent = Math.round(p * 100) + '%';

    const step = Math.min(bootSteps.length - 1, Math.floor(p * bootSteps.length));
    while (bootStepShown < step) {
      bootStepShown++;
      setBootStatus(bootSteps[bootStepShown][0]);
      pushBootLine(bootSteps[bootStepShown][1], bootStepShown);
    }

    // Quiet "computing" chatter at irregular intervals
    if (sfx() && t < 0.92 && now - lastChatter > 70 + Math.random() * 160) {
      lastChatter = now;
      sfx().chatter();
    }

    if (t < 1) {
      requestAnimationFrame(bootFrame);
    } else {
      if (bootStepShown < bootSteps.length - 1) {
        bootStepShown = bootSteps.length - 1;
        setBootStatus(bootSteps[bootStepShown][0]);
        pushBootLine(bootSteps[bootStepShown][1], bootStepShown);
      }
      bootScreen && bootScreen.classList.add('boot-complete');
      // Completion chord lands with the logo's green flash
      if (sfx()) {
        sfx().humStop();
        sfx().boot();
      }
      setTimeout(finishBoot, 700);
    }
  }

  // ---- Power-on step ----
  // Browsers block sound until the visitor interacts, so OS mode starts at a power
  // button; that press unlocks audio and starts the boot (skipped if sound is already allowed).
  let bootStarted = false;

  function runBoot() {
    if (bootStarted || bootFinished) return;
    if (bootScreen.style.display === 'none' || bootScreen.classList.contains('hidden')) return;
    bootStarted = true;
    document.removeEventListener('keydown', powerOnFromKey);
    bootScreen.classList.remove('boot-awaiting');
    bootScreen.classList.add('boot-running');

    if (sfx()) {
      sfx().powerOn();
      sfx().humStart(41.2);
    }

    // After power-on, any key or click skips the rest (delay so the power-on press doesn't count)
    setTimeout(() => {
      if (bootFinished) return;
      document.addEventListener('keydown', skipOnKey);
      bootScreen.addEventListener('click', finishBoot);
    }, 600);

    setTimeout(() => requestAnimationFrame(bootFrame), 450);
  }

  function powerOnFromKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Tab') return;
    e.preventDefault();
    runBoot();
  }

  function startBoot() {
    if (!bootScreen) return;
    // Web mode never shows the OS boot screen
    if (document.body.classList.contains('layout-normal') || bootScreen.style.display === 'none') {
      bootFinished = true;
      bootScreen.classList.add('hidden');
      bootScreen.style.display = 'none';
      revealAfterBoot();
      return;
    }
    if (bootCommands) bootCommands.innerHTML = '';

    // Sound already allowed (e.g. returning visitor the browser trusts): boot straight away
    if (sfx() && sfx().canPlay()) {
      runBoot();
      return;
    }

    bootScreen.classList.add('boot-awaiting');
    const powerBtn = document.getElementById('bootPowerBtn');
    if (powerBtn) {
      powerBtn.addEventListener('click', e => {
        e.stopPropagation();
        runBoot();
      });
      setTimeout(() => powerBtn.focus({ preventScroll: true }), 50);
    }
    bootScreen.addEventListener('pointerdown', function onScreenPress(e) {
      if (e.target.closest && e.target.closest('#bootPowerBtn')) return;
      bootScreen.removeEventListener('pointerdown', onScreenPress);
      runBoot();
    });
    document.addEventListener('keydown', powerOnFromKey);
  }

  // layout.js decides the mode after this script runs, so start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBoot);
  } else {
    startBoot();
  }

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

  function hideWindow(win, silent) {
    if (!silent && win.style.display !== 'none' && window.KenOSSound) window.KenOSSound.windowClose();
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
    if (window.KenOSSound) window.KenOSSound.windowOpen();
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
        Object.values(windows).forEach(win => hideWindow(win));
      }
    });
  }

  // Taskbar speaker button: mute / unmute all KenOS sounds
  const soundBtn = document.getElementById('soundToggleBtn');
  function renderSoundBtn() {
    if (!soundBtn || !window.KenOSSound) return;
    const isMuted = window.KenOSSound.muted;
    const icon = soundBtn.querySelector('i');
    if (icon) icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    const label = isMuted ? 'Unmute sounds' : 'Mute sounds';
    soundBtn.title = label;
    soundBtn.setAttribute('aria-label', label);
    soundBtn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
    soundBtn.classList.toggle('is-muted', isMuted);
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      if (window.KenOSSound) window.KenOSSound.toggleMute();
    });
    soundBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundBtn.click();
      }
    });
    document.addEventListener('kenos:mute', renderSoundBtn);
    renderSoundBtn();
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
