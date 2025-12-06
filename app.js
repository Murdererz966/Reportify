const langBtn = document.getElementById("langBtn");
const themeBtn = document.getElementById("themeBtn");
const form = document.getElementById("reportForm");
const feed = document.getElementById("feed");

let currentLang = "en";
let issues = [];

const translations = {
  en: {heroTitle:"Community Issue Reporting", heroDesc:"Report problems in your area and let the community prioritize important issues.", reportHeading:"Report an Issue", feedHeading:"Reported Issues", submitBtn:"Submit"},
  kn: {heroTitle:"ಸಮುದಾಯ ಸಮಸ್ಯೆ ವರದಿ", heroDesc:"ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಗಳ ವರದಿ ಮಾಡಿ.", reportHeading:"ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ", feedHeading:"ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳು", submitBtn:"ಸಲ್ಲಿಸು"},
  hi: {heroTitle:"समुदाय समस्या रिपोर्टिंग", heroDesc:"अपने क्षेत्र की समस्याएँ रिपोर्ट करें।", reportHeading:"समस्या रिपोर्ट करें", feedHeading:"रिपोर्ट की गई समस्याएँ", submitBtn:"सबमिट करें"}
};

function switchLang() {
  currentLang = currentLang==="en"?"kn":currentLang==="kn"?"hi":"en";
  langBtn.innerText = currentLang.toUpperCase();
  document.querySelectorAll("[data-key]").forEach(el=>{
    if(translations[currentLang][el.dataset.key]) el.innerText = translations[currentLang][el.dataset.key];
  });
}

langBtn.addEventListener("click", switchLang);
themeBtn.addEventListener("click", ()=>document.body.classList.toggle("light"));

function renderFeed() {
  feed.innerHTML = "";
  issues.forEach((issue, idx) => {
    const div = document.createElement("div");
    div.className = "issue";
    div.innerHTML = `
      <strong>${issue.title}</strong>
      <p>${issue.desc}</p>
      <p><em>Report Summary:</em> ${issue.aiSummary || "Generating..."}</p>
      <p>
        <span class="vote-btn" onclick="vote(${idx},1)">⬆ ${issue.up}</span>
        <span class="vote-btn" onclick="vote(${idx},-1)">⬇ ${issue.down}</span>
        Status: ${issue.status}
      </p>
    `;
    feed.appendChild(div);
  });
}

const UPVOTE_THRESHOLD=5, DOWNVOTE_THRESHOLD=3;
function vote(idx, type){
  if(type===1) issues[idx].up++; else issues[idx].down++;
  if(issues[idx].up>=UPVOTE_THRESHOLD) issues[idx].status="reported";
  if(issues[idx].down>=DOWNVOTE_THRESHOLD) issues[idx].status="spam";
  renderFeed();
}

// Gemini API call
async function generateAIReport(issue, index) {
  try {
    const response = await fetch("https://api.gemini.ai/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "AIzaSyBPCymvLoSDNX5qD8RBqSHs7ow2PtbOkck"
      },
      body: JSON.stringify({
        prompt: `Write a concise, easy-to-read summary of this community issue:\nTitle: ${issue.title}\nDescription: ${issue.desc}`,
        max_tokens: 100
      })
    });

    const data = await response.json();
    if(data.choices && data.choices[0].text) {
      issues[index].aiSummary = data.choices[0].text.trim();
      renderFeed();
    }
  } catch(err){
    console.error("AI API error:", err);
    issues[index].aiSummary = "Failed to generate summary.";
    renderFeed();
  }
}

// Submit form
form.addEventListener("submit", e=>{
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const desc = document.getElementById("description").value.trim();
  if(title && desc){
    const newIssue = {title, desc, up:0, down:0, status:"open", aiSummary:"Generating..."};
    issues.push(newIssue);
    const index = issues.length - 1;
    renderFeed();
    generateAIReport(newIssue, index); // Call Gemini
    form.reset();
  }
});

window.onload = renderFeed;




