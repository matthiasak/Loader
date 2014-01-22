## The Loader

This Loader / dependency utility is a very simple utility class that acts as a resource loader and manager for javascript and CSS (templating to come)
It will load external scripts and stylesheets via script tag / src injection, and will detect if a URL passes the same-origin policy (protocol, domain, port) when dynamically loading scripts so that it know when to:

1. Use standard ajax XMLHttpRequest to load script/style content and store it in localstorage and inject it into the page's `<header>`.
2. Use simple url insertion of a `<script>` or `<style>` tag.

### Inject CSS and JS into the page, and (if supported) cache in LocalStorage

```
	// load css files
	var styles = [{
		url: '/css/normalize.css'
	}, {
		url: '/css/print.min.css'
	}, {
		url: '/css/onepcssgrid.css'
	}, {
		url: '/css/typeplate.css'
	}, {
		url: '/css/main.css'
	}];

	// load js files
	var js = [{
		url: '/js/Utilities/FastQuery.js'
	}, {
		url: '/js/Utilities/utility-functions.js'
	}, {
		url: '/js/routes.js'
	}];

	// test for rAF and add a polyfill if not supported
	if(!window.requestAnimationFrame){
		js.unshift({
			url: '/js/Utilities/rAF-polyfill.js'
		});
	}

	// another polyfill
	if(!window.addEventListener){
		js.unshift({
			url: '/js/Utilities/addEventListener-polyfill.js'
		});
	}

	// load everything in parallel, execute js serially
	// returns a promise when the next thing is ready
	loader.load.apply(loader, styles.concat(js)).then(function() {
		// initiliaze your app?
	});
```

This effectively reduces any latency with calls, thereby drastically improving performance. The more files you dynamically load, the greater the speed increases as well. On a typical scale based on preliminary testing, when loading three js libraries and two css files, load times and render times of a page will decrease ~30% with cached resources.

### Use promises from Loader

```
	var p1 = new loader.promise.Promise()
		p2 = new loader.promise.Promise();

	p1.then(function(){
		// do something;
	});

	p1.done(/* some data */);
```

Loader.promise.Promise is a similar implementation to [https://github.com/stackp/promisejs](https://github.com/stackp/promisejs). Use the API listed at [https://github.com/stackp/promisejs](https://github.com/stackp/promisejs) for more info on the Promise API.

### Make any network request with Loader

```
	loader.promise.get('/archive.json').then(function(error, result){
		// do something with result...
	});
	loader.promise.post('/login').then(function(error, result){
		// do something with result...
	});
	loader.promise.put('/profile/..').then(function(error, result){
		// do something with result...
	});
	loader.promise.del('/messages/...').then(function(error, result){
		// do something with result...
	});
```

### Store anything in Local Storage with Loader

```
	loader.set('key', value);
	loader.get('key') //--> value;
```