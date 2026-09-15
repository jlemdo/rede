/* ==========================================================================
   SELECTOR DE ONDA DE "ENERGY MANAGEMENT SOLUTIONS"

   Un control local para que Erick vea en vivo las cuatro formas de la linea
   sin decidir sobre una captura. Es temporal: se retira al elegir.

   Las cuatro salen del copy de la seccion, no de un catalogo de efectos.
   El titular dice "From scattered signals to measurable action", y esa
   frase es una transformacion: entra ruido, sale orden. Las opciones 3 y 4
   la dibujan; la 1 y la 2 son lecturas mas literales de "electricidad".

   Regla del trazado: la linea tiene que ENTRAR Y SALIR a la altura de la
   base (y=17 de un viewBox de 34) o empalma torcida con el circulo del
   nodo. Por eso el primer y ultimo punto van clavados a la base.
   ========================================================================== */

(function () {
  'use strict';

  var caru = document.getElementById('caru-rutas');
  if (!caru) { return; }

  var seccion = caru.querySelector('.d2-rutas-sec');
  if (!seccion) { return; }

  /* El SVG no lleva color: es una mascara, solo recorta. El color lo pone
     el fondo de debajo, y por eso la misma forma vale en claro y en oscuro
     sin duplicar nada. */
  function traza(d) {
    return 'url("data:image/svg+xml,' +
      "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 216 34' preserveAspectRatio='none'%3E" +
      "%3Cpath d='" + d + "' fill='none' stroke='%23000' stroke-width='2' " +
      "vector-effect='non-scaling-stroke'/%3E%3C/svg%3E" + '")';
  }

  var ONDAS = [
    /* La que esta puesta: un latido de electrocardiograma. Lo mas literal
       de "vendemos electricidad", y lo que se pidio primero. */
    { et: 'Heartbeat', d: 'M0 17h64q5 0 8-5t8 5h6l6 12l9 -26l7 14h7q5 0 9 6t9-6h83' },

    /* Sinusoidal pura: corriente alterna. Serena y regular, pero no cuenta
       la transformacion del titular: se ve igual al principio que al
       final. */
    { et: 'Sine', d: 'M0.0 17.0L2.0 15.8L4.0 14.6L6.0 13.5L8.0 12.5L10.0 11.6L12.0 10.9L14.0 10.4L16.0 10.1L18.0 10.0L20.0 10.1L22.0 10.4L24.0 10.9L26.0 11.6L28.0 12.5L30.0 13.5L32.0 14.6L34.0 15.8L36.0 17.0L38.0 18.2L40.0 19.4L42.0 20.5L44.0 21.5L46.0 22.4L48.0 23.1L50.0 23.6L52.0 23.9L54.0 24.0L56.0 23.9L58.0 23.6L60.0 23.1L62.0 22.4L64.0 21.5L66.0 20.5L68.0 19.4L70.0 18.2L72.0 17.0L74.0 15.8L76.0 14.6L78.0 13.5L80.0 12.5L82.0 11.6L84.0 10.9L86.0 10.4L88.0 10.1L90.0 10.0L92.0 10.1L94.0 10.4L96.0 10.9L98.0 11.6L100.0 12.5L102.0 13.5L104.0 14.6L106.0 15.8L108.0 17.0L110.0 18.2L112.0 19.4L114.0 20.5L116.0 21.5L118.0 22.4L120.0 23.1L122.0 23.6L124.0 23.9L126.0 24.0L128.0 23.9L130.0 23.6L132.0 23.1L134.0 22.4L136.0 21.5L138.0 20.5L140.0 19.4L142.0 18.2L144.0 17.0L146.0 15.8L148.0 14.6L150.0 13.5L152.0 12.5L154.0 11.6L156.0 10.9L158.0 10.4L160.0 10.1L162.0 10.0L164.0 10.1L166.0 10.4L168.0 10.9L170.0 11.6L172.0 12.5L174.0 13.5L176.0 14.6L178.0 15.8L180.0 17.0L182.0 18.2L184.0 19.4L186.0 20.5L188.0 21.5L190.0 22.4L192.0 23.1L194.0 23.6L196.0 23.9L198.0 24.0L200.0 23.9L202.0 23.6L204.0 23.1L206.0 22.4L208.0 21.5L210.0 20.5L212.0 19.4L214.0 18.2L216.0 17.0' },

    /* Ruido que se ordena: entra dentado y sale en onda limpia. Es el
       titular dibujado, "scattered signals" a "measurable action". */
    { et: 'Noise to wave', d: 'M0.0 17.0L2.0 22.9L4.0 13.8L6.0 23.4L8.0 15.2L10.0 17.7L12.0 22.5L14.0 14.9L16.0 22.2L18.0 15.8L20.0 21.3L22.0 21.0L24.0 16.0L26.0 10.3L28.0 20.8L30.0 19.6L32.0 14.3L34.0 10.4L36.0 16.0L38.0 18.9L40.0 11.8L42.0 24.3L44.0 14.5L46.0 22.0L48.0 24.1L50.0 24.6L52.0 22.5L54.0 16.8L56.0 24.0L58.0 19.4L60.0 18.6L62.0 21.1L64.0 18.9L66.0 23.3L68.0 22.6L70.0 20.5L72.0 15.3L74.0 17.0L76.0 17.3L78.0 14.2L80.0 14.7L82.0 15.4L84.0 10.9L86.0 11.3L88.0 14.7L90.0 12.0L92.0 12.4L94.0 10.0L96.0 11.4L98.0 14.9L100.0 10.8L102.0 17.1L104.0 15.9L106.0 14.6L108.0 19.1L110.0 17.9L112.0 21.3L114.0 18.6L116.0 18.9L118.0 20.6L120.0 19.6L122.0 22.8L124.0 21.3L126.0 21.9L128.0 21.9L130.0 22.2L132.0 20.3L134.0 19.5L136.0 20.6L138.0 19.2L140.0 20.4L142.0 17.3L144.0 16.5L146.0 14.5L148.0 14.1L150.0 14.7L152.0 13.6L154.0 12.1L156.0 13.0L158.0 11.5L160.0 11.8L162.0 11.8L164.0 11.9L166.0 10.9L168.0 12.4L170.0 12.7L172.0 13.2L174.0 13.4L176.0 15.4L178.0 16.0L180.0 16.9L182.0 17.7L184.0 18.9L186.0 19.9L188.0 21.2L190.0 21.9L192.0 22.6L194.0 22.8L196.0 23.1L198.0 23.5L200.0 23.4L202.0 23.1L204.0 22.6L206.0 22.0L208.0 21.2L210.0 20.3L212.0 19.2L214.0 18.1L216.0 17.0' },

    /* Ruido que se aplana: mismo relato pero termina en recta. La lectura
       mas fuerte de "measurable": el resultado es una linea estable. */
    { et: 'Noise to flat', d: 'M0.0 17.0L2.0 15.8L4.0 8.8L6.0 17.6L8.0 16.9L10.0 15.4L12.0 22.6L14.0 16.8L16.0 14.8L18.0 12.1L20.0 23.6L22.0 20.1L24.0 23.4L26.0 12.3L28.0 14.1L30.0 23.7L32.0 10.1L34.0 10.5L36.0 14.9L38.0 15.5L40.0 21.4L42.0 23.1L44.0 16.6L46.0 22.3L48.0 20.6L50.0 19.9L52.0 22.2L54.0 17.4L56.0 17.6L58.0 13.5L60.0 16.8L62.0 15.7L64.0 17.0L66.0 15.5L68.0 17.4L70.0 18.9L72.0 12.9L74.0 13.1L76.0 14.4L78.0 15.5L80.0 18.3L82.0 18.8L84.0 18.4L86.0 19.7L88.0 15.4L90.0 17.6L92.0 15.1L94.0 17.6L96.0 14.7L98.0 15.3L100.0 19.3L102.0 18.3L104.0 15.3L106.0 17.1L108.0 15.2L110.0 17.4L112.0 18.4L114.0 16.6L116.0 16.2L118.0 17.6L120.0 18.0L122.0 17.4L124.0 16.0L126.0 16.5L128.0 17.7L130.0 17.4L132.0 17.6L134.0 17.6L136.0 16.7L138.0 17.3L140.0 16.9L142.0 17.0L144.0 17.2L146.0 16.9L148.0 17.2L150.0 17.0L152.0 17.1L154.0 17.0L156.0 17.0L158.0 17.0L160.0 17.0L162.0 17.0L164.0 17.0L166.0 17.0L168.0 17.0L170.0 17.0L172.0 17.0L174.0 17.0L176.0 17.0L178.0 17.0L180.0 17.0L182.0 17.0L184.0 17.0L186.0 17.0L188.0 17.0L190.0 17.0L192.0 17.0L194.0 17.0L196.0 17.0L198.0 17.0L200.0 17.0L202.0 17.0L204.0 17.0L206.0 17.0L208.0 17.0L210.0 17.0L212.0 17.0L214.0 17.0L216.0 17.0' }
  ];

  var CLAVE = 'rede-rutas-onda';

  /* Arranca en "Noise to flat" (8/9/2026): es la que eligio el cliente, y
     ademas la que mejor cuenta el titular --de senales dispersas a accion
     medible--. Antes 0, el latido, que era solo la primera de la lista. */
  var actual = 3;

  try {
    var g = parseInt(sessionStorage.getItem(CLAVE), 10);
    if (!isNaN(g) && g >= 0 && g < ONDAS.length) { actual = g; }
  } catch (e) {}

  function pintar(i) {
    actual = (i + ONDAS.length) % ONDAS.length;

    /* La variable vive en .d2-rutas-sec__marca, pero se pone en la seccion
       y se hereda: asi un solo set cubre los cuatro tramos. */
    /* Se escribe --traza-onda y NO --traza-latido: el CSS lee la primera
       como valor de la segunda --var(--traza-onda, <latido>)--. Puesto
       directamente, la regla de .d2-rutas-sec__marca lo pisaria por ser
       mas especifica y los botones no cambiarian nada. */
    seccion.style.setProperty('--traza-onda', traza(ONDAS[actual].d));

    Array.prototype.forEach.call(botones, function (b, n) {
      var on = n === actual;
      b.classList.toggle('es-activo', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    try { sessionStorage.setItem(CLAVE, String(actual)); } catch (e) {}
  }

  /* --- La barra, con el mismo aspecto que los demas mandos --- */

  var barra = document.createElement('div');
  barra.className = 'd2-caru__mandos d2-rutas-ondas';
  barra.innerHTML =
    '<button class="d2-caru__ocultar" type="button" data-ro-ocultar aria-expanded="true" aria-label="Close line options">' +
      '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<span class="d2-rutas-ondas__eti">Line</span>' +
    '<div class="d2-caru__puntos" role="tablist" aria-label="Connector line shape">' +
      ONDAS.map(function (o, i) {
        return '<button class="d2-caru__punto" type="button" role="tab" aria-selected="false" data-ro-a="' + i + '">' +
               '<span>' + (i + 1) + '</span><small>' + o.et + '</small></button>';
      }).join('') +
    '</div>';

  caru.appendChild(barra);

  var botones = barra.querySelectorAll('[data-ro-a]');

  Array.prototype.forEach.call(botones, function (b, n) {
    b.addEventListener('click', function () { pintar(n); });
  });

  /* Minimizar, igual que el resto de mandos */
  var ocultar = barra.querySelector('[data-ro-ocultar]');
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
    ocultar.setAttribute('aria-label', minimizado ? 'Show line options' : 'Close line options');

    Array.prototype.forEach.call(
      barra.querySelectorAll('button:not([data-ro-ocultar])'),
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
}());
