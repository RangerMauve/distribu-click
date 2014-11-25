var stdout = require("stdout");
var shoe = require("shoe");
var domDelegate = require("dom-delegate-stream");
var map = require("through2-map").obj;
var newlineJSON = require("newline-json");
var Parser = newlineJSON.Parser;
var Stringifier = newlineJSON.Stringifier;
var mustache = require("mustache");
var patcher = require("html-patcher-stream");
var concat = require("array-concat-stream");
var debounce = require("debounce-stream");

var main = document.querySelector("main");
var template = document.querySelector("#template").innerHTML;
var render = mustache.render.bind(mustache, template);
var delegate = domDelegate(main);
var objectMode = {objectMode:true};

delegate.on("click", ".clicker") // Listen for clicks on the clicker
	.pipe(debounce(1000, objectMode)) // Limit to one click per second
	.pipe(map(create_click)) // Create new click events when it happens
	.pipe(new Stringifier()) // Stringify the event
	.pipe(shoe("/click")) // Send it down the socket to the server
	.pipe(new Parser()) // Parse output from socket as JSON
	.pipe(concat()) // Generate click history
	.pipe(map(process_clicks)) // Process click to create new state
	.pipe(map(render)) // Render the template
	.pipe(patcher(main, render({}))); // Patch the template into the DOM

function create_click() {
	return {
		click: true,
		timestamp: Date.now()
	};
}

function process_clicks(clicks) {
	return {
		clicks: clicks.length,
		last: clicks[clicks.length - 1],
		first: clicks[0]
	}
}
