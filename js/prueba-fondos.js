/* ==========================================================================
   PRUEBA DE FONDO PARA LA SECCION BAJO EL HERO (16/9/2026)

   TEMPORAL. Se retira al elegir un fondo por pagina.

   Monta la pildora de abajo a la derecha con las cuatro opciones y marca
   que seccion se pinta. Los colores y el aspecto estan en
   css/prueba-fondos.css.
   ========================================================================== */
(function () {
  'use strict';

  var OPCIONES = [
    { id: 'blanco', eti: 'Blanco', muestra: '#FFFFFF', oscuro: false },
    { id: 'gris',   eti: 'Gris',   muestra: '#F5F5F5', oscuro: false },
    { id: 'verde',  eti: 'Verde',  muestra: '#1A5121', oscuro: true  },
    { id: 'negro',  eti: 'Negro',  muestra: '#1A1A1A', oscuro: true  }
  ];

  var CLAVE = 'rede-prueba-fondo';   // por pagina, para que no se pise
  var raiz = document.documentElement;

  /* ------------------------------------------------------------------
     QUE SECCION SE PINTA

     La de debajo del hero. Se busca por posicion y no por nombre de
     clase: .dos-col es la primera seccion en Recommissioning pero la
     tercera en Energy Management, asi que por clase se pintaria la
     equivocada en una de las dos.

     Si la siguiente comparte la clase principal --el par espejo de
     About (.ab-origen x2) y el de RUN (.plataforma x2)-- se marca
     tambien: son un bloque visual y dejar una pintada y otra blanca
     partiria la composicion por la mitad.
     ------------------------------------------------------------------ */
  function marcarDianas() {
    var hero = document.querySelector('.d2-ega-hero, .d2-hero');
    if (!hero) return [];

    // la primera seccion despues del hero, saltando lo que no lo sea
    var sec = hero.nextElementSibling;
    while (sec && sec.tagName !== 'SECTION') sec = sec.nextElementSibling;
    if (!sec) return [];

    var dianas = [sec];

    // el par espejo: misma clase principal, seccion seguida
    var principal = sec.className.split(' ')[0];
    var sig = sec.nextElementSibling;
    while (sig && sig.tagName !== 'SECTION') sig = sig.nextElementSibling;
    if (sig && sig.className.split(' ')[0] === principal) dianas.push(sig);

    dianas.forEach(function (d) { d.setAttribute('data-pf-diana', ''); });
    return dianas;
  }

  var dianas = marcarDianas();
  if (!dianas.length) return;   // pagina sin hero: no pinta nada

  /* ------------------------------------------------------------------
     APLICAR

     El fondo lo pone el CSS a partir de data-pf. Aqui solo se anade el
     tono oscuro, que es lo que invierte el texto: data-comp-tono ya
     existe en d2-variantes.css y redefine --c-texto y compania dentro
     de la seccion, asi que no hay que tocar clase por clase.
     ------------------------------------------------------------------ */
  function aplicar(id) {
    var op = OPCIONES.filter(function (o) { return o.id === id; })[0] || OPCIONES[0];

    raiz.setAttribute('data-pf', op.id);

    dianas.forEach(function (d) {
      if (op.oscuro) d.setAttribute('data-comp-tono', 'oscuro');
      else           d.removeAttribute('data-comp-tono');
    });

    [].forEach.call(caja.querySelectorAll('button[data-pf-op]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pf-op') === op.id));
    });

    try { sessionStorage.setItem(CLAVE + location.pathname, op.id); } catch (e) {}
  }

  /* ------------------------------------------------------------------
     LA PILDORA
     ------------------------------------------------------------------ */
  var caja = document.createElement('div');
  caja.className = 'pf-selector';
  caja.setAttribute('role', 'group');
  caja.setAttribute('aria-label', 'Section background test');

  var html = '<span class="pf-selector__etiqueta">Background</span>';
  OPCIONES.forEach(function (o) {
    html += '<button type="button" data-pf-op="' + o.id + '" aria-pressed="false">' +
              '<span class="pf-selector__muestra" style="background:' + o.muestra + '"></span>' +
              o.eti +
            '</button>';
  });
  html += '<button class="pf-selector__tirador" type="button" aria-label="Collapse">&rsaquo;</button>';
  caja.innerHTML = html;
  document.body.appendChild(caja);

  caja.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('pf-selector__tirador')) {
      caja.classList.toggle('esta-plegado');
      return;
    }
    aplicar(b.getAttribute('data-pf-op'));
  });

  // lo elegido se recuerda mientras dure la visita
  var guardado;
  try { guardado = sessionStorage.getItem(CLAVE + location.pathname); } catch (e) {}
  aplicar(guardado || 'blanco');
})();
