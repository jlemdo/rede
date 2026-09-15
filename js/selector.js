/* ==========================================================================
   SELECTOR DE VERSION — plegable

   Es una herramienta de revision, no parte del diseño. Estaba fijo encima del
   contenido y en movil tapaba texto de las secciones.

   Se le anade un tirador para plegarlo. La eleccion se recuerda mientras dure
   la visita (sessionStorage), asi no hay que plegarlo en cada pagina.
   ========================================================================== */

(function () {
  'use strict';

  var caja = document.querySelector('.selector-v');
  if (!caja) { return; }

  var CLAVE = 'rede-selector-plegado';

  var tirador = document.createElement('button');
  tirador.type = 'button';
  tirador.className = 'selector-v__tirador';
  tirador.setAttribute('aria-controls', 'selector-versiones');
  tirador.textContent = '›';           /* › */
  caja.appendChild(tirador);

  /* Los enlaces se agrupan para poder ocultarlos de golpe */
  caja.id = caja.id || 'selector-versiones';

  function pintar(plegado) {
    caja.classList.toggle('esta-plegado', plegado);
    tirador.setAttribute('aria-expanded', plegado ? 'false' : 'true');
    tirador.setAttribute('aria-label', plegado ? 'Mostrar selector de diseño' : 'Ocultar selector de diseño');
  }

  var guardado = null;
  try { guardado = sessionStorage.getItem(CLAVE); } catch (e) {}
  pintar(guardado === '1');

  tirador.addEventListener('click', function () {
    var plegado = !caja.classList.contains('esta-plegado');
    pintar(plegado);
    try { sessionStorage.setItem(CLAVE, plegado ? '1' : '0'); } catch (e) {}
  });
})();
