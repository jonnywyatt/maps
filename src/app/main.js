define([
	'map/moduleMap',
	'family/moduleFamily'
], function (moduleMap, moduleFamily) {

	var mapApp = new Backbone.Marionette.Application();

	mapApp.addInitializer(function (options) {
		mapApp.addRegions({
			regionMap: ".regionMap",
			regionFamily: ".regionFamily"
		});
	});

	mapApp.addInitializer(function (options) {
		var self = this;
		this.module("moduleMap", moduleMap({
			onLoad: function(view){
				self.regionMap.show(view);
			}
		}));
		this.module("moduleFamily", moduleFamily({
			onLoad: function(view){
				self.regionFamily.show(view);
			}
		}));

	});

	mapApp.start();

});