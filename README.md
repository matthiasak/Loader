## Loader class

This Loader utility is a very simple utility class that acts as

1. a dependency loader - js and css
2. a templating manager

It will load external scripts via script tag / src injection, otherwise you can pass any CORS supported servers the {CORS: true} option when making calls:

	var scriptsToLoad = [
		{url:'/scripts/lodash.min.js', CORS: true},
	];

	loader.load.apply(loader, scriptsToLoad)

	// or

	loader.load({url:'/scripts/lodash.min.js', CORS: true})

All CORS and local scripts will be loaded and stored under HTML5 Local Storage. Any CSS loaded the Loader will even be compressed and minified when stored into Local Storage!

## How to use Loader

	var loader = new Loader();	
	var scriptsToLoad = [
		{url:'/scripts/lodash.min.js'},
		{url:'/scripts/backbone-min.js'},
		{url:'/scripts/davis.min.js'},
		{url:"/scripts/d3.v3.min.js"},
		{url:'/scripts/davis.min.js'}
	];

	var templatesToLoad = [
		'templates/user',
		'templates/item'
	];

	var stylesToLoad = [
		{url:'/css/main.css'},
		{url:'/css/960.css'}
	];

	loader.load.apply(loader, scriptsToLoad)
		.then(function(){
			// console.log(Davis);
		})
		.fail(function(){
			throw new Error("Failed to load")
		})
	        
	loader.template.apply(loader, templatesToLoad)
		.then(function(user, item){
			$('body').append(user(data)).append(item(data));
			// console.log(tmpl(templateContent), tmpl(templateContent, ))
		})
		.fail(function(){

		})

	loader.css.apply(loader, stylesToLoad);

## on Node.JS

	> npm install
	# if you don't have mocha
	> npm install -g mocha 
	> mocha

	// Make sure to require jquery, and pass it as input

	var $ = require("jquery"),
		Class = require("./Loader")($),
		Loader = Class.Loader;

## on the Browser

include jQuery (only prerequisite)

	<script src="http://code.jquery.com/jquery-1.9.0.min.js"></script>
	<script src="./Loader.min.js"></script>
	<script>
		// use Loader ..
	</script>

I hope you find it useful!