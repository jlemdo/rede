/* ==========================================================================
   MAPA DE CARTERA — LA CUARTA OPCION DEL PROBLEMA

   Traido del diseno 3. Del original se conserva lo que define el gesto:
     - rota sola cada 2500 ms, empezando por riverside, el de mas oportunidad
     - al senalar un edificio se fija ahi: la rotacion no roba el control
     - solo gira mientras la seccion se ve

   Lo que se anade aqui, y por que:

   El original giraba tambien cuando su diapositiva estaba oculta detras del
   carrusel de variantes. No se veia, pero el navegador seguia repintando el
   SVG cada 2.5s. Aqui se comprueba ademas que la diapositiva no este con
   [hidden], igual que hace el carrusel de resenas.
   ========================================================================== */

(function () {
  'use strict';

  /* El primero que este VISIBLE, no el primero del documento.

     Desde 4/9/2026 el mapa aparece dos veces: el original en The Problem
     --seccion oculta con [hidden]-- y una copia en el panel de datos del
     FAQ. Un querySelector a secas cogia el de The Problem y dejaba muerto
     el que se ve. */
  var mapa = null;
  var candidatos = document.querySelectorAll('[data-mapa-cartera]');
  for (var n = 0; n < candidatos.length; n++) {
    if (!candidatos[n].closest('[hidden]')) { mapa = candidatos[n]; break; }
  }
  if (!mapa) { return; }

  var sitios = mapa.querySelectorAll('[data-sitio]');
  if (sitios.length < 2) { return; }

  /* Los mismos datos que declara el componente original. Cifras
     ilustrativas: el aviso de la esquina lo dice en la propia interfaz. */
  var SITIOS = {
    central:    { nombre: 'Central Office',    variance: '−8%',  intensidad: '82 kWh/m²',  potencial: 'Low' },
    north:      { nombre: 'North Campus',      variance: '−3%',  intensidad: '108 kWh/m²', potencial: 'Moderate' },
    riverside:  { nombre: 'Riverside Centre',  variance: '+18%',      intensidad: '176 kWh/m²', potencial: 'High' },
    operations: { nombre: 'Operations Centre', variance: '+7%',       intensidad: '194 kWh/m²', potencial: 'Medium' },
    west:       { nombre: 'West Campus',       variance: '+12%',      intensidad: '146 kWh/m²', potencial: 'Moderate' }
  };

  var ORDEN = ['central', 'north', 'riverside', 'operations', 'west'];
  var INTERVALO = 2500;

  var ficha = {
    caja:       mapa.querySelector('[data-mapa-ficha]'),
    titulo:     mapa.querySelector('[data-mapa-titulo]'),
    nombre:     mapa.querySelector('[data-mapa-nombre]'),
    variance:   mapa.querySelector('[data-mapa-variance]'),
    intensidad: mapa.querySelector('[data-mapa-intensidad]'),
    potencial:  mapa.querySelector('[data-mapa-potencial]')
  };

  var actual = 'riverside';
  var reloj = null;
  var detenido = false;
  var aLaVista = false;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mostrar(id) {
    var d = SITIOS[id];
    if (!d) { return; }
    actual = id;

    Array.prototype.forEach.call(sitios, function (s) {
      s.classList.toggle('es-foco', s.getAttribute('data-sitio') === id);
    });

    if (ficha.titulo) {
      ficha.titulo.textContent = d.potencial === 'High' ? 'Priority opportunity' : 'Portfolio reading';
    }
    if (ficha.nombre)     { ficha.nombre.textContent = d.nombre; }
    if (ficha.variance)   { ficha.variance.textContent = d.variance; }
    if (ficha.intensidad) { ficha.intensidad.textContent = d.intensidad; }
    if (ficha.potencial)  { ficha.potencial.textContent = d.potencial; }

    /* Reinicia la entrada de la ficha. El reflow entre medias es necesario:
       sin el, el navegador agrupa los dos cambios y no se ve nada. */
    if (ficha.caja && !sinMovimiento) {
      ficha.caja.style.animation = 'none';
      void ficha.caja.offsetWidth;
      ficha.caja.style.animation = '';
    }
  }

  function avanzar() {
    mostrar(ORDEN[(ORDEN.indexOf(actual) + 1) % ORDEN.length]);
  }

  function visible() {
    var diapo = mapa.closest('.d2-caru__diapo');
    return !diapo || !diapo.hasAttribute('hidden');
  }

  function arrancar() {
    if (sinMovimiento || detenido || reloj || !aLaVista || !visible()) { return; }
    reloj = window.setInterval(avanzar, INTERVALO);
  }

  function parar() {
    if (!reloj) { return; }
    window.clearInterval(reloj);
    reloj = null;
  }

  Array.prototype.forEach.call(sitios, function (s) {
    var id = s.getAttribute('data-sitio');

    function fijar()  { detenido = true;  parar(); mostrar(id); }
    function soltar() { detenido = false; arrancar(); }

    s.addEventListener('mouseenter', fijar);
    s.addEventListener('mouseleave', soltar);
    s.addEventListener('focus', fijar);
    s.addEventListener('blur', soltar);
    s.addEventListener('click', fijar);

    /* Con teclado, Enter y Espacio activan: lleva role="button" */
    s.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fijar();
      }
    });
  });

  /* Con la pestana en segundo plano no hay nadie mirando */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); } else { arrancar(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      aLaVista = entradas[0].isIntersecting;
      if (aLaVista) { arrancar(); } else { parar(); }
    }, { threshold: 0.25 }).observe(mapa);
  } else {
    aLaVista = true;
    arrancar();
  }

  /* Al cambiar de variante en el carrusel hay que retomar o soltar la
     cuenta: oculta, el observador no vuelve a disparar. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-caru-a], [data-caru-ir]')) { return; }
    window.setTimeout(function () {
      if (visible()) { arrancar(); } else { parar(); }
    }, 60);
  });

  mostrar(actual);
})();
