(function() {
    var initializing = false,
        fnTest = /xyz/.test(function() {
            xyz;
        }) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function() {};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
                return function() {
                    var tmp = this._super;

                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];

                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;

                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }

        // The dummy class constructor

        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.init) this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

;(function(win, undef) {
    var Loader = Class.extend({
        init: function() {
            this.head = document.head || document.getElementsByTagName('head')[0];
            if (window.addEventListener) {
                window.addEventListener("storage", this.localStorageEventHandler, false);
            } else {
                window.attachEvent("onstorage", this.localStorageEventHandler);
            }
        },
        localStorageEventHandler: function(e) {
            var event = e || window.event
                , data = {
                    name: event.key
                    , _old: event.oldValue
                    , _new: event.newValue
                    , url: event.url || event.uri
                };

            console.log(data.url, ": ", data.name, " triggered a change. \n\n", "\told value: ", data._old, "\tnew value: ", data._new);
        },
        promise: (function() {
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
                    for (var a = b.length, e = 0, j = new k, g = [], f = [], d = 0; d < a; d++) b[d]().then(c(d));
                    return j
                },
                chain: l,
                ajax: n,
                ENOXHR: 1,
                ETIMEOUT: 2,
                ajaxTimeout: 5000
            }, m;
            for (m in p) p.hasOwnProperty(m) && (this[m] = p[m]);
            return this;
        })(),
        set: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                if (e.name === "QUOTA_EXCEEDED_ERR") {
                    console.log("Oh no! We ran out of room!");
                }
                return false;
            }
        },
        get: function(key) {
            var data = JSON.parse(localStorage.getItem(key) || 'false');
            return data;
        },
        clear: function(shoudlClearAll) {
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
        },
        clearAll: function(){
            this.clear(true);
        },
        remove: function(key) {
            localStorage.removeItem(key);
            return this;
        },
        cssmin: function(css, linebreakpos) {
            var startIndex = 0,
                endIndex = 0,
                iemac = false,
                preserve = false,
                i = 0,
                max = 0,
                preservedTokens = [],
                token = '';

            // preserve strings so their content doesn't get accidentally minified
            css = css.replace(/("([^\\"]|\\.|\\)*")|('([^\\']|\\.|\\)*')/g, function(match) {
                var quote = match[0];
                preservedTokens.push(match.slice(1, -1));
                return quote + "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___" + quote;
            });

            // Remove all comment blocks...
            while ((startIndex = css.indexOf("/*", startIndex)) >= 0) {
                preserve = css.length > startIndex + 2 && css[startIndex + 2] === '!';
                endIndex = css.indexOf("*/", startIndex + 2);
                if (endIndex < 0) {
                    if (!preserve) {
                        css = css.slice(0, startIndex);
                    }
                } else if (endIndex >= startIndex + 2) {
                    if (css[endIndex - 1] === '\\') {
                        // Looks like a comment to hide rules from IE Mac.
                        // Leave this comment, and the following one, but shorten them
                        css = css.slice(0, startIndex) + "/*\\*/" + css.slice(endIndex + 2);
                        startIndex += 5;
                        iemac = true;
                    } else if (iemac && !preserve) {
                        css = css.slice(0, startIndex) + "/**/" + css.slice(endIndex + 2);
                        startIndex += 4;
                        iemac = false;
                    } else if (!preserve) {
                        css = css.slice(0, startIndex) + css.slice(endIndex + 2);
                    } else {
                        // preserve
                        token = css.slice(startIndex + 3, endIndex); // 3 is "/*!".length
                        preservedTokens.push(token);
                        css = css.slice(0, startIndex + 2) + "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___" + css.slice(endIndex);
                        if (iemac) iemac = false;
                        startIndex += 2;
                    }
                }
            }

            // Normalize all whitespace strings to single spaces. Easier to work with that way.
            css = css.replace(/\s+/g, " ");

            // Remove the spaces before the things that should not have spaces before them.
            // But, be careful not to turn "p :link {...}" into "p:link{...}"
            // Swap out any pseudo-class colons with the token, and then swap back.
            css = css.replace(/(^|\})(([^\{:])+:)+([^\{]*\{)/g, function(m) {
                return m.replace(":", "___YUICSSMIN_PSEUDOCLASSCOLON___");
            });
            css = css.replace(/\s+([!{};:>+\(\)\],])/g, '$1');
            css = css.replace(/___YUICSSMIN_PSEUDOCLASSCOLON___/g, ":");

            // retain space for special IE6 cases
            css = css.replace(/:first-(line|letter)({|,)/g, ":first-$1 $2");

            // no space after the end of a preserved comment
            css = css.replace(/\*\/ /g, '*/');


            // If there is a @charset, then only allow one, and push to the top of the file.
            css = css.replace(/^(.*)(@charset "[^"]*";)/gi, '$2$1');
            css = css.replace(/^(\s*@charset [^;]+;\s*)+/gi, '$1');

            // Put the space back in some cases, to support stuff like
            // @media screen and (-webkit-min-device-pixel-ratio:0){
            css = css.replace(/\band\(/gi, "and (");


            // Remove the spaces after the things that should not have spaces after them.
            css = css.replace(/([!{}:;>+\(\[,])\s+/g, '$1');

            // remove unnecessary semicolons
            css = css.replace(/;+}/g, "}");

            // Replace 0(px,em,%) with 0.
            css = css.replace(/([\s:])(0)(px|em|%|in|cm|mm|pc|pt|ex)/gi, "$1$2");

            // Replace 0 0 0 0; with 0.
            css = css.replace(/:0 0 0 0;/g, ":0;");
            css = css.replace(/:0 0 0;/g, ":0;");
            css = css.replace(/:0 0;/g, ":0;");
            // Replace background-position:0; with background-position:0 0;
            css = css.replace(/background-position:0;/gi, "background-position:0 0;");

            // Replace 0.6 to .6, but only when preceded by : or a white-space
            css = css.replace(/(:|\s)0+\.(\d+)/g, "$1.$2");

            // Shorten colors from rgb(51,102,153) to #336699
            // This makes it more likely that it'll get further compressed in the next step.
            css = css.replace(/rgb\s*\(\s*([0-9,\s]+)\s*\)/gi, function() {
                var rgbcolors = arguments[1].split(',');
                for (var i = 0; i < rgbcolors.length; i++) {
                    rgbcolors[i] = parseInt(rgbcolors[i], 10).toString(16);
                    if (rgbcolors[i].length === 1) {
                        rgbcolors[i] = '0' + rgbcolors[i];
                    }
                }
                return '#' + rgbcolors.join('');
            });


            // Shorten colors from #AABBCC to #ABC. Note that we want to make sure
            // the color is not preceded by either ", " or =. Indeed, the property
            //     filter: chroma(color="#FFFFFF");
            // would become
            //     filter: chroma(color="#FFF");
            // which makes the filter break in IE.
            css = css.replace(/([^"'=\s])(\s*)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi, function() {
                var group = arguments;
                if (
                group[3].toLowerCase() === group[4].toLowerCase() && group[5].toLowerCase() === group[6].toLowerCase() && group[7].toLowerCase() === group[8].toLowerCase()) {
                    return (group[1] + group[2] + '#' + group[3] + group[5] + group[7]).toLowerCase();
                } else {
                    return group[0].toLowerCase();
                }
            });


            // Remove empty rules.
            css = css.replace(/[^\};\{\/]+\{\}/g, "");

            if (linebreakpos >= 0) {
                // Some source control tools don't like it when files containing lines longer
                // than, say 8000 characters, are checked in. The linebreak option is used in
                // that case to split long lines after a specific column.
                startIndex = 0;
                i = 0;
                while (i < css.length) {
                    if (css[i++] === '}' && i - startIndex > linebreakpos) {
                        css = css.slice(0, i) + '\n' + css.slice(i);
                        startIndex = i;
                    }
                }
            }

            // Replace multiple semi-colons in a row by a single one
            // See SF bug #1980989
            css = css.replace(/;;+/g, ";");

            // restore preserved comments and strings
            for (i = 0, max = preservedTokens.length; i < max; i++) {
                css = css.replace("___YUICSSMIN_PRESERVED_TOKEN_" + i + "___", preservedTokens[i]);
            }

            // Trim the final string (for any leading or trailing white spaces)
            css = css.replace(/^\s+|\s+$/g, "");

            return css;
        },
        addExpiration: function(obj) {
            var now = +new Date();
            obj.stamp = now;
            obj.expire = now + ((obj.expire || this.defaultExpiration) * 60 * 60 * 1000);
        },
        isJS: function(url){
            var isJS = url.indexOf('.js') != -1;
            return isJS;
        },
        isCSS: function(url) {
            var isCSS = url.indexOf('.css') != -1;
            return isCSS;
        },
        isTMPL: function(url){
            var isTMPL = url.indexOf('.tmpl') != -1;
            return isTMPL;
        },
        injectScriptTagByText: function(text) {
            var script = document.createElement('script');
            script.async = true;
            script.text = text;
            this.head.appendChild(script);
        },
        injectStyleTagByText: function(text) {
            var style = document.createElement('style');
            style.textContent = text;
            this.head.appendChild(style);
        },
        injectScriptTagBySrc: function(url, promise) {
            var script = document.createElement('script');
            script.async = true;
            script.src = url;
            script.onload = script.onreadystatechange = function() {
                promise.done();
            };
            this.head.appendChild(script);
        },
        injectStyleTagBySrc: function(url) {
            var style = document.createElement('link');
            style.href = url;
            this.head.appendChild(style);
        },
        replaceRelativeURLWithFullURL: function(segments, url_fragment, text) {
            if (segments.length > 1) {
                return text.replace(segments[0], 'url(' + url_fragment + '/..' + segments[1] + ')');
            }
            return text;
        },
        replaceURLs: function(url, text) {
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
        },
        load: function( /* files to load */ ) {
            var args = [].slice.call(arguments),
                len = args.length,
                promises = [],
                promise;

            for(var i=0; i<len; i++){
                promises.push( this.loadFile(args[i]) );
            }

            promise = this.promise.join.apply(this.promise, promises);
            promise.done();

            return promise;
        },
        loadFile: function(file){
            var url = file.url,
                name = file.name,
                self = this;

            if(this.fileShouldBeRefreshed(url)){
                return this.handleFileDownloadOrCORSAndInject(file);
            }

            return this.loadAndInjectFile(file, this.isCSS(url), this.isJS(url));
        },
        fileShouldBeRefreshed: function(url){
            var file = this.get(url);
            return !file || (file.expire > +new Date());
        },
        handleFileDownloadOrCORSAndInject: function(file){
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
        },
        loadAndInjectFile: function(file, isCSS, isJS){
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
        },
        isCORS: function(url){
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
        },
        loadAndInjectStyleTag: function(file){
            var self = this,
                url = file.url;

            return this.promise.get(url).then(function(error, result){
                self.addExpiration(file);
                file.text = self.replaceURLs(url, self.cssmin(result));
                self.set(url, file);
                self.injectStyleTagByText(result);
            });
        },
        loadAndInjectScriptTag: function(file){
            var self = this,
                url = file.url;
            return this.promise.get(url).then(function(error, result){
                self.addExpiration(file);
                file.text = result;
                self.set(url, file);
                self.injectScriptTagByText(result);
            });
        }
    });
    win.Loader = Loader;
})(window, undefined);
