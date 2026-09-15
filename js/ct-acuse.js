/* ==========================================================================
   CONTACT — EL ACUSE DE RECIBO (PROTOTIPO B)

   Nada se mueve solo. El movimiento ocurre cuando el visitante actua, y
   dice exactamente lo que la pagina promete: que el mensaje llega y que
   alguien responde.

   POR QUE ESTA VIA

   1. Sin movimiento automatico no hay WCAG 2.2.2 que cumplir. Ni boton de
      pausa, ni bucle acotado a cinco segundos, ni el debate abierto en el
      W3C sobre si prefers-reduced-motion basta.

   2. El movimiento cerca de campos de formulario distrae, y eso esta
      documentado. Un fondo animado junto a un <input> compite con la
      tarea.

   3. Refuerza el copy. "We'll get back to you within one business day" es
      una promesa de respuesta, y la animacion la representa: el mensaje
      viaja y algo vuelve.

   LOS TRES MOMENTOS

     al enfocar un campo   el riel lateral se ilumina hasta ese punto
     al completarlo        el nodo de ese campo se cierra
     al enviar             el mensaje recorre el riel y vuelve el acuse

   LA VALIDACION VA AL ENVIAR, Y ESTA MEDIDO

   No al salir del campo. El estudio que todo el mundo cita para justificar
   la validacion en vivo --Wroblewski/Etre, 2009, n=22-- encontro que
   validar MIENTRAS se escribe era lo PEOR de las tres opciones, y los
   propios usuarios lo llamaron frustrante.

   Y hay uno mas solido y menos citado: Bargas-Avila y Oberholzer
   (INTERACT'03, n=77) midieron que validar al salir del campo producia
   MAS errores consecutivos que validar al enviar: 5.73 frente a 1.58.

   Asi que aqui se valida al enviar. Una vez cometido el error, ese campo
   si pasa a corregirse en vivo --ahi la correccion inmediata ayuda-- pero
   no antes.
   ========================================================================== */

(function () {
  'use strict';

  var form = document.querySelector('[data-acuse]');
  if (!form) { return; }

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var campos = form.querySelectorAll('.ct-campo');

  /* --- 1. El riel se ilumina hasta el campo activo ---------------------- */

  function marcar(campo, activo) {
    campo.classList.toggle('esta-activo', activo);
    if (!activo) { return; }
    /* La posicion del campo dentro del formulario decide hasta donde llega
       la luz del riel. Se escribe como porcentaje para que el CSS no tenga
       que saber cuantos campos hay. */
    var todos = Array.prototype.slice.call(campos);
    var n = todos.indexOf(campo);
    var pct = ((n + 1) / todos.length * 100).toFixed(1);
    form.style.setProperty('--ct-avance', pct + '%');
  }

  Array.prototype.forEach.call(campos, function (campo) {
    var control = campo.querySelector('input, textarea, select');
    if (!control) { return; }

    control.addEventListener('focus', function () { marcar(campo, true); });

    control.addEventListener('blur', function () {
      marcar(campo, false);
      /* Al salir SOLO se marca como completo, no se valida: eso es lo que
         los dos estudios desaconsejan. */
      campo.classList.toggle('esta-lleno', control.value.trim() !== '');

      /* Excepcion: si este campo YA fallo al enviar, ahora si se revisa en
         vivo. Corregir un error conocido en el momento si ayuda; anticipar
         uno que aun no existe, no. */
      if (campo.classList.contains('tiene-error')) { revisar(campo, control); }
    });
  });

  /* --- 2. La validacion, al enviar -------------------------------------- */

  function revisar(campo, control) {
    var vale = control.checkValidity() && control.value.trim() !== '';
    campo.classList.toggle('tiene-error', !vale);
    var aviso = campo.querySelector('.ct-campo__error');
    if (aviso) {
      aviso.hidden = vale;
      /* El mensaje del navegador es el que el usuario entiende en su
         idioma y el que su lector de pantalla ya sabe leer. */
      if (!vale) { aviso.textContent = control.validationMessage || 'This field is required.'; }
    }
    control.setAttribute('aria-invalid', vale ? 'false' : 'true');
    return vale;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var fallo = null;
    Array.prototype.forEach.call(campos, function (campo) {
      var control = campo.querySelector('input, textarea, select');
      if (!control || !control.required) { return; }
      if (!revisar(campo, control) && !fallo) { fallo = control; }
    });

    if (fallo) {
      /* El foco al primero que falla: sin esto hay que buscarlo, y en un
         formulario de seis campos eso es una lectura entera. */
      fallo.focus();
      return;
    }

    enviar();
  });

  /* --- 3. El acuse de recibo -------------------------------------------- */

  function enviar() {
    var boton = form.querySelector('[data-enviar]');
    var zona  = document.querySelector('[data-acuse-salida]');

    if (boton) {
      boton.disabled = true;
      boton.classList.add('esta-enviando');
      var txt = boton.querySelector('[data-enviar-txt]');
      /* "Sending" y no una barra de progreso: no hay servidor detras y una
         barra que avanza sola estaria mintiendo sobre algo que no ocurre. */
      if (txt) { txt.textContent = 'Sending'; }
    }

    /* El recorrido: el mensaje sale, llega, y vuelve el acuse. 900ms es lo
       que tarda en leerse como un viaje; por debajo se lee como un salto.

       Con reduced-motion no hay viaje: se muestra el resultado. */
    var espera = sinMovimiento ? 0 : 900;

    form.classList.add('esta-viajando');

    window.setTimeout(function () {
      form.classList.remove('esta-viajando');
      form.hidden = true;
      if (zona) {
        zona.hidden = false;
        /* El foco se mueve al acuse: para quien usa lector de pantalla, el
           formulario desapareciendo sin mas es perder el hilo. */
        zona.setAttribute('tabindex', '-1');
        zona.focus();
      }
    }, espera);
  }

  /* Volver a empezar, por si quiere mandar otro mensaje. */
  var otro = document.querySelector('[data-acuse-otro]');
  if (otro) {
    otro.addEventListener('click', function () {
      var zona = document.querySelector('[data-acuse-salida]');
      if (zona) { zona.hidden = true; }
      form.hidden = false;
      form.reset();
      Array.prototype.forEach.call(campos, function (c) {
        c.classList.remove('esta-lleno', 'tiene-error', 'esta-activo');
        var a = c.querySelector('.ct-campo__error');
        if (a) { a.hidden = true; }
      });
      var boton = form.querySelector('[data-enviar]');
      if (boton) {
        boton.disabled = false;
        boton.classList.remove('esta-enviando');
        var txt = boton.querySelector('[data-enviar-txt]');
        if (txt) { txt.textContent = 'Send message'; }
      }
      var primero = form.querySelector('input');
      if (primero) { primero.focus(); }
    });
  }
})();
