require.config({
	baseUrl: 'app',
	paths: {
		jquery: '../lib/jquery/jquery-1.9.1',
		mapbox: '../lib/mapbox/mapbox',
		d3: '../lib/d3/d3',
		backbone: '../lib/backbone/backbone',
		marionette: '../lib/marionette/marionette',
		underscore: '../lib/underscore/underscore',
		handlebars: '../lib/handlebars/handlebars-1.0.0'
	},
	shim: {
		mapbox: {
			exports: 'mapbox'
		},
		d3: {
			exports: 'd3'
		}
	},

	//Sets the logging level. It is a number. If you want "silent" running,
	//set logLevel to 4. From the logger.js file:
	//TRACE: 0,
	//INFO: 1,
	//WARN: 2,
	//ERROR: 3,
	//SILENT: 4
	//Default is 0.
	logLevel: 1
});