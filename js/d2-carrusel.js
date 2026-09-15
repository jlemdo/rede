/* ==========================================================================
   CARRUSEL DE VARIANTES — DISEÑO 2

   Sirve para decidir: cada seccion que tenga opciones se envuelve en uno y
   se comparan sin cambiar de pagina.

   NO gira solo. Un carrusel automatico sirve para pasar contenido; este es
   para comparar, y moverse solo mientras alguien mira una opcion es justo lo
   contrario de lo que hace falta.

   Se mueve con:
     - los botones
     - las flechas del teclado (izquierda / derecha)
     - arrastrando con el dedo

   Funciona con cualquier bloque que lleve [data-caru], asi que las secciones
   siguientes no necesitan codigo nuevo: solo el marcado.
   ========================================================================== */

(function () {
  'use strict';

  var carruseles = document.querySelectorAll('[data-caru]');
  if (!carruseles.length) { return; }

  Array.prototype.forEach.call(carruseles, function (caja) {

    var diapos = caja.querySelectorAll('.d2-caru__diapo');
    var puntos = caja.querySelectorAll('[data-caru-a]');
    var flechas = caja.querySelectorAll('[data-caru-ir]');
    if (diapos.length < 2) { return; }

    /* ------------------------------------------------------------------
       VARIANTE FIJADA

       data-caru-fijo="1" en el carrusel deja esa variante puesta y esconde
       los mandos. Las demas NO se borran: siguen en el marcado, ocultas,
       y basta quitar el atributo para recuperarlas.

       Es la via para ir cerrando secciones sin perder el trabajo hecho: lo
       que hoy no se usa puede servir en otra pagina, y la biblioteca de
       secciones ya guarda cada variante por separado.
       ------------------------------------------------------------------ */
    var fijo = caja.getAttribute('data-caru-fijo');
    if (fijo !== null) {
      var n = parseInt(fijo, 10);
      if (isNaN(n) || n < 0 || n >= diapos.length) { n = 0; }

      Array.prototype.forEach.call(diapos, function (d, i) {
        d.hidden = i !== n;
        d.classList.toggle('es-activa', i === n);
      });

      /* Los mandos fuera del arbol de accesibilidad, no solo invisibles:
         ocultarlos con CSS los dejaria en la ruta del tabulador. */
      var mandos = caja.querySelector('.d2-caru__mandos');
      if (mandos) { mandos.remove(); }
      return;
    }

    /* ------------------------------------------------------------------
       VARIANTES ESCONDIDAS

       data-caru-solo="1,3" deja solo esas variantes elegibles y esconde
       las demas. No se borra nada: siguen en el marcado y basta quitar el
       atributo para recuperarlas.

       Los botones sobrantes se retiran del DOM --no se ocultan con CSS--
       porque ocultarlos los dejaria en la ruta del tabulador: accesibles
       con teclado pero invisibles.

       La numeracion visible se rehace: si quedan la 2 y la 4, se ven como
       1 y 2. Lo que importa es el orden en pantalla, no el indice interno.
       ------------------------------------------------------------------ */
    var solo = caja.getAttribute('data-caru-solo');
    if (solo) {
      var permitidas = solo.split(',').map(function (x) { return parseInt(x, 10); })
                           .filter(function (x) { return !isNaN(x) && x >= 0 && x < diapos.length; });

      if (permitidas.length) {
        var vivas = [], vivosPuntos = [];

        Array.prototype.forEach.call(diapos, function (d, i) {
          if (permitidas.indexOf(i) >= 0) { vivas.push(d); }
          else { d.hidden = true; d.classList.remove('es-activa'); }
        });

        Array.prototype.forEach.call(puntos, function (p, i) {
          if (permitidas.indexOf(i) >= 0) { vivosPuntos.push(p); }
          else { p.remove(); }
        });

        /* Renumerar y reindexar: los data-caru-a pasan a ser correlativos */
        vivosPuntos.forEach(function (p, n) {
          p.setAttribute('data-caru-a', String(n));
          var num = p.querySelector('span');
          if (num) { num.textContent = String(n + 1); }
        });

        diapos = vivas;
        puntos = vivosPuntos;
      }
    }

    /* data-caru-inicial="2" arranca en esa opcion en vez de en la primera.
       Es el indice YA renumerado, o sea el que se ve en los mandos: si
       data-caru-solo dejo tres, van de 0 a 2.

       Hace falta porque este JS es comun a las once secciones: cambiar el
       0 de aqui las moveria todas. */
    var actual = 0;
    var ini = parseInt(caja.getAttribute('data-caru-inicial'), 10);
    if (!isNaN(ini) && ini >= 0 && ini < diapos.length) { actual = ini; }

    /* La eleccion se recuerda mientras dure la visita: al volver a la pagina
       sigue la opcion que se estaba mirando, no la primera. */
    var CLAVE = 'rede-caru-' + (caja.id || 'sin-id');
    try {
      var guardado = parseInt(sessionStorage.getItem(CLAVE), 10);
      if (!isNaN(guardado) && guardado >= 0 && guardado < diapos.length) { actual = guardado; }
    } catch (e) {}

    function mostrar(i, mover_foco) {
      /* Da la vuelta por los dos lados */
      actual = (i + diapos.length) % diapos.length;

      Array.prototype.forEach.call(diapos, function (d, n) {
        var activa = n === actual;
        d.hidden = !activa;
        d.classList.toggle('es-activa', activa);
      });

      Array.prototype.forEach.call(puntos, function (p, n) {
        var activo = n === actual;
        p.classList.toggle('es-activo', activo);
        p.setAttribute('aria-selected', activo ? 'true' : 'false');
      });

      if (mover_foco && puntos[actual]) { puntos[actual].focus(); }

      try { sessionStorage.setItem(CLAVE, String(actual)); } catch (e) {}

      /* Las entradas al hacer scroll ya se dispararon en la diapositiva que
         estaba visible. La que entra ahora nunca fue observada, asi que se
         marca como visible a mano o se quedaria en blanco.

         Y se REINICIA: antes solo se anadia la clase, asi que al volver a
         una variante ya vista las animaciones no se repetian --el trazado
         ya dibujado, las barras llenas--. Justo cuando alguien compara las
         tres es cuando mas se nota.

         Quitar y poner en el mismo fotograma no basta: el navegador agrupa
         los dos cambios y no ve transicion. El reflow de en medio --leer
         offsetWidth-- lo obliga a aplicar el estado intermedio. Es la misma
         tecnica que usa la ficha del FAQ. */
      diapos[actual].querySelectorAll('.d2-entra').forEach(function (el) {
        el.classList.remove('es-visible');
        el.style.transitionDelay = '0ms';
      });

      void diapos[actual].offsetWidth;

      diapos[actual].querySelectorAll('.d2-entra').forEach(function (el) {
        el.classList.add('es-visible');
      });
    }

    Array.prototype.forEach.call(puntos, function (p, n) {
      p.addEventListener('click', function () { mostrar(n); });
    });

    Array.prototype.forEach.call(flechas, function (f) {
      f.addEventListener('click', function () {
        mostrar(actual + parseInt(f.getAttribute('data-caru-ir'), 10));
      });
    });

    /* Teclado: como cualquier grupo de pestañas */
    caja.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
      if (!e.target.closest('.d2-caru__mandos')) { return; }
      e.preventDefault();
      mostrar(actual + (e.key === 'ArrowRight' ? 1 : -1), true);
    });

    /* Arrastre en movil. Solo se hace caso a un gesto claramente horizontal:
       si no, al bajar por la pagina con el dedo cambiaria de opcion sin
       querer. */
    var x0 = null, y0 = null;

    caja.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });

    caja.addEventListener('touchend', function (e) {
      if (x0 === null) { return; }
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      x0 = y0 = null;

      if (Math.abs(dx) < 45) { return; }          /* muy corto: no cuenta */
      if (Math.abs(dx) < Math.abs(dy) * 1.4) { return; }  /* iba hacia abajo */

      mostrar(actual + (dx < 0 ? 1 : -1));
    }, { passive: true });


    /* ----------------------------------------------------------------------
       MINIMIZAR LOS MANDOS

       La barra se encoge hasta quedar en un boton redondo pegado al borde
       derecho, para poder mirar la seccion sin ella encima. Volviendo a
       pulsar ese boton se abre otra vez.

       El boton nunca se oculta: es lo unico que queda, y sin el no habria
       forma de recuperar los mandos.
       ---------------------------------------------------------------------- */

    var mandos = caja.querySelector('.d2-caru__mandos');
    var ocultar = caja.querySelector('[data-caru-ocultar]');

    if (mandos && ocultar) {
      var minimizado = false;
      var CLAVE_P = CLAVE + '-minimizado';

      /* En movil arrancan recogidas: siete barras de 46px sumaban 322px
         empujando las secciones hacia abajo y rompiendo su altura. Son
         mandos de PRUEBA --se retiran antes de publicar-- asi que no deben
         condicionar como se ve el diseno.

         Si ya hay una eleccion guardada en la sesion se respeta: quien las
         abrio a proposito no quiere que se le vuelvan a cerrar. */
      var esMovil = window.matchMedia('(max-width: 640px)').matches;

      try {
        var guardado = sessionStorage.getItem(CLAVE_P);
        minimizado = guardado === null ? esMovil : guardado === '1';
      } catch (e) { minimizado = esMovil; }

      function pintarMinimizado() {
        mandos.classList.toggle('esta-minimizado', minimizado);
        ocultar.setAttribute('aria-expanded', minimizado ? 'false' : 'true');
        ocultar.setAttribute('aria-label', minimizado ? 'Show options' : 'Close options');

        /* Minimizados quedan recortados por overflow:hidden: sin esto
           seguirian recibiendo el tabulador y el foco se iria a un boton
           que no se ve. */
        Array.prototype.forEach.call(
          mandos.querySelectorAll('button:not([data-caru-ocultar])'),
          function (b) { b.tabIndex = minimizado ? -1 : 0; }
        );

        try { sessionStorage.setItem(CLAVE_P, minimizado ? '1' : '0'); } catch (e) {}
      }

      ocultar.addEventListener('click', function (e) {
        e.stopPropagation();
        minimizado = !minimizado;
        pintarMinimizado();
      });

      pintarMinimizado();
    }

    mostrar(actual);
  });
})();
