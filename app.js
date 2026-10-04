let currentPage="dashboard", practiceList=[...QUESTIONS], mockQuestions=[], mockIndex=0, answers=[], timerId=null, secondsLeft=1800;
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

function showPage(id){
  currentPage=id; $$(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  $$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
  if(id==="dashboard") renderDashboard(); if(id==="analysis") renderAnalysis();
  if(id==="practice") renderPractice(); if(id==="review") renderReview();
}
$$(".nav").forEach(n=>n.onclick=()=>showPage(n.dataset.page));
$$("[data-go]").forEach(b=>b.onclick=()=>showPage(b.dataset.go));
$("#themeBtn").onclick=()=>document.body.classList.toggle("dark");

function subjectCounts(){
  const m={}; QUESTIONS.forEach(q=>m[q.s]=(m[q.s]||0)+1); return m;
}
function renderDashboard(){
  const counts=subjectCounts(), total=QUESTIONS.length;
  const pyq=QUESTIONS.filter(q=>q.src.includes("PYQ")).length;
  $("#dashStats").innerHTML=[
    ["Question bank",total],["PYQ-derived",pyq],["Practice",total-pyq],["Priority subjects",Object.keys(counts).length]
  ].map(x=>`<div class="stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
  const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  $("#priorityBars").innerHTML=ranked.map(([s,n])=>`<div class="barrow"><div class="line"><span>${s}</span><b>${n}</b></div><div class="bar"><i style="width:${Math.max(15,n/Math.max(...ranked.map(x=>x[1]))*100)}%"></i></div></div>`).join("");
}
function renderAnalysis(){
  const counts=subjectCounts(), max=Math.max(...Object.values(counts));
  $("#subjectAnalysis").innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`<div class="barrow"><div class="line"><span>${s}</span><b>${n}</b></div><div class="bar"><i style="width:${n/max*100}%"></i></div></div>`).join("");
  const topics=["Uttarakhand history & culture","Uttarakhand geography / wildlife","Hindi grammar & vocabulary","Reasoning: coding/series/direction","Basic arithmetic & clock","Indian history & polity","Computer fundamentals","Science & everyday awareness"];
  $("#topicList").innerHTML=topics.map((x,i)=>`<div class="topic"><b>${i<4?"High":"Medium"} priority • ${x}</b><span>Build short notes + timed MCQ practice</span></div>`).join("");
}
function initFilters(){
  const subs=[...new Set(QUESTIONS.map(q=>q.s))].sort();
  subs.forEach(s=>$("#subjectFilter").insertAdjacentHTML("beforeend",`<option>${s}</option>`));
  $("#subjectFilter").onchange=renderPractice; $("#sourceFilter").onchange=renderPractice;
  $("#shuffleBtn").onclick=()=>{practiceList.sort(()=>Math.random()-.5);renderPractice()};
}
function renderPractice(){
  const s=$("#subjectFilter").value, src=$("#sourceFilter").value;
  let arr=practiceList.filter(q=>(s==="All Subjects"||q.s===s)&&(src==="All Sources"||(src==="PYQ"?q.src.includes("PYQ"):q.src==="Practice")));
  $("#practiceArea").innerHTML=arr.map(q=>practiceCard(q)).join("");
}
function practiceCard(q){
 return `<article class="practice-card"><div class="qmeta"><span>${q.s}</span><span>${q.src}</span></div><div class="qtext">${q.id}. ${q.q}</div><div class="options">${q.o.map((x,i)=>`<button class="option" data-q="${q.id}" data-a="${i}">${String.fromCharCode(65+i)}. ${x}</button>`).join("")}</div><div class="explain hidden" id="exp-${q.id}">Correct answer: <b>${q.o[q.a]}</b></div></article>`;
}
document.addEventListener("click",e=>{
 const b=e.target.closest(".option"); if(!b||!$("#practiceArea").contains(b)) return;
 const q=QUESTIONS.find(x=>x.id==b.dataset.q); const all=$$(`.option[data-q="${q.id}"]`);
 all.forEach(x=>x.disabled=true); b.classList.add(+b.dataset.a===q.a?"correct":"wrong");
 if(+b.dataset.a!==q.a) [...all].find(x=>+x.dataset.a===q.a)?.classList.add("correct");
 $("#exp-"+q.id).classList.remove("hidden");
});

$("#startMock").onclick=()=>{
 const n=+$("#mockCount").value;
 mockQuestions=[...QUESTIONS].sort(()=>Math.random()-.5).slice(0,n);
 mockIndex=0; answers=Array(n).fill(null); secondsLeft=1800;
 $("#mockStart").classList.add("hidden");$("#mockResult").classList.add("hidden");$("#mockTest").classList.remove("hidden");
 clearInterval(timerId); timerId=setInterval(()=>{secondsLeft--;renderTimer();if(secondsLeft<=0){clearInterval(timerId);finishMock()}},1000); renderMock();
};
function renderTimer(){let m=String(Math.floor(secondsLeft/60)).padStart(2,"0"),s=String(secondsLeft%60).padStart(2,"0");$("#timer").textContent=`${m}:${s}`;}
function renderMock(){
 const q=mockQuestions[mockIndex]; $("#qProgress").textContent=`Question ${mockIndex+1}/${mockQuestions.length}`;$("#qSubject").textContent=q.s;
 $("#mockQuestion").innerHTML=`<div class="qmeta"><span>${q.src}</span><span>+1 / −0.25</span></div><h2>${q.q}</h2>`;
 $("#mockOptions").innerHTML=q.o.map((x,i)=>`<button class="option ${answers[mockIndex]===i?"selected":""}" data-mi="${i}">${String.fromCharCode(65+i)}. ${x}</button>`).join("");
}
$("#mockOptions").onclick=e=>{let b=e.target.closest(".option");if(!b)return;answers[mockIndex]=+b.dataset.mi;renderMock()};
$("#prevQ").onclick=()=>{if(mockIndex>0){mockIndex--;renderMock()}};
$("#nextQ").onclick=()=>{if(mockIndex<mockQuestions.length-1){mockIndex++;renderMock()}};
$("#submitMock").onclick=()=>{if(confirm("Submit this mock test?"))finishMock()};
function finishMock(){
 clearInterval(timerId);let correct=0,wrong=0,un=0;
 mockQuestions.forEach((q,i)=>answers[i]===null?un++:answers[i]===q.a?correct++:wrong++);
 const score=correct-wrong*.25, pct=Math.max(0,score/mockQuestions.length*100);
 const by={};mockQuestions.forEach((q,i)=>{by[q.s]??={c:0,t:0};by[q.s].t++;if(answers[i]===q.a)by[q.s].c++});
 localStorage.setItem("lastMock",JSON.stringify({score,correct,wrong,un,by,mockQuestions,answers}));
 $("#mockTest").classList.add("hidden");$("#mockResult").classList.remove("hidden");
 $("#mockResult").innerHTML=`<div class="card result-score"><span class="eyebrow">TEST COMPLETE</span><div class="score">${score.toFixed(2)}</div><p>${correct} correct • ${wrong} wrong • ${un} unanswered</p><p>Accuracy: ${mockQuestions.length?((correct/mockQuestions.length)*100).toFixed(1):0}%</p><button class="primary" onclick="showPage('review')">Review Weak Areas</button> <button class="secondary" onclick="showPage('mock');location.reload()">New Mock</button></div>`;
}
function renderReview(){
 const raw=localStorage.getItem("lastMock");
 if(!raw){$("#reviewArea").innerHTML=`<div class="card"><h2>No mock result yet</h2><p>Take a mock test first. Your subject-wise performance will appear here.</p></div>`;return}
 const r=JSON.parse(raw);
 const rows=Object.entries(r.by).sort((a,b)=>(a[1].c/a[1].t)-(b[1].c/b[1].t));
 $("#reviewArea").innerHTML=`<div class="stats"><div class="stat"><b>${r.score.toFixed(2)}</b><span>Last score</span></div><div class="stat"><b>${r.correct}</b><span>Correct</span></div><div class="stat"><b>${r.wrong}</b><span>Wrong</span></div><div class="stat"><b>${r.un}</b><span>Unanswered</span></div></div>
 <div class="card"><h2>Subject performance</h2>${rows.map(([s,v])=>{let p=v.c/v.t*100;return `<div class="barrow"><div class="line"><span>${s}</span><b>${v.c}/${v.t} (${p.toFixed(0)}%)</b></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join("")}</div>
 <div class="card"><h2>Recommended next step</h2><p>${rows[0]?"Focus first on <b>"+rows[0][0]+"</b>, then retake a mixed mock. Keep an error notebook for repeated mistakes.":"Take a mock test to generate your weak-area report."}</p></div>`;
}
renderDashboard();initFilters();renderPractice();renderAnalysis();renderReview();
