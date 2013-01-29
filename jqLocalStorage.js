;(function($, window){
	$.setStorage = function (key, data){
		try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch(e) {
            return false;
        }
	};

	$.existsInStorage = function(key){
		var data = $.parseJSON(localStorage.getItem(key) || 'false');
		return data;
	}

	$.clearStorage = function(clearExpiredOnly){
		if(!localStorage) return this;

		var item, key;
        var now = +new Date();

        for(item in localStorage) {
            obj = $.existsInStorage(item);
            if(!clearExpiredOnly || obj && obj.expire <= now) {
                $.removeFromStorage(item);
            }
        }
        return this;
	}

	$.removeFromStorage = function(key){
		localStorage.removeItem(key);
		return this;
	}

	window.jqLocalStorage = function(){
		this.head = document.head || document.getElementsByTagName('head')[0];
	}

	jqLocalStorage.prototype.defaultExpiration = 5000;

	jqLocalStorage.prototype.cssmin = function (css, linebreakpos) {
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

	jqLocalStorage.prototype.wrapStoreData = function(obj) {
        var now = +new Date();
        obj.stamp = now;
        obj.expire = now + ((obj.expire || this.defaultExpiration) * 60 * 60 * 1000);
        return obj;
    }

	jqLocalStorage.prototype.isLocal = function(url){
		var hasHttp = url.indexOf('http://') != -1,
	        hasHttps = url.indexOf('https://') != -1,
	        hasSlashSlash = url.indexOf('//') != -1,
	        startsWithSlash = url.charAt(0) == '/';

	    return !hasHttp && !hasHttps && !hasSlashSlash;// && !startsWithSlash;
	}

	jqLocalStorage.prototype.isCSS = function (url){
		var isCSS = url.indexOf('.css') != -1;
		return isCSS;
	}

	jqLocalStorage.prototype.injectScriptTagByText = function (data){
		var script = document.createElement('script');
	    script.defer = true;
	    script.text = data.text;
	    this.head.appendChild(script);
	}

	jqLocalStorage.prototype.injectStyleTagByText = function (data){
	    $('head').append('<style>'+data.text+'</style>');
	}

	jqLocalStorage.prototype.injectScriptTagBySrc = function (url, dfd){
		var script = document.createElement('script');
		script.defer = true;
	    script.src = url;
	    script.onload = script.onreadystatechange = function(){
	    	dfd.resolve();
	    };
	    this.head.appendChild(script);
	}

	jqLocalStorage.prototype.injectStyleTagBySrc = function (url, fn){
		var style = document.createElement('link');
		style.href = url;
	    this.head.appendChild(style);
	}

	jqLocalStorage.prototype.loadScriptContentAndCacheIt = function (url, data){
		var self = this;
		return $.get(url, null, null, 'script').then(function(text, success, Promise){
			data.text = text;
			self.injectScriptTagByText(data);
			$.setStorage(url, data);
		});
	}

	jqLocalStorage.prototype.loadStyleContentAndCacheIt = function (url, data){
		var self = this;
		return $.get(url).then(function(text, success, Promise){
			data.text = self.cssmin(text, 80);
			self.injectStyleTagByText(data);
			$.setStorage(url, data);
		});	
	}

	jqLocalStorage.prototype.handle_file = function (file){
		if(!file || !file.url) return;

		file = this.wrapStoreData(file);

		var url = file.url,
			isCORS = file.CORS,
			isLocal = this.isLocal(url),
			data,
			dfd = $.Deferred();

		if(isLocal){
			data = $.existsInStorage(url);
			if(data){
				file = data;
			} else if(file.unique) {
	            // set parameter to prevent browser cache
	            file.url += ((file.url.indexOf('?') > 0) ? '&' : '?') + 'loader-cachebust=' + file.unique;
			}
		}

		if(this.isCSS(url)){
			if(data){
				this.injectStyleTagByText(data);
				dfd.resolve();
			} else if (isLocal) {
				$.when(this.loadStyleContentAndCacheIt(url, file)).then(function(){
					dfd.resolve();
				});
			} else {
				this.injectStyleTagBySrc(url);
				dfd.resolve();
			}
		} else {
			if(data){
				this.injectScriptTagByText(data);
				dfd.resolve();
			} else if(isLocal) {
				$.when(this.loadScriptContentAndCacheIt(url, file)).then(function(){
					dfd.resolve();
				});
			} else {
				this.injectScriptTagBySrc(url, dfd);
			}
		}

		return dfd.promise();
	}

	$.cacheFiles = function(){
		var jq = new jqLocalStorage();
		
		$.clearStorage(true);

		return function (files){
			var arr = [];

		    for(var i in files){
		    	arr.push(jq.handle_file(files[i]));
		    }
		    return $.when.apply($, arr)
		};
	}();

})(jQuery, window);

/**
 *  call by doing 
 *  var scripts = [{url: "...", CORS: true/false}, {url: "...", CORS: true/false}]
 *  $.cacheFiles(scripts);
 */