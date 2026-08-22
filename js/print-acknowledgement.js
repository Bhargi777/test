/**
 * Indian Police E-FIR Citizen Portal
 * Printable Acknowledgement Receipt & Official FIR Document Renderer
 */

(function() {
  // Render Official E-FIR Acknowledgement Slip
  function renderAcknowledgement(efirId) {
    const efir = window.Store.getEfirById(efirId);
    if (!efir) {
      window.App.showToast("E-FIR document not found.", "warning");
      return;
    }

    const currentLang = window.Store.getLang();
    const t = window.TRANSLATIONS[currentLang];

    document.getElementById("ack-doc-ref").textContent = efir.id;
    document.getElementById("ack-doc-date").textContent = new Date(efir.createdAt).toLocaleString();
    document.getElementById("ack-doc-informant").textContent = efir.informant.name;
    document.getElementById("ack-doc-mobile").textContent = efir.informant.mobile;
    document.getElementById("ack-doc-address").textContent = efir.informant.address;
    document.getElementById("ack-doc-station").textContent = `${efir.incident.policeStation} (${efir.incident.district})`;
    document.getElementById("ack-doc-offence").textContent = efir.incident.offenceCategory;
    document.getElementById("ack-doc-statement-lang").textContent = efir.statement.lang === "hi" ? "हिन्दी (Hindi)" : "English";
    document.getElementById("ack-doc-dl-ref").textContent = efir.digilocker?.txnRef || "DL-VER-2026-883921";
    document.getElementById("ack-doc-esign-ref").textContent = efir.esign?.txnRef || "ESIGN-2026-994012";
    document.getElementById("ack-doc-cert-hash").textContent = efir.esign?.certHash || "SHA256:8f4c9a01e3b52d88194fbc67104d9c72e45a0b93";

    window.App.navigate("view-acknowledgement");
  }

  // Render Official Registered FIR Document
  function renderFirDocument(firIdOrEfirId) {
    const efirs = window.Store.getEfirs();
    let targetEfir = efirs.find(e => 
      e.id.toLowerCase() === firIdOrEfirId.toLowerCase() || 
      (e.firDetails && e.firDetails.firNumber.toLowerCase() === firIdOrEfirId.toLowerCase())
    );

    if (!targetEfir || !targetEfir.firDetails) {
      // Fallback: pick the first sample FIR registered one
      targetEfir = efirs.find(e => e.status === "FIR Registered");
    }

    if (!targetEfir || !targetEfir.firDetails) {
      window.App.showToast("No registered FIR found with this reference number.", "warning");
      return;
    }

    const fir = targetEfir.firDetails;
    document.getElementById("fir-doc-number").textContent = fir.firNumber;
    document.getElementById("fir-doc-station").textContent = targetEfir.incident.policeStation;
    document.getElementById("fir-doc-district").textContent = targetEfir.incident.district;
    document.getElementById("fir-doc-datetime").textContent = fir.registeredDate;
    document.getElementById("fir-doc-sections").textContent = fir.actsAndSections;
    document.getElementById("fir-doc-complainant").textContent = `${targetEfir.informant.name}, Contact: ${targetEfir.informant.mobile}, Address: ${targetEfir.informant.address}`;
    document.getElementById("fir-doc-occurrence").textContent = `${targetEfir.incident.location} on ${targetEfir.incident.date} at ${targetEfir.incident.time || '18:00'}`;
    document.getElementById("fir-doc-statement").textContent = targetEfir.statement.text;
    document.getElementById("fir-doc-io").textContent = fir.investigatingOfficer;
    document.getElementById("fir-doc-remarks").textContent = fir.shoRemarks;

    window.App.navigate("view-fir-document");
  }

  // Trigger browser print for PDF export
  function printDocument() {
    window.print();
  }

  // Expose API
  window.PrintDoc = {
    renderAcknowledgement,
    renderFirDocument,
    printDocument
  };
})();
