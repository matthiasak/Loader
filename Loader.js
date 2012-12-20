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
        for(var name in prop) {
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
            if(!initializing && this.init) this.init.apply(this, arguments);
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

//from http://ejohn.org/blog/javascript-micro-templating/
(function(){
  var cache = {};
  
  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :
      
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
        
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
        
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");
    
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();

var _Loader = function($){
    return Class.extend({
        init : function(){
            this.cache = {};
            this.templates = {};
        },
        _load : function(el, i, dfds){
            var self = this;
            
            if(self.cache[el]){
                var dfd = $.Deferred();
                dfd.resolve();
                dfds[i] = dfd;
                return dfd.promise();
            }
            
            dfds[i] = $.getScript(el).then(function(){ self.cache[el] = true; });
        },
        load : function(){
            var args = Array.prototype.slice.call(arguments),
                dfds = [],
                self = this;

            if(!args.length) {
                var dfd = $.Deferred();
                dfd.fail();
                return dfd.promise();
            }

            for(var i in args){
                this._load(args[i], i, dfds);
            }

            return $.when.apply($, dfds);
        },
        _template : function(el, i, dfds){
            var self = this;

            if(this.templates[el]){
                dfds[i] = this.templates[el];
                return;
            }

            dfds[i] = $.get(el).pipe(function(templateContent){
                self.templates[el] = tmpl(templateContent);
                return self.templates[el];
            });
        },
        template : function(){
            var args = Array.prototype.slice.call(arguments),
                dfds = [],
                self = this;

            if(!args.length) {
                var dfd = $.Deferred();
                dfd.fail();
                return dfd.promise();
            }

            for(var i in args){
                this._template(args[i], i, dfds);
            }

            return $.when.apply($, dfds);
        }
    });
};

var browser = (typeof exports === 'undefined');
if(!browser){
    module.exports = function($){
        return {Loader: _Loader($)};
    }
} else {
    window.Loader = _Loader($);
}