//var swig = require('swig');
//var api = require('__api');
//var log = require('log4js').getLogger(api.packageName);
var _ = require('lodash');
var Path = require('path');

/**
 * create loader
 * @param  {object} swig     The require('swig') instance
 * @param  {string} basepath Same as swig.loaders.fs
 * @param  {string} encoding Same as swig.loaders.fs
 * @param  {boolean} opts.memoize True if use _.memoize() to cache require.resolve's result, default is `true`
 * @param {boolean} opts.prefix default is `npm://`
 * @param {requireInjector} opts.injector you can use with [require-injector](https://www.npmjs.com/package/require-injector)
 */
exports.createLoader = function(swig, basepath, encoding, opts) {
	opts = _.assign({
		memoize: true,
		prefix: 'npm://'
	}, opts ? opts : {});
	var originLoader = swig.loaders.fs.apply(swig.loaders, [].slice.call(arguments, 1, 3));
	//var _resolvePackage = (opts.memoize !== false ) ? _.memoize(resolvePackage) : resolvePackage ;

	return {
		opts,
		resolve: function(to, from) {
			if (_.startsWith(to, opts.prefix)) {
				return originLoader.resolve.call(this, this.resolveTo(to, from), from);
			}
			return originLoader.resolve.apply(this, arguments);
		},
		load: originLoader.load,
		resolveTo: resolveTo
	};
};

/**
 * Call swig.setDefaults({loader: exports.createLoader()});
 * @param  {swig} swig
 * @param {boolean} opts.memoize True if use _.memoize() to cache require.resolve's result, default is `true`
 * @param {boolean} opts.prefix default is `npm://`
 * @param {requireInjector} opts.injector you can use with [require-injector](https://www.npmjs.com/package/require-injector)
 */
exports.swigSetup = function(swig, opts) {
	swig.setDefaults({loader: exports.createLoader(swig, undefined, undefined, opts)});
};
exports.resolveTo = function(to, from, injector) {
	it.opts = {
		prefix: 'npm://',
		injector: injector
	};
	return it.resolveTo(to, from);
};
exports.testable = {
	resolveTo: resolveTo
};

var pNamePat = /^(?:@[^\/]+\/)?([^\/]+)/;

function resolveTo(to, from) {
	try {
		var prefixLen = this.opts.prefix.length;
		var path = to.substring(prefixLen);
		var matched = pNamePat.exec(path);
		if (!matched)
			throw new Error('Invalid package path in ' + to);
		var packageNameEnd = prefixLen + matched[0].length;
		var packageName = matched[0];

		if (_.has(this.opts, 'injector')) {
			var fm = this.opts.injector.factoryMapForFile(from);
			if (fm) {
				var ijSetting = fm.matchRequire(packageName);
				if (ijSetting) {
					if (ijSetting.method === 'substitute') {
						if (_.isFunction(ijSetting.value))
							return require.resolve(path.replace(pNamePat, ijSetting.value(from, ijSetting.execResult)));
						else
							return require.resolve(path.replace(pNamePat, ijSetting.value));
					} else if (ijSetting.method === 'swigTemplateDir') {
						var packagePath = Path.resolve(_.isFunction(ijSetting.value) ?
								ijSetting.value(from, ijSetting.execResult) :
								ijSetting.value);
						if (_.endsWith(packagePath, '/') || _.endsWith(packagePath, '\\'))
							packagePath = packagePath.substring(0, packagePath.length - 1);
						return packagePath + to.substring(packageNameEnd);
					}
				}
			}
		}
		return require.resolve(path);
	} catch (e) {
		e.message = 'Failed to resolve ' + to + ' from ' + from + ', ' + e.message;
		throw e;
	}
}
