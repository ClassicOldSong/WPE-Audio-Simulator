(function () {
'use strict';

function __$styleInject(css, returnValue) {
  if (typeof document === 'undefined') {
    return returnValue;
  }
  css = css || '';
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
  return returnValue;
}
var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var loglevel = createCommonjsModule(function (module) {
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(definition);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.log = definition();
    }
}(commonjsGlobal, function () {
    "use strict";
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // these private functions always need `this` to be set properly

    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    function replaceLoggingMethods(level, loggerName) {
        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this[methodName] = (i < level) ?
                noop :
                this.methodFactory(methodName, level, loggerName);
        }
    }

    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public API
       *
       */

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Package-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    return defaultLogger;
}));
});

var appName = '[' + "K-Egg" + ']';
var log = console.log.bind(null, appName);
var trace = loglevel.trace.bind(null, appName);
var debug = loglevel.debug.bind(null, appName);
var info = loglevel.info.bind(null, appName);
var warn = loglevel.warn.bind(null, appName);
var error = loglevel.error.bind(null, appName);

{
	loglevel.setLevel('trace');
}

info('Debug logging enabled!');

var content = "<canvas class=\"egg\"></canvas>\n";

var img = new Image();img.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTkyMCIKICAgaGVpZ2h0PSIxMDgwIgogICB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIgogICBpZD0ic3ZnMiIKICAgdmVyc2lvbj0iMS4xIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkxIHIxMzcyNSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZWdnLWJnLnN2ZyIKICAgaW5rc2NhcGU6ZXhwb3J0LWZpbGVuYW1lPSIvbWVkaWEveXVraW5vL0RvY3VtZW50cy9Xb3Jrcy9QYWludHMvV2FsbHBhcGVycy9LYXJhc2FtYUVnZy5wbmUiCiAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSI5MCIKICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjkwIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzNCIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjNGY1MTc4IgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjAuMzUzNTUzMzkiCiAgICAgaW5rc2NhcGU6Y3g9IjQzNy40MzQyOSIKICAgICBpbmtzY2FwZTpjeT0iMzMzLjA1NTY1IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIHVuaXRzPSJweCIKICAgICBib3JkZXJsYXllcj0iZmFsc2UiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9InRydWUiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwNTIiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjU5NSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIHNob3dndWlkZXM9InRydWUiCiAgICAgaW5rc2NhcGU6Z3VpZGUtYmJveD0idHJ1ZSI+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSI5NjAsMTE3Ni41IgogICAgICAgb3JpZW50YXRpb249IjEsMCIKICAgICAgIGlkPSJndWlkZTQxNTAiIC8+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSItMTI1NS4xODc1LDU0MCIKICAgICAgIG9yaWVudGF0aW9uPSIwLDEiCiAgICAgICBpZD0iZ3VpZGU0MTUyIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTciPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaW5rc2NhcGU6bGFiZWw9IkxheWVyIDEiCiAgICAgaW5rc2NhcGU6Z3JvdXBtb2RlPSJsYXllciIKICAgICBpZD0ibGF5ZXIxIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjcuNjM3ODA4KSI+CiAgICA8ZwogICAgICAgaWQ9Imc1NTE2IgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC45MTQ4NDY3MywwLDAsMC45MTQ4NDY3Myw5NC40Mjg4Myw5MS4xMDY1NjQpIj4KICAgICAgPHBhdGgKICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjc3NjY3Nzc3Nzc3NjYyIKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgZD0ibSAxMzI5LjkxMTcsNjQwLjYxOTczIGMgNjAuODY2Miw0OC4zMTAzMSA0OS45OTU3LDExNi4wMTA1NyAtMS4wNjE0LDE0MC42NTg4MiAtNy4yNSwzLjUgLTQ3LjQ3NTIsMTguNjcxMDUgLTk1Ljk1NjIsOC4xOTc3MSAtMzcuNjQ0OCwtOC4xMzI0MSAtNDAuNTUzMiwtMTMuNzY1NzcgLTcxLjk4MTUsLTE0LjYwMTc2IC05LjY2MTUsMC4wOTY2IC0xNy4xODU4LDEuMTA4NiAtMjUuNTMyNywzLjk1MTUgLTQ4Ljk3NzMsMTUuOTgxMzQgLTEzNS4xNTcsMzguNzg0OTYgLTE4OS4wMDc1OCwzOC43ODQ5NiAtMTEwLjEzMDgyLDAgLTIyMC4xMjMzLC0zNS4zMjA3NSAtMjk3Ljk5NzU1LC05OC4xOTIwOSAtNzcuODc0MjUsLTYyLjg3MTM1IC0xMjEuNjIzNTUsLTE0OC4xNDMxOSAtMTIxLjYyMzU1LC0yMzcuMDU2NjkgMCwtODguOTEzNSA0My43NDkzLC0xNzQuMTg1MzQgMTIxLjYyMzU1LC0yMzcuMDU2NjggNzcuODc0MjYsLTYyLjg3MTM1IDE4Ny44NjY3MywtOTguMTkyMSAyOTcuOTk3NTUsLTk4LjE5MjEgMTEwLjEzMDc4LDAgMjExLjM3ODY4LDM1LjMyMDc1IDI4OS4yNTI4OCw5OC4xOTIwOSA3Ny44NzQzLDYyLjg3MTM0IDEyMS42MjM2LDE0OC4xNDMxOCAxMjEuNjIzNiwyMzcuMDU2NjkgMCw1Mi40MzA5IC00LjYyNzEsNjkuODA2OTIgLTMzLjA3OTMsMTE1Ljg1ODcxIC05LjQ0OTcsMTguMTE1MjcgLTcuMjI0LDMyLjAwOTc1IDUuNzQyMiw0Mi4zOTg4NCB6IgogICAgICAgICBzdHlsZT0iZmlsbDojZjVkOGMwO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojNGU0YzYxO3N0cm9rZS13aWR0aDozO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgICBpZD0icGF0aDQ1MjAtNSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjc3NzY3Nzc3Nzc3NjYyIKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgZD0ibSAxMzI3Ljk1NTUsNjQxLjA0MDA1IGMgNTQuNDg1MSw0Mi40NzIxOCA1MC4yNDI4LDk3LjY4MzM0IC0xLjYzNTUsMTIxLjIzODUxIC03LjI5ODcsMy4zMTM5MyAtNDcuMjIyMiwxNi40ODQ4OSAtOTUuNDQ1LDYuMDExNTUgLTM3LjQ0NDIsLTguMTMyNDEgLTUxLjcwMiwtMTguNDE1NzMgLTc1LjMwMDcsLTE2Ljg5MTQgLTUuMTQ4NiwwLjMzMjU3IC0xMC41MDk3LDAuNzIyMTMgLTEzLjk0MywyLjAyODkgLTQ4LjcxNjQsMTUuOTgxMzQgLTE0Mi4xNjQ2OCw0Mi45OTcyIC0xOTUuNzI4NDMsNDIuOTk3MiAtMTA5LjU0NDEzLDAgLTIyNS45NTI3NywtNDUuMjEyNTUgLTI5Ni40MzMzNCwtOTYuMDA1OTMgQyA1NzUuNjY2MSw2NDcuMjMwODEgNTI4LjQ5Mzg5LDU0Mi41MTgxMiA1MjguNDkzODksNDgzLjM2MjE5IGMgMCwtODguOTEzNSA0My41MTYyNCwtMTc0LjE4NTM0IDEyMC45NzU2NCwtMjM3LjA1NjY3IDc3LjQ1OTQsLTYyLjg3MTM1IDE4Ni44ODkyMSwtOTguMTkyMSAyOTYuNDMzMzQsLTk4LjE5MjEgMTA5LjU0NDEzLDAgMjEwLjIyOTMzLDM1LjMyMDc1IDI4Ny42ODg3Myw5OC4xOTIwOSA3Ny40NTk0LDYyLjg3MTMzIDEyMC45NzU3LDE0OC4xNDMxNyAxMjAuOTc1NywyMzcuMDU2NjggMCw1Mi40MzA5IC0xMC42MTQ0LDUzLjYzMjcgLTM4LjkxNSw5OS42ODQ0OSAtMTAuOTc0MiwyNC42MDg5MSAtOC44MjI4LDM4LjUzODUyIDEyLjMwMzIsNTcuOTkzMzcgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6I2YzZjFlNTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgaWQ9InBhdGg0NTIwLTUtMyIgLz4KICAgIDwvZz4KICAgIDxnCiAgICAgICBpZD0iZzU1MTIiCiAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjkxNDg0NjczLDAsMCwwLjkxNDg0NjczLDg4LjU5OTEzLDc5Ljc4Nzc5MSkiPgogICAgICA8ZWxsaXBzZQogICAgICAgICByeT0iNDguNDE4OTIyIgogICAgICAgICByeD0iNTIuNjYxNTY0IgogICAgICAgICBjeT0iODA4LjMwNjI3IgogICAgICAgICBjeD0iMTQyOS4wNTkyIgogICAgICAgICBpZD0icGF0aDQ1MjAiCiAgICAgICAgIHN0eWxlPSJmaWxsOiNmNWQ4YzA7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjM7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0ic3Nzc3MiCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIGlkPSJwYXRoNDUyMC01NiIKICAgICAgICAgZD0ibSAxNDc5LjMwOCw4MDYuOTc2MzYgYyAwLDI1LjI1MTEzIC0yMi40ODkyLDMxLjQzNDI0IC01MC4yMzA5LDMxLjQzNDIyIC0yNy43NDE3LDJlLTUgLTUwLjIzMDksLTYuMTgzMDkgLTUwLjIzMDksLTMxLjQzNDIyIDAsLTI1LjI1MTEyIDIyLjQ4OTIsLTQ1LjcyMTIgNTAuMjMwOSwtNDUuNzIxMTggMjcuNzQxNywtMmUtNSA1MC4yMzA5LDIwLjQ3MDA2IDUwLjIzMDksNDUuNzIxMTggeiIKICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOiNmM2YxZTU7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjA7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K';

var img$1 = new Image();img$1.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTkyMCIKICAgaGVpZ2h0PSIxMDgwIgogICB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIgogICBpZD0ic3ZnMiIKICAgdmVyc2lvbj0iMS4xIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkxIHIxMzcyNSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZWdnLWNvcmUuc3ZnIgogICBpbmtzY2FwZTpleHBvcnQtZmlsZW5hbWU9Ii9tZWRpYS95dWtpbm8vRG9jdW1lbnRzL1dvcmtzL1BhaW50cy9XYWxscGFwZXJzL0thcmFzYW1hRWdnLnBuZSIKICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjkwIgogICBpbmtzY2FwZTpleHBvcnQteWRwaT0iOTAiPgogIDxkZWZzCiAgICAgaWQ9ImRlZnM0Ij4KICAgIDxmaWx0ZXIKICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyIKICAgICAgIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiIKICAgICAgIGlkPSJmaWx0ZXI1NDYzIgogICAgICAgeD0iLTAuMTgwMTI3NiIKICAgICAgIHdpZHRoPSIxLjM2MDI1NTIiCiAgICAgICB5PSItMC4xODAxMjc2IgogICAgICAgaGVpZ2h0PSIxLjM2MDI1NTIiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIKICAgICAgICAgaW5rc2NhcGU6Y29sbGVjdD0iYWx3YXlzIgogICAgICAgICBzdGREZXZpYXRpb249IjE4LjQxNzI4NSIKICAgICAgICAgaWQ9ImZlR2F1c3NpYW5CbHVyNTQ2NSIgLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjNGY1MTc4IgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjAuMzUzNTUzMzkiCiAgICAgaW5rc2NhcGU6Y3g9IjQzNy40MzQyOSIKICAgICBpbmtzY2FwZTpjeT0iMzMzLjA1NTY1IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIHVuaXRzPSJweCIKICAgICBib3JkZXJsYXllcj0iZmFsc2UiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9InRydWUiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwNTIiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjU5NSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIHNob3dndWlkZXM9InRydWUiCiAgICAgaW5rc2NhcGU6Z3VpZGUtYmJveD0idHJ1ZSI+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSI5NjAsMTE3Ni41IgogICAgICAgb3JpZW50YXRpb249IjEsMCIKICAgICAgIGlkPSJndWlkZTQxNTAiIC8+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSItMTI1NS4xODc1LDU0MCIKICAgICAgIG9yaWVudGF0aW9uPSIwLDEiCiAgICAgICBpZD0iZ3VpZGU0MTUyIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTciPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaW5rc2NhcGU6bGFiZWw9IkxheWVyIDEiCiAgICAgaW5rc2NhcGU6Z3JvdXBtb2RlPSJsYXllciIKICAgICBpZD0ibGF5ZXIxIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjcuNjM3ODA4KSI+CiAgICA8ZwogICAgICAgaWQ9Imc1NDk2IgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC45MTQ4NDY3MywwLDAsMC45MTQ4NDY3Myw4Ny42ODQyOSw1OS40ODE1MDkpIgogICAgICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjkwIgogICAgICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjkwIj4KICAgICAgPGcKICAgICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIyLDgpIgogICAgICAgICBpZD0iZzUyMTAiPgogICAgICAgIDxjaXJjbGUKICAgICAgICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6I2ZmYjQzZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgICBpZD0icGF0aDQ1ODMiCiAgICAgICAgICAgY3g9Ijk3NSIKICAgICAgICAgICBjeT0iNDcxLjM2MjE4IgogICAgICAgICAgIHI9IjE2MyIgLz4KICAgICAgICA8cGF0aAogICAgICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0ic3Nzc3MiCiAgICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgICBpZD0icGF0aDQ1ODMtMiIKICAgICAgICAgICBkPSJtIDExMzgsNDcxLjM2MjE4IGMgMCw5MC4wMjI0MSAtNzIuOTc3NiwxMzcgLTE2MywxMzcgLTkwLjAyMjQxLDAgLTE2MywtNDYuOTc3NTkgLTE2MywtMTM3IDAsLTkwLjAyMjQxIDcyLjk3NzU5LC0xNjMgMTYzLC0xNjMgOTAuMDIyNCwwIDE2Myw3Mi45Nzc1OSAxNjMsMTYzIHoiCiAgICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOiNmMWQ2NjE7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjA7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICAgIDwvZz4KICAgICAgPGcKICAgICAgICAgaWQ9Imc1NDkwIj4KICAgICAgICA8Y2lyY2xlCiAgICAgICAgICAgcj0iMTIyLjY5NDkyIgogICAgICAgICAgIGN5PSI0NjYuMTcwNjUiCiAgICAgICAgICAgY3g9Ijk3NS4xMDAyOCIKICAgICAgICAgICBpZD0icGF0aDQ1ODMtMCIKICAgICAgICAgICBzdHlsZT0ib3BhY2l0eTowLjU0MDAwMDA1O2ZpbGw6I2ZmYjQzZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MTtmaWx0ZXI6dXJsKCNmaWx0ZXI1NDYzKSIKICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgxLjI3MTIwNzgsMCwwLDEuMTc4OTk3OCwtMjg2LjQ1NDg0LC03NS40NDM1MDUpIiAvPgogICAgICAgIDxnCiAgICAgICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC45NjI4MTkxMSwtMC4yNzAxNDY5NCwwLjI3MDE0Njk0LDAuOTYyODE5MTEsMzIyLjU4MzcyLC04Ljg1MDk5ODkpIgogICAgICAgICAgIGlkPSJnNTIxMC05IgogICAgICAgICAgIGlua3NjYXBlOnRyYW5zZm9ybS1jZW50ZXIteD0iOS41NzUzNTk4IgogICAgICAgICAgIGlua3NjYXBlOnRyYW5zZm9ybS1jZW50ZXIteT0iLTEwOS4wMjMxNiI+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOiNmNWUzOTM7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjA7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICAgICAgICBkPSJtIDU2Ni41MDAxNCw1MzcuMTMxNTUgYyAwLDI0LjMwNjA1IC00MC4yNTkzMSw4Ljk5IC04OS45MjE2Nyw4Ljk5IC00OS42NjIzNywwIC04OS45MjE2NywxNS4zMTYwNSAtODkuOTIxNjcsLTguOTkgMCwtMjQuMzA2MDYgNDAuMjU5MywtNDQuMDEgODkuOTIxNjcsLTQ0LjAxIDQ5LjY2MjM2LDAgODkuOTIxNjcsMTkuNzAzOTQgODkuOTIxNjcsNDQuMDEgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNDU4My0yLTYiCiAgICAgICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJzc3NzcyIgLz4KICAgICAgICAgIDxlbGxpcHNlCiAgICAgICAgICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6I2Y1ZTM5MztmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgICAgIGlkPSJwYXRoNTQ4OCIKICAgICAgICAgICAgIGN4PSI3OTMuMTk4NzkiCiAgICAgICAgICAgICBjeT0iMTU1LjY5NjIzIgogICAgICAgICAgICAgcng9IjEzLjUwMDAwMiIKICAgICAgICAgICAgIHJ5PSIxMi4yNTAwMDIiCiAgICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg0MzY4Nzc1LDAuNTM2ODM0MjIsLTAuNTM2ODM0MjIsMC44NDM2ODc3NSwwLDApIiAvPgogICAgICAgIDwvZz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==';

__$styleInject("html, body {\n\theight: 100%;\n\twidth: 100%;\n\toverflow: hidden;\n\tbackground-color: #4f5178;\n\tbackground-position: center;\n\tbackground-size: cover;\n\tpading: 0;\n\tmargin: 0;\n}\n\n.egg {\n\theight: 100%;\n\twidth: 100%;\n\tposition: absolute;\n\tleft: 0;\n\ttop: 0;\n\tbackground-position: center;\n\tbackground-size: contain;\n\tbackground-repeat: no-repeat;\n}\n", undefined);

var props = {
	fps: 0,
	tg: 0,
	color: 'rgb(79, 81, 120)',
	img: ''
};

var $ = function $(selector) {
	return document.querySelector(selector);
};

function _applyGeneralProperti(gp) {
	if (gp.fps) {
		props.fps = gp.fps;
		props.tg = 1000 / gp.fps;
		info('FPS limitation updated, current FPS limitation is', props.fps, 'timegap is', props.tg);
	}
}

function _ref(val) {
	return Math.ceil(val * 255);
}

var init = function init() {
	document.removeEventListener('DOMContentLoaded', init, false);

	var body = $('body');

	body.insertAdjacentHTML('afterbegin', content);
	var pr = window.devicePixelRatio || 1,
	    c = $('.egg'),
	    wW = window.innerWidth,
	    wH = window.innerHeight;
	var bL = 0,
	    bT = 0,
	    bS = 1;
	c.width = wW * pr;
	c.height = wH * pr;
	if (wW / wH > img.width / img.height) {
		bS = wH / img.height;
		bL = (wW - bS * img.width) / 2;
	} else {
		bS = wW / img.width;
		bT = (wH - bS * img.height) / 2;
	}

	var iW = img.width * bS,
	    iH = img.height * bS;

	var pan = c.getContext('2d');
	pan.scale(pr, pr);

	pan.drawImage(img, bL, bT, iW, iH);
	pan.drawImage(img$1, bL, bT, iW, iH);

	var sp = 0.2;

	var mouseX = window.innerWidth / 2,
	    mouseY = window.innerHeight / 2,
	    fpsThreshold = 0,
	    last = 0,
	    diffX = 0,
	    diffY = 0,
	    wX = 0,
	    wY = 0,
	    yX = 0,
	    yY = 0,
	    wS = 1,
	    yS = 1;

	var update = function update() {
		var wdW = iW * wS,
		    wdH = iH * wS,
		    ydW = iW * yS,
		    ydH = iH * yS,
		    wpL = (wdW - iW) / 2,
		    wpT = (wdH - iH) / 2,
		    ypL = (ydW - iW) / 2,
		    ypT = (ydH - iH) / 2;
		pan.clearRect(0, 0, c.width, c.height);
		pan.drawImage(img, bL + wX - wpL, bT + wY - wpT, wdW, wdH);
		pan.drawImage(img$1, bL + yX - ypL, bT + yY - ypT, ydW, ydH);
	};

	var pause = function pause() {
		fpsThreshold = 0;
		last = 0;
		diffX = 0;
		diffY = 0;
		wX = 0;
		wY = 0;
		yX = 0;
		yY = 0;
		wS = 1;
		yS = 1;
		update();
		info('Animation paused.');
	};

	var tick = function tick() {
		var moveX = diffX / 30,
		    moveY = diffY / 30,
		    now = performance.now(),
		    dt = now - last;
		last = now;
		diffX -= moveX;
		diffY -= moveY;
		wX += (moveX - wX / 40) / 2;
		wY += (moveY - wY / 40) / 2;
		yX += (moveX - yX / 30) / 1.5 + (wX - yX) / 30;
		yY += (moveY - yY / 30) / 1.5 + (wY - yY) / 30;

		if (Math.abs(wX) + Math.abs(wY) + Math.abs(yX) + Math.abs(yY) < sp && wS + yS === 2) return pause();
		window.requestAnimationFrame(tick);

		if (props.fps > 0) {
			fpsThreshold += dt;
			if (fpsThreshold > props.tg) fpsThreshold = 0;else return;
		}

		update();
	};

	var start = function start() {
		if (last !== 0) return;
		last = performance.now();
		window.requestAnimationFrame(tick);
		info('Animation started.');
	};

	window.addEventListener('mousemove', function (e) {
		diffX += e.clientX - mouseX;
		diffY += e.clientY - mouseY;
		mouseX = e.clientX;
		mouseY = e.clientY;

		start();
	});

	var audioListener = function audioListener(audioArray) {
		var gap = audioArray.length / 4;
		var lf = 0,
		    hf = 0;
		for (var i = 0; i < gap; i++) {
			lf += audioArray[i] + audioArray[i + gap * 2];
			hf += audioArray[i + gap] + audioArray[i + gap * 3];
		}
		wS = 1 + lf / gap / 2;
		yS = 1 + hf / gap / 2;

		start();
	};

	var updateBg = function updateBg() {
		body.style.backgroundColor = 'rgb(' + props.color + ')';
		if (props.img) body.style.backgroundImage = 'url(file:///' + props.img + ')';
	};
	updateBg();

	window.wallpaperPropertyListener = {
		applyGeneralProperties: _applyGeneralProperti,
		applyUserProperties: function applyUserProperties(up) {
			if (up.schemecolor) {
				var colors = up.schemecolor.value.split(' ').map(_ref);
				props.color = colors.join(', ');
				info('Schemecolor updated, current value is', props.color);
			}
			if (up.image) {
				props.img = up.image.value;
				info('Background image updated, current value is', props.img);
			}
			updateBg();
		}
	};

	window.wallpaperRegisterAudioListener(audioListener);

	info("K-Egg" + ' v' + "0.1.4.master.01a444b" + ' started!');
};

document.addEventListener('DOMContentLoaded', init, false);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9sb2dsZXZlbC9saWIvbG9nbGV2ZWwuanMiLCIuLi9zcmMvZGVidWcuanMiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBsb2dsZXZlbCAtIGh0dHBzOi8vZ2l0aHViLmNvbS9waW10ZXJyeS9sb2dsZXZlbFxuKlxuKiBDb3B5cmlnaHQgKGMpIDIwMTMgVGltIFBlcnJ5XG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiovXG4oZnVuY3Rpb24gKHJvb3QsIGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QubG9nID0gZGVmaW5pdGlvbigpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBub29wID0gZnVuY3Rpb24oKSB7fTtcbiAgICB2YXIgdW5kZWZpbmVkVHlwZSA9IFwidW5kZWZpbmVkXCI7XG5cbiAgICBmdW5jdGlvbiByZWFsTWV0aG9kKG1ldGhvZE5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSB1bmRlZmluZWRUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFdlIGNhbid0IGJ1aWxkIGEgcmVhbCBtZXRob2Qgd2l0aG91dCBhIGNvbnNvbGUgdG8gbG9nIHRvXG4gICAgICAgIH0gZWxzZSBpZiAoY29uc29sZVttZXRob2ROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYmluZE1ldGhvZChjb25zb2xlLCBtZXRob2ROYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb25zb2xlLmxvZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYmluZE1ldGhvZChjb25zb2xlLCAnbG9nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbm9vcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJpbmRNZXRob2Qob2JqLCBtZXRob2ROYW1lKSB7XG4gICAgICAgIHZhciBtZXRob2QgPSBvYmpbbWV0aG9kTmFtZV07XG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kLmJpbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBtZXRob2QuYmluZChvYmopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuY2FsbChtZXRob2QsIG9iaik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gTWlzc2luZyBiaW5kIHNoaW0gb3IgSUU4ICsgTW9kZXJuaXpyLCBmYWxsYmFjayB0byB3cmFwcGluZ1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5hcHBseShtZXRob2QsIFtvYmosIGFyZ3VtZW50c10pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB0aGVzZSBwcml2YXRlIGZ1bmN0aW9ucyBhbHdheXMgbmVlZCBgdGhpc2AgdG8gYmUgc2V0IHByb3Blcmx5XG5cbiAgICBmdW5jdGlvbiBlbmFibGVMb2dnaW5nV2hlbkNvbnNvbGVBcnJpdmVzKG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlTG9nZ2luZ01ldGhvZHMuY2FsbCh0aGlzLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpc1ttZXRob2ROYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VMb2dnaW5nTWV0aG9kcyhsZXZlbCwgbG9nZ2VyTmFtZSkge1xuICAgICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvZ01ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtZXRob2ROYW1lID0gbG9nTWV0aG9kc1tpXTtcbiAgICAgICAgICAgIHRoaXNbbWV0aG9kTmFtZV0gPSAoaSA8IGxldmVsKSA/XG4gICAgICAgICAgICAgICAgbm9vcCA6XG4gICAgICAgICAgICAgICAgdGhpcy5tZXRob2RGYWN0b3J5KG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRNZXRob2RGYWN0b3J5KG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKSB7XG4gICAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICAgIHJldHVybiByZWFsTWV0aG9kKG1ldGhvZE5hbWUpIHx8XG4gICAgICAgICAgICAgICBlbmFibGVMb2dnaW5nV2hlbkNvbnNvbGVBcnJpdmVzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdmFyIGxvZ01ldGhvZHMgPSBbXG4gICAgICAgIFwidHJhY2VcIixcbiAgICAgICAgXCJkZWJ1Z1wiLFxuICAgICAgICBcImluZm9cIixcbiAgICAgICAgXCJ3YXJuXCIsXG4gICAgICAgIFwiZXJyb3JcIlxuICAgIF07XG5cbiAgICBmdW5jdGlvbiBMb2dnZXIobmFtZSwgZGVmYXVsdExldmVsLCBmYWN0b3J5KSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgY3VycmVudExldmVsO1xuICAgICAgdmFyIHN0b3JhZ2VLZXkgPSBcImxvZ2xldmVsXCI7XG4gICAgICBpZiAobmFtZSkge1xuICAgICAgICBzdG9yYWdlS2V5ICs9IFwiOlwiICsgbmFtZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGVyc2lzdExldmVsSWZQb3NzaWJsZShsZXZlbE51bSkge1xuICAgICAgICAgIHZhciBsZXZlbE5hbWUgPSAobG9nTWV0aG9kc1tsZXZlbE51bV0gfHwgJ3NpbGVudCcpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAgICAgICAvLyBVc2UgbG9jYWxTdG9yYWdlIGlmIGF2YWlsYWJsZVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc3RvcmFnZUtleV0gPSBsZXZlbE5hbWU7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICAvLyBVc2Ugc2Vzc2lvbiBjb29raWUgYXMgZmFsbGJhY2tcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnQuY29va2llID1cbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RvcmFnZUtleSkgKyBcIj1cIiArIGxldmVsTmFtZSArIFwiO1wiO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0UGVyc2lzdGVkTGV2ZWwoKSB7XG4gICAgICAgICAgdmFyIHN0b3JlZExldmVsO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSB3aW5kb3cubG9jYWxTdG9yYWdlW3N0b3JhZ2VLZXldO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cblxuICAgICAgICAgIGlmICh0eXBlb2Ygc3RvcmVkTGV2ZWwgPT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIHZhciBjb29raWUgPSB3aW5kb3cuZG9jdW1lbnQuY29va2llO1xuICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gY29va2llLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0b3JhZ2VLZXkpICsgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSAvXihbXjtdKykvLmV4ZWMoY29va2llLnNsaWNlKGxvY2F0aW9uKSlbMV07XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZiB0aGUgc3RvcmVkIGxldmVsIGlzIG5vdCB2YWxpZCwgdHJlYXQgaXQgYXMgaWYgbm90aGluZyB3YXMgc3RvcmVkLlxuICAgICAgICAgIGlmIChzZWxmLmxldmVsc1tzdG9yZWRMZXZlbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBzdG9yZWRMZXZlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc3RvcmVkTGV2ZWw7XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICAgKlxuICAgICAgICogUHVibGljIEFQSVxuICAgICAgICpcbiAgICAgICAqL1xuXG4gICAgICBzZWxmLmxldmVscyA9IHsgXCJUUkFDRVwiOiAwLCBcIkRFQlVHXCI6IDEsIFwiSU5GT1wiOiAyLCBcIldBUk5cIjogMyxcbiAgICAgICAgICBcIkVSUk9SXCI6IDQsIFwiU0lMRU5UXCI6IDV9O1xuXG4gICAgICBzZWxmLm1ldGhvZEZhY3RvcnkgPSBmYWN0b3J5IHx8IGRlZmF1bHRNZXRob2RGYWN0b3J5O1xuXG4gICAgICBzZWxmLmdldExldmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBjdXJyZW50TGV2ZWw7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLnNldExldmVsID0gZnVuY3Rpb24gKGxldmVsLCBwZXJzaXN0KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsZXZlbCA9PT0gXCJzdHJpbmdcIiAmJiBzZWxmLmxldmVsc1tsZXZlbC50b1VwcGVyQ2FzZSgpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGxldmVsID0gc2VsZi5sZXZlbHNbbGV2ZWwudG9VcHBlckNhc2UoKV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgbGV2ZWwgPT09IFwibnVtYmVyXCIgJiYgbGV2ZWwgPj0gMCAmJiBsZXZlbCA8PSBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgY3VycmVudExldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICAgIGlmIChwZXJzaXN0ICE9PSBmYWxzZSkgeyAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgcGVyc2lzdExldmVsSWZQb3NzaWJsZShsZXZlbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVwbGFjZUxvZ2dpbmdNZXRob2RzLmNhbGwoc2VsZiwgbGV2ZWwsIG5hbWUpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09IHVuZGVmaW5lZFR5cGUgJiYgbGV2ZWwgPCBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIk5vIGNvbnNvbGUgYXZhaWxhYmxlIGZvciBsb2dnaW5nXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBcImxvZy5zZXRMZXZlbCgpIGNhbGxlZCB3aXRoIGludmFsaWQgbGV2ZWw6IFwiICsgbGV2ZWw7XG4gICAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2VsZi5zZXREZWZhdWx0TGV2ZWwgPSBmdW5jdGlvbiAobGV2ZWwpIHtcbiAgICAgICAgICBpZiAoIWdldFBlcnNpc3RlZExldmVsKCkpIHtcbiAgICAgICAgICAgICAgc2VsZi5zZXRMZXZlbChsZXZlbCwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNlbGYuZW5hYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuVFJBQ0UsIHBlcnNpc3QpO1xuICAgICAgfTtcblxuICAgICAgc2VsZi5kaXNhYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuU0lMRU5ULCBwZXJzaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEluaXRpYWxpemUgd2l0aCB0aGUgcmlnaHQgbGV2ZWxcbiAgICAgIHZhciBpbml0aWFsTGV2ZWwgPSBnZXRQZXJzaXN0ZWRMZXZlbCgpO1xuICAgICAgaWYgKGluaXRpYWxMZXZlbCA9PSBudWxsKSB7XG4gICAgICAgICAgaW5pdGlhbExldmVsID0gZGVmYXVsdExldmVsID09IG51bGwgPyBcIldBUk5cIiA6IGRlZmF1bHRMZXZlbDtcbiAgICAgIH1cbiAgICAgIHNlbGYuc2V0TGV2ZWwoaW5pdGlhbExldmVsLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKlxuICAgICAqIFBhY2thZ2UtbGV2ZWwgQVBJXG4gICAgICpcbiAgICAgKi9cblxuICAgIHZhciBkZWZhdWx0TG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuXG4gICAgdmFyIF9sb2dnZXJzQnlOYW1lID0ge307XG4gICAgZGVmYXVsdExvZ2dlci5nZXRMb2dnZXIgPSBmdW5jdGlvbiBnZXRMb2dnZXIobmFtZSkge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIgfHwgbmFtZSA9PT0gXCJcIikge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJZb3UgbXVzdCBzdXBwbHkgYSBuYW1lIHdoZW4gY3JlYXRpbmcgYSBsb2dnZXIuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvZ2dlciA9IF9sb2dnZXJzQnlOYW1lW25hbWVdO1xuICAgICAgICBpZiAoIWxvZ2dlcikge1xuICAgICAgICAgIGxvZ2dlciA9IF9sb2dnZXJzQnlOYW1lW25hbWVdID0gbmV3IExvZ2dlcihcbiAgICAgICAgICAgIG5hbWUsIGRlZmF1bHRMb2dnZXIuZ2V0TGV2ZWwoKSwgZGVmYXVsdExvZ2dlci5tZXRob2RGYWN0b3J5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9nZ2VyO1xuICAgIH07XG5cbiAgICAvLyBHcmFiIHRoZSBjdXJyZW50IGdsb2JhbCBsb2cgdmFyaWFibGUgaW4gY2FzZSBvZiBvdmVyd3JpdGVcbiAgICB2YXIgX2xvZyA9ICh0eXBlb2Ygd2luZG93ICE9PSB1bmRlZmluZWRUeXBlKSA/IHdpbmRvdy5sb2cgOiB1bmRlZmluZWQ7XG4gICAgZGVmYXVsdExvZ2dlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSB1bmRlZmluZWRUeXBlICYmXG4gICAgICAgICAgICAgICB3aW5kb3cubG9nID09PSBkZWZhdWx0TG9nZ2VyKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9nID0gX2xvZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZhdWx0TG9nZ2VyO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmYXVsdExvZ2dlcjtcbn0pKTtcbiIsIi8qIGdsb2JhbCBBUFBOQU1FICovXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IGxvZ2dlciBmcm9tICdsb2dsZXZlbCdcblxuY29uc3QgYXBwTmFtZSA9IGBbJHtBUFBOQU1FfV1gXG5jb25zdCBsb2cgPSBjb25zb2xlLmxvZy5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCB0cmFjZSA9IGxvZ2dlci50cmFjZS5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCBkZWJ1ZyA9IGxvZ2dlci5kZWJ1Zy5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCBpbmZvID0gbG9nZ2VyLmluZm8uYmluZChudWxsLCBhcHBOYW1lKVxuY29uc3Qgd2FybiA9IGxvZ2dlci53YXJuLmJpbmQobnVsbCwgYXBwTmFtZSlcbmNvbnN0IGVycm9yID0gbG9nZ2VyLmVycm9yLmJpbmQobnVsbCwgYXBwTmFtZSlcblxuaWYgKEVOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG5cdGxvZ2dlci5zZXRMZXZlbCgnZXJyb3InKVxufSBlbHNlIHtcblx0bG9nZ2VyLnNldExldmVsKCd0cmFjZScpXG59XG5cbmluZm8oJ0RlYnVnIGxvZ2dpbmcgZW5hYmxlZCEnKVxuXG5leHBvcnQgeyBsb2csIHRyYWNlLCBkZWJ1ZywgaW5mbywgd2FybiwgZXJyb3IgfVxuIiwiLyogZ2xvYmFsIEFQUE5BTUUsIFZFUlNJT04gKi9cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgeyBpbmZvIH0gZnJvbSAnLi9kZWJ1Zy5qcydcbmltcG9ydCBjb250ZW50IGZyb20gJy4vbWFpbi5odG1sJ1xuaW1wb3J0IGV3IGZyb20gJy4vcmVzL2VnZy13LnN2ZydcbmltcG9ydCBleSBmcm9tICcuL3Jlcy9lZ2cteS5zdmcnXG5pbXBvcnQgJy4vc3R5bGUvc3R5bGUuY3NzJ1xuXG4vLyBTZXQgZGVmYXVsdCBwcm9wZXJ0aWVzXG5jb25zdCBwcm9wcyA9IHtcblx0ZnBzOiAwLFxuXHR0ZzogMCxcblx0Y29sb3I6ICdyZ2IoNzksIDgxLCAxMjApJyxcblx0aW1nOiAnJ1xufVxuXG5jb25zdCAkID0gc2VsZWN0b3IgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcilcblxuY29uc3QgaW5pdCA9ICgpID0+IHtcblx0Ly8gUmVtb3ZlIHRoZSBpbml0IGxpc3RlbmVyXG5cdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0LCBmYWxzZSlcblxuXHQvLyBQcmVwYXJlIHRoZSBmcnlpbmcgcGFuXG5cdGNvbnN0IGJvZHkgPSAkKCdib2R5JylcblxuXHRib2R5Lmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGNvbnRlbnQpXG5cdGNvbnN0IHByID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSxcblx0XHRjID0gJCgnLmVnZycpLFxuXHRcdHdXID0gd2luZG93LmlubmVyV2lkdGgsXG5cdFx0d0ggPSB3aW5kb3cuaW5uZXJIZWlnaHRcblx0bGV0IGJMID0gMCxcblx0XHRiVCA9IDAsXG5cdFx0YlMgPSAxXG5cdGMud2lkdGggPSB3VyAqIHByXG5cdGMuaGVpZ2h0ID0gd0ggKiBwclxuXHRpZiAod1cgLyB3SCA+IGV3LndpZHRoIC8gZXcuaGVpZ2h0KSB7XG5cdFx0YlMgPSB3SCAvIGV3LmhlaWdodFxuXHRcdGJMID0gKHdXIC0gYlMgKiBldy53aWR0aCkgLyAyXG5cdH0gZWxzZSB7XG5cdFx0YlMgPSB3VyAvIGV3LndpZHRoXG5cdFx0YlQgPSAod0ggLSBiUyAqIGV3LmhlaWdodCkgLyAyXG5cdH1cblxuXHRjb25zdCBpVyA9IGV3LndpZHRoICogYlMsXG5cdFx0aUggPSBldy5oZWlnaHQgKiBiU1xuXG5cdGNvbnN0IHBhbiA9IGMuZ2V0Q29udGV4dCgnMmQnKVxuXHRwYW4uc2NhbGUocHIsIHByKVxuXG5cdHBhbi5kcmF3SW1hZ2UoZXcsIGJMLCBiVCwgaVcsIGlIKVxuXHRwYW4uZHJhd0ltYWdlKGV5LCBiTCwgYlQsIGlXLCBpSClcblxuXHQvLyBTZXQgdGhlIHN0b3AgcG9pbnRcblx0Y29uc3Qgc3AgPSAwLjJcblxuXHQvLyBJbml0aWFsaXplIHZpcmFibGVzXG5cdGxldCBtb3VzZVggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIDIsXG5cdFx0bW91c2VZID0gd2luZG93LmlubmVySGVpZ2h0IC8gMixcblx0XHRmcHNUaHJlc2hvbGQgPSAwLFxuXHRcdGxhc3QgPSAwLFxuXHRcdGRpZmZYID0gMCxcblx0XHRkaWZmWSA9IDAsXG5cdFx0d1ggPSAwLFxuXHRcdHdZID0gMCxcblx0XHR5WCA9IDAsXG5cdFx0eVkgPSAwLFxuXHRcdHdTID0gMSxcblx0XHR5UyA9IDFcblxuXHQvLyBBcHBseSBjaGFuZ2VzIHRvIHZpZXdcblx0Y29uc3QgdXBkYXRlID0gKCkgPT4ge1xuXHRcdGNvbnN0IHdkVyA9IGlXICogd1MsXG5cdFx0XHR3ZEggPSBpSCAqIHdTLFxuXHRcdFx0eWRXID0gaVcgKiB5Uyxcblx0XHRcdHlkSCA9IGlIICogeVMsXG5cdFx0XHR3cEwgPSAod2RXIC0gaVcpIC8gMixcblx0XHRcdHdwVCA9ICh3ZEggLSBpSCkgLyAyLFxuXHRcdFx0eXBMID0gKHlkVyAtIGlXKSAvIDIsXG5cdFx0XHR5cFQgPSAoeWRIIC0gaUgpIC8gMlxuXHRcdHBhbi5jbGVhclJlY3QoMCwgMCwgYy53aWR0aCwgYy5oZWlnaHQpXG5cdFx0cGFuLmRyYXdJbWFnZShldywgYkwgKyB3WCAtIHdwTCwgYlQgKyB3WSAtIHdwVCwgd2RXLCB3ZEgpXG5cdFx0cGFuLmRyYXdJbWFnZShleSwgYkwgKyB5WCAtIHlwTCwgYlQgKyB5WSAtIHlwVCwgeWRXLCB5ZEgpXG5cdH1cblxuXHQvLyBQYXVzZSBhbmltYXRpb24gdG8gc2F2ZSBDUFUgd2hlbiBub3QgYWN0aXZlXG5cdGNvbnN0IHBhdXNlID0gKCkgPT4ge1xuXHRcdGZwc1RocmVzaG9sZCA9IDBcblx0XHRsYXN0ID0gMFxuXHRcdGRpZmZYID0gMFxuXHRcdGRpZmZZID0gMFxuXHRcdHdYID0gMFxuXHRcdHdZID0gMFxuXHRcdHlYID0gMFxuXHRcdHlZID0gMFxuXHRcdHdTID0gMVxuXHRcdHlTID0gMVxuXHRcdHVwZGF0ZSgpXG5cdFx0aW5mbygnQW5pbWF0aW9uIHBhdXNlZC4nKVxuXHR9XG5cblx0Ly8gQ2FsY3VsYXRpb24gb24gZWFjaCBmcmFtZVxuXHRjb25zdCB0aWNrID0gKCkgPT4ge1xuXHRcdGNvbnN0IG1vdmVYID0gZGlmZlggLyAzMCxcblx0XHRcdG1vdmVZID0gZGlmZlkgLyAzMCxcblx0XHRcdG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpLFxuXHRcdFx0ZHQgPSBub3cgLSBsYXN0XG5cdFx0bGFzdCA9IG5vd1xuXHRcdGRpZmZYIC09IG1vdmVYXG5cdFx0ZGlmZlkgLT0gbW92ZVlcblx0XHR3WCArPSAobW92ZVggLSB3WCAvIDQwKSAvIDJcblx0XHR3WSArPSAobW92ZVkgLSB3WSAvIDQwKSAvIDJcblx0XHR5WCArPSAobW92ZVggLSB5WCAvIDMwKSAvIDEuNSArICh3WCAtIHlYKSAvIDMwXG5cdFx0eVkgKz0gKG1vdmVZIC0geVkgLyAzMCkgLyAxLjUgKyAod1kgLSB5WSkgLyAzMFxuXG5cdFx0Ly8gU3RhcnQgTmV4dCB0aWNrXG5cdFx0aWYgKE1hdGguYWJzKHdYKSArIE1hdGguYWJzKHdZKSArIE1hdGguYWJzKHlYKSArIE1hdGguYWJzKHlZKSA8IHNwICYmIHdTICsgeVMgPT09IDIpIHJldHVybiBwYXVzZSgpXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKVxuXG5cdFx0Ly8gTGltaXQgRlBTXG5cdFx0aWYgKHByb3BzLmZwcyA+IDApIHtcblx0XHRcdGZwc1RocmVzaG9sZCArPSBkdFxuXHRcdFx0aWYgKGZwc1RocmVzaG9sZCA+IHByb3BzLnRnKSBmcHNUaHJlc2hvbGQgPSAwXG5cdFx0XHRlbHNlIHJldHVyblxuXHRcdH1cblxuXHRcdHVwZGF0ZSgpXG5cdH1cblxuXHQvLyBIYW5kbGUgaWYgc3RhcnQgdGhlIGFuaW1hdGlvblxuXHRjb25zdCBzdGFydCA9ICgpID0+IHtcblx0XHRpZiAobGFzdCAhPT0gMCkgcmV0dXJuXG5cdFx0bGFzdCA9IHBlcmZvcm1hbmNlLm5vdygpXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKVxuXHRcdGluZm8oJ0FuaW1hdGlvbiBzdGFydGVkLicpXG5cdH1cblxuXHQvLyBMaXN0ZW4gbW91c2UgbW92ZSBldmVudHNcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB7XG5cdFx0ZGlmZlggKz0gZS5jbGllbnRYIC0gbW91c2VYXG5cdFx0ZGlmZlkgKz0gZS5jbGllbnRZIC0gbW91c2VZXG5cdFx0bW91c2VYID0gZS5jbGllbnRYXG5cdFx0bW91c2VZID0gZS5jbGllbnRZXG5cblx0XHQvLyBTdGFydCBhbmltYXRpb25cblx0XHRzdGFydCgpXG5cdH0pXG5cblx0Ly8gSGFuZGxlIGF1ZGlvIGluZm8gdXBkYXRlc1xuXHRjb25zdCBhdWRpb0xpc3RlbmVyID0gKGF1ZGlvQXJyYXkpID0+IHtcblx0XHRjb25zdCBnYXAgPSBhdWRpb0FycmF5Lmxlbmd0aCAvIDRcblx0XHRsZXQgbGYgPSAwLFxuXHRcdFx0aGYgPSAwXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBnYXA7IGkrKykge1xuXHRcdFx0bGYgKz0gYXVkaW9BcnJheVtpXSArIGF1ZGlvQXJyYXlbaSArIGdhcCAqIDJdXG5cdFx0XHRoZiArPSBhdWRpb0FycmF5W2kgKyBnYXBdICsgYXVkaW9BcnJheVtpICsgZ2FwICogM11cblx0XHR9XG5cdFx0d1MgPSAxICsgKGxmIC8gZ2FwKSAvIDJcblx0XHR5UyA9IDEgKyAoaGYgLyBnYXApIC8gMlxuXG5cdFx0Ly8gU3RhcnQgYW5pbWF0aW9uXG5cdFx0c3RhcnQoKVxuXHR9XG5cblx0Ly8gVXBkYXRlIGJhY2tncm91bmRcblx0Y29uc3QgdXBkYXRlQmcgPSAoKSA9PiB7XG5cdFx0Ym9keS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBgcmdiKCR7cHJvcHMuY29sb3J9KWBcblx0XHRpZiAocHJvcHMuaW1nKSBib2R5LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoZmlsZTovLy8ke3Byb3BzLmltZ30pYFxuXHR9XG5cdHVwZGF0ZUJnKClcblxuXHQvLyBIYW5kbGUgdXNlciBwcm9wZXJ0aWVzXG5cdHdpbmRvdy53YWxscGFwZXJQcm9wZXJ0eUxpc3RlbmVyID0ge1xuXHRcdGFwcGx5R2VuZXJhbFByb3BlcnRpZXMoZ3ApIHtcblx0XHRcdGlmIChncC5mcHMpIHtcblx0XHRcdFx0cHJvcHMuZnBzID0gZ3AuZnBzXG5cdFx0XHRcdHByb3BzLnRnID0gMTAwMCAvIGdwLmZwc1xuXHRcdFx0XHRpbmZvKCdGUFMgbGltaXRhdGlvbiB1cGRhdGVkLCBjdXJyZW50IEZQUyBsaW1pdGF0aW9uIGlzJywgcHJvcHMuZnBzLCAndGltZWdhcCBpcycsIHByb3BzLnRnKVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0YXBwbHlVc2VyUHJvcGVydGllcyh1cCkge1xuXHRcdFx0aWYgKHVwLnNjaGVtZWNvbG9yKSB7XG5cdFx0XHRcdGNvbnN0IGNvbG9ycyA9IHVwLnNjaGVtZWNvbG9yLnZhbHVlLnNwbGl0KCcgJykubWFwKHZhbCA9PiBNYXRoLmNlaWwodmFsICogMjU1KSlcblx0XHRcdFx0cHJvcHMuY29sb3IgPSBjb2xvcnMuam9pbignLCAnKVxuXHRcdFx0XHRpbmZvKCdTY2hlbWVjb2xvciB1cGRhdGVkLCBjdXJyZW50IHZhbHVlIGlzJywgcHJvcHMuY29sb3IpXG5cdFx0XHR9XG5cdFx0XHRpZiAodXAuaW1hZ2UpIHtcblx0XHRcdFx0cHJvcHMuaW1nID0gdXAuaW1hZ2UudmFsdWVcblx0XHRcdFx0aW5mbygnQmFja2dyb3VuZCBpbWFnZSB1cGRhdGVkLCBjdXJyZW50IHZhbHVlIGlzJywgcHJvcHMuaW1nKVxuXHRcdFx0fVxuXHRcdFx0dXBkYXRlQmcoKVxuXHRcdH1cblx0fVxuXG5cdC8vIExpc3RlbiBhdWRpbyB1cGRhdGVzXG5cdHdpbmRvdy53YWxscGFwZXJSZWdpc3RlckF1ZGlvTGlzdGVuZXIoYXVkaW9MaXN0ZW5lcilcblxuXHRpbmZvKGAke0FQUE5BTUV9IHYke1ZFUlNJT059IHN0YXJ0ZWQhYClcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXQsIGZhbHNlKVxuIl0sIm5hbWVzIjpbInRoaXMiLCJhcHBOYW1lIiwiQVBQTkFNRSIsImxvZyIsImNvbnNvbGUiLCJiaW5kIiwidHJhY2UiLCJsb2dnZXIiLCJkZWJ1ZyIsImluZm8iLCJ3YXJuIiwiZXJyb3IiLCJFTlYiLCJzZXRMZXZlbCIsInByb3BzIiwiJCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsInNlbGVjdG9yIiwiZ3AiLCJmcHMiLCJ0ZyIsIk1hdGgiLCJjZWlsIiwidmFsIiwiaW5pdCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJib2R5IiwiaW5zZXJ0QWRqYWNlbnRIVE1MIiwiY29udGVudCIsInByIiwid2luZG93IiwiZGV2aWNlUGl4ZWxSYXRpbyIsImMiLCJ3VyIsImlubmVyV2lkdGgiLCJ3SCIsImlubmVySGVpZ2h0IiwiYkwiLCJiVCIsImJTIiwid2lkdGgiLCJoZWlnaHQiLCJldyIsImlXIiwiaUgiLCJwYW4iLCJnZXRDb250ZXh0Iiwic2NhbGUiLCJkcmF3SW1hZ2UiLCJleSIsInNwIiwibW91c2VYIiwibW91c2VZIiwiZnBzVGhyZXNob2xkIiwibGFzdCIsImRpZmZYIiwiZGlmZlkiLCJ3WCIsIndZIiwieVgiLCJ5WSIsIndTIiwieVMiLCJ1cGRhdGUiLCJ3ZFciLCJ3ZEgiLCJ5ZFciLCJ5ZEgiLCJ3cEwiLCJ3cFQiLCJ5cEwiLCJ5cFQiLCJjbGVhclJlY3QiLCJwYXVzZSIsInRpY2siLCJtb3ZlWCIsIm1vdmVZIiwibm93IiwicGVyZm9ybWFuY2UiLCJkdCIsImFicyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInN0YXJ0IiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJjbGllbnRYIiwiY2xpZW50WSIsImF1ZGlvTGlzdGVuZXIiLCJhdWRpb0FycmF5IiwiZ2FwIiwibGVuZ3RoIiwibGYiLCJoZiIsImkiLCJ1cGRhdGVCZyIsInN0eWxlIiwiYmFja2dyb3VuZENvbG9yIiwiY29sb3IiLCJpbWciLCJiYWNrZ3JvdW5kSW1hZ2UiLCJ3YWxscGFwZXJQcm9wZXJ0eUxpc3RlbmVyIiwidXAiLCJzY2hlbWVjb2xvciIsImNvbG9ycyIsInZhbHVlIiwic3BsaXQiLCJtYXAiLCJqb2luIiwiaW1hZ2UiLCJ3YWxscGFwZXJSZWdpc3RlckF1ZGlvTGlzdGVuZXIiLCJWRVJTSU9OIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxDQUFDLFVBQVUsSUFBSSxFQUFFLFVBQVUsRUFBRTtJQUN6QixZQUFZLENBQUM7SUFDYixJQUFJLE9BQU8sTUFBTSxLQUFLLFVBQVUsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFO1FBQzVDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUN0QixNQUFNLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDckQsY0FBYyxHQUFHLFVBQVUsRUFBRSxDQUFDO0tBQ2pDLE1BQU07UUFDSCxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsRUFBRSxDQUFDO0tBQzNCO0NBQ0osQ0FBQ0EsY0FBSSxFQUFFLFlBQVk7SUFDaEIsWUFBWSxDQUFDO0lBQ2IsSUFBSSxJQUFJLEdBQUcsV0FBVyxFQUFFLENBQUM7SUFDekIsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDOztJQUVoQyxTQUFTLFVBQVUsQ0FBQyxVQUFVLEVBQUU7UUFDNUIsSUFBSSxPQUFPLE9BQU8sS0FBSyxhQUFhLEVBQUU7WUFDbEMsT0FBTyxLQUFLLENBQUM7U0FDaEIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDMUMsT0FBTyxVQUFVLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzFDLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxLQUFLLFNBQVMsRUFBRTtZQUNsQyxPQUFPLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckMsTUFBTTtZQUNILE9BQU8sSUFBSSxDQUFDO1NBQ2Y7S0FDSjs7SUFFRCxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFO1FBQ2pDLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QixJQUFJLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7WUFDbkMsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNCLE1BQU07WUFDSCxJQUFJO2dCQUNBLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNwRCxDQUFDLE9BQU8sQ0FBQyxFQUFFOztnQkFFUixPQUFPLFdBQVc7b0JBQ2QsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7aUJBQ25FLENBQUM7YUFDTDtTQUNKO0tBQ0o7Ozs7SUFJRCxTQUFTLCtCQUErQixDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO1FBQ3BFLE9BQU8sWUFBWTtZQUNmLElBQUksT0FBTyxPQUFPLEtBQUssYUFBYSxFQUFFO2dCQUNsQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDM0M7U0FDSixDQUFDO0tBQ0w7O0lBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFOztRQUU5QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4QyxJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUs7Z0JBQ3pCLElBQUk7Z0JBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3pEO0tBQ0o7O0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTs7UUFFekQsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDO2VBQ3RCLCtCQUErQixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDakU7O0lBRUQsSUFBSSxVQUFVLEdBQUc7UUFDYixPQUFPO1FBQ1AsT0FBTztRQUNQLE1BQU07UUFDTixNQUFNO1FBQ04sT0FBTztLQUNWLENBQUM7O0lBRUYsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUU7TUFDM0MsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO01BQ2hCLElBQUksWUFBWSxDQUFDO01BQ2pCLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQztNQUM1QixJQUFJLElBQUksRUFBRTtRQUNSLFVBQVUsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO09BQzFCOztNQUVELFNBQVMsc0JBQXNCLENBQUMsUUFBUSxFQUFFO1VBQ3RDLElBQUksU0FBUyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQzs7O1VBR2pFLElBQUk7Y0FDQSxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztjQUM1QyxPQUFPO1dBQ1YsQ0FBQyxPQUFPLE1BQU0sRUFBRSxFQUFFOzs7VUFHbkIsSUFBSTtjQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTTtnQkFDcEIsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxHQUFHLFNBQVMsR0FBRyxHQUFHLENBQUM7V0FDNUQsQ0FBQyxPQUFPLE1BQU0sRUFBRSxFQUFFO09BQ3RCOztNQUVELFNBQVMsaUJBQWlCLEdBQUc7VUFDekIsSUFBSSxXQUFXLENBQUM7O1VBRWhCLElBQUk7Y0FDQSxXQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztXQUNqRCxDQUFDLE9BQU8sTUFBTSxFQUFFLEVBQUU7O1VBRW5CLElBQUksT0FBTyxXQUFXLEtBQUssYUFBYSxFQUFFO2NBQ3RDLElBQUk7a0JBQ0EsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7a0JBQ3BDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPO3NCQUN6QixrQkFBa0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztrQkFDMUMsSUFBSSxRQUFRLEVBQUU7c0JBQ1YsV0FBVyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO21CQUM1RDtlQUNKLENBQUMsT0FBTyxNQUFNLEVBQUUsRUFBRTtXQUN0Qjs7O1VBR0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsRUFBRTtjQUN4QyxXQUFXLEdBQUcsU0FBUyxDQUFDO1dBQzNCOztVQUVELE9BQU8sV0FBVyxDQUFDO09BQ3RCOzs7Ozs7OztNQVFELElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQztVQUN4RCxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQzs7TUFFN0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLElBQUksb0JBQW9CLENBQUM7O01BRXJELElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWTtVQUN4QixPQUFPLFlBQVksQ0FBQztPQUN2QixDQUFDOztNQUVGLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxLQUFLLEVBQUUsT0FBTyxFQUFFO1VBQ3RDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssU0FBUyxFQUFFO2NBQzdFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1dBQzVDO1VBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Y0FDeEUsWUFBWSxHQUFHLEtBQUssQ0FBQztjQUNyQixJQUFJLE9BQU8sS0FBSyxLQUFLLEVBQUU7a0JBQ25CLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO2VBQ2pDO2NBQ0QscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7Y0FDOUMsSUFBSSxPQUFPLE9BQU8sS0FBSyxhQUFhLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2tCQUNoRSxPQUFPLGtDQUFrQyxDQUFDO2VBQzdDO1dBQ0osTUFBTTtjQUNILE1BQU0sNENBQTRDLEdBQUcsS0FBSyxDQUFDO1dBQzlEO09BQ0osQ0FBQzs7TUFFRixJQUFJLENBQUMsZUFBZSxHQUFHLFVBQVUsS0FBSyxFQUFFO1VBQ3BDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO2NBQ3RCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1dBQy9CO09BQ0osQ0FBQzs7TUFFRixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsT0FBTyxFQUFFO1VBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDN0MsQ0FBQzs7TUFFRixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsT0FBTyxFQUFFO1VBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDOUMsQ0FBQzs7O01BR0YsSUFBSSxZQUFZLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztNQUN2QyxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUU7VUFDdEIsWUFBWSxHQUFHLFlBQVksSUFBSSxJQUFJLEdBQUcsTUFBTSxHQUFHLFlBQVksQ0FBQztPQUMvRDtNQUNELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3BDOzs7Ozs7OztJQVFELElBQUksYUFBYSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7O0lBRWpDLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUN4QixhQUFhLENBQUMsU0FBUyxHQUFHLFNBQVMsU0FBUyxDQUFDLElBQUksRUFBRTtRQUMvQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFO1VBQzNDLE1BQU0sSUFBSSxTQUFTLENBQUMsZ0RBQWdELENBQUMsQ0FBQztTQUN2RTs7UUFFRCxJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sRUFBRTtVQUNYLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNO1lBQ3hDLElBQUksRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ2hFO1FBQ0QsT0FBTyxNQUFNLENBQUM7S0FDakIsQ0FBQzs7O0lBR0YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxPQUFPLE1BQU0sS0FBSyxhQUFhLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUM7SUFDdEUsYUFBYSxDQUFDLFVBQVUsR0FBRyxXQUFXO1FBQ2xDLElBQUksT0FBTyxNQUFNLEtBQUssYUFBYTtlQUM1QixNQUFNLENBQUMsR0FBRyxLQUFLLGFBQWEsRUFBRTtZQUNqQyxNQUFNLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztTQUNyQjs7UUFFRCxPQUFPLGFBQWEsQ0FBQztLQUN4QixDQUFDOztJQUVGLE9BQU8sYUFBYSxDQUFDO0NBQ3hCLENBQUMsRUFBRTs7O0FDek5KLElBQU1DLGdCQUFjQyxPQUFkLE1BQU47QUFDQSxJQUFNQyxNQUFNQyxRQUFRRCxHQUFSLENBQVlFLElBQVosQ0FBaUIsSUFBakIsRUFBdUJKLE9BQXZCLENBQVo7QUFDQSxJQUFNSyxRQUFRQyxTQUFPRCxLQUFQLENBQWFELElBQWIsQ0FBa0IsSUFBbEIsRUFBd0JKLE9BQXhCLENBQWQ7QUFDQSxJQUFNTyxRQUFRRCxTQUFPQyxLQUFQLENBQWFILElBQWIsQ0FBa0IsSUFBbEIsRUFBd0JKLE9BQXhCLENBQWQ7QUFDQSxJQUFNUSxPQUFPRixTQUFPRSxJQUFQLENBQVlKLElBQVosQ0FBaUIsSUFBakIsRUFBdUJKLE9BQXZCLENBQWI7QUFDQSxJQUFNUyxPQUFPSCxTQUFPRyxJQUFQLENBQVlMLElBQVosQ0FBaUIsSUFBakIsRUFBdUJKLE9BQXZCLENBQWI7QUFDQSxJQUFNVSxRQUFRSixTQUFPSSxLQUFQLENBQWFOLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0JKLE9BQXhCLENBQWQ7O0FBRUEsQUFBSVcsQUFBSixBQUVPO1VBQ0NDLFFBQVAsQ0FBZ0IsT0FBaEI7OztBQUdESixLQUFLLHdCQUFMLEVBRUE7Ozs7Ozs7Ozs7QUNYQSxJQUFNSyxRQUFRO01BQ1IsQ0FEUTtLQUVULENBRlM7UUFHTixrQkFITTtNQUlSO0NBSk47O0FBT0EsSUFBTUMsSUFBSSxTQUFKQSxDQUFJO1FBQVlDLFNBQVNDLGFBQVQsQ0FBdUJDLFFBQXZCLENBQVo7Q0FBVjs7K0JBNEp5QkMsSUFBSTtLQUN0QkEsR0FBR0MsR0FBUCxFQUFZO1FBQ0xBLEdBQU4sR0FBWUQsR0FBR0MsR0FBZjtRQUNNQyxFQUFOLEdBQVcsT0FBT0YsR0FBR0MsR0FBckI7T0FDSyxtREFBTCxFQUEwRE4sTUFBTU0sR0FBaEUsRUFBcUUsWUFBckUsRUFBbUZOLE1BQU1PLEVBQXpGOzs7O0FBS21EO1FBQU9DLEtBQUtDLElBQUwsQ0FBVUMsTUFBTSxHQUFoQixDQUFQOzs7QUFuS3ZELElBQU1DLE9BQU8sU0FBUEEsSUFBTyxHQUFNO1VBRVRDLG1CQUFULENBQTZCLGtCQUE3QixFQUFpREQsSUFBakQsRUFBdUQsS0FBdkQ7O0tBR01FLE9BQU9aLEVBQUUsTUFBRixDQUFiOztNQUVLYSxrQkFBTCxDQUF3QixZQUF4QixFQUFzQ0MsT0FBdEM7S0FDTUMsS0FBS0MsT0FBT0MsZ0JBQVAsSUFBMkIsQ0FBdEM7S0FDQ0MsSUFBSWxCLEVBQUUsTUFBRixDQURMO0tBRUNtQixLQUFLSCxPQUFPSSxVQUZiO0tBR0NDLEtBQUtMLE9BQU9NLFdBSGI7S0FJSUMsS0FBSyxDQUFUO0tBQ0NDLEtBQUssQ0FETjtLQUVDQyxLQUFLLENBRk47R0FHRUMsS0FBRixHQUFVUCxLQUFLSixFQUFmO0dBQ0VZLE1BQUYsR0FBV04sS0FBS04sRUFBaEI7S0FDSUksS0FBS0UsRUFBTCxHQUFVTyxJQUFHRixLQUFILEdBQVdFLElBQUdELE1BQTVCLEVBQW9DO09BQzlCTixLQUFLTyxJQUFHRCxNQUFiO09BQ0ssQ0FBQ1IsS0FBS00sS0FBS0csSUFBR0YsS0FBZCxJQUF1QixDQUE1QjtFQUZELE1BR087T0FDRFAsS0FBS1MsSUFBR0YsS0FBYjtPQUNLLENBQUNMLEtBQUtJLEtBQUtHLElBQUdELE1BQWQsSUFBd0IsQ0FBN0I7OztLQUdLRSxLQUFLRCxJQUFHRixLQUFILEdBQVdELEVBQXRCO0tBQ0NLLEtBQUtGLElBQUdELE1BQUgsR0FBWUYsRUFEbEI7O0tBR01NLE1BQU1iLEVBQUVjLFVBQUYsQ0FBYSxJQUFiLENBQVo7S0FDSUMsS0FBSixDQUFVbEIsRUFBVixFQUFjQSxFQUFkOztLQUVJbUIsU0FBSixDQUFjTixHQUFkLEVBQWtCTCxFQUFsQixFQUFzQkMsRUFBdEIsRUFBMEJLLEVBQTFCLEVBQThCQyxFQUE5QjtLQUNJSSxTQUFKLENBQWNDLEtBQWQsRUFBa0JaLEVBQWxCLEVBQXNCQyxFQUF0QixFQUEwQkssRUFBMUIsRUFBOEJDLEVBQTlCOztLQUdNTSxLQUFLLEdBQVg7O0tBR0lDLFNBQVNyQixPQUFPSSxVQUFQLEdBQW9CLENBQWpDO0tBQ0NrQixTQUFTdEIsT0FBT00sV0FBUCxHQUFxQixDQUQvQjtLQUVDaUIsZUFBZSxDQUZoQjtLQUdDQyxPQUFPLENBSFI7S0FJQ0MsUUFBUSxDQUpUO0tBS0NDLFFBQVEsQ0FMVDtLQU1DQyxLQUFLLENBTk47S0FPQ0MsS0FBSyxDQVBOO0tBUUNDLEtBQUssQ0FSTjtLQVNDQyxLQUFLLENBVE47S0FVQ0MsS0FBSyxDQVZOO0tBV0NDLEtBQUssQ0FYTjs7S0FjTUMsU0FBUyxTQUFUQSxNQUFTLEdBQU07TUFDZEMsTUFBTXJCLEtBQUtrQixFQUFqQjtNQUNDSSxNQUFNckIsS0FBS2lCLEVBRFo7TUFFQ0ssTUFBTXZCLEtBQUttQixFQUZaO01BR0NLLE1BQU12QixLQUFLa0IsRUFIWjtNQUlDTSxNQUFNLENBQUNKLE1BQU1yQixFQUFQLElBQWEsQ0FKcEI7TUFLQzBCLE1BQU0sQ0FBQ0osTUFBTXJCLEVBQVAsSUFBYSxDQUxwQjtNQU1DMEIsTUFBTSxDQUFDSixNQUFNdkIsRUFBUCxJQUFhLENBTnBCO01BT0M0QixNQUFNLENBQUNKLE1BQU12QixFQUFQLElBQWEsQ0FQcEI7TUFRSTRCLFNBQUosQ0FBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CeEMsRUFBRVEsS0FBdEIsRUFBNkJSLEVBQUVTLE1BQS9CO01BQ0lPLFNBQUosQ0FBY04sR0FBZCxFQUFrQkwsS0FBS29CLEVBQUwsR0FBVVcsR0FBNUIsRUFBaUM5QixLQUFLb0IsRUFBTCxHQUFVVyxHQUEzQyxFQUFnREwsR0FBaEQsRUFBcURDLEdBQXJEO01BQ0lqQixTQUFKLENBQWNDLEtBQWQsRUFBa0JaLEtBQUtzQixFQUFMLEdBQVVXLEdBQTVCLEVBQWlDaEMsS0FBS3NCLEVBQUwsR0FBVVcsR0FBM0MsRUFBZ0RMLEdBQWhELEVBQXFEQyxHQUFyRDtFQVhEOztLQWVNTSxRQUFRLFNBQVJBLEtBQVEsR0FBTTtpQkFDSixDQUFmO1NBQ08sQ0FBUDtVQUNRLENBQVI7VUFDUSxDQUFSO09BQ0ssQ0FBTDtPQUNLLENBQUw7T0FDSyxDQUFMO09BQ0ssQ0FBTDtPQUNLLENBQUw7T0FDSyxDQUFMOztPQUVLLG1CQUFMO0VBWkQ7O0tBZ0JNQyxPQUFPLFNBQVBBLElBQU8sR0FBTTtNQUNaQyxRQUFRcEIsUUFBUSxFQUF0QjtNQUNDcUIsUUFBUXBCLFFBQVEsRUFEakI7TUFFQ3FCLE1BQU1DLFlBQVlELEdBQVosRUFGUDtNQUdDRSxLQUFLRixNQUFNdkIsSUFIWjtTQUlPdUIsR0FBUDtXQUNTRixLQUFUO1dBQ1NDLEtBQVQ7UUFDTSxDQUFDRCxRQUFRbEIsS0FBSyxFQUFkLElBQW9CLENBQTFCO1FBQ00sQ0FBQ21CLFFBQVFsQixLQUFLLEVBQWQsSUFBb0IsQ0FBMUI7UUFDTSxDQUFDaUIsUUFBUWhCLEtBQUssRUFBZCxJQUFvQixHQUFwQixHQUEwQixDQUFDRixLQUFLRSxFQUFOLElBQVksRUFBNUM7UUFDTSxDQUFDaUIsUUFBUWhCLEtBQUssRUFBZCxJQUFvQixHQUFwQixHQUEwQixDQUFDRixLQUFLRSxFQUFOLElBQVksRUFBNUM7O01BR0l2QyxLQUFLMkQsR0FBTCxDQUFTdkIsRUFBVCxJQUFlcEMsS0FBSzJELEdBQUwsQ0FBU3RCLEVBQVQsQ0FBZixHQUE4QnJDLEtBQUsyRCxHQUFMLENBQVNyQixFQUFULENBQTlCLEdBQTZDdEMsS0FBSzJELEdBQUwsQ0FBU3BCLEVBQVQsQ0FBN0MsR0FBNERWLEVBQTVELElBQWtFVyxLQUFLQyxFQUFMLEtBQVksQ0FBbEYsRUFBcUYsT0FBT1csT0FBUDtTQUM5RVEscUJBQVAsQ0FBNkJQLElBQTdCOztNQUdJN0QsTUFBTU0sR0FBTixHQUFZLENBQWhCLEVBQW1CO21CQUNGNEQsRUFBaEI7T0FDSTFCLGVBQWV4QyxNQUFNTyxFQUF6QixFQUE2QmlDLGVBQWUsQ0FBZixDQUE3QixLQUNLOzs7O0VBckJQOztLQTRCTTZCLFFBQVEsU0FBUkEsS0FBUSxHQUFNO01BQ2Y1QixTQUFTLENBQWIsRUFBZ0I7U0FDVHdCLFlBQVlELEdBQVosRUFBUDtTQUNPSSxxQkFBUCxDQUE2QlAsSUFBN0I7T0FDSyxvQkFBTDtFQUpEOztRQVFPUyxnQkFBUCxDQUF3QixXQUF4QixFQUFxQyxVQUFDQyxDQUFELEVBQU87V0FDbENBLEVBQUVDLE9BQUYsR0FBWWxDLE1BQXJCO1dBQ1NpQyxFQUFFRSxPQUFGLEdBQVlsQyxNQUFyQjtXQUNTZ0MsRUFBRUMsT0FBWDtXQUNTRCxFQUFFRSxPQUFYOzs7RUFKRDs7S0FXTUMsZ0JBQWdCLFNBQWhCQSxhQUFnQixDQUFDQyxVQUFELEVBQWdCO01BQy9CQyxNQUFNRCxXQUFXRSxNQUFYLEdBQW9CLENBQWhDO01BQ0lDLEtBQUssQ0FBVDtNQUNDQyxLQUFLLENBRE47T0FFSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlKLEdBQXBCLEVBQXlCSSxHQUF6QixFQUE4QjtTQUN2QkwsV0FBV0ssQ0FBWCxJQUFnQkwsV0FBV0ssSUFBSUosTUFBTSxDQUFyQixDQUF0QjtTQUNNRCxXQUFXSyxJQUFJSixHQUFmLElBQXNCRCxXQUFXSyxJQUFJSixNQUFNLENBQXJCLENBQTVCOztPQUVJLElBQUtFLEtBQUtGLEdBQU4sR0FBYSxDQUF0QjtPQUNLLElBQUtHLEtBQUtILEdBQU4sR0FBYSxDQUF0Qjs7O0VBVEQ7O0tBZ0JNSyxXQUFXLFNBQVhBLFFBQVcsR0FBTTtPQUNqQkMsS0FBTCxDQUFXQyxlQUFYLFlBQW9DbkYsTUFBTW9GLEtBQTFDO01BQ0lwRixNQUFNcUYsR0FBVixFQUFleEUsS0FBS3FFLEtBQUwsQ0FBV0ksZUFBWCxvQkFBNEN0RixNQUFNcUYsR0FBbEQ7RUFGaEI7OztRQU9PRSx5QkFBUCxHQUFtQzt3QkFBQTtxQkFBQSwrQkFRZEMsRUFSYyxFQVFWO09BQ25CQSxHQUFHQyxXQUFQLEVBQW9CO1FBQ2JDLFNBQVNGLEdBQUdDLFdBQUgsQ0FBZUUsS0FBZixDQUFxQkMsS0FBckIsQ0FBMkIsR0FBM0IsRUFBZ0NDLEdBQWhDLE1BQWY7VUFDTVQsS0FBTixHQUFjTSxPQUFPSSxJQUFQLENBQVksSUFBWixDQUFkO1NBQ0ssdUNBQUwsRUFBOEM5RixNQUFNb0YsS0FBcEQ7O09BRUdJLEdBQUdPLEtBQVAsRUFBYztVQUNQVixHQUFOLEdBQVlHLEdBQUdPLEtBQUgsQ0FBU0osS0FBckI7U0FDSyw0Q0FBTCxFQUFtRDNGLE1BQU1xRixHQUF6RDs7OztFQWhCSDs7UUF1Qk9XLDhCQUFQLENBQXNDdEIsYUFBdEM7O01BRVF0RixPQUFSLFVBQW9CNkcsc0JBQXBCO0NBbExEOztBQXFMQS9GLFNBQVNvRSxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMzRCxJQUE5QyxFQUFvRCxLQUFwRDs7In0=
