'use strict';
/* Afdrukken: keuzevenster en bladen voor de opbouw. Gebruikt de functies van app.js.
   De knop Afdrukken (digiplan.js) roept Digiplan.drukKeuze op. */
const DRUK_LIJNEN = [
  {id:'ict',       lijn:'ict',   bron:'stappen', kort:'ICT: stappen van de school', titel:'ICT-basisvaardigheden', onder:'Stappen van de school'},
  {id:'ictdoelen', lijn:'ict',   bron:'doelen',  kort:'ICT: leerplandoelen',        titel:'ICT-basisvaardigheden', onder:'Leerplandoelen DIG 1'},
  {id:'cd',        lijn:'cd',    bron:'stappen', kort:'Computationeel denken',      titel:'Computationeel denken', onder:'Leerplandoelen DIG 2'},
  {id:'media',     lijn:'media', bron:'stappen', kort:'Mediawijsheid',              titel:'Mediawijsheid',         onder:'Leerplandoelen DIG 3'},
  {id:'ai',        lijn:'ai',    bron:'stappen', kort:'AI-leerlijn',                titel:'AI-leerlijn',           onder:'Eigen leerlijn van de school'},
];
const DRUK_DELEN = [
  {id:'raster', label:'Raster op één blad',  uitleg:'De hele leerlijn in één oogopslag, één blad per leerlijn.'},
  {id:'trap',   label:'Trappen met uitleg',  uitleg:'Elk thema stap voor stap, met de volledige tekst.'},
  {id:'klas',   label:'Klasblad',            uitleg:'Per klas: wat ze al kennen, dit jaar leren en daarna doen.'},
];

let drukJaren = new Set(); // filter op leerjaren voor raster en trappen
/* tekent iets met een andere toestand, zonder het scherm te veranderen */
function metStaat(wijziging, doe){
  const bewaard = {...st};
  Object.assign(st, {klas:null, rijen:new Set(), jaren:drukJaren, stap:null, beheer:false, q:''}, wijziging);
  try{ return doe(); } finally{ Object.assign(st, bewaard); }
}
const rijenBij = dl => metStaat({lijn:dl.lijn, bron:dl.bron}, () => rijenVan().filter(r => r.stappen.length && gestart(r)));
const enkel = () => drukJaren.size ? ' · enkel ' + metStaat({}, filterNaam) : '';
const bladKop = (titel, onder, rechts = '') => `<header class="bl-kop"><div><h1>${titel}</h1><p>${onder}</p></div>${rechts}<img src="../logo-krekel.png" alt=""></header>`;
const bladLegende = dl => `<p class="bl-leg"><span class="leg nieuw">nieuw</span><span class="leg">verder bouwen</span><span class="leg oefen">blijven oefenen</span>${dl.id === 'ict' ? '' : AI_LEGENDE}</p>`;

function bladRaster(dl){
  const tabel = metStaat({lijn:dl.lijn, bron:dl.bron}, () => rasterTabel(rijenBij(dl)));
  return `<section class="blad vast l-${dl.lijn}">${bladKop(dl.titel, `${dl.onder} · opbouw van jong naar oud${enkel()}`, bladLegende(dl))}<div class="bl-vak"><div class="bl-in">${tabel}</div></div></section>`;
}

function bladTrappen(dl){
  const themas = metStaat({lijn:dl.lijn, bron:dl.bron}, () => rijenBij(dl).map(r =>
    `<div class="bl-thema ${r.kleur}"><h2>${esc(r.label)}${r.groep && r.groep !== r.label ? ` <small>${esc(r.groep)}</small>` : ''}</h2>${trap(r)}</div>`).join(''));
  const uit = dl.id === 'ict' || drukJaren.size ? [] : UITBREIDING.filter(u => u.lijn === dl.lijn);
  return `<section class="blad l-${dl.lijn}">${bladKop(dl.titel, `${dl.onder} · thema's met uitleg${enkel()}`)}${themas}
    ${uit.length ? `<div class="bl-thema"><h2>Uitbreiding <small>zonder vaste leeftijd</small></h2>${uit.map(u => `<p><b>${u.code}</b> ${esc(u.text)}</p>`).join('')}</div>` : ''}</section>`;
}

/* wat een stap inhoudt, in doorlopende tekst */
function stapRegel(x){
  const s = x.blok === undefined ? null : spiraal[x.blok], d = x.doel || x.ai;
  const codes = s ? doelenBijStap(s).map(y => y.code).join(', ') : x.ai ? `${d.code}, ${d.eigen ? 'eigen doel' : d.verankering.map(v => v.code).join(', ')}` : [d.code, ...(d.md||[])].join(', ');
  return `<p class="bl-stap"><b>${x.soort === 'nieuw' ? '<i>Nieuw</i>' : ''}${esc(x.naam)}</b> <span>${esc(s ? s.detail || '' : d.text).replace(/\n+/g,' ')}</span>${codes ? ` <em>${codes}</em>` : ''}</p>`;
}
function bladKlas(id, dls){
  const L = lj(id), mini = xs => xs.map(x => `<p class="bl-mini"><b>${wanneer(x,true)}</b> ${esc(x.naam)}</p>`).join('');
  const delen = dls.map(dl => metStaat({lijn:dl.lijn, bron:dl.bron, klas:id}, () => {
    const per = verdeel(rijenVan().filter(r => r.stappen.length));
    const nu = per.filter(x => x.nu.length), oefen = per.filter(x => !x.nu.length && x.eerder.length), straks = per.filter(x => !x.nu.length && !x.eerder.length);
    const rij = ({r,eerder,nu,later}) => `<tr class="${r.kleur}"><th scope="row">${esc(r.label)}</th>
      <td>${mini(eerder.filter(x => x.tot === eerder.at(-1).tot)) || '<i>nog niets</i>'}</td><td class="nu">${nu.map(stapRegel).join('')}</td>
      <td>${mini(later.filter(x => x.van === later[0].van)) || (id === LEERJAREN.at(-1).id ? '<i>geen volgende stap</i>' : '<i>blijven oefenen</i>')}</td></tr>`;
    return `<div class="bl-lijn l-${dl.lijn}"><h2>${dl.titel} <small>${dl.onder}</small></h2>
      ${nu.length ? `<table class="bl-klas"><thead><tr><th>Thema</th><th>Kennen ze al</th><th>Dit jaar</th><th>Daarna</th></tr></thead><tbody>${nu.map(rij).join('')}</tbody></table>` : '<p class="bl-regel">Geen nieuwe stap dit jaar.</p>'}
      ${oefen.length ? `<p class="bl-regel"><b>Blijven oefenen:</b> ${oefen.map(({r,later}) => esc(r.label) + (later.length ? ` (daarna ${esc(later[0].naam)}, ${wanneer(later[0],true)})` : '')).join(' · ')}</p>` : ''}
      ${straks.length ? `<p class="bl-regel"><b>Start later:</b> ${straks.map(({r,later}) => `${esc(r.label)} (${wanneer(later[0],true)})`).join(' · ')}</p>` : ''}</div>`;
  }));
  return `<section class="blad">${bladKop(L.label, `${L.leeftijd} · fase ${L.fase} · kennen ze al, dit jaar en daarna`)}${delen.join('')}</section>`;
}

/* staat er een woord in dat niet in zijn vakje past? */
const breekt = el => [...el.querySelectorAll('.stap')].some(b => b.scrollWidth > b.clientWidth + 1);
/* schaalt elk raster zo groot mogelijk op zijn blad */
function pasRasters(doos){
  doos.querySelectorAll('.blad.vast').forEach(b => {
    const vak = b.querySelector('.bl-vak'), inh = vak.firstElementChild, B = vak.clientWidth, H = vak.clientHeight;
    let z = doos.classList.contains('a3') ? 1.6 : 1.15;
    for(; z > .35; z -= .02){ inh.style.width = B / z + 'px'; if(inh.offsetHeight * z <= H && (z < .7 || !breekt(inh))) break; }
    inh.style.transform = `scale(${z})`;
  });
}

function drukBladen({delen, lijnen, klassen, papier, jaren = new Set()}){
  drukJaren = jaren;
  const dls = DRUK_LIJNEN.filter(l => lijnen.includes(l.id));
  const bladen = [];
  if(delen.includes('raster')) bladen.push(...dls.map(bladRaster));
  if(delen.includes('trap')) bladen.push(...dls.map(bladTrappen));
  if(delen.includes('klas')) bladen.push(...LEERJAREN.filter(l => klassen.includes(l.id)).map(l => bladKlas(l.id, dls)));
  return Digiplan.druk(bladen.join(''), {papier, pas:pasRasters});
}

Digiplan.drukKeuze = () => {
  const opbouw = st.view === 'opbouw' && !st.q;
  const lijnen = opbouw && st.lijn === 'alle' ? [bronNaam('ict'),'cd','media','ai'] : opbouw ? [bronNaam()] : lijn(st.lijn) ? [st.lijn] : ['ict','cd','media'];
  const deel = !opbouw ? 'raster' : st.klas ? 'klas' : rijenVan().filter(r => r.stappen.length).every(r => st.rijen.has(r.id)) ? 'trap' : 'raster';
  const klas = opbouw && st.klas || st.lj;
  const scherm = st.q ? `Zoekresultaat: ${esc(st.q)}` : st.view === 'kettingen' ? `Ketting: ${esc(ketting(st.ketting).label)}` : `Per leerjaar: ${lj(st.lj).label}`;
  const keuze = (soort, naam, id, label, uitleg, aan) => `<label class="dp-keuze"><input type="${soort}" name="${naam}" value="${id}" ${aan ? 'checked' : ''}><div><b>${label}</b><span>${uitleg}</span></div></label>`;
  const chip = (soort, naam, id, label, aan) => `<label><input type="${soort}" name="${naam}" value="${id}" ${aan ? 'checked' : ''}>${label}</label>`;
  const waarden = (f,naam) => [...f.querySelectorAll(`[name=${naam}]:checked`)].map(x => x.value);
  Digiplan.venster({
    titel:'Wat wil je afdrukken?',
    html:`${opbouw ? '' : `<fieldset>${keuze('radio','wat','scherm',scherm,'Wat nu op het scherm staat.',true)}${keuze('radio','wat','opbouw','De opbouw','Het raster, de trappen of een klasblad.',false)}</fieldset>`}
      <div class="druk-opbouw">
      <fieldset><legend>Onderdelen</legend>${DRUK_DELEN.map(d => keuze('checkbox','deel',d.id,d.label,d.uitleg,d.id === deel)).join('')}</fieldset>
      <fieldset class="druk-klas"><legend>Klassen</legend><div class="dp-chips">${LEERJAREN.map(l => chip('checkbox','klas',l.id,l.id,l.id === klas)).join('')}${chip('checkbox','alleklas','alle','Alle klassen',false)}</div></fieldset>
      <fieldset><legend>Leerlijnen</legend><div class="dp-chips">${DRUK_LIJNEN.map(l => chip('checkbox','lijn',l.id,l.kort,lijnen.includes(l.id))).join('')}</div></fieldset>
      ${opbouw && st.jaren.size ? `<fieldset class="druk-filter"><legend>Filter</legend><div class="dp-chips">${chip('checkbox','filter','ja','Raster en trappen enkel voor ' + filterNaam(),true)}</div></fieldset>` : ''}
      <fieldset><legend>Papier, liggend</legend><div class="dp-chips">${chip('radio','papier','a4','A4',true)}${chip('radio','papier','a3','A3 (poster)',false)}</div></fieldset></div>`,
    wijzig: f => {
      f.querySelector('.druk-opbouw').hidden = !opbouw && waarden(f,'wat')[0] === 'scherm';
      f.querySelector('.druk-klas').hidden = !waarden(f,'deel').includes('klas');
      const alle = f.querySelector('[name=alleklas]');
      if(alle.checked !== (alle.dataset.was === '1')){ f.querySelectorAll('[name=klas]').forEach(x => { x.checked = alle.checked || x.value === klas; }); }
      else alle.checked = waarden(f,'klas').length === LEERJAREN.length;
      alle.dataset.was = alle.checked ? '1' : '';
    },
    klaar: f => {
      if(!opbouw && waarden(f,'wat')[0] === 'scherm'){ setTimeout(() => window.print(), 60); return; }
      const delen = waarden(f,'deel'), gekozen = waarden(f,'lijn'), klassen = waarden(f,'klas');
      if(!delen.length) return 'Kies minstens één onderdeel.';
      if(!gekozen.length) return 'Kies minstens één leerlijn.';
      if(delen.includes('klas') && !klassen.length) return 'Kies minstens één klas.';
      setTimeout(() => drukBladen({delen, lijnen:gekozen, klassen, papier:waarden(f,'papier')[0], jaren:waarden(f,'filter').length ? new Set(st.jaren) : new Set()}), 60);
    },
  });
};
