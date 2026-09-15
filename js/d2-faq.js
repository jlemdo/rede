/* ==========================================================================
   LAS PREGUNTAS — LA FICHA DE DATOS

   Casi todo el trabajo lo hace el HTML: <details name="faq-dato"> da
   acordeon exclusivo, accesible y navegable por teclado sin una linea de
   JS. Es el patron que usan Vercel y SevenGrid en produccion.

   Esto solo rellena la ficha lateral con los datos del item abierto.

   Por que la ficha existe: la primera version de esta seccion era correcta
   y estaba muerta --texto y nada mas--. El mapa de cartera funciona porque
   hay algo que observar y que cambia. Aqui el dato cambia porque el usuario
   ha preguntado otra cosa, no porque toque animar algo.

   Las cifras salen de los data- del marcado, que a su vez salen del copy
   aprobado. Si una pregunta no tiene dato verificado, no lleva ficha: antes
   un hueco que un numero inventado.
   ========================================================================== */

(function () {
  'use strict';

  var lista = document.querySelector('.d2-faq-dato__lista');
  if (!lista) { return; }

  var items = lista.querySelectorAll('.d2-faq-dato__item');
  var caja  = document.querySelector('.d2-faq-dato__ficha');
  if (!caja || !items.length) { return; }

  var eti   = caja.querySelector('[data-ficha-eti]');
  var cifra = caja.querySelector('[data-ficha-cifra]');
  var nota  = caja.querySelector('[data-ficha-nota]');
  var interior = caja.querySelector('.d2-faq-dato__ficha-caja');

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pintar(item) {
    if (!item) { return; }

    var c = item.getAttribute('data-cifra');

    /* Sin dato no hay ficha. Es deliberado: la alternativa seria rellenarla
       con algo generico, y eso es justo lo que convierte un dato en ruido.

       PERO SE OCULTA LA FICHA, NO EL PANEL (14/9/2026)

       Antes esto hacia `caja.hidden = true`, y `caja` es el <aside> entero.
       Cuando aqui solo vivia la ficha, daba igual. Desde el 4/9 ese aside
       contiene el mapa de barrios, asi que ocultarlo se llevaba el mapa por
       delante.

       No se noto hasta hoy porque las diez preguntas antiguas tenian todas
       su data-cifra: la rama del `if` no llegaba a ejecutarse nunca. Con el
       copy final del cliente solo dos de once traen cifra, y el mapa
       desaparecia en las otras nueve.

       Y hay un matiz que conviene dejar escrito: la ficha de cifras esta
       COMENTADA en el marcado desde ese mismo 4/9, asi que `interior`,
       `cifra`, `eti` y `nota` son null en el home. Todo lo que hay debajo
       va guardado con `if (...)` y no rompe nada; el modulo se queda
       practicamente inerte, que es lo correcto mientras la ficha no
       vuelva. Si algun dia se descomenta, esto sigue funcionando. */
    if (!c) {
      if (interior) { interior.hidden = true; }
      return;
    }

    caja.hidden = false;
    if (interior) { interior.hidden = false; }
    if (eti)   { eti.textContent   = item.getAttribute('data-eti')  || ''; }
    if (nota)  { nota.textContent  = item.getAttribute('data-nota') || ''; }

    /* innerHTML y no textContent porque algunas cifras traen entidades
       --&ndash; en "1&ndash;2%"-- y textContent las escribiria literales. */
    if (cifra) { cifra.innerHTML = c; }

    /* Reinicia la entrada. El reflow entre medias es necesario: sin el, el
       navegador agrupa los dos cambios y la animacion no llega a verse. */
    if (interior && !sinMovimiento) {
      interior.style.animation = 'none';
      void interior.offsetWidth;
      interior.style.animation = '';
    }
  }

  Array.prototype.forEach.call(items, function (item) {
    /* toggle salta tanto al abrir como al cerrar. Con name= el navegador
       cierra el anterior solo, asi que basta con atender al que se abre. */
    item.addEventListener('toggle', function () {
      if (item.open) { pintar(item); }
    });
  });

  /* El estado inicial: el que venga abierto en el marcado */
  var abierto = lista.querySelector('.d2-faq-dato__item[open]');
  pintar(abierto || items[0]);
})();
