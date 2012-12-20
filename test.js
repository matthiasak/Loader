var assert = require("assert"),
	$ = require("jquery"),
	Class = require("./Loader")($),
	Loader = Class.Loader

describe('Loader', function(){
	it('should load an array of files', function() {
		var loader = new Loader();
		
		var scriptsToLoad = [
			'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.3/angular.min.js',
			'http://cdnjs.cloudflare.com/ajax/libs/davis.js/0.9.5/davis.min.js'
		];
		
		loader.load.apply(loader, scriptsToLoad)
			.then(function(){
				/// success
			})
			.fail(function(){
				throw new Error("Failed to load")
			})
	});
})

describe('Loader cached', function(){
	it('should return a cached version of the files', function() {
		var loader = new Loader();
		
		var scriptsToLoad = [
			'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.3/angular.min.js',
			'http://cdnjs.cloudflare.com/ajax/libs/davis.js/0.9.5/davis.min.js'
		];
		
		$.when(loader.load.apply(loader, scriptsToLoad)).then(function(){
			loader.lood.apply(loader, scriptsToLoad)
				.then(function(){
					/// success
				})
				.error(function(){
					throw new Error("Failed to load")
				})
		})
	});
})