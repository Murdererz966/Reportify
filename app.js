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
  currentLang = currentLang==="en"?"kn":currentLang==="kn"?"hi":"en";
  langBtn.innerText = currentLang.toUpperCase();
  document.querySelectorAll("[data-key]").forEach(el=>{
    if(translations[currentLang][el.dataset.key]) el.innerText = translations[currentLang][el.dataset.key];
  });
};

// Dark/Light toggle
modeBtn.onclick = () => {
  document.body.classList.toggle("light");
  modeBtn.innerText = document.body.classList.contains("light") ? "Dark" : "Light";
};

// Voting & status
function vote(idx,type){
  const issue = issues[idx];
  if(type===1) issue.up++; else issue.down++;
  const prev = issue.status;
  if(issue.up>=UPVOTE_THRESHOLD) issue.status="reported";
  if(issue.down>=DOWNVOTE_THRESHOLD) issue.status="spam";
  if(issue.status==="reported" && prev!=="reported") generatePDF(issue);
  renderFeed();
}

// Add opinion
function addOpinion(idx){
  const inp = document.getElementById(`opinion-${idx}`);
  const txt = inp.value.trim();
  if(!txt) return;
  issues[idx].opinions.push(txt);
  inp.value="";
  generateSummary(idx);
}

// Render feed
function renderFeed(){
  feed.innerHTML="";
  issues.forEach((issue,idx)=>{
    const opinionsHtml = issue.opinions.length>0 ? `<p><strong>Opinions:</strong><br>${issue.opinions.map(o=>"- "+o).join("<br>")}</p>`:"";
    const addOpinionHtml = issue.status==="open" ? `<input id="opinion-${idx}" placeholder="Add your opinion/update"><button onclick="addOpinion(${idx})">Add</button>`:"";
    feed.innerHTML+=`
      <div class="issue">
        <h3>${issue.title}</h3>
        <p>${issue.desc}</p>
        <p><strong>Status:</strong> ${issue.status}</p>
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
async function generateSummary(idx){
  const issue = issues[idx];
  const prompt = `Summarize the issue concisely. Title: ${issue.title}\nDescription: ${issue.desc}\n${issue.opinions.length>0?"Opinions:\n"+issue.opinions.map((o,i)=>`${i+1}. ${o}`).join("\n"):""}`;
  try{
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":"AIzaSyAOc29Bl3w9Atkj_jrit5Hu56nXgCvy4XM"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const data = await res.json();
    issue.aiSummary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary failed.";
  }catch(e){ issue.aiSummary="Error generating summary."; }
  renderFeed();
}

// PDF generation
function generatePDF(issue){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const maxWidth = pageWidth - margin*2;
  let y=20;
  const lineSpacing=8, sectionSpacing=12;

  doc.setFontSize(16);
  doc.text("Community Issue Report", margin, y);
  y+=sectionSpacing;

  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(`Title: ${issue.title}`, maxWidth);
  doc.text(titleLines, margin, y);
  y+=titleLines.length*lineSpacing+4;

  const descLines = doc.splitTextToSize(`Description: ${issue.desc}`, maxWidth);
  doc.text(descLines, margin, y);
  y+=descLines.length*lineSpacing+sectionSpacing;

  if(issue.opinions.length>0){
    doc.text("Opinions / Updates:", margin, y); y+=lineSpacing;
    issue.opinions.forEach((op,i)=>{
      const opLines = doc.splitTextToSize(`${i+1}. ${op}`, maxWidth-4);
      doc.text(opLines, margin+4, y);
      y+=opLines.length*lineSpacing;
    });
    y+=sectionSpacing;
  }

  const summaryLines = doc.splitTextToSize(`AI Summary: ${issue.aiSummary}`, maxWidth);
  doc.text(summaryLines, margin, y);

  doc.save(`${issue.title.replace(/\s+/g,"_")}_report.pdf`);
}

// Form submit
reportForm.addEventListener("submit", e=>{
  e.preventDefault();
  const title=document.getElementById("title").value.trim();
  const desc=document.getElementById("description").value.trim();
  if(!title||!desc) return;

  issues.push({ title, desc, location:document.getElementById("location")?.value||"", up:0, down:0, status:"open", opinions:[], aiSummary:"" });
  const idx = issues.length-1;
  generateSummary(idx);
  renderFeed();
  reportForm.reset();
});

window.onload=renderFeed;
