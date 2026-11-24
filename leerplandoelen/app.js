'use strict';
/* Leerplandoelen: vier weergaven op dezelfde data (doelen-data.js, schoolkettingen-data.js en spiraal-data.js). */

const SLEUTEL = 'leerplandoelen_aanpassingen_v1';
const SLEUTEL_SPIRAAL = 'leerlijnViz_spiraal_v4'; // zelfde sleutel als de vroegere leerlijnpagina, zo blijven aanpassingen bewaard
const SLEUTEL_LJ = 'leerplandoelen_leerjaar';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const kopie = x => JSON.parse(JSON.stringify(x));
function lees(sleutel, anders){ try{ const s = localStorage.getItem(sleutel); return s ? JSON.parse(s) : anders; }catch(e){ return anders; } }
function bewaar(sleutel, waarde){ try{ localStorage.setItem(sleutel, JSON.stringify(waarde)); }catch(e){ meld('Bewaren in deze browser lukt niet.'); } }

/* Lange woorden netjes laten afbreken in smalle kolommen */
const AFBREKEN = ['informatie|verwerkings|proces','informatie|verwerking','netwerk|technologieën','systeem|instellingen','informatie|bronnen','patroon|herkenning','communicatie|kanaal','reclame|boodschappen','media|boodschappen','gezondheids|aspecten','veiligheids|aspecten','zoek|resultaten','mappen|structuur','uitvoer|apparaten','invoer|apparaten','computer|code','bestands|naam','basis|principe','basis|vaardigheden','informatie|vaardig','tekst|verwerking','persoons|gegevens','mogelijk|heden','verant|woorde','toe|passingen','zelf|standig','communi|ceren','voor|stelling','Experimen|teren'];
const zacht = s => AFBREKEN.reduce((t,w) => t.replace(new RegExp(w.replaceAll('|',''),'gi'), m => {
  let i = 0; return w.split('|').map(d => m.slice(i, i += d.length)).join('­');
}), s);

/* ── Toestand ── */
const WEERGAVEN = {leerjaar:'Per leerjaar', opbouw:'Verticale opbouw', kettingen:'Kettingen', spiraal:'Spiraalcurriculum'};
const st = {view:'leerjaar', lj:lees(SLEUTEL_LJ,'L1'), lijn:'alle', ketting:'1-1', fases:new Set(), vol:true, extra:false, ai:true, q:'', groep:null, aiThema:null, open:null, beheer:false};
let aanpassingen = lees(SLEUTEL, {});
let spiraal = lees(SLEUTEL_SPIRAAL, null) || kopie(SPIRAAL);
let doelen = [];

const ljIdx = id => LEERJAREN.findIndex(l => l.id === id);
const lj = id => LEERJAREN[ljIdx(id)];
const lijn = id => LEERLIJNEN.find(l => l.id === id);
const thema = (l,id) => THEMAS[l].find(t => t.id === id);
const doel = code => doelen.find(d => d.code === code);
const KETTINGLIJST = [...KETTINGEN, ...SCHOOLKETTINGEN];
const ketting = id => KETTINGLIJST.find(k => k.id === id);
const inKetting = id => id === 's-ai' ? AI_DOELEN : doelen.filter(d => (d.kettingen||[]).includes(id));
const aiDoel = code => AI_DOELEN.find(d => d.code === code);
const aiThema = id => AI_THEMAS.find(t => t.id === id);
const aiFase = id => AI_FASES.find(f => f.id === id);
const aiBij = code => AI_DOELEN.filter(d => d.verankering.some(v => v.code === code));
const AI_LIJN = {'ICT-basisvaardigheden':'ict', 'Computationeel denken':'cd', 'Mediawijsheid':'media'};
const aiInLijn = (d,l) => d.leerlijn.split(' en ').some(x => AI_LIJN[x] === l);
/* kleurcode: roze = link met een leerplandoel, oranje = eigen doel van de school */
const aiSoort = d => d.eigen ? 'eigen' : 'link';
function aiTeken(code){
  const ds = aiBij(code);
  if(!ds.length) return '';
  const soort = ds.some(d => !d.eigen) ? 'link' : 'eigen';
  return `<span class="ai-teken ai-${soort}" title="${soort === 'link' ? 'Zit in de AI-leerlijn' : 'Een eigen AI-doel bouwt hierop verder'}: ${ds.map(d => d.code).join(', ')}">AI</span>`;
}
const AI_LEGENDE = `<span class="ai-legende"><span class="ai-teken ai-link">AI</span> link met een leerplandoel</span><span class="ai-legende"><span class="ai-teken ai-eigen">AI</span> eigen doel van de school</span>`;
const inThema = (l,id) => doelen.filter(d => d.lijn === l && d.thema === id).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj));
const groepVan = tl => SPIRAAL_GROEPEN.find(g => g.tls.includes(tl));
const spThema = id => SPIRAAL_THEMAS.find(t => t.id === id);
const aantal = n => n === 1 ? '1 doel' : n + ' doelen';

function herbouw(){
  doelen = DOELEN.map(d => {
    const school = SCHOOLKETTINGEN.filter(k => (k.codes||[]).includes(d.code)).map(k => k.id);
    return {...d, ...(aanpassingen[d.code]||{}), ...(school.length ? {kettingen:[...(d.kettingen||[]), ...school]} : {})};
  });
}

/* ── Adres: #leerjaar/L3/ict · #opbouw/cd · #kettingen/1-2 · #spiraal ── */
function leesAdres(){
  const [v,a,b] = decodeURIComponent(location.hash.slice(1)).split('/');
  if(!WEERGAVEN[v]) return;
  st.view = v;
  if(v === 'leerjaar'){ if(lj(a)) st.lj = a; st.lijn = lijn(b) ? b : 'alle'; }
  if(v === 'opbouw') st.lijn = lijn(a) ? a : 'ict';
  if(v === 'kettingen' && ketting(a)) st.ketting = a;
}
function adres(){
  if(st.view === 'leerjaar') return `#leerjaar/${st.lj}` + (st.lijn === 'alle' ? '' : '/' + st.lijn);
  if(st.view === 'opbouw') return `#opbouw/${st.lijn}`;
  if(st.view === 'kettingen') return `#kettingen/${st.ketting}`;
  return '#spiraal';
}
function ga(wijziging){
  const andereView = wijziging.view && wijziging.view !== st.view;
  Object.assign(st, wijziging);
  if(st.view === 'opbouw' && st.lijn === 'alle') st.lijn = 'ict';
  if(wijziging.lj) bewaar(SLEUTEL_LJ, st.lj);
  if(st.q){ st.q = ''; $('#zoek').value = ''; }
  if(adres() !== location.hash) history.pushState(null, '', adres());
  toon();
  if(andereView || wijziging.lj || wijziging.ketting || wijziging.lijn) $('#inhoud').scrollTo(0,0);
  // op een smal scherm staat de lijst met kettingen boven de ketting zelf
  if(wijziging.ketting && innerWidth <= 860) $('.ketting').scrollIntoView();
}

/* ── Tekenen ── */
function toon(){
  $('#tabs').innerHTML = Object.entries(WEERGAVEN).map(([id,label]) =>
    `<button type="button" data-act="view" data-id="${id}" ${!st.q && st.view === id ? 'aria-current="page"' : ''}>${label}</button>`).join('');

  const keuze = st.view === 'leerjaar' ? ['alle', ...LEERLIJNEN.map(l => l.id)] : st.view === 'opbouw' ? LEERLIJNEN.map(l => l.id) : [];
  $('#lijnen').innerHTML = st.q ? '' : keuze.map(id =>
    `<button type="button" class="${id === 'alle' ? '' : 'l-' + id}" data-act="lijn" data-id="${id}" aria-pressed="${st.lijn === id}">${id === 'alle' ? 'Alle leerlijnen' : lijn(id).icoon + ' ' + lijn(id).kort}</button>`).join('');

  const n = Object.keys(aanpassingen).length;
  $('#beheerBalk').hidden = !st.beheer;
  $('#beheerBalk').innerHTML = st.beheer ? `<p><b>Beheer staat aan.</b> Open een doel of spiraalblok om het aan te passen. Wijzigingen blijven in deze browser tot je ze publiceert. ${n ? aantal(n) + ' verplaatst.' : ''}</p>
    <button type="button" class="knop" data-act="download">Aanpassingen downloaden</button>
    <button type="button" class="knop weg" data-act="herstel">Alles herstellen</button>` : '';

  $('#inhoud').innerHTML = st.q ? vZoek() : {leerjaar:vLeerjaar, opbouw:vOpbouw, kettingen:vKettingen, spiraal:vSpiraal}[st.view]();
  markeer();
  if(innerWidth <= 860) $('.stapper [aria-pressed=true]')?.scrollIntoView({block:'nearest', inline:'center'});
}

function kaart(d, {meta = true, wanneer = false, extra = false, zoek = null} = {}){
  const o = (d.onder||[]).length, v = (d.verdiep||[]).length;
  const tekst = zoek ? zoek(d.text) : zacht(esc(d.text));
  const bij = [d.md ? d.md.join(', ') : '', !extra && o ? 'ondersteuning' : '', !extra && v ? 'verdieping' : ''].filter(Boolean).join(' · ');
  return `<button type="button" class="kaart l-${d.lijn}" data-act="doel" data-id="${d.code}">
    <span class="code">${d.code}${wanneer ? ` <i>· ${lj(d.lj).label}</i>` : ''}${aiTeken(d.code)}</span>
    <span class="tekst">${tekst}</span>
    ${extra && o ? `<span class="extra">${d.onder.map(x => `<b>Ondersteuning:</b> ${esc(x).replace(/\n/g,'<br>')}`).join('<br>')}</span>` : ''}
    ${extra && v ? `<span class="extra">${d.verdiep.map(x => `<b>Verdieping:</b> ${esc(x)}`).join('<br>')}</span>` : ''}
    ${meta && bij ? `<span class="meta">${bij}</span>` : ''}
  </button>`;
}

function kaartAi(d, {wanneer = false, zoek = null} = {}){
  return `<button type="button" class="kaart ai-${aiSoort(d)}" data-act="ai" data-id="${d.code}">
    <span class="code">${d.code}${wanneer ? ` <i>· ${aiFase(d.fase).label}</i>` : ''}<span class="ai-label">${d.eigen ? 'Eigen doel' : 'Link met leerplandoel'}</span></span>
    <span class="tekst">${zoek ? zoek(d.text) : zacht(esc(d.text))}</span>
    <span class="meta">${[...new Set(d.verankering.map(v => v.relatie))].map(r => r.charAt(0).toUpperCase() + r.slice(1) + ' ' + d.verankering.filter(v => v.relatie === r).map(v => v.code).join(', ')).join(' · ')}</span></button>`;
}

/* ── Weergave 1: per leerjaar ── */
function vLeerjaar(){
  const lijnen = st.lijn === 'alle' ? LEERLIJNEN : [lijn(st.lijn)];
  const telt = id => doelen.filter(d => d.lj === id && (st.lijn === 'alle' || d.lijn === st.lijn)).length;
  const stapper = [1,2,3,4].map(f => {
    const js = LEERJAREN.filter(l => l.fase === f);
    return `<fieldset style="--n:${js.length}"><legend>Fase ${f}</legend>${js.map(l =>
      `<button type="button" data-act="lj" data-id="${l.id}" aria-pressed="${l.id === st.lj}" aria-label="${l.label}, ${aantal(telt(l.id))}" title="${l.label}"><b>${l.id}</b><small>${telt(l.id)}</small></button>`).join('')}</fieldset>`;
  }).join('');

  const L = lj(st.lj);
  const vakken = lijnen.map(li => {
    const hier = doelen.filter(d => d.lj === st.lj && d.lijn === li.id);
    const groepen = THEMAS[li.id].map(t => {
      const ds = hier.filter(d => d.thema === t.id);
      return ds.length ? `<div class="groep"><h4><button type="button" data-act="thema" data-lijn="${li.id}" data-id="${t.id}" title="Toon de opbouw van dit thema">${esc(t.label)}</button></h4><div class="stapel">${ds.map(d => kaart(d,{extra:st.extra})).join('')}</div></div>` : '';
    }).join('');
    // zelfde regel als de lijn in de verticale opbouw: eerder gestart, later nog een doel, nu niets nieuws
    const loopt = THEMAS[li.id].filter(t => {
      const ix = inThema(li.id,t.id).map(d => ljIdx(d.lj)), i = ljIdx(st.lj);
      return ix.length && i > Math.min(...ix) && i < Math.max(...ix) && !ix.includes(i);
    });
    const ai = st.ai ? AI_DOELEN.filter(d => aiInLijn(d,li.id) && (d.fase === String(L.fase) || (d.fase === 'U' && L.fase === 4))) : [];
    const volgende = doelen.filter(d => d.lijn === li.id && ljIdx(d.lj) > ljIdx(st.lj)).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj))[0];
    return `<section class="l-${li.id}"><div class="vak-kop"><span class="icoon" aria-hidden="true">${li.icoon}</span><span class="label">${li.dig} · ${aantal(hier.length)}</span><h3>${li.label}</h3></div>
      ${groepen || `<p class="leeg">Geen doelen die in dit leerjaar starten.${volgende ? ` Eerstvolgende doel: <button type="button" data-act="lj" data-id="${volgende.lj}">${volgende.code} in ${lj(volgende.lj).label}</button>` : ''}</p>`}
      ${ai.length ? `<div class="groep ai-groep"><h4><button type="button" data-act="ketting" data-id="s-ai" title="Open de ketting AI">AI-leerlijn van de school, fase ${L.fase}</button></h4><div class="stapel">${ai.map(d => kaartAi(d,{wanneer:d.fase === 'U'})).join('')}</div></div>` : ''}
      ${loopt.length ? `<p class="leeg loopt">Blijven inoefenen: ${loopt.map(t => `<button type="button" data-act="thema" data-lijn="${li.id}" data-id="${t.id}">${esc(t.label)}</button>`).join(', ')}</p>` : ''}</section>`;
  }).join('');

  return `<div class="stapper">${stapper}</div>
    <div class="lj-kop"><div><h2>${L.label}</h2><p>${L.leeftijd} · fase ${L.fase} · ${aantal(telt(L.id))}</p></div>
      <div class="lj-opties"><label class="vink"><input type="checkbox" data-act="extra" ${st.extra ? 'checked' : ''}> Ondersteuning en verdieping</label>
      <label class="vink"><input type="checkbox" data-act="aiToon" ${st.ai ? 'checked' : ''}> AI-leerlijn</label>${AI_LEGENDE}</div></div>
    <div class="kolommen ${lijnen.length === 1 ? 'een' : ''}" style="--k:${lijnen.length}">${vakken}</div>`;
}

/* ── Weergave 2: verticale opbouw, van onder (jong) naar boven ── */
function vOpbouw(){
  const li = lijn(st.lijn);
  const eigen = doelen.filter(d => d.lijn === li.id);
  const ts = THEMAS[li.id].filter(t => st.beheer || eigen.some(d => d.thema === t.id));
  const zonder = THEMAS[li.id].filter(t => !eigen.some(d => d.thema === t.id));
  const rijen = LEERJAREN.filter(l => !st.fases.size || st.fases.has(l.fase)).reverse();
  const bereik = Object.fromEntries(ts.map(t => {
    const ix = eigen.filter(d => d.thema === t.id).map(d => ljIdx(d.lj));
    return [t.id, [Math.min(...ix), Math.max(...ix)]];
  }));

  // thema's met veel doelen krijgen een bredere kolom
  const maten = ts.map(t => {
    const n = inThema(li.id,t.id), drukst = Math.max(0, ...LEERJAREN.map(l => n.filter(d => d.lj === l.id).length));
    const min = n.length > 5 ? 158 : n.length > 2 ? 142 : 124;
    return {min, fr:drukst > 3 ? min * 1.8 : min};
  });

  let h = `<div class="mx-kop mx-hoek"></div>` + ts.map(t =>
    `<div class="mx-kop"><button type="button" data-act="thema" data-lijn="${li.id}" data-id="${t.id}"><span>${zacht(esc(t.label))}</span><small>${aantal(inThema(li.id,t.id).length)}</small></button></div>`).join('');
  rijen.forEach((l,r) => {
    const grens = r > 0 && rijen[r-1].fase !== l.fase ? ' fasegrens' : '';
    h += `<div class="mx-rij${grens}"><div><b>${l.label}</b><span>${l.leeftijd}</span><span>Fase ${l.fase}</span></div></div>`;
    ts.forEach((t,c) => {
      const i = ljIdx(l.id), [min,max] = bereik[t.id];
      const ds = eigen.filter(d => d.thema === t.id && d.lj === l.id);
      const spoor = i >= min && i <= max && min !== max ? ' spoor' + (i === max ? ' top' : '') + (i === min ? ' voet' : '') : '';
      h += `<div class="mx-cel${spoor}${grens}${c % 2 ? ' even' : ''}">${ds.length ? `<div class="mx-stapel${ds.length > 2 ? ' veel' : ''}">${ds.map(d => kaart(d,{meta:false})).join('')}</div>` : ''}</div>`;
    });
  });

  const uit = UITBREIDING.filter(u => u.lijn === li.id);
  return `<div class="ctx l-${li.id}">
      <div class="fasekeuze" role="group" aria-label="Fase">${[1,2,3,4].map(f => `<button type="button" data-act="fase" data-id="${f}" aria-pressed="${st.fases.has(f)}">Fase ${f}</button>`).join('')}</div>
      <label class="vink"><input type="checkbox" data-act="vol" ${st.vol ? 'checked' : ''}> Volledige tekst</label>
      <span>Lees van onder (jong) naar boven. Klik op een thema om het apart te volgen.</span><span class="sleutel">lijn = blijven inoefenen</span>${AI_LEGENDE}
    </div>
    <div class="matrix l-${li.id} ${st.vol ? '' : 'kort'}" style="grid-template-columns:104px ${maten.map(m => `minmax(${m.min}px,${m.fr}fr)`).join(' ')};min-width:${maten.reduce((a,m) => a + m.min, 104)}px">${h}</div>
    <div class="onderaan l-${li.id}">
      ${uit.length ? `<h3>Uitbreiding, zonder vaste leeftijd</h3><div class="stapel">${uit.map(u => `<div class="kaart l-${u.lijn}"><span class="code">${u.code}</span><span class="tekst">${esc(u.text)}</span></div>`).join('')}</div>` : ''}
      ${zonder.length ? `<p class="leeg">${zonder.map(t => esc(t.label)).join(', ')}: geen eigen leerplandoel in ${li.dig}. De opbouw staat in het <button type="button" data-act="view" data-id="spiraal">spiraalcurriculum</button>.</p>` : ''}
    </div>`;
}

/* ── Weergave 3: kettingen ── */
/* de schakels van een ketting, van jong naar oud: {wie, leeftijd, html} */
function schakelsVan(k){
  if(k.id === 's-ai')
    return AI_DOELEN.filter(d => !st.aiThema || d.themas.includes(st.aiThema)).map(d => ({wie:aiFase(d.fase).label, leeftijd:aiFase(d.fase).leeftijd, html:kaartAi(d)}));
  const rij = inKetting(k.id).map(d => ({wie:lj(d.lj).label, leeftijd:lj(d.lj).leeftijd, html:kaart(d,{extra:true}) +
    (d.kettingen||[]).filter(x => x !== k.id).map(x => `<button type="button" class="knop ook" data-act="ketting" data-id="${x}">Ook in: ${esc(ketting(x).label)}</button>`).join('')}));
  (k.mijlpalen||[]).forEach(m => rij.push({wie:'Einde ' + lj(m.lj).label, leeftijd:'minimumdoel', mijlpaal:true, html:mijlpaal(m)}));
  return rij;
}
function mijlpaal(m){
  const ds = doelen.filter(d => (d.md||[]).includes(m.md));
  return `<div class="mijlpaal"><span class="code">${m.md}</span><span class="pre">${esc(MINIMUMDOELEN[m.md])}</span>
    <span class="meta">Leerplandoelen: ${ds.map(d => `<button type="button" data-act="doel" data-id="${d.code}">${d.code.replace('DIG 1 ','')}</button>`).join(', ')}</span></div>`;
}
function vKettingen(){
  const k = ketting(st.ketting), school = k.lijn === 'school', ds = inKetting(k.id);
  const railKnop = x => `<button type="button" data-act="ketting" data-id="${x.id}" ${x.id === k.id ? 'aria-current="true"' : ''}>${esc(x.label)}<span>${inKetting(x.id).length}</span></button>`;
  const rail = `<div class="l-school"><h3>🏫 Van de school</h3>${SCHOOLKETTINGEN.map(railKnop).join('')}</div>` + LEERLIJNEN.map(li => {
    const ks = KETTINGEN.filter(x => x.lijn === li.id);
    return `<div class="l-${li.id}"><h3>${li.icoon} ${li.label}</h3>${ks.length ? ks.map(railKnop).join('')
      : `<p>${li.dig} heeft in LeerLokaal geen kettingen. Bekijk de <button type="button" class="tekstknop" data-act="opbouw" data-id="${li.id}">verticale opbouw</button>.</p>`}</div>`;
  }).join('');

  let vorige = null;
  const schakels = schakelsVan(k).map((x,i) => {
    const w = vorige === x.wie ? '' : `<b>${x.wie}</b><span>${x.leeftijd}</span>`;
    vorige = x.wie;
    return `<li class="${x.mijlpaal ? 'is-mijlpaal' : ''}"><div class="wanneer">${w}</div><div class="nr">${x.mijlpaal ? '★' : i+1}</div><div>${x.html}</div></li>`;
  }).join('');
  const inleiding = school
    ? `${esc(k.info)} ${aantal(ds.length)}${k.id === 's-ai' ? `, waarvan ${ds.filter(d => d.eigen).length} zelf toegevoegd` : ''}${k.mijlpalen ? ` en ${k.mijlpalen.length} minimumdoelen` : ''}, van jong naar oud.`
    : `${lijn(k.lijn).dig}, ketting ${k.nr} · ${aantal(ds.length)} van jong naar oud · <a href="${k.url}" target="_blank" rel="noopener">openen in LeerLokaal</a>`;
  const themas = k.id === 's-ai' ? `<p class="ai-legendes">${AI_LEGENDE}</p><div class="ai-themas" role="group" aria-label="AI-thema">
      <button type="button" data-act="aiThema" data-id="" aria-pressed="${!st.aiThema}">Alle thema's</button>${AI_THEMAS.map(t =>
      `<button type="button" data-act="aiThema" data-id="${t.id}" aria-pressed="${st.aiThema === t.id}">${esc(t.label)}</button>`).join('')}</div>` : '';
  return `<div class="ketting-wrap"><div class="rail">${rail}</div>
    <div class="ketting l-${k.lijn}"><h2>${esc(k.label)}</h2><p class="inl">${inleiding}</p>${themas}
      <ol class="schakels">${schakels}</ol></div></div>`;
}

/* ── Weergave 4: spiraalcurriculum ── */
function vSpiraal(){
  const rijen = [...LEERJAREN].reverse();
  return `<div class="ctx"><div class="sp-groepen" role="group" aria-label="Thema uitlichten">${SPIRAAL_GROEPEN.map((g,i) =>
      `<button type="button" style="--g:${g.kleur}" data-act="groep" data-id="${i}" aria-pressed="${st.groep === i}">${esc(g.label)}</button>`).join('')}</div>
      <span class="sp-voorbeeld aan">nieuw aanbrengen</span><span class="sp-voorbeeld">verder bouwen</span></div>` +
    rijen.map((l,r) => {
      const blokken = spiraal.map((s,i) => ({...s,i})).filter(s => s.lj === l.id && spThema(s.thema))
        .sort((a,b) => SPIRAAL_THEMAS.indexOf(spThema(a.thema)) - SPIRAAL_THEMAS.indexOf(spThema(b.thema)));
      return `<div class="sp-rij${r > 0 && rijen[r-1].fase !== l.fase ? ' fasegrens' : ''}"><div><b>${l.label}</b><span>Fase ${l.fase}</span></div><div class="sp-blokken">${blokken.map(s => {
        const g = groepVan(spThema(s.thema).tl);
        const dof = st.groep !== null && SPIRAAL_GROEPEN[st.groep] !== g;
        return `<button type="button" class="sp-blok ${s.type}${dof ? ' dof' : ''}" style="--g:${g.kleur}" data-act="blok" data-id="${s.i}">${esc(s.label)}</button>`;
      }).join('')}${st.beheer ? `<button type="button" class="knop" data-act="blokNieuw" data-id="${l.id}">+ Blok</button>` : ''}</div></div>`;
    }).join('');
}

/* ── Zoeken ── */
const kaal = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function vZoek(){
  const woorden = kaal(st.q).split(/\s+/).filter(Boolean);
  const raak = d => { const t = kaal([d.code, d.text, ...(d.onder||[]), ...(d.verdiep||[]), ...(d.md||[]), d.thema ? thema(d.lijn,d.thema).label : '', ...(d.oud||[])].join(' ')); return woorden.every(w => t.includes(w)); };
  const gevonden = doelen.filter(raak), uit = UITBREIDING.filter(raak);
  const ai = AI_DOELEN.filter(d => { const t = kaal([d.code, d.text, d.leerlijn, ...d.themas.map(x => aiThema(x).label), ...d.activiteiten, ...d.verankering.map(v => v.code)].join(' ')); return woorden.every(w => t.includes(w)); });
  const patroon = new RegExp('(' + woorden.map(w => w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')','gi');
  const kleur = t => t.split(patroon).map((x,i) => i % 2 ? `<mark>${esc(x)}</mark>` : esc(x)).join('');
  const n = gevonden.length + uit.length + ai.length;
  return `<div class="zoek-kop"><h2>${n ? aantal(n) + ' gevonden' : 'Niets gevonden'}</h2><p>${n ? 'Er is ook gezocht in ondersteuning, verdieping en minimumdoelen.' : 'Probeer een ander woord of een code zoals B.12.'}</p></div>
    <div class="kolommen" style="--k:3">${LEERLIJNEN.map(li => {
      const ds = gevonden.filter(d => d.lijn === li.id), us = uit.filter(u => u.lijn === li.id);
      return ds.length + us.length ? `<section class="l-${li.id}"><div class="vak-kop"><span class="icoon" aria-hidden="true">${li.icoon}</span><span class="label">${li.dig} · ${aantal(ds.length + us.length)}</span><h3>${li.label}</h3></div><div class="stapel" style="margin-top:12px">${ds.map(d => kaart(d,{wanneer:true,zoek:kleur})).join('')}${us.map(u => `<div class="kaart l-${u.lijn}"><span class="code">${u.code} <i>· uitbreiding</i></span><span class="tekst">${kleur(u.text)}</span></div>`).join('')}</div></section>` : '';
    }).join('')}${ai.length ? `<section class="l-school"><div class="vak-kop"><span class="icoon" aria-hidden="true">🏫</span><span class="label">Van de school · ${aantal(ai.length)}</span><h3>AI-leerlijn</h3></div><div class="stapel" style="margin-top:12px">${ai.map(d => kaartAi(d,{wanneer:true,zoek:kleur})).join('')}</div></section>` : ''}</div>`;
}

/* ── Detailpaneel ── */
let terugNaar = null;
function open(wat, vanaf){
  if(vanaf && !vanaf.closest('#paneel')) terugNaar = vanaf.dataset;
  st.open = wat;
  const p = $('#paneel');
  p.className = wat.lijn ? 'l-' + wat.lijn : '';
  p.innerHTML = {doel:pDoel, thema:pThema, blok:pBlok, ai:pAi}[wat.soort](wat);
  p.hidden = false;
  p.scrollTop = 0;
  markeer();
  if(vanaf?.closest('#paneel')) document.querySelector('#inhoud [aria-current=true]:is(.kaart,.sp-blok)')?.scrollIntoView({block:'nearest', inline:'nearest'});
  const kop = p.querySelector('h2'); if(kop) kop.focus({preventScroll:true});
}
function sluit(){
  if(!st.open) return;
  st.open = null;
  $('#paneel').hidden = true;
  markeer();
  if(terugNaar) [...document.querySelectorAll(`#inhoud [data-act="${terugNaar.act}"]`)].find(b => b.dataset.id === terugNaar.id)?.focus({preventScroll:true});
}
function markeer(){
  const o = st.open;
  document.querySelectorAll('#inhoud .kaart[data-id]').forEach(b => b.toggleAttribute('aria-current', false) || ((o?.soort === 'doel' || o?.soort === 'ai') && b.dataset.id === o.code && b.setAttribute('aria-current','true')));
  document.querySelectorAll('#inhoud .sp-blok').forEach(b => b.toggleAttribute('aria-current', false) || (o?.soort === 'blok' && +b.dataset.id === o.i && b.setAttribute('aria-current','true')));
}
const pKop = t => `<div class="pn-kop"><h2 tabindex="-1">${t}</h2><button type="button" class="sluit" data-act="sluit">Sluiten</button></div>`;
const pLijst = (titel,items) => items && items.length ? `<section><h3>${titel}</h3><ul>${items.map(x => `<li class="pre">${esc(x)}</li>`).join('')}</ul></section>` : '';
const pReeks = (ds,code,metCode) => `<ul class="reeks${metCode ? ' ai' : ''}">${ds.map(d => `<li><button type="button" data-act="doel" data-id="${d.code}" ${d.code === code ? 'aria-current="true"' : ''}><b>${metCode ? d.code : d.lj}</b><span>${esc(d.text)}</span></button></li>`).join('')}</ul>`;
const opties = (lijst,gekozen) => lijst.map(x => `<option value="${x.id}" ${x.id === gekozen ? 'selected' : ''}>${esc(x.label)}</option>`).join('');

function pDoel({code}){
  const d = doel(code), li = lijn(d.lijn), t = thema(d.lijn,d.thema), L = lj(d.lj);
  const basis = DOELEN.find(x => x.code === code);
  const blokken = d.lijn === 'ict' ? spiraal.map((s,i) => ({...s,i})).filter(s => s.lj === d.lj && spThema(s.thema)?.tl === d.thema) : [];
  return pKop(d.code) + `<p class="pn-tekst">${esc(d.text)}</p>
    ${d.lj !== basis.lj ? `<span class="tag">Door de school verplaatst, in LeerLokaal: ${lj(basis.lj).label}</span>` : ''}
    <dl class="pn-feiten"><dt>Leerlijn</dt><dd>${li.label}</dd><dt>Thema</dt><dd>${esc(t.label)}</dd><dt>Start in</dt><dd>${L.label} (${basis.leeftijd} jaar, fase ${L.fase})</dd>${d.samenhang ? `<dt>Samenhang</dt><dd>${esc(d.samenhang)}</dd>` : ''}${d.oud ? `<dt>Vervangt</dt><dd>${esc(d.oud.join(' en '))}</dd>` : ''}</dl>
    <div class="pn-acties"><button type="button" class="knop" data-act="kopieer" data-id="${d.code}">Tekst kopiëren</button></div>
    ${st.beheer ? `<section><h3>Aanpassen</h3>
      <label class="veld">Leerjaar<select id="bwLj">${opties(LEERJAREN,d.lj)}</select></label>
      <label class="veld">Thema<select id="bwThema">${opties(THEMAS[d.lijn],d.thema)}</select></label>
      <div class="pn-acties"><button type="button" class="knop vol" data-act="doelBewaar" data-id="${d.code}">Bewaren</button>${aanpassingen[d.code] ? `<button type="button" class="knop" data-act="doelHerstel" data-id="${d.code}">Terug naar LeerLokaal</button>` : ''}</div></section>` : ''}
    ${pLijst('Ondersteuning',d.onder)}${pLijst('Verdieping',d.verdiep)}
    <section><h3>Minimumdoelen</h3>${d.md ? d.md.map(m => `<div class="md"><b>${m}</b><span class="pre">${esc(MINIMUMDOELEN[m]||'')}</span></div>`).join('') : '<p>Aan dit doel hangt geen minimumdoel.</p>'}</section>
    ${(d.kettingen||[]).map(id => `<section><h3>Ketting: ${esc(ketting(id).label)}</h3>${pReeks(inKetting(id),code)}<div class="pn-acties"><button type="button" class="knop" data-act="ketting" data-id="${id}">Ketting openen</button></div></section>`).join('')}
    ${[false,true].map(eigen => { const ds = aiBij(code).filter(x => x.eigen === eigen); return ds.length ? `<section class="l-${eigen ? 'school' : 'ailink'}"><h3><span class="ai-teken ai-${eigen ? 'eigen' : 'link'}">AI</span> ${eigen ? 'Eigen AI-doelen die hierop verder bouwen' : 'In de AI-leerlijn'}</h3>${pReeksAi(ds)}</section>` : ''; }).join('')}
    <section><h3>Opbouw in thema ${esc(t.label)}</h3>${pReeks(inThema(d.lijn,d.thema),code)}</section>
    ${blokken.length ? `<section><h3>In het spiraalcurriculum</h3><div class="sp-blokken">${blokken.map(s => `<button type="button" class="sp-blok ${s.type}" style="--g:${groepVan(spThema(s.thema).tl).kleur}" data-act="blok" data-id="${s.i}">${esc(s.label)}</button>`).join('')}</div></section>` : ''}`;
}

const pReeksAi = (ds,code) => `<ul class="reeks ai">${ds.map(d => `<li><button type="button" class="l-${d.eigen ? 'school' : 'ailink'}" data-act="ai" data-id="${d.code}" ${d.code === code ? 'aria-current="true"' : ''}><b>${d.code}</b><span>${esc(d.text)}</span></button></li>`).join('')}</ul>`;
function pAi({code}){
  const d = aiDoel(code), f = aiFase(d.fase);
  const perRelatie = [...new Set(d.verankering.map(v => v.relatie))];
  return pKop(d.code) + `<p class="pn-tekst">${esc(d.text)}</p>
    <span class="tag ai-${aiSoort(d)}">${d.eigen ? 'Eigen doel, door de school toegevoegd' : 'Link met een bestaand leerplandoel'}</span>
    <dl class="pn-feiten"><dt>Wanneer</dt><dd>${f.label} (${f.leeftijd})</dd><dt>Leerlijn</dt><dd>${esc(d.leerlijn)}</dd>${d.samenhang ? `<dt>Samenhang</dt><dd>${esc(d.samenhang)}</dd>` : ''}</dl>
    <div class="pn-acties"><button type="button" class="knop" data-act="kopieer" data-id="${d.code}">Tekst kopiëren</button></div>
    ${perRelatie.map(r => `<section><h3>${r.charAt(0).toUpperCase() + r.slice(1)}</h3>${pReeks(d.verankering.filter(v => v.relatie === r).map(v => doel(v.code)), null, true)}</section>`).join('')}
    ${pLijst('Activiteiten in de AI-leerlijn', d.activiteiten)}
    ${d.themas.map(t => `<section><h3>Opbouw: ${esc(aiThema(t).label)}</h3>${pReeksAi(aiThema(t).doelen.map(aiDoel),code)}</section>`).join('')}`;
}

function pThema({lijn:l,id}){
  const t = thema(l,id), ds = inThema(l,id);
  return pKop(esc(t.label)) + `<p>${esc(t.info)}</p><section><h3>Opbouw van jong naar oud</h3>${ds.length ? pReeks(ds) : '<p>Dit thema heeft geen eigen leerplandoel.</p>'}</section>`;
}

function pBlok({i, nieuw}){
  const s = nieuw || spiraal[i], t = spThema(s.thema), g = groepVan(t.tl);
  const gekoppeld = doelen.filter(d => d.lijn === 'ict' && d.thema === t.tl && d.lj === s.lj);
  const zelfde = spiraal.map((x,n) => ({...x,n})).filter(x => x.thema === s.thema).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj));
  const form = st.beheer ? `<section><h3>${nieuw ? 'Nieuw blok' : 'Aanpassen'}</h3>
    <label class="veld">Korte naam<input id="sbLabel" value="${esc(s.label)}"></label>
    <label class="veld">Thema<select id="sbThema">${opties(SPIRAAL_THEMAS,s.thema)}</select></label>
    <label class="veld">Leerjaar<select id="sbLj">${opties(LEERJAREN,s.lj)}</select></label>
    <label class="veld">Soort<select id="sbType"><option value="aan" ${s.type === 'aan' ? 'selected' : ''}>Nieuw aanbrengen</option><option value="bouw" ${s.type === 'bouw' ? 'selected' : ''}>Verder bouwen</option></select></label>
    <label class="veld">Uitleg<textarea id="sbDetail">${esc(s.detail||'')}</textarea></label>
    <div class="pn-acties"><button type="button" class="knop vol" data-act="blokBewaar">Bewaren</button>${nieuw ? '' : '<button type="button" class="knop weg" data-act="blokWeg">Verwijderen</button>'}</div></section>` : '';
  if(nieuw) return pKop('Nieuw blok') + form;
  return pKop(esc(s.label)) + `<dl class="pn-feiten"><dt>Thema</dt><dd>${esc(t.label)}</dd><dt>Leerjaar</dt><dd>${lj(s.lj).label}</dd><dt>Soort</dt><dd>${s.type === 'aan' ? 'Nieuw aanbrengen' : 'Verder bouwen'}</dd></dl>
    ${s.detail ? `<p class="pre" style="margin-top:14px">${esc(s.detail)}</p>` : ''}${form}
    ${gekoppeld.length ? `<section class="l-ict"><h3>Gekoppelde leerplandoelen</h3>${pReeks(gekoppeld)}</section>` : ''}
    <section><h3>Opbouw ${esc(t.label)}</h3><ul class="reeks" style="--l:${g.kleur}">${zelfde.map(x => `<li><button type="button" data-act="blok" data-id="${x.n}" ${x.n === i ? 'aria-current="true"' : ''}><b>${x.lj}</b><span>${esc(x.label)}</span></button></li>`).join('')}</ul></section>`;
}

/* ── Handelingen ── */
let meldT;
function meld(t){ const m = $('#melding'); m.textContent = t; m.classList.add('toon'); clearTimeout(meldT); meldT = setTimeout(() => m.classList.remove('toon'), 2800); }
function bewaarSpiraal(){ bewaar(SLEUTEL_SPIRAAL, spiraal); }

const acties = {
  view: b => ga({view:b.dataset.id}),
  lijn: b => ga({lijn:b.dataset.id}),
  lj: b => ga({lj:b.dataset.id}),
  ketting: b => ga({view:'kettingen', ketting:b.dataset.id}),
  opbouw: b => ga({view:'opbouw', lijn:b.dataset.id}),
  fase: b => { const f = +b.dataset.id; st.fases.has(f) ? st.fases.delete(f) : st.fases.add(f); toon(); },
  groep: b => { const g = +b.dataset.id; st.groep = st.groep === g ? null : g; toon(); },
  vol: b => { st.vol = b.checked; toon(); },
  extra: b => { st.extra = b.checked; toon(); },
  aiToon: b => { st.ai = b.checked; toon(); },
  sluit: () => sluit(),
  doel: b => st.open?.soort === 'doel' && st.open.code === b.dataset.id && !b.closest('#paneel') ? sluit() : open({soort:'doel', code:b.dataset.id, lijn:doel(b.dataset.id).lijn}, b),
  ai: b => st.open?.soort === 'ai' && st.open.code === b.dataset.id && !b.closest('#paneel') ? sluit() : open({soort:'ai', code:b.dataset.id, lijn:aiDoel(b.dataset.id).eigen ? 'school' : 'ailink'}, b),
  aiThema: b => { st.aiThema = b.dataset.id || null; toon(); },
  thema: b => open({soort:'thema', lijn:b.dataset.lijn, id:b.dataset.id}, b),
  blok: b => open({soort:'blok', i:+b.dataset.id}, b),
  blokNieuw: b => open({soort:'blok', nieuw:{thema:'t_apparaat', lj:b.dataset.id, type:'aan', label:'', detail:''}}, b),
  kopieer: b => { const d = doel(b.dataset.id) || aiDoel(b.dataset.id); navigator.clipboard.writeText(`${d.code} ${d.text}`).then(() => meld('Gekopieerd.'), () => meld('Kopiëren lukt niet in deze browser.')); },
  doelBewaar: b => {
    const basis = DOELEN.find(x => x.code === b.dataset.id), n = {lj:$('#bwLj').value, thema:$('#bwThema').value};
    if(n.lj === basis.lj && n.thema === basis.thema) delete aanpassingen[basis.code]; else aanpassingen[basis.code] = n;
    naDoelWijziging('Bewaard in deze browser.');
  },
  doelHerstel: b => { delete aanpassingen[b.dataset.id]; naDoelWijziging('Teruggezet naar LeerLokaal.'); },
  blokBewaar: () => {
    const n = {thema:$('#sbThema').value, lj:$('#sbLj').value, type:$('#sbType').value, label:$('#sbLabel').value.trim(), detail:$('#sbDetail').value.trim()};
    if(!n.label){ meld('Geef het blok een korte naam.'); $('#sbLabel').focus(); return; }
    const i = st.open.nieuw ? spiraal.push(n) - 1 : (spiraal[st.open.i] = n, st.open.i);
    bewaarSpiraal(); toon(); open({soort:'blok', i}); meld('Bewaard in deze browser.');
  },
  blokWeg: () => {
    if(!confirm(`Het blok "${spiraal[st.open.i].label}" verwijderen?`)) return;
    spiraal.splice(st.open.i,1); bewaarSpiraal(); sluit(); toon(); meld('Verwijderd.');
  },
  download: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({doelen:aanpassingen, spiraal}, null, 2)], {type:'application/json'}));
    a.download = 'leerplandoelen-aanpassingen.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    meld('Bestand gedownload. Stuur het door zodat het op GitHub komt.');
  },
  herstel: () => {
    if(!confirm('Alle aanpassingen aan doelen én spiraalblokken in deze browser wissen?')) return;
    aanpassingen = {}; spiraal = kopie(SPIRAAL);
    try{ localStorage.removeItem(SLEUTEL); localStorage.removeItem(SLEUTEL_SPIRAAL); }catch(e){}
    sluit(); herbouw(); toon(); meld('Standaardversie hersteld.');
  },
};
function naDoelWijziging(t){ bewaar(SLEUTEL, aanpassingen); herbouw(); toon(); if(st.open) open(st.open); meld(t); }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if(b && b.tagName !== 'INPUT') acties[b.dataset.act](b);
});
document.addEventListener('change', e => { if(e.target.matches('input[data-act]')) acties[e.target.dataset.act](e.target); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && st.open && !document.querySelector('dialog[open]')) sluit(); });
$('#zoek').addEventListener('input', e => { st.q = e.target.value.trim(); toon(); $('#inhoud').scrollTo(0,0); });
window.addEventListener('popstate', () => { leesAdres(); toon(); });

/* ── Beheer aan en uit (code en knop: digiplan.js) ── */
document.addEventListener('digiplan:beheer', e => {
  if(!e.detail && st.open?.nieuw) sluit();
  st.beheer = e.detail; toon(); if(st.open) open(st.open);
});

st.beheer = Digiplan.beheer;
if(!lj(st.lj)) st.lj = 'L1';
herbouw();
leesAdres();
toon();
