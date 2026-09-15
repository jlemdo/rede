/* ==========================================================================
   SELECTOR DE IMAGEN DEL HERO

   Un control local para probar el fondo del hero sin tocar nada mas. Es
   temporal: se retira al elegir.

   Va aparte del selector de variantes --Original / Smaller panel /
   Translucent-- porque son dos decisiones distintas: aquel cambia la
   DISPOSICION del panel y este solo la FOTO. Cruzarlos en una sola barra
   daria nueve combinaciones y ninguna se leeria.

   Las tres variantes del hero llevan su propia <img>, asi que el cambio se
   aplica a las tres a la vez: la foto no depende de la disposicion.
   ========================================================================== */

(function () {
  'use strict';

  var caru = document.getElementById('caru-hero');
  if (!caru) { return; }

  var fondos = caru.querySelectorAll('.d2-hero__fondo');
  if (!fondos.length) { return; }

  /* Las tres del cliente. Llegaron en PNG de 1.5 y 1.9 MB y se pasaron a
     JPG: 164 y 220 KB, un 89% menos y por debajo de la que ya habia. En un
     hero con fetchpriority=high el peso se nota en lo primero que se ve.

     Ojo con la proporcion: la 1 es 1920x1047 (1.83) y las otras dos
     1448x1086 (1.33), mas cuadradas. object-fit: cover las recorta sin
     deformarlas, pero encuadran distinto. */
  var IMAGENES = [
    { et: 'Render',   src: 'assets/img/building-render.jpg', enc: '' },
    { et: 'Flow',     src: 'assets/img/hero-flujo.jpg',      enc: 'es-enc-diagrama' },
    { et: 'District', src: 'assets/img/hero-distrito.jpg',   enc: 'es-enc-escena' }
  ];

  var ENCUADRES = ['es-enc-diagrama', 'es-enc-escena'];

  var CLAVE = 'rede-hero-imagen';
  var CLAVE_PANEL = 'rede-hero-panel';

  /* Arranca en District y SIN panel (8/9/2026): es lo que eligio el
     cliente. Antes 0 --Render-- y el panel visible, que era solo el orden
     de la lista. */
  var actual = 2;
  var panelVisible = false;

  try {
    var gp = sessionStorage.getItem(CLAVE_PANEL);
    if (gp !== null) { panelVisible = gp !== '0'; }
  } catch (e) {}

  try {
    var g = parseInt(sessionStorage.getItem(CLAVE), 10);
    if (!isNaN(g) && g >= 0 && g < IMAGENES.length) { actual = g; }
  } catch (e) {}

  /* El aviso de hueco vacio se crea una vez y se mueve, en lugar de uno por
     variante: solo hay una visible a la vez. */
  var aviso = document.createElement('p');
  aviso.className = 'd2-hero__sin-imagen';
  aviso.hidden = true;
  aviso.textContent = 'Image pending';

  function pintar(i) {
    actual = (i + IMAGENES.length) % IMAGENES.length;
    var im = IMAGENES[actual];

    Array.prototype.forEach.call(fondos, function (img) {
      /* Cada imagen trae su encuadre: el de la original esta calibrado para
         una proporcion 1.83 y las otras dos son 1.33. Con el mismo recorte
         para todas, el diagrama salia cortado por arriba y por abajo y al
         edificio se le iba el remate. */
      ENCUADRES.forEach(function (c) { img.classList.remove(c); });
      if (im.enc) { img.classList.add(im.enc); }

      if (im.src) {
        img.src = im.src;
        img.hidden = false;
      } else {
        /* removeAttribute y no src='': con la cadena vacia el navegador
           vuelve a pedir la pagina actual como si fuera una imagen. */
        img.removeAttribute('src');
        img.hidden = true;
      }
    });

    if (im.src) {
      if (aviso.parentNode) { aviso.parentNode.removeChild(aviso); }
      aviso.hidden = true;
    } else {
      var viva = caru.querySelector('.d2-caru__diapo:not([hidden]) .d2-hero');
      if (viva) { viva.appendChild(aviso); aviso.hidden = false; }
    }

    Array.prototype.forEach.call(botones, function (b, n) {
      var on = n === actual;
      b.classList.toggle('es-activo', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    try { sessionStorage.setItem(CLAVE, String(actual)); } catch (e) {}
  }

  /* El panel de datos se puede quitar: con la imagen del flujo energetico
     tapa parte del diagrama, y ahi la foto es el mensaje. Se oculta con
     hidden y no con display:none desde CSS para que salga tambien del
     arbol de accesibilidad --si no, el lector de pantalla seguiria
     leyendo unas cifras que no estan en pantalla--. */
  function pintarPanel() {
    Array.prototype.forEach.call(caru.querySelectorAll('.d2-panel'), function (pn) {
      pn.hidden = !panelVisible;
    });
    if (botonPanel) {
      botonPanel.classList.toggle('es-activo', !panelVisible);
      botonPanel.setAttribute('aria-pressed', panelVisible ? 'false' : 'true');
    }
    try { sessionStorage.setItem(CLAVE_PANEL, panelVisible ? '1' : '0'); } catch (e) {}
  }

  /* --- La barra, con el mismo aspecto que los demas mandos --- */

  var barra = document.createElement('div');
  barra.className = 'd2-caru__mandos d2-hero-imagenes';
  barra.innerHTML =
    '<button class="d2-caru__ocultar" type="button" data-hi-ocultar aria-expanded="true" aria-label="Close image options">' +
      '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<span class="d2-hero-imagenes__eti">Hero image</span>' +
    '<div class="d2-caru__puntos" role="tablist" aria-label="Hero background image">' +
      IMAGENES.map(function (im, i) {
        return '<button class="d2-caru__punto" type="button" role="tab" aria-selected="false" data-hi-a="' + i + '">' +
               '<span>' + (i + 1) + '</span><small>' + im.et + '</small></button>';
      }).join('') +
    '</div>' +
    /* aria-pressed y no role=tab: es un interruptor, no una opcion mas de
       la lista de imagenes. */
    '<button class="d2-caru__punto d2-hero-imagenes__panel" type="button" ' +
            'data-hi-panel aria-pressed="false">' +
      '<small>No panel</small>' +
    '</button>';

  caru.appendChild(barra);

  var botones = barra.querySelectorAll('[data-hi-a]');
  var botonPanel = barra.querySelector('[data-hi-panel]');

  botonPanel.addEventListener('click', function () {
    panelVisible = !panelVisible;
    pintarPanel();
  });

  Array.prototype.forEach.call(botones, function (b, n) {
    b.addEventListener('click', function () { pintar(n); });
  });

  /* Al cambiar de variante del hero, el aviso tiene que seguir a la que
     quede visible: si no, se queda en una diapositiva oculta. */
  Array.prototype.forEach.call(caru.querySelectorAll('[data-caru-a], [data-caru-ir]'), function (b) {
    b.addEventListener('click', function () {
      setTimeout(function () { pintar(actual); pintarPanel(); }, 0);
    });
  });

  /* Minimizar, igual que el resto de mandos */
  var ocultar = barra.querySelector('[data-hi-ocultar]');
  /* En movil arrancan recogidas, igual que los mandos del carrusel: son
     controles de PRUEBA y no deben tapar el diseno. Una eleccion ya
     guardada en la sesion manda sobre esto. */
  var esMovil = window.matchMedia('(max-width: 640px)').matches;
  var minimizado;
  try {
    var guardado = sessionStorage.getItem(CLAVE + '-min');
    minimizado = guardado === null ? esMovil : guardado === '1';
  } catch (e) { minimizado = esMovil; }

  function pintarMin() {
    barra.classList.toggle('esta-minimizado', minimizado);
    ocultar.setAttribute('aria-expanded', minimizado ? 'false' : 'true');
    ocultar.setAttribute('aria-label', minimizado ? 'Show image options' : 'Close image options');

    Array.prototype.forEach.call(
      barra.querySelectorAll('button:not([data-hi-ocultar])'),
      function (b) { b.tabIndex = minimizado ? -1 : 0; }
    );

    try { sessionStorage.setItem(CLAVE + '-min', minimizado ? '1' : '0'); } catch (e) {}
  }

  ocultar.addEventListener('click', function () {
    minimizado = !minimizado;
    pintarMin();
  });

  pintarMin();
  pintar(actual);
  pintarPanel();
}());
