/* Gedeeld op alle pagina's: menubalk, paginaknoppen (Afdrukken, Beheer) en beheermodus.
   Een pagina toevoegen of hernoemen in het menu doe je enkel hier. */
(function(){
  const BEHEERCODE = 'krekel'; // eenvoudige drempel, geen echte beveiliging
  const SLEUTEL = 'digiplan_beheer';
  const basis = new URL('.', document.currentScript.src);
  /* Groepen van het menu. De kleur per groep staat in digiplan.css bij [data-groep].
     items: [pagina, naam, icoon van de tegel, uitleg, label] */
  const GROEPEN = [
    {id:'beleid', label:'Beleidsplan', icoon:'🧭', info:'van visie tot actie', items:[
      ['visie.html','Visie','🔭','ICT-ambitie en MoSCoW-analyse','Fase 1'],
      ['Context.html','Context','🏫','Schoolpopulatie en omgeving','Fase 2'],
      ['analyse.html','Analyse','🔍','Inventaris, middelen en SWOT','Fase 3'],
      ['actieplan.html','Actieplan','🚀','Doelen, trekkers en deadlines','Fase 4'],
      ['digitale-inclusie.html','Digitale inclusie','🤝','Gelijke digitale kansen voor elk kind'],
      ['Pedagogisch project.html','Pedagogisch project','🌱','Kernwaarden, missie en identiteit']]},
    {id:'leerplan', label:'Leerplan', icoon:'📚', info:'wat leerlingen leren', items:[
      ['leerplandoelen/index.html','Leerplandoelen','📚','Per leerjaar, als opbouw en in kettingen'],
      ['LeerLokaal.html','Lesfiches','📝','Een uitgewerkte les bij elk leerplandoel'],
      ['rubrics_digitale_geletterdheid.html','Rubrics','📋','Beoordelen per leerplandoel'],
      ['woordenlijst.html','Woordenlijst','📖','Begrippen voor leerkracht en kind']]},
    {id:'team', label:'Team en AI', icoon:'👥', info:'wie doet wat', items:[
      ['professionalisering.html','Professionalisering','🎓','Groeiplan van het team'],
      ['rolverdeling.html','Rolverdeling','👥','Rollen en taken in het ICT-team'],
      ['AI-good_practices.html','AI op school','🤖','Richtlijnen voor verantwoord AI-gebruik']]},
    {id:'middelen', label:'Middelen', icoon:'🧰', info:'toestellen en budget', items:[
      ['inventaris.html','Inventaris toestellen','💻','Overzicht van de toestellen','Beveiligd'],
      ['budget.html','Budget en planning','💰','Meerjarenplanning','Beveiligd']]},
  ];
  const HUIS = '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M2.5 9.5 10 3l7.5 6.5M5 8v8.5h3.6v-5h2.8v5H15V8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  const adres = p => new URL(encodeURI(p), basis).href;
  const hier = decodeURIComponent(location.pathname).replace(/\/$/,'/index.html');
  const isHier = p => hier.endsWith('/' + p);
  const hierGroep = GROEPEN.find(g => g.items.some(x => isHier(x[0])));
  if(hierGroep) document.documentElement.dataset.groep = hierGroep.id;
  const bewaard = () => { try{ return sessionStorage.getItem(SLEUTEL) === '1'; }catch(e){ return false; } };

  const Digiplan = window.Digiplan = {
    beheer: bewaard(),
    /* vraagt de code als dat nodig is; luister naar het event digiplan:beheer */
    vraagBeheer(){ Digiplan.beheer ? zetBeheer(false) : dialoog(); },
    meld, venster, druk,
    drukKeuze:null, // een pagina kan hier een eigen keuzevenster voor Afdrukken zetten
  };

  /* ── Menubalk ── */
  function menu(){
    const balk = document.querySelector('.topbar');
    if(!balk) return;
    balk.classList.add('menubalk');
    balk.innerHTML = `
      <a class="mb-thuis" href="${adres('Digiplan.html')}"${isHier('Digiplan.html') ? ' aria-current="page"' : ''}>${HUIS} Digiplan</a>
      <button type="button" class="mb-knop" aria-expanded="false" aria-controls="mbLijst">Menu</button>
      <nav class="mb-lijst" id="mbLijst" aria-label="Onderdelen van het Digiplan">${GROEPEN.map((g,i) => `
        <div class="mb-groep${g === hierGroep ? ' actief' : ''}" data-groep="${g.id}">
          <button type="button" aria-expanded="false" aria-controls="mbg${i}"><span aria-hidden="true">${g.icoon}</span>${g.label}${g === hierGroep ? `<span class="mb-hier">› ${g.items.find(x => isHier(x[0]))[1]}</span>` : ''}</button>
          <div class="mb-paneel" id="mbg${i}"><p class="mb-kop"><span aria-hidden="true">${g.icoon}</span><b>${g.label}</b> ${g.info}</p>
          <ul>${g.items.map(x => `<li><a href="${adres(x[0])}"${isHier(x[0]) ? ' aria-current="page"' : ''}><span class="mb-icoon" aria-hidden="true">${x[2]}</span><b>${x[1]}</b>${x[4] ? `<small>${x[4]}</small>` : ''}<span class="mb-uitleg">${x[3]}</span></a></li>`).join('')}</ul></div>
        </div>`).join('')}</nav>
      ${isHier('Digiplan.html') ? '' : `<span class="mb-school"><img src="${adres('logo-krekel.png')}" alt="GBS De Krekel"></span>`}`;
    const groepen = [...balk.querySelectorAll('.mb-groep')], knop = balk.querySelector('.mb-knop');
    const zet = (g,aan) => { g.classList.toggle('open',aan); g.querySelector('button').setAttribute('aria-expanded',aan); };
    const sluit = () => { groepen.forEach(g => zet(g,false)); balk.classList.remove('open'); knop.setAttribute('aria-expanded','false'); };
    groepen.forEach(g => g.querySelector('button').addEventListener('click', () => {
      const aan = !g.classList.contains('open');
      groepen.forEach(x => zet(x, x === g && aan));
    }));
    knop.addEventListener('click', () => {
      const aan = balk.classList.toggle('open'); knop.setAttribute('aria-expanded',aan);
      groepen.forEach(g => zet(g, aan && g.classList.contains('actief')));
    });
    document.addEventListener('click', e => { if(!balk.contains(e.target)) sluit(); });
    balk.addEventListener('focusout', e => { if(e.relatedTarget && !balk.contains(e.relatedTarget)) sluit(); });
    document.addEventListener('keydown', e => {
      if(e.key !== 'Escape') return;
      const open = balk.querySelector('.mb-groep.open > button');
      sluit(); if(open) open.focus();
    });
  }

  /* ── Paginaknoppen rechts naast de titel ──
     <body data-beheer> toont Beheer, <body data-geen-afdruk> laat Afdrukken weg.
     Eigen knoppen van een pagina staan in <div class="kop-acties"> in de kop. */
  function paginaknoppen(){
    const kop = document.querySelector('.page-header-inner');
    if(!kop) return;
    const pagina = GROEPEN.flatMap(g => g.items).find(x => isHier(x[0]));
    if(pagina) kop.insertAdjacentHTML('afterbegin', `<div class="kop-tegel" aria-hidden="true">${pagina[2]}</div>`);
    let acties = kop.querySelector('.kop-acties');
    if(!acties){ acties = document.createElement('div'); acties.className = 'kop-acties'; kop.append(acties); }
    if(!document.body.hasAttribute('data-geen-afdruk'))
      acties.insertAdjacentHTML('beforeend','<button type="button" class="kop-knop i-druk" data-dp="afdruk">Afdrukken</button>');
    if(document.body.hasAttribute('data-beheer'))
      acties.insertAdjacentHTML('beforeend','<button type="button" class="kop-knop i-beheer" data-dp="beheer" aria-pressed="false">Beheer</button>');
    acties.addEventListener('click', e => {
      const b = e.target.closest('[data-dp]');
      if(b) b.dataset.dp === 'beheer' ? Digiplan.vraagBeheer() : Digiplan.drukKeuze ? Digiplan.drukKeuze() : window.print();
    });
    if(!acties.children.length) acties.remove();
  }

  /* ── Beheer ── */
  function zetBeheer(aan){
    Digiplan.beheer = aan;
    try{ aan ? sessionStorage.setItem(SLEUTEL,'1') : sessionStorage.removeItem(SLEUTEL); }catch(e){}
    pasToe();
    document.dispatchEvent(new CustomEvent('digiplan:beheer',{detail:aan}));
  }
  function pasToe(){
    document.body.classList.toggle('beheer-aan', Digiplan.beheer);
    document.querySelectorAll('[data-dp=beheer]').forEach(b => {
      b.setAttribute('aria-pressed',Digiplan.beheer);
      b.textContent = Digiplan.beheer ? 'Beheer sluiten' : 'Beheer';
    });
    document.querySelectorAll('[data-beheer-velden]').forEach(velden);
  }
  /* formuliervelden zijn buiten beheer gewone leestekst */
  function velden(gebied){
    gebied.querySelectorAll('input,select,textarea').forEach(v => {
      if(v.dataset.ph === undefined) v.dataset.ph = v.getAttribute('placeholder') || '';
      v.disabled = !Digiplan.beheer;
      if('placeholder' in v) v.placeholder = Digiplan.beheer ? v.dataset.ph : 'Nog niet ingevuld';
    });
  }
  function dialoog(){
    let d = document.getElementById('dpCode');
    if(!d){
      d = document.createElement('dialog'); d.id = 'dpCode'; d.className = 'dp-dialoog';
      d.innerHTML = `<form method="dialog"><h2>Beheer openen</h2>
        <label for="dpCodeVeld">Beheerderscode</label>
        <input id="dpCodeVeld" type="password" autocomplete="off" autocapitalize="none" spellcheck="false">
        <p class="dp-fout" role="alert"></p>
        <div class="dp-rij"><button type="button" class="dp-knop">Annuleren</button><button type="submit" class="dp-knop vol">Openen</button></div></form>`;
      document.body.append(d);
      d.querySelector('button[type=button]').addEventListener('click', () => d.close());
      d.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        if(d.querySelector('input').value.trim().toLowerCase() !== BEHEERCODE){ d.querySelector('.dp-fout').textContent = 'Deze code klopt niet.'; return; }
        d.close(); zetBeheer(true); meld('Beheer staat aan. Wijzigingen blijven in deze browser.');
      });
    }
    d.querySelector('input').value = ''; d.querySelector('.dp-fout').textContent = '';
    d.showModal();
  }

  /* Keuzevenster: titel, velden (html) en een knop. klaar(formulier) geeft een foutmelding terug of niets. */
  function venster({titel, html, knop = 'Afdrukken', extra = '', klaar, wijzig}){
    document.getElementById('dpVenster')?.remove();
    const d = document.createElement('dialog'); d.id = 'dpVenster'; d.className = 'dp-dialoog breed';
    d.innerHTML = `<form method="dialog"><h2>${titel}</h2>${html}<p class="dp-fout" role="alert"></p>
      <div class="dp-rij"><button type="button" class="dp-knop" data-venster="sluit">Annuleren</button>${extra}<button type="submit" class="dp-knop vol">${knop}</button></div></form>`;
    document.body.append(d);
    const f = d.querySelector('form');
    d.querySelector('[data-venster=sluit]').addEventListener('click', () => d.close());
    f.addEventListener('change', () => { d.querySelector('.dp-fout').textContent = ''; if(wijzig) wijzig(f); });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const fout = klaar(f);
      if(fout) d.querySelector('.dp-fout').textContent = fout; else d.close();
    });
    d.addEventListener('close', () => d.remove());
    if(wijzig) wijzig(f);
    d.showModal();
    return d;
  }

  /* Drukt enkel deze bladen af. papier: a4 of a3, liggend. pas(doos) kan de bladen eerst op maat zetten. */
  async function druk(html, {papier = 'a4', pas} = {}){
    const oud = document.getElementById('dpDruk'); if(oud) oud.remove();
    const doos = document.createElement('div'); doos.id = 'dpDruk'; doos.className = papier; doos.innerHTML = html;
    document.body.append(doos);
    await Promise.all([document.fonts?.ready, ...[...doos.querySelectorAll('img')].map(i => i.decode().catch(() => i.remove()))]);
    if(pas) pas(doos);
    const kl = ['dp-drukt', 'dp-' + papier];
    document.body.classList.add(...kl);
    window.addEventListener('afterprint', () => { document.body.classList.remove(...kl); doos.remove(); }, {once:true});
    if(!Digiplan.geenPrint) window.print();
  }

  let meldT;
  function meld(tekst){
    let m = document.getElementById('dpMelding');
    if(!m){ m = document.createElement('div'); m.id = 'dpMelding'; m.setAttribute('role','status'); document.body.append(m); }
    m.textContent = tekst; m.classList.add('toon');
    clearTimeout(meldT); meldT = setTimeout(() => m.classList.remove('toon'), 3000);
  }

  function start(){
    menu(); paginaknoppen(); pasToe();
    document.querySelectorAll('[data-beheer-velden]').forEach(g => new MutationObserver(() => velden(g)).observe(g,{childList:true,subtree:true}));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
