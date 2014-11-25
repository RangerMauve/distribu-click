var http = require("http");
var shoe = require("shoe");
var ecstatic = require("ecstatic");
var EventEmitter = require("events").EventEmitter;
var StreamEmitter = require("streamemitter").StreamEmitter;
var stdout = require("stdout");
var map = require("through2-map").obj;
var newlineJSON = require("newline-json");
var Parser = newlineJSON.Parser;
var Stringifier = newlineJSON.Stringifier;
var debounce = require("debounce-stream");

var objectMode = {objectMode:true};

// Create an EventEmitter for synchronization
var events = new StreamEmitter(new EventEmitter());

// Static file server for the root directory
var files = ecstatic({
	root: __dirname
});

// Create the HTTP server
var server = http.createServer(files);

// Create the shoe server, listen on "/click"
shoe(handle_connection).install(server, "/click");

// Log all click events to the console
events.on("click").pipe(stdout());

// Start listening on the provided port or 8080
server.listen(process.env.PORT || 8080);

function handle_connection(stream) {
	console.log("Incoming", stream.id);
	events.on("click") // Listen on all click events
		.pipe(new Stringifier) // Turn them into JSON strings
		.pipe(stream) // Pipe it into the stream
		.pipe(debounce(1000, objectMode)) // Limit input to once a second
		.pipe(new Parser) // Parse the data as JSON
		.pipe(events.emit("click")); // Emit click event to everyone else
}
