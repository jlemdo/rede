/* ==========================================================================
   LA CALCULADORA APARECE AL LLEGAR A ELLA

   La tarjeta entera se desvanece hacia arriba cuando la seccion entra en
   pantalla: 18px de recorrido, 620ms. Sutil pero perceptible.

   POR QUE UN OBSERVADOR PROPIO Y NO LO QUE YA HAY

   Se probaron las dos vias que existian y ninguna sirve aqui:

   1. La clase .d2-entra de d2.js recoge sus elementos al cargar la pagina.
      Las diapositivas de un carrusel arrancan con [hidden], asi que la
      tarjeta nunca era observada y se quedaba en opacidad 0: invisible
      para siempre.

   2. animation-timeline: view() mide contra el ancestro con scroll mas
      cercano, y .calc lleva overflow:hidden --necesario para recortar la
      cabecera negra--. El contenedor se tomaba a si mismo como ambito y
      la animacion se daba por terminada antes de empezar. Medido: la
      opacidad era 1 durante todo el recorrido.

   Este observador se crea DESPUES de que el carrusel haya decidido que
   variante mostrar, y observa la seccion --no la tarjeta-- para que el
   overflow no interfiera.

   La tarjeta parte de opacidad 0 SOLO si este script corre. Si fallara,
   el CSS la deja visible: nunca puede quedarse en blanco.
   ========================================================================== */

(function () {
  'use strict';

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function preparar() {
    /* En el home la calculadora vive dentro del carrusel #caru-calc y hay
       que coger la variante visible. En Energy Gap Analysis va suelta, sin
       carrusel: alli el primer selector no encuentra nada y antes el
       modulo se rendia, dejando la tarjeta con la opacidad 0 que le pone
       el marcado.

       Se busca primero la del carrusel y, si no hay, la primera .calc que
       no este dentro de una diapositiva oculta. */
    var seccion = document.querySelector('#caru-calc .d2-caru__diapo:not([hidden]) .calc');

    if (!seccion) {
      var sueltas = document.querySelectorAll('.calc');
      for (var i = 0; i < sueltas.length; i++) {
        if (!sueltas[i].closest('[hidden]')) { seccion = sueltas[i]; break; }
      }
    }

    if (!seccion) { return; }

    var tarjeta = seccion.querySelector('.calc__panel');
    if (!tarjeta) { return; }

    /* Ya entro antes --por ejemplo al cambiar de variante-- y no hay que
       repetirlo: seria un parpadeo al volver a la seccion. */
    if (tarjeta.classList.contains('ha-entrado')) { return; }

    if (sinMovimiento || !('IntersectionObserver' in window)) {
      tarjeta.classList.add('ha-entrado');
      return;
    }

    tarjeta.classList.add('va-a-entrar');

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        tarjeta.classList.add('ha-entrado');
        obs.unobserve(e.target);
      });
    }, {
      /* 0.18 y no 0: con el umbral a cero la animacion arranca en cuanto
         asoma un pixel, y termina antes de que nadie la vea. */
      threshold: 0.18
    });

    obs.observe(seccion);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preparar);
  } else {
    preparar();
  }

  /* Al cambiar de variante en el carrusel, la tarjeta que entra es otra */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#caru-calc [data-caru-a], #caru-calc [data-caru-ir]')) { return; }
    window.setTimeout(preparar, 60);
  });
})();
