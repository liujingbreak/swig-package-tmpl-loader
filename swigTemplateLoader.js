//var swig = require('swig');
//var api = require('__api');
//var log = require('log4js').getLogger(api.packageName);
var _ = require('lodash');
var Path = require('path');
var mothership = require('mothership').sync;

/**
 * create loader
 * @param  {object} swig     The require('swig') instance
 * @param  {string} basepath same as swig.loaders.fs
 * @param  {string} encoding same as swig.loaders.fs
 */
exports.createLoader = function(swig, basepath, encoding) {
	var originLoader = swig.loaders.fs.apply(swig.loaders, [].slice.call(arguments, 1));

	return {
		resolve: function(to, from) {
			if (_.startsWith(to, 'npm://')) {
				return originLoader.resolve.call(this, resolveTo(to), from);
			}
			return originLoader.resolve.apply(this, arguments);
		},
		load: originLoader.load
	};
};

/**
 * Call swig.setDefaults({loader: exports.createLoader()});
 * @param  {swig} swig
 */
exports.swigSetup = function(swig) {
	swig.setDefaults({loader: exports.createLoader(swig)});
};

exports.testable = {
	resolveTo: resolveTo
};

var resolvePackageAndCache = _.memoize(resolvePackage);

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

function resolveTo(to) {
	var prefixLen = 'npm://'.length;
	var matched = pNamePat.exec(to.substring(prefixLen));
	if (!matched)
		throw new Error('Invalid package path in ' + to);
	var packageNameEnd = prefixLen + matched[0].length;
	var resolvePackage = matched[0];
	var packagePath = resolvePackageAndCache(resolvePackage);
	var resolveTo = packagePath + to.substring(packageNameEnd);
	//log.debug('trying to resolve npm path:', to, ', target package', resolvePackage, '-->', resolveTo);
	return resolveTo;
}
