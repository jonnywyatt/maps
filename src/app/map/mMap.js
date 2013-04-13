define([
	'backbone'
], function (Backbone) {

	var ModelMap = Backbone.Model.extend({
		url: '../../test/json/geodataPlaces.json'
	});
	return ModelMap;

});