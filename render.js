/* Job tracker renderer. Loaded live from GitHub by index.html, so UI changes need no Netlify deploy. */
(function(){
const css=`
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
.card{background:var(--card);border-radius:14px;padding:16px}.n{font-size:2.2rem;font-weight:700}.l{color:var(--mu);font-size:.85rem}
.n small{font-size:1rem;color:var(--mu);font-weight:500}
h2{font-size:1.1rem;margin:28px 0 10px}h3{font-size:.95rem;margin:16px 0 8px;color:var(--mu);text-transform:uppercase;letter-spacing:.05em}svg text{fill:var(--mu);font-size:11px}
table{width:100%;border-collapse:collapse;font-size:.9rem}td,th{padding:8px;border-bottom:1px solid #334155;text-align:left}
th{color:var(--mu);font-weight:500}.tag{font-size:.75rem;padding:2px 8px;border-radius:9px;background:#334155}
ul{padding:0;list-style:none;margin:0}li.p{background:var(--card);border-left:4px solid var(--g);border-radius:8px;padding:12px;margin-bottom:8px}
li.rem{border-left-color:#fbbf24;background:#2a2a1e;box-shadow:0 0 0 1px #fbbf2455}
li.rem.soon{border-left-color:var(--r);box-shadow:0 0 0 1px #f8717188}
li.exp{border-left-color:#64748b;opacity:.85}
li.done{border-left-color:#475569;opacity:.55}li.done b::before{content:"✔ ";color:var(--g)}
.act{margin-top:4px}.due{display:inline-block;margin-top:6px;font-size:.8rem;padding:2px 8px;border-radius:9px;background:#fbbf2433;color:#fde68a}
li.soon .due{background:#f8717133;color:#fecaca}.st{float:right;font-size:.75rem;padding:2px 8px;border-radius:9px;background:#334155;color:var(--mu)}
.lg span{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 12px}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
document.querySelector('main').innerHTML=`<h1>Hammad Rehman · Job Search Tracker</h1><div class="mu" id="upd">Loading…</div>
<div class="grid" id="cards"></div>
<h2>Positive responses</h2><div id="pos"></div>
<h2>Applications by day</h2><div class="card"><div class="mu lg"><span style="background:var(--a)"></span>Portal<span style="background:var(--b)"></span>Direct email<span style="background:var(--g)"></span>LinkedIn</div><div id="chart"></div></div>
<h2>Applications</h2><label for="channel">Channel: </label><select id="channel"><option value="all">All</option><option value="portal">Portal</option><option value="email">Email</option><option value="linkedin">LinkedIn</option></select><div class="card" style="overflow-x:auto"><table><thead><tr><th>Company</th><th>Role</th><th>Date</th><th>Via</th><th>Link</th><th>Status</th></tr></thead><tbody id="rows"></tbody></table></div>`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uk=iso=>new Date(iso).toLocaleString('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'})+' UK time';
const ukd=iso=>new Date(iso).toLocaleString('en-GB',{timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' UK';
const dl=d=>d==='earlier'?'Earlier':new Date(d+'T12:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const RAW='https://raw.githubusercontent.com/HammadRehmanAwan/job-tracker-data/main/data.json';
const API='https://api.github.com/repos/HammadRehmanAwan/job-tracker-data/contents/data.json';
const load=()=>fetch(API+'?t='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github.raw'}}).then(r=>{if(!r.ok)throw r.status;return r.json()}).catch(()=>fetch(RAW+'?t='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json()}).catch(()=>fetch('stats.json',{cache:'no-store'}).then(r=>r.json()))).then(draw).catch(e=>document.getElementById('upd').textContent='Could not load stats: '+e);
function left(iso){const ms=new Date(iso)-Date.now();if(ms<0)return 'date passed';const h=Math.round(ms/36e5);return h<48?h+'h left':Math.round(h/24)+' days left';}
function posHTML(list){
 const now=Date.now(),t=p=>p.due?new Date(p.due).getTime():Infinity;
 const ps=list.map(p=>Object.assign({},p,{status:p.status||'remaining'}));
 const rem=ps.filter(p=>p.status==='remaining').sort((a,b)=>t(a)-t(b));
 const exp=ps.filter(p=>p.status==='expired'||p.status==='declined').sort((a,b)=>t(b)-t(a));
 const done=ps.filter(p=>p.status==='done').sort((a,b)=>String(b.done_on).localeCompare(String(a.done_on)));
 const item=(p,cls)=>{const overdue=p.status==='remaining'&&p.due&&t(p)<now,soon=p.status==='remaining'&&p.due&&t(p)-now<48*36e5;
  return `<li class="p ${cls}${soon?' soon':''}">${p.status!=='remaining'?`<span class="st">${p.status==='expired'?'Date passed – not confirmed':esc(p.status)}</span>`:''}<b>${esc(p.company)}</b>
  ${p.action?`<div class="act">${esc(p.action)}</div>`:''}<div class="mu">${esc(p.note)}</div>
  ${p.status==='remaining'?(p.due?`<span class="due">${overdue?'Overdue? ':'Due '}${ukd(p.due)} · ${left(p.due)}</span>`:'<span class="due">No deadline given</span>'):''}
  ${p.status==='done'&&p.done_on?`<div class="mu">Done ${dl(p.done_on)}</div>`:''}</li>`};
 let h=`<h3>Remaining (${rem.length})</h3><ul>${rem.map(p=>item(p,'rem')).join('')||'<li class="p">Nothing to do right now</li>'}</ul>`;
 if(exp.length)h+=`<h3>Date passed – check (${exp.length})</h3><ul>${exp.map(p=>item(p,'exp')).join('')}</ul>`;
 h+=`<h3>Done (${done.length})</h3><ul>${done.map(p=>item(p,'done')).join('')||'<li class="p">None yet</li>'}</ul>`;
 return h;
}
function draw(s){
 document.getElementById('upd').textContent='Last updated '+uk(s.updated_at||s.updated);
 const P=s.positives||[],nd=s.positives_done??P.filter(p=>p.status==='done').length,nr=s.positives_remaining??P.filter(p=>(p.status||'remaining')==='remaining').length;
 document.getElementById('cards').innerHTML=[['Total applications',s.total],['Portal applications',s.portal],['Direct emails',s.email],['LinkedIn applications',s.linkedin],['Confirmations',s.confirmations],['Rejections',s.rejections],['Positive responses',s.positive_count],['Positives: done / remaining',`${nd} / ${nr}`]]
  .map(([l,n])=>`<div class="card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
 const d=s.by_day,W=Math.max(320,d.length*70),H=220,Pd=28,max=Math.max(1,...d.map(x=>x.portal+x.email+(x.linkedin||0))),bw=(W-Pd*2)/d.length;
 let g='';d.forEach((x,i)=>{const X=Pd+i*bw+bw*.15,w=bw*.7,hp=x.portal/max*(H-60),he=x.email/max*(H-60),hl=(x.linkedin||0)/max*(H-60),y=H-30;
  g+=`<rect x="${X}" y="${y-hp}" width="${w}" height="${hp}" fill="#38bdf8" rx="3"/><rect x="${X}" y="${y-hp-he}" width="${w}" height="${he}" fill="#a78bfa" rx="3"/>
  <rect x="${X}" y="${y-hp-he-hl}" width="${w}" height="${hl}" fill="#4ade80" rx="3"/><text x="${X+w/2}" y="${y-hp-he-hl-6}" text-anchor="middle">${x.portal+x.email+(x.linkedin||0)}</text><text x="${X+w/2}" y="${H-12}" text-anchor="middle">${dl(x.date)}</text>`});
 document.getElementById('chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Applications by day">${g}</svg>`;
 document.getElementById('pos').innerHTML=posHTML(P);
 const labels={portal:'Portal',email:'Email',linkedin:'LinkedIn'};
 const sel=document.getElementById('channel');
 const render=()=>{const channel=sel.value;
 document.getElementById('rows').innerHTML=(s.applications||s.recent).filter(a=>channel==='all'||a.type===channel).map(a=>`<tr><td>${esc(a.company)}</td><td>${esc(a.role)}</td><td>${dl(a.date)}</td><td><span class="tag">${labels[a.type]||esc(a.type)}</span></td><td>${/^https?:\/\//i.test(a.link||'')?`<a style="color:var(--a)" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Job</a>`:'—'}</td><td>${esc(a.status)}</td></tr>`).join('')||'<tr><td colspan="6">No applications yet</td></tr>';};
 sel.onchange=render;render();
}
window.__trackerRender=true;
load();if(window.__trackerTimer)clearInterval(window.__trackerTimer);window.__trackerTimer=setInterval(load,300000);
})();
