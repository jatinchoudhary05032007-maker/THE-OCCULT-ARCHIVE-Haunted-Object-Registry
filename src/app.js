/**
 * THE OCCULT ARCHIVE - Core Application Logic
 * Recreated faithful to "The Occult Archive Dashboard Blueprint"
 * Site-19 Sub-Terra // Special Recovery Vault
 */

(function () {
  'use strict';

  // Storage Keys (V3 Seed with 12 Classified Objects matching image.png)
  const STORAGE_KEY_ARTIFACTS = 'OCCULT_BLUEPRINT_ARTIFACTS_V3';
  const STORAGE_KEY_INCIDENTS = 'OCCULT_BLUEPRINT_INCIDENTS_V2';
  const STORAGE_KEY_THEME = 'OCCULT_BLUEPRINT_THEME_V2';
  const STORAGE_KEY_SCANLINES = 'OCCULT_BLUEPRINT_SCANLINES_V2';

  // Presets matching Blueprint
  const PRESET_IMAGES = [
    { label: "Annabelle Doll", url: "./hero-annabelle.jpg" },
    { label: "Haunted Mirror", url: "./hero-artifact.jpg" },
    { label: "Cursed Music Box", url: "./artifact-musicbox.jpg" },
    { label: "Cursed Painting", url: "./artifact-painting.jpg" },
    { label: "Ouroboros Ring", url: "./artifact-ring.jpg" },
    { label: "Unknown Entity (R-03)", url: "./containment-chamber-red.jpg" }
  ];

  // Application State
  const state = {
    currentScreen: 'hero', // 'hero', 'command-center', 'registry', 'dossier', 'containment', 'incidents', 'add-object'
    isDaylight: false,
    scanlinesActive: true,
    audioActive: true,
    droneActive: false,
    searchQuery: '',
    filterDanger: 'All Danger Levels',
    filterStatus: 'All Status',
    filterCategory: 'All Categories',
    sortBy: 'Name',
    selectedArtifactId: 'REG-001',
    selectedRoomId: 'R-03',
    dossierActiveTab: 'history', // 'history', 'inspections', 'notes'
    editingArtifact: null,
    isIncidentFormOpen: false,
    artifacts: [],
    incidents: [],
    facility: window.OCCULT_INITIAL_DATA.facility
  };

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initialize Data
  function initData() {
    try {
      const APP_BUILD_VERSION = 'v8.0-panoramic-exact';
      if (localStorage.getItem('OCCULT_CACHE_VERSION') !== APP_BUILD_VERSION) {
        localStorage.removeItem(STORAGE_KEY_ARTIFACTS);
        localStorage.removeItem(STORAGE_KEY_INCIDENTS);
        localStorage.setItem('OCCULT_CACHE_VERSION', APP_BUILD_VERSION);
      }

      const storedArtifacts = localStorage.getItem(STORAGE_KEY_ARTIFACTS);
      if (storedArtifacts) {
        const parsed = JSON.parse(storedArtifacts);
        if (Array.isArray(parsed) && parsed.length >= 12) {
          state.artifacts = parsed;
        } else {
          state.artifacts = [...window.OCCULT_INITIAL_DATA.artifacts];
          saveArtifacts();
        }
      } else {
        state.artifacts = [...window.OCCULT_INITIAL_DATA.artifacts];
        saveArtifacts();
      }

      const storedIncidents = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (storedIncidents) {
        state.incidents = JSON.parse(storedIncidents);
      } else {
        state.incidents = [...window.OCCULT_INITIAL_DATA.incidents];
        saveIncidents();
      }

      const storedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (storedTheme === 'daylight') {
        state.isDaylight = true;
        document.body.classList.add('daylight-mode');
      }

      const storedScanlines = localStorage.getItem(STORAGE_KEY_SCANLINES);
      if (storedScanlines === 'false') {
        state.scanlinesActive = false;
        document.body.classList.add('scanlines-off');
      }
    } catch (e) {
      console.error("Storage error:", e);
      state.artifacts = [...window.OCCULT_INITIAL_DATA.artifacts];
      state.incidents = [...window.OCCULT_INITIAL_DATA.incidents];
    }
  }

  function saveArtifacts() {
    try {
      localStorage.setItem(STORAGE_KEY_ARTIFACTS, JSON.stringify(state.artifacts));
    } catch (e) {
      console.warn("Could not save artifacts to localStorage", e);
    }
  }

  function saveIncidents() {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(state.incidents));
    } catch (e) {
      console.warn("Could not save incidents to localStorage", e);
    }
  }

  // Derive Statistics directly from live data
  function getStats() {
    const total = state.artifacts.length;
    const secure = state.artifacts.filter(a => a.containmentStatus === 'Contained').length;
    const critical = state.artifacts.filter(a => a.dangerLevel === 'CRITICAL').length;
    const breach = state.artifacts.filter(a => a.containmentStatus === 'Breached').length;
    return { total, secure, critical, breach };
  }

  // Toast Notification
  function showToast(message, type = 'info', title = 'ARCHIVE NOTICE') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-pill toast-pill-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#55C99A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E74747" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="2.5"><polygon points="12 2 2 22 22 22 12 2"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    }

    toast.innerHTML = `
      <div style="flex-shrink:0; margin-top:2px;">${iconSvg}</div>
      <div style="flex-grow:1;">
        <div style="font-weight:700; font-size:0.75rem; letter-spacing:0.06em; margin-bottom:2px; color:var(--text-ivory);">${escapeHtml(title)}</div>
        <div style="font-size:0.8rem; color:var(--text-stone);">${escapeHtml(message)}</div>
      </div>
    `;

    container.appendChild(toast);
    window.OccultAudio.playStamp();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3800);
  }

  // Navigation Router
  function navigate(screenName, payload = null) {
    window.OccultAudio.playStamp();
    if (screenName === 'alliance') {
      closeMobileDrawer();
      closeCuratorModal();
      if (state.currentScreen !== 'hero') {
        navigate('hero');
        setTimeout(() => {
          const el = document.getElementById('alliance-protocol');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 180);
      } else {
        const el = document.getElementById('alliance-protocol');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      showToast("ALLIANCE PROTOCOL ACCESSED: Kapidhwaj Innovations official technology partnership dossier.", "info", "KAPIDHWAJ // ALLIANCE");
      return;
    }
    if (state.currentScreen === 'hero' && screenName !== 'hero' && window.AtmosphericEngine) {
      window.AtmosphericEngine.stop();
    }
    state.currentScreen = screenName;
    if (payload && payload.artifactId) {
      state.selectedArtifactId = payload.artifactId;
    }
    if (payload && payload.roomId) {
      state.selectedRoomId = payload.roomId;
    }
    const container = document.getElementById('main-content');
    if (container) {
      container.className = screenName === 'hero' ? 'app-container hero-container-flush' : `app-container screen-container-${screenName}`;
    }
    document.body.classList.toggle('on-hero-screen', screenName === 'hero');
    closeMobileDrawer();
    closeCuratorModal();
    renderNavbar();
    renderCurrentScreen();
    updateFooterTelemetry();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Toggle Daylight / Midnight
  function toggleDaylight() {
    state.isDaylight = !state.isDaylight;
    if (state.isDaylight) {
      document.body.classList.add('daylight-mode');
      localStorage.setItem(STORAGE_KEY_THEME, 'daylight');
      window.OccultAudio.playSolarFlare(true);
      showToast("SOLAR AUTOPSY PROTOCOL ENGAGED: Dawn sunbeams pierce Site-19 cathedral vaults. Ultraviolet containment diagnostics running.", "warning", "SUNRISE MODE ACTIVATED");
    } else {
      document.body.classList.remove('daylight-mode');
      localStorage.setItem(STORAGE_KEY_THEME, 'midnight');
      window.OccultAudio.playSolarFlare(false);
      showToast("MIDNIGHT VOID RESTORED: Nocturnal containment seals engaged.", "info", "MIDNIGHT VOID RESTORED");
    }
    if (window.AtmosphericEngine) {
      window.AtmosphericEngine.updateTheme(state.isDaylight);
    }
    renderNavbar();
    renderCurrentScreen();
    updateFooterTelemetry();
  }

  // Toggle Audio / Open Acoustic Overwatch Control Panel
  function toggleAudio() {
    openAudioControlPanel();
  }

  // Toggle Scanlines
  function toggleScanlines() {
    state.scanlinesActive = !state.scanlinesActive;
    if (state.scanlinesActive) {
      document.body.classList.remove('scanlines-off');
      localStorage.setItem(STORAGE_KEY_SCANLINES, 'true');
      showToast("CRT surveillance scanlines enabled", "info");
    } else {
      document.body.classList.add('scanlines-off');
      localStorage.setItem(STORAGE_KEY_SCANLINES, 'false');
      showToast("CRT surveillance scanlines disabled", "info");
    }
  }

  // Toggle Drone
  function toggleDrone() {
    state.droneActive = window.OccultAudio.toggleDrone();
    showToast(state.droneActive ? "Occult sub-harmonic drone running (55Hz)" : "Occult drone paused", "info");
    renderCurrentScreen();
  }

  // Breach Simulation Actions
  function triggerSimulationBreach() {
    window.OccultAudio.playBreachAlarm();
    
    // Find R-03 artifact or Annabelle
    const breachedArtifact = state.artifacts.find(a => a.id === 'REG-006') || state.artifacts[0];
    breachedArtifact.containmentStatus = 'Breached';
    
    const r03 = state.facility.rooms.find(r => r.id === 'R-03');
    if (r03) {
      r03.status = 'BREACH';
      r03.inspectionStatus = 'Overdue';
    }

    // Add Incident
    const newInc = {
      id: `INC-SIM-${Date.now().toString().slice(-4)}`,
      dateShort: "OCT 29",
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      artifactId: breachedArtifact.id,
      artifactName: breachedArtifact.name,
      location: "Room R-03",
      severity: "CRITICAL",
      description: "Containment breach detected. Redundant laser barriers collapsing. Emergency lockdown initiated.",
      reporter: "SYSTEM SIMULATION"
    };

    state.incidents.unshift(newInc);
    saveArtifacts();
    saveIncidents();

    showToast("CRITICAL ALERT: Containment breach simulated in Room R-03!", "error", "DEFCON 1 ALARM");
    renderNavbar();
    renderCurrentScreen();
    updateFooterTelemetry();
  }

  function resolveSimulationBreach() {
    window.OccultAudio.playContainmentRestored();

    state.artifacts.forEach(a => {
      if (a.containmentStatus === 'Breached') {
        a.containmentStatus = 'Contained';
      }
    });

    const r03 = state.facility.rooms.find(r => r.id === 'R-03');
    if (r03) {
      r03.status = 'SECURE';
      r03.inspectionStatus = 'On Time';
    }

    const newInc = {
      id: `INC-RES-${Date.now().toString().slice(-4)}`,
      dateShort: "OCT 29",
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      artifactId: "REG-006",
      artifactName: "UNKNOWN ENTITY",
      location: "Room R-03",
      severity: "LOW",
      description: "Containment field re-established by Protocol Omega. Seal pressure normalized.",
      reporter: "SECURITY CHIEF"
    };

    state.incidents.unshift(newInc);
    saveArtifacts();
    saveIncidents();

    showToast("CONTAINMENT RESTORED: Room R-03 laser barrier resealed.", "success", "STASIS ACTIVE");
    renderNavbar();
    renderCurrentScreen();
    updateFooterTelemetry();
  }

  // Reset to Factory Baseline
  function resetToDefault() {
    if (confirm("CONFIRM ARCHIVE PURGE: Revert all artifacts, rooms, and incident logs back to the factory reference blueprint?")) {
      state.artifacts = JSON.parse(JSON.stringify(window.OCCULT_INITIAL_DATA.artifacts));
      state.incidents = JSON.parse(JSON.stringify(window.OCCULT_INITIAL_DATA.incidents));
      state.facility = JSON.parse(JSON.stringify(window.OCCULT_INITIAL_DATA.facility));
      saveArtifacts();
      saveIncidents();
      window.OccultAudio.playStamp();
      showToast("Archive database restored to reference baseline.", "warning", "ARCHIVE PURGED");
      renderNavbar();
      renderCurrentScreen();
      updateFooterTelemetry();
    }
  }

  // =========================================================================
  // NAVBAR (Matching image.png Header exactly)
  // =========================================================================
  function renderNavbar() {
    const navbarEl = document.getElementById('archive-navbar');
    if (!navbarEl) return;

    navbarEl.className = 'blueprint-navbar';
    navbarEl.innerHTML = `
      <!-- Brand Logo Group matching image.png -->
      <a href="#hero" class="nav-brand-group" id="nav-brand-link" title="The Occult Archive Home">
        <div class="nav-brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 22 2 4 22 4"/>
            <circle cx="12" cy="11" r="3.2"/>
            <line x1="12" y1="4" x2="12" y2="18"/>
          </svg>
        </div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">THE OCCULT ARCHIVE</span>
          <span class="nav-brand-sub">HAUNTED OBJECT REGISTRY</span>
        </div>
      </a>

      <!-- Center Links matching image.png -->
      <nav class="nav-menu-links">
        <button class="nav-link-item ${state.currentScreen === 'command-center' ? 'active' : ''}" data-nav="command-center">
          Command Center
        </button>
        <button class="nav-link-item ${state.currentScreen === 'registry' || state.currentScreen === 'dossier' ? 'active' : ''}" data-nav="registry">
          Registry
        </button>
        <button class="nav-link-item ${state.currentScreen === 'incidents' ? 'active' : ''}" data-nav="incidents">
          Incidents
        </button>
        <button class="nav-link-item ${state.currentScreen === 'containment' ? 'active' : ''}" data-nav="containment">
          Containment <span class="nav-inline-plus-badge" data-nav="add-object" title="Register New Cursed Object">+</span>
        </button>
        <button class="nav-link-item ${state.currentScreen === 'alliance' ? 'active' : ''}" data-nav="alliance" title="Official Technology Alliance // Kapidhwaj Innovations">
          Alliance <span class="nav-sponsor-badge">SPONSOR</span>
        </button>
      </nav>

      <!-- Right Utility Controls matching image.png -->
      <div class="nav-tool-icons">
        <button class="nav-theme-toggle-compact ${state.isDaylight ? 'is-daylight' : ''}" id="btn-daylight-toggle" title="Toggle Sunrise Autopsy / Midnight Void">
          <span class="theme-icon">${state.isDaylight ? '☀️' : '🌙'}</span>
          <span class="theme-text">${state.isDaylight ? 'SUNRISE' : 'MIDNIGHT'}</span>
        </button>

        <button class="nav-icon-btn nav-audio-btn ${window.OccultAudio.isAudioOn() ? 'audio-is-on' : 'audio-is-off'}" id="btn-audio-toggle" title="Acoustic Surveillance Telemetry & Ambient Soundscape">
          <span class="audio-wave-anim" aria-hidden="true">
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
          </span>
          <svg class="audio-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${window.OccultAudio.isAudioOn() ? `
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            ` : `
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            `}
          </svg>
        </button>

        <button class="nav-icon-btn" id="btn-search-toggle" title="Search Registry">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        <button class="nav-icon-btn nav-drawer-btn" id="btn-menu-drawer" title="Classified Archival Drawer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    `;

    // Listeners
    document.getElementById('nav-brand-link').addEventListener('click', (e) => {
      e.preventDefault();
      navigate('hero');
    });

    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dest = e.currentTarget.getAttribute('data-nav');
        navigate(dest);
      });
    });

    document.getElementById('btn-search-toggle').addEventListener('click', () => {
      navigate('registry');
      setTimeout(() => {
        const s = document.getElementById('registry-search-input');
        if (s) s.focus();
      }, 150);
    });

    document.getElementById('btn-daylight-toggle').addEventListener('click', toggleDaylight);
    document.getElementById('btn-menu-drawer').addEventListener('click', openMobileDrawer);

    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openAudioControlPanel();
      });
    }
  }

  // =========================================================================
  // MOBILE NAVIGATION DRAWER
  // =========================================================================
  function openMobileDrawer() {
    window.OccultAudio.playStamp();
    const overlay = document.getElementById('mobile-drawer-overlay');
    const drawer = document.getElementById('mobile-drawer');
    if (!overlay || !drawer) return;

    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="nav-brand-group">
          <div class="nav-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.2">
              <polygon points="12 22 2 4 22 4"/>
              <circle cx="12" cy="11" r="3.5"/>
              <line x1="12" y1="4" x2="12" y2="18"/>
            </svg>
          </div>
          <div class="nav-brand-text">
            <span class="nav-brand-title">THE OCCULT ARCHIVE</span>
            <span class="nav-brand-sub">SITE-19 SUB-TERRA</span>
          </div>
        </div>
        <button class="drawer-close-btn" id="drawer-btn-close" aria-label="Close navigation drawer">✕</button>
      </div>

      <nav class="drawer-nav-list">
        <button class="drawer-nav-item ${state.currentScreen === 'hero' ? 'active' : ''}" data-drawer-nav="hero">
          <span class="drawer-item-icon">🏛️</span>
          <span>Archival Vitrine (Hero)</span>
        </button>
        <button class="drawer-nav-item ${state.currentScreen === 'command-center' ? 'active' : ''}" data-drawer-nav="command-center">
          <span class="drawer-item-icon">⚡</span>
          <span>Command Center</span>
        </button>
        <button class="drawer-nav-item ${state.currentScreen === 'registry' || state.currentScreen === 'dossier' ? 'active' : ''}" data-drawer-nav="registry">
          <span class="drawer-item-icon">🗄️</span>
          <span>Object Registry</span>
        </button>
        <button class="drawer-nav-item ${state.currentScreen === 'incidents' ? 'active' : ''}" data-drawer-nav="incidents">
          <span class="drawer-item-icon">⚠️</span>
          <span>Incident Log</span>
        </button>
        <button class="drawer-nav-item ${state.currentScreen === 'containment' ? 'active' : ''}" data-drawer-nav="containment">
          <span class="drawer-item-icon">🔬</span>
          <span>Containment Center</span>
        </button>
        <button class="drawer-nav-item ${state.currentScreen === 'add-object' ? 'active' : ''}" data-drawer-nav="add-object">
          <span class="drawer-item-icon">➕</span>
          <span>Register New Object</span>
        </button>
        <button class="drawer-nav-item" data-drawer-nav="alliance">
          <span class="drawer-item-icon">✦</span>
          <span>The Alliance Protocol (Kapidhwaj)</span>
          <span class="nav-sponsor-badge" style="margin-left:auto;">SPONSOR</span>
        </button>
      </nav>

      <div class="drawer-telemetry-section">
        <div class="drawer-section-title">TELEMETRY & HARDWARE CONTROLS</div>
        
        <button class="drawer-control-btn" id="drawer-btn-theme">
          <span>${state.isDaylight ? '☀️ SUNRISE AUTOPSY (ACTIVE)' : '🌙 MIDNIGHT VOID (ACTIVE)'}</span>
          <span class="drawer-pill-action">SWITCH</span>
        </button>

        <button class="drawer-control-btn" id="drawer-btn-audio">
          <span>${state.audioActive ? '🔊 ACOUSTIC TELEMETRY: ON' : '🔇 ACOUSTIC TELEMETRY: MUTED'}</span>
          <span class="drawer-pill-action">TOGGLE</span>
        </button>

        <button class="drawer-control-btn" id="drawer-btn-scanlines">
          <span>${state.scanlinesActive ? '📺 CRT SCANLINES: ACTIVE' : '📺 CRT SCANLINES: DISABLED'}</span>
          <span class="drawer-pill-action">TOGGLE</span>
        </button>

        <button class="drawer-control-btn drawer-control-drill" id="drawer-btn-drill">
          <span>⚠️ EMERGENCY DEFCON 1 DRILL</span>
          <span class="drawer-pill-action">RUN</span>
        </button>
      </div>

      <div class="drawer-curator-card" id="drawer-curator-trigger">
        <div class="drawer-curator-badge">LEVEL 5</div>
        <div>
          <div class="drawer-curator-name">DR. VANCE MALCOLM</div>
          <div class="drawer-curator-sub">CHIEF ANOMALOUS RELICS CURATOR</div>
        </div>
      </div>
    `;

    overlay.classList.add('is-open');
    drawer.classList.add('is-open');

    // Drawer Listeners
    document.getElementById('drawer-btn-close').addEventListener('click', closeMobileDrawer);
    overlay.addEventListener('click', closeMobileDrawer);

    drawer.querySelectorAll('[data-drawer-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dest = e.currentTarget.getAttribute('data-drawer-nav');
        closeMobileDrawer();
        navigate(dest);
      });
    });

    document.getElementById('drawer-btn-theme').addEventListener('click', () => {
      toggleDaylight();
      openMobileDrawer();
    });

    document.getElementById('drawer-btn-audio').addEventListener('click', () => {
      closeMobileDrawer();
      openAudioControlPanel();
    });

    document.getElementById('drawer-btn-scanlines').addEventListener('click', () => {
      toggleScanlines();
      openMobileDrawer();
    });

    document.getElementById('drawer-btn-drill').addEventListener('click', () => {
      closeMobileDrawer();
      triggerSimulationBreach();
    });

    document.getElementById('drawer-curator-trigger').addEventListener('click', () => {
      closeMobileDrawer();
      openCuratorModal();
    });
  }

  function closeMobileDrawer() {
    const overlay = document.getElementById('mobile-drawer-overlay');
    const drawer = document.getElementById('mobile-drawer');
    if (overlay) overlay.classList.remove('is-open');
    if (drawer) drawer.classList.remove('is-open');
  }

  // =========================================================================
  // CURATOR CREDENTIALS MODAL
  // =========================================================================
  function openCuratorModal() {
    window.OccultAudio.playStamp();
    const overlay = document.getElementById('curator-modal-overlay');
    if (!overlay) return;

    const stats = getStats();

    overlay.innerHTML = `
      <div class="curator-modal-card" id="curator-card-box">
        <div class="curator-card-corner tl"></div>
        <div class="curator-card-corner tr"></div>
        <div class="curator-card-corner bl"></div>
        <div class="curator-card-corner br"></div>

        <div class="curator-card-header">
          <div class="curator-card-insignia">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <circle cx="12" cy="10" r="3"/>
              <line x1="12" y1="13" x2="12" y2="17"/>
            </svg>
          </div>
          <div>
            <div class="curator-docket-title">SITE-19 SUB-TERRA SECURITY CLEARANCE</div>
            <div class="curator-docket-sub">SPECIAL RECOVERY VAULT // PROJECT HESPERUS</div>
          </div>
          <button class="curator-modal-close" id="curator-btn-close" aria-label="Dismiss credentials">✕</button>
        </div>

        <div class="curator-id-grid">
          <div class="curator-photo-frame">
            <div class="curator-photo-silhouette">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="curator-seal-stamp">LEVEL 5</div>
          </div>

          <div class="curator-meta-details">
            <div class="curator-meta-row">
              <span class="curator-meta-lbl">NAME:</span>
              <span class="curator-meta-val">DR. VANCE MALCOLM</span>
            </div>
            <div class="curator-meta-row">
              <span class="curator-meta-lbl">ROLE:</span>
              <span class="curator-meta-val">CHIEF CURATOR & FORENSIC OCCULTIST</span>
            </div>
            <div class="curator-meta-row">
              <span class="curator-meta-lbl">CLEARANCE:</span>
              <span class="curator-meta-val" style="color:var(--accent-orange); font-weight:700;">LEVEL 5 (UNRESTRICTED)</span>
            </div>
            <div class="curator-meta-row">
              <span class="curator-meta-lbl">STATION:</span>
              <span class="curator-meta-val">CHAMBERS R-01 THROUGH R-05 (-450M)</span>
            </div>
            <div class="curator-meta-row">
              <span class="curator-meta-lbl">BIOMETRIC HASH:</span>
              <span class="curator-meta-val font-mono">#8841-OMEGA-VERIFIED</span>
            </div>
          </div>
        </div>

        <div class="curator-telemetry-summary">
          <div class="curator-telemetry-item">
            <div class="curator-telemetry-num">${stats.total}</div>
            <div class="curator-telemetry-lbl">OBJECTS UNDER CUSTODY</div>
          </div>
          <div class="curator-telemetry-item">
            <div class="curator-telemetry-num" style="color:var(--accent-orange);">${stats.critical}</div>
            <div class="curator-telemetry-lbl">CRITICAL ANOMALIES</div>
          </div>
          <div class="curator-telemetry-item">
            <div class="curator-telemetry-num" style="color:${stats.breach > 0 ? 'var(--accent-red)' : 'var(--accent-green)'};">${stats.breach}</div>
            <div class="curator-telemetry-lbl">ACTIVE BREACHES</div>
          </div>
        </div>

        <div class="curator-modal-actions">
          <button class="btn-blueprint-secondary btn-sm" id="curator-btn-baseline">
            RESTORE ARCHIVE SEED
          </button>
          <button class="btn-blueprint-danger btn-sm" id="curator-btn-drill">
            TRIGGER DEFCON 1 DRILL
          </button>
        </div>
      </div>
    `;

    overlay.classList.add('is-open');

    document.getElementById('curator-btn-close').addEventListener('click', closeCuratorModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCuratorModal();
    });

    document.getElementById('curator-btn-baseline').addEventListener('click', () => {
      closeCuratorModal();
      resetToDefault();
    });

    document.getElementById('curator-btn-drill').addEventListener('click', () => {
      closeCuratorModal();
      triggerSimulationBreach();
    });
  }

  function closeCuratorModal() {
    const overlay = document.getElementById('curator-modal-overlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  // =========================================================================
  // PREMIUM CINEMATIC AUDIO CONTROL PANEL
  // =========================================================================
  function openAudioControlPanel() {
    window.OccultAudio.playStamp();
    const overlay = document.getElementById('audio-popover-overlay');
    const panel = document.getElementById('audio-control-popover');
    if (!overlay || !panel) return;

    const isAudioOn = window.OccultAudio.isAudioOn();
    const masterVol = Math.round(window.OccultAudio.getMasterVolume() * 100);
    const ambVol = Math.round(window.OccultAudio.getAmbienceVolume() * 100);
    const sfxVol = Math.round(window.OccultAudio.getSfxVolume() * 100);
    const currentSoundscape = window.OccultAudio.getSoundscape();
    const isEnvOn = window.OccultAudio.isEnvironmentalActive();

    panel.innerHTML = `
      <div class="audio-panel-card">
        <div class="audio-panel-header">
          <div class="panel-header-left">
            <div class="panel-audio-badge">ACOUSTIC OVERWATCH // PROTOCOL MDCCCXCIV</div>
            <h3 class="panel-audio-title">HORROR SOUNDSCAPE CONTROL</h3>
            <div class="panel-audio-sub">SITE-19 SUB-TERRA // RESIDUAL SENSOR MATRIX</div>
          </div>
          <button class="audio-panel-close-btn" id="btn-audio-panel-close" aria-label="Close audio controls">✕</button>
        </div>

        <div class="audio-panel-body">
          <!-- Master Power Switch -->
          <div class="audio-power-row">
            <div class="power-status-group">
              <span class="power-pulse-light ${isAudioOn ? 'light-online' : 'light-offline'}"></span>
              <div class="power-status-text">
                <div class="power-status-label">MASTER ACOUSTIC FEED</div>
                <div class="power-status-val" id="panel-power-status-val">
                  ${isAudioOn ? 'LIVE // SOUNDSCAPE ACTIVE' : 'MUTED // SILENT SURVEILLANCE'}
                </div>
              </div>
            </div>
            <button class="btn-audio-power-toggle ${isAudioOn ? 'power-on' : 'power-off'}" id="btn-audio-master-toggle">
              ${isAudioOn ? '🔊 AUDIO: ON' : '🔇 AUDIO: OFF'}
            </button>
          </div>

          <!-- Volume Sliders Group -->
          <div class="audio-sliders-group">
            <div class="audio-slider-row">
              <div class="slider-label-row">
                <span class="slider-name">MASTER GAIN BUS</span>
                <span class="slider-val" id="val-master-vol">${masterVol}%</span>
              </div>
              <input type="range" class="audio-range-slider" id="slider-master-vol" min="0" max="100" value="${masterVol}">
            </div>

            <div class="audio-slider-row">
              <div class="slider-label-row">
                <span class="slider-name">BACKGROUND AMBIENCE &amp; DRONES</span>
                <span class="slider-val" id="val-ambience-vol">${ambVol}%</span>
              </div>
              <input type="range" class="audio-range-slider" id="slider-ambience-vol" min="0" max="100" value="${ambVol}">
            </div>

            <div class="audio-slider-row">
              <div class="slider-label-row">
                <span class="slider-name">ARTIFACT &amp; TELEMETRY SFX</span>
                <span class="slider-val" id="val-sfx-vol">${sfxVol}%</span>
              </div>
              <input type="range" class="audio-range-slider" id="slider-sfx-vol" min="0" max="100" value="${sfxVol}">
            </div>
          </div>

          <!-- Soundscape Selector -->
          <div class="audio-soundscape-section">
            <div class="soundscape-title">ACTIVE HORROR SOUNDSCAPE</div>
            <div class="soundscape-options-grid">
              <button class="soundscape-card ${currentSoundscape === 'mansion' ? 'active' : ''}" data-soundscape="mansion">
                <div class="soundscape-card-top">
                  <span class="soundscape-icon">🏰</span>
                  <span class="soundscape-badge">CATHEDRAL VAULTS</span>
                </div>
                <div class="soundscape-desc">Haunted mansion wind, antique room creaks, and distant gothic drones.</div>
              </button>

              <button class="soundscape-card ${currentSoundscape === 'dark-drone' ? 'active' : ''}" data-soundscape="dark-drone">
                <div class="soundscape-card-top">
                  <span class="soundscape-icon">🕳️</span>
                  <span class="soundscape-badge">SUB-BASALT VOID</span>
                </div>
                <div class="soundscape-desc">Deep 42Hz cryogenic stasis hum and subterranean low-frequency rumble.</div>
              </button>

              <button class="soundscape-card ${currentSoundscape === 'procedural' ? 'active' : ''}" data-soundscape="procedural">
                <div class="soundscape-card-top">
                  <span class="soundscape-icon">⚙️</span>
                  <span class="soundscape-badge">SYNTHESIZED 55Hz</span>
                </div>
                <div class="soundscape-desc">Algorithmic dual-oscillator stasis wave synthesized in real-time.</div>
              </button>
            </div>
          </div>

          <!-- Random Environmental Hauntings Toggle -->
          <div class="audio-env-row">
            <div class="env-text-group">
              <div class="env-label">RANDOM ENVIRONMENTAL MANIFESTATIONS</div>
              <div class="env-desc">Periodic distant footsteps, whispers, door creaks, and thunder.</div>
            </div>
            <button class="btn-env-toggle ${isEnvOn ? 'env-active' : 'env-inactive'}" id="btn-env-toggle">
              ${isEnvOn ? '✓ ENABLED' : '✕ DISABLED'}
            </button>
          </div>

          <!-- Sound Audition Test Bench -->
          <div class="audio-audition-section">
            <div class="audition-title">ACOUSTIC AUDITION TEST BENCH</div>
            <div class="audition-btns-grid">
              <button class="btn-audition" data-test-sound="thunder">⚡ Thunder Strike</button>
              <button class="btn-audition" data-test-sound="creak">🚪 Door Creak</button>
              <button class="btn-audition" data-test-sound="footsteps">👣 Footsteps</button>
              <button class="btn-audition" data-test-sound="whisper">👻 Eerie Whisper</button>
              <button class="btn-audition" data-test-sound="alarm">⚠️ Breach Klaxon</button>
              <button class="btn-audition" data-test-sound="confirmation">📜 Vault Seal</button>
            </div>
          </div>
        </div>

        <div class="audio-panel-footer">
          <span class="panel-meta-text">ACOUSTIC STREAM: 22.05 kHz 16-BIT PCM // ZERO JUMPSCARES</span>
          <span class="panel-meta-status">STANDBY NOMINAL</span>
        </div>
      </div>
    `;

    overlay.classList.add('is-open');
    panel.classList.add('is-open');

    // Close listeners
    document.getElementById('btn-audio-panel-close').addEventListener('click', closeAudioControlPanel);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAudioControlPanel();
    });

    // Master Toggle listener
    document.getElementById('btn-audio-master-toggle').addEventListener('click', () => {
      const active = window.OccultAudio.toggleAudio();
      state.audioActive = active;
      showToast(active ? "Acoustic surveillance enabled: Horror soundscape online." : "Acoustic surveillance muted.", "info", "AUDIO TELEMETRY");
      openAudioControlPanel();
      renderNavbar();
    });

    // Sliders
    const sMaster = document.getElementById('slider-master-vol');
    const vMaster = document.getElementById('val-master-vol');
    if (sMaster && vMaster) {
      sMaster.addEventListener('input', (e) => {
        const val = e.target.value;
        vMaster.textContent = `${val}%`;
        window.OccultAudio.setMasterVolume(val / 100);
      });
    }

    const sAmb = document.getElementById('slider-ambience-vol');
    const vAmb = document.getElementById('val-ambience-vol');
    if (sAmb && vAmb) {
      sAmb.addEventListener('input', (e) => {
        const val = e.target.value;
        vAmb.textContent = `${val}%`;
        window.OccultAudio.setAmbienceVolume(val / 100);
      });
    }

    const sSfx = document.getElementById('slider-sfx-vol');
    const vSfx = document.getElementById('val-sfx-vol');
    if (sSfx && vSfx) {
      sSfx.addEventListener('input', (e) => {
        const val = e.target.value;
        vSfx.textContent = `${val}%`;
        window.OccultAudio.setSfxVolume(val / 100);
      });
    }

    // Soundscape cards
    panel.querySelectorAll('[data-soundscape]').forEach(card => {
      card.addEventListener('click', () => {
        const scape = card.getAttribute('data-soundscape');
        window.OccultAudio.setSoundscape(scape);
        window.OccultAudio.playStamp();
        showToast(`Soundscape switched to: ${scape.toUpperCase()}`, "info");
        openAudioControlPanel();
      });
    });

    // Environmental toggle
    const envBtn = document.getElementById('btn-env-toggle');
    if (envBtn) {
      envBtn.addEventListener('click', () => {
        const active = window.OccultAudio.toggleEnvironmental();
        window.OccultAudio.playStamp();
        openAudioControlPanel();
      });
    }

    // Audition buttons
    panel.querySelectorAll('[data-test-sound]').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundType = btn.getAttribute('data-test-sound');
        window.OccultAudio.testSound(soundType);
      });
    });
  }

  function closeAudioControlPanel() {
    const overlay = document.getElementById('audio-popover-overlay');
    const panel = document.getElementById('audio-control-popover');
    if (overlay) overlay.classList.remove('is-open');
    if (panel) panel.classList.remove('is-open');
  }

  // =========================================================================
  // ATMOSPHERIC ENGINE: HARD THUNDERSTORM, LIGHTNING & HORROR ENTITIES
  // =========================================================================
  const AtmosphericEngine = (function () {
    let animFrameId = null;
    let lightningTimerId = null;
    let particles = [];
    let embers = [];
    let stageEl = null;
    let flashEl = null;
    let windowAmbientEl = null;
    let lightningCanvas = null;
    let lightningCtx = null;
    let particlesCanvas = null;
    let particlesCtx = null;
    let specterEl = null;
    let runesEl = null;
    let isRunning = false;
    let lastWidth = 0;
    let lastHeight = 0;

    function prefersReducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function initParticles(width, height) {
      particles = [];
      embers = [];

      const dustCount = Math.min(38, Math.max(20, Math.floor(width / 38)));
      for (let i = 0; i < dustCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.8 + Math.random() * 1.5,
          alpha: 0.15 + Math.random() * 0.35,
          vx: (Math.random() - 0.5) * 0.22,
          vy: 0.04 + Math.random() * 0.24,
          angle: Math.random() * Math.PI * 2,
          angularSpeed: 0.008 + Math.random() * 0.016
        });
      }

      const emberCount = 16;
      for (let i = 0; i < emberCount; i++) {
        spawnEmber(width, height, true);
      }
    }

    function spawnEmber(width, height, randomY = false) {
      const altarCenterX = width * 0.52;
      embers.push({
        x: altarCenterX + (Math.random() - 0.5) * (width * 0.38),
        y: randomY ? height * (0.35 + Math.random() * 0.55) : height * 0.72 + Math.random() * 35,
        radius: 1.0 + Math.random() * 2.0,
        alpha: 0.45 + Math.random() * 0.45,
        maxAlpha: 0.45 + Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.34,
        vy: -(0.25 + Math.random() * 0.52),
        life: 0,
        maxLife: 200 + Math.random() * 250
      });
    }

    function resize() {
      if (!stageEl || !particlesCanvas || !lightningCanvas) return;
      const rect = stageEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;
      lastWidth = width;
      lastHeight = height;

      particlesCanvas.width = width * dpr;
      particlesCanvas.height = height * dpr;
      particlesCanvas.style.width = width + 'px';
      particlesCanvas.style.height = height + 'px';
      particlesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const winW = width * 0.62;
      const winH = height * 0.56;
      lightningCanvas.width = winW * dpr;
      lightningCanvas.height = winH * dpr;
      lightningCanvas.style.width = winW + 'px';
      lightningCanvas.style.height = winH + 'px';
      lightningCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particles.length === 0) {
        initParticles(width, height);
      }
    }

    function drawBranch(ctx, x1, y1, x2, y2, displace, branchProb, mainBranch = true) {
      if (displace < 3.5) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return;
      }

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const normalX = -(y2 - y1);
      const normalY = x2 - x1;
      const normalLen = Math.sqrt(normalX * normalX + normalY * normalY) || 1;

      const offset = (Math.random() - 0.5) * displace;
      const cx = midX + (normalX / normalLen) * offset;
      const cy = midY + (normalY / normalLen) * offset;

      drawBranch(ctx, x1, y1, cx, cy, displace / 2, branchProb * 0.82, mainBranch);
      drawBranch(ctx, cx, cy, x2, y2, displace / 2, branchProb * 0.82, mainBranch);

      if (Math.random() < branchProb && displace > 8) {
        const branchAngle = (Math.random() - 0.5) * 0.75;
        const branchLen = displace * (1.8 + Math.random() * 2.4);
        const bx = cx + Math.cos(branchAngle) * branchLen;
        const by = cy + Math.sin(branchAngle + 0.6) * branchLen;
        ctx.save();
        ctx.lineWidth = Math.max(0.7, (ctx.lineWidth || 1) * 0.55);
        drawBranch(ctx, cx, cy, bx, by, displace / 2, 0.16, false);
        ctx.restore();
      }
    }

    function renderLightningBolt(intensity = 'medium') {
      if (!lightningCtx || !lightningCanvas) return;
      const w = lightningCanvas.width / (window.devicePixelRatio || 1);
      const h = lightningCanvas.height / (window.devicePixelRatio || 1);

      lightningCtx.clearRect(0, 0, w, h);
      lightningCanvas.classList.add('active');

      const isHard = intensity === 'hard';
      const isStriking = intensity === 'striking' || isHard;

      lightningCtx.save();
      lightningCtx.lineCap = 'round';
      lightningCtx.lineJoin = 'round';

      // Primary Massive Jagged Bolt plunging down the vaulted arches
      const startX = w * (0.18 + Math.random() * 0.48);
      const startY = h * 0.01;
      const endX = startX + (Math.random() - 0.5) * (w * 0.38);
      const endY = h * (0.65 + Math.random() * 0.32);

      // Outer plasma glow
      lightningCtx.strokeStyle = isHard ? 'rgba(140, 205, 255, 0.68)' : 'rgba(125, 185, 255, 0.45)';
      lightningCtx.shadowColor = 'rgba(90, 180, 255, 0.95)';
      lightningCtx.shadowBlur = isHard ? 34 : (isStriking ? 22 : 14);
      lightningCtx.lineWidth = isHard ? 6.2 : (isStriking ? 4.5 : 3.0);
      drawBranch(lightningCtx, startX, startY, endX, endY, w * 0.24, isHard ? 0.52 : 0.42, true);

      // Inner intense electric core
      lightningCtx.strokeStyle = 'rgba(245, 250, 255, 0.98)';
      lightningCtx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      lightningCtx.shadowBlur = 8;
      lightningCtx.lineWidth = isHard ? 2.8 : 1.6;
      drawBranch(lightningCtx, startX, startY, endX, endY, w * 0.24, isHard ? 0.52 : 0.42, true);

      // HARD STRIKE: Secondary lateral fork stretching across stone vault ribs
      if (isHard) {
        const forkStartX = w * (0.14 + Math.random() * 0.22);
        const forkStartY = h * 0.04;
        const forkEndX = w * (0.62 + Math.random() * 0.28);
        const forkEndY = h * (0.32 + Math.random() * 0.3);

        lightningCtx.strokeStyle = 'rgba(120, 195, 255, 0.55)';
        lightningCtx.shadowColor = 'rgba(70, 160, 255, 0.9)';
        lightningCtx.shadowBlur = 24;
        lightningCtx.lineWidth = 4.2;
        drawBranch(lightningCtx, forkStartX, forkStartY, forkEndX, forkEndY, w * 0.2, 0.45, false);

        lightningCtx.strokeStyle = 'rgba(235, 245, 255, 0.95)';
        lightningCtx.lineWidth = 1.6;
        drawBranch(lightningCtx, forkStartX, forkStartY, forkEndX, forkEndY, w * 0.2, 0.45, false);
      }

      lightningCtx.restore();

      setTimeout(() => {
        if (lightningCtx) lightningCtx.clearRect(0, 0, w, h);
        if (lightningCanvas) lightningCanvas.classList.remove('active');
      }, isHard ? 125 : 95);
    }

    function triggerStrike(forcedIntensity = null) {
      if (!isRunning || !stageEl || prefersReducedMotion() || state.isDaylight) return;

      const rand = Math.random();
      const intensity = forcedIntensity || (rand > 0.65 ? 'hard' : (rand > 0.35 ? 'striking' : (rand > 0.15 ? 'medium' : 'distant')));

      const isHard = intensity === 'hard';
      const isStriking = intensity === 'striking' || isHard;

      const peakAlpha = isHard ? 0.84 : (intensity === 'striking' ? 0.56 : (intensity === 'medium' ? 0.36 : 0.20));
      const windowAlpha = isHard ? 1.0 : (intensity === 'striking' ? 0.85 : (intensity === 'medium' ? 0.60 : 0.32));

      // Occult Runes Warning Surge (160ms pre-flare on stone column)
      if (isStriking && runesEl) {
        runesEl.classList.add('surging');
        setTimeout(() => {
          if (runesEl) runesEl.classList.remove('surging');
        }, 550);
      }

      // Stage 1: Initial Pre-flash / Stepped leader (35ms)
      if (flashEl) {
        if (isHard) flashEl.classList.add('flash-hard');
        flashEl.style.opacity = (peakAlpha * 0.42).toString();
      }
      if (windowAmbientEl) windowAmbientEl.style.opacity = (windowAlpha * 0.4).toString();

      setTimeout(() => {
        // Gap dip (20ms)
        if (flashEl) flashEl.style.opacity = '0.04';
        if (windowAmbientEl) windowAmbientEl.style.opacity = '0.08';

        setTimeout(() => {
          // Stage 2: Main Return Stroke (85-110ms)
          if (intensity !== 'distant') {
            renderLightningBolt(intensity);
          }
          if (flashEl) flashEl.style.opacity = peakAlpha.toString();
          if (windowAmbientEl) windowAmbientEl.style.opacity = windowAlpha.toString();

          // Reveal sinister Archway Specter in sharp black relief
          if (specterEl) {
            specterEl.classList.add('illuminated');
            setTimeout(() => {
              if (specterEl) specterEl.classList.remove('illuminated');
            }, isHard ? 280 : 180);
          }

          // Camera shockwave impact
          if (isHard) {
            stageEl.classList.add('lightning-hard-impact');
            setTimeout(() => {
              if (stageEl) stageEl.classList.remove('lightning-hard-impact');
            }, 110);
          } else if (isStriking) {
            stageEl.classList.add('lightning-impact');
            setTimeout(() => {
              if (stageEl) stageEl.classList.remove('lightning-impact');
            }, 90);
          }

          // Audio: Immediate electrical ionization snap at strike peak
          if (isRunning && !state.isDaylight) {
            window.OccultAudio.playLightningSnap();
          }

          // Audio: Natural distance travel delay for rolling subterranean thunder
          const thunderDelay = isHard ? 140 : (intensity === 'striking' ? 380 : 650);
          setTimeout(() => {
            if (isRunning && !state.isDaylight) {
              window.OccultAudio.playThunder(intensity);
            }
          }, thunderDelay);

          setTimeout(() => {
            // Stage 3: Secondary pulse / re-strike (50ms)
            if (flashEl) flashEl.style.opacity = (peakAlpha * (isHard ? 0.6 : 0.45)).toString();
            if (windowAmbientEl) windowAmbientEl.style.opacity = (windowAlpha * 0.55).toString();

            setTimeout(() => {
              // Stage 4: Atmospheric afterglow & decay
              if (flashEl) {
                flashEl.classList.add('afterglow');
                flashEl.style.opacity = '0';
                setTimeout(() => {
                  if (flashEl) {
                    flashEl.classList.remove('afterglow');
                    flashEl.classList.remove('flash-hard');
                  }
                }, 750);
              }
              if (windowAmbientEl) windowAmbientEl.style.opacity = '0';
            }, 60);
          }, isHard ? 95 : 80);
        }, 25);
      }, 35);

      // Double thunderclap chance on hard strikes (28% chance of immediate follow-up strike)
      if (isHard && Math.random() < 0.28 && !forcedIntensity) {
        setTimeout(() => {
          if (isRunning && !state.isDaylight) {
            triggerStrike('striking');
          }
        }, 1350);
      } else {
        scheduleNextStrike();
      }
    }

    function scheduleNextStrike() {
      if (lightningTimerId) clearTimeout(lightningTimerId);
      if (!isRunning || state.isDaylight) return;

      // Active, frightening irregular interval: 7.5 to 15 seconds!
      const nextDelay = 7500 + Math.random() * 7500;
      lightningTimerId = setTimeout(() => {
        triggerStrike();
      }, nextDelay);
    }

    function animate() {
      if (!isRunning) return;

      if (particlesCtx && lastWidth > 0 && lastHeight > 0) {
        particlesCtx.clearRect(0, 0, lastWidth, lastHeight);

        const isDaylight = state.isDaylight;

        // Render Dust Motes
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.angle += p.angularSpeed;
          p.x += p.vx + Math.sin(p.angle) * 0.28;
          p.y += p.vy;

          if (p.y > lastHeight + 10) {
            p.y = -10;
            p.x = Math.random() * lastWidth;
          }
          if (p.x < -10) p.x = lastWidth + 10;
          if (p.x > lastWidth + 10) p.x = -10;

          particlesCtx.beginPath();
          particlesCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          if (isDaylight) {
            particlesCtx.fillStyle = `rgba(255, 225, 160, ${p.alpha * 1.2})`;
          } else {
            particlesCtx.fillStyle = `rgba(241, 230, 213, ${p.alpha})`;
          }
          particlesCtx.fill();
        }

        // Render Rising Embers
        for (let i = embers.length - 1; i >= 0; i--) {
          const e = embers[i];
          e.life++;
          e.y += e.vy;
          e.x += e.vx + Math.sin(e.life * 0.04) * 0.35;
          const progress = e.life / e.maxLife;
          e.alpha = e.maxAlpha * (1 - progress);

          if (progress >= 1 || e.y < lastHeight * 0.15) {
            embers.splice(i, 1);
            spawnEmber(lastWidth, lastHeight, false);
            continue;
          }

          particlesCtx.beginPath();
          particlesCtx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);

          if (isDaylight) {
            particlesCtx.fillStyle = `rgba(255, 200, 70, ${e.alpha * 0.75})`;
          } else {
            particlesCtx.fillStyle = `rgba(255, 110, 35, ${e.alpha})`;
            particlesCtx.shadowColor = 'rgba(255, 90, 31, 0.8)';
            particlesCtx.shadowBlur = 4;
          }
          particlesCtx.fill();
          particlesCtx.shadowBlur = 0;
        }
      }

      animFrameId = requestAnimationFrame(animate);
    }

    return {
      start: function () {
        this.stop();
        stageEl = document.getElementById('hero-panoramic-stage');
        flashEl = document.getElementById('hero-lightning-flash');
        windowAmbientEl = document.getElementById('hero-window-ambient');
        lightningCanvas = document.getElementById('hero-lightning-canvas');
        particlesCanvas = document.getElementById('hero-particles-canvas');
        specterEl = document.getElementById('hero-specter');
        runesEl = document.getElementById('hero-occult-runes');

        if (!stageEl || !particlesCanvas || !lightningCanvas) return;

        lightningCtx = lightningCanvas.getContext('2d');
        particlesCtx = particlesCanvas.getContext('2d');

        isRunning = true;
        resize();
        window.addEventListener('resize', resize);

        animate();

        if (!state.isDaylight && !prefersReducedMotion()) {
          lightningTimerId = setTimeout(() => {
            triggerStrike();
          }, 3500 + Math.random() * 3000);
        }
      },

      stop: function () {
        isRunning = false;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        if (lightningTimerId) {
          clearTimeout(lightningTimerId);
          lightningTimerId = null;
        }
        window.removeEventListener('resize', resize);
      },

      updateTheme: function (isDaylight) {
        if (isDaylight) {
          if (lightningTimerId) {
            clearTimeout(lightningTimerId);
            lightningTimerId = null;
          }
          if (flashEl) flashEl.style.opacity = '0';
          if (windowAmbientEl) windowAmbientEl.style.opacity = '0';
        } else {
          scheduleNextStrike();
        }
      },

      triggerManualStrike: function (intensity = 'hard') {
        triggerStrike(intensity);
      }
    };
  })();

  window.AtmosphericEngine = AtmosphericEngine;

  // =========================================================================
  // SCREEN 1: LANDING PAGE (HERO) — Recreated EXACT to image.png
  // =========================================================================
  function renderScreenHero() {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.className = 'app-container hero-container-flush';

    const stats = getStats();
    const featured = state.artifacts.find(a => a.isFeatured) || state.artifacts[0];

    container.innerHTML = `
      <section class="hero-panoramic-viewport" id="hero-panoramic-stage">
        <!-- Atmospheric Layers: Thunderstorm Lightning, Archway Specter, Occult Runes, Candle Glow, Rolling Fog, Dust & Embers -->
        <div class="hero-ambient-lighting" aria-hidden="true">
          <!-- The Archway Specter: Sinister cloaked shadow entity in the distant left cloister -->
          <div class="hero-shadow-specter" id="hero-specter">
            <div class="specter-eyes">
              <span class="specter-eye"></span>
              <span class="specter-eye"></span>
            </div>
            <svg class="hero-shadow-specter-body" viewBox="0 0 100 280">
              <path d="M50 14 C34 14 24 35 24 56 C24 74 32 88 30 114 C27 140 15 168 12 214 C10 244 8 276 8 280 L92 280 C92 276 90 244 88 214 C85 168 73 140 70 114 C68 88 76 74 76 56 C76 35 66 14 50 14 Z" fill="#040203"/>
              <path d="M50 11 C38 11 32 25 32 44 C32 58 38 68 50 68 C62 68 68 58 68 44 C68 25 62 11 50 11 Z" fill="#020102"/>
            </svg>
          </div>

          <!-- Occult Demonic Containment Runes on stone column -->
          <div class="hero-occult-runes" id="hero-occult-runes">
            <svg viewBox="0 0 100 260">
              <circle cx="50" cy="40" r="28" stroke="#FF5A1F" stroke-width="1.8" fill="none"/>
              <polygon points="50,15 75,52 25,52" stroke="#FF5A1F" stroke-width="1.4" fill="none"/>
              <circle cx="50" cy="40" r="10" stroke="#FF3C14" stroke-width="1.2" fill="none"/>
              <line x1="50" y1="68" x2="50" y2="100" stroke="#FF5A1F" stroke-width="2"/>
              <circle cx="50" cy="130" r="24" stroke="#FF5A1F" stroke-width="1.6" fill="none"/>
              <polygon points="50,108 72,142 28,142" stroke="#FF3C14" stroke-width="1.2" fill="none"/>
              <polygon points="50,152 72,118 28,118" stroke="#FF3C14" stroke-width="1.2" fill="none"/>
              <line x1="50" y1="154" x2="50" y2="185" stroke="#FF5A1F" stroke-width="2"/>
              <circle cx="50" cy="215" r="22" stroke="#FF5A1F" stroke-width="1.5" fill="none"/>
              <path d="M35 215 L50 200 L65 215 L50 230 Z" stroke="#FF3C14" stroke-width="1.4" fill="none"/>
            </svg>
          </div>

          <!-- Subtle Candlelight Flickering over center altar -->
          <div class="hero-candle-glow" id="hero-candle-glow"></div>

          <!-- Cold Ectoplasmic Stasis Vapor swirling in the vitrine base -->
          <div class="hero-vitrine-vapor"></div>

          <!-- Distant Gothic Window Lightning Zone (Clerestory window tracery) -->
          <div class="hero-lightning-window-zone" id="hero-lightning-window">
            <div class="hero-rain-window"></div>
            <div class="hero-window-ambient" id="hero-window-ambient"></div>
            <canvas id="hero-lightning-canvas" class="hero-lightning-canvas"></canvas>
          </div>

          <!-- Full-Screen Hero Lightning Flash Overlay -->
          <div class="hero-lightning-flash" id="hero-lightning-flash"></div>

          <!-- Slow-moving bottom floor mist layers -->
          <div class="hero-fog-layer hero-fog-1"></div>
          <div class="hero-fog-layer hero-fog-2"></div>

          <!-- Floating dust motes & drifting embers canvas -->
          <canvas id="hero-particles-canvas" class="hero-particles-canvas"></canvas>
        </div>

        <!-- Left Column: Typography, Subtext, CTAs, and Stats Ribbon matching image.png -->
        <div class="hero-content-col">
          <!-- Solar Protocol Alert Badge (Visible in Sunrise Mode) -->
          <div class="hero-solar-badge">
            <span>☀️</span>
            <span>SOLAR AUTOPSY IN PROGRESS // 06:14 AM DAWN TRANSIT</span>
          </div>

          <h1 class="hero-title-gothic">
            SOME OBJECTS<br>
            SHOULD REMAIN<br>
            <span class="highlight-buried">BURIED.</span>
          </h1>

          <p class="hero-sub-text">
            The Occult Archive catalogues anomalous relics, cursed effigies, and sentient vessels recovered from around the world.
          </p>

          <div class="hero-actions-row">
            <button class="hero-btn-primary" id="hero-btn-enter">
              ENTER THE ARCHIVE →
            </button>
            <button class="hero-btn-secondary" id="hero-btn-containment">
              VIEW CONTAINMENT STATUS
            </button>
          </div>

          <!-- Bottom Stats Ribbon matching image.png exactly: 12, 8, 3, 1 -->
          <div class="hero-stats-ribbon">
            <div class="hero-stat-block">
              <span class="hero-stat-num">${stats.total}</span>
              <span class="hero-stat-label">REGISTERED<br>ARTIFACTS</span>
            </div>
            <div class="hero-stat-block">
              <span class="hero-stat-num">${stats.secure}</span>
              <span class="hero-stat-label">SECURE &<br>CONTAINED</span>
            </div>
            <div class="hero-stat-block">
              <span class="hero-stat-num stat-color-critical">${stats.critical}</span>
              <span class="hero-stat-label">CRITICAL<br>THREATS</span>
            </div>
            <div class="hero-stat-block">
              <span class="hero-stat-num stat-color-breach">${stats.breach}</span>
              <span class="hero-stat-label">ACTIVE<br>BREACH</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Floating Featured Object Card matching image.png -->
        <div class="hero-featured-card-wrapper">
          <div class="hero-featured-card" id="hero-featured-card-box">
            <div class="featured-card-label">FEATURED OBJECT</div>
            <div class="featured-card-title">${escapeHtml(featured.name)}</div>
            <div class="featured-card-code">${escapeHtml(featured.id)}</div>
            <div class="featured-card-threat">DANGER LEVEL: ${escapeHtml(featured.dangerLevel)}</div>
            <button class="btn-featured-dossier" id="hero-featured-dossier-btn">
              VIEW DOSSIER →
            </button>
          </div>
        </div>
      </section>
    `;

    // Listeners
    document.getElementById('hero-btn-enter').addEventListener('click', () => navigate('registry'));
    document.getElementById('hero-btn-containment').addEventListener('click', () => navigate('containment'));
    document.getElementById('hero-featured-card-box').addEventListener('click', () => navigate('dossier', { artifactId: featured.id }));
    document.getElementById('hero-featured-dossier-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('dossier', { artifactId: featured.id });
    });

    addGeigerHover();
    AtmosphericEngine.start();
  }

  // =========================================================================
  // SCREEN 2: COMMAND CENTER (DASHBOARD) — Recreated from Blueprint Screen 2
  // =========================================================================
  function renderScreenCommandCenter() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const stats = getStats();
    const hasBreach = stats.breach > 0;
    const recentIncidents = state.incidents.slice(0, 4);

    container.innerHTML = `
      <!-- Header Row -->
      <div class="cc-header-row">
        <div>
          <h1 class="cc-title">COMMAND CENTER</h1>
          <div class="cc-subtitle">GLOBAL STATUS OVERVIEW // SITE-19 SUB-TERRA</div>
        </div>
        <div class="cc-status-meta">
          <div style="display:flex; align-items:center; gap:8px; justify-content:flex-end; margin-bottom:4px;">
            <button class="btn-blueprint-secondary btn-sm" id="btn-cc-quick-drill" style="border-color:${hasBreach ? 'var(--accent-green)' : 'var(--accent-red)'}; color:var(--text-ivory);">
              ${hasBreach ? '⚡ RESTORE CONTAINMENT' : '⚠️ SIMULATE DEFCON 1'}
            </button>
            <div style="display:flex; align-items:center; gap:6px;">
              <span>SITE-19</span>
              <span style="color:${hasBreach ? 'var(--accent-red)' : 'var(--accent-green)'};">◉</span>
            </div>
          </div>
          <div>OCT 29, 2026 • 12:20 AM // CRYOGENIC STASIS: ACTIVE</div>
        </div>
      </div>

      <!-- 4 Stats Cards matching Blueprint -->
      <div class="stats-cards-grid">
        <div class="stat-box">
          <div class="stat-box-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="stat-box-content">
            <div class="stat-box-number">${stats.total}</div>
            <div class="stat-box-label">TOTAL ARTIFACTS</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-box-icon" style="color:var(--accent-green);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <div class="stat-box-content">
            <div class="stat-box-number" style="color:var(--accent-green);">${stats.secure}</div>
            <div class="stat-box-label">SECURE</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-box-icon" style="color:var(--accent-red);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22 12 2"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="stat-box-content">
            <div class="stat-box-number" style="color:var(--accent-red);">${stats.critical}</div>
            <div class="stat-box-label">CRITICAL</div>
          </div>
        </div>

        <div class="stat-box" style="${hasBreach ? 'border-color:var(--accent-red); box-shadow:0 0 20px var(--accent-red-glow);' : ''}">
          <div class="stat-box-icon" style="color:var(--accent-red);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="stat-box-content">
            <div class="stat-box-number" style="color:var(--accent-red);">${stats.breach}</div>
            <div class="stat-box-label">ACTIVE BREACH</div>
          </div>
        </div>
      </div>

      <!-- Main Grid: Facility Map & Critical Alert / Incidents -->
      <div class="cc-main-grid">
        <!-- Left: Facility Map Panel -->
        <div class="cc-panel">
          <div class="cc-panel-header">
            <span class="cc-panel-title">FACILITY MAP</span>
          </div>

          <div class="facility-map-wrapper">
            <img src="${escapeHtml(state.facility.isometricMapUrl)}" alt="Site-19 Isometric Map" class="facility-map-img" onerror="this.onerror=null; this.src='./facility-isometric-map.jpg';" />

            <!-- Interactive Room Pins matching Blueprint -->
            <div class="room-pin room-pin-secure pin-r01" data-room="R-01">R-01 [SECURE]</div>
            <div class="room-pin room-pin-secure pin-r02" data-room="R-02">R-02 [SECURE]</div>
            <div class="room-pin room-pin-breach pin-r03" data-room="R-03">R-03 [BREACH]</div>
            <div class="room-pin room-pin-inspection pin-r04" data-room="R-04">R-04 [INSPECTION]</div>
            <div class="room-pin room-pin-secure pin-r05" data-room="R-05">R-05 [SECURE]</div>
          </div>

          <div style="padding:1rem 1.5rem; background:var(--bg-surface-subtle); display:flex; justify-content:flex-end;">
            <button class="btn-blueprint-secondary btn-sm" id="btn-cc-view-full-map">
              VIEW FULL MAP →
            </button>
          </div>
        </div>

        <!-- Right: Critical Alert & Recent Incidents -->
        <div>
          <!-- Critical Alert Box -->
          <div class="critical-alert-box">
            <div class="alert-heading-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 22 22 22 12 2"/></svg>
              <span>CRITICAL ALERT</span>
            </div>
            <div class="alert-main-title">CONTAINMENT BREACH DETECTED</div>
            <div class="alert-room-info">Room R-03 — Unknown Entity Activity</div>
            <button class="btn-blueprint-secondary btn-sm" id="btn-alert-details" style="border-color:var(--accent-red); color:var(--text-ivory);">
              VIEW DETAILS →
            </button>
          </div>

          <!-- Recent Incidents Box -->
          <div class="cc-panel">
            <div class="cc-panel-header">
              <span class="cc-panel-title">RECENT INCIDENTS</span>
              <button class="nav-link-item" id="btn-cc-view-all-incidents" style="font-size:0.75rem; text-decoration:underline;">
                VIEW ALL
              </button>
            </div>

            <div class="incidents-list-preview">
              ${recentIncidents.map(inc => {
                let pillClass = 'pill-status-low';
                if (inc.severity === 'CRITICAL') pillClass = 'pill-status-critical';
                else if (inc.severity === 'HIGH') pillClass = 'pill-status-high';
                else if (inc.severity === 'MEDIUM') pillClass = 'pill-status-medium';

                return `
                  <div class="incident-preview-row">
                    <span class="date-pill-badge">${escapeHtml(inc.dateShort)}</span>
                    <div class="incident-preview-text">
                      <strong>${escapeHtml(inc.location)}</strong> ${escapeHtml(inc.description)}
                    </div>
                    <span class="pill-status ${pillClass}">${escapeHtml(inc.severity)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Listeners
    document.querySelectorAll('.room-pin').forEach(pin => {
      pin.addEventListener('click', (e) => {
        const roomId = e.currentTarget.getAttribute('data-room');
        navigate('containment', { roomId });
      });
    });

    document.getElementById('btn-cc-view-full-map').addEventListener('click', () => navigate('containment'));
    document.getElementById('btn-alert-details').addEventListener('click', () => navigate('containment', { roomId: 'R-03' }));
    document.getElementById('btn-cc-view-all-incidents').addEventListener('click', () => navigate('incidents'));

    const quickDrillBtn = document.getElementById('btn-cc-quick-drill');
    if (quickDrillBtn) {
      quickDrillBtn.addEventListener('click', () => {
        if (hasBreach) {
          resolveSimulationBreach();
        } else {
          triggerSimulationBreach();
        }
      });
    }

    addGeigerHover();
  }

  // =========================================================================
  // SCREEN 3: OBJECT REGISTRY — Recreated from Blueprint Screen 3
  // =========================================================================
  function renderScreenRegistry() {
    const container = document.getElementById('main-content');
    if (!container) return;

    let filtered = state.artifacts.filter(a => {
      const q = state.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.origin.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);

      const matchesDanger = state.filterDanger === 'All Danger Levels' || a.dangerLevel === state.filterDanger;
      const matchesStatus = state.filterStatus === 'All Status' || a.containmentStatus === state.filterStatus;
      const matchesCategory = state.filterCategory === 'All Categories' || a.category === state.filterCategory;

      return matchesSearch && matchesDanger && matchesStatus && matchesCategory;
    });

    filtered.sort((a, b) => {
      if (state.sortBy === 'Name') return a.name.localeCompare(b.name);
      if (state.sortBy === 'Danger Level') return (b.dangerScore || 0) - (a.dangerScore || 0);
      return 0;
    });

    container.innerHTML = `
      <div class="registry-header">
        <h1 class="registry-title">OBJECT REGISTRY</h1>
        <div class="registry-subtitle">EXPLORE THE CATALOGUE OF CURSED ARTIFACTS</div>
      </div>

      ${state.isDaylight ? `
        <div class="registry-solar-banner">
          <span style="font-size:1.15rem;">☀️</span>
          <div>
            <strong>SOLAR AUTOPSY PROTOCOL ENGAGED:</strong> Showing daylight ultraviolet spectral reactions across 12 classified specimens.
          </div>
        </div>
      ` : ''}

      <!-- Filter Bar matching Blueprint -->
      <div class="registry-filter-bar">
        <div class="registry-search-input-wrap">
          <input 
            type="text" 
            id="registry-search-input" 
            class="input-blueprint" 
            placeholder="Search objects, origin, or properties..." 
            value="${escapeHtml(state.searchQuery)}"
          />
        </div>

        <select id="reg-filter-danger" class="select-blueprint">
          ${window.OCCULT_INITIAL_DATA.dangerLevels.map(lvl => `
            <option value="${escapeHtml(lvl)}" ${state.filterDanger === lvl ? 'selected' : ''}>${escapeHtml(lvl)}</option>
          `).join('')}
        </select>

        <select id="reg-filter-status" class="select-blueprint">
          ${window.OCCULT_INITIAL_DATA.containmentStatuses.map(st => `
            <option value="${escapeHtml(st)}" ${state.filterStatus === st ? 'selected' : ''}>${escapeHtml(st)}</option>
          `).join('')}
        </select>

        <select id="reg-filter-category" class="select-blueprint">
          ${window.OCCULT_INITIAL_DATA.categories.map(cat => `
            <option value="${escapeHtml(cat)}" ${state.filterCategory === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>
          `).join('')}
        </select>

        <select id="reg-sort-by" class="select-blueprint">
          <option value="Name" ${state.sortBy === 'Name' ? 'selected' : ''}>Sort by: Name</option>
          <option value="Danger Level" ${state.sortBy === 'Danger Level' ? 'selected' : ''}>Sort by: Danger Level</option>
        </select>
      </div>

      <!-- Grid matching Blueprint exactly -->
      ${filtered.length === 0 ? `
        <div style="padding:4rem; text-align:center; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:4px;">
          <h2 style="font-family:var(--font-serif); font-size:2rem; color:var(--accent-orange); margin-bottom:0.75rem;">NO ARTIFACTS MATCH SEARCH</h2>
          <p style="color:var(--text-stone); margin-bottom:1.5rem;">Adjust search filters to view catalogued paranormal specimens.</p>
          <button class="btn-blueprint-primary" id="btn-reg-reset">RESET FILTERS</button>
        </div>
      ` : `
        <div class="registry-grid-blueprint">
          ${filtered.map(art => {
            let dangerClass = 'pill-status-low';
            if (art.dangerLevel === 'CRITICAL') dangerClass = 'pill-status-critical';
            else if (art.dangerLevel === 'HIGH') dangerClass = 'pill-status-high';
            else if (art.dangerLevel === 'MEDIUM') dangerClass = 'pill-status-medium';

            let statusClass = 'pill-status-contained';
            if (art.containmentStatus === 'Breached') statusClass = 'pill-status-breach';
            else if (art.containmentStatus === 'Under Inspection') statusClass = 'pill-status-inspection';

            return `
              <div class="registry-card" data-id="${escapeHtml(art.id)}">
                <div class="registry-card-img-wrap">
                  <img src="${escapeHtml(art.imageUrl)}" alt="${escapeHtml(art.name)}" class="registry-card-img" loading="lazy" onerror="this.onerror=null; this.src='./hero-artifact.jpg';" />
                </div>
                <div class="registry-card-info">
                  <div>
                    <div class="registry-card-code">${escapeHtml(art.id)}</div>
                    <h3 class="registry-card-name">${escapeHtml(art.name)}</h3>
                    <div class="registry-card-subtitle">${escapeHtml(art.subtitle || art.category)}</div>
                  </div>
                  <div class="registry-card-pills-row">
                    <span class="pill-status ${dangerClass}">${escapeHtml(art.dangerLevel)}</span>
                    <span class="pill-status ${statusClass}">${escapeHtml(art.containmentStatus.toUpperCase())}</span>
                    ${state.isDaylight ? `<span class="registry-solar-tag">☀️ DAWN REACTIVE</span>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    // Listeners
    const searchInput = document.getElementById('registry-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderScreenRegistry();
      });
    }

    const dangerSelect = document.getElementById('reg-filter-danger');
    if (dangerSelect) {
      dangerSelect.addEventListener('change', (e) => {
        state.filterDanger = e.target.value;
        window.OccultAudio.playStamp();
        renderScreenRegistry();
      });
    }

    const statusSelect = document.getElementById('reg-filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.filterStatus = e.target.value;
        window.OccultAudio.playStamp();
        renderScreenRegistry();
      });
    }

    const categorySelect = document.getElementById('reg-filter-category');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        state.filterCategory = e.target.value;
        window.OccultAudio.playStamp();
        renderScreenRegistry();
      });
    }

    const sortSelect = document.getElementById('reg-sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        window.OccultAudio.playStamp();
        renderScreenRegistry();
      });
    }

    const resetBtn = document.getElementById('btn-reg-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.searchQuery = '';
        state.filterDanger = 'All Danger Levels';
        state.filterStatus = 'All Status';
        state.filterCategory = 'All Categories';
        renderScreenRegistry();
      });
    }

    document.querySelectorAll('.registry-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-id');
        navigate('dossier', { artifactId: id });
      });
    });

    addGeigerHover();
  }

  // =========================================================================
  // SCREEN 4: ARTIFACT DOSSIER — Recreated from Blueprint Screen 4
  // =========================================================================
  function renderScreenDossier() {
    const container = document.getElementById('main-content');
    if (!container) return;

    window.OccultAudio.playDossierOpen();

    const artifact = state.artifacts.find(a => a.id === state.selectedArtifactId) || state.artifacts[0];
    if (artifact && artifact.dangerLevel === 'CRITICAL') {
      setTimeout(() => {
        window.OccultAudio.playCriticalAlert();
      }, 380);
    }
    const linkedIncidents = state.incidents.filter(i => i.artifactId === artifact.id || i.artifactName.toUpperCase().includes(artifact.name.toUpperCase()));

    let dangerClass = 'pill-status-low';
    if (artifact.dangerLevel === 'CRITICAL') dangerClass = 'pill-status-critical';
    else if (artifact.dangerLevel === 'HIGH') dangerClass = 'pill-status-high';
    else if (artifact.dangerLevel === 'MEDIUM') dangerClass = 'pill-status-medium';

    let statusClass = 'pill-status-contained';
    if (artifact.containmentStatus === 'Breached') statusClass = 'pill-status-breach';
    else if (artifact.containmentStatus === 'Under Inspection') statusClass = 'pill-status-inspection';

    const thumbnails = artifact.galleryThumbnails || [artifact.imageUrl];

    container.innerHTML = `
      <button class="dossier-nav-back" id="btn-dossier-back">
        ← Back to Registry
      </button>

      <div class="dossier-three-col-layout">
        <!-- Left: Image & Forensic Thumbnails -->
        <div>
          <div class="dossier-main-photo-frame">
            <img src="${escapeHtml(artifact.imageUrl)}" alt="${escapeHtml(artifact.name)}" class="dossier-main-photo" id="dossier-active-img" onerror="this.onerror=null; this.src='./hero-artifact.jpg';" />
          </div>

          <div class="dossier-thumbs-row">
            ${thumbnails.map((t, idx) => `
              <div class="dossier-thumb ${idx === 0 ? 'active' : ''}" data-thumb="${escapeHtml(t)}">
                <img src="${escapeHtml(t)}" alt="Forensic angle ${idx + 1}" onerror="this.onerror=null; this.src='./hero-artifact.jpg';" />
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Center: Specifications, Paranormal Properties, Actions -->
        <div>
          <div class="dossier-code-label">${escapeHtml(artifact.id)}</div>
          <h2 class="dossier-item-name">${escapeHtml(artifact.name)}</h2>

          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap;">
            <span style="font-size:0.85rem; color:var(--text-stone); font-weight:600;">${escapeHtml(artifact.subtitle || artifact.category)}</span>
            <span class="pill-status ${dangerClass}">${escapeHtml(artifact.dangerLevel)}</span>
            <span class="pill-status ${statusClass}">${escapeHtml(artifact.containmentStatus.toUpperCase())}</span>
          </div>

          <!-- Metadata Spec Table matching Blueprint -->
          <div style="margin-bottom:1.5rem;">
            <div class="dossier-spec-row">
              <span>Origin</span>
              <span>${escapeHtml(artifact.origin)}</span>
            </div>
            <div class="dossier-spec-row">
              <span>Category</span>
              <span>${escapeHtml(artifact.category)}</span>
            </div>
            <div class="dossier-spec-row">
              <span>Discovery Date</span>
              <span>${escapeHtml(artifact.discoveryDate)}</span>
            </div>
            <div class="dossier-spec-row">
              <span>Current Location</span>
              <span>${escapeHtml(artifact.currentLocation || 'Room R-01')}</span>
            </div>
            <div class="dossier-spec-row">
              <span>Dimensions</span>
              <span>${escapeHtml(artifact.dimensions || '45 cm x 20 cm')}</span>
            </div>
          </div>

          <!-- Paranormal Properties -->
          <div class="dossier-section-heading">PARANORMAL PROPERTIES</div>
          <p class="dossier-props-text">
            ${escapeHtml(artifact.anomalousProperties)}
          </p>

          ${state.isDaylight ? `
            <div class="dossier-solar-box">
              <div class="dossier-solar-header">
                <span>☀️</span>
                <span>SOLAR AUTOPSY TELEMETRY // 06:14 AM DAWN TRANSIT</span>
              </div>
              <p class="dossier-solar-desc">
                ${escapeHtml(artifact.daylightReaction || "Subject demonstrates accelerated cellular and anomalous activity under unpolarized ultraviolet solar transit.")}
              </p>
            </div>
          ` : ''}

          <!-- Buttons matching Blueprint -->
          <div style="display:flex; gap:0.75rem; margin:1.5rem 0;">
            <button class="btn-blueprint-secondary btn-sm" id="btn-dossier-edit">
              EDIT OBJECT
            </button>
            <button class="btn-blueprint-primary btn-sm" id="btn-dossier-status-toggle">
              UPDATE STATUS
            </button>
          </div>

          <!-- Safety Procedures -->
          <div class="dossier-section-heading">SAFETY PROCEDURES</div>
          <p class="dossier-props-text" style="white-space:pre-line;">
            ${escapeHtml(artifact.safetyProtocols)}
          </p>
        </div>

        <!-- Right: Tabbed Timeline Panel matching Blueprint -->
        <div>
          <div class="dossier-tab-header">
            <button class="dossier-tab-btn ${state.dossierActiveTab === 'history' ? 'active' : ''}" data-tab="history">
              INCIDENT HISTORY
            </button>
            <button class="dossier-tab-btn ${state.dossierActiveTab === 'inspections' ? 'active' : ''}" data-tab="inspections">
              INSPECTIONS
            </button>
            <button class="dossier-tab-btn ${state.dossierActiveTab === 'notes' ? 'active' : ''}" data-tab="notes">
              NOTES
            </button>
          </div>

          <!-- Tab 1: Timeline matching Blueprint -->
          ${state.dossierActiveTab === 'history' ? `
            <div class="dossier-timeline">
              <div class="timeline-event-item">
                <span class="timeline-dot"></span>
                <div class="timeline-date-str">OCT 28, 2026</div>
                <div class="timeline-narrative">Unexplained movement detected during routine check.</div>
                <span class="pill-status pill-status-critical" style="margin-top:4px;">CRITICAL</span>
              </div>

              <div class="timeline-event-item">
                <span class="timeline-dot"></span>
                <div class="timeline-date-str">OCT 20, 2026</div>
                <div class="timeline-narrative">Audio recording captured (child laughter at 2:54 AM).</div>
              </div>

              <div class="timeline-event-item">
                <span class="timeline-dot"></span>
                <div class="timeline-date-str">OCT 05, 2026</div>
                <div class="timeline-narrative">Temperature drop in containment room (-6°C).</div>
              </div>

              <div class="timeline-event-item">
                <span class="timeline-dot"></span>
                <div class="timeline-date-str">SEP 12, 2026</div>
                <div class="timeline-narrative">Researcher reported vivid nightmares.</div>
              </div>

              <div class="timeline-event-item">
                <span class="timeline-dot"></span>
                <div class="timeline-date-str">AUG 01, 2026</div>
                <div class="timeline-narrative">Initial containment successful.</div>
              </div>
            </div>
          ` : (state.dossierActiveTab === 'inspections' ? `
            <div style="font-family:var(--font-mono); font-size:0.8rem; display:flex; flex-direction:column; gap:1rem;">
              <div style="padding:0.75rem; background:var(--bg-surface-subtle); border:1px solid var(--border-subtle);">
                <strong>NEXT AUDIT DUE:</strong> ${escapeHtml(artifact.inspectionDue || 'Oct 30, 2026')}
              </div>
              <div style="padding:0.75rem; background:var(--bg-surface-subtle); border:1px solid var(--border-subtle);">
                <strong>SEAL PRESSURE:</strong> 101.3 kPa (STABLE)
              </div>
              <div style="padding:0.75rem; background:var(--bg-surface-subtle); border:1px solid var(--border-subtle);">
                <strong>ACOUSTIC DAMPENING:</strong> -45 dB RATING
              </div>
            </div>
          ` : `
            <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-stone); line-height:1.6;">
              <p>Custodial Note: Under no circumstances may glass casing be cleaned with ammonia solutions. Use authorized blessed salt water sponge only.</p>
            </div>
          `)}
        </div>
      </div>
    `;

    // Listeners
    document.getElementById('btn-dossier-back').addEventListener('click', () => navigate('registry'));

    document.querySelectorAll('.dossier-thumb').forEach(th => {
      th.addEventListener('click', (e) => {
        document.querySelectorAll('.dossier-thumb').forEach(t => t.classList.remove('active'));
        th.classList.add('active');
        const src = th.getAttribute('data-thumb');
        const activeImg = document.getElementById('dossier-active-img');
        if (activeImg) activeImg.src = src;
      });
    });

    document.querySelectorAll('.dossier-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.dossierActiveTab = e.currentTarget.getAttribute('data-tab');
        renderScreenDossier();
      });
    });

    document.getElementById('btn-dossier-edit').addEventListener('click', () => {
      state.editingArtifact = artifact;
      navigate('add-object');
    });

    document.getElementById('btn-dossier-status-toggle').addEventListener('click', () => {
      const nextStatus = artifact.containmentStatus === 'Contained' ? 'Under Inspection' : (artifact.containmentStatus === 'Under Inspection' ? 'Breached' : 'Contained');
      artifact.containmentStatus = nextStatus;
      saveArtifacts();
      window.OccultAudio.playArchiveConfirmation();
      showToast(`${artifact.name} status updated to ${nextStatus}`, "info", "STATUS MODIFIED");
      renderScreenDossier();
    });

    addGeigerHover();
  }

  // =========================================================================
  // SCREEN 5: CONTAINMENT CENTER — Recreated from Blueprint Screen 5
  // =========================================================================
  function renderScreenContainment() {
    const container = document.getElementById('main-content');
    if (!container) return;

    window.OccultAudio.playIndustrialHum();

    const r03 = state.facility.rooms.find(r => r.id === 'R-03') || state.facility.rooms[2];
    const isR03Breached = r03.status === 'BREACH' || state.artifacts.some(a => a.containmentStatus === 'Breached');

    container.innerHTML = `
      <div style="margin-bottom:2rem;">
        <h1 style="font-family:var(--font-serif); font-size:3rem; line-height:1; color:var(--text-ivory);">CONTAINMENT CENTER</h1>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-orange); font-weight:700; margin-top:4px;">
          FACILITY: SITE-19
        </div>
      </div>

      <div class="containment-three-col-layout">
        <!-- Left: Room Selector matching Blueprint -->
        <div class="rooms-selector-panel">
          ${state.facility.rooms.map(room => {
            const isBreach = room.status === 'BREACH';
            const isInspect = room.status === 'INSPECTION';
            let badgeClass = 'pill-status-contained';
            if (isBreach) badgeClass = 'pill-status-breach';
            else if (isInspect) badgeClass = 'pill-status-inspection';

            return `
              <div class="room-select-item ${state.selectedRoomId === room.id ? 'active' : ''} ${isBreach ? 'room-active-breach' : ''}" data-room="${escapeHtml(room.id)}">
                <div>
                  <strong style="color:var(--text-ivory); font-family:var(--font-mono); font-size:0.85rem;">${escapeHtml(room.id)}</strong>
                  <div style="font-size:0.8rem; color:var(--text-stone);">${escapeHtml(room.artifactName)}</div>
                </div>
                <span class="pill-status ${badgeClass}">${escapeHtml(room.status)}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Center: Chamber Surveillance & Breach Simulator matching Blueprint -->
        <div class="chamber-surveillance-card">
          <div class="chamber-cam-feed">
            <img src="${escapeHtml(state.facility.containmentChamberUrl)}" alt="Containment Cell Feed" class="chamber-cam-img" onerror="this.onerror=null; this.src='./containment-chamber-red.jpg';" />
          </div>

          <div class="chamber-control-banner">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.8rem; font-weight:700; color:var(--text-stone);">
                ${escapeHtml(state.selectedRoomId)}
              </div>
              <div style="font-family:var(--font-serif); font-size:1.6rem; color:${isR03Breached ? 'var(--accent-red)' : 'var(--accent-green)'}; font-weight:700;">
                STATUS: ${isR03Breached ? 'BREACH' : 'SECURE'}
              </div>
              <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-stone);">
                ${state.selectedRoomId === 'R-03' ? 'UNKNOWN ENTITY' : 'SURVEILLANCE MONITORED'}
              </div>
            </div>

            <div>
              ${isR03Breached ? `
                <button class="btn-blueprint-primary" id="btn-sim-breach-toggle" style="background:var(--accent-green);">
                  RESTORE CONTAINMENT
                </button>
              ` : `
                <button class="btn-blueprint-danger" id="btn-sim-breach-toggle">
                  SIMULATE BREACH
                </button>
              `}
            </div>
          </div>
        </div>

        <!-- Right: Inspection Schedule matching Blueprint -->
        <div class="cc-panel">
          <div class="cc-panel-header">
            <span class="cc-panel-title">INSPECTION SCHEDULE</span>
            <span class="nav-link-item" style="font-size:0.72rem; text-decoration:underline;">VIEW ALL</span>
          </div>

          <table class="inspection-schedule-table">
            <tbody>
              ${state.facility.rooms.map(r => {
                let pillClass = 'pill-status-contained';
                if (r.inspectionStatus === 'Overdue') pillClass = 'pill-status-critical';
                else if (r.inspectionStatus === 'Pending') pillClass = 'pill-status-inspection';

                return `
                  <tr>
                    <td><strong>${escapeHtml(r.id)}</strong></td>
                    <td style="color:var(--text-stone);">${escapeHtml(r.inspectionDue)}</td>
                    <td style="text-align:right;">
                      <span class="pill-status ${pillClass}">${escapeHtml(r.inspectionStatus)}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Listeners
    document.querySelectorAll('.room-select-item').forEach(item => {
      item.addEventListener('click', (e) => {
        state.selectedRoomId = item.getAttribute('data-room');
        renderScreenContainment();
      });
    });

    const simBtn = document.getElementById('btn-sim-breach-toggle');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        if (isR03Breached) {
          resolveSimulationBreach();
        } else {
          triggerSimulationBreach();
        }
      });
    }

    addGeigerHover();
  }

  // =========================================================================
  // SCREEN 6: INCIDENT LOG — Recreated from Blueprint Screen 6
  // =========================================================================
  function renderScreenIncidentLog() {
    const container = document.getElementById('main-content');
    if (!container) return;

    state.incFilterSeverity = state.incFilterSeverity || 'All';
    state.incFilterObject = state.incFilterObject || 'All';
    state.incSearchQuery = state.incSearchQuery || '';

    const filteredIncidents = state.incidents.filter(inc => {
      const q = state.incSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        inc.artifactName.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.severity.toLowerCase().includes(q);

      const matchesSeverity = state.incFilterSeverity === 'All' || inc.severity === state.incFilterSeverity;
      const matchesObject = state.incFilterObject === 'All' || inc.artifactName.toUpperCase() === state.incFilterObject.toUpperCase();

      return matchesSearch && matchesSeverity && matchesObject;
    });

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-family:var(--font-serif); font-size:3rem; line-height:1; color:var(--text-ivory);">INCIDENT LOG</h1>
          <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-orange); font-weight:700; margin-top:4px;">
            REPORTED EVENTS & ANOMALIES // SITE-19 LEDGER
          </div>
        </div>
        <button class="btn-blueprint-primary" id="btn-report-incident-open">
          + REPORT NEW INCIDENT
        </button>
      </div>

      <!-- Filters matching Blueprint -->
      <div style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
        <select id="inc-filter-severity" class="select-blueprint">
          <option value="All" ${state.incFilterSeverity === 'All' ? 'selected' : ''}>All Severity</option>
          <option value="CRITICAL" ${state.incFilterSeverity === 'CRITICAL' ? 'selected' : ''}>Critical</option>
          <option value="HIGH" ${state.incFilterSeverity === 'HIGH' ? 'selected' : ''}>High</option>
          <option value="MEDIUM" ${state.incFilterSeverity === 'MEDIUM' ? 'selected' : ''}>Medium</option>
          <option value="LOW" ${state.incFilterSeverity === 'LOW' ? 'selected' : ''}>Low</option>
        </select>

        <select id="inc-filter-object" class="select-blueprint">
          <option value="All" ${state.incFilterObject === 'All' ? 'selected' : ''}>All Objects</option>
          ${state.artifacts.map(a => `<option value="${escapeHtml(a.name)}" ${state.incFilterObject === a.name ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
        </select>

        <div style="flex:1 1 240px;">
          <input type="text" id="inc-search-input" class="input-blueprint" placeholder="Search incidents, rooms, or descriptions..." value="${escapeHtml(state.incSearchQuery)}" />
        </div>
      </div>

      <!-- Table matching Blueprint Screen 6 exactly -->
      ${filteredIncidents.length === 0 ? `
        <div style="padding:3rem; text-align:center; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:4px;">
          <p style="color:var(--text-stone);">No incident log entries match your current filter parameters.</p>
        </div>
      ` : `
        <table class="incident-table-screen6">
          <thead>
            <tr>
              <th>DATE</th>
              <th>OBJECT</th>
              <th>LOCATION</th>
              <th>DESCRIPTION</th>
              <th>SEVERITY</th>
            </tr>
          </thead>
          <tbody id="incident-tbody">
            ${filteredIncidents.map(inc => {
              let pillClass = 'pill-status-low';
              if (inc.severity === 'CRITICAL') pillClass = 'pill-status-critical';
              else if (inc.severity === 'HIGH') pillClass = 'pill-status-high';
              else if (inc.severity === 'MEDIUM') pillClass = 'pill-status-medium';

              return `
                <tr>
                  <td style="font-weight:700; color:var(--text-stone);">${escapeHtml(inc.dateShort || inc.timestamp.slice(5, 10))}</td>
                  <td style="font-weight:700; color:var(--text-ivory);">${escapeHtml(inc.artifactName)}</td>
                  <td style="font-family:var(--font-mono); font-size:0.78rem;">${escapeHtml(inc.location)}</td>
                  <td style="color:var(--text-stone);">${escapeHtml(inc.description)}</td>
                  <td><span class="pill-status ${pillClass}">${escapeHtml(inc.severity)}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    `;

    // Filter Listeners
    const sevSelect = document.getElementById('inc-filter-severity');
    if (sevSelect) {
      sevSelect.addEventListener('change', (e) => {
        state.incFilterSeverity = e.target.value;
        window.OccultAudio.playStamp();
        renderScreenIncidentLog();
      });
    }

    const objSelect = document.getElementById('inc-filter-object');
    if (objSelect) {
      objSelect.addEventListener('change', (e) => {
        state.incFilterObject = e.target.value;
        window.OccultAudio.playStamp();
        renderScreenIncidentLog();
      });
    }

    const incSearch = document.getElementById('inc-search-input');
    if (incSearch) {
      incSearch.addEventListener('input', (e) => {
        state.incSearchQuery = e.target.value;
        renderScreenIncidentLog();
      });
    }

    document.getElementById('btn-report-incident-open').addEventListener('click', () => {
      const artifactName = prompt("Enter affected artifact name:", "ANNABELLE");
      if (!artifactName) return;
      const desc = prompt("Enter incident description:", "Routine sensor spike detected.");
      if (!desc) return;

      const newInc = {
        id: `INC-${Date.now().toString().slice(-4)}`,
        dateShort: "OCT 29",
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        artifactId: "REG-001",
        artifactName: artifactName,
        location: "Room R-01",
        severity: "HIGH",
        description: desc,
        reporter: "USER AGENT"
      };

      state.incidents.unshift(newInc);
      saveIncidents();
      showToast("New anomalous incident dispatch logged.", "success", "INCIDENT COMMITTED");
      renderScreenIncidentLog();
    });

    addGeigerHover();
  }

  // =========================================================================
  // SCREEN 7: ADD / EDIT OBJECT — Recreated from Blueprint Screen 7
  // =========================================================================
  function renderScreenAddObject() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const item = state.editingArtifact || {
      id: `REG-00${state.artifacts.length + 1}`,
      name: '',
      category: 'Cursed Object',
      dangerLevel: 'CRITICAL',
      discoveryDate: new Date().toISOString().slice(0, 10),
      currentLocation: 'Room R-01',
      imageUrl: PRESET_IMAGES[0].url,
      description: '',
      anomalousProperties: '',
      safetyProtocols: '1. Keep in sealed glass case at all times.'
    };

    container.innerHTML = `
      <div style="margin-bottom:2rem;">
        <h1 style="font-family:var(--font-serif); font-size:3rem; line-height:1; color:var(--text-ivory);">REGISTER NEW OBJECT</h1>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-orange); font-weight:700; margin-top:4px;">
          ADD A CURSED ARTIFACT TO THE ARCHIVE
        </div>
      </div>

      <div class="form-screen7-card">
        <form id="blueprint-register-form">
          <div class="form-screen7-grid">
            <!-- Left: Upload Image Dropzone matching Blueprint -->
            <div>
              <div class="upload-dropzone-screen7" id="dropzone-box">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2" style="margin-bottom:0.75rem;">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <div style="font-family:var(--font-mono); font-size:0.85rem; font-weight:700; color:var(--text-ivory); margin-bottom:4px;">
                  Upload Image
                </div>
                <div style="font-size:0.75rem; color:var(--text-stone); margin-bottom:1rem;">
                  PNG, JPG, WEBP up to 10MB
                </div>

                <!-- Preset Photography Buttons -->
                <div style="display:flex; flex-direction:column; gap:0.4rem; width:100%;">
                  ${PRESET_IMAGES.map(p => `
                    <button type="button" class="btn-blueprint-secondary btn-sm preset-btn" data-url="${escapeHtml(p.url)}" style="font-size:0.7rem; justify-content:flex-start;">
                      📷 ${escapeHtml(p.label)}
                    </button>
                  `).join('')}
                </div>
              </div>

              <input type="hidden" id="form-img-url" value="${escapeHtml(item.imageUrl)}" />
              <div style="margin-top:1rem; border:1px solid var(--border-subtle); height:140px; overflow:hidden; border-radius:3px;">
                <img id="form-img-preview" src="${escapeHtml(item.imageUrl)}" alt="Preview" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='./hero-artifact.jpg';" />
              </div>
            </div>

            <!-- Right: Object Fields matching Blueprint -->
            <div>
              <div style="display:grid; grid-template-columns: 1.5fr 1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
                <div>
                  <label style="display:block; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-stone); margin-bottom:4px;">
                    Object Name
                  </label>
                  <input type="text" id="form-name" class="input-blueprint" placeholder="e.g. The Haunted Mirror" value="${escapeHtml(item.name)}" required />
                </div>

                <div>
                  <label style="display:block; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-stone); margin-bottom:4px;">
                    Category
                  </label>
                  <select id="form-category" class="select-blueprint" style="width:100%;">
                    ${window.OCCULT_INITIAL_DATA.categories.filter(c => c !== 'All Categories').map(c => `
                      <option value="${escapeHtml(c)}" ${item.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>
                    `).join('')}
                  </select>
                </div>

                <div>
                  <label style="display:block; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-stone); margin-bottom:4px;">
                    Danger Level
                  </label>
                  <select id="form-danger" class="select-blueprint" style="width:100%;">
                    ${window.OCCULT_INITIAL_DATA.dangerLevels.filter(d => d !== 'All Danger Levels').map(d => `
                      <option value="${escapeHtml(d)}" ${item.dangerLevel === d ? 'selected' : ''}>${escapeHtml(d)}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
                <div>
                  <label style="display:block; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-stone); margin-bottom:4px;">
                    Discovery Date
                  </label>
                  <input type="date" id="form-date" class="input-blueprint" value="${escapeHtml(item.discoveryDate)}" required />
                </div>

                <div>
                  <label style="display:block; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-stone); margin-bottom:4px;">
                    Current Location
                  </label>
                  <input type="text" id="form-location" class="input-blueprint" placeholder="e.g. Room R-01" value="${escapeHtml(item.currentLocation || 'Room R-01')}" required />
                </div>
              </div>

              <!-- Large Textarea for Description & Properties -->
              <div>
                <label style="display:block; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-stone); margin-bottom:4px;">
                  Description & Paranormal Properties
                </label>
                <textarea id="form-desc" class="input-blueprint" rows="5" placeholder="Enter detailed curatorial description, properties, and handling protocols..." required>${escapeHtml(item.description || item.anomalousProperties)}</textarea>
              </div>
            </div>
          </div>

          <!-- Bottom Actions matching Blueprint exactly -->
          <div style="display:flex; justify-content:flex-end; gap:1rem; border-top:1px solid var(--border-subtle); padding-top:1.5rem;">
            <button type="button" class="btn-blueprint-secondary" id="btn-form-cancel">
              CANCEL
            </button>
            <button type="submit" class="btn-blueprint-primary">
              REGISTER OBJECT
            </button>
          </div>
        </form>
      </div>
    `;

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = btn.getAttribute('data-url');
        document.getElementById('form-img-url').value = url;
        document.getElementById('form-img-preview').src = url;
        window.OccultAudio.playStamp();
      });
    });

    document.getElementById('btn-form-cancel').addEventListener('click', () => {
      state.editingArtifact = null;
      navigate('registry');
    });

    document.getElementById('blueprint-register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name').value.trim();
      const category = document.getElementById('form-category').value;
      const dangerLevel = document.getElementById('form-danger').value;
      const discoveryDate = document.getElementById('form-date').value;
      const currentLocation = document.getElementById('form-location').value.trim();
      const description = document.getElementById('form-desc').value.trim();
      const imageUrl = document.getElementById('form-img-url').value.trim();

      const newArt = {
        id: state.editingArtifact ? state.editingArtifact.id : `REG-00${state.artifacts.length + 1}`,
        name,
        subtitle: category,
        category,
        dangerLevel,
        dangerScore: dangerLevel === 'CRITICAL' ? 5 : (dangerLevel === 'HIGH' ? 4 : 3),
        containmentStatus: 'Contained',
        currentLocation,
        origin: 'Classified Subterranean Recovery',
        discoveryDate,
        dimensions: 'Variable',
        primaryCustodian: 'Site-19 Security',
        imageUrl,
        galleryThumbnails: [imageUrl],
        description,
        anomalousProperties: description,
        safetyProtocols: '1. Maintain stasis barrier.\n2. Scheduled bi-weekly inspection.',
        inspectionDue: 'Nov 15, 2026',
        isFeatured: false
      };

      if (state.editingArtifact) {
        const idx = state.artifacts.findIndex(a => a.id === state.editingArtifact.id);
        if (idx !== -1) state.artifacts[idx] = newArt;
        showToast(`Artifact ${name} updated successfully.`, "success", "DOSSIER SAVED");
      } else {
        state.artifacts.unshift(newArt);
        showToast(`New object ${name} registered in the archive.`, "success", "SPECIMEN ACCESSIONED");
      }

      saveArtifacts();
      window.OccultAudio.playArchiveConfirmation();
      state.editingArtifact = null;
      navigate('registry');
    });

    addGeigerHover();
  }

  // =========================================================================
  // VIEW SWITCHER FOR THE 7 SCREENS
  // =========================================================================
  function renderCurrentScreen() {
    if (state.currentScreen === 'hero') renderScreenHero();
    else if (state.currentScreen === 'command-center') renderScreenCommandCenter();
    else if (state.currentScreen === 'registry') renderScreenRegistry();
    else if (state.currentScreen === 'dossier') renderScreenDossier();
    else if (state.currentScreen === 'containment') renderScreenContainment();
    else if (state.currentScreen === 'incidents') renderScreenIncidentLog();
    else if (state.currentScreen === 'add-object') renderScreenAddObject();
  }

  // Audio helper
  function addGeigerHover() {
    document.querySelectorAll('.btn-blueprint-primary, .btn-blueprint-secondary, .registry-card, .room-pin, .stat-box').forEach(el => {
      el.addEventListener('mouseenter', () => {
        window.OccultAudio.playGeiger();
      });
    });
  }

  // =========================================================================
  // SUBTERRANEAN VAULT FOOTER TELEMETRY & CONTROLS
  // =========================================================================
  function updateFooterTelemetry() {
    const totalEl = document.getElementById('footer-stat-total');
    const containedEl = document.getElementById('footer-stat-contained');
    const breachesEl = document.getElementById('footer-stat-breaches');
    const incidentsEl = document.getElementById('footer-stat-incidents');
    const liveDefconEl = document.getElementById('footer-live-defcon');
    const liveBadgeEl = document.getElementById('footer-live-defcon-badge');
    const defconDotEl = document.getElementById('footer-defcon-dot');
    const defconDescEl = document.getElementById('footer-defcon-desc');
    const lastAuditEl = document.getElementById('footer-last-inspection');
    const dayNightLabelEl = document.getElementById('footer-daynight-label');
    const dayNightBtn = document.getElementById('footer-daynight-btn');

    const total = state.artifacts ? state.artifacts.length : 12;
    const contained = state.artifacts ? state.artifacts.filter(a => a.containmentStatus === 'Contained').length : 8;
    const breaches = state.artifacts ? state.artifacts.filter(a => a.containmentStatus === 'Breached').length : 1;
    const incidents = state.incidents ? state.incidents.length : 6;

    if (totalEl) totalEl.textContent = total;
    if (containedEl) containedEl.textContent = contained;
    if (breachesEl) breachesEl.textContent = breaches;
    if (incidentsEl) incidentsEl.textContent = incidents;

    if (breaches > 0) {
      if (liveDefconEl) liveDefconEl.textContent = 'DEFCON 1 // BREACH ACTIVE';
      if (liveBadgeEl) {
        liveBadgeEl.textContent = 'DEFCON 1 // CRITICAL';
        liveBadgeEl.className = 'card-header-badge live-blink override-armed';
      }
      if (defconDotEl) {
        defconDotEl.className = 'status-pulse-dot pulse-breach';
      }
      if (defconDescEl) {
        defconDescEl.textContent = 'Redundant laser barrier compromised in subterranean sectors. Lockdown active.';
      }
    } else {
      if (liveDefconEl) liveDefconEl.textContent = 'DEFCON 3 // ELEVATED VIGILANCE';
      if (liveBadgeEl) {
        liveBadgeEl.textContent = 'DEFCON 3 // NOMINAL';
        liveBadgeEl.className = 'card-header-badge live-blink';
      }
      if (defconDotEl) {
        defconDotEl.className = 'status-pulse-dot';
      }
      if (defconDescEl) {
        defconDescEl.textContent = 'All subterranean stasis chambers sealed. Laser arrays nominal.';
      }
    }

    if (lastAuditEl) {
      const now = new Date();
      const yr = now.getUTCFullYear();
      const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
      const da = String(now.getUTCDate()).padStart(2, '0');
      const hr = String(now.getUTCHours()).padStart(2, '0');
      const mi = String(now.getUTCMinutes()).padStart(2, '0');
      lastAuditEl.textContent = `${yr}-${mo}-${da} ${hr}:${mi} UTC`;
    }

    if (dayNightLabelEl) {
      dayNightLabelEl.textContent = state.isDaylight ? 'RESTORE MIDNIGHT VOID' : 'ENGAGE SOLAR AUTOPSY';
    }
    if (dayNightBtn) {
      const icon = dayNightBtn.querySelector('.btn-icon');
      if (icon) {
        icon.textContent = state.isDaylight ? '🌙' : '☀️';
      }
    }
  }

  // =========================================================================
  // INIT
  // =========================================================================
  function init() {
    initData();
    const container = document.getElementById('main-content');
    if (container) {
      container.className = state.currentScreen === 'hero' ? 'app-container hero-container-flush' : 'app-container';
    }
    document.body.classList.toggle('on-hero-screen', state.currentScreen === 'hero');
    renderNavbar();
    renderCurrentScreen();

    // Footer actions
    const purgeBtn = document.getElementById('footer-purge-btn');
    if (purgeBtn) purgeBtn.addEventListener('click', resetToDefault);

    const scanlinesBtn = document.getElementById('footer-scanlines-btn');
    if (scanlinesBtn) scanlinesBtn.addEventListener('click', toggleScanlines);

    const dayNightFooterBtn = document.getElementById('footer-daynight-btn');
    if (dayNightFooterBtn) {
      dayNightFooterBtn.addEventListener('click', toggleDaylight);
    }

    // Vault directory navigation links in footer
    document.querySelectorAll('[data-footer-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dest = btn.getAttribute('data-footer-nav');
        if (dest) {
          window.OccultAudio.playStamp();
          navigate(dest);
        }
      });
    });

    updateFooterTelemetry();

    // Alliance Protocol listeners
    const allianceVaultBtn = document.getElementById('alliance-inspect-vault-btn');
    if (allianceVaultBtn) {
      allianceVaultBtn.addEventListener('click', () => {
        window.OccultAudio.playStamp();
        navigate('containment');
      });
    }

    const instaBtn = document.getElementById('btn-kapidhwaj-instagram');
    if (instaBtn) {
      instaBtn.addEventListener('mouseenter', () => window.OccultAudio.playGeiger());
      instaBtn.addEventListener('click', () => {
        window.OccultAudio.playStamp();
        showToast("TRANSIT TO OFFICIAL SPONSOR: Opening Kapidhwaj Innovations Instagram portal.", "info", "KAPIDHWAJ INNOVATIONS");
      });
    }

    const instaHandle = document.getElementById('kapidhwaj-insta-handle');
    if (instaHandle) {
      instaHandle.addEventListener('mouseenter', () => window.OccultAudio.playGeiger());
      instaHandle.addEventListener('click', () => window.OccultAudio.playStamp());
    }

    // First interaction unlock for browser autoplay policy
    const unlockAudio = () => {
      if (window.OccultAudio) {
        window.OccultAudio.initOnInteraction();
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    console.log("THE OCCULT ARCHIVE - Blueprint Exact Specification Online.");
  }

  // Expose global app object
  window.OccultApp = {
    state,
    navigate,
    triggerSimulationBreach,
    resolveSimulationBreach,
    toggleDaylight,
    resetToDefault,
    AtmosphericEngine,
    openAudioControlPanel,
    closeAudioControlPanel
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
