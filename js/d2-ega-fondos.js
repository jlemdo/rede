/* ==========================================================================
   FINANCIACION — EL SELECTOR DE PROVINCIA (variante "Focus")

   El visitante elige su provincia y lee solo la que le aplica. Responde su
   pregunta --"que hay para mi"-- en un clic, en vez de pedirle que descarte
   dos bloques que no le sirven.

   POR QUE NO ES UN ACORDEON

   La investigacion de 2026 lo desaconseja para esta seccion concreta: un
   acordeon cerrado esconde justo lo que el visitante esta escaneando. Las
   propias utilities --BC Hydro, verificado-- usan tarjetas abiertas.

   LOS TRES PANELES ESTAN EN EL DOM

   Se ocultan con `hidden`, no se cargan al pulsar. Asi el contenido es
   indexable por buscadores y se encuentra con Ctrl+F aunque su panel no
   este a la vista.

   SI EL GUION NO CORRE

   El primer panel ya viene visible desde el marcado y los otros dos con
   `hidden`. Se ve una provincia en lugar de las tres, que es peor que el
   estado completo pero no deja la seccion rota.
   ========================================================================== */

(function () {
  'use strict';

  var secciones = document.querySelectorAll('.d2-ega-fon3');
  if (!secciones.length) { return; }

  Array.prototype.forEach.call(secciones, function (sec) {

    var tabs = sec.querySelectorAll('[data-fon]');
    var paneles = sec.querySelectorAll('[data-fon-panel]');
    if (!tabs.length || !paneles.length) { return; }

    function mostrar(n) {
      Array.prototype.forEach.call(tabs, function (t) {
        var on = t.getAttribute('data-fon') === String(n);
        t.classList.toggle('es-activo', on);
        /* aria-selected y no solo la clase: sin el, un lector de pantalla
           lee los tres botones igual y no hay forma de saber cual esta
           elegido. */
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      Array.prototype.forEach.call(paneles, function (p) {
        p.hidden = p.getAttribute('data-fon-panel') !== String(n);
      });
    }

    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener('click', function () {
        mostrar(t.getAttribute('data-fon'));
      });
    });

    /* Las flechas mueven entre provincias, como en cualquier tablist.
       Sin esto el teclado obliga a tabular por los tres botones. */
    sec.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
      var activo = sec.querySelector('[data-fon].es-activo');
      if (!activo || document.activeElement !== activo) { return; }

      var i = parseInt(activo.getAttribute('data-fon'), 10);
      var n = e.key === 'ArrowRight' ? i + 1 : i - 1;
      if (n < 0) { n = tabs.length - 1; }
      if (n >= tabs.length) { n = 0; }

      mostrar(n);
      var nuevo = sec.querySelector('[data-fon="' + n + '"]');
      if (nuevo) { nuevo.focus(); }
      e.preventDefault();
    });

  });
}());
