'use strict';
/* Leerplandoelen: drie weergaven op dezelfde data (doelen-data.js, namen-data.js, schoolkettingen-data.js, leesdoelen-data.js en spiraal-data.js). */

const SLEUTEL = 'leerplandoelen_aanpassingen_v1';
const SLEUTEL_SPIRAAL = 'leerlijnViz_spiraal_v4'; // zelfde sleutel als de vroegere leerlijnpagina, zo blijven aanpassingen bewaard
const SLEUTEL_LJ = 'leerplandoelen_leerjaar';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const kopie = x => JSON.parse(JSON.stringify(x));
function lees(sleutel, anders){ try{ const s = localStorage.getItem(sleutel); return s ? JSON.parse(s) : anders; }catch(e){ return anders; } }
function bewaar(sleutel, waarde){ try{ localStorage.setItem(sleutel, JSON.stringify(waarde)); }catch(e){ meld('Bewaren in deze browser lukt niet.'); } }

/* Lange woorden netjes laten afbreken in smalle kolommen */
const AFBREKEN = ['communi|catie|mogelijk|heden','voor|oor|delen','informatie|verwerkings|proces','informatie|verwerking','netwerk|technologieën','systeem|instellingen','informatie|bronnen','patroon|herkenning','communicatie|kanaal','reclame|boodschappen','media|boodschappen','gezondheids|aspecten','veiligheids|aspecten','zoek|resultaten','mappen|structuur','uitvoer|apparaten','invoer|apparaten','computer|code','bestands|naam','basis|principe','basis|vaardigheden','informatie|vaardig','tekst|verwerking','persoons|gegevens','mogelijk|heden','verant|woorde','toe|passingen','zelf|standig','communi|ceren','voor|stelling','Experimen|teren','toetsenbord|gebruik','geluids|fragmenten','bron|vermelding','tekst|verwerking','inhouds|opgave','pagina|opmaak','persoon|lijke','zoek|strategie','bruikbaar|heid','betrouwbaar|heid','professio|neel','apparaat|bediening','samen|werken','school|platform','wacht|woord','touch|screen','media|gebruik','omgangs|vormen','lastig|vallen','stappen|plan','ontwik|kelen','formu|leren','kennis|maken','beoor|delen','presen|tatie','multi|media','struc|tureren','informa|tie','vorm|geven','raad|plegen','hallu|cinatie','genera|tieve','opbou|wen','denk|werk','uit|breiding'];
const zacht = s => AFBREKEN.reduce((t,w) => t.replace(new RegExp(w.replaceAll('|',''),'gi'), m => {
  let i = 0; return w.split('|').map(d => m.slice(i, i += d.length)).join('­');
}), s);

/* ── Toestand ── */
const WEERGAVEN = {leerjaar:'Per leerjaar', opbouw:'Opbouw', kettingen:'Kettingen'};
const st = {view:'leerjaar', lj:lees(SLEUTEL_LJ,'L1'), lijn:'alle', ketting:'1-1', klas:null, bron:'stappen', jaren:new Set(), rijen:new Set(), stap:null, extra:false, ai:true, q:'', aiThema:null, toets:null, open:null, beheer:false};
let aanpassingen = lees(SLEUTEL, {});
let spiraal = lees(SLEUTEL_SPIRAAL, null) || kopie(SPIRAAL);
/* staan de stappen al in deze browser, zet dan de nieuwe standaardstappen erbij */
(() => {
  const was = lees(SLEUTEL_SPIRAAL + '_versie', 1);
  if(was >= SPIRAAL_VERSIE) return;
  SPIRAAL.filter(s => (s.v || 1) > was && !spiraal.some(x => x.thema === s.thema && x.label === s.label)).forEach(s => spiraal.push(kopie(s)));
  if(lees(SLEUTEL_SPIRAAL, null)) bewaar(SLEUTEL_SPIRAAL, spiraal);
  bewaar(SLEUTEL_SPIRAAL + '_versie', SPIRAAL_VERSIE);
})();
let doelen = [];

const ljIdx = id => LEERJAREN.findIndex(l => l.id === id);
const lj = id => LEERJAREN[ljIdx(id)];
const lijn = id => LEERLIJNEN.find(l => l.id === id);
const AI_LEERLIJN = {id:'ai', dig:'AI', label:'AI-leerlijn van de school', kort:'AI', icoon:'🤖'};
const balk = id => id === 'ai' ? AI_LEERLIJN : lijn(id);
const thema = (l,id) => THEMAS[l].find(t => t.id === id);
const doel = code => doelen.find(d => d.code === code);
const KETTINGLIJST = [...KETTINGEN, ...SCHOOLKETTINGEN];
const ketting = id => KETTINGLIJST.find(k => k.id === id);
const inKetting = id => id === 's-ai' ? AI_DOELEN : doelen.filter(d => (d.kettingen||[]).includes(id));
/* alles wat in een ketting zit, ook de leesdoelen bij Digitale toetsen */
const alInKetting = id => id === 's-toets' ? [...inKetting(id), ...LEESDOELEN] : inKetting(id);
const leesDoel = code => LEESDOELEN.find(d => d.code === code);
const leesBij = code => LEESDOELEN.filter(d => d.bij.includes(code));
const mdTekst = m => MINIMUMDOELEN[m] || LEES_MINIMUMDOELEN[m] || '';
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
const naam = code => aanpassingen[code]?.naam || KORTE_NAMEN[code] || code;
/* eerder gestart en nu geen nieuwe stap: blijven oefenen */
const oefent = (ix,i) => ix.length > 0 && i > Math.min(...ix) && !ix.includes(i);

function herbouw(){
  doelen = DOELEN.map(d => {
    const school = SCHOOLKETTINGEN.filter(k => (k.codes||[]).includes(d.code)).map(k => k.id);
    return {...d, ...(aanpassingen[d.code]||{}), ...(school.length ? {kettingen:[...(d.kettingen||[]), ...school]} : {})};
  });
}

/* ── Adres: #leerjaar/L3/ict · #opbouw/cd · #opbouw/ictdoelen/L3 (klas) · #opbouw/alle · #opbouw/cd/algo (thema open) · #kettingen/1-2 ── */
function leesAdres(){
  let [v,a,b] = decodeURIComponent(location.hash.slice(1)).split('/');
  if(v === 'spiraal') v = 'opbouw'; // oude naam
  if(!WEERGAVEN[v]) return;
  st.view = v;
  if(v === 'leerjaar'){ if(lj(a)) st.lj = a; st.lijn = lijn(b) ? b : 'alle'; }
  if(v === 'opbouw'){
    const l = (a || '').replace(/doelen$/, '');
    st.bron = l === a ? 'stappen' : 'doelen';
    st.lijn = l === 'alle' || balk(l) ? l : 'ict';
    st.klas = lj(b) ? b : null;
    if(b && !st.klas) st.rijen.add(bronNaam() + '-' + b);
  }
  if(v === 'kettingen' && ketting(a)) st.ketting = a;
}
function adres(){
  if(st.view === 'leerjaar') return `#leerjaar/${st.lj}` + (st.lijn === 'alle' ? '' : '/' + st.lijn);
  if(st.view === 'opbouw') return `#opbouw/${bronNaam()}` + (st.klas ? '/' + st.klas : '');
  return `#kettingen/${st.ketting}`;
}
function ga(wijziging){
  const andereView = wijziging.view && wijziging.view !== st.view;
  Object.assign(st, wijziging);
  if(andereView && st.view === 'opbouw' && st.lijn === 'alle') st.lijn = 'ict';
  if(st.view === 'leerjaar' && st.lijn === 'ai') st.lijn = 'alle';
  if(wijziging.lj) bewaar(SLEUTEL_LJ, st.lj);
  if(st.q){ st.q = ''; $('#zoek').value = ''; }
  if(adres() !== location.hash) history.pushState(null, '', adres());
  toon();
  if(andereView || wijziging.lj || wijziging.ketting || wijziging.lijn || 'klas' in wijziging) $('#inhoud').scrollTo(0,0);
  // op een smal scherm staat de lijst met kettingen boven de ketting zelf
  if(wijziging.ketting && innerWidth <= 860) $('.ketting').scrollIntoView();
}

/* ── Tekenen ── */
function toon(){
  const focus = document.activeElement?.dataset; // na het hertekenen terug naar dezelfde knop
  document.body.dataset.view = st.q ? 'zoek' : st.view;
  $('#tabs').innerHTML = Object.entries(WEERGAVEN).map(([id,label]) =>
    `<button type="button" data-act="view" data-id="${id}" ${!st.q && st.view === id ? 'aria-current="page"' : ''}>${label}</button>`).join('');

  const keuze = st.view === 'leerjaar' ? ['alle', ...LEERLIJNEN.map(l => l.id)] : st.view === 'opbouw' ? ['alle', ...LEERLIJNEN.map(l => l.id), 'ai'] : [];
  $('#lijnen').innerHTML = st.q ? '' : keuze.map(id =>
    `<button type="button" class="${id === 'alle' ? '' : 'l-' + id}" data-act="lijn" data-id="${id}" aria-pressed="${st.lijn === id}">${id === 'alle' ? 'Alle leerlijnen' : balk(id).icoon + ' ' + balk(id).kort}</button>`).join('');

  const n = Object.keys(aanpassingen).length;
  $('#beheerBalk').hidden = !st.beheer;
  $('#beheerBalk').innerHTML = st.beheer ? `<p><b>Beheer staat aan.</b> Open een doel of stap om het aan te passen. Wijzigingen blijven in deze browser tot je ze publiceert. ${n ? aantal(n) + ' aangepast.' : ''}</p>
    <button type="button" class="knop" data-act="download">Aanpassingen downloaden</button>
    <button type="button" class="knop weg" data-act="herstel">Alles herstellen</button>` : '';

  $('#inhoud').innerHTML = st.q ? vZoek() : {leerjaar:vLeerjaar, opbouw:vOpbouw, kettingen:vKettingen}[st.view]();
  markeer();
  if(focus?.act && !document.activeElement?.dataset.act) [...document.querySelectorAll(`[data-act="${focus.act}"]`)].find(b => b.dataset.id === focus.id)?.focus({preventScroll:true});
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

/* een leesdoel uit de leerlijn Nederlands */
function kaartLees(d, {wanneer = false, zoek = null} = {}){
  return `<button type="button" class="kaart l-lees" data-act="lees" data-id="${d.code}">
    <span class="code">${d.code}${wanneer ? ` <i>· ${lj(d.lj).label}</i>` : ''}<span class="ai-label">Lezen</span></span>
    <span class="tekst">${zoek ? zoek(d.text) : zacht(esc(d.text))}</span>
    <span class="extra"><b>Bij digitaal toetsen:</b> ${esc(d.waarom)}</span>
    <span class="meta">${[d.bij.length ? 'Samen met ' + d.bij.join(', ') : '', d.drager ? 'LeerLokaal: ' + d.drager : '', (d.md||[]).join(', ')].filter(Boolean).join(' · ')}</span></button>`;
}

/* klassen per fase, met het aantal doelen of stappen */
function stapper(act, gekozen, telt, noem = aantal){
  return `<div class="stapper">${[1,2,3,4].map(f => {
    const js = LEERJAREN.filter(l => l.fase === f);
    return `<fieldset style="--n:${js.length}"><legend>Fase ${f}</legend>${js.map(l =>
      `<button type="button" data-act="${act}" data-id="${l.id}" aria-pressed="${l.id === gekozen}" aria-label="${l.label}, ${noem(telt(l.id))}" title="${l.label}"><b>${l.id}</b><small>${telt(l.id)}</small></button>`).join('')}</fieldset>`;
  }).join('')}</div>`;
}

/* ── Weergave 1: per leerjaar ── */
function vLeerjaar(){
  const lijnen = st.lijn === 'alle' ? LEERLIJNEN : [lijn(st.lijn)];
  const telt = id => doelen.filter(d => d.lj === id && (st.lijn === 'alle' || d.lijn === st.lijn)).length;
  const L = lj(st.lj);
  const vakken = lijnen.map(li => {
    const hier = doelen.filter(d => d.lj === st.lj && d.lijn === li.id);
    const groepen = THEMAS[li.id].map(t => {
      const ds = hier.filter(d => d.thema === t.id);
      return ds.length ? `<div class="groep"><h4><button type="button" data-act="thema" data-lijn="${li.id}" data-id="${t.id}" title="Toon de opbouw van dit thema">${esc(t.label)}</button></h4><div class="stapel">${ds.map(d => kaart(d,{extra:st.extra})).join('')}</div></div>` : '';
    }).join('');
    const loopt = THEMAS[li.id].filter(t => oefent(inThema(li.id,t.id).map(d => ljIdx(d.lj)), ljIdx(st.lj)));
    const ai = st.ai ? AI_DOELEN.filter(d => aiInLijn(d,li.id) && (d.fase === String(L.fase) || (d.fase === 'U' && L.fase === 4))) : [];
    const volgende = doelen.filter(d => d.lijn === li.id && ljIdx(d.lj) > ljIdx(st.lj)).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj))[0];
    return `<section class="l-${li.id}"><div class="vak-kop"><span class="icoon" aria-hidden="true">${li.icoon}</span><span class="label">${li.dig} · ${aantal(hier.length)}</span><h3>${li.label}</h3></div>
      ${groepen || `<p class="leeg">Geen doelen die in dit leerjaar starten.${volgende ? ` Eerstvolgende doel: <button type="button" data-act="lj" data-id="${volgende.lj}">${volgende.code} in ${lj(volgende.lj).label}</button>` : ''}</p>`}
      ${ai.length ? `<div class="groep ai-groep"><h4><button type="button" data-act="ketting" data-id="s-ai" title="Open de ketting AI">AI-leerlijn van de school, fase ${L.fase}</button></h4><div class="stapel">${ai.map(d => kaartAi(d,{wanneer:d.fase === 'U'})).join('')}</div></div>` : ''}
      ${loopt.length ? `<p class="leeg loopt">Blijven oefenen: ${loopt.map(t => `<button type="button" data-act="thema" data-lijn="${li.id}" data-id="${t.id}">${esc(t.label)}</button>`).join(', ')}</p>` : ''}</section>`;
  }).join('');

  return `${stapper('lj', st.lj, telt)}
    <div class="lj-kop"><div><h2>${L.label}</h2><p>${L.leeftijd} · fase ${L.fase} · ${aantal(telt(L.id))}</p></div>
      <div class="lj-opties"><label class="vink"><input type="checkbox" data-act="extra" ${st.extra ? 'checked' : ''}> Ondersteuning en verdieping</label>
      <label class="vink"><input type="checkbox" data-act="aiToon" ${st.ai ? 'checked' : ''}> AI-leerlijn</label>${AI_LEGENDE}</div></div>
    <div class="kolommen ${lijnen.length === 1 ? 'een' : ''}" style="--k:${lijnen.length}">${vakken}</div>`;
}

/* ── Weergave 2: opbouw ──
   Een raster per leerlijn: rijen zijn thema's, kolommen de klassen van jong naar oud.
   Klik op een thema: de trap van dat thema. Klik op een klas: kennen ze al, dit jaar, daarna. */
const UIT = LEERJAREN.length; // kolom na het 6de leerjaar, voor de uitbreiding van de AI-leerlijn
/* kleur per thema in de opbouw; de AI-leerlijn houdt roze (link) en oranje (eigen doel) */
const KLEUR = {basis:'blauw', systeem:'blauw', digisys:'bruin', info:'groen', communiceren:'paars', tekst:'turkoois', foto:'koraal', presenteren:'goud', bestanden:'limoen', zelf:'pruim',
  patroon:'paars', decom:'koraal', abstract:'turkoois', algo:'blauw', code:'groen', debug:'goud',
  media:'turkoois', veilig:'koraal', privacy:'paars', etiquette:'goud', kritisch:'blauw', gezond:'groen', regelgeving:'pruim'};
const bronNaam = (l = st.lijn) => l + (['ict','alle'].includes(l) && st.bron === 'doelen' ? 'doelen' : '');
/* de gekozen leerjaren als kolomnummers; niets gekozen is alles */
const kolommen = () => LEERJAREN.flatMap((l,i) => !st.jaren.size || st.jaren.has(l.id) ? [i] : []);
const metUitbreiding = () => !st.jaren.size || kolommen().some(i => LEERJAREN[i].fase === 4);
const inBeeld = x => x.van === UIT ? metUitbreiding() : kolommen().some(i => i >= x.van && i <= x.tot);
/* een thema staat in het raster zodra het in de gekozen leerjaren gestart is */
const gestart = r => !r.stappen.length || r.stappen[0].van <= kolommen().at(-1);
const doelenBijStap = s => s.doelen ? doelen.filter(d => s.doelen.includes(d.code)) : doelen.filter(d => d.lj === s.lj && (SPIRAAL_DOELEN[s.thema]||[]).includes(d.code));

/* rijen: {id, lijn, label, info, groep, stappen:[{van, tot, soort, naam, en blok | doel | ai}]} */
function rijenVan(l = st.lijn){
  if(l === 'alle') return ['ict','cd','media','ai'].flatMap(x => rijenVan(x));
  const rij = (t, groep, stappen) => {
    stappen.sort((a,b) => a.van - b.van);
    stappen.forEach(x => { x.soort = x.soort || (x.van === stappen[0].van ? 'nieuw' : 'bouw'); });
    return {id:bronNaam(l) + '-' + t.id, lijn:l, thema:t.id, label:t.label, info:t.info, groep, stappen, kleur:l === 'ai' ? 'l-ai' : 'k-' + KLEUR[t.tl || t.id]};
  };
  if(l === 'ai') return AI_THEMAS.map(t => rij(t, '', t.doelen.map(aiDoel).map(d => {
    const ix = LEERJAREN.flatMap((x,i) => String(x.fase) === d.fase ? [i] : []);
    return {van:ix.length ? ix[0] : UIT, tot:ix.length ? ix.at(-1) : UIT, naam:naam(d.code), ai:d};
  })));
  if(bronNaam(l) === 'ict') return SPIRAAL_THEMAS.map(t => rij(t, groepVan(t.tl).label, spiraal.flatMap((s,i) =>
    s.thema === t.id ? [{van:ljIdx(s.lj), tot:ljIdx(s.lj), soort:s.type === 'aan' ? 'nieuw' : 'bouw', naam:s.label, blok:i}] : [])));
  return THEMAS[l].map(t => rij(t, '', inThema(l,t.id).map(d => ({van:ljIdx(d.lj), tot:ljIdx(d.lj), naam:naam(d.code), doel:d}))));
}
const wanneer = (x,kort) => x.van === UIT ? 'Uitbreiding' : x.van === x.tot ? LEERJAREN[x.van][kort ? 'id' : 'label'] : `Fase ${LEERJAREN[x.van].fase} · ${LEERJAREN[x.van].id} ${x.tot - x.van > 1 ? 'tot' : 'en'} ${LEERJAREN[x.tot].id}`;
const stapKlas = x => `stap ${x.soort}${x.ai ? ' ai-' + aiSoort(x.ai) : ''}`;
const stapTekst = x => `${x.soort === 'nieuw' ? '<i>Nieuw</i>' : ''}${zacht(esc(x.naam))}${x.doel ? aiTeken(x.doel.code) : ''}`;
/* het detail van een stap openen in het zijpaneel */
const stapOpent = x => x.ai ? `data-act="ai" data-id="${x.ai.code}"` : x.doel ? `data-act="doel" data-id="${x.doel.code}"` : `data-act="blok" data-id="${x.blok}"`;
/* de volledige inhoud van een stap, in de trap en in de klasweergave */
function stapInhoud(x){
  if(x.ai) return kaartAi(x.ai);
  if(x.doel) return kaart(x.doel);
  const s = spiraal[x.blok], ds = doelenBijStap(s);
  return `${s.detail ? `<p class="pre">${esc(s.detail)}</p>` : ''}
    ${ds.length ? `<p class="codes">${ds.map(d => `<button type="button" data-act="doel" data-id="${d.code}" title="${esc(d.text)}">${d.code}</button>`).join('')}</p>` : ''}
    ${st.beheer ? `<button type="button" class="knop" data-act="blok" data-id="${x.blok}">Aanpassen</button>` : ''}`;
}

const legende = () => `<span class="leg nieuw">nieuw</span><span class="leg">verder bouwen</span><span class="leg oefen">blijven oefenen</span>${bronNaam() === 'ict' ? '' : AI_LEGENDE}`;
function vOpbouw(){
  const ict = ['ict','alle'].includes(st.lijn), stappen = st.bron === 'stappen';
  const rijen = rijenVan(), gevuld = rijen.filter(r => r.stappen.length || (st.beheer && r.id.startsWith('ict-')));
  const bron = ict ? `<div class="keuze" role="group" aria-label="Wat toont het raster voor ICT?"><button type="button" data-act="bron" data-id="stappen" aria-pressed="${stappen}">Stappen van de school</button><button type="button" data-act="bron" data-id="doelen" aria-pressed="${!stappen}">Leerplandoelen</button></div>` : '';
  if(st.klas) return `<div class="opbouw l-${st.lijn}">${klasKop(gevuld)}<div class="ctx">${bron}${legende()}</div>${vKlas(gevuld)}</div>`;
  return `<div class="opbouw l-${st.lijn}"><div class="ctx">${bron}${filterBalk()}</div>${vRaster(gevuld)}${onderOpbouw(rijen)}</div>`;
}

/* ── Filter op fase en leerjaar ── */
function filterBalk(){
  return `<div class="op-filter" role="group" aria-label="Toon enkel deze fases of leerjaren">
    <button type="button" data-act="filter" data-id="" aria-pressed="${!st.jaren.size}">Alles</button>${[1,2,3,4].map(f => {
      const js = LEERJAREN.filter(l => l.fase === f);
      return `<span class="of-fase"><button type="button" data-act="filter" data-id="${f}" aria-pressed="${js.every(l => st.jaren.has(l.id))}">Fase ${f}</button>${js.map(l =>
        `<button type="button" data-act="filter" data-id="${l.id}" aria-pressed="${st.jaren.has(l.id)}" title="${l.label}">${l.id}</button>`).join('')}</span>`;
    }).join('')}</div>`;
}
/* de gekozen leerjaren in woorden: "fase 3" of "L2 en L3" */
function filterNaam(){
  const fases = [1,2,3,4].filter(f => LEERJAREN.filter(l => l.fase === f).every(l => st.jaren.has(l.id)));
  const los = LEERJAREN.filter(l => st.jaren.has(l.id) && !fases.includes(l.fase)).map(l => l.id);
  return [...fases.map(f => 'fase ' + f), ...los].join(', ').replace(/, ([^,]*)$/, ' en $1');
}

/* ── Raster ── */
function vRaster(rijen){
  const zicht = rijen.filter(gestart), straks = rijen.filter(r => !gestart(r)), alles = zicht.every(r => st.rijen.has(r.id));
  const wat = {ict:'<b>Stappen van de school</b>: onze eigen invulling met concrete voorbeelden, gekoppeld aan het leerplan.', ictdoelen:'<b>Leerplandoelen</b>: de officiële doelen van LeerLokaal, met hun code en minimumdoelen.',
    alle:'<b>Alle leerlijnen</b>, met de stappen van de school bij ICT.', alledoelen:'<b>Alle leerlijnen</b>, met de leerplandoelen bij ICT.'}[bronNaam()];
  return `<div class="op-uitleg"><p>${wat ? wat + '<br>' : ''}Klik op een <b>thema</b> of <b>stap</b> voor de uitleg, of op een <b>klas</b> voor kennen ze al, dit jaar en daarna.</p>
      <div class="op-rechts">${legende()}<button type="button" class="knop" data-act="alles" data-id="${alles ? '' : 'open'}">${alles ? 'Alle thema’s sluiten' : 'Alle thema’s openen'}</button></div></div>
    ${rasterTabel(zicht)}
    ${straks.length && straks.length <= 10 ? `<p class="op-straks"><b>Nog niet gestart in ${filterNaam()}:</b> ${straks.map(r => `${esc(r.label)} <span>(vanaf ${wanneer(r.stappen[0],true)})</span>`).join(', ')}</p>` : ''}`;
}
function rasterTabel(rijen){
  const kol = kolommen(), metU = rijen.some(r => r.lijn === 'ai') && metUitbreiding(), cols = metU ? [...kol, UIT] : kol, breed = cols.length + 1;
  const grens = i => i === UIT || i === cols[0] || LEERJAREN[i].fase !== LEERJAREN[cols[cols.indexOf(i) - 1]].fase ? ' grens' : '';
  const fases = [1,2,3,4].map(f => ({van:LEERJAREN.findIndex(l => l.fase === f), f, cols:kol.filter(i => LEERJAREN[i].fase === f)})).filter(v => v.cols.length);
  const perJaar = cols.map(i => ({van:i, cols:[i]})), perFase = [...fases, ...(metU ? [{van:UIT, cols:[UIT]}] : [])];
  const kop = `<thead><tr class="fasen"><td></td>${fases.map(v => `<th class="grens" scope="colgroup" colspan="${v.cols.length}">Fase ${v.f}</th>`).join('')}${metU ? '<th class="grens" scope="col" rowspan="2">Uit&shy;breiding<small>5de en 6de leerjaar</small></th>' : ''}</tr>
    <tr><th class="hoek" scope="col">Thema</th>${kol.map(i => { const l = LEERJAREN[i]; return `<th class="klaskop${grens(i)}" scope="col"><button type="button" data-act="klas" data-id="${l.id}" aria-label="${l.label}" title="${l.label}: kennen ze al, dit jaar en daarna"><b>${l.id}</b><small>${l.leeftijd}</small></button></th>`; }).join('')}</tr></thead>`;
  let groep = '', vorige = '';
  const lijf = rijen.map(r => {
    const lijnRij = st.lijn === 'alle' && r.lijn !== vorige ? `<tr class="lijn-rij l-${r.lijn}"><th scope="rowgroup" colspan="${breed}"><span><i aria-hidden="true">${balk(r.lijn).icoon}</i>${balk(r.lijn).label}${r.lijn === 'ict' ? ` <small>${st.bron === 'doelen' ? 'leerplandoelen' : 'stappen van de school'}</small>` : ''}</span></th></tr>` : '';
    const groepRij = r.groep && r.groep !== groep ? `<tr class="groep-rij ${r.kleur}"><th scope="rowgroup" colspan="${breed}"><span>${esc(r.groep)}</span></th></tr>` : '';
    groep = r.groep; vorige = r.lijn;
    const open = st.rijen.has(r.id), eerste = r.stappen.length ? r.stappen[0].van : Infinity;
    const einde = metU && r.stappen.some(x => x.van === UIT) ? UIT : kol.at(-1);
    const cellen = (r.lijn === 'ai' ? perFase : perJaar).map(v => {
      const hier = r.stappen.map((x,k) => ({x,k})).filter(({x}) => x.van === v.van);
      const oefen = v.van > eerste && !hier.length && v.van !== UIT, slot = v.cols.includes(einde);
      const spoor = v.van === eerste ? (slot ? '' : ' van') : oefen ? ' door oefen' : v.van > eerste && hier.length ? (slot ? ' tot' : ' door') : '';
      return `<td class="${(grens(v.cols[0]) + spoor).trim()}" colspan="${v.cols.length}">${hier.map(({x,k}) =>
        `<button type="button" class="${stapKlas(x)}" data-act="stap" data-id="${r.id}:${k}" aria-pressed="${st.stap === r.id + ':' + k}">${stapTekst(x)}</button>`).join('')}${oefen ? '<span class="sr">blijven oefenen</span>' : ''}</td>`;
    }).join('');
    return `${lijnRij}${groepRij}<tr class="thema-rij ${r.kleur}${open ? ' open' : ''}"><th scope="row"><button type="button" data-act="rij" data-id="${r.id}" aria-expanded="${open}"><span>${groepRij ? `<small class="th-groep">${esc(r.groep)}</small>` : ''}${zacht(esc(r.label))}</span></button></th>${cellen}</tr>` +
      (open ? `<tr class="trap-rij ${r.kleur}"><td colspan="${breed}">${trap(r)}</td></tr>` : '');
  }).join('');
  return `<table class="raster" style="min-width:${172 + cols.length * 106}px;max-width:${Math.max(720, 172 + cols.length * 400)}px"><colgroup><col class="thema">${'<col>'.repeat(breed - 1)}</colgroup>${kop}<tbody>${lijf}</tbody></table>`;
}

/* ── Trap: elke trede is een leerjaar, van links (jong) naar rechts (oud) ── */
function trap(r){
  const treden = [], zicht = r.stappen.filter(inBeeld); // met een filter enkel de gekozen jaren, tenzij daar niets nieuws is
  r.stappen.forEach((x,k) => {
    if(zicht.length && !zicht.includes(x)) return;
    if(treden.at(-1)?.van !== x.van) treden.push({van:x.van, x, stappen:[]});
    treden.at(-1).stappen.push({x,k});
  });
  return `<div class="trap">${r.info ? `<p class="trap-info">${esc(r.info)}</p>` : ''}
    <ol style="--n:${treden.length}">${treden.map((t,i) => `<li class="${t.x.soort}" style="--k:${i}"><h4>${wanneer(t.x)}${t.x.soort === 'nieuw' ? ' <i>Nieuw</i>' : ''}</h4>${t.stappen.map(({x,k}) =>
      `<div class="tr-stap${st.stap === r.id + ':' + k ? ' gekozen' : ''}"><b>${esc(x.naam)}</b>${stapInhoud(x)}</div>`).join('')}</li>`).join('')}</ol>
    ${st.beheer && r.id.startsWith('ict-') ? `<button type="button" class="knop" data-act="blokNieuw" data-id="${r.thema}">+ Stap toevoegen</button>` : ''}</div>`;
}

/* ── Klas: kennen ze al, dit jaar, daarna ── */
function verdeel(rijen){
  const i = ljIdx(st.klas);
  return rijen.map(r => ({r, eerder:r.stappen.filter(x => x.tot < i), nu:r.stappen.filter(x => x.van <= i && x.tot >= i), later:r.stappen.filter(x => x.van > i)}));
}
function klasKop(rijen){
  const L = lj(st.klas), nu = verdeel(rijen).flatMap(x => x.nu), nieuw = nu.filter(x => x.soort === 'nieuw').length;
  const telt = id => { const i = ljIdx(id); return rijen.flatMap(r => r.stappen).filter(x => x.van <= i && x.tot >= i).length; };
  return `${stapper('klas', st.klas, telt, bronNaam() === 'ict' || st.lijn === 'alle' ? n => n === 1 ? '1 stap' : n + ' stappen' : aantal)}
    <div class="lj-kop"><div><h2>${L.label}</h2><p>${L.leeftijd} · fase ${L.fase} · ${nu.length ? `${nieuw ? nieuw + ' nieuw, ' : ''}${nu.length - nieuw} verder bouwen` : 'geen nieuwe stap dit jaar'}</p></div>
      <button type="button" class="knop" data-act="klas" data-id="">← Terug naar het raster</button></div>`;
}
function vKlas(rijen){
  const L = lj(st.klas), per = verdeel(rijen);
  const mini = xs => xs.map(x => `<button type="button" class="${stapKlas(x)} mini" ${stapOpent(x)}><em>${wanneer(x,true)}</em>${zacht(esc(x.naam))}</button>`).join('');
  const rij = ({r,eerder,nu,later}) => {
    const laatste = eerder.filter(x => x.tot === eerder.at(-1).tot), eerst = later.filter(x => x.van === later[0].van);
    const meer = eerder.length - laatste.length;
    return `<tr class="klas-rij ${r.kleur}"><th scope="row"><button type="button" data-act="naarRij" data-id="${r.id}" title="Toon de trap van dit thema">${zacht(esc(r.label))}${st.lijn === 'alle' ? `<small>${balk(r.lijn).kort}</small>` : ''}</button></th>
      <td data-kop="Kennen ze al">${mini(laatste)}${meer ? `<button type="button" class="tekstknop" data-act="naarRij" data-id="${r.id}">+ ${meer} eerder</button>` : ''}${eerder.length ? '' : '<span class="niets">Nog niets</span>'}</td>
      <td class="nu" data-kop="Dit jaar">${nu.map(x => `<div class="tr-stap ${x.soort}"><b>${x.soort === 'nieuw' ? '<i>Nieuw</i>' : ''}${esc(x.naam)}</b>${stapInhoud(x)}</div>`).join('')}${nu.length ? '' : eerder.length ? '<span class="oefenen">Blijven oefenen</span>' : '<span class="niets">Start later</span>'}</td>
      <td data-kop="Daarna">${mini(eerst)}${later.length ? '' : `<span class="niets">${st.klas === LEERJAREN.at(-1).id ? 'Geen volgende stap' : 'Blijven oefenen'}</span>`}</td></tr>`;
  };
  const deel = (titel, lijst) => lijst.length ? `<tbody><tr class="groep-rij"><th scope="rowgroup" colspan="4"><span>${titel}</span></th></tr>${lijst.map(rij).join('')}</tbody>` : '';
  return `<table class="klas"><thead><tr><th scope="col">Thema</th><th scope="col">Kennen ze al</th><th scope="col">Dit jaar, ${L.label}</th><th scope="col">Daarna</th></tr></thead>
    ${deel('Dit jaar aan bod', per.filter(x => x.nu.length))}${deel('Blijven oefenen', per.filter(x => !x.nu.length && x.eerder.length))}${deel('Start later', per.filter(x => !x.nu.length && !x.eerder.length))}</table>`;
}

function onderOpbouw(rijen){
  if(st.lijn === 'alle' || st.jaren.size) return '';
  const li = balk(st.lijn), stappen = bronNaam() === 'ict';
  const uit = stappen ? [] : UITBREIDING.filter(u => u.lijn === li.id);
  const zonder = stappen ? [] : rijen.filter(r => !r.stappen.length);
  const gedekt = new Set(spiraal.flatMap(s => doelenBijStap(s).map(d => d.code)));
  const los = stappen ? doelen.filter(d => d.lijn === 'ict' && !gedekt.has(d.code)) : [];
  if(!uit.length && !zonder.length && !los.length) return '';
  return `<div class="onderaan l-${li.id}">
    ${los.length ? `<h3>Leerplandoelen zonder eigen stap van de school</h3><p class="codes">${los.map(d => `<button type="button" data-act="doel" data-id="${d.code}" title="${esc(d.text)}">${d.code} <small>${esc(naam(d.code))} (${d.lj})</small></button>`).join('')}</p>` : ''}
    ${uit.length ? `<h3>Uitbreiding, zonder vaste leeftijd</h3><div class="stapel">${uit.map(u => `<div class="kaart l-${u.lijn}"><span class="code">${u.code}</span><span class="tekst">${esc(u.text)}</span></div>`).join('')}</div>` : ''}
    ${zonder.length ? `<p class="leeg">${zonder.map(r => esc(r.label)).join(', ')}: geen eigen leerplandoel in ${li.dig}. De opbouw staat bij <button type="button" data-act="bron" data-id="stappen">Stappen van de school</button>.</p>` : ''}</div>`;
}

/* ── Weergave 3: kettingen ── */
/* de schakels van een ketting, van jong naar oud: {wie, leeftijd, html} */
function schakelsVan(k){
  if(k.id === 's-ai')
    return AI_DOELEN.filter(d => !st.aiThema || d.themas.includes(st.aiThema)).map(d => ({wie:aiFase(d.fase).label, leeftijd:aiFase(d.fase).leeftijd, html:kaartAi(d)}));
  const toets = k.id === 's-toets' ? st.toets : null;
  const rij = (toets === 'lees' ? [] : inKetting(k.id)).map(d => ({i:ljIdx(d.lj), wie:lj(d.lj).label, leeftijd:lj(d.lj).leeftijd, html:kaart(d,{extra:true}) +
    (d.kettingen||[]).filter(x => x !== k.id).map(x => `<button type="button" class="knop ook" data-act="ketting" data-id="${x}">Ook in: ${esc(ketting(x).label)}</button>`).join('')}));
  if(k.id === 's-toets' && toets !== 'ict') LEESDOELEN.forEach(d => rij.push({i:ljIdx(d.lj), lees:true, wie:lj(d.lj).label, leeftijd:lj(d.lj).leeftijd, html:kaartLees(d)}));
  (k.mijlpalen||[]).filter(m => !toets || !!m.lees === (toets === 'lees')).forEach(m => rij.push({i:ljIdx(m.lj) + .5, lees:m.lees, wie:'Einde ' + lj(m.lj).label, leeftijd:'minimumdoel', mijlpaal:true, html:mijlpaal(m)}));
  return rij.sort((a,b) => a.i - b.i);
}
function mijlpaal(m){
  const ds = (m.lees ? LEESDOELEN : doelen).filter(d => (d.md||[]).includes(m.md));
  return `<div class="mijlpaal${m.lees ? ' l-lees' : ''}"><span class="code">${m.md}${m.lees ? '<span class="ai-label">Lezen</span>' : ''}</span><span class="pre">${esc(mdTekst(m.md))}</span>
    <span class="meta">${m.lees ? 'Leesdoelen in deze ketting' : 'Leerplandoelen'}: ${ds.map(d => `<button type="button" data-act="${m.lees ? 'lees' : 'doel'}" data-id="${d.code}">${d.code.replace(/^(DIG 1|NED stv 2) /,'')}</button>`).join(', ')}</span></div>`;
}
function vKettingen(){
  const k = ketting(st.ketting), school = k.lijn === 'school', ds = alInKetting(k.id);
  const railKnop = x => `<button type="button" data-act="ketting" data-id="${x.id}" ${x.id === k.id ? 'aria-current="true"' : ''}>${esc(x.label)}<span>${alInKetting(x.id).length}</span></button>`;
  const rail = `<div class="l-school"><h3>🏫 Van de school</h3>${SCHOOLKETTINGEN.map(railKnop).join('')}</div>` + LEERLIJNEN.map(li => {
    const ks = KETTINGEN.filter(x => x.lijn === li.id);
    return `<div class="l-${li.id}"><h3>${li.icoon} ${li.label}</h3>${ks.length ? ks.map(railKnop).join('')
      : `<p>${li.dig} heeft in LeerLokaal geen kettingen. Bekijk de <button type="button" class="tekstknop" data-act="opbouw" data-id="${li.id}">opbouw</button>.</p>`}</div>`;
  }).join('');

  let vorige = null, nr = 0;
  const schakels = schakelsVan(k).map(x => {
    const w = vorige === x.wie ? '' : `<b>${x.wie}</b><span>${x.leeftijd}</span>`;
    vorige = x.wie;
    return `<li class="${x.mijlpaal ? 'is-mijlpaal' : ''}${x.lees ? ' l-lees' : ''}"><div class="wanneer">${w}</div><div class="nr">${x.mijlpaal ? '★' : ++nr}</div><div>${x.html}</div></li>`;
  }).join('');
  const inleiding = school
    ? `${esc(k.info)} ${k.id === 's-toets' ? `${inKetting(k.id).length} ICT-doelen, ${LEESDOELEN.length} leesdoelen` : aantal(ds.length)}${k.id === 's-ai' ? `, waarvan ${ds.filter(d => d.eigen).length} zelf toegevoegd` : ''}${k.mijlpalen ? ` en ${k.mijlpalen.length} minimumdoelen` : ''}, van jong naar oud.`
    : `${lijn(k.lijn).dig}, ketting ${k.nr} · ${aantal(ds.length)} van jong naar oud · <a href="${k.url}" target="_blank" rel="noopener">openen in LeerLokaal</a>`;
  const themas = k.id === 's-ai' ? `<p class="ai-legendes">${AI_LEGENDE}</p><div class="ai-themas" role="group" aria-label="AI-thema">
      <button type="button" data-act="aiThema" data-id="" aria-pressed="${!st.aiThema}">Alle thema's</button>${AI_THEMAS.map(t =>
      `<button type="button" data-act="aiThema" data-id="${t.id}" aria-pressed="${st.aiThema === t.id}">${esc(t.label)}</button>`).join('')}</div>`
    : k.id === 's-toets' ? `<div class="ai-themas" role="group" aria-label="Wat toont de ketting?">${[['','Alles'],['ict','💻 ICT-doelen'],['lees','📖 Leesdoelen']].map(([id,t]) =>
      `<button type="button" class="${id === 'ict' ? 'l-ict' : id === 'lees' ? 'l-lees' : ''}" data-act="toets" data-id="${id}" aria-pressed="${(st.toets||'') === id}">${t}</button>`).join('')}</div>` : '';
  return `<div class="ketting-wrap"><div class="rail">${rail}</div>
    <div class="ketting l-${k.lijn}"><h2>${esc(k.label)}</h2><p class="inl">${inleiding}</p>${themas}
      <ol class="schakels">${schakels}</ol></div></div>`;
}

/* ── Zoeken ── */
const kaal = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function vZoek(){
  const woorden = kaal(st.q).split(/\s+/).filter(Boolean);
  const raak = d => { const t = kaal([d.code, d.text, naam(d.code), ...(d.onder||[]), ...(d.verdiep||[]), ...(d.md||[]), d.thema ? thema(d.lijn,d.thema).label : '', ...(d.oud||[])].join(' ')); return woorden.every(w => t.includes(w)); };
  const gevonden = doelen.filter(raak), uit = UITBREIDING.filter(raak);
  const ai = AI_DOELEN.filter(d => { const t = kaal([d.code, d.text, naam(d.code), d.leerlijn, ...d.themas.map(x => aiThema(x).label), ...d.activiteiten, ...d.verankering.map(v => v.code)].join(' ')); return woorden.every(w => t.includes(w)); });
  const lezen = LEESDOELEN.filter(d => { const t = kaal([d.code, d.text, d.waarom, LEES_ROLLEN[d.rol], ...(d.md||[]), ...d.bij].join(' ')); return woorden.every(w => t.includes(w)); });
  const patroon = new RegExp('(' + woorden.map(w => w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')','gi');
  const kleur = t => t.split(patroon).map((x,i) => i % 2 ? `<mark>${esc(x)}</mark>` : esc(x)).join('');
  const n = gevonden.length + uit.length + ai.length + lezen.length;
  return `<div class="zoek-kop"><h2>${n ? aantal(n) + ' gevonden' : 'Niets gevonden'}</h2><p>${n ? 'Er is ook gezocht in ondersteuning, verdieping en minimumdoelen.' : 'Probeer een ander woord of een code zoals B.12.'}</p></div>
    <div class="kolommen" style="--k:3">${LEERLIJNEN.map(li => {
      const ds = gevonden.filter(d => d.lijn === li.id), us = uit.filter(u => u.lijn === li.id);
      return ds.length + us.length ? `<section class="l-${li.id}"><div class="vak-kop"><span class="icoon" aria-hidden="true">${li.icoon}</span><span class="label">${li.dig} · ${aantal(ds.length + us.length)}</span><h3>${li.label}</h3></div><div class="stapel" style="margin-top:12px">${ds.map(d => kaart(d,{wanneer:true,zoek:kleur})).join('')}${us.map(u => `<div class="kaart l-${u.lijn}"><span class="code">${u.code} <i>· uitbreiding</i></span><span class="tekst">${kleur(u.text)}</span></div>`).join('')}</div></section>` : '';
    }).join('')}${ai.length ? `<section class="l-school"><div class="vak-kop"><span class="icoon" aria-hidden="true">🏫</span><span class="label">Van de school · ${aantal(ai.length)}</span><h3>AI-leerlijn</h3></div><div class="stapel" style="margin-top:12px">${ai.map(d => kaartAi(d,{wanneer:true,zoek:kleur})).join('')}</div></section>` : ''}${lezen.length ? `<section class="l-lees"><div class="vak-kop"><span class="icoon" aria-hidden="true">📖</span><span class="label">Nederlands · ${aantal(lezen.length)}</span><h3>Lezen bij digitaal toetsen</h3></div><div class="stapel" style="margin-top:12px">${lezen.map(d => kaartLees(d,{wanneer:true,zoek:kleur})).join('')}</div></section>` : ''}</div>`;
}

/* ── Detailpaneel ── */
let terugNaar = null;
function open(wat, vanaf){
  if(vanaf && !vanaf.closest('#paneel')) terugNaar = vanaf.dataset;
  st.open = wat;
  const p = $('#paneel');
  p.className = wat.lijn ? 'l-' + wat.lijn : '';
  p.innerHTML = {doel:pDoel, thema:pThema, blok:pBlok, ai:pAi, lees:pLees}[wat.soort](wat);
  p.hidden = false;
  p.scrollTop = 0;
  markeer();
  if(vanaf?.closest('#paneel')) document.querySelector('#inhoud [aria-current=true]:is(.kaart,.stap)')?.scrollIntoView({block:'nearest', inline:'nearest'});
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
  document.querySelectorAll('#inhoud .kaart[data-id]').forEach(b => b.toggleAttribute('aria-current', false) || (['doel','ai','lees'].includes(o?.soort) && b.dataset.id === o.code && b.setAttribute('aria-current','true')));
  document.querySelectorAll('#inhoud .stap:not([data-act=stap])').forEach(b => b.toggleAttribute('aria-current', false) || (b.dataset.act === o?.soort && b.dataset.id === String(o.soort === 'blok' ? o.i : o.code) && b.setAttribute('aria-current','true')));
}
const pKop = t => `<div class="pn-kop"><h2 tabindex="-1">${t}</h2><button type="button" class="sluit" data-act="sluit">Sluiten</button></div>`;
const pLijst = (titel,items) => items && items.length ? `<section><h3>${titel}</h3><ul>${items.map(x => `<li class="pre">${esc(x)}</li>`).join('')}</ul></section>` : '';
const pReeks = (ds,code,metCode) => `<ul class="reeks${metCode ? ' ai' : ''}">${ds.map(d => `<li><button type="button" data-act="doel" data-id="${d.code}" ${d.code === code ? 'aria-current="true"' : ''}><b>${metCode ? d.code : d.lj}</b><span>${esc(d.text)}</span></button></li>`).join('')}</ul>`;
const opties = (lijst,gekozen) => lijst.map(x => `<option value="${x.id}" ${x.id === gekozen ? 'selected' : ''}>${esc(x.label)}</option>`).join('');

function pDoel({code}){
  const d = doel(code), li = lijn(d.lijn), t = thema(d.lijn,d.thema), L = lj(d.lj);
  const basis = DOELEN.find(x => x.code === code);
  const blokken = spiraal.map((s,i) => ({...s,i})).filter(s => doelenBijStap(s).some(x => x.code === code));
  return pKop(d.code) + `<p class="pn-tekst">${esc(d.text)}</p>
    ${d.lj !== basis.lj ? `<span class="tag">Door de school verplaatst, in LeerLokaal: ${lj(basis.lj).label}</span>` : ''}
    <dl class="pn-feiten"><dt>Leerlijn</dt><dd>${li.label}</dd><dt>Thema</dt><dd>${esc(t.label)}</dd><dt>Start in</dt><dd>${L.label} (${basis.leeftijd} jaar, fase ${L.fase})</dd>${d.samenhang ? `<dt>Samenhang</dt><dd>${esc(d.samenhang)}</dd>` : ''}${d.oud ? `<dt>Vervangt</dt><dd>${esc(d.oud.join(' en '))}</dd>` : ''}</dl>
    <div class="pn-acties"><button type="button" class="knop" data-act="kopieer" data-id="${d.code}">Tekst kopiëren</button></div>
    ${st.beheer ? `<section><h3>Aanpassen</h3>
      <label class="veld">Korte naam<input id="bwNaam" value="${esc(naam(code))}"></label>
      <label class="veld">Leerjaar<select id="bwLj">${opties(LEERJAREN,d.lj)}</select></label>
      <label class="veld">Thema<select id="bwThema">${opties(THEMAS[d.lijn],d.thema)}</select></label>
      <div class="pn-acties"><button type="button" class="knop vol" data-act="doelBewaar" data-id="${d.code}">Bewaren</button>${aanpassingen[d.code] ? `<button type="button" class="knop" data-act="doelHerstel" data-id="${d.code}">Terug naar LeerLokaal</button>` : ''}</div></section>` : ''}
    ${pLijst('Ondersteuning',d.onder)}${pLijst('Verdieping',d.verdiep)}
    <section><h3>Minimumdoelen</h3>${d.md ? d.md.map(m => `<div class="md"><b>${m}</b><span class="pre">${esc(MINIMUMDOELEN[m]||'')}</span></div>`).join('') : '<p>Aan dit doel hangt geen minimumdoel.</p>'}</section>
    ${(d.kettingen||[]).map(id => `<section><h3>Ketting: ${esc(ketting(id).label)}</h3>${pReeks(inKetting(id),code)}<div class="pn-acties"><button type="button" class="knop" data-act="ketting" data-id="${id}">Ketting openen</button></div></section>`).join('')}
    ${[false,true].map(eigen => { const ds = aiBij(code).filter(x => x.eigen === eigen); return ds.length ? `<section class="l-${eigen ? 'school' : 'ailink'}"><h3><span class="ai-teken ai-${eigen ? 'eigen' : 'link'}">AI</span> ${eigen ? 'Eigen AI-doelen die hierop verder bouwen' : 'In de AI-leerlijn'}</h3>${pReeksAi(ds)}</section>` : ''; }).join('')}
    ${leesBij(code).length ? `<section class="l-lees"><h3>📖 Lezen bij digitaal toetsen</h3>${pReeksLees(leesBij(code))}</section>` : ''}
    <section><h3>Opbouw in thema ${esc(t.label)}</h3>${pReeks(inThema(d.lijn,d.thema),code)}<div class="pn-acties"><button type="button" class="knop" data-act="naarRij" data-id="${d.lijn === 'ict' ? 'ictdoelen' : d.lijn}-${d.thema}">Trap van dit thema</button></div></section>
    ${blokken.length ? `<section><h3>Stappen van de school</h3><div class="stapel">${blokken.map(s => `<button type="button" class="stap ${s.type === 'aan' ? 'nieuw' : 'bouw'}" data-act="blok" data-id="${s.i}"><em>${esc(spThema(s.thema).label)}</em>${esc(s.label)}</button>`).join('')}</div></section>` : ''}`;
}

const pReeksAi = (ds,code) => `<ul class="reeks ai">${ds.map(d => `<li><button type="button" class="l-${d.eigen ? 'school' : 'ailink'}" data-act="ai" data-id="${d.code}" ${d.code === code ? 'aria-current="true"' : ''}><b>${d.code}</b><span>${esc(d.text)}</span></button></li>`).join('')}</ul>`;
function pAi({code}){
  const d = aiDoel(code), f = aiFase(d.fase);
  const perRelatie = [...new Set(d.verankering.map(v => v.relatie))];
  return pKop(d.code) + `<p class="pn-tekst">${esc(d.text)}</p>
    <span class="tag ai-${aiSoort(d)}">${d.eigen ? 'Eigen doel, door de school toegevoegd' : 'Link met een bestaand leerplandoel'}</span>
    <dl class="pn-feiten"><dt>Wanneer</dt><dd>${f.label} (${f.leeftijd})</dd><dt>Leerlijn</dt><dd>${esc(d.leerlijn)}</dd>${d.samenhang ? `<dt>Samenhang</dt><dd>${esc(d.samenhang)}</dd>` : ''}</dl>
    <div class="pn-acties"><button type="button" class="knop" data-act="kopieer" data-id="${d.code}">Tekst kopiëren</button></div>
    ${st.beheer ? `<section><h3>Aanpassen</h3><label class="veld">Korte naam<input id="bwNaam" value="${esc(naam(code))}"></label><div class="pn-acties"><button type="button" class="knop vol" data-act="aiBewaar" data-id="${d.code}">Bewaren</button></div></section>` : ''}
    ${perRelatie.map(r => `<section><h3>${r.charAt(0).toUpperCase() + r.slice(1)}</h3>${pReeks(d.verankering.filter(v => v.relatie === r).map(v => doel(v.code)), null, true)}</section>`).join('')}
    ${pLijst('Activiteiten in de AI-leerlijn', d.activiteiten)}
    ${d.themas.map(t => `<section><h3>Opbouw: ${esc(aiThema(t).label)}</h3>${pReeksAi(aiThema(t).doelen.map(aiDoel),code)}</section>`).join('')}`;
}

const pReeksLees = (ds,code) => `<ul class="reeks lang">${ds.map(d => `<li><button type="button" class="l-lees" data-act="lees" data-id="${d.code}" ${d.code === code ? 'aria-current="true"' : ''}><b>${d.code.replace('NED ','')}</b><span>${esc(d.text)}</span></button></li>`).join('')}</ul>`;
function pLees({code}){
  const d = leesDoel(code), L = lj(d.lj);
  return pKop(d.code) + `<p class="pn-tekst">${esc(d.text)}</p>
    <dl class="pn-feiten"><dt>Leerlijn</dt><dd>Nederlands, NED stv 2: rijke en gevarieerde teksten lezen en begrijpen</dd><dt>Start in</dt><dd>${L.label} (${d.leeftijd} jaar, fase ${L.fase})</dd><dt>Soort</dt><dd>${LEES_ROLLEN[d.rol]}</dd>${d.drager ? `<dt>LeerLokaal</dt><dd>${d.drager}</dd>` : ''}</dl>
    <div class="pn-acties"><button type="button" class="knop" data-act="kopieer" data-id="${d.code}">Tekst kopiëren</button></div>
    <section><h3>Waarom in de ketting Digitale toetsen</h3><p>${esc(d.waarom)}</p></section>
    ${d.bij.length ? `<section class="l-ict"><h3>Samen met deze ICT-doelen</h3>${pReeks(d.bij.map(doel), null, true)}</section>` : ''}
    ${pLijst('Ondersteuning',d.onder)}${pLijst('Verdieping',d.verdiep)}
    <section><h3>Minimumdoelen</h3>${(d.md||[]).map(m => `<div class="md"><b>${m}</b><span class="pre">${esc(mdTekst(m))}</span></div>`).join('')}</section>
    <section><h3>${LEES_ROLLEN[d.rol]}, van jong naar oud</h3>${pReeksLees(LEESDOELEN.filter(x => x.rol === d.rol),code)}<div class="pn-acties"><button type="button" class="knop" data-act="ketting" data-id="s-toets">Ketting openen</button></div></section>`;
}

function pThema({lijn:l,id}){
  const t = thema(l,id), ds = inThema(l,id);
  return pKop(esc(t.label)) + `<p>${esc(t.info)}</p><section><h3>Opbouw van jong naar oud</h3>${ds.length ? pReeks(ds) + `<div class="pn-acties"><button type="button" class="knop" data-act="naarRij" data-id="${l === 'ict' ? 'ictdoelen' : l}-${id}">Trap van dit thema</button></div>` : '<p>Dit thema heeft geen eigen leerplandoel.</p>'}</section>`;
}

function pBlok({i, nieuw}){
  const s = nieuw || spiraal[i], t = spThema(s.thema), gekoppeld = doelenBijStap(s);
  const zelfde = spiraal.map((x,n) => ({...x,n})).filter(x => x.thema === s.thema).sort((a,b) => ljIdx(a.lj) - ljIdx(b.lj));
  const form = st.beheer ? `<section><h3>${nieuw ? 'Nieuwe stap' : 'Aanpassen'}</h3>
    <label class="veld">Korte naam<input id="sbLabel" value="${esc(s.label)}"></label>
    <label class="veld">Thema<select id="sbThema">${opties(SPIRAAL_THEMAS,s.thema)}</select></label>
    <label class="veld">Leerjaar<select id="sbLj">${opties(LEERJAREN,s.lj)}</select></label>
    <label class="veld">Soort<select id="sbType"><option value="aan" ${s.type === 'aan' ? 'selected' : ''}>Nieuw aanbrengen</option><option value="bouw" ${s.type === 'bouw' ? 'selected' : ''}>Verder bouwen</option></select></label>
    <label class="veld">Uitleg<textarea id="sbDetail">${esc(s.detail||'')}</textarea></label>
    <div class="pn-acties"><button type="button" class="knop vol" data-act="blokBewaar">Bewaren</button>${nieuw ? '' : '<button type="button" class="knop weg" data-act="blokWeg">Verwijderen</button>'}</div></section>` : '';
  if(nieuw) return pKop('Nieuwe stap') + form;
  return pKop(esc(s.label)) + `<dl class="pn-feiten"><dt>Thema</dt><dd>${esc(t.label)}</dd><dt>Leerjaar</dt><dd>${lj(s.lj).label}</dd><dt>Soort</dt><dd>${s.type === 'aan' ? 'Nieuw aanbrengen' : 'Verder bouwen'}</dd></dl>
    ${s.detail ? `<p class="pre" style="margin-top:14px">${esc(s.detail)}</p>` : ''}${form}
    ${gekoppeld.length ? `<section class="l-ict"><h3>Gekoppelde leerplandoelen</h3>${pReeks(gekoppeld)}</section>` : ''}
    <section><h3>Opbouw ${esc(t.label)}</h3><ul class="reeks l-ict">${zelfde.map(x => `<li><button type="button" data-act="blok" data-id="${x.n}" ${x.n === i ? 'aria-current="true"' : ''}><b>${x.lj}</b><span>${esc(x.label)}</span></button></li>`).join('')}</ul></section>`;
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
  opbouw: b => ga({view:'opbouw', lijn:b.dataset.id, klas:null}),
  bron: b => { sluit(); ga({bron:b.dataset.id, stap:null}); },
  klas: b => { const id = b.dataset.id; sluit(); ga(id && id !== st.klas ? {klas:id, lj:id} : {klas:null}); },
  rij: b => { const id = b.dataset.id; st.rijen.has(id) ? st.rijen.delete(id) : st.rijen.add(id); st.stap = null; hertekenRij(id); },
  stap: b => {
    const id = b.dataset.id, rij = id.split(':')[0];
    if(st.rijen.has(rij) && st.stap === id){ st.rijen.delete(rij); st.stap = null; }
    else { st.rijen.add(rij); st.stap = id; }
    hertekenRij(rij);
  },
  filter: b => {
    const id = b.dataset.id, ids = /^\d$/.test(id) ? LEERJAREN.filter(l => l.fase === +id).map(l => l.id) : id ? [id] : [];
    const alle = ids.every(x => st.jaren.has(x));
    if(!ids.length) st.jaren = new Set(); else ids.forEach(x => alle ? st.jaren.delete(x) : st.jaren.add(x));
    if(st.jaren.size === LEERJAREN.length) st.jaren = new Set();
    toon();
  },
  alles: b => { rijenVan().forEach(r => b.dataset.id ? st.rijen.add(r.id) : st.rijen.delete(r.id)); st.stap = null; toon(); },
  naarRij: b => {
    const id = b.dataset.id, l = id.split('-')[0];
    sluit(); st.rijen.add(id); st.stap = null;
    ga({view:'opbouw', lijn:l.replace('doelen',''), ...(l.startsWith('ict') ? {bron:l === 'ictdoelen' ? 'doelen' : 'stappen'} : {}), klas:null, jaren:new Set()});
    hertekenRij(id);
  },
  extra: b => { st.extra = b.checked; toon(); },
  aiToon: b => { st.ai = b.checked; toon(); },
  sluit: () => sluit(),
  doel: b => st.open?.soort === 'doel' && st.open.code === b.dataset.id && !b.closest('#paneel') ? sluit() : open({soort:'doel', code:b.dataset.id, lijn:doel(b.dataset.id).lijn}, b),
  ai: b => st.open?.soort === 'ai' && st.open.code === b.dataset.id && !b.closest('#paneel') ? sluit() : open({soort:'ai', code:b.dataset.id, lijn:aiDoel(b.dataset.id).eigen ? 'school' : 'ailink'}, b),
  lees: b => st.open?.soort === 'lees' && st.open.code === b.dataset.id && !b.closest('#paneel') ? sluit() : open({soort:'lees', code:b.dataset.id, lijn:'lees'}, b),
  aiThema: b => { st.aiThema = b.dataset.id || null; toon(); },
  toets: b => { st.toets = b.dataset.id || null; toon(); },
  thema: b => open({soort:'thema', lijn:b.dataset.lijn, id:b.dataset.id}, b),
  blok: b => open({soort:'blok', i:+b.dataset.id}, b),
  blokNieuw: b => open({soort:'blok', nieuw:{thema:b.dataset.id, lj:'K1', type:'bouw', label:'', detail:''}}, b),
  kopieer: b => { const d = doel(b.dataset.id) || aiDoel(b.dataset.id) || leesDoel(b.dataset.id); navigator.clipboard.writeText(`${d.code} ${d.text}`).then(() => meld('Gekopieerd.'), () => meld('Kopiëren lukt niet in deze browser.')); },
  doelBewaar: b => {
    const basis = DOELEN.find(x => x.code === b.dataset.id), n = {lj:$('#bwLj').value, thema:$('#bwThema').value, ...eigenNaam(b.dataset.id)};
    if(n.lj === basis.lj && n.thema === basis.thema && !n.naam) delete aanpassingen[basis.code]; else aanpassingen[basis.code] = n;
    naDoelWijziging('Bewaard in deze browser.');
  },
  aiBewaar: b => {
    const n = eigenNaam(b.dataset.id);
    if(n.naam) aanpassingen[b.dataset.id] = n; else delete aanpassingen[b.dataset.id];
    naDoelWijziging('Bewaard in deze browser.');
  },
  doelHerstel: b => { delete aanpassingen[b.dataset.id]; naDoelWijziging('Teruggezet naar LeerLokaal.'); },
  blokBewaar: () => {
    const n = {thema:$('#sbThema').value, lj:$('#sbLj').value, type:$('#sbType').value, label:$('#sbLabel').value.trim(), detail:$('#sbDetail').value.trim()};
    if(!n.label){ meld('Geef de stap een korte naam.'); $('#sbLabel').focus(); return; }
    const oud = st.open.nieuw ? null : spiraal[st.open.i];
    if(oud?.doelen && oud.thema === n.thema && oud.lj === n.lj) n.doelen = oud.doelen; // eigen koppeling van de stap behouden
    const i = st.open.nieuw ? spiraal.push(n) - 1 : (spiraal[st.open.i] = n, st.open.i);
    bewaarSpiraal(); toon(); open({soort:'blok', i}); meld('Bewaard in deze browser.');
  },
  blokWeg: () => {
    if(!confirm(`De stap "${spiraal[st.open.i].label}" verwijderen?`)) return;
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
    if(!confirm('Alle aanpassingen aan doelen én stappen in deze browser wissen?')) return;
    aanpassingen = {}; spiraal = kopie(SPIRAAL);
    try{ localStorage.removeItem(SLEUTEL); localStorage.removeItem(SLEUTEL_SPIRAAL); localStorage.removeItem(SLEUTEL_SPIRAAL + '_versie'); }catch(e){}
    sluit(); herbouw(); toon(); meld('Standaardversie hersteld.');
  },
};
/* een andere korte naam dan de standaard, uit het veld in het paneel */
function eigenNaam(code){ const n = $('#bwNaam').value.trim(); return n && n !== KORTE_NAMEN[code] ? {naam:n} : {}; }
/* hertekenen zonder dat de rij van plaats verspringt, en de open trap in beeld brengen */
function hertekenRij(id){
  const knop = () => [...document.querySelectorAll('#inhoud [data-act=rij]')].find(b => b.dataset.id === id);
  const y = knop()?.getBoundingClientRect().top;
  toon();
  if(!knop()) return;
  if(y !== undefined) $('#inhoud').scrollTop += knop().getBoundingClientRect().top - y;
  const t = knop().closest('tr').nextElementSibling;
  if(t?.matches('.trap-rij')) t.scrollIntoView({block:'nearest'});
  knop().closest('tr').scrollIntoView({block:'nearest'});
}
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
