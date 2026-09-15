/* ==========================================================================
   HUBSPOT: ENVIO DEL FORMULARIO Y RESERVA DE CITA

   Dos productos distintos de HubSpot, que se configuran por separado:

     Forms     recibe los datos del formulario. Necesita el Portal ID y el
               Form ID (un GUID con guiones).
     Meetings  el calendario de reservas. Necesita su propio enlace,
               `meetings.hubspot.com/usuario/reunion`. Tener el Portal ID NO
               basta para esto.

   Los tres datos se ponen en `window.REDE_HUBSPOT` antes de cargar este
   archivo. En WordPress los inyecta el plugin desde sus ajustes; en la
   maqueta estatica van en el propio HTML. Mientras esten vacios el
   formulario sigue funcionando: se confirma en pantalla y se avisa por
   consola, sin romper nada.

   POR QUE SE PUEDE LLAMAR DESDE EL NAVEGADOR

   El endpoint de envio no lleva credenciales. El Portal ID y el Form ID no
   son secretos --el formulario embebido de HubSpot los expone igual en el
   HTML-- asi que no hay nada que filtrar. HubSpot manda las cabeceras CORS
   correctas para este endpoint en concreto.

   Lo que NUNCA debe hacerse es usar el endpoint `/secure/`, que si lleva un
   token: eso solo va desde un servidor.

   Las API keys de HubSpot se retiraron el 30 de noviembre de 2022. Si
   alguien busca una clave para esto, no existe.

   DOS COSAS QUE HAY QUE CONFIRMAR EN LA CUENTA DEL CLIENTE

   Las dos hacen fallar el envio entero y no se ven desde aqui:

   1. Cada propiedad personalizada tiene que estar ANADIDA AL FORMULARIO en
      HubSpot, no solo creada en el CRM. Si no, la API rechaza el envio
      completo con FIELD_NOT_IN_FORM_DEFINITION.
   2. reCAPTCHA tiene que estar DESACTIVADO en ese formulario. Con el
      activo HubSpot rechaza el 100% de los envios por API
      --FORM_HAS_RECAPTCHA_ENABLED--: es incompatible con un formulario
      propio como el nuestro.
   ========================================================================== */

(function (raiz) {
  'use strict';

  var CFG = raiz.REDE_HUBSPOT || {};

  var ENVIO = 'https://api.hsforms.com/submissions/v3/integration/submit/';
  var ORIGEN_MEETINGS = 'https://meetings.hubspot.com';
  var SCRIPT_MEETINGS =
    'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';

  function configurado() {
    return !!(CFG.portalId && CFG.formId);
  }

  /* --- La cookie de HubSpot ----------------------------------------------

     `hubspotutk` vincula el envio con lo que esa persona ya habia visitado
     antes y evita crear un contacto duplicado. Solo existe si esta cargado
     el script de seguimiento, que es opcional: sin el, el envio funciona
     igual pero el contacto entra sin saber de donde vino.

     Es cookie de analitica, asi que necesita consentimiento previo. */
  function leerCookie(nombre) {
    var partes = String(document.cookie || '').split('; ');
    for (var i = 0; i < partes.length; i++) {
      var par = partes[i].split('=');
      if (par[0] === nombre) {
        return decodeURIComponent(par.slice(1).join('='));
      }
    }
    return '';
  }

  /* --- El cuerpo de la peticion ------------------------------------------ */

  function campo(nombre, valor) {
    /* objectTypeId 0-1 es el objeto Contacto. */
    return { objectTypeId: '0-1', name: nombre, value: String(valor) };
  }

  function construir(datos, textoConsentimiento) {
    var campos = [];

    Object.keys(datos).forEach(function (k) {
      var v = datos[k];
      /* Los vacios no se mandan: si esa propiedad esta marcada como
         obligatoria en HubSpot, un valor vacio da REQUIRED_FIELD y tumba el
         envio entero. Y `consent` no es una propiedad del contacto, viaja
         aparte en legalConsentOptions. */
      if (v === '' || v === null || v === undefined || k === 'consent') { return; }
      campos.push(campo(k, v));
    });

    var cuerpo = {
      submittedAt: String(new Date().getTime()),
      fields: campos,
      context: {
        pageUri: raiz.location ? raiz.location.href : '',
        pageName: document.title || ''
      }
    };

    /* Si la cookie no esta, se omite la clave ENTERA. Mandarla como cadena
       vacia da INVALID_HUTK y se pierde el envio. */
    var hutk = leerCookie('hubspotutk');
    if (hutk) { cuerpo.context.hutk = hutk; }

    /* El consentimiento. El texto tiene que ser el LITERAL que vio la
       persona: es la prueba que se guarda, y en Canada esto cae bajo CASL.
       Sin el texto: MISSING_PROCESSING_CONSENT_TEXT. */
    if (datos.consent && textoConsentimiento) {
      cuerpo.legalConsentOptions = {
        consent: {
          consentToProcess: true,
          text: textoConsentimiento
        }
      };
    }

    return cuerpo;
  }

  /* --- El envio ----------------------------------------------------------- */

  function enviar(datos, textoConsentimiento, alIr, alFallar) {
    if (!configurado()) {
      /* Sin configurar no se llama a nadie, pero el visitante no tiene por
         que enterarse: se le confirma igual y el aviso queda en consola
         para quien monte la web. */
      if (raiz.console) {
        raiz.console.warn('[Rede] HubSpot sin configurar: falta portalId o formId. ' +
                          'Datos que se habrian enviado:', datos);
      }
      alIr();
      return;
    }

    var url = ENVIO + CFG.portalId + '/' + CFG.formId;
    var xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) { return; }

      if (xhr.status === 200) { alIr(); return; }

      /* Un 400 es el payload mal construido: reintentar no arregla nada.
         Un 429 es exceso de peticiones --el limite son 50 cada 10s-- y ahi
         si tiene sentido esperar. */
      var detalle = '';
      try {
        var resp = JSON.parse(xhr.responseText);
        detalle = resp.message || '';
        if (resp.errors && resp.errors.length) {
          detalle = resp.errors[0].message || detalle;
        }
      } catch (e) { detalle = 'respuesta ilegible'; }

      alFallar(xhr.status, detalle);
    };

    xhr.onerror = function () { alFallar(0, 'fallo de red'); };
    xhr.send(JSON.stringify(construir(datos, textoConsentimiento)));
  }

  /* --- Meetings: el calendario de reservas --------------------------------

     Se carga BAJO DEMANDA, solo cuando alguien pulsa el boton. En la carga
     de la pagina no hace falta: la reserva llega despues de enviar el
     formulario, y el script trae un iframe con sus cookies de terceros. */

  var scriptPedido = false;

  function conParametro(url, clave, valor) {
    if (!valor) { return url; }
    var sep = (url.indexOf('?') === -1) ? '?' : '&';
    /* Codificar es obligatorio: la arroba de un correo sin codificar parte
       la direccion. */
    return url + sep + clave + '=' + encodeURIComponent(valor);
  }

  function urlMeetings(datos) {
    var url = CFG.meetingsUrl + '?embed=true';
    url = conParametro(url, 'firstName', datos.firstname);
    url = conParametro(url, 'email', datos.email);
    return url;
  }

  function abrirMeetings(zona, datos) {
    if (!CFG.meetingsUrl || !zona) { return false; }

    /* El contenedor tiene que existir ANTES de cargar el script: el guion
       de HubSpot recorre los `.meetings-iframe-container` al ejecutarse, y
       lo que llegue despues no lo ve. */
    var caja = document.createElement('div');
    caja.className = 'meetings-iframe-container';
    caja.setAttribute('data-src', urlMeetings(datos || {}));
    zona.innerHTML = '';
    zona.appendChild(caja);
    zona.hidden = false;

    if (scriptPedido) { return true; }
    scriptPedido = true;

    var sc = document.createElement('script');
    sc.type = 'text/javascript';
    sc.async = true;
    sc.src = SCRIPT_MEETINGS;
    document.body.appendChild(sc);
    return true;
  }

  /* Avisa cuando alguien termina de reservar. */
  function alReservar(fn) {
    if (!raiz.addEventListener) { return; }
    raiz.addEventListener('message', function (ev) {
      /* Comprobar el origen es obligatorio: sin esta linea cualquier otro
         iframe de la pagina podria fingir una reserva. */
      if (ev.origin !== ORIGEN_MEETINGS) { return; }
      if (ev.data && ev.data.meetingBookSucceeded) { fn(); }
    }, false);
  }

  raiz.RedeHubSpot = {
    configurado: configurado,
    hayMeetings: function () { return !!CFG.meetingsUrl; },
    enviar: enviar,
    abrirMeetings: abrirMeetings,
    alReservar: alReservar
  };
}(window));
