"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var idb = function (e) {
  "use strict";
  var t = void 0,
      n = void 0;var r = new WeakMap(),
      o = new WeakMap(),
      s = new WeakMap(),
      a = new WeakMap(),
      i = new WeakMap();var c = {
    get: function get(e, t, n) {
      if (e instanceof IDBTransaction) {
        if ("done" === t) return o.get(e);if ("objectStoreNames" === t) return e.objectStoreNames || s.get(e);if ("store" === t) return n.objectStoreNames[1] ? void 0 : n.objectStore(n.objectStoreNames[0]);
      }return p(e[t]);
    },
    set: function set(e, t, n) {
      return e[t] = n, !0;
    }, has: function has(e, t) {
      return e instanceof IDBTransaction && ("done" === t || "store" === t) || t in e;
    } };function u(e) {
    return e !== IDBDatabase.prototype.transaction || "objectStoreNames" in IDBTransaction.prototype ? (n || (n = [IDBCursor.prototype.advance, IDBCursor.prototype.continue, IDBCursor.prototype.continuePrimaryKey])).includes(e) ? function () {
      for (var _len = arguments.length, t = Array(_len), _key = 0; _key < _len; _key++) {
        t[_key] = arguments[_key];
      }

      return e.apply(f(this), t), p(r.get(this));
    } : function () {
      for (var _len2 = arguments.length, t = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        t[_key2] = arguments[_key2];
      }

      return p(e.apply(f(this), t));
    } : function (t) {
      for (var _len3 = arguments.length, n = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        n[_key3 - 1] = arguments[_key3];
      }

      var r = e.call.apply(e, [f(this), t].concat(n));return s.set(r, t.sort ? t.sort() : [t]), p(r);
    };
  }function d(e) {
    return "function" == typeof e ? u(e) : (e instanceof IDBTransaction && function (e) {
      if (o.has(e)) return;var t = new Promise(function (t, n) {
        var r = function r() {
          e.removeEventListener("complete", o), e.removeEventListener("error", s), e.removeEventListener("abort", s);
        },
            o = function o() {
          t(), r();
        },
            s = function s() {
          n(e.error || new DOMException("AbortError", "AbortError")), r();
        };e.addEventListener("complete", o), e.addEventListener("error", s), e.addEventListener("abort", s);
      });o.set(e, t);
    }(e), n = e, (t || (t = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction])).some(function (e) {
      return n instanceof e;
    }) ? new Proxy(e, c) : e);var n;
  }function p(e) {
    if (e instanceof IDBRequest) return function (e) {
      var t = new Promise(function (t, n) {
        var r = function r() {
          e.removeEventListener("success", o), e.removeEventListener("error", s);
        },
            o = function o() {
          t(p(e.result)), r();
        },
            s = function s() {
          n(e.error), r();
        };e.addEventListener("success", o), e.addEventListener("error", s);
      });return t.then(function (t) {
        t instanceof IDBCursor && r.set(t, e);
      }).catch(function () {}), i.set(t, e), t;
    }(e);if (a.has(e)) return a.get(e);var t = d(e);return t !== e && (a.set(e, t), i.set(t, e)), t;
  }var f = function f(e) {
    return i.get(e);
  };var l = ["get", "getKey", "getAll", "getAllKeys", "count"],
      D = ["put", "add", "delete", "clear"],
      v = new Map();function b(e, t) {
    if (!(e instanceof IDBDatabase) || t in e || "string" != typeof t) return;if (v.get(t)) return v.get(t);var n = t.replace(/FromIndex$/, ""),
        r = t !== n,
        o = D.includes(n);if (!(n in (r ? IDBIndex : IDBObjectStore).prototype) || !o && !l.includes(n)) return;var s = function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(e) {
        var _a;

        for (var _len4 = arguments.length, t = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          t[_key4 - 1] = arguments[_key4];
        }

        var s, a;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                s = this.transaction(e, o ? "readwrite" : "readonly");
                a = s.store;
                r && (a = a.index(t.shift()));
                _context.next = 5;
                return Promise.all([(_a = a)[n].apply(_a, t), o && s.done]);

              case 5:
                return _context.abrupt("return", _context.sent[0]);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function s(_x, _x2) {
        return ref.apply(this, arguments);
      };
    }();return v.set(t, s), s;
  }return c = function (e) {
    return _extends({}, e, { get: function get(t, n, r) {
        return b(t, n) || e.get(t, n, r);
      }, has: function has(t, n) {
        return !!b(t, n) || e.has(t, n);
      } });
  }(c), e.deleteDB = function (e) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var t = _ref.blocked;
    var n = indexedDB.deleteDatabase(e);return t && n.addEventListener("blocked", function () {
      return t();
    }), p(n).then(function () {});
  }, e.openDB = function (e, t) {
    var _ref2 = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var n = _ref2.blocked;
    var r = _ref2.upgrade;
    var o = _ref2.blocking;
    var s = _ref2.terminated;
    var a = indexedDB.open(e, t),
        i = p(a);return r && a.addEventListener("upgradeneeded", function (e) {
      r(p(a.result), e.oldVersion, e.newVersion, p(a.transaction));
    }), n && a.addEventListener("blocked", function () {
      return n();
    }), i.then(function (e) {
      s && e.addEventListener("close", function () {
        return s();
      }), o && e.addEventListener("versionchange", function () {
        return o();
      });
    }).catch(function () {}), i;
  }, e.unwrap = f, e.wrap = p, e;
}({});
