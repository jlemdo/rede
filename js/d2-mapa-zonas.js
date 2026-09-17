/* ==========================================================================
   MAPA DE BARRIOS — EL RESALTADO

   Diez sitios sobre el plano real de Grande Prairie. El modulo hace una
   sola cosa: encender uno cada pocos segundos y dejar que el raton o el
   teclado tomen el control.

   QUE YA NO HACE, Y POR QUE

   La primera version escribia una ficha con desviacion, intensidad y
   potencial de ahorro por barrio. Esas cifras eran inventadas, y puestas
   al lado de un mapa real se leen como datos reales: el aviso de "solo
   ilustrativo" no basta cuando todo lo demas --calles, rio, posiciones--
   si es verdad.

   El mapa ahora dice lo unico que puede sostener: donde esta cada sitio y
   cual consume mas. Si llegan datos de verdad, la ficha vuelve.

   El gesto --rota sola, se fija al senalar, solo gira mientras se ve-- es
   el mismo del mapa de cartera.
   ========================================================================== */

(function () {
  'use strict';

  /* El primero que este VISIBLE, no el primero del documento: el mapa
     puede estar dentro de una diapositiva con [hidden] y entonces el
     modulo giraria sobre algo que nadie ve. */
  var mapa = null;
  var candidatos = document.querySelectorAll('[data-mapa-zonas]');
  for (var n = 0; n < candidatos.length; n++) {
    if (!candidatos[n].closest('[hidden]')) { mapa = candidatos[n]; break; }
  }
  if (!mapa) { return; }

  var sitios = mapa.querySelectorAll('[data-zona]');
  if (sitios.length < 2) { return; }

  /* El orden es el del documento, que va de norte a sur: recorrer el mapa
     a saltos marea. No hay una lista de datos aparte porque ya no hay
     datos que mostrar: el id sale del propio marcado. */
  var ORDEN = [];
  Array.prototype.forEach.call(sitios, function (s) {
    ORDEN.push(s.getAttribute('data-zona'));
  });

  /* 2600: con diez sitios, la vuelta entera dura 26 segundos. Mas rapido
     no da tiempo a leer el nombre; mas lento se siente parado. */
  var INTERVALO = 2600;

  /* --- LA FICHA DE LECTURA (14/9/2026) -------------------------------

     El usuario pidio el gesto del mapa de cartera: al senalar una zona,
     una cajita con informacion.

     El hover ya estaba montado aqui --fijar/soltar, teclado, rotacion que
     se detiene--, asi que lo unico que faltaba era escribir la ficha. Se
     reutiliza el patron de d2-mapa-cartera.js en vez de inventar otro:
     mismo marcado, misma clase, misma animacion de entrada.

     EL TEXTO ES PROVISIONAL

     Los NOMBRES son reales: salen del aria-label de cada zona, que a su
     vez viene del portal de datos abiertos de la ciudad. Los tres datos
     son lorem ipsum, y la etiqueta de la ficha lo dice en la interfaz.

     Esto no es un descuido: la cabecera de este mismo archivo cuenta que
     la primera version mostraba desviacion e intensidad inventadas, y que
     se retiraron porque al lado de calles reales se leen como ciertas. El
     aviso se queda hasta que lleguen los datos de verdad.

     Los nombres se leen del marcado y no se copian aqui: una lista
     duplicada se desincroniza en cuanto alguien edite el HTML. */
  var FICHA = {
    caja:   mapa.querySelector('[data-zonas-ficha]'),
    titulo: mapa.querySelector('[data-zonas-titulo]'),
    nombre: mapa.querySelector('[data-zonas-nombre]'),
    d1:     mapa.querySelector('[data-zonas-d1]'),
    d2:     mapa.querySelector('[data-zonas-d2]'),
    d3:     mapa.querySelector('[data-zonas-d3]')
  };

  /* SIN DATOS REALES POR SITIO (17/9/2026)

     Antes habia lorem ipsum, uno por zona, para que al recorrer el mapa se
     viera que la ficha responde a cada una. Se leia como texto sin
     terminar en una pagina publicada.

     Ahora va un guion em en los tres valores: el rotulo dice QUE dato ira
     ahi y el guion dice que todavia no lo hay. Es la convencion de tabla
     --celda vacia, no cero-- y no finge una cifra.

     El dia que lleguen los datos por edificio, esto pasa a leerlos del
     data- de cada sitio. */
  var SIN_DATO = '—';

  var actual = ORDEN[0];
  var reloj = null;
  var detenido = false;
  var aLaVista = false;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* `conFicha` distingue las dos formas de llegar aqui:

       - la ROTACION automatica pasa false: enciende el barrio pero no
         saca la ficha. Si la sacara, apareceria sola cada 2.6s sin que
         nadie senale nada, que es justo lo que el usuario no quiere.

       - el HOVER y el TECLADO pasan true: hay intencion, se muestra. */
  function mostrar(id, conFicha) {
    actual = id;

    var elegido = null;
    Array.prototype.forEach.call(sitios, function (s) {
      var on = s.getAttribute('data-zona') === id;
      s.classList.toggle('es-foco', on);
      if (on) { elegido = s; }
    });

    if (!FICHA.caja || !elegido) { return; }

    /* El nombre sale del aria-label, que ya lo lleva por accesibilidad.
       Algunos dicen "Mission Heights, one of 2 sites": en la ficha sobra
       la coletilla, que es una precision para el lector de pantalla. */
    var nombre = (elegido.getAttribute('aria-label') || '').split(',')[0];
    if (FICHA.nombre) { FICHA.nombre.textContent = nombre; }

    /* El titulo no cambia por zona: dice que el contenido es provisional,
       y eso vale para las trece. Se escribe igualmente desde aqui para que
       el dia que lleguen los datos reales baste con cambiar esta linea y
       no haya que acordarse de tocar tambien el HTML. */
    if (FICHA.titulo) { FICHA.titulo.textContent = 'Illustrative site'; }

    if (FICHA.d1) { FICHA.d1.textContent = SIN_DATO; }
    if (FICHA.d2) { FICHA.d2.textContent = SIN_DATO; }
    if (FICHA.d3) { FICHA.d3.textContent = SIN_DATO; }

    if (conFicha) { colocar(elegido); }
  }

  /* --- DONDE SE DIBUJA LA FICHA (14/9/2026) ---------------------------

     Debajo del circulo señalado, no en la esquina del lienzo.

     Se mide con getBoundingClientRect y no convirtiendo coordenadas del
     viewBox: el SVG escala con la ventana --width:100%, height:auto-- y
     cualquier factor calculado a mano se rompe al redimensionar. El
     rectangulo que devuelve el navegador ya viene en pixeles reales. */
  function colocar(sitio) {
    if (!FICHA.caja || !sitio) { return; }

    var burbuja = sitio.querySelector('.d2-mapa-zonas__burbuja') || sitio;
    var r = burbuja.getBoundingClientRect();
    var base = FICHA.caja.offsetParent || mapa;
    var rb = base.getBoundingClientRect();

    /* Coordenadas relativas al contenedor posicionado, que es sobre quien
       se aplican top y left. */
    var x = r.left - rb.left + r.width / 2;
    var y = r.bottom - rb.top + 10;

    /* Si no cabe debajo, se dibuja encima: en los barrios del sur la
       ficha se saldria del lienzo y quedaria cortada. */
    var alto = FICHA.caja.offsetHeight || 120;
    var arriba = y + alto > rb.height;
    if (arriba) { y = r.top - rb.top - 10; }
    FICHA.caja.classList.toggle('es-arriba', arriba);

    /* Y que no se salga por los lados: se acota a medio ancho de cada
       borde, que es donde el translate(-50%) la deja tocando el limite. */
    var medio = (FICHA.caja.offsetWidth || 190) / 2;
    if (x < medio) { x = medio; }
    if (x > rb.width - medio) { x = rb.width - medio; }

    FICHA.caja.style.setProperty('--fx', x + 'px');
    FICHA.caja.style.setProperty('--fy', y + 'px');
    FICHA.caja.classList.add('es-visible');
  }

  function ocultarFicha() {
    if (FICHA.caja) { FICHA.caja.classList.remove('es-visible'); }
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
    var id = s.getAttribute('data-zona');

    function fijar()  { detenido = true;  parar(); mostrar(id, true); }

    /* Al salir, la ficha se va: el usuario pidio que no se quede puesta.
       La rotacion se retoma y sigue encendiendo barrios, pero sin ficha. */
    function soltar() { detenido = false; ocultarFicha(); arrancar(); }

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

  /* En tactil no hay mouseleave: se toca un circulo, sale la ficha y no
     hay gesto que la cierre. Un toque fuera del mapa la retira.

     Va en 'pointerdown' y no en 'click' para que no compita con el click
     del propio circulo: cuando se toca otro sitio, su fijar() vuelve a
     mostrarla inmediatamente despues. */
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('[data-zona]')) { return; }
    ocultarFicha();
    detenido = false;
    arrancar();
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
