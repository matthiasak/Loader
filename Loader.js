(function() {
    var d = !1,
        g = /xyz/.test(function() {
            xyz
        }) ? /\b_super\b/ : /.*/;
    this.Class = function() {};
    Class.extend = function(b) {
        function c() {
            !d && this.init && this.init.apply(this, arguments)
        }
        var e = this.prototype;
        d = !0;
        var f = new this;
        d = !1;
        for(var a in b) f[a] = "function" == typeof b[a] && "function" == typeof e[a] && g.test(b[a]) ?
        function(a, b) {
            return function() {
                var c = this._super;
                this._super = e[a];
                var d = b.apply(this, arguments);
                this._super = c;
                return d
            }
        }(a, b[a]) : b[a];
        c.prototype = f;
        c.prototype.constructor = c;
        c.extend = arguments.callee;
        return c
    }
})();

var _Loader = function($) {
        return Class.extend({
            init: function() {
                this.scripts = {};
                this.templates = {};
                this.cache = {};

                this.clear(true);
            },
            tmpl: function tmpl(str, data) {
                str = str || '';
                // Figure out if we're getting a template, or if we need to
                // load the template - and be sure to cache the result.
                var fn = !/\W/.test(str) ? this.cache[str] = this.cache[str] || this.tmpl(document.getElementById(str).innerHTML) :

                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" +

                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +

                // Convert the template into pure JavaScript
                str.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");

                // Provide some basic currying to the user
                return data ? fn(data) : fn;
            },
            head: document.head || document.getElementsByTagName('head')[0],
            storagePrefix: 'loader-',
            templatePrefix: 'template-',
            cssPrefix: 'css-',
            defaultExpiration: 5000,
            set_storage: function(key, storeObj) {
                try {
                    localStorage.setItem(this.storagePrefix + key, JSON.stringify(storeObj));
                    return true;
                } catch(e) {
                    return false;
                }
            },
            wrapStoreData: function(obj) {
                var now = +new Date();
                obj.stamp = now;
                obj.expire = now + ((obj.expire || this.defaultExpiration) * 60 * 60 * 1000);
                return obj;
            },
            injectCSS: function(text){
                var style = document.createElement('style');
                // Have to use .text, since we support IE8,
                // which won't allow appending to a script
                style.textContent = text;
                this.head.appendChild(style);
            },
            injectScript: function(text) {
                var script = document.createElement('script');
                script.defer = true;
                // Have to use .text, since we support IE8,
                // which won't allow appending to a script
                script.text = text;
                this.head.appendChild(script);
            },
            injectCSSByUrl: function(url, style){
                style.href = url;
                this.head.appendChild(style);
                return $(style);
            },
            injectScriptByUrl: function(url, script, fn) {
                script.defer = true;
                script.type = "text/javascript";
                // Have to use .text, since we support IE8,
                // which won't allow appending to a script
                script.src = url;
                script.onload = fn;
                script.onreadystatechange = fn;
                this.head.appendChild(script);
                return $(script);
            },
            getUrl: function(url) {
                var xhr = new XMLHttpRequest();
                var promise = new $.Deferred();
                xhr.open('GET', url);

                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            promise.resolve(xhr.responseText);
                        } else {
                            promise.reject(new Error(xhr.statusText));
                        }
                    }
                };

                xhr.send();

                return promise.promise();
            },
            prepScripts: function(obj, i, dfds) {
                if(!obj.url) {
                    return;
                }

                var hasHttp = obj.url.indexOf('http://') != -1,
                    hasHttps = obj.url.indexOf('https://') != -1,
                    hasSlashSlash = obj.url.indexOf('//') != -1,
                    startsWithSlash = obj.url.charAt(0) == '/';
                    
                if(!hasHttp && !hasHttps && !hasSlashSlash && !startsWithSlash) {
                    obj.url = "//" + obj.url;
                }

                obj.key = obj.key || obj.url;
                var source = this.get(obj.key),
                    self = this,
                    dfd = new $.Deferred(),
                    script;

                if(!source || source.expire - +new Date() < 0 || obj.unique !== source.unique) {
                    if(obj.unique) {
                        // set parameter to prevent browser cache
                        obj.url += ((obj.url.indexOf('?') > 0) ? '&' : '?') + 'loader-cachebust=' + obj.unique;
                    }
                    if(obj.CORS || (new RegExp(location.origin)).test(obj.url) || obj.url.indexOf('//') == -1) {
                        $.get(obj.url, null, null, 'script').then(function(data, success, promise) {
                            self.injectScript(data);
                            obj.text = data;
                            self.set_storage(obj.key, obj);
                            dfd.resolve();
                        })
                    } else {
                        this.injectScriptByUrl(obj.url, (script = document.createElement('script')), function() {
                            if(!script.readyState || /loaded|complete/.test(script.readyState)) {
                                // Handle memory leak in IE
                                script.onload = script.onreadystatechange = null;
                                dfd.resolve();
                            } else {
                                dfd.reject();
                            }
                        });
                    }
                } else {
                    dfd.resolve();
                    this.injectScript(source.text);
                }
                dfds[i] = dfd.promise();
            },
            _load: function(script_objects) {
                var self = this,
                    source, obj, dfds = [];

                for(var script in script_objects) {
                    this.prepScripts(this.wrapStoreData(script_objects[script]), script, dfds);
                }

                return $.when.apply($, dfds);
            },
            load: function() {
                var scripts = Array.prototype.slice.call(arguments);
                return this._load.call(this, scripts);
            },
            get: function(key) {
                try {
                    var item = window.localStorage.getItem(this.storagePrefix + key);
                    return $.parseJSON(item || 'false');
                } catch(e) {
                    return false;
                }
            },
            clear: function(expired) {
                var item, key;
                var now = +new Date();

                for(item in localStorage) {
                    key = item.split(this.storagePrefix)[1];
                    if(key && (!expired || this.get(key).expire <= now)) {
                        this.remove(key);
                    }
                }

                return this;
            },
            remove: function(key) {
                localStorage.removeItem(this.storagePrefix + key);
                return this;
            },
            _template: function(el, i, dfds) {
                var self = this,
                    source = this.get(this.templatePrefix+el);

                if(source) {
                    dfds[i] = self.tmpl(source);
                    return;
                }

                dfds[i] = $.get(el).pipe(function(templateContent) {
                    self.set_storage(self.templatePrefix + el, templateContent);
                    return self.tmpl(self.get(self.templatePrefix + el));
                });
            },
            template: function() {
                var args = Array.prototype.slice.call(arguments),
                    dfds = [],
                    self = this;
                if(!args.length) {
                    var dfd = $.Deferred();
                    dfd.fail();
                    return dfd.promise();
                }
                for(var i in args) {
                    this._template(args[i], i, dfds);
                }
                return $.when.apply($, dfds);
            },
            prepCSS: function(obj, i, dfds) {
                if(!obj.url) {
                    return;
                }

                var hasHttp = obj.url.indexOf('http://'),
                    hasHttps = obj.url.indexOf('https://'),
                    hasSlashSlash = obj.url.indexOf('//');

                if(!hasHttp && !hasHttps && !hasSlashSlash) {
                    obj.url = "//" + obj.url;
                }

                obj.key = obj.key || obj.url;
                var source = this.get(this.cssPrefix + obj.key),
                    self = this,
                    dfd = new $.Deferred(),
                    css;
                
                if(!source || source.expire - +new Date() < 0 || obj.unique !== source.unique) {
                    if(obj.unique) {
                        // set parameter to prevent browser cache
                        obj.url += ((obj.url.indexOf('?') > 0) ? '&' : '?') + 'loader-cachebust=' + obj.unique;
                    }
                    if(obj.CORS || (new RegExp(location.origin)).test(obj.url) || obj.url.indexOf('//') == -1) {
                        $.get(obj.url).then(function(data, success, promise) {
                            data = self.cssmin(data, 800);
                            self.injectCSS(data);
                            obj.text = data;
                            self.set_storage(self.cssPrefix + obj.key, obj);
                            dfd.resolve();
                        })
                    } else {
                        this.injectCSSByUrl(obj.url, (css = document.createElement('style')), function() {
                            if(!css.readyState || /loaded|complete/.test(css.readyState)) {
                                // Handle memory leak in IE
                                // css.onload = css.onreadystatechange = null;
                                dfd.resolve();
                            } else {
                                dfd.reject();
                            }
                        });
                        dfd.resolve();
                    }
                } else {
                    this.injectCSS(source.text);
                    dfd.resolve();
                }
                dfds[i] = dfd.promise();
            },
            css: function () {
                var css = Array.prototype.slice.call(arguments);
                return this._css.call(this, css);
            },
            _css: function(css_objects) {
                var self = this,
                    source, obj, dfds = [];

                for(var css in css_objects) {
                    this.prepCSS(this.wrapStoreData(css_objects[css]), css, dfds);
                }

                return $.when.apply($, dfds);
            },
            cssmin: function (css, linebreakpos) {
                var startIndex = 0, 
                    endIndex = 0,
                    iemac = false,
                    preserve = false,
                    i = 0, max = 0,
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
                            token = css.slice(startIndex+3, endIndex); // 3 is "/*!".length
                            preservedTokens.push(token);
                            css = css.slice(0, startIndex+2) + "___YUICSSMIN_PRESERVED_TOKEN_" + (preservedTokens.length - 1) + "___" + css.slice(endIndex);
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
                css = css.replace(/rgb\s*\(\s*([0-9,\s]+)\s*\)/gi, function(){
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
                css = css.replace(/([^"'=\s])(\s*)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi, function(){ 
                    var group = arguments;
                    if (
                        group[3].toLowerCase() === group[4].toLowerCase() &&
                        group[5].toLowerCase() === group[6].toLowerCase() &&
                        group[7].toLowerCase() === group[8].toLowerCase()
                    ) {
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
                for(i = 0, max = preservedTokens.length; i < max; i++) {
                    css = css.replace("___YUICSSMIN_PRESERVED_TOKEN_" + i + "___", preservedTokens[i]);
                }
                
                // Trim the final string (for any leading or trailing white spaces)
                css = css.replace(/^\s+|\s+$/g, "");

                return css;
            }
        });
    };

var browser = (typeof exports === 'undefined');
if(!browser) {
    module.exports = function($) {
        return {
            Loader: _Loader($)
        };
    }
} else {
    window.Loader = _Loader($);
}