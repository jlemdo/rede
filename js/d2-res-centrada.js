/* ==========================================================================
   RESENAS — LA VARIANTE CENTRADA

   El original del diseno 3 tenia UNA cita fija. Aqui hay tres, como en las
   otras dos variantes de esta seccion, asi que rota.

   Lo que rota con cada cita: el texto, el nombre, la organizacion Y las tres
   cifras. Las cifras no son decorativas --son el respaldo de esa cita
   concreta-- asi que cambiar la cita sin cambiarlas atribuiria los numeros
   de un distrito a otro.

   ADVERTENCIA PARA ERICK — HAY DOS JUEGOS DE CIFRAS SIN CONFIRMAR

   Solo las de SD27 estan en el copy aprobado. Las de Northland y Fort
   Vermilion son VALORES DE MUESTRA para poder ver la animacion, y salen en
   pantalla con la marca "sample" al lado.

   No se publican asi: hay que pedir los numeros reales a cada distrito, o
   volver a dejar las tres citas con las cifras de cartera. Poner numeros
   inventados junto al nombre de una persona real los atribuye a esa
   persona, y eso no se puede publicar.

   Para sustituirlos: cambiar los valores en RESENAS y quitar el
   'provisional: true' de esa entrada. La marca desaparece sola.
   ========================================================================== */

(function () {
  'use strict';

  var caja = document.querySelector('[data-res-cen]');
  if (!caja) { return; }

  var seccion = caja.closest('.d2-res-cen');

  /* El copy de las citas es el aprobado, literal.

     Las cifras de SD27 son las reales: $4.4M y 20 edificios salen del sitio
     actual y $500K+ es la cifra anual del mismo caso.

     Las otras dos llevan provisional:true --ver la advertencia de arriba--. */
  var RESENAS = [
    {
      cita: 'The Rede team is all about proactively implementing energy solutions. ' +
            'They see a gap and they take care of it.',
      nombre: 'Alex Telford',
      cargo: 'Director of Operations',
      org: 'SD27 · British Columbia',
      cifras: [
        { valor: '20',      etiqueta: 'Buildings connected' },
        { valor: '$500K+',  etiqueta: 'Annual savings' },
        { valor: '$4.4M',   etiqueta: 'Cumulative savings' }
      ]
    },
    {
      cita: 'Before Northland started working with Rede, we had no energy management ' +
            'plan at all. We recognized quickly that we can save money with an energy ' +
            'management program.',
      nombre: 'Wayne Turpin',
      cargo: 'Superintendent',
      org: 'Northland School Division',
      provisional: true,
      cifras: [
        { valor: '34',      etiqueta: 'Buildings connected' },
        { valor: '$310K+',  etiqueta: 'Annual savings' },
        { valor: '$2.1M',   etiqueta: 'Cumulative savings' }
      ]
    },
    {
      cita: 'For people like myself, money talks. If we can engage someone like Rede ' +
            'to find inefficiencies within our facilities, then we are able to ' +
            'address them.',
      nombre: 'Norman Buhler',
      cargo: 'Secretary Treasurer',
      org: 'Fort Vermilion School Division',
      provisional: true,
      cifras: [
        { valor: '12',      etiqueta: 'Buildings connected' },
        { valor: '$180K+',  etiqueta: 'Annual savings' },
        { valor: '$950K',   etiqueta: 'Cumulative savings' }
      ]
    }
  ];

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 300ms es lo que dura la salida en el CSS. Con movimiento reducido no hay
     espera: el cambio es inmediato. */
  var CRUCE = sinMovimiento ? 0 : 300;

  /* 9s y no 7s (8/9/2026, a peticion): las citas son largas --la de
     Northland pasa de 180 caracteres-- y con 7s se iba antes de terminar de
     leerla. Ademas ahora las tres cifras entran escalonadas y su cadena
     ocupa 0.74s del ciclo, asi que el tiempo de lectura real era todavia
     menor que esos 7s.

     Es el mismo valor en todos los tamanos: la velocidad de lectura no
     depende del ancho de la pantalla. */
  var PAUSA = 9000;

  var cita   = caja.querySelector('[data-cen-cita]');
  var nombre = caja.querySelector('[data-cen-nombre]');
  var org    = caja.querySelector('[data-cen-org]');
  var cargo  = caja.querySelector('[data-cen-cargo]');
  /* Las tres cifras y sus etiquetas, en orden */
  var cifras = [1, 2, 3].map(function (n) {
    return {
      valor: caja.querySelector('[data-cen-c' + n + ']'),
      etiqueta: caja.querySelector('[data-cen-e' + n + ']')
    };
  });

  var puntos = Array.prototype.slice.call(caja.querySelectorAll('[data-cen-a]'));
  var flechas = Array.prototype.slice.call(caja.querySelectorAll('[data-cen-ir]'));

  var actual = 0;
  var cambiando = false;

  function escribir(i) {
    var r = RESENAS[i];
    cita.textContent = '“' + r.cita + '”';
    nombre.textContent = r.nombre;
    org.textContent = r.org;
    /* El cargo lo pidio el cliente (feedback 9/9/2026): "include ROLE of
       person quoted, not just organization". Un cargo dice desde donde
       habla quien opina, y eso pesa mas que el nombre solo. */
    if (cargo) { cargo.textContent = r.cargo || ''; }

    /* Las cifras cambian con la cita: son el respaldo de ESE distrito, no
       un dato de cartera. Dejarlas quietas atribuiria los numeros de uno a
       otro cada vez que rota. */
    if (r.cifras) {
      r.cifras.forEach(function (c, n) {
        if (!cifras[n] || !cifras[n].valor) { return; }
        cifras[n].valor.textContent = c.valor;
        if (cifras[n].etiqueta) { cifras[n].etiqueta.textContent = c.etiqueta; }
      });
    }

    /* La marca de dato provisional. El recuadro amarillo que la mostraba se
       retiro por peticion --se veia mal-- asi que hoy esta clase no pinta
       nada. Se mantiene porque marca en el DOM cuales son las cifras sin
       confirmar: basta una regla de CSS para volver a hacerla visible, y
       sirve para comprobarlo desde consola.

       OJO: ya nada distingue en pantalla un dato real de uno de muestra.
       Hay que confirmarlos con Erick antes de publicar. */
    if (seccion) {
      seccion.classList.toggle('tiene-cifras-muestra', !!r.provisional);
    }

    puntos.forEach(function (p, n) {
      var on = n === i;
      p.classList.toggle('es-activo', on);
      p.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function ir(i) {
    i = (i + RESENAS.length) % RESENAS.length;

    /* El candado: dos pulsaciones seguidas dejarian la cita y los puntos en
       pasos distintos del cruce. */
    if (i === actual || cambiando) { return; }
    cambiando = true;
    actual = i;

    if (seccion) { seccion.classList.add('esta-cambiando'); }

    window.setTimeout(function () {
      escribir(actual);
      if (seccion) { seccion.classList.remove('esta-cambiando'); }
      cambiando = false;
    }, CRUCE);
  }

  puntos.forEach(function (p, n) {
    p.addEventListener('click', function () { ir(n); reiniciar(); });
  });

  flechas.forEach(function (f) {
    f.addEventListener('click', function () {
      ir(actual + parseInt(f.getAttribute('data-cen-ir'), 10));
      reiniciar();
    });
  });

  /* Teclado: como cualquier grupo de pestanas, y solo dentro de los mandos,
     para no secuestrar las flechas del carrusel de variantes. */
  caja.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
    if (!e.target.closest('[data-cen-a], [data-cen-ir]')) { return; }
    e.preventDefault();
    ir(actual + (e.key === 'ArrowRight' ? 1 : -1));
    reiniciar();
  });

  /* ------------------------------------------------------------------------
     EL AVANCE AUTOMATICO

     WCAG 2.2.2 obliga a poder detener cualquier movimiento automatico que
     dure mas de cinco segundos y corra junto a otro contenido. La pausa al
     apuntar cumple esa via, y ademas permite leer una cita entera sin que
     se vaya a medias.

     Con prefers-reduced-motion no arranca siquiera: el setInterval no se
     desactiva solo, hay que consultarlo aqui explicitamente.
     ------------------------------------------------------------------------ */

  var reloj = null;
  var aLaVista = false;
  var detenido = false;

  function visible() {
    var diapo = caja.closest('.d2-caru__diapo');
    return !diapo || !diapo.hasAttribute('hidden');
  }

  function arrancar() {
    if (reloj || detenido || !aLaVista || sinMovimiento || !visible()) { return; }
    reloj = window.setInterval(function () { ir(actual + 1); }, PAUSA);
  }

  function parar() {
    if (!reloj) { return; }
    window.clearInterval(reloj);
    reloj = null;
  }

  function reiniciar() { parar(); arrancar(); }

  caja.addEventListener('mouseenter', function () { detenido = true; parar(); });
  caja.addEventListener('mouseleave', function () { detenido = false; arrancar(); });
  caja.addEventListener('focusin',    function () { detenido = true; parar(); });
  caja.addEventListener('focusout',   function () { detenido = false; arrancar(); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); } else { arrancar(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      aLaVista = entradas[0].isIntersecting;
      if (aLaVista) { arrancar(); } else { parar(); }
    }, { threshold: 0.35 }).observe(caja);
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

  escribir(0);
})();
