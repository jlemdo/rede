/* ==========================================================================
   LA SEÑAL DE "ENERGY MANAGEMENT SOLUTIONS" ARRANCA AL VERSE

   El pulso que recorre la linea dura 13s y su recorrido son 1.9s. Arrancando
   al cargar la pagina, quien llega arriba del todo se pierde el paso: para
   cuando baja hasta aqui, la señal ya cruzo y solo queda la espera.

   Con esto empieza cuando la seccion entra en pantalla, asi que el recorrido
   se ve entero y desde el principio.

   Se observa la SECCION y no cada tramo: los cuatro comparten un desfase de
   0.95s entre ellos, y si cada uno arrancara al entrar por su cuenta el
   desfase se perderia y se verian cuatro destellos sueltos en vez de una
   sola señal recorriendo la fila.
   ========================================================================== */

(function () {
  'use strict';

  var secciones = document.querySelectorAll('.d2-rutas-sec');
  if (!secciones.length) { return; }

  function despertar(sec) {
    sec.classList.add('esta-viva');
  }

  /* Sin IntersectionObserver --navegadores viejos-- se arranca sin mas: es
     preferible la animacion en mal momento a una linea muerta. */
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(secciones, despertar);
    return;
  }

  /* 0.35 y no 0.25 como el panel: la seccion es alta --875px-- y con un
     cuarto visible la fila de nodos todavia esta por debajo del pliegue. */
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) { return; }
      despertar(e.target);
      observador.unobserve(e.target);
    });
  }, { threshold: 0.35 });

  Array.prototype.forEach.call(secciones, function (s) { observador.observe(s); });

  /* Al cambiar de variante en el carrusel, la que entra nunca fue observada:
     estaba con [hidden] y para el observador no existia. Se despierta a mano
     o se quedaria con la linea quieta. */
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.d2-caru__mandos')) { return; }
    setTimeout(function () {
      Array.prototype.forEach.call(secciones, function (s) {
        if (s.offsetParent !== null) { despertar(s); }
      });
    }, 60);
  });
}());
