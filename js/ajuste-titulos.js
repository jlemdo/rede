/* ==========================================================================
   REGULADOR DE TAMANO DE TITULARES  (18/9/2026)

   Dos controles deslizantes con su caja de numero para probar en vivo el
   tamano del titular del hero y el de los titulos de seccion, y comparar
   como queda antes de fijarlo.

   COMO FUNCIONA

   Todo el sitio saca esos dos tamanos de dos variables:

     --fs-h1       el titular del hero      en las 8 paginas
     --fs-seccion  el titulo de seccion     71 titulos

   Asi que el control solo tiene que escribir esas dos variables en <html>
   y el navegador repinta todo lo demas solo. No toca ni un selector.

   EL VALOR QUE MUESTRA es el que el navegador pinta de verdad --se lee con
   getComputedStyle sobre un titular real--, no el de la formula. Las dos
   variables son clamp(), asi que su valor cambia con el ancho de la
   ventana: mostrar la formula no diria nada.

   Al arrastrar se fija un pixelaje concreto y se pierde el escalado
   automatico, que es justo lo que se quiere para comparar. "Reset" borra
   la variable en linea y devuelve el clamp original.

   SOLO ES UNA HERRAMIENTA DE TRABAJO: no se publica en el sitio final.
   ========================================================================== */
(function () {
  'use strict';

  /* SE ESCRIBE EN <body>, NO EN <html>, y el motivo importa.

     Energy Management redefine --fs-h1 en .em-page, que es una clase de
     <body>. Como body es hijo de html, esa redefinicion pisaba lo que el
     regulador escribiera arriba: esa pagina era la unica cuyo hero no
     respondia --comprobado: --fs-h1 valia 90px en <html> y seguia siendo
     el clamp en <body>--.

     Escribiendo en el propio <body> como estilo en linea, gana a cualquier
     hoja que apunte a body y lo heredan todas las secciones. */
  var raiz = document.body || document.documentElement;

  /* Las dos medidas que se regulan. `muestra` es un elemento real de la
     pagina: de el se lee el tamano que el navegador pinta ahora mismo. */
  var MEDIDAS = [
    { id: 'h1',  etq: 'Hero title',    variable: '--fs-h1',
      muestra: 'h1', min: 24, max: 96 },
    { id: 'sec', etq: 'Section title', variable: '--fs-seccion',
      muestra: 'h2.dos-col__titulo, h2.ciclo-sec__titulo, h2.prueba-sec__titulo,' +
               '.d2-ega-pasos__titulo, .calc__titulo, h2',
      min: 20, max: 80 }
  ];

  function leeActual(sel) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      // el primero que se vea de verdad: hay h2 ocultos y eyebrows de 11px
      if (r.width > 40 && parseFloat(getComputedStyle(els[i]).fontSize) > 18) {
        return parseFloat(getComputedStyle(els[i]).fontSize);
      }
    }
    return null;
  }

  function fila(m) {
    var actual = leeActual(m.muestra);
    if (actual === null) { return null; }

    var caja = document.createElement('div');
    caja.className = 'aj-fila';

    var cab = document.createElement('div');
    cab.className = 'aj-cab';
    var nom = document.createElement('span');
    nom.className = 'aj-nom';
    nom.textContent = m.etq;
    var val = document.createElement('input');
    val.className = 'aj-num';
    val.type = 'number';
    val.step = '0.1';          /* decimales, como se pidio */
    val.min = String(m.min);
    val.max = String(m.max);
    val.value = actual.toFixed(2).replace(/\.?0+$/, '');
    var px = document.createElement('span');
    px.className = 'aj-px';
    px.textContent = 'px';
    cab.appendChild(nom);
    cab.appendChild(val);
    cab.appendChild(px);

    var barra = document.createElement('input');
    barra.className = 'aj-barra';
    barra.type = 'range';
    barra.min = String(m.min);
    barra.max = String(m.max);
    barra.step = '0.1';
    barra.value = String(actual);
    barra.setAttribute('aria-label', m.etq + ' size in pixels');

    var pie = document.createElement('div');
    pie.className = 'aj-pie';
    pie.innerHTML = '<span>' + m.min + '</span><span class="aj-orig">'
      + 'default ' + actual.toFixed(1).replace(/\.0$/, '') + '</span>'
      + '<span>' + m.max + '</span>';

    caja.appendChild(cab);
    caja.appendChild(barra);
    caja.appendChild(pie);

    function aplica(v) {
      v = Math.min(m.max, Math.max(m.min, parseFloat(v) || 0));
      raiz.style.setProperty(m.variable, v + 'px');
      (m.tambien || []).forEach(function (otra) {
        raiz.style.setProperty(otra, v + 'px');
      });
      barra.value = String(v);
      /* La caja no se reescribe mientras se teclea: partiria "4" en "4px"
         antes de poder escribir "48". */
      if (document.activeElement !== val) {
        val.value = String(Math.round(v * 100) / 100);
      }
    }

    barra.addEventListener('input', function () { aplica(barra.value); });
    val.addEventListener('input', function () {
      var v = parseFloat(val.value);
      if (!isNaN(v)) { aplica(v); }
    });
    /* Al salir de la caja se normaliza lo que haya quedado escrito */
    val.addEventListener('blur', function () {
      var v = parseFloat(val.value);
      aplica(isNaN(v) ? actual : v);
      val.value = String(Math.round(parseFloat(barra.value) * 100) / 100);
    });

    caja.__reset = function () {
      raiz.style.removeProperty(m.variable);
      (m.tambien || []).forEach(function (otra) {
        raiz.style.removeProperty(otra);
      });
      var a = leeActual(m.muestra);
      if (a !== null) {
        barra.value = String(a);
        val.value = String(Math.round(a * 100) / 100);
      }
    };

    return caja;
  }

  function monta() {
    var panel = document.createElement('div');
    panel.className = 'aj-panel';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Heading size controls');

    var tit = document.createElement('div');
    tit.className = 'aj-titulo';
    tit.textContent = 'Heading sizes';
    panel.appendChild(tit);

    var filas = [];
    MEDIDAS.forEach(function (m) {
      var f = fila(m);
      if (f) { panel.appendChild(f); filas.push(f); }
    });

    if (!filas.length) { return; }   /* pagina sin titulares */

    var pieBtn = document.createElement('div');
    pieBtn.className = 'aj-acciones';

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'aj-btn';
    reset.textContent = 'Reset';
    reset.addEventListener('click', function () {
      filas.forEach(function (f) { f.__reset(); });
    });

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'aj-btn aj-btn--x';
    cerrar.textContent = 'Hide';
    cerrar.setAttribute('aria-label', 'Hide heading size controls');
    cerrar.addEventListener('click', function () {
      panel.classList.toggle('es-plegado');
      cerrar.textContent = panel.classList.contains('es-plegado') ? 'Show' : 'Hide';
    });

    pieBtn.appendChild(reset);
    pieBtn.appendChild(cerrar);
    panel.appendChild(pieBtn);

    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monta);
  } else {
    monta();
  }
}());
