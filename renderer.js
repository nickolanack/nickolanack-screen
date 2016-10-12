// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var port = 8086;
var compressTiles = false;

var zlib = require('zlib');
var decompress = function(input, callback) {
	if (!compressTiles) {
		callback(input);
		return;
	}
	zlib.inflate(input, function(err, buffer) {
		callback(buffer);
	})
};



var run = function() {
	var WebSocket = require('ws');
	var ws = new WebSocket('ws://localhost:' + port);
	ws.on('message', function(data, flags) {

		var message = data.split(':');
		var name = message.shift();
		var data = JSON.parse(message.join(':'));



		if (name === 'screen.tile') {

			var input = Buffer.from(data.tile, 'hex');
			decompress(input, function(buffer) {


				var length = data.width * data.height * 4;
				var tile = new Uint8ClampedArray(buffer, 0, length);

				context.putImageData(new ImageData(tile, data.width, data.height), data.x, data.y);
				tileRaw = null;

			});
		}


		if (name === 'screen.resize') {

			context.canvas.width = data.width;
			context.canvas.height = data.height;

		}

	});

};


setTimeout(run, 1000);