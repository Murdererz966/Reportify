// ===== Elements =====
const langSelect = document.getElementById("langSelect");
const themeBtn = document.getElementById("themeBtn");
const form = document.getElementById("reportForm");
const feed = document.getElementById("feed");
const generateReportBtn = document.getElementById("generateReportBtn");
const finalReportDiv = document.getElementById("finalReport");

// ===== State =====
let currentLang = "en";
let issues = [];

// ===== Translations =====
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

// ===== Language Switch =====
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    document.querySelectorAll("[data-key]").forEach(el => {
      if (translations[currentLang][el.dataset.key]) {
        el.innerText = translations[currentLang][el.dataset.key];
      }
    });
  });
}

// ===== Theme Toggle =====
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });
}

// ===== Vote thresholds =====
const UPVOTE_THRESHOLD = 5;
const DOWNVOTE_THRESHOLD = 3;

// ===== Render feed =====
function renderFeed() {
  if (!feed) return;
  feed.innerHTML = "";
  issues.forEach((issue, idx) => {
    const div = document.createElement("div");
    div.className = "issue";
    div.innerHTML = `
      <strong>${issue.title}</strong>
      <p>${issue.desc}</p>
      <p><em>AI Summary:</em> ${issue.aiSummary || "Generating..."}</p>
      <p>
        <span class="vote-btn" onclick="vote(${idx},1)">⬆ ${issue.up}</span>
        <span class="vote-btn" onclick="vote(${idx},-1)">⬇ ${issue.down}</span>
        Status: <span class="status-${issue.status}">${issue.status}</span>
      </p>
    `;
    feed.appendChild(div);
  });
}

// ===== Voting =====
function vote(idx, type){
  if(type===1) issues[idx].up++;
  else issues[idx].down++;

  // Update status automatically
  if(issues[idx].up >= UPVOTE_THRESHOLD) issues[idx].status = "reported";
  if(issues[idx].down >= DOWNVOTE_THRESHOLD) issues[idx].status = "spam";

  renderFeed();
  updateAuthorityReportPreview();
}

// ===== Update Authority Report Preview =====
function updateAuthorityReportPreview() {
  if (!finalReportDiv) return;
  const reportedIssues = issues.filter(i => i.status === "reported");
  if(reportedIssues.length === 0){
    finalReportDiv.innerText = "No issues have enough community support to report yet.";
    return;
  }

  let reportText = "Issues ready for authorities:\n\n";
  reportedIssues.forEach((issue, idx)=>{
    reportText += `${idx+1}. ${issue.title}\nSummary: ${issue.aiSummary}\n\n`;
  });

  finalReportDiv.innerText = reportText;
}

// ===== OpenAI GPT API (AI summary) =====
async function generateAIReport(issue, index) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_OPENAI_API_KEY" // Replace with your key
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant summarizing community issues." },
          { role: "user", content: `Summarize concisely:\nTitle: ${issue.title}\nDescription: ${issue.desc}` }
        ],
        max_tokens: 100
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0].message) {
      issues[index].aiSummary = data.choices[0].message.content.trim();
      renderFeed();
      updateAuthorityReportPreview(); // Update report preview after AI summary
    }
  } catch (err) {
    console.error("OpenAI API error:", err);
    issues[index].aiSummary = "Failed to generate summary.";
    renderFeed();
    updateAuthorityReportPreview();
  }
}

// ===== Submit Form =====
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const desc = document.getElementById("description").value.trim();
    if(title && desc){
      const newIssue = { title, desc, up:0, down:0, status:"open", aiSummary:"Generating..." };
      issues.push(newIssue);
      const index = issues.length -1;
      renderFeed();
      generateAIReport(newIssue, index);
      form.reset();
    }
  });
}

// ===== Generate Final Authority Report via GPT =====
if (generateReportBtn) {
  generateReportBtn.addEventListener("click", async () => {
    const reportedIssues = issues.filter(i => i.status === "reported");
    if (reportedIssues.length === 0) {
      finalReportDiv.innerText = "No issues have enough community support to report yet.";
      return;
    }

    let prompt = "Create a clear formal report for local authorities summarizing these issues:\n\n";
    reportedIssues.forEach((issue, idx) => {
      prompt += `${idx+1}. Title: ${issue.title}\nDescription: ${issue.desc}\nAI Summary: ${issue.aiSummary}\n\n`;
    });

    try {
      const response = await fetch("https://api.gemini.ai/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "AIzaSyBPCymvLoSDNX5qD8RBqSHs7ow2PtbOkck" // Replace with your key
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an assistant creating formal reports for authorities." },
            { role: "user", content: prompt }
          ],
          max_tokens: 500
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0].message) {
        finalReportDiv.innerText = data.choices[0].message.content.trim();
      }

    } catch(err){
      console.error(err);
      finalReportDiv.innerText = "Failed to generate report.";
    }
  });
}

// ===== Initial render =====
window.onload = () => {
  renderFeed();
  updateAuthorityReportPreview();
};
