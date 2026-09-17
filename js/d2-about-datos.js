/* ==========================================================================
   LOS DATOS DEL HERO DE ABOUT, ROTANDO (16/9/2026)

   Se muestran de uno en uno porque los tres a la vez no caben en una
   linea: piden 797px y la columna da 610.

   LO QUE NO HACE

   No para nunca solo. Son tres datos cortos, el ciclo dura 12 segundos y
   no hay nada que leer con calma, asi que WCAG 2.2.2 no pide un boton de
   pausa aqui --lo pide para movimiento que dure mas de cinco segundos Y
   compita con contenido que el usuario esta leyendo--. Aun asi se detiene
   al pasar el raton y al enfocar con el teclado, que es lo que evita que
   el dato cambie justo cuando alguien lo esta mirando.
   ========================================================================== */
(function () {
  'use strict';

  var lista = document.querySelector('.ab-hero__datos[data-rota]');
  if (!lista) { return; }

  var items = [].slice.call(lista.children);
  if (items.length < 2) { return; }   // con uno solo no hay nada que rotar

  var PAUSA = 4000;
  var actual = 0;
  var reloj = null;

  /* El relevo tiene tres estados y no dos:

       en reposo      abajo, esperando
       visible        en su sitio
       saliendo       subiendo y desapareciendo por arriba

     El tercero hace falta para que el movimiento no cambie de sentido: sin
     el, el que se va volveria ABAJO mientras el nuevo sube, y se verian
     dos cosas moviendose en direcciones opuestas. */
  function mostrar(n) {
    items.forEach(function (el, i) {
      if (i === actual && i !== n) {
        el.classList.remove('es-visible');
        el.classList.add('esta-saliendo');
        /* Se limpia cuando ya no se ve, para que la proxima vez entre
           desde abajo otra vez y no desde arriba. */
        setTimeout(function () { el.classList.remove('esta-saliendo'); }, 400);
      } else if (i === n) {
        el.classList.remove('esta-saliendo');
        el.classList.add('es-visible');
      }
    });
    actual = n;
  }

  function arrancar() {
    if (reloj) { return; }
    reloj = setInterval(function () {
      mostrar((actual + 1) % items.length);
    }, PAUSA);
  }

  function parar() {
    clearInterval(reloj);
    reloj = null;
  }

  mostrar(0);
  arrancar();

  /* Se detiene mientras el raton esta encima o algo de dentro tiene el
     foco: si alguien se para a leer un dato, no se le cambia debajo. */
  lista.addEventListener('mouseenter', parar);
  lista.addEventListener('mouseleave', arrancar);
  lista.addEventListener('focusin', parar);
  lista.addEventListener('focusout', arrancar);

  /* Y en segundo plano no corre: rotar en una pestana que nadie mira solo
     gasta bateria. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); } else { arrancar(); }
  });
})();
