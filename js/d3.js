/* ==========================================================================
   DISEÑO 3 — INTERACCION

   El original de Erick es React compilado. El bundle es ilegible, pero lo
   que HACE es poco: cinco interacciones, y solo una necesita JavaScript de
   verdad.

   El acordeon del FAQ y las opciones de la calculadora se resuelven con
   <details> y <input type="radio">, que ya son nativos. Aqui queda:

     1. El menu movil
     2. El mapa de edificios
     3. El texto de la calculadora, que depende de la opcion elegida

   Todo respeta prefers-reduced-motion, igual que el original.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. MENU MOVIL
     ------------------------------------------------------------------------ */

  var boton = document.getElementById('btn-menu');
  var nav = document.getElementById('nav-principal');

  if (boton && nav) {
    boton.addEventListener('click', function () {
      var abierto = nav.classList.toggle('open');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });

    /* Al elegir un destino el menu se cierra: si no, tapa la seccion
       a la que se acaba de saltar. */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        boton.setAttribute('aria-expanded', 'false');
      }
    });

    /* Escape cierra, que es lo que espera cualquiera con teclado */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        boton.setAttribute('aria-expanded', 'false');
        boton.focus();
      }
    });
  }
})();


/* ==========================================================================
   2. EL MAPA DE EDIFICIOS

   Cinco edificios sobre una linea de referencia. El activo muestra su ficha.

   Del original de Erick:
     - rota solo cada 2500 ms
     - la rotacion se detiene al pasar el raton o al enfocar con teclado
     - arranca en `riverside`, que es el de mayor oportunidad
   ========================================================================== */

(function () {
  'use strict';

  var mapa = document.querySelector('.portfolio-map');
  if (!mapa) { return; }

  var burbujas = mapa.querySelectorAll('.site-bubble');
  if (burbujas.length < 2) { return; }

  /* Los mismos datos que declara el componente original */
  var SITIOS = {
    central:    { nombre: 'Central Office',    variance: '−8%',  intensidad: '82 kWh/m²',  potencial: 'Low' },
    north:      { nombre: 'North Campus',      variance: '−3%',  intensidad: '108 kWh/m²', potencial: 'Moderate' },
    riverside:  { nombre: 'Riverside Centre',  variance: '+18%',      intensidad: '176 kWh/m²', potencial: 'High' },
    operations: { nombre: 'Operations Centre', variance: '+7%',       intensidad: '194 kWh/m²', potencial: 'Medium' },
    west:       { nombre: 'West Campus',       variance: '+12%',      intensidad: '146 kWh/m²', potencial: 'Moderate' }
  };

  var ORDEN = ['central', 'north', 'riverside', 'operations', 'west'];
  var INTERVALO = 2500;

  var ficha = {
    titulo:     document.getElementById('lectura-titulo'),
    nombre:     document.getElementById('lectura-nombre'),
    variance:   document.getElementById('lectura-variance'),
    intensidad: document.getElementById('lectura-intensidad'),
    potencial:  document.getElementById('lectura-potencial')
  };
  var caja = document.getElementById('lectura-mapa');

  var actual = 'riverside';
  var reloj = null;
  var detenido = false;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mostrar(id) {
    var d = SITIOS[id];
    if (!d) { return; }
    actual = id;

    Array.prototype.forEach.call(burbujas, function (b) {
      b.classList.toggle('hot', b.getAttribute('data-sitio') === id);
    });

    if (ficha.titulo) {
      ficha.titulo.textContent = d.potencial === 'High' ? 'Priority opportunity' : 'Portfolio reading';
    }
    if (ficha.nombre)     { ficha.nombre.textContent = d.nombre; }
    if (ficha.variance)   { ficha.variance.textContent = d.variance; }
    if (ficha.intensidad) { ficha.intensidad.innerHTML = d.intensidad; }
    if (ficha.potencial)  { ficha.potencial.textContent = d.potencial; }

    /* Reinicia la entrada de la ficha (@keyframes readingIn) */
    if (caja && !sinMovimiento) {
      caja.style.animation = 'none';
      void caja.offsetWidth;
      caja.style.animation = '';
    }
  }

  function avanzar() {
    var i = ORDEN.indexOf(actual);
    mostrar(ORDEN[(i + 1) % ORDEN.length]);
  }

  function arrancar() {
    if (sinMovimiento || detenido || reloj) { return; }
    reloj = setInterval(avanzar, INTERVALO);
  }

  function parar() { clearInterval(reloj); reloj = null; }

  /* Al senalar un edificio, se fija: la rotacion no debe robar el control */
  Array.prototype.forEach.call(burbujas, function (b) {
    var id = b.getAttribute('data-sitio');

    function fijar() { detenido = true; parar(); mostrar(id); }
    function soltar() { detenido = false; arrancar(); }

    b.addEventListener('mouseenter', fijar);
    b.addEventListener('mouseleave', soltar);
    b.addEventListener('focus', fijar);
    b.addEventListener('blur', soltar);
    b.addEventListener('click', function () { detenido = true; parar(); mostrar(id); });

    /* Con teclado, Enter y Espacio activan, como cualquier boton */
    b.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        detenido = true;
        parar();
        mostrar(id);
      }
    });
  });

  /* Solo gira mientras se ve */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas[0].isIntersecting ? arrancar() : parar();
    }, { threshold: 0.25 }).observe(mapa);
  } else {
    arrancar();
  }

  /* Y en pestana oculta no consume nada */
  document.addEventListener('visibilitychange', function () {
    document.hidden ? parar() : arrancar();
  });
})();


/* ==========================================================================
   3. LA CALCULADORA

   Las opciones son radios nativos. Lo unico que hace falta en JS es que el
   panel de la derecha refleje lo elegido, que es lo que hace el original.
   ========================================================================== */

(function () {
  'use strict';

  var radios = document.querySelectorAll('input[name="alcance"]');
  if (!radios.length) { return; }

  var etiquetas = {
    one:      { alcance: '1 building', cifra: '$41.5K', nota: 'for a comparable facility' },
    multiple: { alcance: 'Portfolio',  cifra: '$2.94M', nota: 'identified for one Western Canadian school district' }
  };

  var salidaAlcance = document.getElementById('perfil-alcance');
  var salidaCifra   = document.getElementById('perfil-cifra');
  var salidaNota    = document.getElementById('perfil-nota');

  function refrescar() {
    var elegido = document.querySelector('input[name="alcance"]:checked');
    if (!elegido) { return; }

    var d = etiquetas[elegido.value];
    if (!d) { return; }

    if (salidaAlcance) { salidaAlcance.textContent = d.alcance; }
    if (salidaCifra)   { salidaCifra.textContent = d.cifra; }
    if (salidaNota)    { salidaNota.textContent = d.nota; }

    /* La tarjeta elegida se marca: el CSS pinta .selected */
    Array.prototype.forEach.call(radios, function (r) {
      var etiqueta = r.closest('label');
      if (etiqueta) { etiqueta.classList.toggle('selected', r.checked); }
    });
  }

  Array.prototype.forEach.call(radios, function (r) {
    r.addEventListener('change', refrescar);
  });

  refrescar();
})();
