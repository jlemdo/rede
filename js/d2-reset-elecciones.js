/* ==========================================================================
   REINICIO DE ELECCIONES GUARDADAS

   Los selectores de la maqueta recuerdan lo elegido en sessionStorage, para
   que al volver a la pagina siga la opcion que se estaba mirando. El efecto
   secundario: cuando se cambia un valor por defecto, quien ya visito la
   maqueta NO lo ve --su eleccion vieja gana-- y hay que decirle que abra una
   ventana de incognito, que es justo lo que no se le puede pedir a un
   cliente.

   Este guion borra esas claves UNA vez, cuando sube el numero de version.
   No en cada carga: si limpiara siempre, los selectores dejarian de
   recordar nada durante la visita y cambiar de opcion para comparar seria
   imposible.

   Va ANTES que los demas guiones en el marcado: tiene que limpiar antes de
   que cada selector lea su clave.
   ========================================================================== */

(function () {
  'use strict';

  /* Subir este numero cuando se cambien los valores por defecto. Lo que
     importa no es el numero en si, sino que sea distinto al guardado. */
  var VERSION = '2026-09-08-defectos';
  var CLAVE_VERSION = 'rede-version-elecciones';

  /* Solo las claves de los SELECTORES. Fuera quedan a proposito:
       rede-gh-token  -> la credencial del editor de GitHub
       rede-textos    -> los textos editados a mano, que son trabajo
     Borrar esas dos seria perder algo que el usuario escribio. */
  var CLAVES = [
    'rede-composicion',
    'rede-hero-imagen',
    'rede-hero-panel',
    'rede-logos-fondo',
    'rede-rutas-onda',
    'rede-selector-plegado'
  ];

  /* Los carruseles usan una clave por seccion --rede-caru-<id>--, asi que
     no se pueden listar: se buscan por prefijo. */
  var PREFIJOS = ['rede-caru-'];

  try {
    if (sessionStorage.getItem(CLAVE_VERSION) === VERSION) { return; }

    CLAVES.forEach(function (k) {
      sessionStorage.removeItem(k);
      /* Las de minimizar los mandos llevan sufijo */
      sessionStorage.removeItem(k + '-min');
    });

    /* De atras hacia delante: removeItem reindexa, y recorriendo hacia
       delante se saltaria una clave por cada borrado. */
    for (var i = sessionStorage.length - 1; i >= 0; i--) {
      var k = sessionStorage.key(i);
      if (!k) { continue; }
      for (var j = 0; j < PREFIJOS.length; j++) {
        if (k.indexOf(PREFIJOS[j]) === 0) { sessionStorage.removeItem(k); break; }
      }
    }

    sessionStorage.setItem(CLAVE_VERSION, VERSION);
  } catch (e) {
    /* sessionStorage puede estar bloqueado --modo estricto, cookies de
       terceros--. No pasa nada: sin almacenamiento no hay nada que
       limpiar y los defectos salen solos. */
  }
}());
