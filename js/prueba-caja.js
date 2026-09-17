/* ==========================================================================
   PRUEBA DE COLOR PARA LA CAJA DEL FORMULARIO (16/9/2026)

   TEMPORAL. Se retira al elegir uno.

   Monta la pildora de abajo a la derecha. Los colores y el aspecto estan
   en css/prueba-caja.css; aqui solo se pone el atributo en <html>.
   ========================================================================== */
(function () {
  'use strict';

  if (!document.querySelector('.ct-form')) { return; }

  var OPCIONES = [
    { id: 'gris',   eti: 'Gris',   muestra: '#F5F5F5' },
    { id: 'negro',  eti: 'Negro',  muestra: '#1A1A1A' },
    { id: 'oscuro', eti: 'Gris osc.', muestra: '#333333' },
    { id: 'verde',  eti: 'Verde',  muestra: '#1A5121' }
  ];

  var CLAVE = 'rede-prueba-caja';
  var raiz = document.documentElement;

  var caja = document.createElement('div');
  caja.className = 'pc-selector';
  caja.setAttribute('role', 'group');
  caja.setAttribute('aria-label', 'Form box colour test');

  var html = '<span class="pc-selector__etiqueta">Form box</span>';
  OPCIONES.forEach(function (o) {
    html += '<button type="button" data-pc-op="' + o.id + '" aria-pressed="false">' +
              '<span class="pc-selector__muestra" style="background:' + o.muestra + '"></span>' +
              o.eti +
            '</button>';
  });
  html += '<button class="pc-selector__tirador" type="button" aria-label="Collapse">&rsaquo;</button>';
  caja.innerHTML = html;
  document.body.appendChild(caja);

  function aplicar(id) {
    var op = OPCIONES.filter(function (o) { return o.id === id; })[0] || OPCIONES[0];
    raiz.setAttribute('data-pc', op.id);
    [].forEach.call(caja.querySelectorAll('button[data-pc-op]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pc-op') === op.id));
    });
    try { sessionStorage.setItem(CLAVE, op.id); } catch (e) {}
  }

  caja.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) { return; }
    if (b.classList.contains('pc-selector__tirador')) {
      caja.classList.toggle('esta-plegado');
      return;
    }
    aplicar(b.getAttribute('data-pc-op'));
  });

  /* Lo elegido se recuerda mientras dure la visita. Arranca en gris, que
     es como esta hoy: asi se ve el punto de partida antes de comparar. */
  var guardado;
  try { guardado = sessionStorage.getItem(CLAVE); } catch (e) {}
  aplicar(guardado || 'gris');
})();
