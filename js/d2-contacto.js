/* ==========================================================================
   CONTACT — EL CAMPO DE ISOLINEAS (PROTOTIPO A)

   Las curvas de nivel de un mapa termico, dibujadas en Canvas. Se deforman
   muy despacio, como una lectura real que cambia con el tiempo.

   POR QUE ESTE GESTO Y NO OTRO

   Es el lenguaje de esta industria en el oeste de Canada --los mapas
   termicos de edificios se publican asi-- y comparte el ADN de la pagina
   de acceso, que es hacer visible la energia, SIN repetir su guion
   viajero. Aquella es una senal que viaja; esta es un campo que revela.

   COMO SE DIBUJA

   marching squares. Se evalua un campo escalar en una rejilla, y para cada
   celda se mira cuales de sus cuatro esquinas superan el umbral. Esas 16
   combinaciones dan los segmentos de la curva.

   El campo son tres focos gaussianos que se mueven en orbitas lentas y
   distintas: sin eso las curvas laten a la vez y se lee como un patron, no
   como una medida.

   POR QUE CANVAS Y NO SVG

   Cada fotograma redibuja cientos de segmentos. En SVG eso es mutar
   cientos de nodos del DOM por fotograma; en Canvas es una sola llamada de
   pintado. Medido en el prototipo: ~2ms por fotograma en un portatil
   normal.

   WCAG 2.2.2 -- Y NO SE ESCAPA POR SER DECORATIVO

   Este movimiento arranca solo, dura mas de 5 segundos y convive con otro
   contenido, asi que el criterio 2.2.2 aplica en NIVEL A. La nota 2 del
   criterio cierra expresamente la salida de "es decoracion".

   Y si `prefers-reduced-motion` basta por si solo para cumplirlo esta SIN
   RESOLVER en el W3C (issue 4319, abierta desde abril de 2025). Asi que
   aqui van las dos cosas: se respeta la preferencia del sistema Y hay un
   boton de pausa de verdad.
   ========================================================================== */

(function () {
  'use strict';

  var lienzo = document.querySelector('[data-isolineas]');
  if (!lienzo || !lienzo.getContext) { return; }

  var ctx = lienzo.getContext('2d', { alpha: true });
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* La rejilla: 26px de celda. Mas fina da curvas mas suaves y mas coste;
     mas gruesa las vuelve angulosas y se ve el truco. */
  var CELDA = 26;
  /* Doce niveles y no cinco: con pocos, las curvas quedan tan separadas
     que se leen como arcos sueltos. Un mapa termico real tiene la trama
     densa, y es esa densidad la que dice "esto es una medida". */
  var NIVELES = [];
  (function () {
    for (var v = 0.16; v <= 0.92; v += 0.068) { NIVELES.push(v); }
  }());

  var ancho = 0, alto = 0, cols = 0, filas = 0, campo = null;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* Tres focos, cada uno con su radio, su velocidad y su fase. Los
     periodos son primos entre si --no multiplos-- para que la figura tarde
     en repetirse y no se lea un bucle. */
  var FOCOS = [
    { cx: .22, cy: .30, r: .34, vx: 0.041, vy: 0.029, ax: .13, ay: .10, f: 0.0 },
    { cx: .74, cy: .58, r: .30, vx: 0.033, vy: 0.047, ax: .11, ay: .14, f: 2.1 },
    { cx: .48, cy: .84, r: .26, vx: 0.023, vy: 0.037, ax: .16, ay: .09, f: 4.3 }
  ];

  function medir() {
    var caja = lienzo.getBoundingClientRect();
    ancho = Math.max(1, Math.round(caja.width));
    alto  = Math.max(1, Math.round(caja.height));
    lienzo.width  = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(ancho / CELDA) + 1;
    filas = Math.ceil(alto / CELDA) + 1;
    campo = new Float32Array(cols * filas);
  }

  /* El valor del campo en un punto: suma de las tres gaussianas. */
  function calcular(t) {
    var i = 0;
    for (var f = 0; f < filas; f++) {
      var y = (f * CELDA) / alto;
      for (var c = 0; c < cols; c++) {
        var x = (c * CELDA) / ancho;
        var v = 0;
        for (var k = 0; k < 3; k++) {
          var o = FOCOS[k];
          var px = o.cx + Math.cos(t * o.vx + o.f) * o.ax;
          var py = o.cy + Math.sin(t * o.vy + o.f) * o.ay;
          var dx = x - px, dy = y - py;
          /* Sin sqrt: se compara el cuadrado de la distancia, que es lo
             que la gaussiana necesita. Se ahorra una raiz por foco y
             punto, y son miles por fotograma. */
          v += Math.exp(-(dx * dx + dy * dy) / (o.r * o.r));
        }
        campo[i++] = v;
      }
    }
  }

  function val(c, f) { return campo[f * cols + c]; }

  /* Interpolacion lineal sobre la arista: sin esto los segmentos saltan de
     esquina a esquina y las curvas salen dentadas. */
  function corte(a, b, umbral) {
    var d = b - a;
    if (Math.abs(d) < 1e-6) { return 0.5; }
    var t = (umbral - a) / d;
    return t < 0 ? 0 : (t > 1 ? 1 : t);
  }

  function dibujarNivel(umbral) {
    ctx.beginPath();
    for (var f = 0; f < filas - 1; f++) {
      for (var c = 0; c < cols - 1; c++) {
        var x0 = c * CELDA, y0 = f * CELDA, x1 = x0 + CELDA, y1 = y0 + CELDA;
        var a = val(c, f), b = val(c + 1, f), d = val(c + 1, f + 1), e = val(c, f + 1);

        /* El indice de la celda: un bit por esquina que supera el umbral.
           16 casos, de los que el 0 y el 15 no cruzan la curva. */
        var idx = (a > umbral ? 8 : 0) | (b > umbral ? 4 : 0) |
                  (d > umbral ? 2 : 0) | (e > umbral ? 1 : 0);
        if (idx === 0 || idx === 15) { continue; }

        var ta = x0 + corte(a, b, umbral) * CELDA;   // arista superior
        var tb = y0 + corte(b, d, umbral) * CELDA;   // derecha
        var tc = x0 + corte(e, d, umbral) * CELDA;   // inferior
        var td = y0 + corte(a, e, umbral) * CELDA;   // izquierda

        switch (idx) {
          case 1: case 14: ctx.moveTo(x0, td); ctx.lineTo(tc, y1); break;
          case 2: case 13: ctx.moveTo(tc, y1); ctx.lineTo(x1, tb); break;
          case 3: case 12: ctx.moveTo(x0, td); ctx.lineTo(x1, tb); break;
          case 4: case 11: ctx.moveTo(ta, y0); ctx.lineTo(x1, tb); break;
          case 6: case  9: ctx.moveTo(ta, y0); ctx.lineTo(tc, y1); break;
          case 7: case  8: ctx.moveTo(x0, td); ctx.lineTo(ta, y0); break;
          /* Las celdas ambiguas --dos esquinas opuestas altas-- se
             resuelven con los dos segmentos. Elegir uno solo parte la
             curva y se ven huecos. */
          case 5:  ctx.moveTo(x0, td); ctx.lineTo(ta, y0);
                   ctx.moveTo(tc, y1); ctx.lineTo(x1, tb); break;
          case 10: ctx.moveTo(ta, y0); ctx.lineTo(x1, tb);
                   ctx.moveTo(x0, td); ctx.lineTo(tc, y1); break;
        }
      }
    }
    ctx.stroke();
  }

  function pintar(t) {
    ctx.clearRect(0, 0, ancho, alto);
    calcular(t);
    ctx.lineWidth = 1.15;
    for (var n = 0; n < NIVELES.length; n++) {
      /* Los niveles altos --el nucleo caliente-- se ven mas. El degradado
         de opacidad es lo que da lectura de profundidad. */
      var p = n / (NIVELES.length - 1);
      /* De .14 a .52. El tramo anterior --.10 a .36-- se quedaba en un
         contraste de 1.05:1 sobre blanco: presente en el codigo e
         invisible en pantalla. */
      ctx.strokeStyle = 'rgba(57, 181, 74, ' + (0.14 + p * 0.38).toFixed(3) + ')';
      dibujarNivel(NIVELES[n]);
    }
  }

  var reloj = null, t0 = null, pausa = false, aLaVista = true;

  function marco(ahora) {
    if (t0 === null) { t0 = ahora; }
    pintar((ahora - t0) / 1000);
    reloj = window.requestAnimationFrame(marco);
  }

  function arrancar() {
    if (reloj || pausa || sinMovimiento || !aLaVista) { return; }
    reloj = window.requestAnimationFrame(marco);
  }

  function parar() {
    if (!reloj) { return; }
    window.cancelAnimationFrame(reloj);
    reloj = null;
  }

  medir();
  /* Un fotograma siempre, aunque no se anime: con reduced-motion el campo
     se ve quieto en vez de desaparecer. */
  pintar(0);
  if (!sinMovimiento) { arrancar(); }

  /* El boton de pausa. No es opcional: WCAG 2.2.2 es nivel A y la
     preferencia del sistema no basta por si sola --sigue sin resolverse en
     el W3C--. */
  var btn = document.querySelector('[data-isolineas-pausa]');
  if (btn) {
    if (sinMovimiento) { btn.hidden = true; }
    btn.addEventListener('click', function () {
      pausa = !pausa;
      btn.setAttribute('aria-pressed', String(pausa));
      btn.querySelector('[data-pausa-txt]').textContent = pausa ? 'Resume' : 'Pause';
      if (pausa) { parar(); } else { arrancar(); }
    });
  }

  /* Fuera de pantalla no se pinta: es un fondo, no vale la CPU. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      aLaVista = e[0].isIntersecting;
      if (aLaVista) { arrancar(); } else { parar(); }
    }, { threshold: 0.01 }).observe(lienzo);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); } else { arrancar(); }
  });

  var espera = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(espera);
    espera = window.setTimeout(function () {
      medir();
      if (!reloj) { pintar(0); }
    }, 160);
  });
})();
