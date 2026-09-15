/* ==========================================================================
   CLIENT LOGIN
   Solo interaccion visual. No autentica: RUN vive en Power BI y la conexion
   real se define con el cliente.
   ========================================================================== */

(function () {
  'use strict';

  /* --- Mostrar y ocultar la contrasena --- */

  var ver = document.querySelector('[data-ver]');
  var pass = document.getElementById('l-pass');

  if (ver && pass) {
    ver.addEventListener('click', function () {
      var visible = pass.type === 'text';
      pass.type = visible ? 'password' : 'text';
      ver.setAttribute('aria-pressed', String(!visible));
      ver.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
      ver.classList.toggle('is-activo', !visible);
      pass.focus();
    });
  }

  /* --- Envio --- */

  var form = document.querySelector('.acceso__form');
  if (!form) { return; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    // TODO: conectar con RUN. Por ahora solo se avisa en pantalla.
    var aviso = form.querySelector('.aviso');
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'aviso';
      aviso.setAttribute('role', 'status');
      form.appendChild(aviso);
    }
    aviso.textContent = 'Sign in is not connected yet in this preview.';
  });

})();
