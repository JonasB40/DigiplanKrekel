/* Gedeeld op alle pagina's: menubalk, paginaknoppen (Afdrukken, Beheer) en beheermodus.
   Een pagina toevoegen of hernoemen in het menu doe je enkel hier. */
(function(){
  const BEHEERCODE = 'krekel'; // eenvoudige drempel, geen echte beveiliging
  const SLEUTEL = 'digiplan_beheer';
  const basis = new URL('.', document.currentScript.src);
  /* [pagina, naam, icoon van de tegel, bijschrift] */
  const GROEPEN = [
    {label:'Beleidsplan', items:[
      ['visie.html','Visie','🔭','Fase 1'], ['Context.html','Context','🏫','Fase 2'], ['analyse.html','Analyse','🔍','Fase 3'], ['actieplan.html','Actieplan','🚀','Fase 4'],
      ['digitale-inclusie.html','Digitale inclusie','🤝'], ['Pedagogisch project.html','Pedagogisch project','🌱']]},
    {label:'Leerplan', items:[
      ['leerplandoelen/index.html','Leerplandoelen','📚'], ['LeerLokaal.html','Lesfiches','📝'], ['rubrics_digitale_geletterdheid.html','Rubrics','📋'], ['woordenlijst.html','Woordenlijst','📖']]},
    {label:'Team en AI', items:[
      ['professionalisering.html','Professionalisering','🎓'], ['rolverdeling.html','Rolverdeling','👥'], ['AI-good_practices.html','AI op school','🤖']]},
    {label:'Middelen', items:[
      ['inventaris.html','Inventaris toestellen','💻','Beveiligd'], ['budget.html','Budget en planning','💰','Beveiligd']]},
  ];
  const HUIS = '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M2.5 9.5 10 3l7.5 6.5M5 8v8.5h3.6v-5h2.8v5H15V8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  const adres = p => new URL(encodeURI(p), basis).href;
  const hier = decodeURIComponent(location.pathname).replace(/\/$/,'/index.html');
  const isHier = p => hier.endsWith('/' + p);
  const bewaard = () => { try{ return sessionStorage.getItem(SLEUTEL) === '1'; }catch(e){ return false; } };

  const Digiplan = window.Digiplan = {
    beheer: bewaard(),
    /* vraagt de code als dat nodig is; luister naar het event digiplan:beheer */
    vraagBeheer(){ Digiplan.beheer ? zetBeheer(false) : dialoog(); },
    meld,
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
        <div class="mb-groep${g.items.some(x => isHier(x[0])) ? ' actief' : ''}">
          <button type="button" aria-expanded="false" aria-controls="mbg${i}">${g.label}</button>
          <ul id="mbg${i}">${g.items.map(x => `<li><a href="${adres(x[0])}"${isHier(x[0]) ? ' aria-current="page"' : ''}><span class="mb-icoon" aria-hidden="true">${x[2]}</span>${x[1]}${x[3] ? ` <small>${x[3]}</small>` : ''}</a></li>`).join('')}</ul>
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
    if(pagina) kop.insertAdjacentHTML('afterbegin', `<div class="kop-tegel${/^Fase/.test(pagina[3]||'') ? ' fase' : ''}" aria-hidden="true">${pagina[2]}</div>`);
    let acties = kop.querySelector('.kop-acties');
    if(!acties){ acties = document.createElement('div'); acties.className = 'kop-acties'; kop.append(acties); }
    if(!document.body.hasAttribute('data-geen-afdruk'))
      acties.insertAdjacentHTML('beforeend','<button type="button" class="kop-knop" data-dp="afdruk">Afdrukken</button>');
    if(document.body.hasAttribute('data-beheer'))
      acties.insertAdjacentHTML('beforeend','<button type="button" class="kop-knop" data-dp="beheer" aria-pressed="false">Beheer</button>');
    acties.addEventListener('click', e => {
      const b = e.target.closest('[data-dp]');
      if(b) b.dataset.dp === 'afdruk' ? window.print() : Digiplan.vraagBeheer();
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
