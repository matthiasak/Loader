## jqLocalStorage class

This jqLocalStorage utility is a very simple utility class that acts as a resource loader and manager for javascript and CSS

It will load external scripts and stylesheets via script tag / src injection, otherwise you can pass any CORS supported servers the {CORS: true} option when making calls:
	
	var files = [
		{url: "/vendor/raphael-min.js"},
		{url: "./styles.css"}
	]
	$.cacheFiles(files).then(function(){
		// do something after
		console.log('all files loaded and cached!')
	});

All CORS and local files will be loaded and stored under HTML5 Local Storage. Any CSS will even be compressed and minified before storage!

## How to use jqLocalStorage

	var files = [
		
		// js files

		{url: "/vendor/raphael-min.js"},
		{url: "/vendor/angular.min.js"},
		{url: "/vendor/lodash.min.js"},
		{url: "/vendor/backbone-min.js"},
		{url: "/vendor/d3.v3.min.js"},
		{url: "/vendor/fineuploader.min.js"},

		// and css files can be intermixed in the same call

		{url: "./styles.css"},
		{url: "/vendor/normalize.css"},
		{url: "/vendor/font-awesome.min.css"}
	]
	$.cacheFiles(files).then(function(){
		// do something after
		console.log('all files loaded and cached!')
	});

## on the Browser

include jQuery (only prerequisite)

	<script src="http://code.jquery.com/jquery-1.9.0.min.js"></script>
	<script src="./jqLocalStorage.min.js"></script>
	<script>
		// use Loader ..
	</script>

I hope you find it useful!