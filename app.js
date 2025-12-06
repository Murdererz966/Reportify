// Elements
const langBtn = document.getElementById("langBtn");
const themeBtn = document.getElementById("themeBtn");
const form = document.getElementById("reportForm");
const feed = document.getElementById("feed");

// State
let currentLang = "en";
let issues = [];

// Translations
const translations = {
  en: {
    reportHeading: "Report an Issue",
    feedHeading: "Reported Issues",
    submitBtn: "Submit",
    heroTitle: "Community Issue Reporting",
    heroDesc: "Report problems in your area and let the community prioritize important issues."
  },
  kn: {
    reportHeading: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
    feedHeading: "ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳು",
    submitBtn: "ಸಲ್ಲಿಸು",
    heroTitle: "ಸಮುದಾಯ ಸಮಸ್ಯೆ ವರದಿ",
    heroDesc: "ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಗಳ ವರದಿ ಮಾಡಿ."
  },
  hi: {
    reportHeading: "समस्या रिपोर्ट करें",
    feedHeading: "रिपोर्ट की गई समस्याएँ",
    submitBtn: "सबमिट करें",
    heroTitle: "समुदाय समस्या रिपोर्टिंग",
    heroDesc: "अपने क्षेत्र की समस्याएँ रिपोर्ट करें।"
  }
};

// Language toggle
function switchLang() {
  currentLang = currentLang === "en" ? "kn" : currentLang === "kn" ? "hi" : "en";
  langBtn.innerText = currentLang.toUpperCase();
  document.querySelectorAll("[data-key]").forEach(el => {
    if (translations[currentLang][el.dataset.key]) {
      el.innerText = translations[currentLang][el.dataset.key];
    }
  });
}

if (langBtn) langBtn.addEventListener("click", switchLang);

// Theme toggle
if (themeBtn) themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Feed rendering
function renderFeed() {
  if (!feed) return;
  feed.innerHTML = "";
  issues.forEach((issue, idx) => {
    const div = document.createElement("div");
    div.className = "issue";
    div.innerHTML = `
      <strong>${issue.title}</strong>
      <p>${issue.desc}</p>
      <p><em>Summary:</em> ${issue.aiSummary || "Generating..."}</p>
      <p>
        <span class="vote-btn" onclick="vote(${idx},1)">⬆ ${issue.up}</span>
        <span class="vote-btn" onclick="vote(${idx},-1)">⬇ ${issue.down}</span>
        Status: ${issue.status}
      </p>
    `;
    feed.appendChild(div);
  });
}

// Voting logic
const UPVOTE_THRESHOLD = 5, DOWNVOTE_THRESHOLD = 3;
function vote(idx, type) {
  if (type === 1) issues[idx].up++; else issues[idx].down++;
  if (issues[idx].up >= UPVOTE_THRESHOLD) issues[idx].status = "reported";
  if (issues[idx].down >= DOWNVOTE_THRESHOLD) issues[idx].status = "spam";
  renderFeed();
}

// Gemini AI API
async function generateAIReport(issue, index) {
  try {
    const response = await fetch("https://api.gemini.ai/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "AIzaSyBPCymvLoSDNX5qD8RBqSHs7ow2PtbOkck" // Replace with your Gemini API key
      },
      body: JSON.stringify({
        model: "gemini-1",
        prompt: `Write a concise, easy-to-read summary of this community issue:\nTitle: ${issue.title}\nDescription: ${issue.desc}`,
        max_output_tokens: 100
      })
    });

    const data = await response.json();
    if (data?.output_text) {
      issues[index].aiSummary = data.output_text.trim();
      renderFeed();
    } else {
      issues[index].aiSummary = "Failed to generate summary.";
      renderFeed();
    }
  } catch (err) {
    console.error("AI API error:", err);
    issues[index].aiSummary = "Failed to generate summary.";
    renderFeed();
  }
}

// Form submission
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const desc = document.getElementById("description").value.trim();
    if (title && desc) {
      const newIssue = { title, desc, up: 0, down: 0, status: "open", aiSummary: "Generating..." };
      issues.push(newIssue);
      const index = issues.length - 1;
      renderFeed();
      generateAIReport(newIssue, index);
      form.reset();
    }
  });
}

// Initialize feed
window.onload = renderFeed;




