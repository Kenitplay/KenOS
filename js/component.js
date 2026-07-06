(function() {
      // ----- BOOT SEQUENCE -----
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
        '[  OK  ] loading kernel modules',
        '[  OK  ] initializing hardware',
        '[  OK  ] setting up network interfaces',
        '[  OK  ] mounting filesystems',
        '[  OK  ] starting system services',
        '[  OK  ] loading user profile',
        '[  OK  ] starting desktop environment',
        '[  OK  ] system ready'
      ];

      let progress = 0;
      let messageIndex = 0;
      let audioContext = null;

      // Create audio context and play a boot sound
      function playBootSound() {
        try {
          audioContext = new(window.AudioContext || window.webkitAudioContext)();

          // First beep - lower tone
          const osc1 = audioContext.createOscillator();
          const gain1 = audioContext.createGain();
          osc1.connect(gain1);
          gain1.connect(audioContext.destination);
          osc1.frequency.value = 440;
          osc1.type = 'sine';
          gain1.gain.value = 0.08;
          osc1.start();
          osc1.stop(audioContext.currentTime + 0.1);

          // Second beep - higher tone
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 660;
          osc2.type = 'sine';
          gain2.gain.value = 0.07;
          osc2.start(audioContext.currentTime + 0.15);
          osc2.stop(audioContext.currentTime + 0.25);

          // Third beep - success tone (nice chord)
          const osc3 = audioContext.createOscillator();
          const gain3 = audioContext.createGain();
          osc3.connect(gain3);
          gain3.connect(audioContext.destination);
          osc3.frequency.value = 880;
          osc3.type = 'sine';
          gain3.gain.value = 0.06;
          osc3.start(audioContext.currentTime + 0.35);
          osc3.stop(audioContext.currentTime + 0.50);

          // Fourth beep - slight higher for final
          const osc4 = audioContext.createOscillator();
          const gain4 = audioContext.createGain();
          osc4.connect(gain4);
          gain4.connect(audioContext.destination);
          osc4.frequency.value = 1100;
          osc4.type = 'sine';
          gain4.gain.value = 0.05;
          osc4.start(audioContext.currentTime + 0.55);
          osc4.stop(audioContext.currentTime + 0.65);

          console.log('🔊 KenOS boot sound played!');
        } catch (e) {
          console.warn('Audio not supported:', e);
        }
      }

      function updateBootScreen() {
        progress += Math.random() * 2.5 + 1;
        if (progress > 100) progress = 100;

        bootProgress.style.width = progress + '%';

        if (messageIndex < bootMessages.length) {
          bootStatusText.textContent = bootMessages[messageIndex];
          if (messageIndex < bootCommands.length) {
            bootCommandText.innerHTML = bootCommands[messageIndex];
            if (messageIndex > 0) {
              bootCommandText2.innerHTML = bootCommands[messageIndex - 1];
            }
          }
          messageIndex++;
        }

        if (progress < 100) {
          const delay = Math.random() * 120 + 80;
          setTimeout(updateBootScreen, delay);
        } else {
          // Boot complete
          setTimeout(() => {
            bootScreen.classList.add('hidden');
            desktop.classList.add('visible');
            taskbar.classList.add('visible');
            // Play boot sound when desktop appears
            playBootSound();
            console.log('✅ KenOS boot complete!');
          }, 500);
        }
      }

      // Start boot sequence after a short delay
      setTimeout(updateBootScreen, 500);

      // ----- CLOCK -----
      function updateClock() {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        document.getElementById('liveTime').textContent = `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
      }
      updateClock();
      setInterval(updateClock, 1000);

      // ----- HELPERS: make window draggable & wire controls -----
      function setupWindow(windowEl) {
        // Close
        const closeBtn = windowEl.querySelector('#closeWindowBtn');
        if (closeBtn) {
          closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            windowEl.style.display = 'none';
            windowEl.classList.remove('fullscreen');
          });
        }

        // Minimize (hide)
        const minBtn = windowEl.querySelector('#minimizeWindowBtn');
        if (minBtn) {
          minBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            windowEl.style.display = 'none';
            windowEl.classList.remove('fullscreen');
          });
        }

        // Zoom (toggle fullscreen)
        const zoomBtn = windowEl.querySelector('#zoomWindowBtn');
        if (zoomBtn) {
          zoomBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Toggle fullscreen class
            windowEl.classList.toggle('fullscreen');

            // If not fullscreen, restore original size
            if (!windowEl.classList.contains('fullscreen')) {
              const w = windowEl.dataset.origWidth || '700px';
              const h = windowEl.dataset.origHeight || 'auto';
              windowEl.style.width = w;
              windowEl.style.height = h;
              windowEl.style.top = '70px';
              windowEl.style.left = '100px';
            } else {
              // Store current dimensions before fullscreen
              if (!windowEl.dataset.origWidth) {
                windowEl.dataset.origWidth = windowEl.style.width || '700px';
              }
              if (!windowEl.dataset.origHeight) {
                windowEl.dataset.origHeight = windowEl.style.height || 'auto';
              }
            }
          });
        }

        // ----- Resize functionality (drag from bottom-right corner) -----
        const resizeHandle = windowEl.querySelector('.resize-handle');
        if (resizeHandle) {
          let isResizing = false;
          let startX, startY, startWidth, startHeight;

          resizeHandle.addEventListener('mousedown', function(e) {
            if (windowEl.classList.contains('fullscreen')) return;
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(windowEl).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(windowEl).height, 10);
            document.body.style.cursor = 'nwse-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
          });

          document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            const newWidth = Math.max(300, startWidth + (e.clientX - startX));
            const newHeight = Math.max(200, startHeight + (e.clientY - startY));
            windowEl.style.width = newWidth + 'px';
            windowEl.style.height = newHeight + 'px';
          });

          document.addEventListener('mouseup', function() {
            if (isResizing) {
              isResizing = false;
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            }
          });
        }

        // ----- Drag functionality -----
        const header = windowEl.querySelector('#windowHeader');
        if (header) {
          let isDragging = false;
          let offsetX = 0,
            offsetY = 0;

          header.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            if (windowEl.style.display === 'none') return;
            if (windowEl.classList.contains('fullscreen')) return;
            isDragging = true;
            const rect = windowEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            windowEl.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            e.preventDefault();
          });

          document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            const maxX = window.innerWidth - 200;
            const maxY = window.innerHeight - 180;
            windowEl.style.left = Math.min(Math.max(newLeft, 10), maxX) + 'px';
            windowEl.style.top = Math.min(Math.max(newTop, 10), maxY) + 'px';
            windowEl.style.right = 'auto';
            windowEl.style.bottom = 'auto';
          });

          document.addEventListener('mouseup', function() {
            if (isDragging) {
              isDragging = false;
              windowEl.style.cursor = '';
              document.body.style.userSelect = '';
            }
          });
        }
      }

      // ----- COMPONENT LOADER (fetch external HTML) -----
      function loadComponent(url, callback) {
        fetch(url)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
          })
          .then(html => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            const element = wrapper.firstElementChild;
            callback(element);
          })
          .catch(err => {
            console.warn('Component load failed:', err);
            // fallback: show inline placeholder
            const fallback = document.createElement('div');
            fallback.innerHTML =
              `<div style="background:rgba(0,212,255,0.03);padding:20px;border-radius:6px;color:#00d4ff;border:1px solid rgba(0,212,255,0.06);font-family:'Courier New',monospace;">⚠️ Could not load component. Please check network.</div>`;
            callback(fallback.firstElementChild);
          });
      }

      // ----- COMPONENT FACTORIES -----
      const container = document.getElementById('windowContainer');

      let experienceWindow = null;
      let projectsWindow = null;
      let toolsWindow = null;
      let whoamiWindow = null;
      let certificatesWindow = null;
      let contactWindow = null;

      // ----- OPEN EXPERIENCE (external component) -----
      document.getElementById('experienceIcon').addEventListener('dblclick', function(e) {
        e.stopPropagation();

        // if window already exists, just show it
        if (experienceWindow) {
          experienceWindow.style.display = 'flex';
          experienceWindow.style.zIndex = 1000 + Date.now() % 100;
          experienceWindow.classList.remove('fullscreen');
          return;
        }

        // load the experience component from external file
        loadComponent('html/experience-component.html', function(element) {
          experienceWindow = element;
          container.appendChild(element);
          element.style.display = 'flex';
          element.style.zIndex = 1000 + Date.now() % 100;
          setupWindow(element);
        });
      });

      // ----- OPEN PROJECTS (external component) -----
      document.getElementById('projectsIcon').addEventListener('dblclick', function(e) {
        e.stopPropagation();

        // if window already exists, just show it
        if (projectsWindow) {
          projectsWindow.style.display = 'flex';
          projectsWindow.style.zIndex = 1000 + Date.now() % 100;
          projectsWindow.classList.remove('fullscreen');
          return;
        }

        // load the projects component from external file
        loadComponent('html/projects-component.html', function(element) {
          projectsWindow = element;
          container.appendChild(element);
          element.style.display = 'flex';
          element.style.zIndex = 1000 + Date.now() % 100;
          setupWindow(element);
        });
      });

      // ----- OPEN TOOLS (external component) -----
      document.getElementById('toolsIcon').addEventListener('dblclick', function(e) {
        e.stopPropagation();

        // if window already exists, just show it
        if (toolsWindow) {
          toolsWindow.style.display = 'flex';
          toolsWindow.style.zIndex = 1000 + Date.now() % 100;
          toolsWindow.classList.remove('fullscreen');
          return;
        }

        // load the tools component from external file
        loadComponent('html/tools-component.html', function(element) {
          toolsWindow = element;
          container.appendChild(element);
          element.style.display = 'flex';
          element.style.zIndex = 1000 + Date.now() % 100;
          setupWindow(element);
        });
      });

      // ----- OPEN WHOAMI (external component) -----
      document.getElementById('whoamiIcon').addEventListener('dblclick', function(e) {
        e.stopPropagation();

        // if window already exists, just show it
        if (whoamiWindow) {
          whoamiWindow.style.display = 'flex';
          whoamiWindow.style.zIndex = 1000 + Date.now() % 100;
          whoamiWindow.classList.remove('fullscreen');
          return;
        }

        // load the whoami component from external file
        loadComponent('html/whoami-component.html', function(element) {
          whoamiWindow = element;
          container.appendChild(element);
          element.style.display = 'flex';
          element.style.zIndex = 1000 + Date.now() % 100;
          setupWindow(element);
        });
      });

      // ----- OPEN CERTIFICATES (external component) -----
      document.getElementById('certificatesIcon').addEventListener('dblclick', function(e) {
        e.stopPropagation();

        // if window already exists, just show it
        if (certificatesWindow) {
          certificatesWindow.style.display = 'flex';
          certificatesWindow.style.zIndex = 1000 + Date.now() % 100;
          certificatesWindow.classList.remove('fullscreen');
          return;
        }

        // load the certificates component from external file
        loadComponent('html/certificates-component.html', function(element) {
          certificatesWindow = element;
          container.appendChild(element);
          element.style.display = 'flex';
          element.style.zIndex = 1000 + Date.now() % 100;
          setupWindow(element);
        });
      });
      

      // ----- OPEN CONTACT (external component) -----
      document.getElementById('contactIcon').addEventListener('dblclick', function(e) {
        e.stopPropagation();

        // if window already exists, just show it
        if (contactWindow) {
          contactWindow.style.display = 'flex';
          contactWindow.style.zIndex = 1000 + Date.now() % 100;
          contactWindow.classList.remove('fullscreen');
          return;
        }

        // load the contact component from external file
        loadComponent('html/contact-component.html', function(element) {
          contactWindow = element;
          container.appendChild(element);
          element.style.display = 'flex';
          element.style.zIndex = 1000 + Date.now() % 100;
          setupWindow(element);
        });
      });

      // ----- Double-click desktop → close all windows -----
      const desktopEl = document.getElementById('desktopArea');
      desktopEl.addEventListener('dblclick', function(e) {
        if (e.target === desktopEl || e.target.classList.contains('kenos-desktop')) {
          if (experienceWindow) {
            experienceWindow.style.display = 'none';
            experienceWindow.classList.remove('fullscreen');
          }
          if (projectsWindow) {
            projectsWindow.style.display = 'none';
            projectsWindow.classList.remove('fullscreen');
          }
          if (toolsWindow) {
            toolsWindow.style.display = 'none';
            toolsWindow.classList.remove('fullscreen');
          }
          if (whoamiWindow) {
            whoamiWindow.style.display = 'none';
            whoamiWindow.classList.remove('fullscreen');
          }
          if (certificatesWindow) {
            certificatesWindow.style.display = 'none';
            certificatesWindow.classList.remove('fullscreen');
          }
          if (contactWindow) {
            contactWindow.style.display = 'none';
            contactWindow.classList.remove('fullscreen');
          }
        }
      });

      console.log('✨ KenOS components ready. Double-click Experience, Projects, Tools, Whoami, Certificates, or Contact icons.');
})();