define(['handlebars'],
	function (Handlebars) {
		var loadResource = function (resourceName, parentRequire, callback, config) {
			if (/.html/.test(resourceName)) {
				resourceName = "text!" + resourceName;
			}
			parentRequire([(resourceName)],
				function (templateContent) {
					var template = Handlebars.compile(templateContent);
					callback(template);
				}
			);
		};

		return {
			load: loadResource
		};

	});