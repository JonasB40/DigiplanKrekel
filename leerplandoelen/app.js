'use strict';
/* Leerplandoelen: vier weergaven op dezelfde data (doelen-data.js en spiraal-data.js). */

const BEHEERCODE = 'krekel'; // eenvoudige drempel, geen echte beveiliging
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
const st = {view:'leerjaar', lj:lees(SLEUTEL_LJ,'L1'), lijn:'alle', ketting:'1-1', fases:new Set(), vol:true, extra:false, q:'', groep:null, open:null, beheer:false};
let aanpassingen = lees(SLEUTEL, {});
let spiraal = lees(SLEUTEL_SPIRAAL, null) || kopie(SPIRAAL);
let doelen = [];

const ljIdx = id => LEERJAREN.findIndex(l => l.id === id);
const lj = id => LEERJAREN[ljIdx(id)];
const lijn = id => LEERLIJNEN.find(l => l.id === id);
const thema = (l,id) => THEMAS[l].find(t => t.id === id);
const doel = code => doelen.find(d => d.code === code);
const ketting = id => KETTINGEN.find(k => k.id === id);
const inKetting = id => doelen.filter(d => (d.kettingen||[]).includes(id));
const inThema = (l,id) => doelen.filter(d => d.lijn === l && d.thema === id).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj));
const groepVan = tl => SPIRAAL_GROEPEN.find(g => g.tls.includes(tl));
const spThema = id => SPIRAAL_THEMAS.find(t => t.id === id);
const aantal = n => n === 1 ? '1 doel' : n + ' doelen';

function herbouw(){
  doelen = DOELEN.map(d => ({...d, ...(aanpassingen[d.code]||{})}));
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

  $('#beheerKnop').setAttribute('aria-pressed', st.beheer);
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
    <span class="code">${d.code}${wanneer ? ` <i>· ${lj(d.lj).label}</i>` : ''}</span>
    <span class="tekst">${tekst}</span>
    ${extra && o ? `<span class="extra">${d.onder.map(x => `<b>Ondersteuning:</b> ${esc(x).replace(/\n/g,'<br>')}`).join('<br>')}</span>` : ''}
    ${extra && v ? `<span class="extra">${d.verdiep.map(x => `<b>Verdieping:</b> ${esc(x)}`).join('<br>')}</span>` : ''}
    ${meta && bij ? `<span class="meta">${bij}</span>` : ''}
  </button>`;
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
    const volgende = doelen.filter(d => d.lijn === li.id && ljIdx(d.lj) > ljIdx(st.lj)).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj))[0];
    return `<section class="l-${li.id}"><div class="vak-kop"><h3>${li.icoon} ${li.label}</h3><span>${li.dig} · ${aantal(hier.length)}</span></div>
      ${groepen || `<p class="leeg">Geen doelen die in dit leerjaar starten.${volgende ? ` Eerstvolgende doel: <button type="button" data-act="lj" data-id="${volgende.lj}">${volgende.code} in ${lj(volgende.lj).label}</button>` : ''}</p>`}
      ${loopt.length ? `<p class="leeg loopt">Blijven inoefenen: ${loopt.map(t => `<button type="button" data-act="thema" data-lijn="${li.id}" data-id="${t.id}">${esc(t.label)}</button>`).join(', ')}</p>` : ''}</section>`;
  }).join('');

  return `<div class="stapper">${stapper}</div>
    <div class="lj-kop"><div><h2>${L.label}</h2><p>${L.leeftijd} · fase ${L.fase} · ${aantal(telt(L.id))}</p></div>
      <div class="lj-acties"><label class="vink"><input type="checkbox" data-act="extra" ${st.extra ? 'checked' : ''}> Ondersteuning en verdieping tonen</label>
      <button type="button" class="knop" data-act="print">Afdrukken</button></div></div>
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
      <span>Lees van onder (jong) naar boven. Klik op een thema om het apart te volgen.</span><span class="sleutel">lijn = blijven inoefenen</span>
    </div>
    <div class="matrix l-${li.id} ${st.vol ? '' : 'kort'}" style="grid-template-columns:104px ${maten.map(m => `minmax(${m.min}px,${m.fr}fr)`).join(' ')};min-width:${maten.reduce((a,m) => a + m.min, 104)}px">${h}</div>
    <div class="onderaan l-${li.id}">
      ${uit.length ? `<h3>Uitbreiding, zonder vaste leeftijd</h3><div class="stapel">${uit.map(u => `<div class="kaart l-${u.lijn}"><span class="code">${u.code}</span><span class="tekst">${esc(u.text)}</span></div>`).join('')}</div>` : ''}
      ${zonder.length ? `<p class="leeg">${zonder.map(t => esc(t.label)).join(', ')}: geen eigen leerplandoel in ${li.dig}. De opbouw staat in het <button type="button" data-act="view" data-id="spiraal">spiraalcurriculum</button>.</p>` : ''}
    </div>`;
}

/* ── Weergave 3: kettingen ── */
function vKettingen(){
  const k = ketting(st.ketting), ds = inKetting(k.id);
  const rail = LEERLIJNEN.map(li => {
    const ks = KETTINGEN.filter(x => x.lijn === li.id);
    return `<div class="l-${li.id}"><h3>${li.icoon} ${li.label}</h3>${ks.length
      ? ks.map(x => `<button type="button" data-act="ketting" data-id="${x.id}" ${x.id === k.id ? 'aria-current="true"' : ''}>${esc(x.label)}<span>${inKetting(x.id).length}</span></button>`).join('')
      : `<p>${li.dig} heeft in LeerLokaal geen kettingen. Bekijk de <button type="button" class="tekstknop" data-act="opbouw" data-id="${li.id}" style="display:inline;width:auto;padding:0;border:none;text-decoration:underline;color:var(--l);font-weight:600">verticale opbouw</button>.</p>`}</div>`;
  }).join('');
  let vorige = null;
  const schakels = ds.map((d,i) => {
    const ander = (d.kettingen||[]).filter(x => x !== k.id);
    const w = vorige === d.lj ? '' : `<b>${lj(d.lj).label}</b><span>${lj(d.lj).leeftijd}</span>`;
    vorige = d.lj;
    return `<li><div class="wanneer">${w}</div><div class="nr">${i+1}</div><div>${kaart(d,{extra:true})}${ander.map(x => `<button type="button" class="knop" style="margin-top:6px" data-act="ketting" data-id="${x}">Ook in: ${esc(ketting(x).label)}</button>`).join('')}</div></li>`;
  }).join('');
  return `<div class="ketting-wrap"><div class="rail">${rail}</div>
    <div class="ketting l-${k.lijn}"><h2>${esc(k.label)}</h2>
      <p class="inl">${lijn(k.lijn).dig}, ketting ${k.nr} · ${aantal(ds.length)} van jong naar oud · <a href="${k.url}" target="_blank" rel="noopener">openen in LeerLokaal</a></p>
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
  const patroon = new RegExp('(' + woorden.map(w => w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')','gi');
  const kleur = t => t.split(patroon).map((x,i) => i % 2 ? `<mark>${esc(x)}</mark>` : esc(x)).join('');
  const n = gevonden.length + uit.length;
  return `<div class="zoek-kop"><h2>${n ? aantal(n) + ' gevonden' : 'Niets gevonden'}</h2><p>${n ? 'Er is ook gezocht in ondersteuning, verdieping en minimumdoelen.' : 'Probeer een ander woord of een code zoals B.12.'}</p></div>
    <div class="kolommen" style="--k:3">${LEERLIJNEN.map(li => {
      const ds = gevonden.filter(d => d.lijn === li.id), us = uit.filter(u => u.lijn === li.id);
      return ds.length + us.length ? `<section class="l-${li.id}"><div class="vak-kop"><h3>${li.icoon} ${li.label}</h3><span>${ds.length + us.length}</span></div><div class="stapel" style="margin-top:12px">${ds.map(d => kaart(d,{wanneer:true,zoek:kleur})).join('')}${us.map(u => `<div class="kaart l-${u.lijn}"><span class="code">${u.code} <i>· uitbreiding</i></span><span class="tekst">${kleur(u.text)}</span></div>`).join('')}</div></section>` : '';
    }).join('')}</div>`;
}

/* ── Detailpaneel ── */
let terugNaar = null;
function open(wat, vanaf){
  if(vanaf && !vanaf.closest('#paneel')) terugNaar = vanaf.dataset;
  st.open = wat;
  const p = $('#paneel');
  p.className = wat.lijn ? 'l-' + wat.lijn : '';
  p.innerHTML = {doel:pDoel, thema:pThema, blok:pBlok}[wat.soort](wat);
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
  document.querySelectorAll('#inhoud .kaart[data-id]').forEach(b => b.toggleAttribute('aria-current', false) || (o?.soort === 'doel' && b.dataset.id === o.code && b.setAttribute('aria-current','true')));
  document.querySelectorAll('#inhoud .sp-blok').forEach(b => b.toggleAttribute('aria-current', false) || (o?.soort === 'blok' && +b.dataset.id === o.i && b.setAttribute('aria-current','true')));
}
const pKop = t => `<div class="pn-kop"><h2 tabindex="-1">${t}</h2><button type="button" class="sluit" data-act="sluit">Sluiten</button></div>`;
const pLijst = (titel,items) => items && items.length ? `<section><h3>${titel}</h3><ul>${items.map(x => `<li class="pre">${esc(x)}</li>`).join('')}</ul></section>` : '';
const pReeks = (ds,code) => `<ul class="reeks">${ds.map(d => `<li><button type="button" data-act="doel" data-id="${d.code}" ${d.code === code ? 'aria-current="true"' : ''}><b>${d.lj}</b><span>${esc(d.text)}</span></button></li>`).join('')}</ul>`;
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
    <section><h3>Opbouw in thema ${esc(t.label)}</h3>${pReeks(inThema(d.lijn,d.thema),code)}</section>
    ${blokken.length ? `<section><h3>In het spiraalcurriculum</h3><div class="sp-blokken">${blokken.map(s => `<button type="button" class="sp-blok ${s.type}" style="--g:${groepVan(spThema(s.thema).tl).kleur}" data-act="blok" data-id="${s.i}">${esc(s.label)}</button>`).join('')}</div></section>` : ''}`;
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
  print: () => window.print(),
  sluit: () => sluit(),
  doel: b => st.open?.soort === 'doel' && st.open.code === b.dataset.id && !b.closest('#paneel') ? sluit() : open({soort:'doel', code:b.dataset.id, lijn:doel(b.dataset.id).lijn}, b),
  thema: b => open({soort:'thema', lijn:b.dataset.lijn, id:b.dataset.id}, b),
  blok: b => open({soort:'blok', i:+b.dataset.id}, b),
  blokNieuw: b => open({soort:'blok', nieuw:{thema:'t_apparaat', lj:b.dataset.id, type:'aan', label:'', detail:''}}, b),
  kopieer: b => { const d = doel(b.dataset.id); navigator.clipboard.writeText(`${d.code} ${d.text}`).then(() => meld('Gekopieerd.'), () => meld('Kopiëren lukt niet in deze browser.')); },
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
document.addEventListener('keydown', e => { if(e.key === 'Escape' && st.open && !$('#codeDialoog').open) sluit(); });
$('#zoek').addEventListener('input', e => { st.q = e.target.value.trim(); toon(); $('#inhoud').scrollTo(0,0); });
window.addEventListener('popstate', () => { leesAdres(); toon(); });

/* ── Beheer aan en uit ── */
function zetBeheer(aan){ st.beheer = aan; toon(); if(st.open) open(st.open); }
$('#beheerKnop').addEventListener('click', () => {
  if(st.beheer){ if(st.open?.nieuw) sluit(); zetBeheer(false); return; }
  $('#codeVeld').value = ''; $('#codeFout').textContent = ''; $('#codeDialoog').showModal();
});
$('#codeAnnuleer').addEventListener('click', () => $('#codeDialoog').close());
$('#codeForm').addEventListener('submit', e => {
  e.preventDefault();
  if($('#codeVeld').value !== BEHEERCODE){ $('#codeFout').textContent = 'Deze code klopt niet.'; return; }
  $('#codeDialoog').close(); zetBeheer(true);
});

if(!lj(st.lj)) st.lj = 'L1';
herbouw();
leesAdres();
toon();
