;(function(win, undef) {
    function Loader(build_id){
        this.init();
        this.build = this.get('build_id');
        if(build_id && build_id != this.build){
            this.build = build_id;
            this.clear(true);
            this.set('build_id', build_id);
        } else {
            this.clear();
        }
    }

    Loader.prototype.init = function(){
        this.head = document.head || document.getElementsByTagName('head')[0];
        if (window.addEventListener) {
            window.addEventListener("storage", this.localStorageEventHandler, false);
        } else {
            window.attachEvent("onstorage", this.localStorageEventHandler);
        }
        this.defaultExpiration = 24*7; //hours
    };

    Loader.prototype.localStorageEventHandler = function(e) {
        var event = e || window.event
            , data = {
                name: event.key
                , _old: event.oldValue
                , _new: event.newValue
                , url: event.url || event.uri
            };

        console.log(data.url, ": ", data.name, " triggered a change. \n\n", "\told value: ", data._old, "\tnew value: ", data._new);
    };

    Loader.prototype.promise = (function() {
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
                g.done(this.promise.ETIMEOUT, "")
            }
            var g = new k,
                f, d;
            a = a || {};
            e = e || {};
            try {
                var h;
                if (window.XMLHttpRequest) h = new XMLHttpRequest;
                else if (window.ActiveXObject) try {
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
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            if (e.name === "QUOTA_EXCEEDED_ERR") {
                console.log("Oh no! We ran out of room!");
            }
            return false;
        }
    };

    Loader.prototype.get = function(key) {
        var data = JSON.parse(localStorage.getItem(key) || 'false');
        return data;
    };

    Loader.prototype.clear = function(shoudlClearAll) {
        if (!localStorage) return this;

        var item, key;
        var now = +new Date();

        for (key in localStorage) {
            obj = this.get(key);

            if (shoudlClearAll || obj && obj.expire <= now) {
                this.remove(key);
            }
        }

        return this;
    };

    Loader.prototype.clearAll = function(){
        this.clear(true);
    };

    Loader.prototype.remove = function(key) {
        localStorage.removeItem(key);
        return this;
    };

    Loader.prototype.addExpiration = function(obj) {
        var now = +new Date();
        obj.stamp = now;
        obj.expire = now + ((obj.expire || this.defaultExpiration) * 60 * 60 * 1000);
    };

    Loader.prototype.isJS = function(url){
        var isJS = url.indexOf('.js') != -1;
        return isJS;
    };

    Loader.prototype.isCSS = function(url) {
        var isCSS = url.indexOf('.css') != -1;
        return isCSS;
    };

    Loader.prototype.isTMPL = function(url){
        var isTMPL = url.indexOf('.tmpl') != -1;
        return isTMPL;
    };

    Loader.prototype.injectScriptTagByText = function(text) {
        var script = document.createElement('script');
        script.async = true;
        script.text = text;
        this.head.appendChild(script);
    };

    Loader.prototype.injectStyleTagByText = function(text) {
        var style = document.createElement('style');
        style.textContent = text;
        this.head.appendChild(style);
    };

    Loader.prototype.injectScriptTagBySrc = function(url, promise) {
        var script = document.createElement('script');
        script.async = true;
        script.src = url;
        script.onload = script.onreadystatechange = function() {
            promise.done();
        };
        this.head.appendChild(script);
    };

    Loader.prototype.injectStyleTagBySrc = function(url) {
        var style = document.createElement('link');
        style.href = url;
        this.head.appendChild(style);
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

    Loader.prototype.load = function( /* files to load */ ) {
        var args = [].slice.call(arguments),
            len = args.length,
            promises = [],
            self = this,
            p;

        for(var i=0; i<len; i++){
            promises.push(
                (function(file){
                    return function(){ return self.loadFile(file); };
                })(args[i])
            );
        }

        return this.promise.join(promises);
    };

    Loader.prototype.loadFile = function(file){
        var url = file.url,
            name = file.name,
            self = this;

        if(this.fileShouldBeRefreshed(url)){
            return this.handleFileDownloadOrCORSAndInject(file);
        }

        return this.loadAndInjectFile(file, this.isCSS(url), this.isJS(url));
    };

    Loader.prototype.fileShouldBeRefreshed = function(url){
        var file = this.get(url);
        return !file || (file.expire > +new Date());
    };

    Loader.prototype.handleFileDownloadOrCORSAndInject = function(file){
        var url = file.url,
            name = file.name,
            isCSS = this.isCSS(url),
            isJS = this.isJS(url),
            promise = new this.promise.Promise();

        if(this.isCORS(url)){
            if(url.indexOf('//') === -1){
                url = '//'+url;
            }
            if(isCSS){
                this.injectStyleTagBySrc(url);
                promise.done();
            } else if(isJS){
                this.injectScriptTagBySrc(url, promise);
            }
            return promise;
        } else {
            return this.loadAndInjectFile(file, isCSS, isJS);
        }
    };

    Loader.prototype.loadAndInjectFile = function(file, isCSS, isJS){
        var url = file.url,
            name = file.name,
            hasProtocol = url.indexOf('//'),
            _file = this.get(url);

        if(!_file){
            if(hasProtocol === -1){
                url = '//'+url;
            }
            if(isCSS){
                return this.loadAndInjectStyleTag(file);
            } else if (isJS){
                return this.loadAndInjectScriptTag(file);
            }
        } else {
            var promise = new this.promise.Promise();
            promise.done();
            if(isCSS){
                this.injectStyleTagByText(_file.text);
            } else if(isJS){
                this.injectScriptTagByText(_file.text);
            }
            return promise;
        }
    };

    Loader.prototype.isCORS = function(url){
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

            if( hostname.indexOf(window.location.host)!==-1 ){
                isLocal = true;
            }
        }

        return !isLocal;
    };

    Loader.prototype.loadAndInjectStyleTag = function(file){
        var self = this,
            url = file.url,
            p = new this.promise.Promise();

        this.promise.get(url).then(function(error, result){
            self.addExpiration(file);
            file.text = self.replaceURLs(url, result);
            self.set(url, file);
            self.injectStyleTagByText(result);
            setTimeout(function(){
                p.done();
            }, 0);
        });

        return p;
    };

    Loader.prototype.loadAndInjectScriptTag = function(file){
        var self = this,
            url = file.url,
            p = new this.promise.Promise();

        this.promise.get(url).then(function(error, result){
            self.addExpiration(file);
            file.text = result;
            self.set(url, file);
            self.injectScriptTagByText(result);
            p.done();
        });

        return p;
    };

    win.Loader = Loader;
})(window, undefined);
