define([
	'backbone'
], function (Backbone) {

	var ModelFamily = Backbone.Model.extend({
		url: '../../test/json/family.json'
	});
	return ModelFamily;

});