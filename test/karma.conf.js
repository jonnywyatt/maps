basePath = "../";

files = [
	JASMINE,
	JASMINE_ADAPTER,
	REQUIRE,
	REQUIRE_ADAPTER,

	// !! all src and test modules (included: false)
	{pattern: 'src/app/*.js', included: false},
	{pattern: 'src/app/**/*.js', included: false},
	{pattern: 'src/app/templates/*.html', included: false},
	{pattern: 'src/lib/**/*.js', included: false},
	{pattern: 'test/specs/*.test.js', included: false},
	{
		pattern: 'test/json/*.json',
		watched: true,
		included: false,
		served: true
	},

	// !! test main require module last
	'test/test-main.js'
];

autoWatch = true;

port = 8080;

browsers = ['Chrome'];

reporters = ['progress'];

logLevel = LOG_INFO;