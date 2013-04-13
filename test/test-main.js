var tests = Object.keys(window.__karma__.files).filter(function (file) {
	return /\.test\.js$/.test(file);
});

require.config({baseUrl: '/base/src/app'});

require(['require-config'], function () {
	require.config({baseUrl: '/base/src/app'});
	require(tests, function () {
		window.__karma__.start();
	});
});
