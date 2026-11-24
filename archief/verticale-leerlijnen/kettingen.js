/* Kettingweergave voor de verticale leerlijnen (ICT, computationeel denken, mediawijsheid).
   Data: kettingen-data.js. De pagina bepaalt met KETTING_PAGINA (ids) welke kettingen ze toont. */

const KETTING_PAGINAS = {"DIG 1":"verticale-leerlijn.html", "DIG 3":"verticale-leerlijn-media.html"};
/* Leerjaar → leeftijd zoals in LeerLokaal (de fase staat in LEERJAREN) */
const KETTING_LEEFTIJD = {K1:"2,5–3 jaar", K2:"4 jaar", K3:"5 jaar", L1:"6 jaar", L2:"7 jaar", L3:"8 jaar", L4:"9 jaar", L5:"10 jaar", L6:"11 jaar"};
let kettingKeuze = null; // null = alle kettingen van deze pagina

const kettingById = id => KETTINGEN.find(k=>k.id===id);
const kettingDoelen = id => KETTING_DOELEN.filter(d=>d.kettingen.includes(id)); // staan al van jong naar oud
const kettingNaam = k => `${k.leerlijn} · ketting ${k.nr}`;

/* ── Opmaak ── */
(function(){
  const st = document.createElement('style');
  st.textContent = `
  .view-toggle{display:flex;gap:4px;background:#f1f5f9;border-radius:10px;padding:3px}
  .view-btn{border:none;background:transparent;border-radius:8px;padding:6px 13px;font-family:inherit;font-size:.82rem;font-weight:700;cursor:pointer;color:#64748b;transition:.15s;display:flex;align-items:center;gap:5px}
  .view-btn.on{background:#fff;color:var(--accent);box-shadow:0 1px 4px rgba(0,0,0,.12)}
  .kt-keuze{display:flex;flex-wrap:wrap;gap:8px;padding:16px 26px 0}
  .kt-keuze button{border:2px solid var(--border);background:#fff;border-radius:999px;padding:6px 13px;font-family:inherit;font-size:.8rem;font-weight:700;color:#334155;cursor:pointer;transition:.15s;text-align:left}
  .kt-keuze button:hover{border-color:var(--kt,#0f1f30)}
  .kt-keuze button.on{background:var(--kt,#0f1f30);border-color:var(--kt,#0f1f30);color:#fff}
  .kt-nota{margin:14px 26px 0;padding:11px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:.84rem;color:#7c2d12}
  .kt-scroll{overflow-x:auto;padding:16px 26px 60px}
  .kt-grid{display:grid;column-gap:14px}
  .kt-head{background:var(--kt);color:#fff;border:none;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:.86rem;font-weight:700;line-height:1.25;text-align:left;cursor:pointer;margin-bottom:6px}
  .kt-head small{display:block;font-size:.7rem;font-weight:600;opacity:.9;margin-top:3px}
  .kt-grid .yr-cell{border-radius:0;border-top:1px solid #e8edf3}
  .kt-grid .yr-cell .lft{font-size:.7rem;color:#64748b}
  .kt-cell{position:relative;padding:7px 0 7px 30px;min-height:58px;display:flex;flex-direction:column;justify-content:center;gap:8px;border-top:1px solid #e8edf3}
  .kt-cell.lijn::before{content:"";position:absolute;left:9px;top:-1px;bottom:0;width:4px;background:var(--kt);opacity:.4}
  .kt-cell.top::before{top:24px}
  .kt-cell.onder::before{bottom:24px}
  .kt-doel{position:relative;background:#fff;border:1.5px solid var(--border);border-left:5px solid var(--kt);border-radius:9px;padding:7px 10px;font-family:inherit;font-size:.8rem;line-height:1.32;color:#1e293b;text-align:left;cursor:pointer;transition:.15s}
  .kt-doel:hover,.kt-doel:focus-visible{border-color:var(--kt);box-shadow:0 3px 10px rgba(15,31,48,.14)}
  .kt-doel::before{content:attr(data-nr);position:absolute;left:-35px;top:calc(50% - 11px);width:22px;height:22px;border-radius:50%;background:var(--kt);color:#fff;font-size:.68rem;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px var(--bg)}
  .kt-doel .kt-code{display:block;font-family:'Space Grotesk',sans-serif;font-size:.7rem;font-weight:700;color:var(--kt)}
  .kt-doel .kt-ook{display:inline-block;margin-top:4px;font-size:.68rem;font-weight:700;color:#475569;background:#f1f5f9;border-radius:6px;padding:1px 6px}
  .kt-doel .kt-extra{display:block;margin-top:5px;font-size:.78rem;color:#475569;white-space:pre-line}
  .kt-badge{border:none;border-radius:6px;background:rgba(255,255,255,.9);color:#0f1f30;font-family:inherit;font-size:.64rem;font-weight:700;padding:2px 6px;margin:4px 4px 0 0;cursor:pointer}
  .kt-badge:hover{background:#fff}
  .modal.kt{max-width:600px;max-height:88vh;overflow-y:auto}
  .modal.kt h3{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-top:15px}
  .modal.kt li,.modal.kt .kt-p{font-size:.87rem;color:#334155;white-space:pre-line}
  .modal.kt ul{padding-left:18px;margin-top:3px}
  .kt-nav{display:flex;justify-content:space-between;gap:8px;margin-top:16px;flex-wrap:wrap}
  .kt-nav .btn{background:#f1f5f9;color:#334155}
  .kt-nav .btn:disabled{opacity:.4;cursor:default}
  @media(max-width:700px){.kt-keuze{padding:14px 16px 0}.kt-nota{margin:12px 16px 0}.kt-scroll{padding:14px 16px 50px}}`;
  document.head.appendChild(st);
})();

/* ── Badge op een doelblok in de doelenweergave ── */
function kettingBadges(code){
  const d = KETTING_DOELEN.find(x=>x.code===code);
  return (d ? d.kettingen : []).map(kettingById).map(k=>
    `<button class="kt-badge" onclick="openKetting('${k.id}')" title="${esc(kettingNaam(k)+': '+k.label)}">🔗 ${k.leerlijn==='DIG 1'?'ICT':'Media'} ${k.nr}</button>`).join('');
}

function openKetting(id){
  if(!KETTING_PAGINA.includes(id)){
    location.href = KETTING_PAGINAS[kettingById(id).leerlijn] + '#ketting=' + id;
    return;
  }
  kettingKeuze = id;
  closeOverlay();
  switchView('ketting');
  window.scrollTo({top:0});
}
function kiesKetting(id){ kettingKeuze = id; renderKettingen(); }

/* ── Aan/uit: wordt door switchView van de pagina opgeroepen ── */
function toonKettingen(aan){
  document.getElementById('wrapKetting').classList.toggle('hidden', !aan);
  document.getElementById('legendKetting').classList.toggle('hidden', !aan);
  document.getElementById('viewKetting').classList.toggle('on', aan);
  if(aan) renderKettingen();
}

function renderKettingen(){
  const eigen = KETTING_PAGINA.map(kettingById);
  const zicht = kettingKeuze ? [kettingById(kettingKeuze)] : eigen;
  const detail = zicht.length===1;

  let html = window.KETTING_NOTA ? `<div class="kt-nota">${window.KETTING_NOTA}</div>` : '';
  if(eigen.length>1){
    html += `<div class="kt-keuze"><button class="${kettingKeuze?'':'on'}" onclick="kiesKetting(null)">Alle kettingen</button>` +
      eigen.map(k=>`<button style="--kt:${k.kleur}" class="${kettingKeuze===k.id?'on':''}" onclick="kiesKetting('${k.id}')">${k.icoon} ${k.nr} · ${esc(k.label)}</button>`).join('') + `</div>`;
  }

  const rijen = LEERJAREN.filter(l=>
    (filterYears.size===0 || filterYears.has(l.id)) &&
    (filterFases.size===0 || filterFases.has(l.fase))).reverse();

  html += `<div class="kt-scroll"><div class="kt-grid" style="grid-template-columns:120px repeat(${zicht.length},${detail?'minmax(220px,760px)':'minmax(190px,1fr)'})"><div></div>`;
  html += zicht.map(k=>{
    const n = kettingDoelen(k.id).length;
    const tip = eigen.length<2 ? '' : detail ? ' · toon alle kettingen' : ' · klik om te openen';
    return `<button class="kt-head" style="--kt:${k.kleur}" onclick="kiesKetting(${detail?'null':`'${k.id}'`})">${k.icoon} ${esc(k.label)}<small>${esc(kettingNaam(k))} · ${n} doelen${tip}</small></button>`;
  }).join('');

  rijen.forEach(l=>{
    const f = FASES[l.fase];
    html += `<div class="yr-cell"><span class="yr">${l.label}</span><span class="lft">${KETTING_LEEFTIJD[l.id]}</span><span class="fase" style="background:${f.kleur};color:${f.tekst}">${f.label}</span></div>`;
    zicht.forEach(k=>{
      const alle = kettingDoelen(k.id);
      const idx = ljIndex(l.id);
      const min = Math.min(...alle.map(d=>ljIndex(d.lj))), max = Math.max(...alle.map(d=>ljIndex(d.lj)));
      const hier = alle.filter(d=>d.lj===l.id);
      const cls = idx>=min && idx<=max ? ` lijn${idx===max?' top':''}${idx===min?' onder':''}` : '';
      // van onder naar boven, dus het jongste doel staat onderaan in de cel
      html += `<div class="kt-cell${cls}" style="--kt:${k.kleur}">` + [...hier].reverse().map(d=>{
        const ook = d.kettingen.filter(x=>x!==k.id).map(kettingById);
        const extra = detail ? (d.onder||[]).map(o=>`<span class="kt-extra">🟢 ${esc(o)}</span>`).join('') +
          (d.verdiep||[]).map(o=>`<span class="kt-extra">🔵 ${esc(o)}</span>`).join('') : '';
        return `<button class="kt-doel" data-nr="${alle.indexOf(d)+1}" onclick="showKettingDoel('${d.code}','${k.id}')"><span class="kt-code">${d.code}</span>${esc(d.text)}${extra}${ook.length?`<br>${ook.map(o=>`<span class="kt-ook">🔗 ook in ketting ${o.nr}</span>`).join(' ')}`:''}</button>`;
      }).join('') + `</div>`;
    });
  });
  html += `</div></div>`;
  document.getElementById('wrapKetting').innerHTML = html;
}

/* ── Popup van één doel in de ketting ── */
function showKettingDoel(code, kId){
  const k = kettingById(kId), alle = kettingDoelen(kId);
  const d = KETTING_DOELEN.find(x=>x.code===code), i = alle.indexOf(d);
  const lijst = (titel,items)=> items && items.length ? `<h3>${titel}</h3><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : '';
  const stap = (x,tekst)=>`<button class="btn" ${x?`onclick="showKettingDoel('${x.code}','${kId}')"`:'disabled'}>${tekst}</button>`;
  const m = document.getElementById('modal');
  m.classList.add('kt');
  m.innerHTML = `<h2><span class="tl-color" style="background:${k.kleur}"></span>${d.code}</h2>
    <div class="kt-p">${k.icoon} ${esc(k.label)} · schakel ${i+1} van ${alle.length}</div>
    <p style="font-size:1rem;font-weight:600;color:#1e293b">${esc(d.text)}</p>
    <h3>Wanneer</h3><div class="kt-p">${esc(ljById(d.lj).label)} · ${String(d.leeftijd).replace('.',',')} jaar · fase ${d.fase}</div>
    ${lijst('Ondersteuning',d.onder)}${lijst('Verdieping',d.verdiep)}
    ${lijst('Minimumdoelen',(d.md||[]).map(x=>x+': '+(KETTING_MD[x]||'')))}
    ${d.samenhang?`<h3>Samenhang met andere leerlijn</h3><div class="kt-p">${esc(d.samenhang)}</div>`:''}
    <h3>Vorige versie van het leerplan</h3><div class="kt-p">${d.oud?'Vervangt '+esc(d.oud.join(' en ')):'Nieuw doel'}</div>
    ${d.kettingen.filter(x=>x!==kId).map(x=>`<h3>Ook in</h3><div class="kt-p"><a href="#" onclick="event.preventDefault();openKetting('${x}')">🔗 ${esc(kettingById(x).label)}</a></div>`).join('')}
    <div class="kt-nav">${stap(alle[i-1],'← Vorige schakel')}${stap(alle[i+1],'Volgende schakel →')}</div>
    <div class="kt-nav"><a class="btn" href="${k.url}" target="_blank" rel="noopener" style="text-decoration:none">Ketting in LeerLokaal ↗</a>
    <button class="btn" style="background:#0f1f30;color:#fff" onclick="closeOverlay()">Sluiten</button></div>`;
  m.scrollTop = 0;
  document.getElementById('overlay').classList.add('show');
}

/* ── Opstarten: filters volgen en #ketting=1-2 openen ── */
function startKettingen(){
  document.getElementById('viewKetting').onclick = ()=>switchView('ketting');
  // loopt na de klikafhandeling van de knop zelf, die eerst de filter aanpast
  document.querySelector('.filterbar').addEventListener('click', e=>{
    if(e.target.closest('[data-fase],[data-year],#clearFilter') &&
       !document.getElementById('wrapKetting').classList.contains('hidden')) renderKettingen();
  });
  const opHash = ()=>{
    const m = location.hash.match(/^#ketting=(\d-\d)$/);
    if(m && KETTING_PAGINA.includes(m[1])) openKetting(m[1]);
  };
  window.addEventListener('hashchange', opHash);
  opHash();
}
