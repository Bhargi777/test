/**
 * Indian Police e-FIR Citizen Portal
 * Simulated DigiLocker Identity Verification Flow
 * (Prototype / Demo Mode)
 */

(function() {
  const verifState = {
    isVerified: false,
    txnRef: null,
    timestamp: null,
    payloadData: null
  };

  // Launch the E-Verification page after Step 5 review
  function startVerification() {
    const payload = window.EfirWizard.getCompletedPayload();
    verifState.payloadData = payload;
    verifState.isVerified = false;
    verifState.txnRef = null;

    // Reset DigiLocker UI steps
    document.getElementById("digilocker-step-intro").style.display = "block";
    document.getElementById("digilocker-step-consent").style.display = "none";
    document.getElementById("digilocker-step-progress").style.display = "none";
    document.getElementById("digilocker-step-success").style.display = "none";
    document.getElementById("digi-consent-checkbox").checked = false;

    // Navigate to verification view
    window.App.navigate("e-verification");
  }

  // Step 1 -> Step 2 (Consent)
  function showConsentScreen() {
    document.getElementById("digilocker-step-intro").style.display = "none";
    document.getElementById("digilocker-step-consent").style.display = "block";
  }

  // Step 2 -> Step 3 (Simulated Processing)
  function submitConsentAndVerify() {
    const consent = document.getElementById("digi-consent-checkbox").checked;
    if (!consent) {
      window.App.showToast("Please provide consent to proceed with simulated identity verification.", "warning");
      return;
    }

    document.getElementById("digilocker-step-consent").style.display = "none";
    document.getElementById("digilocker-step-progress").style.display = "block";

    const progressStatus = document.getElementById("digi-progress-status");
    const progressSubtext = document.getElementById("digi-progress-subtext");

    // Simulated multi-stage verification steps
    setTimeout(() => {
      if (progressStatus) progressStatus.textContent = "Connecting to DigiLocker Secure Gateway...";
      if (progressSubtext) progressSubtext.textContent = "Negotiating TLS 1.3 cryptographic handshake...";
    }, 400);

    setTimeout(() => {
      if (progressStatus) progressStatus.textContent = "Validating Citizen Identity Hash...";
      if (progressSubtext) progressSubtext.textContent = "Querying digital credential repository token...";
    }, 1100);

    setTimeout(() => {
      if (progressStatus) progressStatus.textContent = "Generating Cryptographic Verification Proof...";
      if (progressSubtext) progressSubtext.textContent = "Applying government authority digital stamp...";
    }, 1800);

    setTimeout(() => {
      completeVerification();
    }, 2500);
  }

  // Step 3 -> Step 4 (Success Screen)
  function completeVerification() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const txnRef = `DL-VER-2026-${randomNum}`;
    const timestamp = new Date().toISOString();

    verifState.isVerified = true;
    verifState.txnRef = txnRef;
    verifState.timestamp = timestamp;

    const citizen = window.Store.getCurrentCitizen();
    const maskMobile = citizen.mobile ? `XXXXXX${citizen.mobile.slice(-4)}` : "XXXXXX3210";

    // Populate Success UI
    document.getElementById("digilocker-step-progress").style.display = "none";
    document.getElementById("digilocker-step-success").style.display = "block";

    document.getElementById("digi-result-txn").textContent = txnRef;
    document.getElementById("digi-result-timestamp").textContent = new Date().toLocaleString();
    document.getElementById("digi-result-name").textContent = citizen.name;
    document.getElementById("digi-result-phone").textContent = maskMobile;

    window.App.showToast("Identity Successfully Verified via Simulated DigiLocker", "success");
  }

  // Proceed from DigiLocker verification to E-Signature view
  function proceedToEsign() {
    if (!verifState.isVerified) {
      window.App.showToast("Identity verification must be completed first.", "warning");
      return;
    }

    // Attach verification token to wizard payload
    const verificationData = {
      verified: true,
      txnRef: verifState.txnRef,
      timestamp: verifState.timestamp,
      aadhaarToken: "XXXX-XXXX-8921",
      issuer: "DigiLocker Simulated Gateway (Govt. of India)"
    };

    // Forward to E-Signature manager
    window.EsignSim.startEsign(verifState.payloadData, verificationData);
  }

  // Expose API
  window.DigiLockerSim = {
    startVerification,
    showConsentScreen,
    submitConsentAndVerify,
    proceedToEsign,
    getState: () => verifState
  };
})();
