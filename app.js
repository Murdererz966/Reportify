// Theme / Mode
function toggleMode(){document.documentElement.classList.toggle("light");}
function setTheme(name){document.documentElement.setAttribute("data-theme", name);}

// Demo Issues
let issues=[]; // store issues locally

// Feed container
const feed=document.getElementById("feed");

// Render feed
function renderFeed(){
    if(!feed) return;
    feed.innerHTML="";
    issues.forEach((issue,idx)=>{
        const div=document.createElement("div");
        div.className="issue";
        div.innerHTML=`
            <div class="vote-box">
                <button class="vote-btn" onclick="vote(${idx},1)">⬆ ${issue.up}</button>
                <button class="vote-btn" onclick="vote(${idx},-1)">⬇ ${issue.down}</button>
            </div>
            <div class="issue-body">
                <strong>${issue.title}</strong>
                <p>${issue.desc}</p>
                <small>Status: </small>
                <span class="status-badge ${issue.status==='reported'?'status-reported':issue.status==='spam'?'status-spam':'status-open'}">${issue.status}</span>
            </div>
        `;
        feed.appendChild(div);
    });
}

// Vote logic
const UPVOTE_THRESHOLD=5;
const DOWNVOTE_THRESHOLD=3;
function vote(idx,type){
    if(type===1) issues[idx].up++;
    else issues[idx].down++;
    if(issues[idx].up>=UPVOTE_THRESHOLD) issues[idx].status="reported";
    if(issues[idx].down>=DOWNVOTE_THRESHOLD) issues[idx].status="spam";
    renderFeed();
}

// Form submission
const form=document.getElementById("reportForm");
if(form){
    form.addEventListener("submit",e=>{
        e.preventDefault();
        const title=document.getElementById("title").value.trim();
        const desc=document.getElementById("description").value.trim();
        if(title && desc){
            issues.push({title,desc,up:0,down:0,status:"open"});
            form.reset();
            renderFeed();
            alert("Issue submitted!");
        }
    });
}

// Initial render
window.onload=renderFeed;



