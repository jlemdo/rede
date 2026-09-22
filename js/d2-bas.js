/* ==========================================================================
   EL DIAGRAMA DEL BAS EN EL FAQ DE RECOMMISSIONING  (21/9/2026)
   ========================================================================== */

/* El recorrido y los nodos, con UN SOLO RELOJ y la posicion REAL.

   Dos fallos corregidos:

   1. La cabeza del trazo se calculaba con una regla de tres sobre el
      viewBox, y salia entre 20 y 40px adelantada respecto a donde el
      navegador la pintaba. El nodo se encendia tarde --visible a simple
      vista--. Ahora la posicion se PREGUNTA al propio trazado con
      getPointAtLength, que es quien sabe donde esta.

      La comprobacion anterior daba "0 desfases" porque repetia la misma
      formula equivocada: se verificaba a si misma.

   2. El trazo era un guion de 46px sobre una via de 216: apenas se veia y
      parecia un error de dibujo. Ahora es un tramo largo que avanza como
      una carga, con la cabeza marcada por un punto.
*/
(function () {
  'use strict';

  var PASOS = [
    { y: 130, quien: 'Rede analyzes',
      que: 'Rede reviews the building automation system: scheduling, setpoint and control sequence analysis.' },
    { y: 200, quien: "Reviews contractor's performance",
      que: 'Your authorized controls contractor makes the approved changes. Rede reviews the work against what was documented.' },
    { y: 270, quien: 'Rede suggests adjustments',
      que: 'Measurement and verification against the agreed baseline, and the adjustments that follow from it.' }
  ];

  var VUELTA = 9000;      /* el recorrido completo */
  var ESPERA = 1100;      /* pausa al final, antes de volver a empezar */

  var caja = document.querySelector('[data-bas]');
  if (!caja) { return; }

  var flujo  = caja.querySelector('[data-bas-flujo]');
  var cabeza = caja.querySelector('[data-bas-cabeza]');
  var nodos  = caja.querySelectorAll('[data-bas-paso]');
  var ficha  = caja.querySelector('[data-bas-ficha]');
  var elQuien = caja.querySelector('[data-bas-quien]');
  var elQue   = caja.querySelector('[data-bas-que]');

  var largo = flujo.getTotalLength();
  flujo.style.strokeDasharray = largo + ' ' + largo;

  var activo = -2, fijado = false, corriendo = false, t0 = null, pausa = 0;
  var lento = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function muestra(n) {
    if (n === activo) { return; }
    activo = n;
    for (var k = 0; k < nodos.length; k++) {
      nodos[k].classList.toggle('es-activo', k === n);
    }
    if (n < 0) { return; }
    elQuien.textContent = PASOS[n].quien;
    elQue.textContent = PASOS[n].que;
    ficha.classList.remove('es-nueva');
    void ficha.offsetWidth;
    ficha.classList.add('es-nueva');
  }

  function paso(t) {
    if (!corriendo) { return; }
    if (t0 === null) { t0 = t - pausa; }

    var ciclo = VUELTA + ESPERA;
    var dentro = (t - t0) % ciclo;
    var avance = Math.min(1, dentro / VUELTA);

    /* El trazo crece de arriba abajo */
    var hecho = avance * largo;
    flujo.style.strokeDashoffset = String(largo - hecho);

    /* LA POSICION REAL: se la pedimos al trazado, no la calculamos */
    var pt = flujo.getPointAtLength(hecho);
    cabeza.setAttribute('cx', pt.x);
    cabeza.setAttribute('cy', pt.y);
    cabeza.style.opacity = (avance > 0 && avance < 1) ? '1' : '0';

    if (!fijado) {
      var n = -1;
      for (var k = 0; k < PASOS.length; k++) {
        if (pt.y >= PASOS[k].y) { n = k; }
      }
      muestra(n);
    }
    requestAnimationFrame(paso);
  }

  function arranca() {
    if (corriendo || lento) { return; }
    corriendo = true; t0 = null;
    requestAnimationFrame(paso);
  }
  function para() {
    corriendo = false;
    if (t0 !== null) { pausa = performance.now() - t0; }
  }

  for (var k = 0; k < nodos.length; k++) {
    (function (n) {
      function fija() { fijado = true; muestra(n); }
      function suelta() { fijado = false; }
      nodos[n].addEventListener('mouseenter', fija);
      nodos[n].addEventListener('focus', fija);
      nodos[n].addEventListener('click', fija);
      nodos[n].addEventListener('mouseleave', suelta);
      nodos[n].addEventListener('blur', suelta);
      nodos[n].addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fija(); }
      });
    }(k));
  }

  if (lento) {
    flujo.style.strokeDashoffset = '0';
    cabeza.style.opacity = '0';
    muestra(0);
    return;
  }
  muestra(-1);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es[0].isIntersecting ? arranca() : para();
    }, { threshold: .25 }).observe(caja);
  } else { arranca(); }
}());
