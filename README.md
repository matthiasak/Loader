## Loader class

This Loader utility is a very simple utility class that acts as

1. a dependency loader
2. a templating manager

You can use it to

1. Load scripts (like a dependency injection system)
`

	var loader = new Loader();
	
	loader.load(
		'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.3/angular.min.js',
		'http://cdnjs.cloudflare.com/ajax/libs/davis.js/0.9.5/davis.min.js'
		)
		.then(function(){
			/// success
			alert('success!')
		})

`
2. Load templates (same, but for managing templates)
`

	var loader = new Loader();

	var data = {
		users: [{ name: "Matt" }],
		profile_image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaPIEUqI2Jbj3KRTVHcyHvt7rcq-XxmqCwdkq4mz8L_QuaqStz", 
		text: "hello"
	};
	
	loader.template(
		'templates/user',
		'templates/item'
		)
		.then(function(userTmpl, itemTmpl){
			/// success
			$('body')
				.append(userTmpl(data))
				.append(itemTmpl(data));
		})

`
#### on Node.JS

	> npm install
	# if you don't have mocha
	> npm install -g mocha 
	> mocha

	// Make sure to require jquery, and pass it as input

	var $ = require("jquery"),
		Class = require("./Loader")($),
		Loader = Class.Loader;

#### on the Browser

include jQuery (only prerequisite)

	<script src="http://code.jquery.com/jquery-1.8.3.min.js"></script>
	<script src="./Loader.min.js"></script>
	<script>
		// use Loader ..
	</script>

I hope you find it useful!