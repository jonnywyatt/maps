module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs: {
			compile: {

				// !! You can drop your app.build.js config wholesale into 'options'
				options: {

					//By default, all modules are located relative to this path. If baseUrl
					//is not explicitly set, then all modules are loaded relative to
					//the directory that holds the build file. If appDir is set, then
					//baseUrl should be specified as relative to the appDir.
					baseUrl: "src/app",

					//By default all the configuration for optimization happens from the command
					//line or by properties in the config file, and configuration that was
					//passed to requirejs as part of the app's runtime "main" JS file is *not*
					//considered. However, if you prefer the "main" JS file configuration
					//to be read for the build so that you do not have to duplicate the values
					//in a separate configuration, set this property to the location of that
					//main JS file. The first requirejs({}), require({}), requirejs.config({}),
					//or require.config({}) call found in that file will be used.
					mainConfigFile: 'src/app/require-config.js',

					//The directory path to save the output. If not specified, then
					//the path will default to be a directory called "build" as a sibling
					//to the build file. All relative paths are relative to the build file.
					dir: "src/dist",

					//How to optimize all the JS files in the build output directory.
					//Right now only the following values
					//are supported:
					//- "uglify": (default) uses UglifyJS to minify the code.
					//- "uglify2": in version 2.1.2+. Uses UglifyJS2.
					//- "closure": uses Google's Closure Compiler in simple optimization
					//mode to minify the code. Only available if running the optimizer using
					//Java.
					//- "closure.keepLines": Same as closure option, but keeps line returns
					//in the minified files.
					//- "none": no minification will be done.
					optimize: "none",

					//Introduced in 2.1.2: If using "dir" for an output directory, normally the
					//optimize setting is used to optimize the build layers (the "modules"
					//section of the config) and any other JS file in the directory. However, if
					//the non-build layer JS files will not be loaded after a build, you can
					//skip the optimization of those files, to speed up builds. Set this value
					//to true if you want to skip optimizing those other non-build layer JS
					//files.
					skipDirOptimize: true,

					//If using UglifyJS for script optimization, these config options can be
					//used to pass configuration values to UglifyJS.
					//For possible values see:
					//http://lisperator.net/uglifyjs/codegen
					//http://lisperator.net/uglifyjs/compress
					uglify2: {
						//Example of a specialized config. If you are fine
						//with the default options, no need to specify
						//any of these properties.
						output: {
							beautify: true
						},
						compress: {
							sequences: false,
							global_defs: {
								DEBUG: false
							}
						},
						warnings: true,
						mangle: false
					},

					//Allow CSS optimizations. Allowed values:
					//- "standard": @import inlining, comment removal and line returns.
					//Removing line returns may have problems in IE, depending on the type
					//of CSS.
					//- "standard.keepLines": like "standard" but keeps line returns.
					//- "none": skip CSS optimizations.
					//- "standard.keepComments": keeps the file comments, but removes line
					//returns.  (r.js 1.0.8+)
					//- "standard.keepComments.keepLines": keeps the file comments and line
					//returns. (r.js 1.0.8+)
					optimizeCss: "standard",

					//Inlines the text for any text! dependencies, to avoid the separate
					//async XMLHttpRequest calls to load those dependencies.
					inlineText: true,

					stubModules: ['text'],

					//Allows namespacing requirejs, require and define calls to a new name.
					//This allows stronger assurances of getting a module space that will
					//not interfere with others using a define/require AMD-based module
					//system. The example below will rename define() calls to foo.define().
					//See http://requirejs.org/docs/faq-advanced.html#rename for a more
					//complete example.
					//namespace: 'foo',

					//If skipModuleInsertion is false, then files that do not use define()
					//to define modules will get a define() placeholder inserted for them.
					//Also, require.pause/resume calls will be inserted.
					//Set it to true to avoid this. This is useful if you are building code that
					//does not use require() in the built project or in the JS files, but you
					//still want to use the optimization tool from RequireJS to concatenate modules
					//together.
					// NOTE - JON - if true, shimmed modules eg. mapbox don't seem to be included in build file
					skipModuleInsertion: false,

					//Finds require() dependencies inside a require() or define call. By default
					//this value is false, because those resources should be considered dynamic/runtime
					//calls. However, for some optimization scenarios,
					//Introduced in 1.0.3. Previous versions incorrectly found the nested calls
					//by default.
					findNestedDependencies: false,

					//If set to true, any files that were combined into a build layer will be
					//removed from the output folder.
					removeCombined: true,

					//List the modules that will be optimized. All their immediate and deep
					//dependencies will be included in the module's file when the build is
					//done. If that module or any of its dependencies includes i18n bundles,
					//only the root bundles will be included unless the locale: section is set above.
					modules: [
						//Just specifying a module name means that module will be converted into
						//a built file that contains all of its dependencies. If that module or any
						//of its dependencies includes i18n bundles, they may not be included in the
						//built file unless the locale: section is set above.
						{
							name: "main"
						}
					],

					//Sets the logging level. It is a number. If you want "silent" running,
					//set logLevel to 4. From the logger.js file:
					//TRACE: 0,
					//INFO: 1,
					//WARN: 2,
					//ERROR: 3,
					//SILENT: 4
					//Default is 0.
					logLevel: 0,

					//Introduced in 2.1.3: Some situations do not throw and stop the optimizer
					//when an error occurs. However, you may want to have the optimizer stop
					//on certain kinds of errors and you can configure those situations via
					//this option
					throwWhen: {
						//If there is an error calling the minifier for some JavaScript,
						//instead of just skipping that file throw an error.
						optimize: true
					}

				}
			}
		},
		handlebars: {
			compile: {
				options: {
					namespace: false,
					amd: true
				},
				files: [
					{
						expand: true,     // Enable dynamic expansion.
						cwd: 'src/app/templates/',   // Src matches are relative to this path.
						src: ['**/*.html'], // Actual pattern(s) to match.
						dest: 'src/app/templates/',   // Destination path prefix.
						ext: '.js'    // Dest filepaths will have this extension.
					}
				]
			}
		},
		watch: {
			scripts: {
				files: 'src/app/templates/*.html',
				tasks: 'handlebars'
			}
		}
	});

	// !! This loads the plugin into grunt
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-handlebars');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['handlebars', 'requirejs']);

};