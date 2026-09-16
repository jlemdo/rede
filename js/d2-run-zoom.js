/* Los botones de tamano del panel de RUN.
 *
 * El usuario pidio poder encogerlo a ojo sin tener que editar el CSS en
 * cada prueba. "Max" es el tope --.8, el -20 de la primera version-- y
 * los otros tres bajan desde ahi.
 *
 * COMO FUNCIONA
 *
 * Todo el ajuste pasa por una variable, --run-panel-escala, que el CSS
 * aplica en un unico transform: scale(). No se tocan tamanos de fuente ni
 * anchos uno a uno, asi que las proporciones internas del panel se
 * mantienen exactas a cualquier escala y el navegador no rehace la
 * maqueta en cada clic.
 *
 * POR QUE EL GRUPO NACE CON hidden
 *
 * Porque si este guion no se carga, unos botones muertos son peor que no
 * tener botones. El marcado los trae ocultos y aqui se destapan: lo que
 * no funciona, no se ve.
 *
 * ACCESIBILIDAD
 *
 * aria-pressed marca cual esta activo --son un grupo de opciones, no seis
 * acciones sueltas-- y solo lo lleva uno a la vez. El <button> ya es
 * enfocable y responde a Intro y Espacio sin anadir nada.
 */
(function () {
  'use strict';

  var grupo = document.querySelector('[data-run-zoom]');
  if (!grupo) { return; }

  var panel = grupo.closest('.run-panel');
  if (!panel) { return; }

  // Si el guion llega hasta aqui, los botones sirven: se destapan.
  grupo.hidden = false;

  var botones = grupo.querySelectorAll('button[data-escala]');

  function aplicar(escala, boton) {
    // El boton trae el factor final --.8 es el tope, .56 el minimo-- y no
    // un porcentaje relativo: asi el guion no necesita saber cual es el
    // techo, y cambiarlo es editar el HTML y nada mas.
    panel.style.setProperty('--run-panel-escala', escala);

    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute('aria-pressed', botones[i] === boton ? 'true' : 'false');
    }
  }

  grupo.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-escala]');
    if (!b || !grupo.contains(b)) { return; }
    aplicar(b.getAttribute('data-escala'), b);
  });
})();
