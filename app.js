const langBtn = document.getElementById("langBtn");
const modeBtn = document.getElementById("modeBtn");
const reportForm = document.getElementById("reportForm");
const feed = document.getElementById("feed");

let currentLang = "en";
let issues = [];

const UPVOTE_THRESHOLD = 3;
const DOWNVOTE_THRESHOLD = 2;

// Translations
const translations = {
  en: { heroTitle:"Community Issue Reporting", heroDesc:"Report problems in your area.", reportHeading:"Report an Issue", feedHeading:"Reported Issues", submitBtn:"Submit" },
  kn: { heroTitle:"ಸಮುದಾಯ ಸಮಸ್ಯೆ ವರದಿ", heroDesc:"ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಗಳ ವರದಿ ಮಾಡಿ.", reportHeading:"ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ", feedHeading:"ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳು", submitBtn:"ಸಲ್ಲಿಸು" },
  hi: { heroTitle:"समुदाय समस्या रिपोर्टिंग", heroDesc:"अपने क्षेत्र की समस्याएँ रिपोर्ट करें।", reportHeading:"समस्या रिपोर्ट करें", feedHeading:"रिपोर्ट की गई समस्याएँ", submitBtn:"सबमिट करें" }
};

// Language switch
langBtn.onclick = () => {
  currentLang = currentLang === "en" ? "kn" : currentLang === "kn" ? "hi" : "en";
  langBtn.innerText = currentLang.toUpperCase();
  document.querySelectorAll("[data-key]").forEach(el => {
    if(translations[currentLang][el.dataset.key]) el.innerText = translations[currentLang][el.dataset.key];
  });
};

// Dark/Light toggle
modeBtn.onclick = () => {
  document.body.classList.toggle("light");
  modeBtn.innerText = document.body.classList.contains("light") ? "Dark" : "Light";
};

// Add a new issue
reportForm.addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const desc = document.getElementById("description").value.trim();
  const location = document.getElementById("location")?.value || "";
  if(!title || !desc) return;

  issues.push({ 
    title, 
    desc, 
    location, 
    up: 0, 
    down: 0, 
    status: "Open", 
    opinions: [], 
    aiSummary: "" 
  });

  const idx = issues.length - 1;
  generateSummary(idx);
  renderFeed();
  reportForm.reset();
});

// Voting function
function vote(idx, type) {
  const issue = issues[idx];
  type === 1 ? issue.up++ : issue.down++;

  if(issue.up >= UPVOTE_THRESHOLD) issue.status = "Reported";
  if(issue.down >= DOWNVOTE_THRESHOLD) issue.status = "Spam";

  // Optional: Generate PDF automatically when status becomes Reported
  if(issue.status === "Reported" && issue.up === UPVOTE_THRESHOLD) generatePDF(issue);

  renderFeed();
}

// Add opinion
function addOpinion(idx) {
  const input = document.getElementById(`opinion-${idx}`);
  const text = input.value.trim();
  if(!text) return;

  issues[idx].opinions.push(text);
  input.value = "";
  generateSummary(idx);
}

// Render the feed
function renderFeed() {
  feed.innerHTML = "";
  issues.forEach((issue, idx) => {
    const opinionsHtml = issue.opinions.length > 0
      ? `<p><strong>Opinions:</strong><br>${issue.opinions.map((o,i)=>`${i+1}. ${o}`).join("<br>")}</p>`
      : "";

    const addOpinionHtml = issue.status === "Open"
      ? `<input id="opinion-${idx}" placeholder="Add your opinion/update"><button onclick="addOpinion(${idx})">Add</button>`
      : "";

    const statusColor = issue.status === "Reported" ? "green" 
                      : issue.status === "Spam" ? "red" 
                      : "orange";

    feed.innerHTML += `
      <div class="issue">
        <h3>${issue.title}</h3>
        <p>${issue.desc}</p>
        <p><strong>Status:</strong> <span style="color:${statusColor}">${issue.status}</span></p>
        ${opinionsHtml}
        <p><strong>AI Summary:</strong><br>${issue.aiSummary || "<i>Loading summary…</i>"}</p>
        ${addOpinionHtml}
        <p>
          <button onclick="vote(${idx},1)">⬆ ${issue.up}</button>
          <button onclick="vote(${idx},-1)">⬇ ${issue.down}</button>
        </p>
      </div>
    `;
  });
}

// Generate AI summary via Gemini
async function generateSummary(idx) {
  const issue = issues[idx];
  const prompt = `Summarize the issue concisely.\nTitle: ${issue.title}\nDescription: ${issue.desc}\n` +
    (issue.opinions.length ? "Opinions:\n" + issue.opinions.map((o,i)=>`${i+1}. ${o}`).join("\n") : "");

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": ""
      },
      body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const data = await res.json();
    issue.aiSummary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary failed.";
  } catch(e) {
    issue.aiSummary = "Error generating summary.";
  }
  renderFeed();
}

// Generate PDF for a reported issue
function generatePDF(issue) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;
  const lineSpacing = 8, sectionSpacing = 12;

  doc.setFontSize(16);
  doc.text("Community Issue Report", margin, y);
  y += sectionSpacing;

  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(`Title: ${issue.title}`, maxWidth), margin, y);
  y += lineSpacing * doc.splitTextToSize(issue.title, maxWidth).length + 4;

  doc.text(doc.splitTextToSize(`Description: ${issue.desc}`, maxWidth), margin, y);
  y += lineSpacing * doc.splitTextToSize(issue.desc, maxWidth).length + sectionSpacing;

  if(issue.opinions.length) {
    doc.text("Opinions / Updates:", margin, y);
    y += lineSpacing;
    issue.opinions.forEach((op, i) => {
      doc.text(doc.splitTextToSize(`${i+1}. ${op}`, maxWidth - 4), margin + 4, y);
      y += lineSpacing * doc.splitTextToSize(op, maxWidth - 4).length;
    });
    y += sectionSpacing;
  }

  doc.text(doc.splitTextToSize(`AI Summary: ${issue.aiSummary}`, maxWidth), margin, y);

  doc.save(`${issue.title.replace(/\s+/g,"_")}_report.pdf`);
}

// Initialize feed on page load
window.onload = renderFeed;
