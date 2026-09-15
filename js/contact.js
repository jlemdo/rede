/* ==========================================================================
   FORMULARIO DE CONTACTO
   Los campos son los del copy aprobado. Va a HubSpot, igual que el de la
   calculadora. Por ahora valida y confirma en pantalla, pero no envia.
   ========================================================================== */

(function () {
  'use strict';

  var form = document.querySelector('[data-hubspot="contact"]');
  if (!form) { return; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    // TODO: conectar con HubSpot.
    var datos = {};
    new FormData(form).forEach(function (v, k) { datos[k] = v; });
    if (window.console) { console.log('[Rede] Pendiente de enviar a HubSpot:', datos); }

    var caja = document.createElement('div');
    caja.className = 'captura--enviada';
    caja.setAttribute('role', 'status');
    caja.innerHTML =
      '<span class="tic" aria-hidden="true">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
          '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</span>' +
      '<p class="captura__titulo">Thanks. Your message is on its way.</p>' +
      '<p class="captura__texto">Someone from the team will get back to you within ' +
      'one business day.</p>';

    form.replaceWith(caja);
  });

})();
