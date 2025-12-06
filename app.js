const langBtn = document.getElementById("langBtn");
const modeBtn = document.getElementById("modeBtn");

let currentLang = "en";

const translations = {
  en: {
    brand: "Reportify",
    navHome: "Home",
    navIssues: "Issues",
    navReport: "Report",
    navAbout: "About",
    theme1: "Theme 1",
    theme2: "Theme 2",
    mode: "Dark",
    heroTitle: "Community-powered issue reporting",
    heroSub: "Report problems in your locality, let the community surface what's important.",
    heroBtn: "Report an Issue",
    heroBrowse: "Browse Issues",
    recent: "Recent Issues",
    demoNote: "Demo mode uses local data."
  },

  kn: {
    brand: "ರಿಪೋರ್ಟ್‌ಫೈ",
    navHome: "ಮುಖಪುಟ",
    navIssues: "ಸಮಸ್ಯೆಗಳು",
    navReport: "ರಿಪೋರ್ಟ್",
    navAbout: "ಬಗ್ಗೆ",
    theme1: "ಥೀಮ್ 1",
    theme2: "ಥೀಮ್ 2",
    mode: "ಡಾರ್ಕ್",
    heroTitle: "ಸಮುದಾಯ ಆಧಾರಿತ ಸಮಸ್ಯೆ ವರದಿ",
    heroSub: "ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಗಳ ಮಾಹಿತಿ ನೀಡಿರಿ.",
    heroBtn: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
    heroBrowse: "ಸಮಸ್ಯೆಗಳು ನೋಡಿರಿ",
    recent: "ಇತ್ತೀಚಿನ ಸಮಸ್ಯೆಗಳು",
    demoNote: "ಡೆಮೋ ಮೋಡ್ ಸ್ಥಳೀಯ ಡೇಟಾ ಬಳಸುತ್ತದೆ."
  },

  hi: {
    brand: "रिपॉर्टिफ़ाई",
    navHome: "होम",
    navIssues: "समस्याएँ",
    navReport: "रिपोर्ट",
    navAbout: "अबाउट",
    theme1: "थीम 1",
    theme2: "थीम 2",
    mode: "डार्क",
    heroTitle: "समुदाय आधारित समस्या रिपोर्टिंग",
    heroSub: "अपने क्षेत्र की समस्याएँ रिपोर्ट करें।",
    heroBtn: "समस्या रिपोर्ट करें",
    heroBrowse: "समस्याएँ देखें",
    recent: "हाल की समस्याएँ",
    demoNote: "डेमो मोड स्थानीय डेटा उपयोग करता है।"
  }
};

function updateLanguage() {
  document.querySelectorAll("[data-key]").forEach(el => {
    el.innerText = translations[currentLang][el.dataset.key];
  });
}

langBtn.onclick = () => {
  if (currentLang === "en") { currentLang = "kn"; langBtn.innerText = "HI"; }
  else if (currentLang === "kn") { currentLang = "hi"; langBtn.innerText = "EN"; }
  else { currentLang = "en"; langBtn.innerText = "KN"; }
  updateLanguage();
};

function toggleMode() {
  document.documentElement.classList.toggle("light");
  modeBtn.innerText =
    document.documentElement.classList.contains("light") ? "Light" : "Dark";
}

function setTheme(name) {
  document.documentElement.classList.remove("theme1", "theme2");
  document.documentElement.classList.add(name);
}




