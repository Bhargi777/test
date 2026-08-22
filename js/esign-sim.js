/**
 * Indian Police E-FIR Citizen Portal
 * Simulated Electronic Signature Flow (E-Sign)
 * (Prototype / Demo Mode)
 */

(function() {
  const esignState = {
    payloadData: null,
    digilockerData: null,
    isEsigned: false,
    txnRef: null,
    certHash: null,
    timestamp: null,
    generatedEfir: null,
    signatureImage: null
  };

  // Launch the Electronic Signature page
  function startEsign(payload, digilockerInfo) {
    esignState.payloadData = payload;
    esignState.digilockerData = digilockerInfo;
    esignState.isEsigned = false;
    esignState.txnRef = null;
    esignState.certHash = null;
    esignState.signatureImage = null;

    // Populate Statement Text for Review
    const statementEl = document.getElementById("esign-statement-display");
    const stmtLangEl = document.getElementById("esign-statement-lang");
    const informantNameEl = document.getElementById("esign-informant-name");
    const mobileEl = document.getElementById("esign-mobile-display");

    if (statementEl) statementEl.textContent = payload.statement.text;
    if (stmtLangEl) stmtLangEl.textContent = payload.statement.lang === "hi" ? "हिन्दी (Hindi)" : "English";
    if (informantNameEl) informantNameEl.textContent = payload.informant.name;
    if (mobileEl) mobileEl.textContent = payload.informant.mobile;

    // Reset Checkbox & UI States
    document.getElementById("esign-declaration-checkbox").checked = false;
    document.getElementById("esign-step-review").style.display = "block";
    document.getElementById("esign-step-success").style.display = "none";
    document.getElementById("esign-otp-input").value = "";

    // Reset Signature Upload UI
    document.getElementById("esign-signature-file-input").value = "";
    document.getElementById("esign-signature-preview-img").src = "";
    document.getElementById("esign-signature-empty-state").style.display = "flex";
    document.getElementById("esign-signature-preview-state").style.display = "none";

    // Navigate to E-Signature View
    window.App.navigate("electronic-signature");
  }

  // Handle Signature Image Upload
  function handleSignatureUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.App.showToast("Please upload a valid image file (JPG/PNG).", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      esignState.signatureImage = reader.result;
      document.getElementById("esign-signature-preview-img").src = reader.result;
      document.getElementById("esign-signature-empty-state").style.display = "none";
      document.getElementById("esign-signature-preview-state").style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  // Remove Uploaded Signature Image
  function removeSignature() {
    esignState.signatureImage = null;
    document.getElementById("esign-signature-file-input").value = "";
    document.getElementById("esign-signature-preview-img").src = "";
    document.getElementById("esign-signature-empty-state").style.display = "flex";
    document.getElementById("esign-signature-preview-state").style.display = "none";
  }

  // Open the OTP Modal
  function openOtpModal() {
    const declared = document.getElementById("esign-declaration-checkbox").checked;
    if (!declared) {
      window.App.showToast("Please confirm the statement declaration checkbox to proceed.", "warning");
      return;
    }

    if (!esignState.signatureImage) {
      window.App.showToast("Please upload your signature image before proceeding.", "warning");
      return;
    }

    const modal = document.getElementById("esign-otp-modal");
    if (modal) {
      modal.classList.add("active");
      const citizen = window.Store.getCurrentCitizen();
      document.getElementById("modal-esign-phone").textContent = citizen.mobile || "9876543210";
      document.getElementById("esign-otp-input").focus();
    }
  }

  function closeOtpModal() {
    const modal = document.getElementById("esign-otp-modal");
    if (modal) modal.classList.remove("active");
  }

  function fillDemoOtp() {
    document.getElementById("esign-otp-input").value = "123456";
    window.App.showToast("Demo OTP Auto-Filled: 123456", "info");
  }

  // Verify OTP and complete simulated E-Sign
  function verifyAndSign() {
    const otp = document.getElementById("esign-otp-input").value.trim();
    if (!otp || otp.length < 4) {
      window.App.showToast("Please enter a valid 6-digit OTP (e.g. 123456).", "warning");
      return;
    }

    closeOtpModal();

    // Generate cryptographic certificate reference
    const randomTxn = Math.floor(100000 + Math.random() * 900000);
    const txnRef = `ESIGN-2026-${randomTxn}`;
    const certHash = "SHA256:" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const timestamp = new Date().toISOString();

    esignState.isEsigned = true;
    esignState.txnRef = txnRef;
    esignState.certHash = certHash;
    esignState.timestamp = timestamp;

    // Show completed signature state
    document.getElementById("esign-step-review").style.display = "none";
    document.getElementById("esign-step-success").style.display = "block";

    document.getElementById("esign-result-txn").textContent = txnRef;
    document.getElementById("esign-result-cert").textContent = certHash;
    document.getElementById("esign-result-time").textContent = new Date().toLocaleString();
    document.getElementById("esign-result-signature-img").src = esignState.signatureImage || "";

    window.App.showToast("Electronic Signature Successfully Applied", "success");
  }

  // Complete Final Digital Authentication & Save E-FIR
  function completeAuthentication() {
    if (!esignState.isEsigned) {
      window.App.showToast("Electronic signature is required.", "warning");
      return;
    }

    const payload = esignState.payloadData;
    const digilocker = esignState.digilockerData;
    const esignInfo = {
      completed: true,
      txnRef: esignState.txnRef,
      timestamp: esignState.timestamp,
      certHash: esignState.certHash,
      signatureImage: esignState.signatureImage
    };

    // Construct Audit Trail
    const nowTimeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditTrail = [
      { time: nowTimeStr, action: "E-FIR Form Filled & Reviewed", actor: `Citizen (${payload.informant.name})`, ref: payload.draftId || "WEB-SUBMIT" },
      { time: nowTimeStr, action: "DigiLocker Identity Verified", actor: "Simulated DigiLocker Gateway", ref: digilocker.txnRef },
      { time: nowTimeStr, action: "Electronic Signature Verified via OTP", actor: "Simulated e-Sign Service", ref: esignInfo.txnRef },
      { time: nowTimeStr, action: "Digital Authentication Completed & Transmitted to Police Station", actor: "E-FIR Portal Engine", ref: "SEC-AUTH-2026" }
    ];

    // Save into Store
    const savedEfir = window.Store.saveNewEfir({
      draftId: payload.draftId,
      informant: payload.informant,
      incident: payload.incident,
      statement: payload.statement,
      documents: payload.documents,
      digilocker: digilocker,
      esign: esignInfo,
      auditTrail: auditTrail,
      officerNotes: "New submission received via citizen portal with verified digital identity and e-signature. Awaiting SHO scrutiny assignment."
    });

    // If there was an active draft, delete or clear it
    if (payload.draftId) {
      window.Store.deleteDraft(payload.draftId);
    }

    esignState.generatedEfir = savedEfir;

    // Reset wizard
    window.EfirWizard.resetWizard();

    // Render Final Authentication Success Page
    renderFinalAuthPage(savedEfir);
  }

  // Render Final Confirmation Page
  function renderFinalAuthPage(efir) {
    document.getElementById("auth-ref-number").textContent = efir.id;
    document.getElementById("auth-station-name").textContent = efir.incident.policeStation;
    document.getElementById("auth-informant-name").textContent = efir.informant.name;
    document.getElementById("auth-submission-time").textContent = new Date(efir.createdAt).toLocaleString();
    document.getElementById("auth-dl-ref").textContent = efir.digilocker.txnRef;
    document.getElementById("auth-esign-ref").textContent = efir.esign.txnRef;

    // Navigate to Authentication View
    window.App.navigate("auth-success");
    window.App.showToast(`E-FIR Authenticated: ${efir.id}`, "success");

    // Notify citizen that police will make contact within 24 hours
    const contactModal = document.getElementById("police-contact-modal");
    if (contactModal) contactModal.classList.add("active");
  }

  // Expose API
  window.EsignSim = {
    startEsign,
    openOtpModal,
    closeOtpModal,
    fillDemoOtp,
    handleSignatureUpload,
    removeSignature,
    verifyAndSign,
    completeAuthentication,
    getGeneratedEfir: () => esignState.generatedEfir
  };
})();
