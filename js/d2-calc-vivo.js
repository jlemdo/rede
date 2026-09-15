/* ==========================================================================
   LA CALCULADORA COBRA VIDA

   Dos cosas que el CSS no puede hacer solo:

   1. LA COREOGRAFIA DEL RESULTADO (las tres variantes)
      Al calcular, el codigo del cliente esconde el formulario con `hidden`
      y muestra el resultado. `hidden` es display:none: no hay nada que
      animar y el cambio era un corte seco.

      Aqui se intercepta ese momento: el formulario se retira con un giro
      corto y el resultado entra desde el angulo contrario, como si siempre
      hubiera estado detras de la tarjeta. Es el mismo lenguaje del giro que
      la tarjeta derecha ya tiene, no un efecto nuevo.

      No hace falta GSAP: son dos transformaciones con la curva de la web,
      y la plataforma las resuelve en el compositor.

   2. EL INDICADOR DE CONFIANZA (solo el tablero)
      La barra que se llena con las cuatro respuestas nucleares. Kerr, van
      der Bles y Spiegelhalter (Royal Society Open Science 2023, n=10.519):
      cuantificar la incertidumbre apenas resta confianza en el numero y no
      daña la confianza en la fuente; cubrirse solo con palabras daña ambas.

   La logica del cliente no se toca: esto observa lo que su codigo ya hace
   y le pone movimiento encima.
   ========================================================================== */

(function () {
  'use strict';

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(document.querySelectorAll('.calc'), function (seccion) {

    /* --------------------------------------------------------------------
       1. La coreografia: el formulario se retira, el resultado entra
       -------------------------------------------------------------------- */

    var pasos = seccion.querySelector('#pasos');
    var cierre = seccion.querySelector('#cierre');

    if (pasos && cierre && !sinMovimiento && 'MutationObserver' in window) {
      var coreografiando = false;

      new MutationObserver(function () {
        /* Solo interesa el instante en que el cliente lo esconde. El resto
           de cambios de atributo (incluidos los nuestros) se ignoran. */
        if (!pasos.hidden || coreografiando) { return; }
        coreografiando = true;

        /* Se reabre un instante para poder despedirlo con el giro; el CSS
           de .se-va lo saca de escena y de los eventos. */
        pasos.hidden = false;
        pasos.classList.add('se-va');

        window.setTimeout(function () {
          pasos.hidden = true;
          pasos.classList.remove('se-va');
          window.setTimeout(function () { coreografiando = false; }, 50);
        }, 460);
      }).observe(pasos, { attributes: true, attributeFilter: ['hidden'] });
    }

    /* --------------------------------------------------------------------
       2. El indicador de confianza — solo el tablero
       -------------------------------------------------------------------- */

    if (!seccion.classList.contains('calc--partido')) { return; }

    var resultado = seccion.querySelector('.resultado');
    var cifra = seccion.querySelector('#cifra');
    if (!resultado || !cifra) { return; }

    var caja = document.createElement('div');
    caja.className = 'd2-margen';
    caja.innerHTML =
      '<div class="d2-margen__cab">' +
        '<span class="d2-margen__eti">Estimate confidence</span>' +
        '<span class="d2-margen__pct" data-pct>0%</span>' +
      '</div>' +
      '<div class="d2-margen__via" role="presentation">' +
        '<span class="d2-margen__lleno" data-lleno></span>' +
      '</div>' +
      '<p class="d2-margen__nota" data-nota>Answer the four questions to narrow this estimate.</p>';

    /* Va tras la lista del perfil, dentro del panel que se ve MIENTRAS se
       rellena. Colgada del desglose quedaba en la cara oculta y media 0x0. */
    var perfil = seccion.querySelector('#perfil');
    var espera = seccion.querySelector('#espera');

    if (perfil && perfil.parentNode) {
      perfil.parentNode.insertBefore(caja, perfil.nextSibling);
    } else if (espera) {
      espera.appendChild(caja);
    } else {
      resultado.appendChild(caja);
    }

    var lleno = caja.querySelector('[data-lleno]');
    var pct   = caja.querySelector('[data-pct]');
    var nota  = caja.querySelector('[data-nota]');

    var TEXTOS = [
      'Answer the four questions to narrow this estimate.',
      'Three more answers will narrow this estimate.',
      'Two more answers will narrow this estimate.',
      'One more answer will narrow this estimate.',
      'Based on all four answers. Still a planning benchmark, not a guarantee.'
    ];

    /* La confianza se mide sobre las cuatro respuestas NUCLEARES del
       calculo. El perfil ahora enseña mas filas (gasto, sitios), pero esas
       son opcionales: contar con ellas dejaria la barra incompleta para
       siempre cuando el gasto no se indica. */
    var NUCLEO = ['scope', 'sector', 'tipo', 'area'];

    function contar() {
      return NUCLEO.filter(function (k) {
        var f = seccion.querySelector('.perfil__fila[data-fila="' + k + '"]');
        return f && f.classList.contains('is-lleno');
      }).length;
    }

    function pintar() {
      var n = contar();
      var p = n / NUCLEO.length;

      lleno.style.transform = 'scaleX(' + p + ')';
      pct.textContent = Math.round(p * 100) + '%';
      nota.textContent = TEXTOS[n];

      caja.classList.toggle('esta-completo', n === NUCLEO.length);
      resultado.classList.toggle('es-provisional', n < NUCLEO.length);
    }

    /* La cifra entra con transicion cruzada al cambiar. Se observa el texto
       en vez de escuchar eventos: el valor lo escribe el cliente. */
    if (!sinMovimiento && 'MutationObserver' in window) {
      var anterior = cifra.textContent;
      new MutationObserver(function () {
        if (cifra.textContent === anterior) { return; }
        anterior = cifra.textContent;
        cifra.classList.remove('esta-cambiando');
        void cifra.offsetWidth;
        cifra.classList.add('esta-cambiando');
      }).observe(cifra, { childList: true, characterData: true, subtree: true });
    }

    ['change', 'input', 'click'].forEach(function (ev) {
      seccion.addEventListener(ev, function () {
        window.setTimeout(pintar, 30);
      });
    });

    pintar();
  });
})();
