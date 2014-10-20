;(function(win, undef) {
    !(console && console.log) && (window.console = {
        log: function() {}
    });

    function Loader(options) {
        options = options || {};
        this.init(options);
    }

    Loader.prototype.loadedItems = {};
    Loader.prototype.globalCache = {};

    Loader.prototype.init = function(options) {
        this.textInjection = options.textInjection;
        this.build = this.get('build_id');

        if (!this.textInjection || !this.build || this.build < this.expiredTimestamp) {
            this.build = +new Date();
            this.set('build_id', this.build);
        }

        this.head = document.head || document.getElementsByTagName('head')[0];
        this.defaultExpiration = 1; //hours
        this.expiredTimestamp = +new Date() - this.defaultExpiration * 60 * 60 * 1000;
    };

    Loader.prototype.promise = (function() {
        var a = this;

        function b() {
            this._callbacks = [];
        }
        b.prototype.then = function(a, c) {
            var d;
            if (this._isdone) d = a.apply(c, this.result);
            else {
                d = new b();
                this._callbacks.push(function() {
                    var b = a.apply(c, arguments);
                    if (b && typeof b.then === 'function') b.then(d.done, d);
                });
            }
            return d;
        };
        b.prototype.done = function() {
            this.result = arguments;
            this._isdone = true;
            for (var a = 0; a < this._callbacks.length; a++) this._callbacks[a].apply(null, arguments);
            this._callbacks = [];
        };

        function c(a) {
            var c = new b();
            var d = [];
            if (!a || !a.length) {
                c.done(d);
                return c;
            }
            var e = 0;
            var f = a.length;

            function g(a) {
                return function() {
                    e += 1;
                    d[a] = Array.prototype.slice.call(arguments);
                    if (e === f) c.done(d);
                };
            }
            for (var h = 0; h < f; h++) a[h].then(g(h));
            return c;
        }

        function d(a, c) {
            var e = new b();
            if (a.length === 0) e.done.apply(e, c);
            else a[0].apply(null, c).then(function() {
                a.splice(0, 1);
                d(a, arguments).then(function() {
                    e.done.apply(e, arguments);
                });
            });
            return e;
        }

        function e(a) {
            var b = "";
            if (typeof a === "string") b = a;
            else {
                var c = encodeURIComponent;
                for (var d in a)
                    if (a.hasOwnProperty(d)) b += '&' + c(d) + '=' + c(a[d]);
            }
            return b;
        }

        function f() {
            var a;
            if (window.XMLHttpRequest) a = new XMLHttpRequest();
            else if (window.ActiveXObject) try {
                a = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (b) {
                a = new ActiveXObject("Microsoft.XMLHTTP");
            }
            return a;
        }

        function g(a, c, d, g, bust_http_cache) {
            var h = new b();
            var j, k;
            d = d || {};
            g = g || {};
            try {
                j = f();
            } catch (l) {
                h.done(i.ENOXHR, "");
                return h;
            }
            k = e(d);
            if (a === 'GET' && k) {
                c += '?' + k;
                k = null;
            }
            if (bust_http_cache) {
                var amp = c.indexOf('?') !== -1 ? '&' : '?';
                c += amp + '_t=' + (+new Date);
            }
            j.open(a, c);
            j.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            for (var m in g)
                if (g.hasOwnProperty(m)) j.setRequestHeader(m, g[m]);

            function n() {
                j.abort();
                h.done(i.ETIMEOUT, "", j);
            }
            var o = i.ajaxTimeout;
            if (o) var p = setTimeout(n, o);
            j.onreadystatechange = function() {
                if (o) clearTimeout(p);
                if (j.readyState === 4) {
                    var a = (!j.status || (j.status < 200 || j.status >= 300) && j.status !== 304);
                    h.done(a, j.responseText, j);
                }
            };
            j.send(k);
            return h;
        }

        function h(a) {
            return function(b, c, d, bust_http_cache) {
                return g(a, b, c, d, bust_http_cache);
            };
        }
        var i = {
            Promise: b,
            join: c,
            chain: d,
            ajax: g,
            get: h('GET'),
            post: h('POST'),
            put: h('PUT'),
            del: h('DELETE'),
            ENOXHR: 1,
            ETIMEOUT: 2,
            ajaxTimeout: 0
        };
        return i;
    })();

    Loader.prototype.set = function(key, data) {
        if (window.localStorage) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                if (e.name === "QUOTA_EXCEEDED_ERR") {
                    console.log("Oh no! We ran out of room!");
                } else {
                    console.log(e);
                }
                return false;
            }
        } else {
            this.globalCache[key] = data;
        }
    };

    Loader.prototype.get = function(key) {
        if (window.localStorage) {
            var data = JSON.parse(localStorage.getItem(key) || 'false');
            return data;
        } else {
            return this.globalCache[key];
        }
    };

    Loader.prototype.has = function(key) {
        if (window.localStorage) {
            return (key in localStorage);
        } else {
            return (key in globalCache);
        }
    };

    Loader.prototype.clear = function(key) {
        if (window.localStorage) {
            this.remove(key);
        } else {
            this.globalCache[key] = null;
        }
    };

    Loader.prototype.clearAll = function() {
        if (window.localStorage) {
            for (key in localStorage) {
                this.clear(key);
            }
        } else {
            for (key in this.globalCache) {
                this.globalCache[key] = null;
            }
        }
    };

    Loader.prototype.remove = function(key) {
        if (window.localStorage) {
            localStorage.removeItem(key);
        } else {
            this.globalCache[key] = null;
        }
        return this;
    };

    Loader.prototype.addExpiration = function(obj) {
        var now = +new Date();
        obj.stamp = now;
    };

    Loader.prototype.isJS = function(url) {
        var isJS = url.indexOf('.js') != -1;
        return isJS;
    };

    Loader.prototype.isCSS = function(url) {
        var isCSS = url.indexOf('.css') != -1;
        return isCSS;
    };

    Loader.prototype.injectScriptTagByText = function(text, promise) {
        eval.call(window, text);
        setTimeout(function() {
            promise && promise.done();
        }, 0);
    };

    Loader.prototype.injectStyleTagByText = function(text, promise) {
        var style = document.createElement('style');
        style.textContent = text;
        this.head.appendChild(style);
        setTimeout(function() {
            promise && promise.done();
        }, 0);
    };

    Loader.prototype.injectScriptTagBySrc = function(url, promise) {
        var script = document.createElement('script');
        script.src = url;
        var cb = function() {
            setTimeout(function() {
                promise && promise.done();
            }, 0);
        };
        if (script.addEventListener) {
            script.addEventListener("load", cb, false);
        } else if (script.readyState) {
            script.onreadystatechange = cb;
        }
        this.head.appendChild(script);
    };

    Loader.prototype.injectStyleTagBySrc = function(url, promise) {
        var style = document.createElement('link');
        style.href = url;
        style.rel = "stylesheet";
        this.head.appendChild(style);
        setTimeout(function() {
            promise && promise.done();
        }, 0);
    };

    Loader.prototype.replaceRelativeURLWithFullURL = function(segments, url_fragment, text) {
        if (segments.length > 1) {
            return text.replace(segments[0], 'url(' + url_fragment + '/..' + segments[1] + ')');
        }
        return text;
    };

    Loader.prototype.replaceURLs = function(url, text) {
        var regex = /url\(\s*['"]*\s*\.\.([^)]+)\s*['"]*\s*\)/g,
            regex2 = /url\(\s*['"]*\s*\.\.([^)]+)\s*['"]*\s*\)/,
            urls = text.match(regex),
            _url = url.split('/');

        _url.pop();
        _url = _url.join('/');

        for (var i in urls) {
            text = this.replaceRelativeURLWithFullURL(urls[i].match(regex2), _url, text);
        }

        return text;
    };

    function convertToArray(iterable) {
        if (!iterable) return [];
        var length = iterable.length || 0,
            results = new Array(length);
        while (length--) results[length] = iterable[length];
        return results;
    }

    function forEach(array, cb) {
        for (var i = 0, len = array.length; i < len; i++) {
            cb(array[i], i);
        }
    }

    Loader.prototype.load = function( /* files to load */ ) {
        var args = [].slice.call(arguments),
            len = args.length,
            promises = [],
            self = this;

        forEach(convertToArray(args), function(file) {
            if (!self.loadedItems[file.url]) {
                self.loadedItems[file.url] = 1;
                var p = self.loadFile(file);
                if (!self.textInjection) {
                    self.clear(file.url);
                }
                promises.push(function() {
                    var _p = new self.promise.Promise();
                    self.injectFile(file, _p);
                    return _p;
                });
            }
        });

        return this.promise.chain(promises);
    };

    Loader.prototype.loadFile = function(file) {
        var url = file.url,
            promise = new this.promise.Promise(),
            self = this;

        if (this.textInjection && !this.has(url) && !this.isDifferentDomain(url)) {
            var charAt0 = url.charAt(0);
            if (charAt0 !== '/' && charAt0 !== '.') {
                url = '//' + url;
            }
            this.promise.get(url).then(function(error, result) {
                if (!error) {
                    file.text = self.replaceURLs(url, result);
                    self.set(url, file);
                }
                promise.done();
            });
        } else {
            promise.done();
        }
        return promise;
    };

    Loader.prototype.injectFile = function(file, promise) {
        var url = file.url,
            isCSS = this.isCSS(url),
            isJS = this.isJS(url);

        if (!this.textInjection || !this.has(url)) {
            var charAt0 = url.charAt(0);
            if (charAt0 !== '/' && charAt0 !== '.') {
                url = '//' + url;
            }
            if (isCSS) {
                this.injectStyleTagBySrc(url, promise);
            } else if (isJS) {
                this.injectScriptTagBySrc(url, promise);
            } else {
                promise.done();
            }
        } else {
            if (isCSS) {
                this.injectStyleTagByText(this.get(url).text, promise);
            } else if (isJS) {
                this.injectScriptTagByText(this.get(url).text, promise);
            } else {
                promise.done();
                // promise.done(null, this.get(url).text);
            }
        }
    };

    Loader.prototype.isDifferentDomain = function(url) {
        var hasProtocol = url.indexOf('//'),
            protocol = null;
        if (hasProtocol !== -1) {
            prototype = url.substr(0, hasProtocol + 2);
            url = url.substr(hasProtocol + 2);
        }

        var isLocal;

        var hasRelativeDotSlash = url.indexOf('./');
        if (hasRelativeDotSlash === 0) {
            hasRelativeDotSlash = true;
            isLocal = true;
            url = url.substr(2);
        } else {
            hasRelativeDotSlash = false;
        }

        var hasRelativeSingleSlash = url.indexOf('/');
        if (hasRelativeSingleSlash === 0) {
            isLocal = true;
            hasRelativeSingleSlash = true;
            url = url.substr(1);
        } else {
            hasRelativeSingleSlash = false;
        }

        if (!hasRelativeSingleSlash && !hasRelativeDotSlash) {
            var hasAnotherSlash = url.indexOf('/'),
                hostname,
                pathname;
            if (hasAnotherSlash !== -1) {
                hostname = url.substr(0, hasAnotherSlash);
                pathname = url.substr(hasAnotherSlash);
            } else if (url.indexOf('js') !== -1 || url.indexOf('css') !== -1 || url.indexOf('tmpl') !== -1) {
                isLocal = true;
                pathname = url;
            } else {
                hostname = url;
            }

            if (hostname.indexOf(win.location.host) !== -1) {
                isLocal = true;
            }
        }

        return !isLocal;
    };

    win.Loader = Loader;

    var tag = document.getElementById("loaderjs");
    var app = tag && (tag.getAttribute("data-app") || tag['data-app']);
    var textInjection = tag && (tag.getAttribute("textInjection") || tag['textInjection']);
    var loader = win.loader = new Loader({
        textInjection: textInjection
    });
    if (app) {
        loader.load({
            url: app
        });
    }
})(window, undefined);
