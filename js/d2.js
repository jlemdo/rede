/* ==========================================================================
   DISEÑO 2 — MOVIMIENTO

   La referencia analizada no usa ninguna libreria de animacion: son
   waypoints que anaden una clase al entrar en pantalla, y esa clase dispara
   la transicion.

   Aqui se reproduce con IntersectionObserver. Sin dependencias, que es lo
   que pide esta maqueta.

   El marquee de logos NO lleva JavaScript: es CSS puro.
   ========================================================================== */

(function () {
  'use strict';

  /* Si el usuario pidio menos movimiento, no se anima nada.
     Los elementos ya son visibles por CSS. */
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var elementos = document.querySelectorAll('.d2-entra');
  if (!elementos.length) { return; }

  if (sinMovimiento || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(elementos, function (el) {
      el.classList.add('es-visible');
    });
    return;
  }

  /* Escalonado dentro de cada bloque: los hermanos entran uno tras otro,
     no todos a la vez. Es lo que da la sensacion de secuencia. */
  var RETARDO = 90;

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) { return; }

      var el = entrada.target;
      var hermanos = el.parentElement
        ? el.parentElement.querySelectorAll(':scope > .d2-entra')
        : [el];
      var posicion = Array.prototype.indexOf.call(hermanos, el);

      el.style.transitionDelay = (Math.max(0, posicion) * RETARDO) + 'ms';
      el.classList.add('es-visible');

      /* Una vez visible, deja de observarse: no se repite al volver a subir */
      observador.unobserve(el);
    });
  }, {
    /* Se dispara un poco antes de que el elemento llegue del todo */
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  });

  Array.prototype.forEach.call(elementos, function (el) {
    observador.observe(el);
  });
})();

/* ==========================================================================
   LAS CIFRAS DEL CIERRE

   Rotan destacando una cada vez. Las tres siguen visibles: en una banda de
   cierre la gente pasa rapido, y si solo se viera un dato se perderian los
   otros dos.

   Solo se mueve cuando la banda esta en pantalla, para no gastar ciclos ni
   distraer con algo que nadie esta viendo.
   ========================================================================== */

(function () {
  'use strict';

  var caja = document.getElementById('cifras-cierre');
  if (!caja) { return; }

  var cifras = caja.querySelectorAll('.d2-cifra');
  if (cifras.length < 2) { return; }

  /* Si el usuario pidio menos movimiento, todas quedan legibles y quietas */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(cifras, function (c) {
      c.classList.add('es-activa');
    });
    return;
  }

  var INTERVALO = 4000;
  var actual = 0;
  var reloj = null;

  function avanzar() {
    cifras[actual].classList.remove('es-activa');
    actual = (actual + 1) % cifras.length;
    cifras[actual].classList.add('es-activa');
  }

  function arrancar() { if (!reloj) { reloj = setInterval(avanzar, INTERVALO); } }
  function parar() { clearInterval(reloj); reloj = null; }

  /* Solo gira cuando se ve */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas[0].isIntersecting ? arrancar() : parar();
    }, { threshold: 0.25 }).observe(caja);
  } else {
    arrancar();
  }

  /* Se detiene al pasar el raton, por si alguien esta leyendo una cifra */
  caja.addEventListener('mouseenter', parar);
  caja.addEventListener('mouseleave', arrancar);

  /* Y en pestana oculta no consume nada */
  document.addEventListener('visibilitychange', function () {
    document.hidden ? parar() : arrancar();
  });
})();

/* ==========================================================================
   EL CARRUSEL DE CITAS

   La referencia carga Swiper pero nunca lo inicializa, asi que no hay nada
   que copiar. Se resuelve sin dependencias, que es lo que pide esta maqueta.

   Las tres citas ocupan la misma celda de la rejilla, superpuestas, asi el
   alto no salta al cambiar.
   ========================================================================== */

(function () {
  'use strict';

  var pista = document.getElementById('carrusel-citas');
  var barra = document.getElementById('puntos-citas');
  if (!pista || !barra) { return; }

  var citas = pista.querySelectorAll('.d2-cita');
  var puntos = barra.querySelectorAll('.d2-punto');
  if (citas.length < 2 || puntos.length !== citas.length) { return; }

  var INTERVALO = 6500;      /* mas largo que las cifras: hay que leer */
  var actual = 0;
  var reloj = null;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mostrar(i) {
    citas[actual].classList.remove('es-activa');
    puntos[actual].classList.remove('es-activo');
    puntos[actual].setAttribute('aria-selected', 'false');

    actual = (i + citas.length) % citas.length;

    citas[actual].classList.add('es-activa');
    puntos[actual].classList.add('es-activo');
    puntos[actual].setAttribute('aria-selected', 'true');
  }

  function arrancar() {
    if (sinMovimiento || reloj) { return; }
    reloj = setInterval(function () { mostrar(actual + 1); }, INTERVALO);
  }

  function parar() { clearInterval(reloj); reloj = null; }

  /* Al elegir un punto, se muestra esa cita y el giro se reinicia:
     si no, podria cambiar justo despues de haber elegido. */
  Array.prototype.forEach.call(puntos, function (punto, i) {
    punto.addEventListener('click', function () {
      parar();
      mostrar(i);
      arrancar();
    });
  });

  /* Con el teclado se puede recorrer, como en cualquier pestaña */
  barra.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
    e.preventDefault();
    parar();
    mostrar(actual + (e.key === 'ArrowRight' ? 1 : -1));
    puntos[actual].focus();
    arrancar();
  });

  /* Solo gira cuando se ve */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas[0].isIntersecting ? arrancar() : parar();
    }, { threshold: 0.3 }).observe(pista);
  } else {
    arrancar();
  }

  /* Se detiene mientras se lee y con la pestaña oculta */
  pista.addEventListener('mouseenter', parar);
  pista.addEventListener('mouseleave', arrancar);
  document.addEventListener('visibilitychange', function () {
    document.hidden ? parar() : arrancar();
  });
})();
