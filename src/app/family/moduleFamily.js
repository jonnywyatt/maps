define([
	'globalEvents',
	'family/vFamily',
	'family/mFamily'
], function (globalEvents, ViewFamily, ModelFamily) {

	return function(config) {

		this.model = new ModelFamily({
			initialised: false,
			module: this
		});

		this.view = new ViewFamily({
			model: this.model,
			module: this
		});

		this.personSelected = function(person){
			globalEvents.trigger('personSelected', person);
		};

		this.model.fetch()
			.done(function(){

			})
			.fail(function(){

			});

		config.onLoad && config.onLoad(this.view);

	};

});