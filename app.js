/* ======= Configuration ======= */
const UPVOTE_THRESHOLD = 5;    // when upvotes reach this, status -> reported
const DOWNVOTE_THRESHOLD = 3;  // when downvotes reach this, status -> spam

/* ======= Utilities ======= */
function $(sel){ return document.querySelector(sel); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

/* ======= Persistence ======= */
const STORAGE_KEY = "reportify.issues.v1";
const VOTE_KEY = "reportify.votes.v1"; // tracks { issueId: vote } where vote = 1 | -1

function loadIssues(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ console.error(e); return []; }
}
function saveIssues(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function loadVotes(){
  try{
    const raw = localStorage.getItem(VOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ console.error(e); return {}; }
}
function saveVotes(obj){
  localStorage.setItem(VOTE_KEY, JSON.stringify(obj));
}

/* ======= App State ======= */
let issues = loadIssues();
let votes = loadVotes();

/* ======= DOM refs ======= */
const feed = $("#feed");
const emptyState = $("#emptyState");
const reportForm = $("#reportForm");
const titleInput = $("#title");
const descInput = $("#description");
const locationInput = $("#location");
const imageInput = $("#image");
const themeBtn = $("#themeBtn");
const modeBtn = $("#modeBtn");

/* ======= Render logic ======= */
function renderFeed(){
  if(!feed) return;
  feed.innerHTML = "";

  if(!issues || issues.length === 0){
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  issues.slice().reverse().forEach((issue) => {
    const item = document.createElement("article");
    item.className = "issue card";
    item.setAttribute("data-id", issue.id);

    // meta (votes)
    const meta = document.createElement("div");
    meta.className = "meta";

    const upBtn = document.createElement("button");
    upBtn.className = "vote-btn";
    upBtn.setAttribute("aria-label", `Upvote ${issue.title}`);
    upBtn.innerText = `⬆ ${issue.up}`;
    upBtn.addEventListener("click", ()=>handleVote(issue.id, 1, upBtn, downBtn));

    const downBtn = document.createElement("button");
    downBtn.className = "vote-btn";
    downBtn.setAttribute("aria-label", `Downvote ${issue.title}`);
    downBtn.innerText = `⬇ ${issue.down}`;
    downBtn.addEventListener("click", ()=>handleVote(issue.id, -1, upBtn, downBtn));

    meta.appendChild(upBtn);
    meta.appendChild(downBtn);

    // body
    const body = document.createElement("div");
    body.className = "issue-body";

    const title = document.createElement("strong");
    title.innerText = issue.title;

    const desc = document.createElement("p");
    desc.innerText = issue.desc;

    const small = document.createElement("div");
    small.className = "small";
    small.innerHTML = `<span>Location: ${issue.location || "—"}</span>`;

    const status = document.createElement("div");
    const badge = document.createElement("span");
    badge.className = `status-badge ${issue.status==='reported'?'status-reported':issue.status==='spam'?'status-spam':'status-open'}`;
    badge.innerText = issue.status;
    status.style.marginTop = "8px";

    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(small);

    // AI / metadata (if present)
    if(issue.aiSummary){
      const ai = document.createElement("div");
      ai.className = "small muted";
      ai.style.marginTop = "8px";
      ai.innerHTML = `<strong>AI summary:</strong> ${issue.aiSummary}`;
      body.appendChild(ai);
    }

    status.appendChild(badge);
    body.appendChild(status);

    item.appendChild(meta);
    item.appendChild(body);

    // optional image
    if(issue.imageDataUrl){
      const img = document.createElement("img");
      img.className = "issue-image";
      img.alt = issue.title;
      img.src = issue.imageDataUrl;
      item.appendChild(img);
    }

    feed.appendChild(item);
  });
}

/* ======= Voting logic =======
   - Prevent duplicate votes in the same browser (tracked in localStorage)
   - Allow changing a vote (switch from up to down or remove)
*/
function handleVote(issueId, voteValue, upBtn, downBtn){
  const issueIndex = issues.findIndex(i => i.id === issueId);
  if(issueIndex === -1) return;

  const issue = issues[issueIndex];
  const prevVote = votes[issueId] || 0;

  // remove same vote (toggle off)
  if(prevVote === voteValue){
    votes[issueId] = 0;
    if(voteValue === 1) issue.up = Math.max(0, issue.up - 1);
    else issue.down = Math.max(0, issue.down - 1);
  } else {
    // switching vote
    if(prevVote === 1) issue.up = Math.max(0, issue.up - 1);
    if(prevVote === -1) issue.down = Math.max(0, issue.down - 1);

    votes[issueId] = voteValue;
    if(voteValue === 1) issue.up++;
    else issue.down++;
  }

  // update status thresholds
  if(issue.up >= UPVOTE_THRESHOLD) issue.status = "reported";
  else if(issue.down >= DOWNVOTE_THRESHOLD) issue.status = "spam";
  else issue.status = "open";

  saveVotes(votes);
  saveIssues(issues);
  renderFeed();
}

/* ======= Add issue ======= */
async function readImageAsDataUrl(file){
  return new Promise((resolve) => {
    if(!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

reportForm && reportForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const title = titleInput.value.trim();
  const desc = descInput.value.trim();
  const location = locationInput.value.trim();

  if(!title || !desc){
    alert("Please provide both title and description.");
    return;
  }

  // get image as Data URL (for demo only; size may be large)
  const file = imageInput.files && imageInput.files[0];
  const dataUrl = await readImageAsDataUrl(file);

  const newIssue = {
    id: uid(),
    title,
    desc,
    location,
    imageDataUrl: dataUrl || null,
    up: 0, down: 0,
    status: "open",
    createdAt: new Date().toISOString()
  };

  issues.push(newIssue);
  saveIssues(issues);
  renderFeed();

  reportForm.reset();
  // scroll to feed so user sees added item
  const feedCard = document.getElementById("feedCard");
  if(feedCard) feedCard.scrollIntoView({behavior:"smooth"});
});

/* Clear button to reset form */
$("#clearBtn") && $("#clearBtn").addEventListener("click", () => reportForm.reset());

/* Theme toggle */
themeBtn && themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "theme1";
  const next = current === "theme1" ? "theme2" : "theme1";
  document.documentElement.setAttribute("data-theme", next);
});

modeBtn && modeBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  modeBtn.innerText = document.documentElement.classList.contains("light") ? "Light" : "Dark";
});

/* On load */
window.addEventListener("DOMContentLoaded", () => {
  // ensure votes and issues are present (load functions above handle parsing)
  issues = loadIssues();
  votes = loadVotes();
  renderFeed();
});




