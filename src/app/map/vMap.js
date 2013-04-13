define([
	'marionette',
	'jquery',
	'mapbox',
	'templates/map',
	'handlebars',
	'globalEvents'
], function (Marionette, $, mapbox, tmp, Handlebars, globalEvents) {

	var ViewMap = Marionette.ItemView.extend({

		className: "viewMap",
		modelEvents: {
			"change": "render"
		},

		template: tmp,

		onShow: function () {
			var self = this;
			// satellite - brightrain.map-bpwe9yas
			mapbox.auto('map', 'examples.map-4l7djmvo', function(map){
				self.map = map;
			});
			globalEvents.listenTo(globalEvents, 'personSelected', _.bind(this.showPersonLocation, this));
		},

		showPersonLocation: function(person) {
			var coords = person.location.geometry.coordinates;
			this.map.ease.location({ lat: coords[0], lon: coords[1] }).zoom(40).optimal(0.5, 1.00);
		}

	});

	return ViewMap;

});