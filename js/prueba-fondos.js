/* ==========================================================================
   PRUEBA DE FONDO PARA LA SECCION BAJO EL HERO (16/9/2026)

   TEMPORAL. Se retira al elegir un fondo por pagina.

   Monta la pildora de abajo a la derecha con las cuatro opciones y marca
   que seccion se pinta. Los colores y el aspecto estan en
   css/prueba-fondos.css.
   ========================================================================== */
(function () {
  'use strict';

  var OPCIONES = [
    /* La etiqueta va en ingles: es la lengua del sitio y el cliente ve esta
       pildora en la web publicada. El id se queda en espanol a proposito:
       no se lee nunca --es la clave de data-pf en el CSS y la que guarda
       sessionStorage-- y cambiarlo obligaria a tocar prueba-fondos.css. */
    { id: 'blanco', eti: 'White', muestra: '#FFFFFF', oscuro: false },
    { id: 'gris',   eti: 'Grey',  muestra: '#F5F5F5', oscuro: false },
    { id: 'verde',  eti: 'Green', muestra: '#1A5121', oscuro: true  },
    { id: 'negro',  eti: 'Black', muestra: '#1A1A1A', oscuro: true  }
  ];

  var CLAVE = 'rede-prueba-fondo';   // por pagina, para que no se pise
  var raiz = document.documentElement;

  /* ------------------------------------------------------------------
     QUE SECCION SE PINTA

     La de debajo del hero. Se busca por posicion y no por nombre de
     clase: .dos-col es la primera seccion en Recommissioning pero la
     tercera en Energy Management, asi que por clase se pintaria la
     equivocada en una de las dos.

     Si la siguiente comparte la clase principal --el par espejo de
     About (.ab-origen x2) y el de RUN (.plataforma x2)-- se marca
     tambien: son un bloque visual y dejar una pintada y otra blanca
     partiria la composicion por la mitad.
     ------------------------------------------------------------------ */
  function marcarDianas() {
    var hero = document.querySelector('.d2-ega-hero, .d2-hero');
    if (!hero) return [];

    /* La primera seccion despues del hero.

       MIRA DENTRO DE LOS CARRUSELES (18/9/2026)

       Antes se pedia que el hermano fuera un <SECTION> y, si no, se pasaba
       al siguiente. Eso dejo de funcionar en Recommissioning al envolver
       sus secciones en carruseles de variantes: el hermano del hero pasa a
       ser un <div class="d2-caru"> y el bucle los saltaba todos.

       Resultado: la seccion de debajo del hero dejaba de cambiar de color
       con los botones. No fallaba nada; simplemente no pasaba nada.

       Ahora, si el hermano es un carrusel, se busca la seccion de su
       diapositiva VISIBLE. Asi el selector sigue apuntando a lo que el
       visitante ve, sea o no una variante. */
    function seccionDe(nodo) {
      if (!nodo) return null;
      if (nodo.tagName === 'SECTION') return nodo;
      if (nodo.classList && nodo.classList.contains('d2-caru')) {
        var viva = nodo.querySelector('.d2-caru__diapo:not([hidden])');
        if (viva) return viva.querySelector('section');
      }
      return null;
    }

    var sec = null;
    var nodo = hero.nextElementSibling;
    while (nodo && !sec) {
      sec = seccionDe(nodo);
      nodo = nodo.nextElementSibling;
    }
    if (!sec) return [];

    var dianas = [sec];

    /* El par espejo: dos secciones seguidas de la misma clase --About y
       RUN-- se pintan juntas o la composicion se parte por la mitad. */
    var principal = sec.className.split(' ')[0];
    var sig = seccionDe(nodo);
    if (sig && sig.className.split(' ')[0] === principal) dianas.push(sig);

    dianas.forEach(function (d) { d.setAttribute('data-pf-diana', ''); });
    return dianas;
  }

  var dianas = marcarDianas();
  if (!dianas.length) return;   // pagina sin hero: no pinta nada

  /* ------------------------------------------------------------------
     AL CAMBIAR DE VARIANTE, HAY QUE VOLVER A MARCAR  (18/9/2026)

     Las dianas se calculaban UNA SOLA VEZ al cargar. Con los carruseles de
     variantes eso no basta: al pasar de la opcion 1 a la 2, la seccion
     marcada se esconde y la que aparece no lleva la marca, asi que se
     queda con su fondo de origen.

     Se veia asi: eliges verde, cambias de variante y la seccion vuelve a
     blanca. El boton seguia marcado en verde, lo que hacia pensar que el
     selector estaba roto.

     Ahora se observa el carrusel: cuando una diapositiva cambia de estado
     --el guion del carrusel pone y quita `hidden`-- se rehace la marca y
     se vuelve a aplicar el color elegido.
     ------------------------------------------------------------------ */
  function remarcar() {
    dianas.forEach(function (d) {
      d.removeAttribute('data-pf-diana');
      d.removeAttribute('data-comp-tono');
    });
    dianas = marcarDianas();
    aplicar(elegido);
  }

  var carruseles = document.querySelectorAll('.d2-caru');
  if (carruseles.length && window.MutationObserver) {
    var vigia = new MutationObserver(function () { remarcar(); });
    Array.prototype.forEach.call(carruseles, function (c) {
      Array.prototype.forEach.call(c.querySelectorAll('.d2-caru__diapo'), function (d) {
        vigia.observe(d, { attributes: true, attributeFilter: ['hidden'] });
      });
    });
  }

  /* ------------------------------------------------------------------
     APLICAR

     El fondo lo pone el CSS a partir de data-pf. Aqui solo se anade el
     tono oscuro, que es lo que invierte el texto: data-comp-tono ya
     existe en d2-variantes.css y redefine --c-texto y compania dentro
     de la seccion, asi que no hay que tocar clase por clase.
     ------------------------------------------------------------------ */
  var elegido = 'blanco';   // lo lee remarcar() al rehacer las dianas

  function aplicar(id) {
    var op = OPCIONES.filter(function (o) { return o.id === id; })[0] || OPCIONES[0];
    elegido = op.id;

    raiz.setAttribute('data-pf', op.id);

    dianas.forEach(function (d) {
      if (op.oscuro) d.setAttribute('data-comp-tono', 'oscuro');
      else           d.removeAttribute('data-comp-tono');
    });

    [].forEach.call(caja.querySelectorAll('button[data-pf-op]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pf-op') === op.id));
    });

    try { sessionStorage.setItem(CLAVE + location.pathname, op.id); } catch (e) {}
  }

  /* ------------------------------------------------------------------
     LA PILDORA
     ------------------------------------------------------------------ */
  var caja = document.createElement('div');
  caja.className = 'pf-selector';
  caja.setAttribute('role', 'group');
  caja.setAttribute('aria-label', 'Section background test');

  var html = '<span class="pf-selector__etiqueta">Background</span>';
  OPCIONES.forEach(function (o) {
    html += '<button type="button" data-pf-op="' + o.id + '" aria-pressed="false">' +
              '<span class="pf-selector__muestra" style="background:' + o.muestra + '"></span>' +
              o.eti +
            '</button>';
  });
  html += '<button class="pf-selector__tirador" type="button" aria-label="Collapse">&rsaquo;</button>';
  caja.innerHTML = html;
  document.body.appendChild(caja);

  caja.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('pf-selector__tirador')) {
      caja.classList.toggle('esta-plegado');
      return;
    }
    aplicar(b.getAttribute('data-pf-op'));
  });

  // lo elegido se recuerda mientras dure la visita
  var guardado;
  try { guardado = sessionStorage.getItem(CLAVE + location.pathname); } catch (e) {}
  aplicar(guardado || 'blanco');
})();
