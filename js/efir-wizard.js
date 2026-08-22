/**
 * Indian Police E-FIR Citizen Portal
 * Multi-Step E-FIR Registration Wizard (Steps 1 to 5 + Drafts + File Uploads)
 */

(function() {
  // Wizard State
  const wizardState = {
    currentStep: 1,
    activeDraftId: null,
    files: [],
    formData: {
      informant: {
        name: "",
        mobile: "",
        email: "",
        address: "",
        age: "",
        interfaceLang: "en",
        statementLang: "en"
      },
      incident: {
        date: "",
        time: "",
        location: "",
        state: "State NCT",
        district: "",
        policeStation: "",
        stationId: "",
        offenceCategory: "",
        summary: ""
      },
      statement: {
        lang: "en",
        text: ""
      },
      documents: [],
      confirmed: false
    }
  };

  // Helper to populate from current citizen
  function populateFromCitizen() {
    const citizen = window.Store.getCurrentCitizen();
    if (citizen) {
      document.getElementById("field-informant-name").value = citizen.name || "";
      document.getElementById("field-informant-mobile").value = citizen.mobile || "";
      document.getElementById("field-informant-email").value = citizen.email || "";
      document.getElementById("field-informant-address").value = citizen.address || "";
      document.getElementById("field-informant-age").value = citizen.age || "";
      document.getElementById("field-informant-interface-lang").value = citizen.interfaceLang || "en";
      document.getElementById("field-informant-statement-lang").value = citizen.statementLang || "en";
      
      updateStatementLangBadge(citizen.statementLang || "en");
    }
  }

  function updateStatementLangBadge(lang) {
    const badge = document.getElementById("statement-lang-badge");
    const indicator = document.getElementById("statement-lang-name");
    if (badge && indicator) {
      indicator.textContent = lang === "hi" ? "हिन्दी (Hindi)" : "English";
    }
    // Also update statement language in state
    wizardState.formData.statement.lang = lang;
    wizardState.formData.informant.statementLang = lang;
  }

  // Navigate Steps
  function goToStep(step) {
    if (step < 1 || step > 5) return;

    // Validate current step before advancing
    if (step > wizardState.currentStep && !validateStep(wizardState.currentStep)) {
      return;
    }

    // Save form data into state
    syncFormToState();

    // Update UI
    wizardState.currentStep = step;
    for (let i = 1; i <= 5; i++) {
      const stepEl = document.getElementById(`wizard-step-${i}`);
      const stepNav = document.getElementById(`stepper-nav-${i}`);
      
      if (stepEl) {
        stepEl.classList.toggle("active", i === step);
      }
      if (stepNav) {
        stepNav.classList.remove("active", "completed");
        if (i === step) {
          stepNav.classList.add("active");
        } else if (i < step) {
          stepNav.classList.add("completed");
        }
      }
    }

    // If entering Review Step (5), render review summary
    if (step === 5) {
      renderReviewSummary();
    }

    // Scroll to top of wizard
    const wizardEl = document.querySelector(".wizard-container");
    if (wizardEl) {
      wizardEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Validate fields for a given step
  function validateStep(step) {
    let isValid = true;
    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    if (step === 1) {
      const name = document.getElementById("field-informant-name").value.trim();
      const mobile = document.getElementById("field-informant-mobile").value.trim();
      const address = document.getElementById("field-informant-address").value.trim();

      if (!name || !mobile || !address) {
        window.App.showToast(t.requiredField || "Please fill all required informant fields.", "warning");
        return false;
      }
      if (mobile.length < 10) {
        window.App.showToast("Please enter a valid 10-digit mobile number.", "warning");
        return false;
      }
    } else if (step === 2) {
      const date = document.getElementById("field-incident-date").value;
      const location = document.getElementById("field-incident-location").value.trim();
      const district = document.getElementById("field-incident-district").value;
      const station = document.getElementById("field-incident-station").value;
      const offence = document.getElementById("field-incident-offence").value;
      const summary = document.getElementById("field-incident-summary").value.trim();

      if (!date || !location || !district || !station || !offence || !summary) {
        window.App.showToast(t.requiredField || "Please fill all required incident details.", "warning");
        return false;
      }
    } else if (step === 3) {
      const statement = document.getElementById("field-statement-text").value.trim();
      if (!statement || statement.length < 20) {
        window.App.showToast("Please provide a detailed complaint statement (minimum 20 characters).", "warning");
        return false;
      }
    } else if (step === 5) {
      const confirmed = document.getElementById("field-review-confirmed").checked;
      if (!confirmed) {
        window.App.showToast("Please check the confirmation box to proceed to E-Verification.", "warning");
        return false;
      }
    }

    return isValid;
  }

  // Synchronize DOM inputs to internal state
  function syncFormToState() {
    wizardState.formData.informant = {
      name: document.getElementById("field-informant-name").value.trim(),
      mobile: document.getElementById("field-informant-mobile").value.trim(),
      email: document.getElementById("field-informant-email").value.trim(),
      address: document.getElementById("field-informant-address").value.trim(),
      age: document.getElementById("field-informant-age").value.trim(),
      interfaceLang: document.getElementById("field-informant-interface-lang").value,
      statementLang: document.getElementById("field-informant-statement-lang").value
    };

    const stationSelect = document.getElementById("field-incident-station");
    const stationId = stationSelect.options[stationSelect.selectedIndex]?.dataset.id || "PS-01";
    const offenceSelect = document.getElementById("field-incident-offence");

    wizardState.formData.incident = {
      date: document.getElementById("field-incident-date").value,
      time: document.getElementById("field-incident-time").value,
      location: document.getElementById("field-incident-location").value.trim(),
      state: document.getElementById("field-incident-state").value,
      district: document.getElementById("field-incident-district").value,
      policeStation: stationSelect.value,
      stationId: stationId,
      offenceCategory: offenceSelect.value,
      summary: document.getElementById("field-incident-summary").value.trim()
    };

    wizardState.formData.statement = {
      lang: wizardState.formData.informant.statementLang,
      text: document.getElementById("field-statement-text").value.trim()
    };

    wizardState.formData.documents = [...wizardState.files];
  }

  // Render Step 5 Review Summary
  function renderReviewSummary() {
    syncFormToState();
    const data = wizardState.formData;
    const lang = window.Store.getLang();
    const t = window.TRANSLATIONS[lang];

    // Informant Summary
    document.getElementById("review-informant-name").textContent = data.informant.name || "-";
    document.getElementById("review-informant-mobile").textContent = data.informant.mobile || "-";
    document.getElementById("review-informant-email").textContent = data.informant.email || "-";
    document.getElementById("review-informant-address").textContent = data.informant.address || "-";
    document.getElementById("review-informant-age").textContent = data.informant.age || "-";
    document.getElementById("review-statement-lang").textContent = data.informant.statementLang === "hi" ? "हिन्दी (Hindi)" : "English";

    // Incident Summary
    document.getElementById("review-incident-date").textContent = `${data.incident.date} ${data.incident.time ? 'at ' + data.incident.time : ''}`;
    document.getElementById("review-incident-location").textContent = data.incident.location || "-";
    document.getElementById("review-incident-station").textContent = `${data.incident.policeStation} (${data.incident.district})`;
    document.getElementById("review-incident-offence").textContent = data.incident.offenceCategory || "-";
    document.getElementById("review-incident-summary").textContent = data.incident.summary || "-";

    // Statement Summary
    document.getElementById("review-statement-text").textContent = data.statement.text || "-";

    // Attached Documents List
    const docContainer = document.getElementById("review-documents-list");
    if (docContainer) {
      if (wizardState.files.length === 0) {
        docContainer.innerHTML = `<p style="color: var(--color-neutral-500); font-size: 0.875rem;">${t.noFilesUploaded || 'No documents attached'}</p>`;
      } else {
        docContainer.innerHTML = wizardState.files.map(f => `
          <div class="file-card" style="display:inline-flex; margin-right: 8px; margin-bottom: 8px;">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <div>
                <div class="file-name">${f.name}</div>
                <div class="file-size">${f.size}</div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // File Upload Handlers (Simulation & Presets)
  function attachSampleDocument(name, size, type) {
    const fileObj = {
      name: name,
      size: size,
      type: type,
      date: new Date().toISOString().split('T')[0]
    };
    wizardState.files.push(fileObj);
    renderUploadedFiles();
    window.App.showToast(`Attached sample evidence: ${name}`, "success");
  }

  function removeFile(index) {
    wizardState.files.splice(index, 1);
    renderUploadedFiles();
  }

  function renderUploadedFiles() {
    const listContainer = document.getElementById("uploaded-files-container");
    const emptyNotice = document.getElementById("no-files-notice");
    if (!listContainer) return;

    if (wizardState.files.length === 0) {
      listContainer.innerHTML = "";
      if (emptyNotice) emptyNotice.style.display = "block";
      return;
    }

    if (emptyNotice) emptyNotice.style.display = "none";
    listContainer.innerHTML = wizardState.files.map((file, idx) => `
      <div class="file-card">
        <div class="file-info">
          <span class="file-icon">${file.name.endsWith('.pdf') ? '📕' : file.name.endsWith('.jpg') || file.name.endsWith('.png') ? '🖼️' : '📄'}</span>
          <div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-size">${file.size} • ${file.date}</div>
          </div>
        </div>
        <button type="button" class="btn-remove-file" onclick="window.EfirWizard.removeFile(${idx})" title="Remove file">✕</button>
      </div>
    `).join('');
  }

  // Save Draft Logic
  function saveCurrentDraft() {
    syncFormToState();
    const draftData = {
      id: wizardState.activeDraftId,
      step: wizardState.currentStep,
      informant: wizardState.formData.informant,
      incident: wizardState.formData.incident,
      statement: wizardState.formData.statement,
      documents: wizardState.files
    };

    const saved = window.Store.saveDraft(draftData);
    wizardState.activeDraftId = saved.id;

    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];
    window.App.showToast(`${t.draftSavedMsg || 'Draft saved successfully:'} ${saved.id}`, "success");
    
    // Refresh dashboard drafts list if open
    window.App.renderCitizenDashboard();
    return saved;
  }

  // Resume Draft Logic
  function resumeDraft(draftId) {
    const draft = window.Store.getDraftById(draftId);
    if (!draft) return;

    wizardState.activeDraftId = draft.id;
    wizardState.files = draft.documents || [];

    // Populate Fields
    if (draft.informant) {
      document.getElementById("field-informant-name").value = draft.informant.name || "";
      document.getElementById("field-informant-mobile").value = draft.informant.mobile || "";
      document.getElementById("field-informant-email").value = draft.informant.email || "";
      document.getElementById("field-informant-address").value = draft.informant.address || "";
      document.getElementById("field-informant-age").value = draft.informant.age || "";
      document.getElementById("field-informant-interface-lang").value = draft.informant.interfaceLang || "en";
      document.getElementById("field-informant-statement-lang").value = draft.informant.statementLang || "en";
      updateStatementLangBadge(draft.informant.statementLang || "en");
    }

    if (draft.incident) {
      document.getElementById("field-incident-date").value = draft.incident.date || "";
      document.getElementById("field-incident-time").value = draft.incident.time || "";
      document.getElementById("field-incident-location").value = draft.incident.location || "";
      document.getElementById("field-incident-district").value = draft.incident.district || "";
      document.getElementById("field-incident-station").value = draft.incident.policeStation || "";
      document.getElementById("field-incident-offence").value = draft.incident.offenceCategory || "";
      document.getElementById("field-incident-summary").value = draft.incident.summary || "";
    }

    if (draft.statement) {
      document.getElementById("field-statement-text").value = draft.statement.text || "";
    }

    renderUploadedFiles();

    // Switch to Register View and go to saved step
    window.App.navigate("register-efir");
    goToStep(draft.step || 1);
    window.App.showToast(`Resumed Draft: ${draft.id}`, "info");
  }

  // Reset Wizard Form
  function resetWizard() {
    wizardState.currentStep = 1;
    wizardState.activeDraftId = null;
    wizardState.files = [];
    
    document.getElementById("wizard-form").reset();
    populateFromCitizen();
    renderUploadedFiles();
    goToStep(1);
  }

  // Get finalized E-FIR payload for verification and submission
  function getCompletedPayload() {
    syncFormToState();
    return {
      draftId: wizardState.activeDraftId,
      informant: wizardState.formData.informant,
      incident: wizardState.formData.incident,
      statement: wizardState.formData.statement,
      documents: wizardState.files
    };
  }

  // Initialize event bindings
  function init() {
    // Statement language change listener
    const stmtLangSelect = document.getElementById("field-informant-statement-lang");
    if (stmtLangSelect) {
      stmtLangSelect.addEventListener("change", (e) => {
        updateStatementLangBadge(e.target.value);
      });
    }

    // File Dropzone simulator
    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("file-upload-input");
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + " MB";
            attachSampleDocument(file.name, sizeFormatted, file.type || "application/octet-stream");
          }
        }
      });
    }
  }

  // Expose API
  window.EfirWizard = {
    init,
    goToStep,
    validateStep,
    saveCurrentDraft,
    resumeDraft,
    resetWizard,
    populateFromCitizen,
    attachSampleDocument,
    removeFile,
    getCompletedPayload,
    getState: () => wizardState
  };
})();
