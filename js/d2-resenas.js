/* ==========================================================================
   RESEÑAS — LA VARIANTE EDITORIAL

   Reproduce el comportamiento del componente que pidio el cliente. El
   original venia en React con estado (useState) y dos setTimeout anidados;
   aqui se hace lo mismo sin framework, porque este sitio no compila nada.

   El gesto que define al componente es el CRUCE: al pedir otra cita, la
   actual se desvanece y se desplaza, y solo cuando ya no se ve se cambia el
   texto y entra la nueva. Sin esa espera se veria el cambio de contenido a
   media transicion.

   Del original tambien se conserva el candado: mientras dura el cruce se
   ignoran mas pulsaciones, para que dos clics seguidos no dejen el numeral
   y la cita descuadrados.
   ========================================================================== */

(function () {
  'use strict';

  var caja = document.querySelector('[data-res-ed]');
  if (!caja) { return; }

  /* Los datos viven aqui y no en el HTML porque solo hay un bloque que se
     reescribe. El copy es el aprobado, literal. */
  var RESENAS = [
    {
      cita: 'Before Northland started working with Rede, we had no energy management plan ' +
            'at all. We recognized quickly that we can save money with an energy ' +
            'management program.',
      nombre: 'Wayne Turpin',
      cargo: 'Superintendent',
      org: 'Northland School Division',
      logo: 'assets/img/logos-clientes/northland.png'
    },
    {
      cita: 'The Rede team is all about proactively implementing energy solutions. They ' +
            'see a gap and they take care of it.',
      nombre: 'Alex Telford',
      cargo: 'Director of Operations',
      org: 'SD27 British Columbia',
      logo: 'assets/img/logos-clientes/cariboo-chilcotin.png'
    },
    {
      cita: 'For people like myself, money talks. If we can engage someone like Rede to ' +
            'find inefficiencies within our facilities, then we are able to address them.',
      nombre: 'Norman Buhler',
      cargo: 'Secretary Treasurer',
      org: 'Fort Vermilion School Division',
      logo: 'assets/img/logos-clientes/fort-vermilion.png'
    }
  ];

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 300ms es lo que tarda la salida en el componente original. Con
     movimiento reducido no hay espera: el cambio es inmediato. */
  var CRUCE = sinMovimiento ? 0 : 300;

  var num      = caja.querySelector('[data-res-num]');
  var cita     = caja.querySelector('[data-res-cita]');
  var autor    = caja.querySelector('[data-res-autor]');
  var logo     = caja.querySelector('[data-res-logo]');
  var nombre   = caja.querySelector('[data-res-nombre]');
  var cargo    = caja.querySelector('[data-res-cargo]');
  var org      = caja.querySelector('[data-res-org]');
  var contador = caja.querySelector('[data-res-contador]');
  var lineas   = Array.prototype.slice.call(caja.querySelectorAll('[data-res-a]'));
  var flechas  = Array.prototype.slice.call(caja.querySelectorAll('[data-res-ir]'));

  var actual = 0;
  var cambiando = false;

  function dosDigitos(n) { return (n < 10 ? '0' : '') + n; }

  function escribir(i) {
    var r = RESENAS[i];
    cita.textContent = r.cita;
    nombre.textContent = r.nombre;
    cargo.textContent = r.cargo;
    org.textContent = r.org;

    /* El logo es decorativo: la organizacion ya se nombra en el texto de al
       lado, y repetirla en el alt la haria sonar dos veces. */
    logo.setAttribute('src', r.logo);
    logo.setAttribute('alt', '');

    /* El numeral gigante se retiro del diseno. Se comprueba antes de
       escribirlo por si vuelve: sin esta guarda, la linea lanzaba y el
       carrusel dejaba de cambiar. */
    if (num) { num.textContent = dosDigitos(i + 1); }
    contador.textContent = dosDigitos(i + 1) + ' / ' + dosDigitos(RESENAS.length);

    lineas.forEach(function (l, n) {
      var activa = n === i;
      l.classList.toggle('es-activa', activa);
      l.setAttribute('aria-selected', activa ? 'true' : 'false');
    });
  }

  function ir(i) {
    i = (i + RESENAS.length) % RESENAS.length;

    /* El candado del original: dos clics seguidos dejarian el numeral y la
       cita en pasos distintos del cruce. */
    if (i === actual || cambiando) { return; }
    cambiando = true;
    actual = i;

    caja.classList.add('esta-cambiando');

    window.setTimeout(function () {
      escribir(actual);

      /* Un reflow entre quitar y poner la clase: sin el, el navegador
         agrupa los dos cambios y la entrada no llega a verse. */
      caja.classList.remove('esta-cambiando');
      void caja.offsetWidth;
      caja.classList.add('esta-entrando');

      window.setTimeout(function () {
        caja.classList.remove('esta-entrando');
        cambiando = false;
      }, sinMovimiento ? 0 : 60);
    }, CRUCE);
  }

  lineas.forEach(function (l, n) {
    l.addEventListener('click', function () { ir(n); reiniciar(); });
  });

  flechas.forEach(function (f) {
    f.addEventListener('click', function () {
      ir(actual + parseInt(f.getAttribute('data-res-ir'), 10));
      reiniciar();
    });
  });

  /* Teclado: como cualquier grupo de pestañas. Solo dentro de los mandos,
     para no secuestrar las flechas del carrusel de variantes. */
  caja.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
    if (!e.target.closest('[data-res-a], [data-res-ir]')) { return; }
    e.preventDefault();
    ir(actual + (e.key === 'ArrowRight' ? 1 : -1));
  });

  /* ------------------------------------------------------------------------
     AVANCE AUTOMATICO

     Cada 6 segundos pasa a la siguiente. Se detiene al pasar el raton o al
     enfocar con el teclado, y no arranca hasta que la seccion esta a la
     vista.

     La pausa no es un adorno: WCAG 2.2.2 obliga a poder detener cualquier
     movimiento automatico que dure mas de cinco segundos y corra junto a
     otro contenido. Aqui la pausa al apuntar cumple esa via, y ademas es
     lo que permite leer una cita entera sin que se vaya a medias.
     ------------------------------------------------------------------------ */

  var PAUSA = 6000;
  var reloj = null;
  var aLaVista = false;
  var detenido = false;

  function arrancar() {
    if (reloj || detenido || !aLaVista || sinMovimiento) { return; }
    reloj = window.setInterval(function () { ir(actual + 1); }, PAUSA);
  }

  function parar() {
    if (!reloj) { return; }
    window.clearInterval(reloj);
    reloj = null;
  }

  /* Al pulsar un mando se reinicia la cuenta: si no, la siguiente cita
     podria entrar un instante despues de haber elegido una a mano. */
  function reiniciar() {
    parar();
    arrancar();
  }

  caja.addEventListener('mouseenter', function () { detenido = true; parar(); });
  caja.addEventListener('mouseleave', function () { detenido = false; arrancar(); });
  caja.addEventListener('focusin', function () { detenido = true; parar(); });
  caja.addEventListener('focusout', function () { detenido = false; arrancar(); });

  /* Con la pestaña en segundo plano no hay nadie mirando */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); } else { arrancar(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        aLaVista = e.isIntersecting;
        if (aLaVista) { arrancar(); } else { parar(); }
      });
    }, { threshold: 0.35 }).observe(caja);
  } else {
    aLaVista = true;
    arrancar();
  }

  /* El carrusel de variantes: al volver a esta opcion hay que retomar la
     cuenta, porque al ocultarla el observador la paro. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-caru-a], [data-caru-ir]')) { return; }
    window.setTimeout(function () {
      var diapo = caja.closest('.d2-caru__diapo');
      aLaVista = !diapo || !diapo.hasAttribute('hidden');
      if (aLaVista) { arrancar(); } else { parar(); }
    }, 60);
  });

  escribir(0);
})();
