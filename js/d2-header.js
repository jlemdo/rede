/* ==========================================================================
   EL HEADER: DESPLEGABLE Y MENU MOVIL CON MOVIMIENTO

   El codigo base abre y cierra con el atributo `hidden`, que es correcto
   para accesibilidad pero corta cualquier transicion: el elemento pasa de
   `display:none` a visible y no hay nada que animar.

   Aqui se conserva `hidden` (el lector de pantalla lo necesita) pero se
   retira un instante antes de animar, y se vuelve a poner cuando la
   animacion de cierre termina. Asi el elemento sigue estando oculto de
   verdad cuando esta cerrado.

   La curva es cubic-bezier(.32,.72,0,1), la que usa Apple en sus menus:
   arranca decidido y frena muy suave, sin rebote.
   ========================================================================== */

(function () {
  'use strict';

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     Abrir y cerrar respetando la animacion
     ------------------------------------------------------------------------ */

  function abrir(el) {
    if (el.dataset.cerrando) {
      clearTimeout(+el.dataset.cerrando);
      delete el.dataset.cerrando;
    }
    el.hidden = false;
    /* Forzar un reflow: sin esto el navegador aplica el estado final de
       golpe y la transicion no llega a verse. */
    void el.offsetWidth;
    el.classList.add('esta-abierto');
  }

  function cerrar(el) {
    el.classList.remove('esta-abierto');

    if (sinMovimiento) { el.hidden = true; return; }

    /* Se espera a que termine la animacion antes de ocultarlo del todo.
       450ms es la mas larga de las declaradas en el CSS. */
    var t = setTimeout(function () {
      el.hidden = true;
      delete el.dataset.cerrando;
    }, 450);
    el.dataset.cerrando = t;
  }

  /* ------------------------------------------------------------------------
     EL DESPLEGABLE DE SOLUTIONS
     ------------------------------------------------------------------------ */

  var toggle = document.querySelector('.nav__toggle');
  var drop = document.querySelector('.nav__drop');

  if (toggle && drop) {
    /* El manejador del codigo base seguiria poniendo `hidden` a mano y
       pisaria la animacion. Se sustituye el boton por un clon sin oyentes. */
    var limpio = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(limpio, toggle);
    toggle = limpio;

    var abierto = false;
    var bloqueadoPorClic = false;

    function pintar(v) {
      abierto = v;
      toggle.setAttribute('aria-expanded', v ? 'true' : 'false');
      v ? abrir(drop) : cerrar(drop);
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();

      /* El clic siempre alterna: si esta abierto lo cierra, sin importar
         si lo abrio el hover o un clic anterior. Una version previa hacia
         que el primer clic tras el hover no cerrara, y el resultado era
         que hacian falta dos clics: se sentia roto. */
      pintar(!abierto);

      /* Cerrado a proposito con el raton encima: se bloquea el hover o el
         mouseenter siguiente lo reabriria al instante. Se libera al salir
         de la zona. */
      bloqueadoPorClic = !abierto ? false : true;
    });

    /* Al pulsar fuera se cierra */
    document.addEventListener('click', function (e) {
      if (!abierto) { return; }
      if (drop.contains(e.target) || e.target === toggle) { return; }
      pintar(false);
    });

    /* Escape cierra y devuelve el foco al boton, que es de donde salio */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && abierto) {
        pintar(false);
        toggle.focus();
      }
    });

    /* Si el foco sale del menu con el tabulador, se cierra: quedaria abierto
       detras mientras se navega por otro sitio. */
    drop.addEventListener('focusout', function (e) {
      if (!abierto) { return; }
      if (drop.contains(e.relatedTarget) || e.relatedTarget === toggle) { return; }
      pintar(false);
    });

    /* ----------------------------------------------------------------------
       ABRIR AL PASAR EL RATON

       El desplegable se abre al apuntar el boton y se cierra al salir de
       el o del panel. El clic sigue funcionando: es la via del teclado y
       la de los dispositivos tactiles, donde no hay hover.

       DOS DETALLES QUE HACEN QUE SE SIENTA BIEN:

       1. El cierre espera 180ms. Entre el boton y el panel hay un hueco, y
          al cruzarlo el raton sale de los dos por un instante: sin esa
          espera el menu se cerraria en la cara del usuario a mitad de
          camino.

       2. Solo se activa con raton de verdad. En una pantalla tactil el
          primer toque dispara un hover fantasma, y el menu se abriria y
          cerraria solo. La consulta (hover: hover) lo descarta.
       ---------------------------------------------------------------------- */

    var hayRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var zona = toggle.closest('.nav__item--has-drop') || toggle.parentNode;

    if (hayRaton && zona) {
      var esperaCierre = null;

      function cancelarCierre() {
        if (esperaCierre) { window.clearTimeout(esperaCierre); esperaCierre = null; }
      }

      function entrar() {
        /* Cancelar SIEMPRE, tambien si ya esta abierto.

           El fallo intermitente venia de aqui: al salir queda un cierre
           programado a 180ms; si el raton vuelve antes de que expire,
            sigue siendo true, la condicion de abajo no entraba y
           el temporizador seguia vivo. Se ejecutaba, cerraba el menu, y el
           mouseenter del panel lo volvia a abrir: ese era el parpadeo,
           reproducido 19 de cada 20 veces. */
        cancelarCierre();
        if (bloqueadoPorClic) { return; }
        if (!abierto) { pintar(true); }
      }

      function salir() {
        /* Un solo cierre en vuelo: si ya habia uno programado se descarta,
           para que dos salidas seguidas no encadenen dos cierres. */
        cancelarCierre();
        esperaCierre = window.setTimeout(function () {
          /* Si el foco esta dentro, alguien lo esta recorriendo con el
             teclado: no se cierra por debajo. */
          if (drop.contains(document.activeElement)) { return; }

          /* Y si el raton sigue sobre el boton o sobre el panel, tampoco.

             Este era el fallo intermitente: al abrirse, el panel aparece
             DEBAJO del cursor y recibe un mouseenter inmediato. En cuanto
             el raton se movia un poco hacia el boton salia del panel, y
             ese mouseleave cerraba el menu aunque el cursor siguiera
             perfectamente sobre Solutions.

             :hover lo resuelve sin llevar la cuenta a mano de por donde
             anda el raton: pregunta al navegador donde esta AHORA. */
          if (zona.matches(':hover') || drop.matches(':hover')) { return; }

          if (abierto) { pintar(false); }
        }, 180);
      }

      /* Entre el boton y el panel hay 12px de aire. Al cruzarlos el raton
         no esta sobre ninguno de los dos, y el cierre se disparaba a mitad
         de camino. El puente es una franja invisible que tapa ese hueco:
         asi el recorrido nunca sale de una zona vigilada.

         Se pinta desde el CSS (::before del panel) para no añadir un nodo
         que el lector de pantalla tendria que ignorar. */
      zona.addEventListener('mouseenter', entrar);
      zona.addEventListener('mouseleave', function () {
        bloqueadoPorClic = false;
        salir();
      });
      drop.addEventListener('mouseenter', cancelarCierre);
      drop.addEventListener('mouseleave', salir);
    }
  }

  /* ------------------------------------------------------------------------
     EL MEGA MENU: VISTA PREVIA POR ENLACE

     Cada servicio tiene su imagen y su descripcion. Al apuntar un enlace,
     el panel de la derecha muestra los suyos.

     Se cambia UNA imagen en vez de tener cuatro superpuestas: asi el
     navegador solo descarga la que se ve, y el panel no arrastra tres
     imagenes ocultas en cada apertura.

     La vista previa es decorativa --el nombre y la descripcion corta ya
     estan en el enlace-- asi que va marcada aria-hidden y no interfiere
     con quien navega por teclado o lector de pantalla.
     ------------------------------------------------------------------------ */

  (function () {
    var destino = document.querySelector('[data-mega-destino]');
    var texto = document.querySelector('[data-mega-texto]');
    var cifra = document.querySelector('[data-mega-cifra]');
    if (!destino || !texto || !cifra) { return; }

    var enlaces = document.querySelectorAll('[data-mega-img]');
    if (!enlaces.length) { return; }

    /* Se precargan las cuatro al abrir el menu por primera vez: si se
       cargaran al apuntar, la primera vez que se recorre la lista se veria
       un hueco en blanco en cada salto. */
    var precargadas = false;
    function precargar() {
      if (precargadas) { return; }
      precargadas = true;
      Array.prototype.forEach.call(enlaces, function (a) {
        var im = new Image();
        im.src = a.getAttribute('data-mega-img');
      });
    }

    var activo = null;

    function mostrar(a) {
      var img = a.getAttribute('data-mega-img');
      if (!img || img === activo) { return; }
      activo = img;

      /* Se desvanece, se cambia la fuente y vuelve: cambiar el src a secas
         produce un salto duro entre dos fotos distintas. */
      var caja = destino.closest('.nav__drop__destacado') || destino;
      caja.classList.add('esta-cambiando');

      window.setTimeout(function () {
        destino.setAttribute('src', img);
        cifra.textContent = a.getAttribute('data-mega-cif') || cifra.textContent;
        texto.textContent = a.getAttribute('data-mega-txt') || '';
        caja.classList.remove('esta-cambiando');
      }, 160);

      Array.prototype.forEach.call(enlaces, function (e) {
        e.classList.toggle('es-activo', e === a);
      });
    }

    Array.prototype.forEach.call(enlaces, function (a) {
      a.addEventListener('mouseenter', function () { precargar(); mostrar(a); });

      /* El teclado tambien: al tabular por la lista, la previa acompaña */
      a.addEventListener('focus', function () { precargar(); mostrar(a); });
    });
  })();

  /* ------------------------------------------------------------------------
     EL MENU MOVIL
     ------------------------------------------------------------------------ */

  var burger = document.querySelector('.burger');
  var movil = document.getElementById('mobile-menu');
  var velo = document.getElementById('menu-velo');

  if (burger && movil) {
    /* El guion antiguo --main.js-- ya dejo su escucha en el boton. Clonarlo
       la borra: dos escuchas alternarian el menu dos veces por toque y no
       se abriria nunca. */
    var limpioB = burger.cloneNode(true);
    burger.parentNode.replaceChild(limpioB, burger);
    burger = limpioB;

    /* El panel tapa el header entero, asi que su boton de cerrar tiene que
       vivir dentro. Se crea aqui y no en el HTML porque sin este guion no
       habria forma de cerrarlo: un boton muerto es peor que ninguno. */
    var cerrarBtn = document.createElement('button');
    cerrarBtn.type = 'button';
    cerrarBtn.className = 'mobile-menu__cerrar';
    cerrarBtn.setAttribute('aria-label', 'Close menu');
    cerrarBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round"/></svg>';
    /* Logo y aspa comparten fila: asi se centran entre si en vez de
       colocarse cada uno por su cuenta --antes quedaban a 17px de
       desfase--. La fila se crea aqui porque el aspa tambien nace aqui. */
    var logo = movil.querySelector('.mobile-menu__logo');
    var cabecera = document.createElement('div');
    cabecera.className = 'mobile-menu__cabecera';
    movil.insertBefore(cabecera, movil.firstChild);
    if (logo) { cabecera.appendChild(logo); }
    cabecera.appendChild(cerrarBtn);

    var abiertoM = false;
    var desplazado = 0;

    /* Lo que puede recibir el foco dentro del panel. Se recalcula en cada
       apertura y no una sola vez: asi no depende del orden de carga de los
       guiones ni de que el boton de cerrar ya exista. */
    function focosDe(el) {
      return Array.prototype.filter.call(
        el.querySelectorAll('a[href], button:not([disabled])'),
        function (x) { return x.offsetParent !== null; }
      );
    }

    function pintarM(v) {
      abiertoM = v;
      burger.setAttribute('aria-expanded', v ? 'true' : 'false');
      burger.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
      burger.classList.toggle('esta-activo', v);

      v ? abrir(movil) : cerrar(movil);
      if (velo) { v ? abrir(velo) : cerrar(velo); }

      /* position:fixed en el cuerpo y no solo overflow:hidden: en iOS el
         overflow por si mismo no frena el desplazamiento y la pagina sigue
         corriendo por detras del panel. Al fijarlo se pierde la posicion,
         asi que se guarda antes y se devuelve al cerrar. */
      if (v) {
        desplazado = window.pageYOffset || document.documentElement.scrollTop;
        document.body.style.position = 'fixed';
        document.body.style.top = (-desplazado) + 'px';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        /* La hoja declara `html { scroll-behavior: smooth }`, asi que este
           scrollTo se ANIMABA: al soltar el position:fixed la pagina caia a
           y=0 y volvia subiendo hasta la posicion guardada. Se veia como un
           sube y baja de casi un segundo cada vez que se cerraba el menu.

           Se desactiva el suavizado solo para este salto --que no es una
           navegacion, es devolver la pagina donde estaba-- y se restaura
           inmediatamente para no tocar el resto de anclas. */
        var raiz = document.documentElement;
        var suave = raiz.style.scrollBehavior;
        raiz.style.scrollBehavior = 'auto';
        window.scrollTo(0, desplazado);
        raiz.style.scrollBehavior = suave;
      }

      if (v) {
        var f = focosDe(movil);
        if (f.length) { f[0].focus(); }
      }
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      pintarM(!abiertoM);
    });

    cerrarBtn.addEventListener('click', function () {
      pintarM(false);
      burger.focus();
    });

    if (velo) {
      velo.addEventListener('click', function () { pintarM(false); });
    }

    /* Al elegir un destino se cierra: si no, tapa la seccion a la que se
       acaba de saltar */
    movil.addEventListener('click', function (e) {
      if (e.target.closest('a')) { pintarM(false); }
    });

    document.addEventListener('keydown', function (e) {
      if (!abiertoM) { return; }

      if (e.key === 'Escape') {
        pintarM(false);
        burger.focus();
        return;
      }

      /* El foco no debe salirse del panel: detras hay una pagina entera de
         enlaces que quien navega con teclado no puede ver. */
      if (e.key === 'Tab') {
        var f = focosDe(movil);
        if (!f.length) { return; }
        var primero = f[0];
        var ultimo = f[f.length - 1];

        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    });

    /* Al volver a escritorio el menu movil no debe quedarse abierto */
    window.matchMedia('(min-width: 1001px)').addEventListener('change', function (ev) {
      if (ev.matches && abiertoM) { pintarM(false); }
    });
  }
})();
