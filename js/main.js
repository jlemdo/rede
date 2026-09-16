/* ==========================================================================
   REDE ENERGY — HERO
   Interacción mínima: dropdown, menú móvil, animación del gráfico y contadores.

   Nota para el paso a Elementor:
   - El dropdown y el menú móvil los resuelve el widget nav-menu. Este código NO se porta.
   - La animación del gráfico y los contadores SÍ se portan, como snippet en el
     mu-plugin rede-custom.php. Ver README.md
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     1. DROPDOWN DE ESCRITORIO
     ---------------------------------------------------------------------- */

  var toggle = document.querySelector('.nav__toggle');
  var drop   = document.getElementById('drop-solutions');

  if (toggle && drop) {
    var abrir = function (estado) {
      toggle.setAttribute('aria-expanded', String(estado));
      drop.hidden = !estado;
    };

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      abrir(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', function (e) {
      if (!drop.hidden && !drop.contains(e.target) && e.target !== toggle) {
        abrir(false);
      }
    });

    // Cerrar con Escape y devolver el foco
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drop.hidden) {
        abrir(false);
        toggle.focus();
      }
    });
  }


  /* ----------------------------------------------------------------------
     2. MENÚ MÓVIL
     ---------------------------------------------------------------------- */

  var burger = document.querySelector('.burger');
  var movil  = document.getElementById('mobile-menu');

  if (burger && movil) {
    burger.addEventListener('click', function () {
      var abierto = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!abierto));
      burger.setAttribute('aria-label', abierto ? 'Open menu' : 'Close menu');
      movil.hidden = abierto;
    });
  }


  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ----------------------------------------------------------------------
     3. ANIMACIÓN DEL GRÁFICO
     Se dispara una vez, cuando el gráfico entra en pantalla.

     La longitud de la línea se MIDE con getTotalLength(), no se inventa.
     Un valor fijo mal calculado deja la línea a medio dibujar.
     ---------------------------------------------------------------------- */

  var chart = document.querySelector('.chart');

  if (chart && !reducido) {
    var linea = chart.querySelector('.chart__linea--rede');

    if (linea && typeof linea.getTotalLength === 'function') {
      var largo = Math.ceil(linea.getTotalLength());
      chart.style.setProperty('--largo', largo);
    }

    if ('IntersectionObserver' in window) {
      var obsChart = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('chart--anima');
            obsChart.unobserve(entrada.target);
          }
        });
      }, { threshold: 0.35 });

      obsChart.observe(chart);

      // Respaldo: si a los 2s el observer no disparó (headless, pestaña en
      // segundo plano, navegador raro), animar igual. Sin esto el gráfico
      // se puede quedar sin dibujar.
      setTimeout(function () {
        if (!chart.classList.contains('chart--anima')) {
          chart.classList.add('chart--anima');
          obsChart.unobserve(chart);
        }
      }, 2000);

    } else {
      chart.classList.add('chart--anima');
    }
  }
  // Si hay movimiento reducido, el gráfico queda en su estado final. No se anima.


  /* ----------------------------------------------------------------------
     4. CONTADORES DE LAS MÉTRICAS
     Cuentan desde 0 hasta el valor de data-contador.
     ---------------------------------------------------------------------- */

  function animarContador(el) {
    var destino   = parseFloat(el.dataset.contador);
    var prefijo   = el.dataset.prefijo || '';
    var sufijo    = el.dataset.sufijo  || '';
    var decimales = parseInt(el.dataset.decimales || '0', 10);
    var unidad    = el.querySelector('.metrica__unidad');
    var htmlUnidad = unidad ? unidad.outerHTML : '';

    if (isNaN(destino)) { return; }

    var duracion = 1400;
    var inicio   = null;

    function paso(ahora) {
      if (inicio === null) { inicio = ahora; }
      var avance = Math.min((ahora - inicio) / duracion, 1);

      // easeOutExpo: rápido al principio, suave al final
      var suave = avance === 1 ? 1 : 1 - Math.pow(2, -10 * avance);
      var valor = (destino * suave).toFixed(decimales);

      el.innerHTML = prefijo + valor + sufijo + (htmlUnidad ? ' ' + htmlUnidad : '');

      if (avance < 1) { requestAnimationFrame(paso); }
    }

    requestAnimationFrame(paso);
  }

  var contadores = document.querySelectorAll('[data-contador]');

  if (contadores.length && !reducido && 'IntersectionObserver' in window) {
    var obsNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          animarContador(entrada.target);
          obsNum.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.6 });

    contadores.forEach(function (el) { obsNum.observe(el); });
  }
  // Si hay movimiento reducido o no hay soporte, el HTML ya trae el valor final.

})();


/* ==========================================================================
   OPPORTUNITY CHECK

   Benchmarks historicos de BC Hydro Continuous Optimization por tipo de
   edificio. Vienen del wireframe del cliente, no son inventados.

   La recomendacion final depende del alcance:
     una sola instalacion -> Site Investigation
     varias               -> Energy Gap Analysis
   ========================================================================== */

(function () {
  'use strict';

  /* Una instancia por cada .calc: las variantes del carrusel son copias
     independientes y cada una lleva su propio estado. El codigo de dentro
     ya buscaba todo con `seccion.querySelector`, asi que basta con
     envolverlo. */
  var calculadoras = document.querySelectorAll('.calc');
  if (!calculadoras.length) { return; }

  Array.prototype.forEach.call(calculadoras, function (seccion) {

  /* --- Benchmarks C-Op ---------------------------------------------------- */

  var BENCHMARKS = {
    extendedCare: { label: 'Extended care',                     costPerFt2: 2.24, savingsPct: 6.7, implementCostFt2: 0.35, payback: 2.4 },
    foodRetail:   { label: 'Food retail',                       costPerFt2: 4.13, savingsPct: 4.5, implementCostFt2: 0.02, payback: 0.1 },
    hospital:     { label: 'Hospital',                          costPerFt2: 2.98, savingsPct: 4.8, implementCostFt2: 0.23, payback: 1.6 },
    largeOffice:  { label: 'Large office',                      costPerFt2: 2.49, savingsPct: 4.2, implementCostFt2: 0.21, payback: 1.9 },
    mediumOffice: { label: 'Medium office',                     costPerFt2: 2.13, savingsPct: 7.0, implementCostFt2: 0.27, payback: 1.8 },
    murb:         { label: 'Multi-unit residential building',   costPerFt2: 0.72, savingsPct: 7.4, implementCostFt2: 0.06, payback: 1.2 },
    nursingHome:  { label: 'Nursing home',                      costPerFt2: 1.92, savingsPct: 4.8, implementCostFt2: 0.23, payback: 2.5 },
    recreation:   { label: 'Recreation',                        costPerFt2: 3.10, savingsPct: 5.7, implementCostFt2: 0.32, payback: 1.8 },
    shoppingMall: { label: 'Shopping mall',                     costPerFt2: 1.95, savingsPct: 2.0, implementCostFt2: 0.07, payback: 1.9 },
    university:   { label: 'University or college',             costPerFt2: 2.03, savingsPct: 7.9, implementCostFt2: 0.28, payback: 1.8 },
    hotel:        { label: 'Hotel',                             costPerFt2: 2.20, savingsPct: 5.2, implementCostFt2: 0.23, payback: 2.0 },
    school:       { label: 'School',                            costPerFt2: 1.00, savingsPct: 9.5, implementCostFt2: 0.17, payback: 1.8 },
    other:        { label: 'Other',                             costPerFt2: 2.18, savingsPct: 5.7, implementCostFt2: 0.21, payback: 1.7 }
  };

  var estado = {
    paso: 1,
    scope: '',
    /* Respuestas de la precalificacion (9/9/2026). */
    tamano: '',      // 'si' / 'no'  -- el filtro de 25.000 pies
    provincia: '',   // 'BC', 'AB'...  decide si se ven los pasos 3 y 4
    ciudad: '',
    utility: '',     // 'si' / 'no'  -- cliente de BC Hydro o FortisBC
    funding: '',     // historial de subvenciones
    descartado: false
  };
  /* Ocho pasos desde el 9/9/2026: cuatro de precalificacion mas los cuatro
     de siempre. Nadie los ve los ocho --hay saltos segun las respuestas--,
     de eso se encargan siguientePaso() y pasoAnterior(). */
  /* Siete desde el 14/9/2026: la pantalla que pedia gasto y numero de
     sitios se repartio --el gasto junto al area, los sitios junto al
     ambito-- y dejo de existir. */
  var TOTAL = 7;

  var $ = function (sel) { return seccion.querySelector(sel); };

  /* --- Rellenar el selector de tipo de edificio --------------------------- */

  var selTipo = $('#c-type');

  /* En que paso vive cada campo. Se LEE del marcado y no se escribe a mano:
     los pasos ya se han renumerado una vez --de cuatro a ocho-- y los
     numeros sueltos por el codigo se quedaron obsoletos sin que nada
     fallara. El perfil daba por elegido un tipo de edificio que nadie
     habia tocado.

     Si no se encuentra el campo se devuelve un numero alto: mas vale no
     ensenar el dato que ensenarlo antes de tiempo. */
  function pasoDe(sel) {
    var campo = $(sel);
    var caja = campo && campo.closest('[data-paso]');
    return caja ? parseInt(caja.getAttribute('data-paso'), 10) : 99;
  }

  var PASO_TIPO = pasoDe('#c-type');
  var PASO_SITIOS = pasoDe('#c-sites');

  /* Donde acaba la precalificacion y empieza el perfil del edificio.
     Se lee del marcado, igual que los dos de arriba: si los pasos se
     renumeran otra vez, esto sigue valiendo.

     Se ancla al AMBITO --la pantalla de "how many buildings"-- y no al
     sector, que va una pantalla despues: con el sector, la elegibilidad
     seguiria desplegada durante el paso del ambito y el panel ensenaria
     las diez filas a la vez, que es justo lo que este plegado evita. */
  var pasoAmbito = seccion.querySelector('.opcion[data-scope]');
  pasoAmbito = pasoAmbito && pasoAmbito.closest('[data-paso]');
  var PASO_PERFIL = pasoAmbito
    ? parseInt(pasoAmbito.getAttribute('data-paso'), 10)
    : pasoDe('#c-sector');

  /* --- Que tipos de edificio ve cada sector -------------------------------

     Antes salian los trece a la vez: un distrito escolar podia elegir
     "Shopping mall" y llevarse un calculo que no tiene nada que ver con su
     realidad. El cliente lo reporto el 9/9/2026.

     Cada sector define:
       tipos   -- las opciones que se muestran
       fijo    -- el benchmark queda clavado en ese valor pase lo que pase.
                  Sirve para K-12 y postsecundaria: se les PREGUNTA si el
                  sitio es academico o no --dato util para el equipo de
                  ventas-- pero la respuesta NO cambia el calculo. Es
                  deliberado, no un fallo: no hay datos C-Op separados para
                  cada uno.
       ayuda   -- el texto bajo el desplegable. El general dice "elige la
                  coincidencia mas cercana", y eso solo es cierto cuando la
                  eleccion cambia el resultado. */
  var SECTORES = {
    k12: {
      fijo: 'school',
      tipos: [
        { valor: 'school',   label: 'Academic site' },
        { valor: 'school',   label: 'Non-academic site' }
      ],
      ayuda: 'Both site types use the same School benchmark from the ' +
             'historical C-Op data. Your answer helps our team understand ' +
             'your portfolio.'
    },
    postsec: {
      fijo: 'university',
      tipos: [
        { valor: 'university', label: 'Academic site' },
        { valor: 'university', label: 'Non-academic site' }
      ],
      ayuda: 'Both site types use the same University or college benchmark ' +
             'from the historical C-Op data. Your answer helps our team ' +
             'understand your portfolio.'
    },
    health: {
      tipos: ['hospital', 'nursingHome', 'extendedCare']
    },
    commercial: {
      tipos: ['largeOffice', 'mediumOffice', 'foodRetail', 'shoppingMall',
              'hotel', 'recreation', 'murb']
    },
    housing: {
      /* Un operador de vivienda solo tiene un tipo posible: el paso se
         salta entero y se rellena solo --eso lo hace la navegacion--. La
         lista se deja igualmente en un solo tipo por si el paso llega a
         verse. */
      fijo: 'murb',
      salta: true,
      tipos: ['murb']
    },
    muni: {
      /* No hay datos C-Op de edificios municipales --parques de bomberos,
         naves de obras publicas--, asi que no se puede dar un benchmark.
         En vez del desplegable va un campo libre y el camino termina en una
         propuesta de llamada. Hasta que eso este montado, la lista se deja
         vacia: mostrar los trece invitaria a elegir un benchmark que no
         corresponde. */
      libre: true,
      sinBenchmark: true,
      tipos: []
    },
    other: {
      /* Sin filtrar: es el cajon de sastre. */
      tipos: null
    }
  };

  /* La ayuda que trae el marcado, para poder volver a ella. */
  var ayudaTipo = document.getElementById('ayuda-tipo') ||
                  (selTipo.closest('.paso-calc') || document).querySelector('.paso-calc__ayuda');
  var AYUDA_GENERAL = ayudaTipo ? ayudaTipo.textContent : '';

  function opcionesDe(sector) {
    var cfg = SECTORES[sector];

    /* Sin sector elegido, o sector sin filtro: la lista completa. */
    if (!cfg || cfg.tipos === null || cfg.tipos === undefined) {
      /* null o sin definir = sin filtro. Una lista vacia NO entra aqui:
         significa que ese sector no ofrece tipos. */
      return Object.keys(BENCHMARKS).map(function (k) {
        return { valor: k, label: BENCHMARKS[k].label };
      });
    }

    return cfg.tipos.map(function (t) {
      /* Una entrada puede ser la clave del benchmark a secas, o traer su
         propia etiqueta cuando el texto no coincide con el benchmark
         --"Academic site" apunta a "school"--. */
      if (typeof t === 'string') {
        return { valor: t, label: BENCHMARKS[t].label };
      }
      return t;
    });
  }

  function pintarTipos(sector) {
    var cfg = SECTORES[sector] || {};
    var previo = selTipo.value;

    selTipo.innerHTML = '';
    opcionesDe(sector).forEach(function (o, i) {
      var op = document.createElement('option');
      op.value = o.valor;
      op.textContent = o.label;
      /* Dos opciones pueden compartir benchmark --academico y no
         academico-- y el navegador las trataria como la misma. El indice
         las distingue para poder saber cual eligio. */
      op.dataset.i = i;
      selTipo.appendChild(op);
    });

    /* Se conserva lo que ya habia elegido si sigue estando disponible. */
    var sigue = Array.prototype.some.call(selTipo.options, function (o) {
      return o.value === previo;
    });
    if (sigue) { selTipo.value = previo; }

    if (ayudaTipo) {
      ayudaTipo.textContent = cfg.ayuda || AYUDA_GENERAL;
    }

    /* Tres formas de ensenar este paso:

         libre    ayuntamientos. Sin lista posible, se pide una descripcion.
         salta    un solo tipo --vivienda--: el desplegable sobra y se
                  rellena solo. La superficie SI se sigue pidiendo, asi que
                  la pantalla no se puede saltar entera.
         normal   el desplegable de siempre. */
    var cajaTipo  = seccion.querySelector('[data-campo="tipo"]');
    var cajaLibre = seccion.querySelector('[data-campo="libre"]');
    var libre = seccion.querySelector('#c-desc');

    if (cajaTipo)  { cajaTipo.hidden  = !!(cfg.libre || cfg.salta); }
    if (cajaLibre) { cajaLibre.hidden = !cfg.libre; }
    if (libre) { libre.tabIndex = cfg.libre ? 0 : -1; }

    /* El gasto anual, solo donde hay benchmark que aplicarle.

       Antes vivia en una pantalla propia que se saltaba entera para los
       sectores sin datos C-Op --los ayuntamientos--. Al mudarse junto al
       area (14/9/2026) esa pantalla dejo de existir, asi que la misma
       regla se aplica ahora al campo: sin benchmark no hay calculo, y
       pedir el gasto seria pedir por pedir. */
    var gasto = seccion.querySelector('#c-spend');
    if (gasto) {
      var cajaGasto = gasto.closest('.campo');
      var sinCalculo = !!cfg.sinBenchmark;
      if (cajaGasto) { cajaGasto.hidden = sinCalculo; }
      gasto.tabIndex = sinCalculo ? -1 : 0;
      if (sinCalculo) { gasto.value = ''; }
    }

    /* Con un solo tipo se elige solo: es el unico que hay. */
    if (cfg.salta && cfg.fijo) { selTipo.value = cfg.fijo; }

    if (ayudaTipo && cfg.libre) {
      ayudaTipo.textContent = 'We do not have C-Op benchmark data for ' +
        'municipal buildings, so this one goes straight to a conversation ' +
        'with the team.';
    }
    if (ayudaTipo && cfg.salta) {
      ayudaTipo.textContent = 'Housing portfolios use the Multi-unit ' +
        'residential building benchmark from the historical C-Op data.';
    }
  }

  pintarTipos('');
  /* Se preselecciona school --el sector principal de Rede-- pero eso NO
     cuenta como eleccion del usuario: el perfil solo marca la fila cuando
     alguien toca el selector o pasa por ese paso. Antes salia marcada
     desde el primer momento. */
  selTipo.value = 'school';
  var tipoElegido = false;
  selTipo.addEventListener('change', function () { tipoElegido = true; });

  /* --- Navegacion entre pasos -------------------------------------------- */

  var barra    = $('#barra');
  var contador = $('#paso-n');
  var btnAtras = $('#btn-atras');
  var btnSig   = $('#btn-siguiente');
  var btnTexto = $('#btn-texto');

  function pintarPaso() {
    seccion.querySelectorAll('.paso-calc').forEach(function (p) {
      p.classList.toggle('is-activo', Number(p.dataset.paso) === estado.paso);
    });

    if (typeof refrescarPerfil === 'function') { refrescarPerfil(); }

    /* Las variantes que muestran los cuatro campos a la vez no llevan barra
       de progreso ni contador: no hay pasos que contar. Sin esta guarda el
       modulo se caia ahi y dejaba la calculadora muerta. */
    if (barra) {
      /* Sobre los pasos visibles, no sobre los ocho: quien se salta tres
         pantallas veria la barra atascada, como si no avanzara. */
      barra.style.width = (ordinalDe(estado.paso) / pasosVisibles() * 100) + '%';
      if (barra.parentElement) {
        barra.parentElement.setAttribute('aria-valuenow', estado.paso);
      }
    }
    if (contador) { contador.textContent = ordinalDe(estado.paso); }

    btnAtras.hidden = estado.paso === 1;
    /* El ultimo paso de ESTA persona, que no siempre es el 8: quien se lo
       salta veia "Next" en la ultima pantalla, sin nada detras. */
    /* Solo es el ultimo si no queda ninguna pantalla por delante. */
    var esUltimo = estado.paso >= TOTAL || siguientePaso(estado.paso) > TOTAL;
    var sec = $('#c-sector');
    var cfgSec = sec ? SECTORES[sec.value] : null;

    if (!esUltimo) {
      btnTexto.textContent = 'Next';
    } else if (cfgSec && cfgSec.sinBenchmark) {
      /* Un ayuntamiento no recibe cifra: prometerle un "benchmark result"
         seria enganarle. */
      btnTexto.textContent = 'See what we can do';
    } else {
      btnTexto.textContent = 'Show benchmark result';
    }
    /* El total tambien se ajusta: si son seis pantallas, la etiqueta debe
       decir seis. */
    var totalEti = document.getElementById('paso-total');
    if (totalEti) { totalEti.textContent = pasosVisibles(); }

    /* La barra anuncia su maximo a los lectores de pantalla: si dice 8 y
       solo hay 6 pantallas, el progreso que oyen no cuadra con el que ven. */
    if (barra && barra.parentElement) {
      barra.parentElement.setAttribute('aria-valuemax', pasosVisibles());
    }
  }

  /* --- Validacion de cada paso -------------------------------------------

     Que se exige en cada paso. El area y el gasto llevan minimo y maximo
     porque un edificio de 3 pies cuadrados o de mil millones no es un dato
     real, sino un dedazo o una prueba: dejarlo pasar da una cifra que nadie
     puede defender delante de un cliente.                                  */

  /* #c-province NO se valida: ya no es una pregunta. Desde el 14/9/2026 es
     un campo oculto que el guion deriva de #c-prov --el del paso 2, que si
     se valida-- para el perfil y para HubSpot. */

  var REGLAS = {
    /* Precalificacion (9/9/2026). Los pasos 1 y 3 son botones, no campos:
       se validan aparte, en `siguiente()`. */
    2: [
      { id: '#c-prov', aviso: 'Choose your province or territory.' },
      { id: '#c-city', aviso: 'Enter your city or district.' }
    ],
    4: [
      { id: '#c-funding', aviso: 'Choose one option to continue.' }
    ],
    6: [
      { id: '#c-sector', aviso: 'Choose your sector to continue.' }
    ],
    7: [
      /* Los tres se validan solo si estan a la vista: revisar() se salta
         los campos ocultos, asi que el desplegable no bloquea al
         ayuntamiento ni la descripcion al resto. */
      { id: '#c-desc', aviso: 'Tell us what kind of building this is.' },
      { id: '#c-type', aviso: 'Choose a building type.' },
      { id: '#c-area', aviso: 'Enter your total area.', min: 100, max: 1e9,
        fuera: 'Enter an area between 100 and 1,000,000,000 sq ft.' },
      /* El gasto se mudo aqui el 14/9/2026, con su regla.

         opcional:true -- el campo lleva placeholder "Optional" y el cliente
         reporto (9/9/2026) que aun asi daba error al dejarlo vacio. Vacio
         se acepta; si se escribe algo, se sigue comprobando que sea un
         numero y que este en rango, porque un gasto de "abc" o de doce
         mil millones tampoco sirve.

         Tampoco se pide cuando esta oculto --sector sin benchmark--:
         revisar() se salta las reglas cuyo campo no esta a la vista. */
      { id: '#c-spend', aviso: 'Enter your annual utility spend.', min: 1, max: 1e9,
        opcional: true,
        fuera: 'Enter a spend between $1 and $1,000,000,000.' }
    ],
    /* El numero de sitios acompana ahora al ambito. No se pide cuando esta
       oculto --un solo edificio--: revisar() se salta las reglas cuyo campo
       no esta a la vista. */
    5: [
      { id: '#c-sites', aviso: 'Enter how many sites you manage.', min: 1, max: 10000,
        fuera: 'Enter a number of sites between 1 and 10,000.' }
    ]
  };

  /* Marca o limpia un campo. El aviso se pinta en un <p> creado al vuelo y
     se enlaza con aria-describedby: quien use lector de pantalla oye el
     motivo, no solo que algo fallo. El color rojo nunca va solo --hay texto
     y un icono--, que es lo que pide la norma 1.4.1. */
  function marcar(campo, mensaje) {
    var wrap = campo.closest('.campo__wrap') || campo;
    var caja = campo.closest('.campo') || wrap.parentElement;
    if (!caja) { return; }

    var aviso = caja.querySelector('.campo__error');

    if (!mensaje) {
      wrap.classList.remove('tiene-error');
      campo.removeAttribute('aria-invalid');
      campo.removeAttribute('aria-describedby');
      if (aviso) { aviso.remove(); }
      return;
    }

    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'campo__error';
      aviso.id = (campo.id || 'campo') + '-error';
      aviso.setAttribute('role', 'alert');
      caja.appendChild(aviso);
    }
    aviso.textContent = mensaje;
    wrap.classList.add('tiene-error');
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', aviso.id);
  }

  /* Revisa un paso. Devuelve el primer campo que falla, o null si esta bien. */
  function revisar(paso) {
    var reglas = REGLAS[paso];
    if (!reglas) { return null; }

    var primero = null;

    reglas.forEach(function (r) {
      var campo = $(r.id);
      if (!campo) { return; }

      /* Un campo oculto no se valida: pedir un dato que nadie ve deja el
         paso bloqueado sin explicacion posible. */
      if (campo.offsetParent === null) { marcar(campo, ''); return; }

      var bruto = String(campo.value || '').trim();

      if (!bruto) {
        /* Un campo opcional vacio no es un error: se limpia cualquier
           aviso anterior y se sigue. */
        if (r.opcional) { marcar(campo, ''); return; }

        marcar(campo, r.aviso);
        if (!primero) { primero = campo; }
        return;
      }

      /* Los campos numericos: primero que sea un numero, y luego que este
         dentro del rango. Son dos avisos distintos porque el problema es
         distinto: "250000abc" no es que se salga de rango, es que no es un
         numero, y decir "entre 100 y mil millones" ahi confunde. */
      if (r.min !== undefined) {
        var n = numero(bruto);

        if (n === 0 && bruto !== '0') {
          marcar(campo, 'Enter a number, digits only.');
          if (!primero) { primero = campo; }
          return;
        }

        if (n < r.min || n > r.max) {
          marcar(campo, r.fuera || r.aviso);
          if (!primero) { primero = campo; }
          return;
        }
      }

      marcar(campo, '');
    });

    return primero;
  }

  /* Al corregir un campo el aviso desaparece solo: mantenerlo mientras el
     visitante ya esta escribiendo la respuesta correcta es molesto. */
  ['input', 'change'].forEach(function (evt) {
    seccion.addEventListener(evt, function (e) {
      var campo = e.target;
      if (!campo.matches || !campo.matches('.campo__input')) { return; }
      var wrap = campo.closest('.campo__wrap');
      if (!wrap || !wrap.classList.contains('tiene-error')) { return; }
      if (String(campo.value || '').trim()) { marcar(campo, ''); }
    }, true);
  });

  /* --- LOS SALTOS DE LA PRECALIFICACION (9/9/2026, Parte 1) --------------

     Ocho pasos, pero nadie los ve los ocho. Segun lo que responda, unos se
     saltan:

       1  tamano       No  -> se acaba aqui: formulario de contacto
       2  ubicacion    fuera de BC -> salta al 5
       3  BC Hydro     No  -> salta al 5
       4  subvenciones siempre sigue al 5
       5..8  el flujo de siempre

     El salto se decide en `siguientePaso()` y `pasoAnterior()`, que son las
     unicas dos funciones que saben del recorrido. Asi, si manana cambia una
     regla, se cambia en un sitio y no en cinco.

     ATRAS tiene que deshacer el MISMO camino que se hizo hacia delante: si
     alguien de Alberta salto del 2 al 5, atras debe llevarle al 2 y no al
     4, que nunca vio. */

  function seSalta(paso) {
    /* Pasos 3 y 4 solo para la Columbia Britanica. */
    if (paso === 3) { return estado.provincia !== 'BC'; }

    /* El 4 pide historial de subvenciones y solo tiene sentido para quien
       es cliente de BC Hydro o FortisBC. */
    if (paso === 4) { return estado.provincia !== 'BC' || estado.utility !== 'si'; }

    /* El gasto ya no tiene pantalla propia --vive junto al area, en el
       paso del tipo-- asi que un sector sin benchmark no puede saltarse
       una pantalla entera: se le oculta solo el campo. Lo hace
       ajustarCamposSector(). */

    return false;
  }

  function siguientePaso(desde) {
    var n = desde + 1;
    while (n <= TOTAL && seSalta(n)) { n += 1; }
    return n;
  }

  function pasoAnterior(desde) {
    var n = desde - 1;
    while (n >= 1 && seSalta(n)) { n -= 1; }
    return n;
  }

  /* Cuantos pasos vera de verdad esta persona: es lo que tiene que contar
     la barra de progreso. Contar siempre 8 haria que se quedara parada en
     los saltos, como si no avanzara. */
  function pasosVisibles() {
    var n = 0;
    for (var i = 1; i <= TOTAL; i++) { if (!seSalta(i)) { n += 1; } }
    return n;
  }

  function ordinalDe(paso) {
    var n = 0;
    for (var i = 1; i <= paso; i++) { if (!seSalta(i)) { n += 1; } }
    return n;
  }

  /* Aviso para los pasos que se responden con botones. El texto va bajo
     las opciones y se anuncia con role=alert, igual que los de los campos:
     quien use lector de pantalla oye el motivo, no solo que algo fallo. */
  function avisarEleccion(paso) {
    var caja = seccion.querySelector('[data-paso="' + paso + '"]');
    if (!caja) { return; }

    var aviso = caja.querySelector('.campo__error');
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'campo__error';
      aviso.setAttribute('role', 'alert');
      var ops = caja.querySelector('.opciones');
      if (ops) { ops.parentNode.insertBefore(aviso, ops.nextSibling); }
      else { caja.appendChild(aviso); }
    }
    aviso.textContent = 'Choose one option to continue.';

    var primero = caja.querySelector('.opcion');
    if (primero) { primero.focus(); }
  }

  function siguiente() {
    // El paso 1 necesita una eleccion; si no la hay, se asume portafolio
    /* El paso del ambito ahora es el 5. */
    if (estado.paso === 5 && !estado.scope) { elegirScope('multi'); }

    /* Los pasos 1 y 3 son botones, no campos: REGLAS no puede validarlos.
       Sin elegir no se avanza, porque de esa respuesta depende el camino
       entero. */
    if (estado.paso === 1 && !estado.tamano) { avisarEleccion(1); return; }
    if (estado.paso === 3 && !estado.utility) { avisarEleccion(3); return; }

    /* Un "no" en el filtro de tamano termina el recorrido: no hay benchmark
       que calcular. Se salta directo al formulario de contacto. */
    if (estado.paso === 1 && estado.tamano === 'no') {
      estado.paso = TOTAL;
      calcular();
      return;
    }

    /* Si la variante muestra los cuatro campos a la vez no hay pasos que
       recorrer: el boton calcula directamente. Sin esto pedia cuatro clics
       para avanzar por pantallas que ya estaban visibles. */
    if (seccion.querySelector('[data-abierto]')) {
      var falla = revisar(2) || revisar(3) || revisar(4);
      if (falla) { falla.focus(); return; }
      estado.paso = TOTAL;
      calcular();
      return;
    }

    /* No se avanza con el paso a medias. El foco salta al primer campo que
       falta para que no haya que buscarlo. */
    var pendiente = revisar(estado.paso);
    if (pendiente) {
      pendiente.focus();
      return;
    }

    var siguienteReal = siguientePaso(estado.paso);
    if (siguienteReal <= TOTAL) {
      estado.paso = siguienteReal;
      pintarPaso();
    } else {
      calcular();
    }
  }

  function atras() {
    if (estado.paso > 1) {
      estado.paso = pasoAnterior(estado.paso);
      pintarPaso();
    }
  }

  btnSig.addEventListener('click', siguiente);
  btnAtras.addEventListener('click', atras);

  /* --- Panel vivo: se llena con cada respuesta ---------------------------- */

  function fila(clave) { return seccion.querySelector('[data-fila="' + clave + '"]'); }

  /* La fila APARECE al llenarse (14/9/2026).

     Antes las diez estaban siempre a la vista y nueve de ellas mostraban
     un guion. El panel medía lo mismo con una respuesta que con las diez,
     y el usuario leia una lista de huecos.

     No se pierde la vista previa de lo que falta: para eso estan los dos
     contadores --"0 of 10" arriba y "Step 1 of N" en el formulario-- que
     ya dicen cuanto queda sin ocupar una linea por cada cosa pendiente. */
  /* La contraria de ponerFila: devuelve la fila a su estado vacio.

     Hacia falta porque una fila puesta NO se revertia nunca. refrescarPerfil()
     llama a ponerFila solo cuando hay dato, asi que si el dato desaparece
     --al cambiar de "un edificio" a "varios", que borra el campo de
     sitios-- el valor viejo se quedaba escrito.

     Eso es lo que veia el usuario: "Sites: 1 site" con "Multiple
     buildings" elegido y el campo vacio. */
  function vaciarFila(clave) {
    var f = fila(clave);
    if (!f) { return; }
    f.querySelector('.perfil__valor').textContent = '-';
    f.classList.remove('is-lleno');
    f.hidden = true;
  }

  function ponerFila(clave, valor) {
    var f = fila(clave);
    if (!f) { return; }
    f.querySelector('.perfil__valor').textContent = valor;
    f.classList.add('is-lleno');
    f.hidden = false;
  }

  function milesTxt(n) {
    if (!n) { return ''; }
    if (n >= 1000000) { return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M sq ft'; }
    if (n >= 1000)    { return Math.round(n / 1000) + 'K sq ft'; }
    return n + ' sq ft';
  }

  var TXT_SECTOR = {
    k12: 'K-12 school district',
    postsec: 'Post-secondary',
    health: 'Healthcare',
    muni: 'Municipality',
    commercial: 'Commercial property',
    housing: 'Housing operator',
    other: 'Institutional'
  };

  var TXT_PROV = { bc: 'BC', ca: 'Canada' };

  var TXT_PROVINCIA = {
    BC: 'British Columbia', AB: 'Alberta', SK: 'Saskatchewan',
    ON: 'Ontario', MB: 'Manitoba', QC: 'Quebec', NS: 'Nova Scotia',
    NB: 'New Brunswick', NL: 'Newfoundland', PE: 'PEI',
    YT: 'Yukon', NT: 'NWT', NU: 'Nunavut'
  };

  /* --- La precalificacion, en el perfil desde el paso 1 -------------------

     Antes estas cuatro respuestas no se veian: el panel decia "-" en todo
     hasta el paso 5 y el visitante contestaba media calculadora sin que
     nada acusara recibo. Los datos ya estaban en `estado`; solo faltaba
     pintarlos.

     Las filas viven en el MISMO <ul> que las del edificio, no en una lista
     aparte: la regla que marca "la primera fila pendiente" usa el
     combinador ~ entre hermanos .perfil__fila, y un <li> de encabezado en
     medio la partiria --saldrian dos puntos latiendo a la vez--. La
     separacion visual la da una clase en la primera fila del segundo
     grupo. */
  function refrescarElegibilidad() {
    if (estado.tamano) {
      ponerFila('tamano', estado.tamano === 'si' ? '25,000+ sq ft' : 'Under 25,000 sq ft');
    }

    /* CON "NO" EN EL FILTRO DE TAMANO, EL LUGAR NO APLICA

       Un "no" a los 25.000 pies termina el recorrido en el acto: se salta
       a la pantalla de consulta sin pasar por ubicacion ni por nada mas.

       Pero si el visitante habia elegido provincia ANTES de volver atras y
       cambiar su respuesta, la fila se quedaba escrita. Y ahi dice algo
       que no viene al caso: la ubicacion importa para saber que programas
       de utility aplican, y sin el tamano minimo no hay programa que
       mirar.

       Asi que con "no" la fila se vacia, aunque el campo tenga valor. */
    if (estado.tamano === 'no') {
      vaciarFila('lugar');
    } else {
      var prov = $('#c-prov');
      var ciudad = $('#c-city');
      if (prov && prov.value) {
        var txtLugar = TXT_PROVINCIA[prov.value] || prov.value;
        /* La ciudad delante cuando la han escrito: es el dato mas concreto
           y el que el visitante reconoce como suyo. */
        var c = ciudad && ciudad.value.trim();
        ponerFila('lugar', c ? c + ', ' + prov.value : txtLugar);
      }
    }

    /* Mismo caso: comercializadora y subvenciones son pantallas que solo
       existen dentro del recorrido completo. Con "no" no se han visto, y
       si quedaron escritas de un intento anterior, sobran. */
    if (estado.tamano === 'no') {
      vaciarFila('utility');
      vaciarFila('fondos');
    } else {
      if (estado.utility) {
        ponerFila('utility', estado.utility === 'si' ? 'BC Hydro / FortisBC' : 'Other provider');
      }

      var fondos = $('#c-funding');
      if (fondos && fondos.value) {
        ponerFila('fondos', fondos.options[fondos.selectedIndex].text);
      }
    }
  }

  /* Cuando la precalificacion queda atras, sus cuatro filas se pliegan en
     una sola linea de resumen. El panel no crece indefinidamente --con diez
     filas a 390px la mitad quedaria fuera de pantalla-- y lo ya resuelto
     pesa menos que lo que toca ahora, que es el mismo criterio del punto
     que late. */
  function plegarElegibilidad() {
    var resumen = seccion.querySelector('#eleg-resumen');
    if (!resumen) { return; }

    var filas = seccion.querySelectorAll('.perfil__fila--eleg');
    var plegar = estado.paso >= PASO_PERFIL && !seccion.querySelector('[data-abierto]');

    Array.prototype.forEach.call(filas, function (f) {
      /* Plegar las esconde todas. Desplegar NO las muestra todas: solo
         vuelven las que ya tienen respuesta.

         Sin ese matiz, al desplegar reaparecerian las cuatro filas de
         elegibilidad aunque estuvieran vacias, que es justo lo que este
         cambio viene a evitar. */
      f.hidden = plegar || !f.classList.contains('is-lleno');
    });
    resumen.hidden = !plegar;

    if (!plegar) { return; }

    /* El resumen dice lo que importa para seguir: donde esta y si la
       comercializadora abre la puerta a programas. El tamano solo aparece
       si es el dato que descarta, porque entonces manda sobre el resto. */
    var partes = [];
    var lugar = seccion.querySelector('[data-fila="lugar"] .perfil__valor');
    if (lugar && lugar.textContent !== '-') { partes.push(lugar.textContent); }
    if (estado.utility === 'si') { partes.push('BC Hydro / FortisBC'); }
    if (estado.tamano === 'si') { partes.push('25,000+ sq ft'); }
    else if (estado.tamano === 'no') { partes.unshift('Under 25,000 sq ft'); }

    var txt = seccion.querySelector('#eleg-resumen-txt');
    if (txt) { txt.textContent = partes.join('  ·  ') || 'Eligibility checked'; }
  }

  function refrescarPerfil() {
    refrescarElegibilidad();

    if (estado.scope) {
      ponerFila('scope', estado.scope === 'single' ? 'One building' : 'Multiple buildings');
    }

    var sector = $('#c-sector').value;
    var prov   = $('#c-province').value;
    if (sector) {
      var txt = TXT_SECTOR[sector] || 'Organization';
      if (TXT_PROV[prov]) { txt += ', ' + TXT_PROV[prov]; }
      ponerFila('sector', txt);
    }

    /* El tipo solo cuenta cuando el visitante ha PASADO por su pantalla.

       Antes la condicion era `estado.paso > 3`, el numero del paso del
       tipo en la numeracion antigua. Al pasar a ocho pasos --el tipo es
       ahora el 7-- eso daba por elegido el valor por defecto desde el
       paso 4, y el perfil mostraba "Building type: School" en la pantalla
       del ambito, sin que nadie lo hubiera tocado.

       PASO_TIPO se lee del marcado en vez de escribirse a mano: asi
       renumerar los pasos otra vez no vuelve a romper esto.

       Las variantes abiertas --las que ensenan los cuatro campos a la vez
       y no recorren pasos-- se detectan por [data-abierto] y ahi el tipo
       cuenta desde el principio: no hay pantalla por la que pasar. */
    var clave = selTipo.value;
    var abierta = !!seccion.querySelector('[data-abierto]');
    if (clave && (tipoElegido || abierta || estado.paso >= PASO_TIPO)) {
      var b = BENCHMARKS[clave];
      ponerFila('tipo', b.label);

      // Adelanto del benchmark: recompensa parcial antes del resultado
      var adelanto = $('#adelanto');
      $('#adelanto-pct').textContent = b.savingsPct.toFixed(1);
      $('#adelanto-txt').textContent =
        'average historical cost reduction for ' + b.label.toLowerCase() + ' buildings';
      adelanto.hidden = false;
      $('#prueba').hidden = true;   // el dato propio sustituye a la prueba social
    }

    /* Igual que con los sitios: si el visitante borra el campo, la fila
       se vacia en vez de conservar el ultimo valor escrito. */
    var area = numero($('#c-area').value);
    if (area) { ponerFila('area', milesTxt(area)); }
    else { vaciarFila('area'); }

    /* El perfil recoge TODO lo que el formulario sabe, no solo cuatro
       campos: sirve de vista rapida completa. ponerFila ya ignora las
       filas que un diseño no tenga. */
    var gastoPerfil = numero($('#c-spend').value);
    if (gastoPerfil) { ponerFila('spend', dinero(gastoPerfil)); }
    else { vaciarFila('spend'); }

    /* El numero de sitios solo si el visitante ha llegado a su pantalla.

       Con "One building" el guion escribe un 1 en el campo --la respuesta
       es evidente y el campo se oculta-- pero eso no es un dato que haya
       dado nadie: el perfil mostraba "Sites: 1 site" desde el paso 5. */
    var sitiosPerfil = numero($('#c-sites').value);
    if (sitiosPerfil && (abierta || estado.paso >= PASO_SITIOS)) {
      ponerFila('sites', sitiosPerfil === 1 ? '1 site' : sitiosPerfil + ' sites');
    } else {
      /* Sin dato, la fila se vacia en vez de conservar el anterior. El
         caso que lo destapo: elegir "un edificio" --que escribe un 1 en
         el campo-- y cambiar despues a "varios", que lo borra. La fila
         seguia diciendo "1 site". */
      vaciarFila('sites');
    }

    plegarElegibilidad();

    /* EL TOTAL SALE DE LA RAMA, NO DE LO QUE SE VE (14/9/2026)

       Antes se contaban las filas VISIBLES. Funcionaba porque las diez
       estaban siempre a la vista; ahora aparecen solo al llenarse, asi
       que contar las visibles daria "1 of 1", "2 of 2"... y el contador
       dejaria de informar.

       El total es ahora el numero de filas que ESTE recorrido va a
       visitar, que depende de lo que se haya respondido:

         fuera de BC       no hay utility ni fondos    -2
         un solo edificio  no hay sites                -1

       Un "of 10" al que nunca se llega es peor que no contar nada, y ese
       era ya el criterio de la version anterior: lo unico que cambia es
       de donde se saca el numero. */
    var todas = seccion.querySelectorAll('.perfil__fila');

    var noAplica = {};
    /* Los pasos 3 y 4 solo existen en BC: fuera, ni se pregunta por la
       comercializadora ni por subvenciones previas. */
    if (estado.provincia && estado.provincia !== 'BC') {
      noAplica.utility = true;
      noAplica.fondos = true;
    }
    /* Con un solo edificio no hay numero de sitios que dar. */
    if (estado.scope === 'single') {
      noAplica.sites = true;
    }

    var totalFilas = 0, listas = 0;
    var pendiente = null;

    Array.prototype.forEach.call(todas, function (f) {
      if (noAplica[f.getAttribute('data-fila')]) { return; }
      totalFilas++;
      if (f.classList.contains('is-lleno')) {
        listas++;
      } else if (!pendiente) {
        pendiente = f;
      }
    });

    /* LA PROXIMA FILA SE VE, AUNQUE ESTE VACIA (14/9/2026)

       Lo pidio el usuario: "que aparezca el punto uno desde que carga".

       Sin esto el panel arrancaba completamente vacio --un titulo, un
       contador a cero y nada debajo-- y no se entendia para que servia
       hasta responder la primera pregunta.

       Con la siguiente a la vista, el panel siempre ensena DONDE va a
       caer la respuesta que el usuario esta a punto de dar. Es una fila,
       no diez: la altura sigue creciendo con las respuestas.

       Se busca la primera SIN is-lleno en vez de mapear paso -> fila,
       porque el orden de las filas ya sigue el de los pasos y una tabla
       de equivalencias seria una cosa mas que mantener sincronizada. */
    if (pendiente) { pendiente.hidden = false; }

    $('#etiqueta-progreso').textContent = listas + ' of ' + totalFilas;
  }


  /* --- Paso 1: uno o varios edificios ------------------------------------- */

  function elegirScope(valor) {
    estado.scope = valor;
    /* [data-scope] y no .opcion a secas: las pantallas de precalificacion
       usan el mismo aspecto de boton pero con data-tamano o data-utility.
       Sin acotar, aqui se comparaba undefined === undefined --que da
       true-- y se marcaban TODAS las opciones de la seccion. */
    seccion.querySelectorAll('.opcion[data-scope]').forEach(function (o) {
      var elegida = o.dataset.scope === valor;
      o.classList.toggle('is-elegida', elegida);
      /* aria-pressed y no solo la clase: sin el, un lector de pantalla lee
         los dos botones igual y no hay forma de saber cual esta elegido. */
      o.setAttribute('aria-pressed', String(elegida));
    });
    /* "Number of sites" solo tiene sentido con varios edificios: con uno
       la respuesta es 1 y preguntarla sobra. Se oculta el campo entero
       --su etiqueta incluida-- y se fija el valor. (Feedback 9/9/2026,
       Parte 3.) */
    var sitios = $('#c-sites');
    if (sitios) {
      var caja = sitios.closest('.campo');
      if (valor === 'single') {
        sitios.value = '1';
        if (caja) { caja.hidden = true; }
        /* hidden saca la caja del flujo, pero el campo seguiria recibiendo
           el tabulador en navegadores viejos. */
        sitios.tabIndex = -1;
      } else {
        if (caja) { caja.hidden = false; }
        sitios.tabIndex = 0;
        /* El 1 que se puso al elegir "un edificio" no debe quedarse de
           relleno si luego se cambia a varios: seria un dato que el
           visitante no ha dado. */
        if (sitios.value === '1') { sitios.value = ''; }
      }
    }
  }


  /* --- Las cuatro pantallas de precalificacion --------------------------- */

  /* Boton de dos opciones --si/no--: marca la elegida y guarda la respuesta.
     Es el mismo gesto que el paso del ambito, asi que se reutiliza el
     aspecto .opcion y solo cambia el atributo que se lee. */
  function conectarEleccion(atributo, alElegir) {
    /* .opcion delante: sin el, el selector tambien cogeria cualquier otro
       elemento que use ese atributo para otra cosa. */
    var botones = seccion.querySelectorAll('.opcion[data-' + atributo + ']');
    Array.prototype.forEach.call(botones, function (b) {
      b.addEventListener('click', function () {
        var valor = b.getAttribute('data-' + atributo);
        Array.prototype.forEach.call(botones, function (o) {
          var elegida = o === b;
          o.classList.toggle('is-elegida', elegida);
          /* aria-pressed y no solo la clase: sin el, un lector de pantalla
             lee los dos botones igual y no hay forma de saber cual esta
             elegido. */
          o.setAttribute('aria-pressed', String(elegida));
        });
        alElegir(valor);
      });
    });
  }

  /* Paso 1: el filtro de tamano. Un "no" termina el recorrido aqui mismo:
     no hay benchmark que calcular para un edificio que nunca sera proyecto,
     pero si conviene recoger el contacto. */
  conectarEleccion('tamano', function (v) {
    estado.tamano = v;
    if (v === 'no') {
      estado.descartado = true;
      seccion.dispatchEvent(new CustomEvent('rede:camino', { detail: 'descartado' }));
    } else {
      estado.descartado = false;
      seccion.dispatchEvent(new CustomEvent('rede:camino', { detail: 'cualificado' }));
    }
    refrescarPerfil();
  });

  /* Paso 2: la ubicacion. La provincia decide si se veran los pasos 3 y 4. */
  (function () {
    var prov = $('#c-prov');
    var city = $('#c-city');
    if (prov) {
      prov.addEventListener('change', function () {
        estado.provincia = prov.value;
        /* Al cambiar de provincia, lo respondido sobre la comercializadora
           deja de valer: si alguien pasa de BC a Alberta, su "si soy de BC
           Hydro" ya no tiene sentido. */
        if (prov.value !== 'BC') { estado.utility = ''; }
        sincronizarProvincia();
        refrescarPerfil();
        /* La provincia cambia cuantas pantallas quedan por delante, asi que
           el contador y la barra se rehacen ya: si no, dirian "of 6" hasta
           el siguiente clic. */
        pintarPaso();
      });
    }
    if (city) {
      city.addEventListener('input', function () {
        estado.ciudad = city.value;
        refrescarPerfil();
      });
    }
  }());

  /* Paso 3: comercializadora. Un "no" salta el 4, que solo pregunta por
     subvenciones de BC Hydro y FortisBC. */
  conectarEleccion('utility', function (v) {
    estado.utility = v;
    refrescarPerfil();
    /* Un "no" retira la pantalla de subvenciones: el total baja en uno. */
    pintarPaso();
  });

  /* Paso 4: historial de subvenciones. Se guarda pero no cambia el camino:
     el cliente lo quiere como dato para el equipo comercial. */
  (function () {
    var f = $('#c-funding');
    if (!f) { return; }
    f.addEventListener('change', function () { estado.funding = f.value; refrescarPerfil(); });
  }());

  /* La descripcion libre de los ayuntamientos. */
  (function () {
    var d = $('#c-desc');
    if (!d) { return; }
    d.addEventListener('input', function () { estado.descripcion = d.value; });
  }());

  seccion.querySelectorAll('.opcion[data-scope]').forEach(function (o) {
    o.addEventListener('click', function () {
      /* Solo marca la eleccion. Antes saltaba de paso a los 220ms, y eso
         incumple WCAG 3.2.2: quien recorre las opciones con el teclado
         cambia la seleccion al pasar por ellas y se encontraba en otra
         pantalla sin haberlo pedido.

         El flujo no cambia: se avanza con el boton Next, que ya estaba
         ahi y ahora es el unico camino. */
      elegirScope(o.dataset.scope);

      /* Sin esto la fila Scope no aparecia hasta tocar otro campo, y daba
         la sensacion de que el clic no habia hecho nada. */
      refrescarPerfil();
    });
  });

  // Selector de region: dos botones en lugar de un desplegable
  /* La provincia ya no se pregunta dos veces. El duo "British Columbia /
     Rest of Canada" se retiro del paso del sector el 14/9/2026: repetia la
     pregunta del paso 2 --que ofrece las trece provincias y la ciudad-- y
     ademas iba DESPUES, asi que el visitante la contestaba ya contestada.

     #c-province sigue existiendo porque lo leen el perfil, el envio a
     HubSpot y el reinicio; su valor se deriva ahora del dato real. El
     resto del guion solo distingue BC del resto de Canada. */
  function sincronizarProvincia() {
    var prov = $('#c-prov');
    var oculto = $('#c-province');
    if (!oculto) { return; }
    oculto.value = (prov && prov.value === 'BC') ? 'bc' : (prov && prov.value ? 'ca' : '');
  }

  /* El duo puede seguir existiendo en las variantes antiguas del carrusel,
     que no se tocan. Ahi se mantiene tal cual. */
  seccion.querySelectorAll('.duo__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      seccion.querySelectorAll('.duo__btn').forEach(function (o) {
        var activa = o === b;
        o.classList.toggle('is-elegida', activa);
        o.setAttribute('aria-checked', String(activa));
      });
      $('#c-province').value = b.dataset.prov;
      refrescarPerfil();
    });
  });

  // Cada cambio en un campo actualiza el panel derecho al momento
  ['#c-sector', '#c-province', '#c-type', '#c-area', '#c-spend', '#c-sites'].forEach(function (sel) {
    var el = $(sel);
    if (!el) { return; }
    el.addEventListener('change', refrescarPerfil);
    el.addEventListener('input', refrescarPerfil);
  });

  /* Al cambiar de sector se rehace la lista de tipos: cada sector ve solo
     los suyos. */
  (function () {
    var sec = $('#c-sector');
    if (!sec) { return; }
    sec.addEventListener('change', function () {
      pintarTipos(sec.value);
      refrescarPerfil();

      /* El sector decide el camino del formulario del final: un
         ayuntamiento no recibe benchmark, asi que su formulario es otro.
         Se avisa por evento porque SECTORES y ponerCamino viven en
         ambitos distintos. */
      var cfg = SECTORES[sec.value];
      var camino = (cfg && cfg.sinBenchmark) ? 'municipal' : 'cualificado';
      seccion.dispatchEvent(new CustomEvent('rede:camino', { detail: camino }));
    });
  }());


  /* --- Separadores de millar mientras se escribe --------------------------

     Superficie y gasto llegan a las centenas de miles: sin comas, revisar
     lo que uno mismo ha escrito es incomodo --1850000 frente a 1,850,000--.

     Solo esos dos campos. El numero de sitios y los telefonos se quedan en
     crudo: son cifras cortas y agrupar un telefono lo estropea.

     DOS REGLAS que hacen que esto funcione:

     1. El caret se lee en la PRIMERA linea, antes de tocar nada. Asignar
        .value destruye la seleccion del campo, asi que cualquier lectura
        posterior devuelve 0 o el final. Fue justo el fallo de la primera
        version: el cursor saltaba al final al escribir en medio.

     2. Se ancla por NUMERO DE DIGITOS a la izquierda, no por posicion de
        caracter: al reagrupar cambian las comas y un indice absoluto deja
        de valer.

     numero() ya limpia las comas antes de calcular, asi que esto no toca el
     resultado, solo lo que se ve. */

  function digitosDe(texto) {
    return String(texto).replace(/[^0-9]/g, '');
  }

  function agrupar(digitos) {
    if (!digitos) { return ''; }
    /* Un "007" escrito por error queda en "7", pero un cero solo se
       respeta. */
    digitos = digitos.replace(/^0+(?=[0-9])/, '');
    return digitos.replace(/\B(?=([0-9]{3})+(?![0-9]))/g, ',');
  }

  function esDigito(codigo) {
    return codigo >= 48 && codigo <= 57;
  }

  function digitosHasta(texto, pos) {
    var n = 0;
    for (var i = 0; i < pos && i < texto.length; i++) {
      if (esDigito(texto.charCodeAt(i))) { n++; }
    }
    return n;
  }

  function trasDigitos(texto, n) {
    if (n <= 0) { return 0; }
    var vistos = 0;
    for (var i = 0; i < texto.length; i++) {
      if (esDigito(texto.charCodeAt(i))) {
        vistos++;
        if (vistos === n) { return i + 1; }
      }
    }
    return texto.length;
  }

  function conectarMiles(campo) {
    campo.addEventListener('input', function (ev) {
      /* Lo primero, antes de escribir nada. */
      var antes = campo.value;
      var caret = campo.selectionStart;
      if (caret === null || caret === undefined) { caret = antes.length; }

      var tipo = ev.inputType || '';
      var digitos = digitosDe(antes);
      var izquierda = digitosHasta(antes, caret);

      /* Borrar con el cursor pegado a una coma: el navegador se lleva la
         coma, no un digito. Como las comas se regeneran solas, la tecla no
         haria nada y el campo pareceria congelado. Se consume ademas el
         digito de al lado. */
      if (tipo === 'deleteContentBackward' &&
          antes.charAt(caret) === ',' && izquierda > 0) {
        digitos = digitos.slice(0, izquierda - 1) + digitos.slice(izquierda);
        izquierda = izquierda - 1;
      }

      if (tipo === 'deleteContentForward' && antes.charAt(caret - 1) === ',') {
        digitos = digitos.slice(0, izquierda) + digitos.slice(izquierda + 1);
      }

      var texto = agrupar(digitos);
      if (texto === antes) { return; }

      var total = digitosDe(texto).length;
      if (izquierda > total) { izquierda = total; }

      campo.value = texto;

      /* En JS a secas setSelectionRange es sincrono: no hace falta diferir
         con setTimeout ni requestAnimationFrame --eso viene de React y aqui
         solo provoca un parpadeo del caret al final--. Solo se recoloca si
         el campo tiene el foco: si no, no hay cursor que conservar. */
      if (document.activeElement !== campo) { return; }
      var destino = trasDigitos(texto, izquierda);
      campo.setSelectionRange(destino, destino);
    });

    /* Safari rellena con autofill sin disparar un `input` fiable, asi que
       se reformatea tambien al salir del campo. */
    campo.addEventListener('change', function () {
      var texto = agrupar(digitosDe(campo.value));
      if (texto !== campo.value) { campo.value = texto; }
    });
  }

  ['#c-area', '#c-spend'].forEach(function (sel) {
    var el = $(sel);
    if (!el) { return; }
    /* inputmode y no type=number: con type=number el navegador rechaza las
       comas, saca una ruedecilla que aqui no pinta nada, y ademas
       selectionStart devuelve null --Firefox-- o lanza error --Chrome--,
       que dejaria sin efecto todo lo de arriba. */
    el.setAttribute('inputmode', 'numeric');
    conectarMiles(el);
  });


  /* --- Utilidades --------------------------------------------------------- */

  /* Un numero a partir de lo que haya escrito el visitante.

     LISTA BLANCA, no lista negra: en vez de ir quitando lo que parece
     peligroso --que siempre deja algo fuera-- se exige que lo que queda sea
     un numero entero o decimal y nada mas. Cualquier otra cosa vale 0.

     La version anterior borraba todo salvo digitos y puntos, y eso convertia
     "1e99" en 199, "${7*7}" en 77 y "-500000" en 500000: un negativo colado
     como positivo. Tambien dejaba pasar "1.2.3", que Number() vuelve NaN.

     El tope de mil millones evita que pegar veinte digitos produzca un
     ahorro de billones que nadie puede defender ante un cliente. */
  var TOPE = 1e9;
  var SOLO_NUMERO = /^\d+(?:\.\d+)?$/;

  function numero(valor) {
    if (valor === null || valor === undefined) { return 0; }

    /* Se quitan solo los separadores que una persona escribe de forma
       natural --espacios y comas de millar-- y el simbolo de moneda. Nada
       mas: si despues de eso no queda un numero limpio, se rechaza entero
       en lugar de rescatar un trozo. */
    var limpio = String(valor).replace(/[\s,$]/g, '');
    if (!limpio || !SOLO_NUMERO.test(limpio)) { return 0; }

    var n = Number(limpio);
    if (!isFinite(n) || n < 0) { return 0; }
    return n > TOPE ? TOPE : n;
  }

  function dinero(n) {
    if (!isFinite(n) || n <= 0) { return '$0'; }
    return '$' + Math.round(n).toLocaleString('en-CA');
  }

  /* --- El calculo --------------------------------------------------------- */

  function calcular() {
    var clave = selTipo.value || 'other';
    var b = BENCHMARKS[clave] || BENCHMARKS.other;

    var area   = numero($('#c-area').value);
    var gasto  = numero($('#c-spend').value);
    var sitios = numero($('#c-sites').value) || (estado.scope === 'single' ? 1 : 2);

    // Si no indica gasto, se estima con el coste por pie cuadrado del benchmark
    var gastoFinal = gasto || (area ? area * b.costPerFt2 : 0);
    var oportunidad = gastoFinal * (b.savingsPct / 100);

    /* Sin superficie ni gasto no hay nada que calcular. Mostrar "$0" haria
       dudar del metodo, asi que se pide el dato que falta. */
    var hayDatos = gastoFinal > 0;

    $('#cifra').textContent = hayDatos ? dinero(oportunidad) : 'Add your area';
    $('#cifra').classList.toggle('es-incompleto', !hayDatos);
    $('#etiqueta-tipo').textContent = b.label;
    $('#d-tipo').textContent = b.label;
    $('#d-pct').textContent = b.savingsPct.toFixed(1) + ' per cent';
    $('#d-payback').textContent = b.payback + ' years';

    $('#cifra-nota').textContent = !hayDatos
      ? 'Enter your total area or annual utility spend and we will estimate the opportunity.'
      : (gasto
        ? 'in annual opportunity, based on your entered utility spend'
        : 'in annual opportunity, estimated from historical cost per square foot');

    // La recomendacion depende del alcance
    var unaSola = estado.scope === 'single' || sitios <= 1;

    if (unaSola) {
      $('#rec-titulo').textContent = 'Recommended next step: Site Investigation';
      $('#rec-texto').textContent =
        'Because this is one building, the clearest next step is a focused review ' +
        'of utility evidence, benchmark context, and building operation.';
      $('#rec-boton').textContent = 'See Site Investigation';
      $('#dorso-titulo').textContent = 'Site Investigation';
    } else {
      $('#rec-titulo').textContent = 'Recommended next step: Energy Gap Analysis';
      $('#rec-texto').textContent =
        'Because this is a portfolio, start with an Energy Gap Analysis. It compares ' +
        'buildings, identifies outliers, and shows which sites deserve attention first.';
      $('#rec-boton').textContent = 'See the EGA path';
      $('#dorso-titulo').textContent = 'Energy Gap Analysis';
    }

    // Guardar el contexto para HubSpot
    var form = seccion.querySelector('[data-hubspot]');
    if (form) {
      var datos = {
        scope: estado.scope || 'multi',
        sector: $('#c-sector').value,
        province: $('#c-province').value,
        building_type: clave,
        area: area || '',
        annual_spend: gastoFinal ? Math.round(gastoFinal) : '',
        sites: sitios,
        benchmark_opportunity: oportunidad ? Math.round(oportunidad) : ''
      };
      Object.keys(datos).forEach(function (k) {
        var campo = form.querySelector('[name="' + k + '"]');
        if (campo) { campo.value = datos[k]; }
      });
    }

    // El resultado pasa a la IZQUIERDA, donde estaban las preguntas.

    /* La misma guardia que en calcular(): sin area ni gasto no hay nada que
       calcular, y un "$0" en grande le dice al cliente que no tiene nada que
       ahorrar --justo lo contrario de lo que la seccion afirma--. Aqui
       faltaba, asi que el cierre mostraba $0 mientras el paso anterior
       mostraba "Add your area". */
    var hayCierre = gastoFinal > 0;

    $('#cierre-cifra').textContent = hayCierre ? dinero(oportunidad) : 'Add your area';
    $('#cierre-cifra').classList.toggle('es-incompleto', !hayCierre);
    $('#cierre-nota').textContent = !hayCierre
      ? 'Enter your total area or annual utility spend and we will estimate the opportunity.'
      : (gasto
        ? 'in annual opportunity, based on your entered utility spend'
        : 'in annual opportunity, estimated from historical cost per square foot');
    $('#c-d-tipo').textContent = b.label;
    $('#c-d-pct').textContent = b.savingsPct.toFixed(1) + ' per cent';
    $('#c-d-payback').textContent = b.payback + ' years';
    $('#c-rec-titulo').textContent = $('#rec-titulo').textContent;
    $('#c-rec-texto').textContent = $('#rec-texto').textContent;

    /* Dos salidas (14/9/2026). Sin superficie ni gasto no hay nada que
       estimar, y ensenar el benchmark y la recomendacion junto a un "Add
       your area" le daba al visitante una ficha tecnica que no le
       correspondia. Cuando no hay datos se ofrece la conversacion, que es
       la salida honesta: el dato que falta puede no estar a mano. */
    var consulta = $('#cierre-consulta');
    $('#pasos').hidden = true;
    $('#cierre').hidden = !hayCierre;
    if (consulta) {
      consulta.hidden = hayCierre;
      /* La recomendacion --EGA o Site Investigation-- si vale en las dos:
         depende del ambito, no de las cifras. */
      var ccT = $('#cc-rec-titulo');
      var ccX = $('#cc-rec-texto');
      if (ccT) { ccT.textContent = $('#rec-titulo').textContent; }
      if (ccX) { ccX.textContent = $('#rec-texto').textContent; }
    }

    // Y la DERECHA pasa a ser el formulario, sin tener que girar la tarjeta.
    if (flip) { flip.classList.add('girada'); marcarInerte(true); }
  }

  /* --- Reiniciar ---------------------------------------------------------- */

  /* La rutina se extrae a una funcion porque ahora la usan DOS botones:

       #btn-reiniciar     el de siempre, dentro de .tras-envio, que solo
                          aparece despues de mandar el formulario
       [data-volver-inicio]  el nuevo, en la pantalla de consulta

     El segundo hace falta porque quien responde "no" al filtro de 25.000
     pies llega a esa pantalla en un clic, saltandose los nueve pasos, y
     hasta ahora no tenia forma de volver sin recargar la pagina.

     Duplicar el cuerpo habria sido peor: son veinte lineas que tocan
     nueve elementos, y la siguiente vez que cambie un campo habria que
     acordarse de tocar los dos sitios. */
  function volverAlInicio() {
      estado.paso = 1;
      estado.scope = '';

      ['#c-area', '#c-spend', '#c-sites'].forEach(function (sel) {
        var el = $(sel); if (el) { el.value = ''; }
      });
      $('#c-sector').value = '';
      $('#c-province').value = '';
      selTipo.value = 'school';

      seccion.querySelectorAll('.opcion').forEach(function (o) {
        o.classList.remove('is-elegida');
      });
      seccion.querySelectorAll('.perfil__fila').forEach(function (f) {
        f.classList.remove('is-lleno');
        f.querySelector('.perfil__valor').textContent = '-';
        /* Y se ocultan: al empezar de nuevo no hay ninguna respuesta que
           ensenar, y el panel debe arrancar vacio igual que la primera
           vez. Cada una reaparece cuando ponerFila() la llene.

           Antes aqui se hacia `f.hidden = false` porque las filas vivian
           siempre visibles y lo unico que las escondia era el plegado de
           elegibilidad. */
        f.hidden = true;
      });
      var resumenEleg = seccion.querySelector('#eleg-resumen');
      if (resumenEleg) { resumenEleg.hidden = true; }

      $('#adelanto').hidden = true;
      $('#prueba').hidden = false;
      $('#salida').hidden = true;
      $('#espera').hidden = false;
      $('#cierre').hidden = true;
      $('#cierre-extra').hidden = true;
      var cc = $('#cierre-consulta');
      if (cc) { cc.hidden = true; }
      $('#pasos').hidden = false;

      if (flip) { flip.classList.remove('girada', 'enviado'); }
      pintarPaso();
  }

  var btnReiniciar = $('#btn-reiniciar');
  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', volverAlInicio);
  }

  /* El de la pantalla de consulta. Ademas de reiniciar, borra la respuesta
     del filtro de tamano: sin esto el usuario volveria al paso 1 con el
     "no" todavia marcado y al pulsar Continue caeria otra vez en la misma
     pantalla, que es un bucle. */
  var btnVolver = seccion.querySelector('[data-volver-inicio]');
  if (btnVolver) {
    btnVolver.addEventListener('click', function () {
      estado.tamano = '';
      volverAlInicio();
    });
  }

  /* --- Giro de la tarjeta ------------------------------------------------- */

  var flip = seccion.querySelector('[data-flip-panel]');
  if (!flip) { return; }

  var caraFrente = flip.querySelector('.flip__cara--frente');
  var caraDorso  = flip.querySelector('.flip__cara--dorso');
  var btnAbrir   = flip.querySelector('[data-flip="abrir"]');
  var btnCerrar  = flip.querySelector('[data-flip="cerrar"]');   // puede no existir

  /* La cara oculta se marca inerte: fuera del recorrido de teclado y de los
     lectores de pantalla. Se usa inert y no visibility, porque esa propiedad
     conmuta de golpe y produce un parpadeo a mitad del giro. */
  function marcarInerte(girada) {
    if (caraDorso)  { caraDorso.inert  = !girada; }
    if (caraFrente) { caraFrente.inert =  girada; }
  }

  function abrir() {
    flip.classList.add('girada');
    if (btnAbrir) { btnAbrir.setAttribute('aria-expanded', 'true'); }
    marcarInerte(true);
    window.setTimeout(function () { if (btnCerrar) { btnCerrar.focus(); } }, 330);
  }

  function cerrar() {
    flip.classList.remove('girada');
    if (btnAbrir) { btnAbrir.setAttribute('aria-expanded', 'false'); }
    marcarInerte(false);
    window.setTimeout(function () { if (btnAbrir) { btnAbrir.focus(); } }, 330);
  }

  if (btnAbrir)  { btnAbrir.addEventListener('click', abrir); }
  if (btnCerrar) { btnCerrar.addEventListener('click', cerrar); }

  flip.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && flip.classList.contains('girada')) { cerrar(); }
  });

  marcarInerte(false);

  /* --- Envio a HubSpot ---------------------------------------------------- */

  var form = seccion.querySelector('[data-hubspot]');
  if (!form) { return; }

  /* Lo ultimo que se envio, para el calendario de reservas. */
  var datosEnviados = {};

  /* --- LOS TRES CAMINOS DEL FORMULARIO (9/9/2026, Parte 4) ---------------

     Antes habia un solo formulario para todos, con el boton "Send me the
     deeper look". Pero ese texto solo tiene sentido cuando de verdad hay un
     analisis que mandar: un ayuntamiento no recibe benchmark, y un edificio
     descartado por tamano tampoco.

     Tres caminos, cada uno con sus campos, su boton y su mensaje:

       cualificado  K-12, postsec, salud, comercial, vivienda, otros.
                    Sale el benchmark. Se piden todos los datos porque el
                    equipo va a preparar un analisis de verdad.

       municipal    Ayuntamientos. No hay datos C-Op de parques de bomberos
                    ni de naves municipales, asi que no se puede dar una
                    cifra. Formulario ligero y propuesta de llamada.

       descartado   Edificios de menos de 25.000 pies --lo decidira la
                    pantalla 1 de la Parte 1--. Tampoco hay benchmark, pero
                    si conviene recoger el contacto.

     El consentimiento es obligatorio en los tres. */

  var CAMINOS = {
    cualificado: {
      boton: 'Send me the deeper look',
      pide: ['h-name', 'h-org', 'h-role', 'h-direct', 'h-email', 'h-phone'],
      legal: 'Only used to prepare your analysis.'
    },
    municipal: {
      boton: 'Set up a call',
      pide: ['h-name', 'h-email'],
      legal: 'Only used to arrange the call.'
    },
    descartado: {
      boton: 'Have a team member reach out',
      pide: ['h-name', 'h-email', 'h-phone', 'h-org', 'h-prov', 'h-city'],
      legal: 'Only used to get in touch.'
    }
  };

  var caminoActual = 'cualificado';

  function ponerCamino(nombre) {
    var cfg = CAMINOS[nombre];
    if (!cfg || !form) { return; }
    caminoActual = nombre;

    /* Se compara por el FINAL del id, no por el id completo: en WordPress
       cada instancia lleva un prefijo --rc1-h-name-- y una comparacion
       exacta no casaba con ninguno, dejando el formulario sin campos. */
    function pedido(id) {
      for (var i = 0; i < cfg.pide.length; i++) {
        var n = cfg.pide[i];
        if (id === n || id.slice(-(n.length + 1)) === '-' + n) { return true; }
      }
      return false;
    }

    /* Se recorren TODOS los campos del formulario y se decide uno a uno.
       Asi no hay que acordarse de ocultar lo que sobra: lo que no esta en
       la lista del camino, se va. */
    Array.prototype.forEach.call(form.querySelectorAll('.campo'), function (caja) {
      var campo = caja.querySelector('input, select, textarea');
      if (!campo || campo.type === 'hidden' || campo.type === 'checkbox') { return; }

      var visible = pedido(campo.id);
      caja.hidden = !visible;

      /* required se quita al ocultar: un campo invisible y obligatorio
         bloquea el envio sin que se pueda ver por que. El navegador ni
         siquiera puede enfocarlo para senalarlo. */
      if (visible) {
        campo.setAttribute('required', '');
        campo.removeAttribute('tabindex');
      } else {
        campo.removeAttribute('required');
        campo.value = '';
        campo.tabIndex = -1;
      }
    });

    var textoBoton = form.querySelector('[data-boton-envio]');
    if (textoBoton) { textoBoton.textContent = cfg.boton; }

    var legal = form.querySelector('.captura__legal');
    if (legal) { legal.textContent = cfg.legal; }

    form.setAttribute('data-camino', nombre);
  }

  /* Que camino corresponde segun lo elegido. De momento solo depende del
     sector; la pantalla del tamano --Parte 1-- anadira 'descartado'. */
  function caminoDe(sector) {
    var cfg = SECTORES[sector];
    if (cfg && cfg.sinBenchmark) { return 'municipal'; }
    return 'cualificado';
  }

  ponerCamino('cualificado');

  /* Lo dispara el selector de sector, mas arriba. */
  seccion.addEventListener('rede:camino', function (ev) {
    ponerCamino(ev.detail);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var datos = {};
    new FormData(form).forEach(function (v, k) { datos[k] = v; });
    /* Se guardan para prerrellenar el calendario de Meetings: quien acaba
       de dar su nombre y su correo no tiene por que escribirlos otra vez. */
    datosEnviados = datos;

    /* El texto del consentimiento se lee de la PANTALLA, no de una constante
       en el codigo: asi lo que se guarda en HubSpot es exactamente lo que
       vio la persona. Si alguien cambia el texto del HTML, lo que viaja
       cambia con el y no hay forma de que se desincronicen. */
    var elConsent = document.getElementById('texto-consentimiento');
    var textoConsent = elConsent
      ? elConsent.textContent.replace(/\s+/g, ' ').trim()
      : '';

    var btn = form.querySelector('button[type="submit"]');

    function bloquear(si) {
      if (!btn) { return; }
      btn.disabled = si;
      /* aria-busy para que un lector de pantalla anuncie la espera: sin el
         solo se oiria un boton que dejo de responder. */
      btn.setAttribute('aria-busy', si ? 'true' : 'false');
    }

    bloquear(true);

    RedeHubSpot.enviar(datos, textoConsent, function () {
      bloquear(false);
      confirmar();
    }, function (codigo, detalle) {
      bloquear(false);

      /* Se avisa en pantalla en vez de dar por bueno un envio que fallo:
         quien deja sus datos tiene que saber si han llegado. */
      var aviso = form.querySelector('.captura__fallo');
      if (!aviso) {
        aviso = document.createElement('p');
        aviso.className = 'campo__error captura__fallo';
        aviso.setAttribute('role', 'alert');
        form.insertBefore(aviso, btn);
      }
      aviso.textContent = (codigo === 429)
        ? 'Too many requests right now. Please try again in a moment.'
        : 'We could not send that. Please try again, or call us on 778.327.6851.';

      if (window.console) {
        console.warn('[Rede] HubSpot ' + codigo + ': ' + detalle);
      }
    });
  });

  /* Lo que se ve al terminar. Sale del manejador porque tambien lo usa el
     camino sin configurar. */
  function confirmar() {
    var caja = document.createElement('div');
    caja.className = 'captura--enviada';
    caja.setAttribute('role', 'status');
    caja.innerHTML =
      '<span class="tic" aria-hidden="true">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
          '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</span>' +
      '<p class="captura__titulo">Thanks. We will be in touch.</p>' +
      '<p class="captura__texto">Someone from the team will get back to you within ' +
      'one business day.</p>';

    form.replaceWith(caja);

    // Solo ahora aparecen el contacto directo y el reinicio
    var extra = $('#cierre-extra');
    if (extra) { extra.hidden = false; }

    // Respaldo para navegadores sin :has() (Safari < 15.4, Firefox antiguo)
    if (flip) { flip.classList.add('enviado'); }

    /* --- Reservar cita (Parte 6) ---------------------------------------

       Se ofrece DESPUES de enviar, como pidio el cliente: "Want to skip
       ahead? Book a time with our team."

       Solo aparece si hay enlace de Meetings configurado. Sin el, el
       boton no se pinta: mas vale no ofrecer nada que ofrecer algo que
       lleva a una pagina vacia. */
    if (!RedeHubSpot.hayMeetings()) { return; }

    var invita = document.createElement('div');
    invita.className = 'tras-envio__reserva';
    invita.innerHTML =
      '<p class="captura__texto">Want to skip ahead? Book a time with our team.</p>' +
      '<button class="btn btn--linea btn--block" type="button">Book a time</button>' +
      '<div class="reserva-zona" hidden></div>';
    caja.appendChild(invita);

    var botonR = invita.querySelector('button');
    var zonaR = invita.querySelector('.reserva-zona');

    botonR.addEventListener('click', function () {
      /* El calendario se trae solo al pulsar: es un iframe con cookies de
         terceros y no tiene por que cargarse antes de hacer falta. */
      RedeHubSpot.abrirMeetings(zonaR, datosEnviados);
      botonR.hidden = true;
    });
  }

    pintarPaso();
  });

})();
