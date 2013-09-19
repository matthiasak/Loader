## The Loader

This Loader / dependency utility is a very simple utility class that acts as a resource loader and manager for javascript and CSS (templating to come)
It will load external scripts and stylesheets via script tag / src injection, and will detect if a URL passes the same-origin policy (protocol, domain, port) when dynamically loading scripts so that it know when to:

1. Use standard ajax XMLHttpRequest to load script/style content and store it in localstorage and inject it into the page's `<header>`.
2. Use simple url insertion of a `<script>` or `<style>` tag.

```
	var files = [
		{url: "/vendor/raphael-min.js"},
		{url: "./styles.css"}
	]
	loader.load.apply(load, files).then(function(){
		// do something after
		console.log('all files loaded and cached!')
	});
```

This effectively reduces any latency with calls, thereby drastically improving performance. The more files you dynamically load, the greater the speed increases as well. On a typical scale based on preliminary testing, when loading three js libraries and two css files, load times and render times of a page will decrease ~30%.