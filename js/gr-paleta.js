/* ==========================================================================
   EL BOTON QUE CAMBIA LA PALETA DE LA GRAFICA (23/10/2026)

   Temporal, para que el cliente compare los dos juegos de color sin tener
   que recargar ni abrir dos pestanas:

     actual     dos grises y el verde oscuro de Rede
     original   azul, naranja y verde de la grafica que ellos pasaron,
                con las barras en su ambar

   TODO EL COLOR LO PONE LA HOJA. Este archivo solo escribe o quita el
   atributo `data-paleta="original"`; no toca un solo color. Asi el dia
   que se elija una, se borra este script y la hoja decide.

   EL BOTON SE CREA AQUI Y NO EN EL HTML a proposito: es una herramienta
   de revision, no parte de la pagina. Al retirarlo no queda marcado
   suelto que limpiar en las ocho paginas.
   ========================================================================== */
(function () {
  'use strict';

  var grafica = document.querySelector('.hero-gr');
  if (!grafica) { return; }

  /* El panel entero: la grafica y la leyenda tienen que cambiar juntas,
     asi que el atributo va en el ancestro que las contiene a las dos. */
  var panel = grafica.closest('.d2-hero__panel') ||
              grafica.closest('[class*="ficha-caja"]') ||
              grafica.parentNode;
  if (!panel) { return; }

  var boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'gr-paleta';
  boton.setAttribute('aria-pressed', 'false');

  var punto = document.createElement('span');
  punto.className = 'gr-paleta__punto';
  punto.setAttribute('aria-hidden', 'true');

  var texto = document.createElement('span');
  texto.className = 'gr-paleta__txt';

  boton.appendChild(punto);
  boton.appendChild(texto);

  function pinta(original) {
    if (original) {
      panel.setAttribute('data-paleta', 'original');
      grafica.setAttribute('data-paleta', 'original');
    } else {
      panel.removeAttribute('data-paleta');
      grafica.removeAttribute('data-paleta');
    }
    boton.setAttribute('aria-pressed', original ? 'true' : 'false');
    /* El texto dice a donde LLEVA el boton, no donde esta: es lo que
       espera quien lo va a pulsar. */
    texto.textContent = original ? 'Rede colours' : 'Original colours';
  }

  /* Arranca en los colores de la original (23/10/2026, a peticion del
     usuario): es la version que el cliente reconoce, y el boton lleva a
     los de Rede. Invertirlo es cambiar este true por false. */
  pinta(true);

  boton.addEventListener('click', function () {
    pinta(boton.getAttribute('aria-pressed') !== 'true');
  });

  /* Debajo de la leyenda, que es donde se miran los colores. Si no la
     hubiera, al final del panel. */
  var leyenda = panel.querySelector('.d2-hero__leyenda');
  if (leyenda && leyenda.parentNode) {
    leyenda.parentNode.insertBefore(boton, leyenda.nextSibling);
  } else {
    panel.appendChild(boton);
  }
})();
