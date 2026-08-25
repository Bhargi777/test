/**
 * Indian Police E-FIR Citizen Portal
 * Master Application Controller & Router
 */

(function() {
  let isSpeaking = false;

  // View Navigation
  function navigate(viewId) {
    // Hide all views
    const views = document.querySelectorAll(".page-view");
    views.forEach(v => v.classList.remove("active"));

    // Activate targeted view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add("active");
    } else {
      console.warn(`View view-${viewId} not found. Showing home.`);
      document.getElementById("view-home")?.classList.add("active");
    }

    // Update active state in nav links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.dataset.view === viewId) {
        link.classList.add("active");
      }
    });

    // Special view loaders
    if (viewId === "citizen-dashboard") {
      renderCitizenDashboard();
    } else if (viewId === "police-portal") {
      window.PolicePortal.renderPoliceDashboard();
    } else if (viewId === "station-directory") {
      renderStationDirectory();
    } else if (viewId === "help-faq") {
      renderFaqs();
    } else if (viewId === "track-efir") {
      renderTrackingList();
    } else if (viewId === "officer-login") {
      const errorBox = document.getElementById("officer-login-error");
      if (errorBox) errorBox.style.display = "none";
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Language Switcher
  const LANG_CYCLE = ["en", "hi", "mr"];
  const LANG_BTN_LABEL = { en: "🇮🇳 हिन्दी (Hindi)", hi: "🇮🇳 मराठी (Marathi)", mr: "🌐 English" };

  function toggleLanguage() {
    const currentLang = window.Store.getLang();
    const currentIndex = LANG_CYCLE.indexOf(currentLang);
    const newLang = LANG_CYCLE[(currentIndex + 1) % LANG_CYCLE.length];
    setLanguage(newLang);
  }

  function setLanguage(lang) {
    window.Store.setLang(lang);
    applyTranslations(lang);

    // Update language switch button text
    const langBtn = document.getElementById("header-lang-btn");
    if (langBtn) {
      langBtn.innerHTML = LANG_BTN_LABEL[lang] || LANG_BTN_LABEL.en;
    }

    // Re-render dynamic active views if needed
    const activeView = document.querySelector(".page-view.active")?.id?.replace("view-", "");
    if (activeView === "citizen-dashboard") renderCitizenDashboard();
    if (activeView === "police-portal") window.PolicePortal.renderPoliceDashboard();
    if (activeView === "station-directory") renderStationDirectory();
    if (activeView === "help-faq") renderFaqs();
  }

  // Apply translations to all DOM elements with data-i18n attributes
  function applyTranslations(lang) {
    const dict = window.TRANSLATIONS[lang] || window.TRANSLATIONS.en;
    
    // Elements with data-i18n for textContent
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Elements with data-i18n-placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.setAttribute("placeholder", dict[key]);
      }
    });

    // Set document lang attribute
    document.documentElement.lang = lang;
  }

  // Portal Switcher (Citizen vs Police Officer)
  function togglePortalRole() {
    const currentPortal = window.Store.getActivePortal();
    if (currentPortal === "police") {
      setPortalRole("citizen");
    } else {
      navigate("officer-login");
    }
  }

  // Officer Login Page: verify demo credentials, then activate officer portal
  function officerLoginSubmit() {
    const username = document.getElementById("officer-login-username").value.trim();
    const password = document.getElementById("officer-login-password").value.trim();
    const errorBox = document.getElementById("officer-login-error");

    if (username === "admin" && password === "admin") {
      errorBox.style.display = "none";
      setPortalRole("police");
    } else {
      errorBox.style.display = "block";
    }
  }

  function officerLogout() {
    setPortalRole("citizen");
  }

  function setPortalRole(portal) {
    window.Store.setActivePortal(portal);
    const switchBtn = document.getElementById("header-portal-btn");

    if (portal === "police") {
      document.body.classList.add("officer-theme");
      if (switchBtn) {
        switchBtn.classList.add("officer-mode");
        switchBtn.innerHTML = "👮‍♂️ Switch to Citizen Portal";
      }
      navigate("police-portal");
      showToast("Logged into Police Officer Administration Portal", "success");
    } else {
      document.body.classList.remove("officer-theme");
      if (switchBtn) {
        switchBtn.classList.remove("officer-mode");
        switchBtn.innerHTML = "🛡️ Officer Portal";
      }
      navigate("citizen-dashboard");
      showToast("Switched to Citizen Portal", "info");
    }
  }

  // Accessibility Controls
  function setTextSize(size) {
    document.body.classList.remove("text-large", "text-xlarge");
    if (size === "large") document.body.classList.add("text-large");
    if (size === "xlarge") document.body.classList.add("text-xlarge");
    
    window.Store.setTextSize(size);

    document.querySelectorAll(".access-btn[data-size]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.size === size);
    });
  }

  function toggleHighContrast() {
    const isContrast = !document.body.classList.contains("high-contrast");
    document.body.classList.toggle("high-contrast", isContrast);
    window.Store.setHighContrast(isContrast);
    
    const btn = document.getElementById("access-contrast-btn");
    if (btn) btn.classList.toggle("active", isContrast);
  }

  // Web Speech API: Read Aloud
  function toggleReadAloud(elementIdOrText) {
    if (!('speechSynthesis' in window)) {
      showToast("Speech synthesis is not supported on this browser.", "warning");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      showToast("Read Aloud stopped.", "info");
      return;
    }

    let textToRead = "";
    if (elementIdOrText) {
      const el = document.getElementById(elementIdOrText);
      textToRead = el ? (el.value || el.textContent) : elementIdOrText;
    } else {
      // Default: Read current active view text summary
      const activeView = document.querySelector(".page-view.active");
      textToRead = activeView ? activeView.innerText : "Mumbai Police Citizen Services E-FIR Portal.";
    }

    if (!textToRead.trim()) return;

    const lang = window.Store.getLang();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    const speechLangMap = { hi: "hi-IN", mr: "mr-IN" };
    utterance.lang = speechLangMap[lang] || "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => { isSpeaking = false; };
    utterance.onerror = () => { isSpeaking = false; };

    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
    const speechLabelMap = { hi: "हिन्दी", mr: "मराठी" };
    showToast(`Reading Aloud in ${speechLabelMap[lang] || 'English'}...`, "info");
  }

  // Toast Notifications
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const icon = type === "success" ? "✓" : type === "warning" ? "⚠️" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Citizen Dashboard Renderer
  function renderCitizenDashboard() {
    const citizen = window.Store.getCurrentCitizen();
    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    // User greeting & profile
    const greetingEl = document.getElementById("dash-citizen-name");
    if (greetingEl) {
      greetingEl.textContent = currentLang === "hi" && citizen.nameHi ? citizen.nameHi : citizen.name;
    }
    const headerUserEl = document.getElementById("header-citizen-display");
    if (headerUserEl) {
      headerUserEl.textContent = citizen.name;
    }

    // Render Submissions Table
    const efirs = window.Store.getEfirs();
    const tbody = document.getElementById("citizen-efir-table-body");
    const noEfirsNotice = document.getElementById("no-efirs-notice");

    if (tbody) {
      if (efirs.length === 0) {
        tbody.innerHTML = "";
        if (noEfirsNotice) noEfirsNotice.style.display = "block";
      } else {
        if (noEfirsNotice) noEfirsNotice.style.display = "none";
        tbody.innerHTML = efirs.map(efir => {
          const badgeClass = getBadgeClass(efir.status);
          const dateStr = new Date(efir.createdAt).toLocaleDateString();
          const statusLabel = getStatusLabel(efir.status, currentLang);
          const hasAddInfoAlert = efir.status === "Additional Information Required";

          return `
            <tr>
              <td>
                <strong style="color: var(--color-primary);">${efir.id}</strong>
                ${hasAddInfoAlert ? '<br><span style="color:var(--color-warning); font-size:0.75rem; font-weight:700;">⚠️ Action Required</span>' : ''}
              </td>
              <td>${dateStr}</td>
              <td>${efir.incident.policeStation}</td>
              <td>${efir.incident.offenceCategory}</td>
              <td><span class="status-badge ${badgeClass}">${statusLabel}</span></td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-secondary" onclick="window.App.trackSpecificEfir('${efir.id}')">
                    ${t.btnTrack || 'Track'}
                  </button>
                  <button class="btn btn-sm btn-primary" onclick="window.PrintDoc.renderAcknowledgement('${efir.id}')">
                    ${t.btnDownloadAck || 'Ack'}
                  </button>
                  ${efir.status === "FIR Registered" ? `
                    <button class="btn btn-sm btn-success" onclick="window.PrintDoc.renderFirDocument('${efir.id}')">
                      View FIR
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Drafts
    const drafts = window.Store.getDrafts();
    const draftsList = document.getElementById("citizen-drafts-list");
    const noDraftsNotice = document.getElementById("no-drafts-notice");

    if (draftsList) {
      if (drafts.length === 0) {
        draftsList.innerHTML = "";
        if (noDraftsNotice) noDraftsNotice.style.display = "block";
      } else {
        if (noDraftsNotice) noDraftsNotice.style.display = "none";
        draftsList.innerHTML = drafts.map(draft => `
          <div class="service-card" style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span class="status-badge badge-draft">${draft.id}</span>
                <h4 style="margin-top: 6px;">${draft.incident?.summary || 'Untitled Draft Complaint'}</h4>
                <p style="font-size:0.8125rem; color:var(--color-neutral-500);">${draft.incident?.offenceCategory || 'General Offence'} • Step ${draft.step || 1} of 5</p>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-primary" onclick="window.EfirWizard.resumeDraft('${draft.id}')">
                  ${t.btnResumeDraft || 'Resume'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.App.deleteDraft('${draft.id}')">
                  ${t.btnDeleteDraft || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  function deleteDraft(id) {
    if (confirm(`Are you sure you want to delete draft ${id}?`)) {
      window.Store.deleteDraft(id);
      renderCitizenDashboard();
      showToast("Draft deleted.", "info");
    }
  }

  // Tracking System
  function trackSpecificEfir(refId) {
    document.getElementById("track-input-ref").value = refId;
    navigate("track-efir");
    searchAndRenderTimeline(refId);
  }

  function submitTrackForm() {
    const input = document.getElementById("track-input-ref").value.trim();
    if (!input) {
      showToast("Please enter an E-FIR reference number.", "warning");
      return;
    }
    searchAndRenderTimeline(input);
  }

  function searchAndRenderTimeline(refId) {
    const efir = window.Store.getEfirById(refId);
    const resultBox = document.getElementById("track-result-box");
    const notFoundBox = document.getElementById("track-notfound-box");
    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    if (!efir) {
      if (resultBox) resultBox.style.display = "none";
      if (notFoundBox) notFoundBox.style.display = "block";
      return;
    }

    if (notFoundBox) notFoundBox.style.display = "none";
    if (resultBox) resultBox.style.display = "block";

    // Populate Details
    document.getElementById("track-disp-ref").textContent = efir.id;
    document.getElementById("track-disp-station").textContent = `${efir.incident.policeStation} (${efir.incident.district})`;
    document.getElementById("track-disp-informant").textContent = efir.informant.name;
    document.getElementById("track-disp-date").textContent = new Date(efir.createdAt).toLocaleString();
    
    const badgeEl = document.getElementById("track-disp-badge");
    if (badgeEl) {
      badgeEl.className = `status-badge ${getBadgeClass(efir.status)}`;
      badgeEl.textContent = getStatusLabel(efir.status, currentLang);
    }

    // Officer Remarks
    document.getElementById("track-disp-remarks").textContent = efir.officerNotes || t.noRemarksYet;

    // Timeline Steps State Calculation
    const timelineData = [
      { id: "submitted", title: "E-FIR Submitted Online", desc: "Complaint submitted through portal with evidence attached.", completed: true },
      { id: "verif", title: "DigiLocker Identity Verified", desc: `Citizen Aadhaar credential verified (${efir.digilocker?.txnRef || 'Verified'}).`, completed: !!efir.digilocker?.verified },
      { id: "esign", title: "Electronic Signature Sealed", desc: `Digital signature hash applied (${efir.esign?.txnRef || 'Completed'}).`, completed: !!efir.esign?.completed },
      { id: "auth", title: "Digital Authentication Completed", desc: "Transmission confirmed to jurisdictional police desk.", completed: true },
      {
        id: "scrutiny",
        title: "Under Review & Jurisdiction Check",
        desc: efir.status === "Additional Information Required" ? "Investigating Officer requested supplementary evidence." : "Station House Officer assessing facts and legal provisions.",
        completed: efir.status === "FIR Registered" || efir.status === "Disposed / Non-Cognizable",
        active: efir.status === "Police Scrutiny Pending" || efir.status === "Additional Information Required"
      },
      {
        id: "fir",
        title: efir.firDetails ? `FIR Registered (${efir.firDetails.firNumber})` : "Formal FIR Registration",
        desc: efir.firDetails ? `Registered under ${efir.firDetails.actsAndSections}` : "Subject to review and legal satisfaction.",
        completed: efir.status === "FIR Registered",
        active: false
      }
    ];

    const timelineContainer = document.getElementById("track-timeline-container");
    if (timelineContainer) {
      timelineContainer.innerHTML = timelineData.map(step => `
        <div class="timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}">
          <div class="timeline-bullet">${step.completed ? '✓' : step.active ? '●' : '○'}</div>
          <div class="timeline-content">
            <h5>${step.title}</h5>
            <p>${step.desc}</p>
          </div>
        </div>
      `).join('');
    }

    // Supplementary Information Section (if required)
    const addInfoCard = document.getElementById("track-addinfo-alert-card");
    if (addInfoCard) {
      if (efir.status === "Additional Information Required" && efir.additionalInfoRequest) {
        addInfoCard.style.display = "block";
        document.getElementById("track-query-text").textContent = efir.additionalInfoRequest.query;
        document.getElementById("track-deadline-text").textContent = efir.additionalInfoRequest.deadline;
        document.getElementById("track-addinfo-efir-id").value = efir.id;
      } else {
        addInfoCard.style.display = "none";
      }
    }
  }

  // Submit Supplementary / Additional Information by Citizen
  function submitCitizenAdditionalInfo() {
    const efirId = document.getElementById("track-addinfo-efir-id").value;
    const text = document.getElementById("track-supplementary-text").value.trim();
    if (!text) {
      showToast("Please enter your supplementary statement / response.", "warning");
      return;
    }

    const efir = window.Store.getEfirById(efirId);
    if (!efir) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditLogs = efir.auditTrail || [];
    auditLogs.push({
      time: nowStr,
      action: "Supplementary Information Submitted by Citizen",
      actor: `Citizen (${efir.informant.name})`,
      ref: "CITIZEN-SUPPLEMENTARY"
    });

    const updatedRequest = {
      ...efir.additionalInfoRequest,
      citizenResponse: text,
      responseDate: nowStr
    };

    window.Store.updateEfir(efir.id, {
      status: "Police Scrutiny Pending",
      statusKey: "statusPoliceScrutiny",
      additionalInfoRequest: updatedRequest,
      officerNotes: `Complainant submitted response to query on ${nowStr}. Scrutiny resumed.`,
      auditTrail: auditLogs
    });

    showToast("Supplementary information successfully submitted to police officer.", "success");
    searchAndRenderTimeline(efir.id);
  }

  function renderTrackingList() {
    const efirs = window.Store.getEfirs();
    const quickList = document.getElementById("quick-track-list");
    if (quickList) {
      quickList.innerHTML = efirs.map(e => `
        <button type="button" class="access-btn" style="margin-right:6px; margin-bottom:6px;" onclick="window.App.trackSpecificEfir('${e.id}')">
          ${e.id} (${e.incident.offenceCategory.split(' ')[0]})
        </button>
      `).join('');
    }
  }

  // Station Directory Search & Render
  function renderStationDirectory() {
    const stations = window.Store.getStations();
    const currentLang = window.Store.getLang();
    const searchVal = document.getElementById("station-search-input")?.value.toLowerCase().trim() || "";

    const filtered = stations.filter(s => {
      const name = (currentLang === 'hi' ? s.nameHi : s.name).toLowerCase();
      const dist = (currentLang === 'hi' ? s.districtHi : s.district).toLowerCase();
      const juris = (currentLang === 'hi' ? s.jurisdictionHi : s.jurisdiction).toLowerCase();
      return name.includes(searchVal) || dist.includes(searchVal) || juris.includes(searchVal);
    });

    const grid = document.getElementById("stations-grid");
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--color-neutral-500);">No police stations found matching "${searchVal}".</p>`;
      return;
    }

    grid.innerHTML = filtered.map(s => `
      <div class="service-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span class="status-badge badge-pending">${s.id}</span>
            <span style="font-size:0.75rem; color:var(--color-neutral-500); font-weight:600;">${currentLang === 'hi' ? s.districtHi : s.district}</span>
          </div>
          <h4>${currentLang === 'hi' ? s.nameHi : s.name}</h4>
          <p style="font-size:0.875rem; color:var(--color-neutral-700); margin-bottom:12px;">📍 ${s.address}</p>
          <div style="font-size:0.8125rem; color:var(--color-neutral-600); display:flex; flex-direction:column; gap:4px;">
            <div><strong>👮‍♂️ ${s.shoRank}:</strong> ${s.sho}</div>
            <div><strong>📞 Phone:</strong> ${s.phone}</div>
            <div><strong>🚨 Mobile:</strong> ${s.mobile}</div>
            <div><strong>✉️ Email:</strong> ${s.email}</div>
            <div><strong>🗺️ Jurisdiction:</strong> ${currentLang === 'hi' ? s.jurisdictionHi : s.jurisdiction}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function findNearestStation() {
    showToast("Locating nearest jurisdictional police station based on GPS...", "info");
    setTimeout(() => {
      document.getElementById("station-search-input").value = "Central";
      renderStationDirectory();
      showToast("Nearest Station Found: Central Police Station (1.4 km away)", "success");
    }, 800);
  }

  // FAQs Search & Render
  function renderFaqs() {
    const faqs = window.Store.getFaqs();
    const currentLang = window.Store.getLang();
    const searchVal = document.getElementById("faq-search-input")?.value.toLowerCase().trim() || "";

    const filtered = faqs.filter(f => {
      const q = (currentLang === 'hi' ? f.qHi : f.qEn).toLowerCase();
      const a = (currentLang === 'hi' ? f.aHi : f.aEn).toLowerCase();
      return q.includes(searchVal) || a.includes(searchVal);
    });

    const accordion = document.getElementById("faqs-accordion");
    if (!accordion) return;

    if (filtered.length === 0) {
      accordion.innerHTML = `<p style="text-align:center; color: var(--color-neutral-500); padding: 20px;">No FAQ matches found.</p>`;
      return;
    }

    accordion.innerHTML = filtered.map((f, idx) => `
      <div class="review-summary-card" style="margin-bottom: 12px;">
        <div style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
          <h4 style="font-size: 0.9375rem; color: var(--color-primary); font-weight: 700;">
            ❓ ${currentLang === 'hi' ? f.qHi : f.qEn}
          </h4>
          <span style="font-size: 1.125rem;">▾</span>
        </div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-neutral-200); font-size: 0.875rem; color: var(--color-neutral-700); line-height: 1.5;">
          ${currentLang === 'hi' ? f.aHi : f.aEn}
        </div>
      </div>
    `).join('');
  }

  // Citizen Authentication & Demo Switcher
  function openLoginModal() {
    const modal = document.getElementById("citizen-login-modal");
    if (modal) modal.classList.add("active");
  }

  function closeLoginModal() {
    const modal = document.getElementById("citizen-login-modal");
    if (modal) modal.classList.remove("active");
  }

  function switchDemoCitizen(index) {
    const citizens = window.Store.getAllCitizens();
    if (citizens[index]) {
      window.Store.setCurrentCitizen(citizens[index]);
      window.EfirWizard.populateFromCitizen();
      renderCitizenDashboard();
      closeLoginModal();
      showToast(`Switched active citizen to: ${citizens[index].name}`, "success");
    }
  }

  function verifyLoginSubmit() {
    const phone = document.getElementById("login-phone-input").value.trim();
    if (phone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number.", "warning");
      return;
    }
    closeLoginModal();
    navigate("citizen-dashboard");
    showToast("Logged in successfully via Simulated OTP.", "success");
  }

  function openRegisterModal() {
    const modal = document.getElementById("citizen-register-modal");
    if (modal) modal.classList.add("active");
  }

  function closeRegisterModal() {
    const modal = document.getElementById("citizen-register-modal");
    if (modal) modal.classList.remove("active");
  }

  function submitRegisterForm() {
    const name = document.getElementById("reg-name-input").value.trim();
    const mobile = document.getElementById("reg-mobile-input").value.trim();
    const address = document.getElementById("reg-address-input").value.trim();
    const intfLang = document.getElementById("reg-intf-lang").value;
    const stmtLang = document.getElementById("reg-stmt-lang").value;

    if (!name || !mobile || !address) {
      showToast("Please fill all required registration fields.", "warning");
      return;
    }

    const newCitizen = window.Store.registerCitizen({
      name,
      nameHi: name,
      mobile,
      email: document.getElementById("reg-email-input").value.trim(),
      address,
      addressHi: address,
      age: document.getElementById("reg-age-input").value.trim() || "30",
      interfaceLang: intfLang,
      statementLang: stmtLang
    });

    closeRegisterModal();
    window.EfirWizard.populateFromCitizen();
    navigate("citizen-dashboard");
    showToast(`Welcome, ${newCitizen.name}! Account registered successfully.`, "success");
  }

  // Status helper helpers
  function getBadgeClass(status) {
    switch (status) {
      case "Police Scrutiny Pending": return "badge-pending";
      case "Additional Information Required": return "badge-addinfo";
      case "FIR Registered": return "badge-fir-registered";
      case "Digital Authentication Completed":
      case "Submitted": return "badge-completed";
      default: return "badge-draft";
    }
  }

  function getStatusLabel(status, lang) {
    const t = window.TRANSLATIONS[lang] || window.TRANSLATIONS.en;
    switch (status) {
      case "Police Scrutiny Pending": return t.statusPoliceScrutiny;
      case "Additional Information Required": return t.statusAddInfoRequired;
      case "FIR Registered": return t.statusFirRegistered;
      case "Digital Authentication Completed": return t.statusAuthenticated;
      case "Transferred to Other Station": return t.statusTransferred;
      case "Disposed / Non-Cognizable": return t.statusClosedNonCog;
      default: return status;
    }
  }

  // App Initialization
  function init() {
    const currentLang = window.Store.getLang();
    applyTranslations(currentLang);

    // Initial wizard and citizen sync
    window.EfirWizard.init();
    window.EfirWizard.populateFromCitizen();

    // Attach search event listeners
    document.getElementById("station-search-input")?.addEventListener("input", renderStationDirectory);
    document.getElementById("faq-search-input")?.addEventListener("input", renderFaqs);
    document.getElementById("police-search-input")?.addEventListener("input", () => window.PolicePortal.filterAndRenderTable());
    document.getElementById("police-filter-station")?.addEventListener("change", () => window.PolicePortal.filterAndRenderTable());
    document.getElementById("police-filter-status")?.addEventListener("change", () => window.PolicePortal.filterAndRenderTable());

    // Navigation links binding
    document.querySelectorAll(".nav-link[data-view]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(link.dataset.view);
      });
    });

    console.log("Indian Police E-FIR Citizen Portal initialized successfully.");
  }

  // Start when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose API
  window.App = {
    navigate,
    toggleLanguage,
    setLanguage,
    togglePortalRole,
    setPortalRole,
    officerLoginSubmit,
    officerLogout,
    setTextSize,
    toggleHighContrast,
    toggleReadAloud,
    showToast,
    renderCitizenDashboard,
    deleteDraft,
    trackSpecificEfir,
    submitTrackForm,
    submitCitizenAdditionalInfo,
    renderStationDirectory,
    findNearestStation,
    renderFaqs,
    openLoginModal,
    closeLoginModal,
    switchDemoCitizen,
    verifyLoginSubmit,
    openRegisterModal,
    closeRegisterModal,
    submitRegisterForm
  };
})();
