/* ==========================================================================
   EL SELECTOR DE COMPOSICION

   Antes este control cambiaba TODAS las secciones tintadas al mismo color a
   la vez. Servia para probar un color, no para componer una pagina.

   Ahora cada opcion es una COMPOSICION COMPLETA: un mapa que dice que fondo
   lleva cada una de las once secciones. Al pulsar, la pagina entera se
   recompone.

   El razonamiento de la primera --que es la propuesta-- esta en
   COMPOSICION.md con las fuentes. Las otras tres existen para comparar:
   sin alternativa al lado, una propuesta no se puede juzgar.

   Las once secciones, en orden: hero, logos, problema, calculadora, rutas,
   prueba, resenas, equipo, faq, cta, footer.
   ========================================================================== */

(function () {
  'use strict';

  var B = '#FFFFFF';   /* blanco */
  var G = '#F3F3F3';   /* el negro de marca al 6% */
  var N = '#333333';   /* el negro del manual */

  var COMPOSICIONES = [
    {
      id: 'propuesta',
      et: 'Proposed',
      /* El fondo cambia donde cambia el argumento (Pettijohn et al. 2016).
         Seis limites para once secciones, cada uno en un cambio real de
         tema. Una sola banda oscura, y al final: NN/g documenta que las
         bandas de ancho completo pueden frenar el scroll, asi que va donde
         detenerlo ya no cuesta nada. */
      mapa: [B, B, G, B, G, B, G, B, G, N, N]
    },
    {
      id: 'sobria',
      et: 'Quiet',
      /* Sin negro en el CTA. Menos limites, mas continuidad. Es la version
         mas conservadora: util para ver cuanto aporta realmente la banda
         oscura del cierre. */
      mapa: [B, B, G, B, G, B, G, B, B, G, N]
    },
    {
      id: 'contraste',
      et: 'Contrast',
      /* Dos bandas oscuras: el problema y el cierre. El problema en negro
         es el momento de mas tension del argumento. Contrapartida: NN/g
         avisa de que una banda a mitad de pagina puede cortar el scroll. */
      mapa: [B, B, N, B, G, B, G, B, G, N, N]
    },
    {
      id: 'plana',
      et: 'Flat',
      /* Sin grises: solo blanco y el cierre oscuro. La referencia contra la
         que medir si los limites aportan algo. Si esta se ve igual de bien,
         los grises no estan trabajando. */
      mapa: [B, B, B, B, B, B, B, B, B, B, N]
    }
  ];

  /* Los tokens, EN EL ORDEN EN QUE APARECEN EN LA PAGINA.

     Ojo al mover secciones: el mapa asigna por posicion, asi que si el
     orden de aqui no coincide con el del HTML, cada seccion coge el color
     que le tocaba a otra. Al subir Solutions detras de Marcas (4/9/2026)
     rutas y problema quedaban las dos en gris, seguidas. */
  var TOKENS = ['--comp-hero', '--comp-logos', '--comp-rutas', '--comp-problema',
                '--comp-calc', '--comp-prueba', '--comp-resenas', '--comp-equipo',
                '--comp-faq', '--comp-cta', '--comp-footer'];

  /* Los carruseles, en el mismo orden: hay que saber que seccion queda
     oscura para invertir su texto. */
  var CARUSELES = ['caru-hero', 'caru-logos', 'caru-rutas', 'caru-problema',
                   'caru-calc', 'caru-prueba', 'caru-resenas', 'caru-equipo',
                   'caru-faq', 'caru-cta', 'caru-footer'];

  var CLAVE = 'rede-composicion';
  var raiz = document.documentElement;

  /* El token vive en .d2, que gana a :root por especificidad */
  var caja = document.querySelector('.d2') || raiz;

  /* Arranca en Contrast (8/9/2026), la tercera: es la que eligio el
     cliente. Antes 0 --Proposed--, que era solo la primera de la lista. */
  var actual = 2;
  try {
    var g = parseInt(sessionStorage.getItem(CLAVE), 10);
    if (!isNaN(g) && g >= 0 && g < COMPOSICIONES.length) { actual = g; }
  } catch (e) {}

  function esOscuro(color) { return color === N; }

  function pintar(i) {
    actual = (i + COMPOSICIONES.length) % COMPOSICIONES.length;
    var c = COMPOSICIONES[actual];

    c.mapa.forEach(function (color, n) {
      caja.style.setProperty(TOKENS[n], color);

      /* La marca de tono va en cada SECCION, no en .d2: puesta arriba
         afectaria a toda la pagina, que es el fallo que ya cometimos una
         vez. Se pone en las diapositivas del carrusel para que la herede
         cualquier variante, incluida la que no se este mirando. */
      var caru = document.getElementById(CARUSELES[n]);
      if (!caru) { return; }
      Array.prototype.forEach.call(caru.querySelectorAll('.d2-caru__diapo'), function (d) {
        if (esOscuro(color)) {
          d.setAttribute('data-comp-tono', 'oscuro');
        } else {
          d.removeAttribute('data-comp-tono');
        }
      });
    });

    /* --- El mismo tema, en CUALQUIER pagina (14/9/2026) -----------------

       Lo de arriba es POSICIONAL:  es una lista de once fondos en el
       orden exacto de las once secciones del home. Fuera del home no
       aplica nada, porque ninguno de esos once carruseles existe --se
       comprobo en Energy Gap Analysis: el tema no le tocaba un solo
       fondo--.

       Esta segunda pasada va por ROL. Una seccion declara QUE ES con
       data-comp-rol y recibe el fondo que el tema da a ese rol, este donde
       este y en la pagina que sea. Las paginas que aun no existen heredan
       el sistema sin tocar nada.

       Los roles se derivan del mapa, no se escriben aparte: asi cambiar
       una composicion sigue cambiando toda la web de una vez, que es para
       lo que se hizo. */
    var PORROL = {
      hero:    c.mapa[0],   /* la primera pantalla */
      marcas:  c.mapa[1],   /* la banda de logos */
      proceso: c.mapa[2],   /* los pasos de un metodo */
      calc:    c.mapa[4],   /* la calculadora */
      prueba:  c.mapa[5],   /* datos o prueba social */
      citas:   c.mapa[6],   /* resenas */
      faq:     c.mapa[8],   /* preguntas */
      cierre:  c.mapa[9],   /* el CTA final */
      pie:     c.mapa[10]
    };

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-comp-rol]'),
      function (sec) {
        var color = PORROL[sec.getAttribute('data-comp-rol')];
        if (!color) { return; }
        sec.style.setProperty('--comp-rol', color);
        if (esOscuro(color)) {
          sec.setAttribute('data-comp-tono', 'oscuro');
        } else {
          sec.removeAttribute('data-comp-tono');
        }
      }
    );

    raiz.setAttribute('data-composicion', c.id);

    Array.prototype.forEach.call(botones, function (b, n) {
      var on = n === actual;
      b.classList.toggle('es-activo', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    try { sessionStorage.setItem(CLAVE, String(actual)); } catch (e) {}
  }

  /* --- La barra --- */

  /* RETIRADA (11/9/2026). Erick eligio Contrast y la decision esta
     tomada, asi que el selector ya no pinta nada en pantalla.

     El modulo sigue vivo a proposito: es el que aplica los tokens de
     color a las once secciones. Borrarlo dejaria la web sin composicion.
     Lo unico que se evita es dibujar los botones.

     Para recuperarlos, quitar este return. */
  var botones = [];          /* pintar() la recorre; sin esto, revienta */
  pintar(actual);
  return;

  var barra = document.createElement('div');
  barra.className = 'd2-caru__mandos d2-fondos';
  barra.innerHTML =
    '<button class="d2-caru__ocultar" type="button" data-comp-ocultar aria-expanded="true" aria-label="Close composition options">' +
      '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<button class="d2-caru__flecha" type="button" data-comp-ir="-1" aria-label="Previous composition">' +
      '<svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true"><path d="M7.5 1L1.5 7l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</button>' +
    '<div class="d2-caru__puntos" role="tablist" aria-label="Page composition">' +
      COMPOSICIONES.map(function (c, i) {
        return '<button class="d2-caru__punto" type="button" role="tab" aria-selected="false" data-comp-a="' + i + '">' +
               '<span>' + (i + 1) + '</span><small>' + c.et + '</small></button>';
      }).join('') +
    '</div>' +
    '<button class="d2-caru__flecha" type="button" data-comp-ir="1" aria-label="Next composition">' +
      '<svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true"><path d="M1.5 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</button>';

  document.body.appendChild(barra);

  botones = barra.querySelectorAll('[data-comp-a]');

  Array.prototype.forEach.call(botones, function (b, n) {
    b.addEventListener('click', function () { pintar(n); });
  });

  Array.prototype.forEach.call(barra.querySelectorAll('[data-comp-ir]'), function (f) {
    f.addEventListener('click', function () {
      pintar(actual + parseInt(f.getAttribute('data-comp-ir'), 10));
    });
  });

  /* Minimizar, igual que los demas mandos */
  var ocultar = barra.querySelector('[data-comp-ocultar]');
  var minimizado = false;
  try { minimizado = sessionStorage.getItem(CLAVE + '-min') === '1'; } catch (e) {}

  function pintarMin() {
    barra.classList.toggle('esta-minimizado', minimizado);
    ocultar.setAttribute('aria-expanded', minimizado ? 'false' : 'true');
    ocultar.setAttribute('aria-label', minimizado ? 'Show composition options' : 'Close composition options');

    /* Minimizados quedan recortados: sin esto seguirian recibiendo el
       tabulador y el foco se iria a un boton que no se ve. */
    Array.prototype.forEach.call(
      barra.querySelectorAll('button:not([data-comp-ocultar])'),
      function (b) { b.tabIndex = minimizado ? -1 : 0; }
    );

    try { sessionStorage.setItem(CLAVE + '-min', minimizado ? '1' : '0'); } catch (e) {}
  }

  ocultar.addEventListener('click', function () {
    minimizado = !minimizado;
    pintarMin();
  });

  /* Al cambiar de variante dentro de un carrusel, la diapositiva que entra
     tiene que llevar la marca de tono: si no, una seccion oscura mostraria
     texto oscuro al cambiar de opcion. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-caru-a], [data-caru-ir]')) { return; }
    window.setTimeout(function () { pintar(actual); }, 60);
  });

  pintar(actual);
  pintarMin();
})();
