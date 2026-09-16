/* ==========================================================================
   EL FORMULARIO DE CONTACTO (16/9/2026)

   El <form> lleva novalidate: se apaga el globo del navegador para poder
   poner el error DENTRO de la pagina, junto al campo que falla, con el
   mismo tipo y los mismos colores que el resto.

   Un globo nativo desaparece al hacer scroll, no se puede dar estilo y en
   algunos lectores de pantalla no se anuncia. El mensaje propio si.

   LA REGLA DEL PAR DE TELEFONOS

   Direct line y Phone son opcionales por separado, pero hace falta uno de
   los dos. Eso no lo puede expresar el atributo required, que obliga campo
   a campo, asi que se comprueba aqui.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.querySelector('.ct-form');
  if (!form) { return; }

  /* ------------------------------------------------------------------
     MENSAJES

     Se dice QUE falta, no "campo invalido". El texto va en la lengua de
     la pagina, que es ingles.
     ------------------------------------------------------------------ */
  var MENSAJES = {
    'ct-name':  'Please tell us your name.',
    'ct-org':   'Please tell us your organisation.',
    'ct-role':  'Please tell us your role.',
    'ct-email': 'Please enter your email address.',
    'ct-msg':   'Please tell us what you are looking for.'
  };
  var EMAIL_MAL = 'That email address does not look complete.';
  var FALTA_TEL = 'Please give us one of the two: a direct line or a phone number.';

  function campoDe(input) { return input.closest('.ct-campo'); }

  function marcar(input, texto) {
    var caja = campoDe(input);
    var p = caja && caja.querySelector('.ct-campo__error');
    if (!p) { return; }
    if (texto) {
      p.textContent = texto;
      p.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      /* El error se enlaza al campo para que el lector lo lea al entrar,
         no solo al fallar. */
      if (!p.id) { p.id = input.id + '-error'; }
      input.setAttribute('aria-describedby', p.id);
    } else {
      p.hidden = true;
      p.textContent = '';
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  /* Un correo con una arroba y un punto detras. No se valida mas: las
     expresiones "completas" rechazan direcciones legitimas, y el unico
     modo real de comprobar un correo es enviarle algo. */
  function correoValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function validarCampo(input) {
    var v = (input.value || '').trim();

    if (input.hasAttribute('required') && !v) {
      marcar(input, MENSAJES[input.id] || 'This field is required.');
      return false;
    }
    if (input.type === 'email' && v && !correoValido(v)) {
      marcar(input, EMAIL_MAL);
      return false;
    }
    marcar(input, null);
    return true;
  }

  /* ------------------------------------------------------------------
     EL PAR DE TELEFONOS

     El error va debajo de los dos, no dentro de uno: la condicion es del
     grupo y senalar solo al primero diria que el fallo esta ahi.
     ------------------------------------------------------------------ */
  var pares = [].slice.call(form.querySelectorAll('[data-tel-par]'));
  var errorTel = form.querySelector('[data-tel-error]');

  function validarPar() {
    if (!pares.length || !errorTel) { return true; }
    var alguno = pares.some(function (i) { return (i.value || '').trim() !== ''; });
    errorTel.hidden = alguno;
    errorTel.textContent = alguno ? '' : FALTA_TEL;
    pares.forEach(function (i) {
      if (alguno) { i.removeAttribute('aria-invalid'); }
      else { i.setAttribute('aria-invalid', 'true'); }
    });
    return alguno;
  }

  /* ------------------------------------------------------------------
     CUANDO SE COMPRUEBA

     Al salir del campo, no mientras se escribe: corregir a alguien que
     aun esta tecleando es ruido. Pero una vez marcado, se limpia en
     cuanto lo arregla.
     ------------------------------------------------------------------ */
  var campos = [].slice.call(form.querySelectorAll('input, textarea'))
    .filter(function (i) { return !i.closest('.ct-trampa'); });

  campos.forEach(function (input) {
    input.addEventListener('blur', function () {
      if (input.hasAttribute('data-tel-par')) { validarPar(); }
      else { validarCampo(input); }
    });
    input.addEventListener('input', function () {
      if (input.hasAttribute('data-tel-par')) {
        if (errorTel && !errorTel.hidden) { validarPar(); }
      } else if (input.getAttribute('aria-invalid') === 'true') {
        validarCampo(input);
      }
    });
  });

  form.addEventListener('submit', function (e) {
    var ok = true;
    var primero = null;

    campos.forEach(function (input) {
      if (input.hasAttribute('data-tel-par')) { return; }
      if (!validarCampo(input)) {
        ok = false;
        if (!primero) { primero = input; }
      }
    });

    if (!validarPar()) {
      ok = false;
      if (!primero) { primero = pares[0]; }
    }

    if (!ok) {
      e.preventDefault();
      /* Al primer fallo, no al ultimo: es donde el visitante tiene que
         volver. */
      if (primero) {
        primero.focus();
        primero.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  });
})();
