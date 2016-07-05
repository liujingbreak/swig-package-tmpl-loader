//var swig = require('swig');
//var api = require('__api');
//var log = require('log4js').getLogger(api.packageName);
var _ = require('lodash');
var Path = require('path');
var mothership = require('mothership').sync;

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
	var _resolvePackage = (opts.memoize !== false ) ? _.memoize(resolvePackage) : resolvePackage ;

	return {
		opts,
		resolve: function(to, from) {
			if (_.startsWith(to, opts.prefix)) {
				return originLoader.resolve.call(this, this.resolveTo(to, from, _resolvePackage), from);
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

exports.testable = {
	resolveTo: resolveTo,
	resolvePackage: resolvePackage
};

function resolvePackage(packageName) {
	var mainJsPath = require.resolve(packageName);
	var jsonPath = mothership(mainJsPath, function(json) {
		return json.name === packageName;
	}).path;
	if (jsonPath == null) {
		throw new Error(packageName + ' is not Found');
	}
	return Path.dirname(jsonPath);
}

var pNamePat = /(?:@[^\/]+\/)?([^\/]+)/;

function resolveTo(to, from, _resolvePackage) {
	var prefixLen = this.opts.prefix.length;
	var matched = pNamePat.exec(to.substring(prefixLen));
	if (!matched)
		throw new Error('Invalid package path in ' + to);
	var packageNameEnd = prefixLen + matched[0].length;
	var packageName = matched[0];
	var packagePath;

	if (_.has(this.opts, 'injector')) {
		var fm = this.opts.injector.factoryMapForFile(from);
		if (!from) {
			throw new Error('from is null');
		}
		if (fm) {
			var injectMap = fm.getInjector(packageName);
			if (_.has(injectMap, 'substitute')) {
				packagePath = _resolvePackage(injectMap.substitute);
			} else if (_.has(injectMap, 'swigTemplateDir')) {
				packagePath = Path.resolve(injectMap.swigTemplateDir);
				if (_.endsWith(packagePath, '/') || _.endsWith(packagePath, '\\'))
					packagePath = packagePath.substring(0, packagePath.length - 1);
			} else {
				packagePath = _resolvePackage(packageName);
			}
		}
	} else {
		packagePath = _resolvePackage(packageName);
	}

	var resolveTo = packagePath + to.substring(packageNameEnd);
	//console.log('trying to resolve npm path:', to, ', target package', packageName, '-->', resolveTo);
	return resolveTo;
}
