/**
 * Indian Police E-FIR Citizen Portal
 * State Management & LocalStorage Persistence (Store)
 */

(function() {
  const STORAGE_KEY_PREFIX = "indian_police_efir_";

  // Initial Sample Citizens
  const DEFAULT_CITIZENS = [
    {
      id: "CITIZEN-001",
      name: "Rajesh Sharma",
      nameHi: "राजेश शर्मा",
      mobile: "9876543210",
      email: "rajesh.sharma@example.com",
      address: "House 42, Sector 15, Central City",
      addressHi: "मकान 42, सेक्टर 15, सेंट्रल सिटी",
      age: "34",
      interfaceLang: "en",
      statementLang: "en"
    },
    {
      id: "CITIZEN-002",
      name: "Priya Patel",
      nameHi: "प्रिया पटेल",
      mobile: "9123456780",
      email: "priya.patel@example.com",
      address: "Flat 302, Green Avenue, West District",
      addressHi: "फ्लैट 302, ग्रीन एवेन्यू, वेस्ट डिस्ट्रिक्ट",
      age: "28",
      interfaceLang: "hi",
      statementLang: "hi"
    },
    {
      id: "CITIZEN-003",
      name: "Sanath Kumar",
      nameHi: "सनाथ कुमार",
      mobile: "9988776655",
      email: "sanath.kumar@example.com",
      address: "Plot 88, Metro Layout, South District",
      addressHi: "प्लॉट 88, मेट्रो लेआउट, साउथ डिस्ट्रिक्ट",
      age: "29",
      interfaceLang: "en",
      statementLang: "hi" // Example of cross-language user
    }
  ];

  // Initial Sample Police Stations
  const DEFAULT_STATIONS = [
    {
      id: "PS-01",
      name: "Central Police Station",
      nameHi: "सेंट्रल पुलिस स्टेशन",
      district: "Central District",
      districtHi: "सेंट्रल जिला",
      state: "State NCT",
      address: "Police Bhawan, Mall Road, Central City - 110001",
      sho: "Inspector Vikram Rathore",
      shoRank: "Station House Officer (SHO)",
      phone: "011-23456781",
      mobile: "9412300001",
      email: "sho.central@statepolice.gov.in",
      jurisdiction: "Connaught Circle, Market Enclave, Sector 12-18",
      jurisdictionHi: "कनॉट सर्कल, मार्केट एन्क्लेव, सेक्टर 12-18"
    },
    {
      id: "PS-02",
      name: "Cyber Crime Police Station",
      nameHi: "साइबर अपराध पुलिस स्टेशन",
      district: "Central District",
      districtHi: "सेंट्रल जिला",
      state: "State NCT",
      address: "Cyber Cell Complex, 3rd Floor, Tech Enclave - 110002",
      sho: "Inspector Anjali Deshmukh",
      shoRank: "SHO (Cyber Crime)",
      phone: "011-23456782",
      mobile: "9412300002",
      email: "cybercrime@statepolice.gov.in",
      jurisdiction: "All Online Financial Fraud, Identity Theft & Digital Crimes",
      jurisdictionHi: "समस्त ऑनलाइन वित्तीय धोखाधड़ी, पहचान चोरी व साइबर अपराध"
    },
    {
      id: "PS-03",
      name: "West Cantonment Police Station",
      nameHi: "वेस्ट कैंटोनमेंट पुलिस स्टेशन",
      district: "West District",
      districtHi: "वेस्ट जिला",
      state: "State NCT",
      address: "Station Road, Cantonment Gate No. 2, West City - 110003",
      sho: "Inspector Harpreet Singh",
      shoRank: "Station House Officer",
      phone: "011-23456783",
      mobile: "9412300003",
      email: "sho.west@statepolice.gov.in",
      jurisdiction: "Green Avenue, Cantonment Area, Industrial Zone Phase 1",
      jurisdictionHi: "ग्रीन एवेन्यू, छावनी क्षेत्र, औद्योगिक क्षेत्र फेज 1"
    },
    {
      id: "PS-04",
      name: "South Metro Police Station",
      nameHi: "साउथ मेट्रो पुलिस स्टेशन",
      district: "South District",
      districtHi: "साउथ जिला",
      state: "State NCT",
      address: "Near Metro Terminal 3, Ring Road, South City - 110004",
      sho: "Inspector Manoj Kumar Meena",
      shoRank: "Station House Officer",
      phone: "011-23456784",
      mobile: "9412300004",
      email: "sho.south@statepolice.gov.in",
      jurisdiction: "Metro Layout, Highway Corridor, South Tech Park",
      jurisdictionHi: "मेट्रो लेआउट, हाईवे कॉरिडोर, साउथ टेक पार्क"
    }
  ];

  // Initial Sample E-FIRs with various lifecycles
  const DEFAULT_EFIRS = [
    {
      id: "EFIR/2026/000123",
      draftId: "DRAFT/2026/00012",
      status: "Police Scrutiny Pending",
      statusKey: "statusPoliceScrutiny",
      createdAt: "2026-08-22T10:15:00.000Z",
      updatedAt: "2026-08-22T11:30:00.000Z",
      informant: {
        name: "Rajesh Sharma",
        mobile: "9876543210",
        email: "rajesh.sharma@example.com",
        address: "House 42, Sector 15, Central City",
        age: "34",
        interfaceLang: "en",
        statementLang: "en"
      },
      incident: {
        date: "2026-08-21",
        time: "18:45",
        location: "Central Metro Station Gate No. 2, Sector 15 Market",
        state: "State NCT",
        district: "Central District",
        policeStation: "Central Police Station",
        stationId: "PS-01",
        offenceCategory: "Theft / Snatching (Mobile Phone)",
        offenceCategoryKey: "theft",
        summary: "Snatching of Samsung Galaxy S23 Mobile Phone by unknown bike rider"
      },
      statement: {
        lang: "en",
        text: "On 21st August 2026 around 6:45 PM, while exiting Central Metro Station Gate No. 2, an unidentified person wearing a black helmet on a red motorcycle (registration number partially noted as DL-03-XX-4912) snatched my Samsung Galaxy S23 (Black, IMEI 354892019284721) from my hand and fled towards Sector 16. The phone contained important work credentials and two banking SIM cards. Kindly investigate and trace the device."
      },
      documents: [
        { name: "Mobile_Purchase_Invoice_S23.pdf", size: "1.2 MB", type: "application/pdf", date: "2026-08-22" },
        { name: "Aadhaar_Card_Copy.pdf", size: "840 KB", type: "application/pdf", date: "2026-08-22" },
        { name: "Metro_Gate_Area_Photo.jpg", size: "2.4 MB", type: "image/jpeg", date: "2026-08-22" }
      ],
      digilocker: {
        verified: true,
        txnRef: "DL-VER-2026-883921",
        timestamp: "2026-08-22T10:22:15.000Z",
        aadhaarToken: "XXXX-XXXX-8921",
        issuer: "DigiLocker Gateway (Govt. of India)"
      },
      esign: {
        completed: true,
        txnRef: "ESIGN-2026-994012",
        timestamp: "2026-08-22T10:24:40.000Z",
        certHash: "SHA256:8f4c9a01e3b52d88194fbc67104d9c72e45a0b93"
      },
      auditTrail: [
        { time: "2026-08-22 10:15:00", action: "E-FIR Form Draft Created", actor: "Citizen (Rajesh Sharma)", ref: "DRAFT/2026/00012" },
        { time: "2026-08-22 10:22:15", action: "DigiLocker Identity Verified", actor: "Simulated DigiLocker", ref: "DL-VER-2026-883921" },
        { time: "2026-08-22 10:24:40", action: "Electronic Signature Verified via OTP", actor: "Simulated e-Sign Service", ref: "ESIGN-2026-994012" },
        { time: "2026-08-22 10:25:00", action: "Digital Authentication Completed & Transmitted", actor: "E-FIR Portal Engine", ref: "EFIR/2026/000123" },
        { time: "2026-08-22 11:30:00", action: "Assigned to IO Inspector Vikram Rathore for Scrutiny", actor: "Police Station Central", ref: "DESK-SCRUTINY-01" }
      ],
      officerNotes: "Preliminary inquiry initiated. CCTV footage from DMRC Metro Exit Gate 2 requested. Mobile IMEI placed under surveillance with Telecom CEIR portal."
    },
    {
      id: "EFIR/2026/000098",
      draftId: "DRAFT/2026/00009",
      status: "Additional Information Required",
      statusKey: "statusAddInfoRequired",
      createdAt: "2026-08-20T14:30:00.000Z",
      updatedAt: "2026-08-21T09:15:00.000Z",
      informant: {
        name: "Priya Patel",
        mobile: "9123456780",
        email: "priya.patel@example.com",
        address: "Flat 302, Green Avenue, West District",
        age: "28",
        interfaceLang: "hi",
        statementLang: "hi"
      },
      incident: {
        date: "2026-08-19",
        time: "15:20",
        location: "Online / WhatsApp UPI Payment Scam",
        state: "State NCT",
        district: "Central District",
        policeStation: "Cyber Crime Police Station",
        stationId: "PS-02",
        offenceCategory: "Cyber Financial Fraud (UPI / Phishing)",
        offenceCategoryKey: "cybercrime",
        summary: "UPI Payment scam of Rs. 45,000 via fraudulent electricity bill payment link"
      },
      statement: {
        lang: "hi",
        text: "19 अगस्त 2026 को मुझे एक अज्ञात नंबर से व्हाट्सएप मैसेज प्राप्त हुआ जिसमें बिजली कनेक्शन काटने की चेतावनी दी गई थी। दिए गए लिंक पर क्लिक करने और 10 रुपये का अपडेट शुल्क भरने के दौरान धोखे से मेरे बैंक खाते से तीन किश्तों में कुल 45,000 रुपये काट लिए गए। लाभार्थी यूपीआई आईडी 'billpay.desk88@icici' दिखाई दे रही है। कृपया इस धोखाधड़ी की जांच करें और खाता फ्रीज कराएं।"
      },
      documents: [
        { name: "Bank_Statement_HDFC_Aug2026.pdf", size: "1.8 MB", type: "application/pdf", date: "2026-08-20" },
        { name: "WhatsApp_Threat_Message_Screenshot.png", size: "950 KB", type: "image/png", date: "2026-08-20" }
      ],
      digilocker: {
        verified: true,
        txnRef: "DL-VER-2026-771829",
        timestamp: "2026-08-20T14:38:10.000Z",
        aadhaarToken: "XXXX-XXXX-6780",
        issuer: "DigiLocker Gateway (Govt. of India)"
      },
      esign: {
        completed: true,
        txnRef: "ESIGN-2026-881920",
        timestamp: "2026-08-20T14:40:55.000Z",
        certHash: "SHA256:7c2e8a19b0d4f391884cae65201d8b61f34b9c10"
      },
      auditTrail: [
        { time: "2026-08-20 14:30:00", action: "E-FIR Form Draft Created", actor: "Citizen (Priya Patel)", ref: "DRAFT/2026/00009" },
        { time: "2026-08-20 14:38:10", action: "DigiLocker Identity Verified", actor: "Simulated DigiLocker", ref: "DL-VER-2026-771829" },
        { time: "2026-08-20 14:40:55", action: "Electronic Signature Verified", actor: "Simulated e-Sign Service", ref: "ESIGN-2026-881920" },
        { time: "2026-08-20 14:42:00", action: "Digital Authentication Completed", actor: "E-FIR Portal Engine", ref: "EFIR/2026/000098" },
        { time: "2026-08-21 09:15:00", action: "Additional Information Requested by Cyber Cell IO", actor: "Inspector Anjali Deshmukh", ref: "REQ-INFO-2026-04" }
      ],
      additionalInfoRequest: {
        requestedBy: "Inspector Anjali Deshmukh (Cyber Cell)",
        requestDate: "2026-08-21",
        deadline: "2026-08-26",
        query: "Please provide the official 12-digit UPI Transaction Reference (UTR) Numbers from your bank passbook/net banking statement for all 3 debits, and the complete phone number with country code from which the WhatsApp message originated.",
        citizenResponse: null,
        responseDate: null,
        supplementaryDocuments: []
      },
      officerNotes: "Notice issued to beneficiary payment gateway under Section 91 CrPC. Awaiting exact 12-digit UTR numbers from complainant."
    },
    {
      id: "EFIR/2026/000075",
      draftId: "DRAFT/2026/00004",
      status: "FIR Registered",
      statusKey: "statusFirRegistered",
      createdAt: "2026-08-15T09:00:00.000Z",
      updatedAt: "2026-08-16T16:00:00.000Z",
      informant: {
        name: "Sanath Kumar",
        mobile: "9988776655",
        email: "sanath.kumar@example.com",
        address: "Plot 88, Metro Layout, South District",
        age: "29",
        interfaceLang: "en",
        statementLang: "en"
      },
      incident: {
        date: "2026-08-14",
        time: "20:00",
        location: "South Tech Park Bus Stop, Highway Corridor",
        state: "State NCT",
        district: "South District",
        policeStation: "South Metro Police Station",
        stationId: "PS-04",
        offenceCategory: "Vehicle Theft (Motorcycle)",
        offenceCategoryKey: "theft",
        summary: "Theft of parked Royal Enfield Classic 350 motorcycle from public parking"
      },
      statement: {
        lang: "en",
        text: "I parked my Royal Enfield Classic 350 (Color: Stealth Black, Reg No. DL-07-CK-9901, Engine No. RE350X89211) at the South Tech Park authorized parking area on 14th Aug at 8:00 PM. Upon returning at 10:30 PM, the motorcycle was missing. Parking attendant confirmed no knowledge. Original keys are in my possession. Please register FIR and initiate investigation."
      },
      documents: [
        { name: "Vehicle_RC_Copy.pdf", size: "1.5 MB", type: "application/pdf", date: "2026-08-15" },
        { name: "Insurance_Policy_Valid.pdf", size: "900 KB", type: "application/pdf", date: "2026-08-15" },
        { name: "Parking_Slip_Receipt.jpg", size: "1.1 MB", type: "image/jpeg", date: "2026-08-15" }
      ],
      digilocker: {
        verified: true,
        txnRef: "DL-VER-2026-664819",
        timestamp: "2026-08-15T09:12:00.000Z",
        aadhaarToken: "XXXX-XXXX-6655",
        issuer: "DigiLocker Gateway (Govt. of India)"
      },
      esign: {
        completed: true,
        txnRef: "ESIGN-2026-773812",
        timestamp: "2026-08-15T09:15:30.000Z",
        certHash: "SHA256:3a1b8c9d0e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b"
      },
      firDetails: {
        firNumber: "FIR/SOUTH/2026/0412",
        registeredDate: "2026-08-16 16:00",
        actsAndSections: "Bharatiya Nyaya Sanhita (BNS) 2023 - Section 303(2) (Theft) / IPC Sec 379",
        investigatingOfficer: "Sub-Inspector Arvind Rawat (Badge #SI-8841)",
        shoRemarks: "Cognizable offence under BNS Sec 303(2) established on preliminary scrutiny of RC and parking area logs. Formal FIR registered. Auto-theft squad alerted across toll barriers."
      },
      auditTrail: [
        { time: "2026-08-15 09:00:00", action: "E-FIR Form Submitted", actor: "Citizen (Sanath Kumar)", ref: "DRAFT/2026/00004" },
        { time: "2026-08-15 09:12:00", action: "DigiLocker Identity Verified", actor: "Simulated DigiLocker", ref: "DL-VER-2026-664819" },
        { time: "2026-08-15 09:15:30", action: "E-Signature Completed", actor: "Simulated e-Sign", ref: "ESIGN-2026-773812" },
        { time: "2026-08-15 09:16:00", action: "Digital Authentication Completed", actor: "E-FIR Portal Engine", ref: "EFIR/2026/000075" },
        { time: "2026-08-16 16:00:00", action: "Formal FIR Registered by SHO", actor: "Inspector Manoj Kumar Meena (SHO)", ref: "FIR/SOUTH/2026/0412" }
      ],
      officerNotes: "Formal FIR registered. Case assigned to SI Arvind Rawat. Vehicle details broadcasted on CCTNS stolen vehicle portal."
    }
  ];

  // Initial Sample Drafts
  const DEFAULT_DRAFTS = [
    {
      id: "DRAFT/2026/00045",
      createdAt: "2026-08-22T08:30:00.000Z",
      updatedAt: "2026-08-22T08:45:00.000Z",
      step: 3,
      informant: {
        name: "Rajesh Sharma",
        mobile: "9876543210",
        email: "rajesh.sharma@example.com",
        address: "House 42, Sector 15, Central City",
        age: "34",
        interfaceLang: "en",
        statementLang: "en"
      },
      incident: {
        date: "2026-08-22",
        time: "07:30",
        location: "City Park Jogging Track, Central District",
        state: "State NCT",
        district: "Central District",
        policeStation: "Central Police Station",
        stationId: "PS-01",
        offenceCategory: "Lost Property / Missing Document",
        offenceCategoryKey: "lost_property",
        summary: "Loss of Leather Wallet containing Driving License and 2 Debit Cards"
      },
      statement: {
        lang: "en",
        text: "I lost my brown leather wallet while morning jogging at City Park around 7:30 AM today. It contained original Driving License (DL-04-2018-99128) and HDFC Bank Debit Card..."
      },
      documents: []
    }
  ];

  // Initial FAQs in English and Hindi
  const DEFAULT_FAQS = [
    {
      qEn: "What is an E-FIR?",
      qHi: "ई-एफआईआर क्या है?",
      aEn: "An E-FIR (Electronic First Information Report) is a digital method for citizens to report non-cognizable complaints, lost property, and specified cognizable offences online without immediately visiting a police station in person.",
      aHi: "ई-एफआईआर (इलेक्ट्रॉनिक प्रथम सूचना रिपोर्ट) नागरिकों के लिए गैर-संज्ञेय शिकायतों, खोई हुई वस्तुओं और निर्दिष्ट अपराधों की ऑनलाइन रिपोर्ट दर्ज करने का एक डिजिटल माध्यम है, जिससे थाने जाने की आवश्यकता नहीं होती।"
    },
    {
      qEn: "Who can submit an E-FIR?",
      qHi: "ई-एफआईआर कौन दर्ज कर सकता है?",
      aEn: "Any citizen who is a victim, eyewitness, or authorized representative can submit an E-FIR by verifying their identity through DigiLocker and completing the simulated OTP e-signature.",
      aHi: "कोई भी नागरिक जो पीड़ित, प्रत्यक्षदर्शी या अधिकृत प्रतिनिधि है, डिजिलॉकर के माध्यम से अपनी पहचान सत्यापित करके और ओटीपी ई-हस्ताक्षर पूरा करके ई-एफआईआर दर्ज कर सकता है।"
    },
    {
      qEn: "What is E-Verification?",
      qHi: "ई-सत्यापन (E-Verification) क्या है?",
      aEn: "E-Verification is the digital process of validating the complainant's legal identity through government-authorized digital identity repositories (such as DigiLocker) before signing the document.",
      aHi: "ई-सत्यापन शिकायतकर्ता की कानूनी पहचान को आधिकारिक डिजिटल पहचान रिपॉजिटरी (जैसे डिजिलॉकर) के माध्यम से डिजिटल रूप से सत्यापित करने की प्रक्रिया है।"
    },
    {
      qEn: "Why is identity verification required?",
      qHi: "पहचान सत्यापन क्यों अनिवार्य है?",
      aEn: "Identity verification prevents fraudulent, malicious, or anonymous complaints, provides legal non-repudiation, and ensures that police resources are deployed for genuine grievances.",
      aHi: "पहचान सत्यापन फर्जी, दुर्भावनापूर्ण या गुमनाम शिकायतों को रोकता है, कानूनी प्रामाणिकता देता है और सुनिश्चित करता है कि पुलिस वास्तविक मामलों पर तुरंत कार्रवाई करे।"
    },
    {
      qEn: "What is DigiLocker?",
      qHi: "डिजिलॉकर (DigiLocker) क्या है?",
      aEn: "DigiLocker is a flagship initiative of the Ministry of Electronics and IT (Govt. of India) providing citizens with access to authentic digital documents and verified identity credentials.",
      aHi: "डिजिलॉकर इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय (भारत सरकार) की एक प्रमुख पहल है जो नागरिकों को प्रामाणिक डिजिटल दस्तावेज और सत्यापित पहचान प्रदान करती है।"
    },
    {
      qEn: "What is an electronic signature (E-Sign)?",
      qHi: "इलेक्ट्रॉनिक हस्ताक्षर (E-Sign) क्या है?",
      aEn: "An electronic signature legally seals your submitted statement using cryptographic OTP verification, establishing that the statement was submitted by you and has not been altered.",
      aHi: "इलेक्ट्रॉनिक हस्ताक्षर क्रिप्टोग्राफिक ओटीपी सत्यापन का उपयोग करके आपके बयान को कानूनी रूप से प्रमाणित करता है कि बयान आपके द्वारा दिया गया है और इसमें कोई छेड़छाड़ नहीं हुई है।"
    },
    {
      qEn: "Do I need to visit the police station?",
      qHi: "क्या मुझे पुलिस थाने जाने की आवश्यकता है?",
      aEn: "For digitally verified submissions (such as lost items, online fraud, or non-cognizable reports), you do NOT need to visit for identity authentication. However, police may request supplementary evidence or your presence if a serious cognizable crime requires forensic investigation.",
      aHi: "डिजिटल रूप से सत्यापित शिकायतों (जैसे खोया सामान, ऑनलाइन धोखाधड़ी) के लिए पहचान सत्यापन हेतु थाने जाने की आवश्यकता नहीं है। हालांकि, गंभीर अपराधों में जांच अधिकारी आवश्यकतानुसार संपर्क कर सकते हैं।"
    },
    {
      qEn: "How do I track my E-FIR?",
      qHi: "मैं अपनी ई-एफआईआर को कैसे ट्रैक करूँ?",
      aEn: "Click on 'Track E-FIR' in the navigation bar, enter your generated reference number (e.g. EFIR/2026/000123), and view the step-by-step progress timeline and officer remarks in real time.",
      aHi: "नेविगेशन बार में 'ई-एफआईआर ट्रैक करें' पर क्लिक करें, अपनी संदर्भ संख्या (उदा. EFIR/2026/000123) दर्ज करें और वास्तविक समय में प्रगति और अधिकारी की टिप्पणी देखें।"
    },
    {
      qEn: "What happens after submission?",
      qHi: "जमा करने के बाद क्या होता है?",
      aEn: "Your submission is securely routed to the jurisdictional Station House Officer (SHO). The officer scrutinizes the facts, reviews evidence, and either proceeds for formal FIR registration, seeks additional information, or transfers to the appropriate jurisdiction.",
      aHi: "आपकी शिकायत संबंधित थाना प्रभारी (SHO) को सुरक्षित रूप से भेजी जाती है। अधिकारी तथ्यों और साक्ष्यों की जांच करते हैं और या तो औपचारिक एफआईआर दर्ज करते हैं, या अतिरिक्त जानकारी मांगते हैं।"
    },
    {
      qEn: "What if additional information is requested?",
      qHi: "यदि अतिरिक्त जानकारी मांगी जाए तो क्या करें?",
      aEn: "If the police officer requires more proofs (e.g. bank UTR numbers or purchase invoices), an alert will appear on your Dashboard. You can click 'Submit Additional Information' and upload required items directly online.",
      aHi: "यदि जांच अधिकारी को अतिरिक्त प्रमाण की आवश्यकता होती है, तो आपके डैशबोर्ड पर एक अलर्ट दिखाई देगा। आप 'अतिरिक्त जानकारी जमा करें' पर क्लिक करके सीधे ऑनलाइन दस्तावेज अपलोड कर सकते हैं।"
    },
    {
      qEn: "How do I change the language?",
      qHi: "मैं भाषा कैसे बदल सकता/सकती हूँ?",
      aEn: "You can toggle between English and हिन्दी anytime using the language selector button in the header. Additionally, you can choose a separate language for your written complaint statement in Step 1 & 3.",
      aHi: "आप हेडर में दिए गए भाषा चयन बटन से कभी भी अंग्रेजी और हिन्दी के बीच बदलाव कर सकते हैं। इसके अलावा, आप चरण 1 और 3 में अपने बयान के लिए अलग भाषा चुन सकते हैं।"
    }
  ];

  // Helper Functions
  function getFromStorage(key, defaultValue) {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn("Storage read error:", e);
      return defaultValue;
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage write error:", e);
    }
  }

  // Store Object Definition
  const Store = {
    // Initializer
    init() {
      if (!getFromStorage("initialized", false)) {
        this.resetDemoData();
      }
    },

    resetDemoData() {
      saveToStorage("citizens", DEFAULT_CITIZENS);
      saveToStorage("current_citizen", DEFAULT_CITIZENS[0]);
      saveToStorage("stations", DEFAULT_STATIONS);
      saveToStorage("efirs", DEFAULT_EFIRS);
      saveToStorage("drafts", DEFAULT_DRAFTS);
      saveToStorage("faqs", DEFAULT_FAQS);
      saveToStorage("current_lang", "en");
      saveToStorage("text_size", "normal");
      saveToStorage("high_contrast", false);
      saveToStorage("active_portal", "citizen"); // 'citizen' or 'police'
      saveToStorage("initialized", true);
    },

    // Citizen Session
    getCurrentCitizen() {
      return getFromStorage("current_citizen", DEFAULT_CITIZENS[0]);
    },

    setCurrentCitizen(citizen) {
      saveToStorage("current_citizen", citizen);
    },

    getAllCitizens() {
      return getFromStorage("citizens", DEFAULT_CITIZENS);
    },

    registerCitizen(citizenData) {
      const citizens = this.getAllCitizens();
      const newCitizen = {
        id: "CITIZEN-" + String(citizens.length + 1).padStart(3, "0"),
        ...citizenData
      };
      citizens.push(newCitizen);
      saveToStorage("citizens", citizens);
      this.setCurrentCitizen(newCitizen);
      return newCitizen;
    },

    // Language & Accessibility
    getLang() {
      return getFromStorage("current_lang", "en");
    },

    setLang(lang) {
      saveToStorage("current_lang", lang === "hi" ? "hi" : "en");
    },

    getTextSize() {
      return getFromStorage("text_size", "normal");
    },

    setTextSize(size) {
      saveToStorage("text_size", size);
    },

    isHighContrast() {
      return getFromStorage("high_contrast", false);
    },

    setHighContrast(val) {
      saveToStorage("high_contrast", !!val);
    },

    getActivePortal() {
      return getFromStorage("active_portal", "citizen");
    },

    setActivePortal(portal) {
      saveToStorage("active_portal", portal === "police" ? "police" : "citizen");
    },

    // E-FIR CRUD
    getEfirs() {
      return getFromStorage("efirs", DEFAULT_EFIRS);
    },

    getEfirById(id) {
      const efirs = this.getEfirs();
      return efirs.find(e => e.id.toLowerCase() === id.toLowerCase() || (e.draftId && e.draftId.toLowerCase() === id.toLowerCase()));
    },

    saveNewEfir(efirData) {
      const efirs = this.getEfirs();
      // Generate standard reference: EFIR/2026/000XXX
      const newNum = String(efirs.length + 124).padStart(6, "0");
      const refId = `EFIR/2026/${newNum}`;
      
      const newEfir = {
        id: refId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "Police Scrutiny Pending",
        statusKey: "statusPoliceScrutiny",
        ...efirData
      };

      efirs.unshift(newEfir);
      saveToStorage("efirs", efirs);
      return newEfir;
    },

    updateEfir(id, updatePayload) {
      const efirs = this.getEfirs();
      const index = efirs.findIndex(e => e.id.toLowerCase() === id.toLowerCase());
      if (index !== -1) {
        efirs[index] = {
          ...efirs[index],
          ...updatePayload,
          updatedAt: new Date().toISOString()
        };
        saveToStorage("efirs", efirs);
        return efirs[index];
      }
      return null;
    },

    // Drafts
    getDrafts() {
      return getFromStorage("drafts", DEFAULT_DRAFTS);
    },

    getDraftById(id) {
      const drafts = this.getDrafts();
      return drafts.find(d => d.id.toLowerCase() === id.toLowerCase());
    },

    saveDraft(draftData) {
      const drafts = this.getDrafts();
      let draftId = draftData.id;
      if (!draftId) {
        const count = drafts.length + 46;
        draftId = `DRAFT/2026/${String(count).padStart(5, "0")}`;
      }

      const existingIndex = drafts.findIndex(d => d.id.toLowerCase() === draftId.toLowerCase());
      const draftObj = {
        id: draftId,
        updatedAt: new Date().toISOString(),
        createdAt: draftData.createdAt || new Date().toISOString(),
        ...draftData
      };

      if (existingIndex !== -1) {
        drafts[existingIndex] = draftObj;
      } else {
        drafts.unshift(draftObj);
      }

      saveToStorage("drafts", drafts);
      return draftObj;
    },

    deleteDraft(id) {
      let drafts = this.getDrafts();
      drafts = drafts.filter(d => d.id.toLowerCase() !== id.toLowerCase());
      saveToStorage("drafts", drafts);
      return drafts;
    },

    // Police Stations
    getStations() {
      return getFromStorage("stations", DEFAULT_STATIONS);
    },

    getStationById(id) {
      const stations = this.getStations();
      return stations.find(s => s.id === id);
    },

    // FAQs
    getFaqs() {
      return getFromStorage("faqs", DEFAULT_FAQS);
    }
  };

  // Initialize store on load
  Store.init();

  // Expose globally
  window.Store = Store;
})();
