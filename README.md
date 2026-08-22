# Indian Police E-FIR Citizen Portal Prototype

A modern, responsive, and accessible citizen-facing police portal prototype inspired by Indian public-service portals, featuring:

> **Bilingual E-FIR + Digital Identity Verification (Simulated DigiLocker) + Electronic Signature (Simulated OTP E-Sign) + Police Scrutiny Desk**

---

## 🛡️ Core Innovation & Architecture

The portal addresses the primary friction points of traditional physical police station complaint lodging by introducing a streamlined, paperless 4-stage digital lifecycle:

1. **Submit**: 5-step intuitive wizard for informant, incident details, and complaint statement with dual-language preferences.
2. **Verify**: Simulated DigiLocker authorization for citizen identity authentication.
3. **E-Sign**: Simulated cryptographic Mobile/Aadhaar OTP e-signature to legally seal the submitted statement.
4. **Track**: Real-time tracking from digital authentication through police scrutiny to formal FIR registration.

> [!IMPORTANT]
> **Core Legal Principle**: The portal explicitly conveys that **Digital Authentication** confirms the authenticity and verified identity of the electronic submission, while **FIR Registration** remains strictly subject to police scrutiny and legal requirements under the Bharatiya Nyaya Sanhita (BNS) / CrPC.

---

## ✨ Key Features

- **🌐 Complete Bilingual Engine**: 100% functional text switching between **English** and **हिन्दी (Hindi)**.
- **🗣️ Independent Language Settings**: Citizens can set an **Interface Language** (e.g. English) and a **Statement Language** (e.g. हिन्दी) independently.
- **🔊 Accessibility Suite**:
  - Web Speech API integration for **"Read Aloud"** in English & Hindi.
  - Text size adjustment (A- / A / A+).
  - High-Contrast toggle mode for enhanced visual readability.
  - Keyboard navigability & ARIA landmarks.
- **💾 Save & Resume Drafts**: Save complaints at any stage with temporary reference IDs (e.g. `DRAFT/2026/00045`) and resume seamlessly.
- **📎 Multi-File Upload Simulator**: Drag & drop or attach preset sample proofs (Aadhaar ID, Purchase Invoice, Incident Spot Photo, Fraud Screenshot).
- **🔐 Simulated DigiLocker Identity Verification**: Realistic consent workflow, attribute tokenization, and transaction reference generation.
- **🖋️ Simulated Electronic Signature**: Mobile/Aadhaar OTP verification with SHA-256 cryptographic certificate generation.
- **🖨️ Official Printable Documents**:
  - Formatted **E-FIR Digital Authentication Acknowledgement Receipt** with QR placeholder and statutory legal disclaimers.
  - Formatted **Police First Information Report (FIR Form No. 24)** with SHO approval seal.
- **👮 Dedicated Police Officer Portal**:
  - Station House Officer (SHO) & Investigating Officer (IO) scrutiny desk.
  - KPI summary counters (New, Verified, Pending Scrutiny, Additional Info Req, FIRs Registered).
  - **Police Actions**:
    1. *Proceed for FIR Registration* (allocates formal FIR number & sections of law).
    2. *Request Additional Information* (queries citizen for supplementary documents).
    3. *Refer / Transfer Station* (jurisdictional routing).
    4. *Mark Non-Cognizable / Civil* (official police remarks).
- **🔄 Interactive Additional Information Flow**: Citizens receive active notification badges and can submit supplementary statements directly online.
- **📜 Cryptographic Audit Trail**: Chronological immutable log of all lifecycle events.

---

## 🚀 How to Run the Prototype

### Method 1: Double-Click or Open in Any Modern Browser
Open the file in your preferred browser (Google Chrome, Microsoft Edge, Opera, Mozilla Firefox):
```
c:\Users\sanath kumar\OneDrive\Desktop\indian-police-efir-portal\index.html
```

### Method 2: Run via PowerShell Script
Open PowerShell in the project directory and run:
```powershell
.\start-server.ps1
```
This starts a lightweight HTTP server on `http://localhost:8080/` and opens your browser automatically.

---

## 🧭 Complete Demonstration Walkthrough

1. **Homepage**: Observe the top emergency banner (112, 1930, 1091), the 4-stage concept cards, and toggle **हिन्दी** in the header.
2. **Citizen Login**: Click **Switch** in the top-right header to switch between sample demo citizens (*Rajesh Sharma*, *Priya Patel*, *Sanath Kumar*).
3. **Register E-FIR**:
   - Step 1: Confirm informant details and select **Statement Language**.
   - Step 2: Choose incident date, location, station (*Central Police Station*), and offence category (*Theft / Snatching*).
   - Step 3: Type or review statement and test the **"Read Aloud"** button.
   - Step 4: Click sample proof buttons (e.g. `+ Purchase Invoice Bill.pdf`).
   - Step 5: Review all sections and check the confirmation box.
4. **E-Verification (DigiLocker)**: Click **"Verify with DigiLocker"** → Review consent → Click **"Give Consent & Verify"** → Watch simulated verification → Click **"Continue to E-Signature"**.
5. **E-Signature**: Review final statement → Check declaration → Click **"Proceed to E-Sign"** → Click **"Auto-fill Demo OTP (123456)"** → Click **"Verify & Sign"** → Click **"Complete E-FIR Authentication"**.
6. **Authentication Page**: View generated reference (e.g. `EFIR/2026/000124`) and click **"Download Acknowledgement"** to view and print the official receipt.
7. **Track E-FIR**: Navigate to **Track E-FIR** to view the live progress timeline.
8. **Police Officer Portal**: Click **"Officer Portal"** in the top header or navigation bar:
   - View the new E-FIR in the scrutiny queue.
   - Click **"Scrutinize"** to review verified identity tokens and audit trails.
   - Test **"Request Additional Information"** or **"Proceed for FIR Registration"**.
   - Switch back to Citizen view to see the live status update!

---

## 🔒 Security & Privacy Notice

*This is a functional demonstration prototype for academic and evaluation purposes. All integrations with DigiLocker, Aadhaar, and E-Sign services are simulated. No real government credentials or personal data are used or transmitted.*
