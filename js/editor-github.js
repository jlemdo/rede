/* ==========================================================================
   GUARDADO EN GITHUB

   Escribe el JSON de textos directamente en el repositorio. La web queda
   actualizada para todos en cuanto GitHub Pages republica, aproximadamente
   un minuto.

   El token se pide UNA vez y vive solo en este navegador (localStorage).
   Nunca entra en el codigo ni se sube al repositorio.

   Archivo TEMPORAL: desaparece al pasar a WordPress.
   ========================================================================== */

(function () {
  'use strict';

  var REPO = 'jlemdo/rede-hero-preview';
  var RUTA = 'data/textos.json';
  var RAMA = 'main';

  var LLAVE_TOKEN = 'rede-gh-token';
  var ALMACEN = 'rede-textos';

  window.RedeGitHub = {

    hayToken: function () {
      return !!localStorage.getItem(LLAVE_TOKEN);
    },

    pedirToken: function () {
      var actual = localStorage.getItem(LLAVE_TOKEN) || '';
      var t = window.prompt(
        'Paste your GitHub token.\n\n' +
        'It is stored only in this browser and never leaves it.\n' +
        'Leave empty to remove it.',
        actual ? '(a token is already saved)' : ''
      );

      if (t === null) { return false; }

      t = t.trim();

      if (!t || t === '(a token is already saved)') {
        if (!t) { localStorage.removeItem(LLAVE_TOKEN); }
        return false;
      }

      localStorage.setItem(LLAVE_TOKEN, t);
      return true;
    },

    /* --- Leer el JSON que ya esta en el repositorio --------------------- */

    descargar: function () {
      var url = 'https://api.github.com/repos/' + REPO + '/contents/' + RUTA +
                '?ref=' + RAMA + '&t=' + Date.now();

      return fetch(url, { headers: cabeceras() })
        .then(function (r) {
          if (r.status === 404) { return { datos: {}, sha: null }; }
          if (r.status === 401 || r.status === 403) {
            throw new Error('token-invalido');
          }
          if (!r.ok) { throw new Error('GitHub respondio ' + r.status); }
          return r.json().then(function (j) {
            var texto = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ''))));
            return { datos: JSON.parse(texto), sha: j.sha };
          });
        });
    },

    /* --- Escribir el JSON en el repositorio ----------------------------- */

    publicar: function (datos) {
      if (!this.hayToken()) {
        return Promise.reject(new Error('sin-token'));
      }

      // Hay que enviar el sha actual, o GitHub rechaza la escritura
      return this.descargar().then(function (previo) {
        var contenido = btoa(unescape(encodeURIComponent(
          JSON.stringify(datos, null, 2)
        )));

        var cuerpo = {
          message: 'Actualiza textos desde el editor web',
          content: contenido,
          branch: RAMA
        };
        if (previo.sha) { cuerpo.sha = previo.sha; }

        return fetch('https://api.github.com/repos/' + REPO + '/contents/' + RUTA, {
          method: 'PUT',
          headers: cabeceras(),
          body: JSON.stringify(cuerpo)
        });
      }).then(function (r) {
        if (r.status === 401 || r.status === 403) {
          throw new Error('token-invalido');
        }
        if (!r.ok) {
          return r.json().then(function (j) {
            throw new Error(j.message || ('GitHub respondio ' + r.status));
          });
        }
        return true;
      });
    }
  };

  function cabeceras() {
    var h = {
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
    var t = localStorage.getItem(LLAVE_TOKEN);
    if (t) { h.Authorization = 'Bearer ' + t; }
    return h;
  }

  /* --- Cargar los textos publicados -----------------------------------------
     Esto corre en TODAS las visitas, tambien sin modo edicion. Es lo que hace
     que los cambios se vean para todo el mundo.

     Se lee el archivo directo, sin la API, para no gastar cuota ni necesitar
     token en las visitas normales. */

  window.RedeTextos = (function () {
    // Safari bloquea fetch sobre file:// por politica de seguridad. En un
    // servidor no ocurre, pero al abrir el HTML localmente hay que evitarlo
    // o deja un error en consola.
    if (window.location.protocol === 'file:') {
      return Promise.resolve({});
    }

    return fetch('data/textos.json?t=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  })();

})();
