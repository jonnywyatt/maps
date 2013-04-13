define([
	'map/vMap',
	'map/mMap'
], function (ViewMap, ModelMap) {

	return function(config) {

		var self = this;

		this.model = new ModelMap({
			initialised: false,
			module: this
		});

		this.view = new ViewMap({
			model: this.model,
			module: this
		});

		this.model.fetch()
			.done(function(){

			})
			.fail(function(){

			});

		config.onLoad && config.onLoad(this.view);

	};

});