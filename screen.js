var events = require('events');

function Screen(options) {



	var config = {
		tileSize: 100,
		fps: 30,
	};


	Object.keys(options).forEach(function(key) {
		config[key] = options[key];
	});

	var tileSize = config.tileSize;


	var me = this;
	events.EventEmitter.call(me);



	var robot = require('robotjs');


	var tilesData = [];
	var tilesDataTotal = [];

	var swapRBColorAt = function(src, dest, is, id) {

		dest[id] = src[is + 2];
		dest[id + 1] = src[is + 1];
		dest[id + 2] = src[is];
		dest[id + 3] = src[is + 3];
	}

	var getTileAt = function(x0, y0, bitmap, callback) {



		var sizeX = tileSize;
		var sizeY = tileSize;



		if (!tilesDataTotal[x0]) {
			tilesDataTotal[x0] = [];
		}
		if ((typeof tilesDataTotal[x0][y0]) == "undefined") {
			tilesDataTotal[x0][y0] = null;
		}

		var lastTotal = tilesDataTotal[x0][y0];
		var thisTotal = 0;


		var isEdge = false;
		if ((x0 + 1) * tileSize > bitmap.width) {
			sizeX = bitmap.width - (x0 * tileSize);
			isEdge = true;
		}
		if ((y0 + 1) * tileSize > bitmap.height) {
			sizeY = bitmap.height - (y0 * tileSize);
			isEdge = true;
		}

		if (!isEdge) {
			//return;
		}

		//var imageData=context.createImageData(sizeX, sizeY);

		var imageData = new Uint8ClampedArray(sizeX * sizeY * 4);

		var y0Offset = (y0 * tileSize * bitmap.byteWidth);
		var x0Offset = (x0 * tileSize * 4);

		for (var y = 0; y < sizeY; y++) {

			var ySOffset = (y * bitmap.byteWidth);
			var yDOffset = (y * sizeX * 4);

			var sizeX4 = sizeX * 4;

			for (var x = 0; x < sizeX4; x += 4) {


				var is = y0Offset + ySOffset + x0Offset + x;
				var id = yDOffset + x;
				thisTotal = thisTotal + bitmap.image[is];
				swapRBColorAt(bitmap.image, imageData, is, id);

			}

		}


		if (!lastTotal === null) {
			callback(imageData, x0 * tileSize, y0 * tileSize, sizeX, sizeY);
			tilesDataTotal[x0][y0] = thisTotal;
		} else {

			if (thisTotal !== lastTotal) {
				//console.log('redraw: '+x0+', '+y0);
				callback(imageData, x0 * tileSize, y0 * tileSize, sizeX, sizeY);
				tilesDataTotal[x0][y0] = thisTotal;
				return;
			}
		}

	}

	var getSize = function() {
		return robot.getScreenSize();
	}

	me.getSize = getSize.bind(me);

	var getTiles = function(callback) {



		var size = getSize();

		var bitmap = robot.screen.capture(0, 0, size.width, size.height);
		for (var y = 0; y < bitmap.height / tileSize; y++) {
			for (var x = 0; x < bitmap.width / tileSize; x++) {
				getTileAt(x, y, bitmap, callback);
			}
		}

	};



	var lastSize = {
		"width": 0,
		"height": 0
	};

	setInterval(function() {

		var size = getSize();

		if (lastSize.width !== size.width || lastSize.height != size.height) {
			tilesDataTotal = [];
			lastSize = size;
			me.emit('resize', {
				'width': size.width,
				'height': size.height
			});
		}

		getTiles(function(tile, x, y, w, h) {
			me.emit('tile', {
				'tile': tile,
				'x': x,
				'y': y,
				'width': w,
				'height': h
			});
		});



	}, 1000 / config.fps);


};



Screen.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Screen;