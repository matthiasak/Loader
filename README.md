## Loader class

This Loader utility is a very simple utility class that acts as a dependency loader. In your applications, on the fly you can use it to load script files from anywhere and if that file is loaded multiple times then you will have the cached version. There isn't scoping since many libraries still may not work well with an AMD structure, thus instead of a RequireJS style, you can load a file to the global object (in the browser). In Node.JS you just need to pass a jquery-compliant library, which uses the $.getScript function call in the end.

#### on Node.JS

	> npm install
	# if you don't have mocha
	> npm install -g mocha 
	> mocha

#### on the Browser

include jQuery (only prerequisite)

	<script src="http://code.jquery.com/jquery-1.8.3.min.js"></script>
	<script src="./Loader.min.js"></script>
	<script>
		// use Loader ..
	</script>

#### Usage

	var loader = new Loader();
	
	var scriptsToLoad = [
		'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.3/angular.min.js',
		'http://cdnjs.cloudflare.com/ajax/libs/davis.js/0.9.5/davis.min.js'
	];
	
	loader.load(scriptsToLoad)
		.then(function(){
			/// success
			alert('success!')
		})
		.fail(function(){
			throw new Error("Failed to load")
		})

I hope you find it useful!