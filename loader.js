;(function(win, undef) {
    !(console && console.log) && (window.console = {log:function(){}});

    function Loader(options){
        options = options || {};

        this.init();
        this.disableTextInjection = options.disableTextInjection;
        this.build = this.get('build_id');

        if(this.disableTextInjection || !this.build || this.build < this.expiredTimestamp ){
            this.build = +new Date();
            this.clearAll();
            this.set('build_id', this.build);
        }
    }

    Loader.prototype.loadedItems = {};
    Loader.prototype.globalCache = {};

    Loader.prototype.init = function(){
        this.head = document.head || document.getElementsByTagName('head')[0];
        this.defaultExpiration = 1; //hours
        this.expiredTimestamp = +new Date() - this.defaultExpiration * 60 * 60 * 1000;
    };

    Loader.prototype.promise = (function() {
        var self = this;

        function k() {
            this._callbacks = []
        }

        function l(b, c, a) {
            var e = new k;
            0 === b.length ? e.done(c, a) : b[0](c, a).then(function(a, c) {
                b.splice(0, 1);
                l(b, a, c).then(function(a, b) {
                    e.done(a, b)
                })
            });
            return e
        }

        function n(b, c, a, e) {
            function j() {
                f.abort();
                g.done(self.ETIMEOUT, "")
            }
            var g = new k,
                f, d;
            a = a || {};
            e = e || {};
            try {
                var h;
                if (win.XMLHttpRequest) h = new XMLHttpRequest;
                else if (win.ActiveXObject) try {
                    h = new ActiveXObject("Msxml2.XMLHTTP")
                } catch (m) {
                    h = new ActiveXObject("Microsoft.XMLHTTP")
                }
                f = h
            } catch (p) {
                return g.done(-1, ""), g
            }
            h = "";
            if ("string" === typeof a) h = a;
            else {
                var l = encodeURIComponent;
                for (d in a) a.hasOwnProperty(d) && (h += "&" + l(d) + "=" + l(a[d]))
            }
            d = h;
            "GET" === b && d && (c += "?" + d, d = null);
            f.open(b, c);
            f.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            for (var q in e) e.hasOwnProperty(q) && f.setRequestHeader(q, e[q]);
            var r = this.ajaxTimeout;
            if (r) var n = setTimeout(j, r);
            f.onreadystatechange = function() {
                r && clearTimeout(n);
                4 === f.readyState && (200 === f.status ? g.done(null, f.responseText) : g.done(f.status, f.responseText))
            };
            f.send(d);
            return g
        }

        function j(b) {
            return function(c, a, e) {
                return n(b, c, a, e)
            }
        }
        k.prototype.then = function(b, c) {
            var a;
            a = function() {
                return b.apply(c, arguments)
            };
            this._isdone ? a(this.error, this.result) : this._callbacks.push(a)
        };
        k.prototype.done = function(b, c) {
            this._isdone = !0;
            this.error = b;
            this.result = c;
            for (var a = 0; a < this._callbacks.length; a++) this._callbacks[a](b, c);
            this._callbacks = []
        };
        var p = {
            get: j("GET"),
            post: j("POST"),
            put: j("PUT"),
            del: j("DELETE"),
            Promise: k,
            join: function(b) {
                function c(b) {
                    return function(c, d) {
                        e += 1;
                        g[b] = c;
                        f[b] = d;
                        e === a && j.done(g, f)
                    }
                }
                for (var a = b.length, e = 0, j = new k, g = [], f = [], d = 0; d < a; d++)
                    b[d]().then(c(d));
                return j;
            },
            chain: l,
            ajax: n,
            ENOXHR: 1,
            ETIMEOUT: 2,
            ajaxTimeout: 5000
        }, m;
        for (m in p) p.hasOwnProperty(m) && (this[m] = p[m]);
        return this;
    })();

    Loader.prototype.set = function(key, data) {
        if(window.localStorage){
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
        if(window.localStorage){
            var data = JSON.parse(localStorage.getItem(key) || 'false');
            return data;
        } else {
            return this.globalCache[key];
        }
    };

    Loader.prototype.has = function(key) {
        if(window.localStorage){
            return (key in localStorage);
        } else {
            return (key in globalCache);
        }
    };

    Loader.prototype.clear = function(key) {
        if(window.localStorage){
            this.remove(key);
        } else {
            this.globalCache[key] = null;
        }
    };

    Loader.prototype.clearAll = function(){
        if(window.localStorage){
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
        if(window.localStorage){
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

    Loader.prototype.isJS = function(url){
        var isJS = url.indexOf('.js') != -1;
        return isJS;
    };

    Loader.prototype.isCSS = function(url) {
        var isCSS = url.indexOf('.css') != -1;
        return isCSS;
    };

    Loader.prototype.injectScriptTagByText = function(text, promise) {
        eval.call(window, text);
        setTimeout(function(){
            promise && promise.done();
        }, 0);
    };

    Loader.prototype.injectStyleTagByText = function(text, promise) {
        var style = document.createElement('style');
        style.textContent = text;
        this.head.appendChild(style);
        setTimeout(function(){
            promise && promise.done();
        }, 0);
    };

    Loader.prototype.injectScriptTagBySrc = function(url, promise) {
        var script = document.createElement('script');
        script.src = url;
        var cb = function() {
            setTimeout(function(){
                promise && promise.done();
            }, 0);
        };
        if(script.addEventListener) {
            script.addEventListener("load", cb, false);
        }
        else if(script.readyState) {
            script.onreadystatechange = cb;
        }
        this.head.appendChild(script);
    };

    Loader.prototype.injectStyleTagBySrc = function(url, promise) {
        var style = document.createElement('link');
        style.href = url;
        style.rel = "stylesheet";
        this.head.appendChild(style);
        setTimeout(function(){
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

    function forEach(array, cb){
        for(var i = 0, len = array.length; i < len; i++){
            cb(array[i], i);
        }
    }

    Loader.prototype.load = function( /* files to load */ ) {
        var args = [].slice.call(arguments),
            len = args.length,
            promises = [],
            self = this;

        forEach(convertToArray(args), function(file){
            if(!self.loadedItems[file.url]) {
                self.loadedItems[file.url] = 1;
                var p = self.loadFile(file);
                promises.push(function(){
                    var _p = new self.promise.Promise();
                    self.injectFile(file, _p);
                    return _p;
                });
            }
        });

        return this.promise.chain(promises);
    };

    Loader.prototype.loadFile = function(file){
        var url = file.url,
            promise = new this.promise.Promise(),
            self = this;

        if(!this.has(url) && !this.isDifferentDomain(url)) {
            if(url.charAt(0) !== '/'){
                url = '//'+url;
            }
            this.promise.get(url).then(function(error, result){
                if(!error) {
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

    Loader.prototype.injectFile = function(file, promise){
        var url = file.url,
            isCSS = this.isCSS(url),
            isJS = this.isJS(url);

        if(!this.has(url)){
            if(url.charAt(0) !== '/'){
                url = '//'+url;
            }
            if(isCSS){
                this.injectStyleTagBySrc(url, promise);
            } else if (isJS){
                this.injectScriptTagBySrc(url, promise);
            } else {
                promise.done();
            }
        } else {
            if(isCSS){
                this.injectStyleTagByText(this.get(url).text, promise);
            } else if(isJS){
                this.injectScriptTagByText(this.get(url).text, promise);
            } else {
                promise.done();
            }
        }
    };

    Loader.prototype.isDifferentDomain = function(url){
        var hasProtocol = url.indexOf('//'),
            protocol = null;
        if(hasProtocol!==-1){
            prototype = url.substr(0, hasProtocol+2);
            url = url.substr(hasProtocol+2);
        }

        var isLocal;

        var hasRelativeDotSlash = url.indexOf('./');
        if(hasRelativeDotSlash === 0){
            hasRelativeDotSlash = true;
            isLocal = true;
            url = url.substr(2);
        } else {
            hasRelativeDotSlash = false;
        }

        var hasRelativeSingleSlash = url.indexOf('/');
        if(hasRelativeSingleSlash === 0){
            isLocal = true;
            hasRelativeSingleSlash = true;
            url = url.substr(1);
        } else {
            hasRelativeSingleSlash = false;
        }

        if(!hasRelativeSingleSlash && !hasRelativeDotSlash){
            var hasAnotherSlash = url.indexOf('/'),
                hostname,
                pathname;
            if( hasAnotherSlash !== -1 ){
                hostname = url.substr(0,hasAnotherSlash);
                pathname = url.substr(hasAnotherSlash);
            } else if( url.indexOf('js') !== -1 || url.indexOf('css') !== -1 || url.indexOf('tmpl') !== -1 ) {
                isLocal = true;
                pathname = url;
            } else {
                hostname = url;
            }

            if( hostname.indexOf(win.location.host)!==-1 ){
                isLocal = true;
            }
        }

        return !isLocal;
    };

    win.Loader = Loader;

    var tag = document.getElementById("loaderjs");
    var app = tag && (tag.getAttribute("data-app") || tag['data-app']);
    var disableTextInjection = tag && !!(tag.getAttribute("disableTextInjection") || tag['disableTextInjection']);
    var loader = win.loader = new Loader({
        disableTextInjection: disableTextInjection
    });
    if(app){
        loader.load({url:app});
    }
})(window, undefined);
