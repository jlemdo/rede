/* ==========================================================================
   EL PANEL DE DATOS COBRA VIDA

   El panel aparecia entero y quieto: se leia como una captura de pantalla.
   Con las cifras contando y el grafico dibujandose se lee como un producto
   que esta funcionando.

   Aqui va solo lo que el CSS no puede hacer: contar numeros. El resto de la
   animacion (lineas, puntos, pastillas) son transiciones CSS que se
   disparan con la clase `esta-vivo`.

   Arranca cuando el panel entra en pantalla, no al cargar la pagina: si no,
   la animacion sucede antes de que nadie la vea.
   ========================================================================== */

(function () {
  'use strict';

  var paneles = document.querySelectorAll('.d2-panel');
  if (!paneles.length) { return; }

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     CONTAR HASTA LA CIFRA

     El valor se lee del propio HTML, no se escribe aqui: si el copy cambia,
     la animacion lo sigue sin tocar el JS.

     "$480K"      -> prefijo $   numero 480   sufijo K
     "2.7M <small>kWh</small>"  -> numero 2.7  sufijo M, y el kWh se respeta
     ------------------------------------------------------------------------ */

  function desmontar(el) {
    /* El <small> (kWh) va aparte: no forma parte del numero */
    var small = el.querySelector('small');
    var cola = small ? ' ' + small.outerHTML : '';
    var texto = (small ? el.childNodes[0].textContent : el.textContent).trim();

    var m = texto.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
    if (!m) { return null; }

    var crudo = m[2].replace(/,/g, '');
    var valor = parseFloat(crudo);
    if (isNaN(valor)) { return null; }

    return {
      prefijo: m[1],
      valor: valor,
      /* Los decimales del original mandan: 2.7 cuenta con un decimal,
         480 con ninguno. */
      decimales: (crudo.split('.')[1] || '').length,
      sufijo: m[3],
      cola: cola
    };
  }

  function pintar(el, d, n) {
    var num = d.decimales > 0 ? n.toFixed(d.decimales) : String(Math.round(n));
    el.innerHTML = d.prefijo + num + d.sufijo + d.cola;
  }

  function contar(el, dur) {
    /* El valor de partida se guarda la PRIMERA vez y no se vuelve a leer del
       HTML: al repetir la animacion, ahi ya esta el numero a medias de la
       vuelta anterior, y la cifra se iria degradando en cada pasada. */
    if (!el.hasAttribute('data-original')) {
      el.setAttribute('data-original', el.innerHTML);
    } else {
      el.innerHTML = el.getAttribute('data-original');
    }

    var d = desmontar(el);
    if (!d) { return; }

    if (sinMovimiento) { return; }

    var t0 = null;
    pintar(el, d, 0);

    function paso(t) {
      if (t0 === null) { t0 = t; }
      var p = Math.min(1, (t - t0) / dur);

      /* Desaceleracion: arranca rapido y frena al llegar. Un contador lineal
         parece un cronometro; asi parece que el dato se asienta. */
      var e = 1 - Math.pow(1 - p, 3);

      pintar(el, d, d.valor * e);
      if (p < 1) { requestAnimationFrame(paso); }
    }

    requestAnimationFrame(paso);
  }

  /* ------------------------------------------------------------------------
     ARRANCAR CUANDO SE VE
     ------------------------------------------------------------------------ */

  function despertar(panel) {
    if (panel.classList.contains('esta-vivo')) { return; }
    panel.classList.add('esta-vivo');

    var cifras = panel.querySelectorAll('.d2-metrica__valor');
    Array.prototype.forEach.call(cifras, function (c, i) {
      /* Escalonadas: la segunda arranca un poco despues, para que se lean
         una y luego otra en vez de las dos a la vez */
      setTimeout(function () { contar(c, 1400); }, 260 + i * 130);
    });
  }

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(paneles, despertar);
    return;
  }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) { return; }
      despertar(e.target);
      observador.unobserve(e.target);
    });
  }, { threshold: 0.25 });

  Array.prototype.forEach.call(paneles, function (p) { observador.observe(p); });

  /* ------------------------------------------------------------------------
     EL CARRUSEL

     Al cambiar de variante, el panel que entra nunca fue observado: estaba
     oculto con [hidden] y para el observador no existia. Sin esto se quedaria
     con las cifras a cero y el grafico sin trazar.
     ------------------------------------------------------------------------ */

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-caru-a], [data-caru-ir]')) { return; }

    /* Se espera a que el carrusel haya cambiado la diapositiva */
    setTimeout(function () {
      document.querySelectorAll('.d2-caru__diapo:not([hidden]) .d2-panel').forEach(function (p) {
        /* Se reinicia para que la animacion se vea otra vez: es lo que se
           esta comparando, y verla una sola vez no basta para decidir. */
        p.classList.remove('esta-vivo');
        void p.offsetWidth;
        despertar(p);
      });
    }, 40);
  });
})();
