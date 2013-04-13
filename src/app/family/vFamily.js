define([
	'marionette',
	'jquery',
	'templates/family',
	'handlebars',
	'family/graph'
], function (Marionette, $, tmp, Handlebars, graph) {

	var ViewFamily = Marionette.ItemView.extend({

		className: 'viewFamily',

		modelEvents: {
			"change": "renderGraph"
		},

		template: tmp,

		initialize: function(options) {
			this.module = options.module;
		},

		renderGraph: function () {
			var w, h;
			w = this.$el.width();
			h = this.$el.height();
			graph({
				selector: '.' + this.className,
				width: w,
				height: h,
				data: this.model.get('familyData'),
				selectedHandler: this.module.personSelected
			});
		}
	});

	return ViewFamily;

});