// ============================================================
    // SINGLE CLICK HANDLER FOR MOBILE/TABLET
    // ============================================================
    function handleIconClick(iconId) {
      if (window.innerWidth <= 991) {
        const icon = document.getElementById(iconId);
        if (icon) {
          const event = new MouseEvent('dblclick', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          icon.dispatchEvent(event);
        }
      }
    }

    // ============================================================
    // CALENDAR WIDGET (Desktop + Mobile)
    // ============================================================
    (function() {
      // Desktop elements
      const monthYearEl = document.getElementById('monthYear');
      const dayGridEl = document.getElementById('dayGrid');
      const clockHoursEl = document.getElementById('clockHours');
      const clockSecondsEl = document.getElementById('clockSeconds');
      const clockAmPmEl = document.getElementById('clockAmPm');
      const dateDisplayEl = document.getElementById('dateDisplay');
      const uptimeDisplay = document.getElementById('uptimeDisplay');
      const weatherDisplay = document.getElementById('weatherDisplay');

      // Mobile elements
      const monthYearMobile = document.getElementById('monthYearMobile');
      const dayGridMobile = document.getElementById('dayGridMobile');
      const clockHoursMobile = document.getElementById('clockHoursMobile');
      const clockSecondsMobile = document.getElementById('clockSecondsMobile');
      const clockAmPmMobile = document.getElementById('clockAmPmMobile');
      const dateDisplayMobile = document.getElementById('dateDisplayMobile');
      const weatherDisplayMobile = document.getElementById('weatherDisplayMobile');

      const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      let startTime = Date.now();

      function renderDayGrid(container, year, month, today) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let html = '';
        dayNames.forEach(name => {
          html += `<span class="day-name">${name}</span>`;
        });

        const prevMonthStart = daysInPrevMonth - firstDay + 1;
        for (let i = 0; i < firstDay; i++) {
          html += `<span class="day-number other-month">${prevMonthStart + i}</span>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
          const isToday = d === today ? 'today' : '';
          const dayOfWeek = new Date(year, month, d).getDay();
          const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : '';
          html += `<span class="day-number ${isToday} ${isWeekend}">${d}</span>`;
        }

        const totalCells = firstDay + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
          html += `<span class="day-number other-month">${i}</span>`;
        }

        container.innerHTML = html;
      }

      function updateCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();

        if (monthYearEl) {
          monthYearEl.textContent = `${monthNames[month]} ${year}`;
          renderDayGrid(dayGridEl, year, month, today);
        }

        if (monthYearMobile) {
          monthYearMobile.textContent = `${monthNames[month]} ${year}`;
          renderDayGrid(dayGridMobile, year, month, today);
        }

        const dateStr = now.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        if (dateDisplayEl) dateDisplayEl.textContent = dateStr;
        if (dateDisplayMobile) dateDisplayMobile.textContent = dateStr;
      }

      function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const hoursStr = String(hours).padStart(2, '0');

        if (clockHoursEl) clockHoursEl.textContent = `${hoursStr}:${minutes}`;
        if (clockSecondsEl) clockSecondsEl.textContent = seconds;
        if (clockAmPmEl) clockAmPmEl.textContent = ampm;

        if (clockHoursMobile) clockHoursMobile.textContent = `${hoursStr}:${minutes}`;
        if (clockSecondsMobile) clockSecondsMobile.textContent = seconds;
        if (clockAmPmMobile) clockAmPmMobile.textContent = ampm;
      }

      function updateUptime() {
        const elapsed = Date.now() - startTime;
        const seconds = Math.floor(elapsed / 1000);
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        if (uptimeDisplay) uptimeDisplay.textContent = `${h}:${m}:${s}`;
      }

      function updateWeather() {
        const weathers = ['🌤 72°F · Clear', '⛅ 68°F · Partly Cloudy', '🌧 62°F · Light Rain', '☀️ 75°F · Sunny', '🌤 70°F · Mostly Clear', '🌦 65°F · Showers'];
        const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];

        if (weatherDisplay && !weatherDisplay.dataset.initialized) {
          weatherDisplay.textContent = randomWeather;
          weatherDisplay.dataset.initialized = 'true';
        }
        if (weatherDisplayMobile && !weatherDisplayMobile.dataset.initialized) {
          weatherDisplayMobile.textContent = randomWeather;
          weatherDisplayMobile.dataset.initialized = 'true';
        }
      }

      function updateTaskbarClock() {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const el = document.getElementById('liveTime');
        if (el) el.textContent = `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
      }

      updateCalendar();
      updateClock();
      updateUptime();
      updateWeather();
      updateTaskbarClock();

      setInterval(updateClock, 1000);
      setInterval(updateUptime, 1000);
      setInterval(updateTaskbarClock, 1000);
      setInterval(updateCalendar, 60000);
      setInterval(updateWeather, 300000);

      console.log('📅 Calendar widget loaded');
    })();