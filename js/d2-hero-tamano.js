/* ==========================================================================
   EL TAMANO DEL PANEL DEL HERO

   Un solo control, de PRUEBA, para ver el panel a tres tamanos y decidir
   cual funciona mejor. Sustituye a las dos barras que habia antes --las
   variantes del hero y la imagen de fondo--, que ya no hacen falta: esas
   decisiones estan tomadas.

   Los tres pasos:

     Normal   el panel tal cual, 440px
     +20%     528px
     +40%     616px

   No cambia nada mas: solo el ancho. El grafico escala con el, porque el
   SVG se adapta a su caja, y las cifras y la leyenda se reacomodan solas.

   EN MOVIL NO APARECE. Ahi el panel ya ocupa el ancho disponible y no hay
   sitio para agrandarlo: el control seria un boton que promete algo que no
   puede cumplir.

   Se retira antes de publicar, junto al resto de mandos de prueba.
   ========================================================================== */

(function () {
  'use strict';

  var caru = document.getElementById('caru-hero');
  if (!caru) { return; }

  /* De 640 para abajo el panel es de ancho completo: no hay nada que
     agrandar. Se comprueba al cargar y tambien al girar la pantalla. */
  var movil = window.matchMedia('(max-width: 640px)');

  var PASOS = [
    { id: 'normal', et: 'Normal', factor: 1 },
    { id: 'mas20',  et: '+20%',   factor: 1.2 },
    { id: 'mas40',  et: '+40%',   factor: 1.4 }
  ];

  var CLAVE = 'rede-hero-tamano';
  var actual = 0;

  try {
    var g = parseInt(sessionStorage.getItem(CLAVE), 10);
    if (!isNaN(g) && g >= 0 && g < PASOS.length) { actual = g; }
  } catch (e) {}

  function pintar(i) {
    actual = (i + PASOS.length) % PASOS.length;
    var f = PASOS[actual].factor;

    /* El factor va como variable CSS y no como ancho fijo: asi la regla de
       base sigue mandando --incluido el max-width y el porcentaje de la
       columna-- y esto solo la multiplica. Un ancho en pixeles se saltaria
       el limite del contenedor en pantallas medianas. */
    Array.prototype.forEach.call(
      caru.querySelectorAll('.d2-hero__panel'),
      function (p) { p.style.setProperty('--panel-escala', f); }
    );

    Array.prototype.forEach.call(botones, function (b, n) {
      var on = n === actual;
      b.classList.toggle('es-activo', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    try { sessionStorage.setItem(CLAVE, String(actual)); } catch (e) {}
  }

  /* --- La barra, con el mismo aspecto que los demas mandos --- */

  var barra = document.createElement('div');
  barra.className = 'd2-caru__mandos d2-hero-tamano';
  barra.innerHTML =
    '<button class="d2-caru__ocultar" type="button" data-ht-ocultar aria-expanded="true" aria-label="Close size options">' +
      '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<span class="d2-hero-tamano__eti">Panel size</span>' +
    '<div class="d2-caru__puntos" role="tablist" aria-label="Panel size">' +
      PASOS.map(function (s, i) {
        return '<button class="d2-caru__punto" type="button" role="tab" ' +
               'aria-selected="false" data-ht-a="' + i + '">' +
               '<span>' + s.et + '</span></button>';
      }).join('') +
    '</div>';

  caru.appendChild(barra);

  var botones = barra.querySelectorAll('[data-ht-a]');
  Array.prototype.forEach.call(botones, function (b, n) {
    b.addEventListener('click', function () { pintar(n); });
  });

  /* Minimizar, igual que el resto de mandos. */
  var ocultar = barra.querySelector('[data-ht-ocultar]');
  var minimizado;

  /* En movil arrancan recogidas: son controles de prueba y no deben tapar
     el diseno. Una eleccion guardada en la sesion manda sobre esto. */
  try {
    var guardado = sessionStorage.getItem(CLAVE + '-min');
    minimizado = guardado === null ? movil.matches : guardado === '1';
  } catch (e) { minimizado = movil.matches; }

  function pintarMin() {
    barra.classList.toggle('esta-minimizado', minimizado);
    ocultar.setAttribute('aria-expanded', minimizado ? 'false' : 'true');
    ocultar.setAttribute('aria-label', minimizado ? 'Show size options' : 'Close size options');

    /* Recogidos quedan recortados por overflow: sin esto seguirian
       recibiendo el tabulador y el foco se iria a un boton que no se ve. */
    Array.prototype.forEach.call(
      barra.querySelectorAll('button:not([data-ht-ocultar])'),
      function (b) { b.tabIndex = minimizado ? -1 : 0; }
    );

    try { sessionStorage.setItem(CLAVE + '-min', minimizado ? '1' : '0'); } catch (e) {}
  }

  ocultar.addEventListener('click', function () {
    minimizado = !minimizado;
    pintarMin();
  });

  /* En movil la barra entera se retira del DOM, no se esconde con CSS: un
     control invisible pero presente sigue recibiendo el tabulador. */
  function segunAncho() {
    barra.hidden = movil.matches;
    /* Al volver de movil, el panel recupera su escala. */
    if (movil.matches) {
      Array.prototype.forEach.call(
        caru.querySelectorAll('.d2-hero__panel'),
        function (p) { p.style.removeProperty('--panel-escala'); }
      );
    } else {
      pintar(actual);
    }
  }

  if (movil.addEventListener) {
    movil.addEventListener('change', segunAncho);
  }

  pintarMin();
  segunAncho();
}());
