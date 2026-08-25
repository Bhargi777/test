/**
 * Indian Police e-FIR Citizen Portal
 * Police Officer Administration Portal & Scrutiny Desk
 */

(function() {
  let currentViewingEfir = null;

  // Initialize and Render Police Dashboard
  function renderPoliceDashboard() {
    const efirs = window.Store.getEfirs();
    const stations = window.Store.getStations();
    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    // Compute KPI metrics
    const total = efirs.length;
    const pendingScrutiny = efirs.filter(e => e.status === "Police Scrutiny Pending").length;
    const addInfo = efirs.filter(e => e.status === "Additional Information Required").length;
    const firRegistered = efirs.filter(e => e.status === "FIR Registered").length;
    const verified = efirs.filter(e => e.digilocker && e.digilocker.verified && e.esign && e.esign.completed).length;

    // Update KPI counters
    const kpiTotalEl = document.getElementById("kpi-total-val");
    const kpiVerifiedEl = document.getElementById("kpi-verified-val");
    const kpiScrutinyEl = document.getElementById("kpi-scrutiny-val");
    const kpiAddInfoEl = document.getElementById("kpi-addinfo-val");
    const kpiFirEl = document.getElementById("kpi-fir-val");

    if (kpiTotalEl) kpiTotalEl.textContent = total;
    if (kpiVerifiedEl) kpiVerifiedEl.textContent = verified;
    if (kpiScrutinyEl) kpiScrutinyEl.textContent = pendingScrutiny;
    if (kpiAddInfoEl) kpiAddInfoEl.textContent = addInfo;
    if (kpiFirEl) kpiFirEl.textContent = firRegistered;

    // Populate Station Filter Dropdown
    const filterStationEl = document.getElementById("police-filter-station");
    if (filterStationEl && filterStationEl.options.length <= 1) {
      filterStationEl.innerHTML = `<option value="">${t.allStations || 'All Police Stations'}</option>` +
        stations.map(s => `<option value="${s.name}">${currentLang === 'hi' ? s.nameHi : s.name}</option>`).join('');
    }

    // Render Table Rows
    filterAndRenderTable();
  }

  // Filter and display e-FIR table rows
  function filterAndRenderTable() {
    const efirs = window.Store.getEfirs();
    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    const stationFilter = document.getElementById("police-filter-station")?.value || "";
    const statusFilter = document.getElementById("police-filter-status")?.value || "";
    const searchFilter = document.getElementById("police-search-input")?.value.toLowerCase().trim() || "";

    const filtered = efirs.filter(item => {
      const matchStation = !stationFilter || item.incident.policeStation.includes(stationFilter);
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchSearch = !searchFilter || 
        item.id.toLowerCase().includes(searchFilter) ||
        item.informant.name.toLowerCase().includes(searchFilter) ||
        item.incident.summary.toLowerCase().includes(searchFilter);
      return matchStation && matchStatus && matchSearch;
    });

    const tbody = document.getElementById("police-efir-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--color-neutral-500);">No e-FIR submissions match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(efir => {
      const badgeClass = getBadgeClass(efir.status);
      const dateStr = new Date(efir.createdAt).toLocaleDateString();
      const statusLabel = getStatusLabel(efir.status, currentLang);

      return `
        <tr>
          <td><strong style="color: var(--color-primary-dark);">${efir.id}</strong></td>
          <td>${efir.informant.name}<br><small style="color: var(--color-neutral-500);">${efir.informant.mobile}</small></td>
          <td>${efir.incident.policeStation}</td>
          <td>${efir.incident.offenceCategory}</td>
          <td><span class="status-badge ${badgeClass}">${statusLabel}</span></td>
          <td>${dateStr}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="window.PolicePortal.openReview('${efir.id}')">
              ${t.btnReviewEfir || 'Scrutinize'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Open Detailed e-FIR Review Page
  function openReview(efirId) {
    const efir = window.Store.getEfirById(efirId);
    if (!efir) {
      window.App.showToast("e-FIR not found.", "warning");
      return;
    }

    currentViewingEfir = efir;
    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    // Populate Header & Badges
    document.getElementById("review-efir-id").textContent = efir.id;
    document.getElementById("review-efir-date").textContent = new Date(efir.createdAt).toLocaleString();
    
    const badgeContainer = document.getElementById("review-status-badge-container");
    if (badgeContainer) {
      const badgeClass = getBadgeClass(efir.status);
      badgeContainer.innerHTML = `<span class="status-badge ${badgeClass}">${getStatusLabel(efir.status, currentLang)}</span>`;
    }

    // Informant Details
    document.getElementById("pol-info-name").textContent = efir.informant.name;
    document.getElementById("pol-info-mobile").textContent = efir.informant.mobile;
    document.getElementById("pol-info-email").textContent = efir.informant.email || "Not Provided";
    document.getElementById("pol-info-address").textContent = efir.informant.address;
    document.getElementById("pol-info-age").textContent = efir.informant.age || "-";

    // Incident Details
    document.getElementById("pol-inc-date").textContent = `${efir.incident.date} ${efir.incident.time ? 'at ' + efir.incident.time : ''}`;
    document.getElementById("pol-inc-location").textContent = efir.incident.location;
    document.getElementById("pol-inc-station").textContent = efir.incident.policeStation;
    document.getElementById("pol-inc-offence").textContent = efir.incident.offenceCategory;
    document.getElementById("pol-inc-summary").textContent = efir.incident.summary;

    // Statement & Language
    document.getElementById("pol-statement-text").textContent = efir.statement.text;
    document.getElementById("pol-statement-lang").textContent = efir.statement.lang === "hi" ? "हिन्दी (Hindi)" : "English";

    // Attached Documents
    const docContainer = document.getElementById("pol-documents-container");
    if (docContainer) {
      if (!efir.documents || efir.documents.length === 0) {
        docContainer.innerHTML = `<p style="color: var(--color-neutral-500); font-size: 0.875rem;">No documents attached by informant.</p>`;
      } else {
        docContainer.innerHTML = efir.documents.map(d => `
          <div class="file-card" style="display:inline-flex; margin-right: 8px; margin-bottom: 8px;">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <div>
                <div class="file-name">${d.name}</div>
                <div class="file-size">${d.size}</div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Digital Authentication Meta
    document.getElementById("pol-dl-txn").textContent = efir.digilocker?.txnRef || "DL-VER-MOCK";
    document.getElementById("pol-dl-time").textContent = efir.digilocker?.timestamp ? new Date(efir.digilocker.timestamp).toLocaleString() : "-";
    document.getElementById("pol-esign-txn").textContent = efir.esign?.txnRef || "ESIGN-MOCK";
    document.getElementById("pol-esign-hash").textContent = efir.esign?.certHash || "SHA256:N/A";

    const sigImgEl = document.getElementById("pol-esign-signature-img");
    const sigNoneEl = document.getElementById("pol-esign-signature-none");
    if (efir.esign?.signatureImage) {
      sigImgEl.src = efir.esign.signatureImage;
      sigImgEl.style.display = "inline-block";
      sigNoneEl.style.display = "none";
    } else {
      sigImgEl.style.display = "none";
      sigNoneEl.style.display = "block";
    }

    // Render Audit Trail
    renderAuditTrail(efir.auditTrail || []);

    // Existing Officer Notes / FIR info
    const notesEl = document.getElementById("pol-officer-notes");
    if (notesEl) notesEl.value = efir.officerNotes || "";

    // Show or hide supplementary citizen response section if active
    const addInfoSection = document.getElementById("pol-addinfo-section");
    if (addInfoSection) {
      if (efir.additionalInfoRequest) {
        addInfoSection.style.display = "block";
        document.getElementById("pol-addinfo-query-text").textContent = efir.additionalInfoRequest.query;
        document.getElementById("pol-addinfo-deadline-text").textContent = efir.additionalInfoRequest.deadline;
        
        const respContainer = document.getElementById("pol-addinfo-response-box");
        if (efir.additionalInfoRequest.citizenResponse) {
          respContainer.innerHTML = `
            <div style="background:#f0fdf4; border:1px solid #86efac; padding:12px; border-radius:6px;">
              <strong style="color:#166534;">Citizen Response (${new Date(efir.additionalInfoRequest.responseDate).toLocaleString()}):</strong>
              <p style="margin-top:4px;">${efir.additionalInfoRequest.citizenResponse}</p>
            </div>
          `;
        } else {
          respContainer.innerHTML = `<p style="color:var(--color-warning); font-style:italic;">Awaiting citizen response...</p>`;
        }
      } else {
        addInfoSection.style.display = "none";
      }
    }

    // Navigate to Review View
    window.App.navigate("police-review");
  }

  // Render Audit Trail Log
  function renderAuditTrail(logs) {
    const tbody = document.getElementById("police-audit-trail-body");
    if (!tbody) return;

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: var(--color-neutral-500);">No audit events recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => `
      <tr>
        <td style="font-family: monospace; font-size: 0.8125rem;">${log.time}</td>
        <td><strong>${log.action}</strong></td>
        <td>${log.actor}</td>
        <td style="font-family: monospace; font-size: 0.75rem; color: var(--color-neutral-600);">${log.ref || '-'}</td>
      </tr>
    `).join('');
  }

  // Modal: Proceed for FIR Registration
  function openFirModal() {
    if (!currentViewingEfir) return;
    const modal = document.getElementById("police-fir-modal");
    if (modal) {
      // Auto-generate standard FIR sequence
      const stationCode = currentViewingEfir.incident.stationId || "CENTRAL";
      const randomFirNum = Math.floor(100 + Math.random() * 900);
      document.getElementById("modal-fir-number").value = `FIR/${stationCode}/2026/0${randomFirNum}`;
      document.getElementById("modal-fir-sections").value = "Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 - Section 303(2) (Theft) / IPC Sec 379";
      document.getElementById("modal-fir-officer").value = "Sub-Inspector Arvind Rawat (Badge #SI-8841)";
      document.getElementById("modal-fir-remarks").value = "Cognizable offence established upon scrutinizing electronic statement and purchase invoice. Registered under official police seal.";
      modal.classList.add("active");
    }
  }

  function confirmFirRegistration() {
    if (!currentViewingEfir) return;

    const firNumber = document.getElementById("modal-fir-number").value.trim();
    const sections = document.getElementById("modal-fir-sections").value.trim();
    const officer = document.getElementById("modal-fir-officer").value.trim();
    const remarks = document.getElementById("modal-fir-remarks").value.trim();

    if (!firNumber || !sections || !officer) {
      window.App.showToast("Please fill all required FIR registration fields.", "warning");
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditLogs = currentViewingEfir.auditTrail || [];
    auditLogs.push({
      time: nowStr,
      action: "Formal Police FIR Registered",
      actor: `SHO ${officer}`,
      ref: firNumber
    });

    const firDetails = {
      firNumber: firNumber,
      registeredDate: nowStr,
      actsAndSections: sections,
      investigatingOfficer: officer,
      shoRemarks: remarks
    };

    window.Store.updateEfir(currentViewingEfir.id, {
      status: "FIR Registered",
      statusKey: "statusFirRegistered",
      firDetails: firDetails,
      officerNotes: remarks,
      auditTrail: auditLogs
    });

    document.getElementById("police-fir-modal").classList.remove("active");
    window.App.showToast(`FIR Registered: ${firNumber}`, "success");
    
    // Refresh review page
    openReview(currentViewingEfir.id);
  }

  // Modal: Request Additional Info
  function openRequestInfoModal() {
    if (!currentViewingEfir) return;
    const modal = document.getElementById("police-reqinfo-modal");
    if (modal) {
      document.getElementById("modal-reqinfo-query").value = "Please upload purchase receipt / IMEI box photo and provide exact timestamp of exit from metro gate.";
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);
      document.getElementById("modal-reqinfo-deadline").value = nextWeek.toISOString().split('T')[0];
      modal.classList.add("active");
    }
  }

  function confirmRequestInfo() {
    if (!currentViewingEfir) return;

    const query = document.getElementById("modal-reqinfo-query").value.trim();
    const deadline = document.getElementById("modal-reqinfo-deadline").value;

    if (!query || !deadline) {
      window.App.showToast("Please specify the clarification query and response deadline.", "warning");
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditLogs = currentViewingEfir.auditTrail || [];
    auditLogs.push({
      time: nowStr,
      action: "Additional Information Requested by Investigating Officer",
      actor: "Station House Officer (SHO)",
      ref: `REQ-INFO-${new Date().getFullYear()}`
    });

    const addInfoObj = {
      requestedBy: "Station House Officer (SHO)",
      requestDate: nowStr.split(' ')[0],
      deadline: deadline,
      query: query,
      citizenResponse: null,
      responseDate: null,
      supplementaryDocuments: []
    };

    window.Store.updateEfir(currentViewingEfir.id, {
      status: "Additional Information Required",
      statusKey: "statusAddInfoRequired",
      additionalInfoRequest: addInfoObj,
      officerNotes: `Additional clarification requested from citizen: ${query}`,
      auditTrail: auditLogs
    });

    document.getElementById("police-reqinfo-modal").classList.remove("active");
    window.App.showToast("Information request sent to citizen.", "info");
    
    // Refresh review page
    openReview(currentViewingEfir.id);
  }

  // Modal: Transfer Police Station
  function openTransferModal() {
    if (!currentViewingEfir) return;
    const modal = document.getElementById("police-transfer-modal");
    if (modal) {
      const stations = window.Store.getStations();
      const selectEl = document.getElementById("modal-transfer-station");
      selectEl.innerHTML = stations.map(s => `<option value="${s.name}">${s.name} (${s.district})</option>`).join('');
      modal.classList.add("active");
    }
  }

  function confirmTransfer() {
    if (!currentViewingEfir) return;

    const targetStation = document.getElementById("modal-transfer-station").value;
    const reason = document.getElementById("modal-transfer-reason").value.trim();

    if (!reason) {
      window.App.showToast("Please specify the reason for jurisdictional transfer.", "warning");
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditLogs = currentViewingEfir.auditTrail || [];
    auditLogs.push({
      time: nowStr,
      action: `e-FIR Transferred to ${targetStation}`,
      actor: "Station House Officer",
      ref: `TRANSFER-JURISDICTION`
    });

    const updatedIncident = {
      ...currentViewingEfir.incident,
      policeStation: targetStation
    };

    window.Store.updateEfir(currentViewingEfir.id, {
      status: "Transferred to Other Station",
      statusKey: "statusTransferred",
      incident: updatedIncident,
      officerNotes: `Transferred to ${targetStation}. Reason: ${reason}`,
      auditTrail: auditLogs
    });

    document.getElementById("police-transfer-modal").classList.remove("active");
    window.App.showToast(`e-FIR transferred to ${targetStation}`, "info");
    
    // Refresh review page
    openReview(currentViewingEfir.id);
  }

  // Save Investigating Officer Case Notes
  function saveOfficerNotes() {
    if (!currentViewingEfir) return;

    const notes = document.getElementById("pol-officer-notes").value.trim();

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditLogs = currentViewingEfir.auditTrail || [];
    auditLogs.push({
      time: nowStr,
      action: "Officer Case Notes Updated",
      actor: "Investigating Officer (IO)",
      ref: "IO-NOTES"
    });

    window.Store.updateEfir(currentViewingEfir.id, {
      officerNotes: notes,
      auditTrail: auditLogs
    });

    window.App.showToast("Case notes saved.", "success");
    openReview(currentViewingEfir.id);
  }

  // Mark as Non-Cognizable / Civil
  function markNonCognizable() {
    if (!currentViewingEfir) return;

    const reason = prompt("Enter Police Remarks / Reason for Non-Cognizable / Civil Disposal:", "Matter appears to be a civil dispute regarding financial transaction agreement without criminal intent.");
    if (!reason) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditLogs = currentViewingEfir.auditTrail || [];
    auditLogs.push({
      time: nowStr,
      action: "Disposed as Non-Cognizable / Civil Matter",
      actor: "Station House Officer",
      ref: "DISPOSAL-NCR"
    });

    window.Store.updateEfir(currentViewingEfir.id, {
      status: "Disposed / Non-Cognizable",
      statusKey: "statusClosedNonCog",
      officerNotes: `Disposed as Non-Cognizable: ${reason}`,
      auditTrail: auditLogs
    });

    window.App.showToast("e-FIR marked as Non-Cognizable / Disposed.", "info");
    openReview(currentViewingEfir.id);
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
    const t = window.TRANSLATIONS[lang];
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

  // Expose API
  window.PolicePortal = {
    renderPoliceDashboard,
    filterAndRenderTable,
    openReview,
    openFirModal,
    confirmFirRegistration,
    openRequestInfoModal,
    confirmRequestInfo,
    openTransferModal,
    confirmTransfer,
    saveOfficerNotes,
    markNonCognizable,
    getCurrentViewingEfir: () => currentViewingEfir
  };
})();
