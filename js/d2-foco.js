/* ==========================================================================
   FRANJA DE FOCO — EL RELEVO DE LOGOS

   El logo de la tarjeta va cambiando: cada pocos segundos entra uno de los
   seis de la derecha y el que estaba sale a ocupar su hueco.

   POR QUE ROTA
   No sabemos que distrito genero los $4.4M. Con un logo fijo, la tarjeta
   afirma que fue ESE cliente. Rotando, la cifra queda atribuida a la
   cartera entera, que es lo que de verdad podemos sostener.

   POR QUE ES UN INTERCAMBIO Y NO DOS ROTACIONES
   Si el foco girase por su lado y la rejilla por el suyo, tarde o temprano
   el mismo distrito saldria en los dos sitios a la vez y se leeria como un
   error. Aqui se PERMUTAN: el que entra al foco deja libre su casilla, y el
   saliente la ocupa. Siempre hay siete distintos.

   COMO SE ANIMA
   El intercambio es un cruce, no un parpadeo: el saliente se va hacia su
   destino mientras el entrante llega desde el suyo. Las dos mitades se
   solapan, asi que se lee como UN movimiento y no como dos.

   Se anima opacity y transform, que el navegador resuelve sin repintar.

   ACCESIBILIDAD
   El movimiento se detiene al pasar el raton o al enfocar con el teclado, y
   no arranca hasta que la seccion esta a la vista. Respeta
   prefers-reduced-motion quedandose quieto en el estado inicial.

   Aunque supera los 5 segundos --lo que activa WCAG 2.2.2-- el contenido no
   se pierde: los siete logos estan siempre presentes en el DOM y a la
   vista; lo unico que cambia es cual ocupa la tarjeta. No hay informacion
   que solo exista durante un instante.
   ========================================================================== */

(function () {
  'use strict';

  var seccion = document.querySelector('.d2-foco');
  if (!seccion) { return; }

  var foco = seccion.querySelector('.d2-foco__prueba-logo');
  var casillas = Array.prototype.slice.call(
    seccion.querySelectorAll('.d2-foco__resto li')
  );
  if (!foco || !casillas.length) { return; }

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sinMovimiento) { return; }

  var PAUSA = 4200;   /* lo que cada logo se queda en la tarjeta */

  /* El doble de la transicion del CSS (420ms), para que el cambio de
     imagen caiga justo cuando la opacidad ha llegado a cero. Descuadrado,
     el logo se sustituye mientras todavia se ve y aparece un corte. */
  var CRUCE = 840;

  var turno = 0;
  var reloj = null;
  var enMarcha = false;
  var detenido = false;

  /* Se guarda el dato de cada imagen en vez de mover nodos: intercambiar
     elementos del DOM reinicia sus animaciones y pierde el foco del
     teclado si estaba dentro. */
  function leer(img) {
    return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
  }

  function escribir(img, d) {
    img.setAttribute('src', d.src);
    img.setAttribute('alt', d.alt);
  }

  function intercambiar() {
    var casilla = casillas[turno % casillas.length];
    var entra = casilla.querySelector('img');
    if (!entra) { return; }

    var datoFoco = leer(foco);
    var datoCasilla = leer(entra);

    /* Primera mitad: los dos se retiran hacia el otro. La casilla se
       encoge un poco y la tarjeta se expande, que es lo que da la
       sensacion de relevo en vez de dos desvanecidos sueltos. */
    foco.classList.add('esta-saliendo');
    casilla.classList.add('esta-saliendo');

    setTimeout(function () {
      /* Se cruzan los datos en el punto medio, cuando ambos estan
         invisibles: el cambio de src no se llega a ver. */
      escribir(foco, datoCasilla);
      escribir(entra, datoFoco);

      foco.classList.remove('esta-saliendo');
      casilla.classList.remove('esta-saliendo');
      foco.classList.add('esta-entrando');
      casilla.classList.add('esta-entrando');

      /* Forzar reflow para que la clase de entrada arranque desde su
         estado inicial y no desde el que acaba de dejar la de salida. */
      void foco.offsetWidth;

      foco.classList.remove('esta-entrando');
      casilla.classList.remove('esta-entrando');
    }, CRUCE / 2);

    turno++;
  }

  function arrancar() {
    if (reloj || detenido) { return; }
    reloj = setInterval(intercambiar, PAUSA);
  }

  function parar() {
    if (!reloj) { return; }
    clearInterval(reloj);
    reloj = null;
  }

  /* --------------------------------------------------------------------
     Se detiene mientras alguien mira

     Parar al pasar el raton no es un adorno: es lo que permite leer un
     logo concreto sin esperar a que vuelva a pasar.
     -------------------------------------------------------------------- */

  seccion.addEventListener('mouseenter', function () { detenido = true; parar(); });
  seccion.addEventListener('mouseleave', function () { detenido = false; if (enMarcha) { arrancar(); } });
  seccion.addEventListener('focusin', function () { detenido = true; parar(); });
  seccion.addEventListener('focusout', function () { detenido = false; if (enMarcha) { arrancar(); } });

  /* Con la pestaña en segundo plano no hay nadie mirando */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); }
    else if (enMarcha && !detenido) { arrancar(); }
  });

  /* --------------------------------------------------------------------
     No empieza hasta que se ve
     -------------------------------------------------------------------- */

  if (!('IntersectionObserver' in window)) {
    enMarcha = true;
    arrancar();
    return;
  }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      enMarcha = e.isIntersecting;
      if (e.isIntersecting && !detenido) { arrancar(); } else { parar(); }
    });
  }, { threshold: 0.35 });

  observador.observe(seccion);

  /* --------------------------------------------------------------------
     El carrusel de variantes

     Al volver a esta opcion la seccion ya estaba observada, pero el reloj
     se paro al ocultarla. Se retoma cuando vuelve a estar visible.
     -------------------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-caru-a], [data-caru-ir]')) { return; }

    setTimeout(function () {
      var enDiapo = seccion.closest('.d2-caru__diapo');
      if (enDiapo && enDiapo.hasAttribute('hidden')) {
        enMarcha = false;
        parar();
        return;
      }

      /* Recien mostrada, el observador aun no ha reevaluado: se mira la
         posicion directamente. */
      var caja = seccion.getBoundingClientRect();
      var alto = window.innerHeight || document.documentElement.clientHeight;
      enMarcha = caja.top < alto && caja.bottom > 0;

      /* Si el raton quedo encima al pulsar el boton,  es cierto
         y no arranca hasta que se aparte. Es el comportamiento correcto:
         la pausa existe para poder leer un logo. */
      if (enMarcha && !detenido) { arrancar(); }
    }, 60);
  });
})();
