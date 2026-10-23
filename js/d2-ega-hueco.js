/* ==========================================================================
   EL HUECO DE LA COMPARATIVA  (22/10/2026)

   El rotulo que va sobre la tabla y la nota que va debajo tienen que
   compartir eje con las DOS COLUMNAS de datos, no con el panel entero.

   El problema: entre el borde del panel y la primera columna hay una
   columna de criterios --FOCUS, KEY QUESTION...-- que no tiene cabecera.
   Ese hueco NO tiene ancho fijo: la tabla lo reparte segun el texto, y
   medido da 120px en escritorio, 96 a 620 y 78 a 390.

   Con el padding escrito a mano en CSS habia que perseguir cada ancho
   con un @media, y entre corte y corte el texto quedaba descolgado --se
   midieron 42px de desfase a 768 y 900 con el primer intento--.

   Asi que se mide la celda real y se publica en --ega-hueco. El CSS solo
   la consume. Si manana cambia el texto de los criterios y la columna se
   ensancha, esto sigue cuadrando sin tocar nada.

   SI EL JS NO CARGA no se rompe nada: la variable cae a 0px y el texto
   queda alineado con el panel, que es como estaba antes.
   ========================================================================== */
(function () {
  'use strict';

  var paneles = document.querySelectorAll('.ega-comp__panel');
  if (!paneles.length) { return; }

  function medir() {
    for (var i = 0; i < paneles.length; i++) {
      var panel = paneles[i];
      var esquina = panel.querySelector('.ega-tabla__esquina');
      if (!esquina) { continue; }

      /* La celda vacia de la esquina ocupa exactamente el ancho de la
         columna de criterios, asi que sirve de regla. */
      var ancho = esquina.getBoundingClientRect().width;

      /* Por debajo de cierto ancho el texto se queda sin sitio: a 390 el
         hueco son 78px de los 335 del panel, casi una cuarta parte. Ahi
         se renuncia al guino y se alinea con el panel. */
      if (panel.getBoundingClientRect().width < 420) { ancho = 0; }

      panel.style.setProperty('--ega-hueco', Math.round(ancho) + 'px');
    }
  }

  medir();

  /* Al cambiar el ancho la tabla reparte otra vez, asi que hay que
     volver a medir. ResizeObserver y no `resize`: la tabla tambien
     cambia si cambia el tamano de letra del navegador. */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(medir);
    for (var j = 0; j < paneles.length; j++) { ro.observe(paneles[j]); }
  } else {
    window.addEventListener('resize', medir);
  }

  /* Las fuentes web cambian el ancho del texto al cargar, y con el la
     columna. Sin esto la primera medida se toma con la fuente de
     sistema y queda desfasada. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(medir);
  }
})();
