var _ = require('lodash');
var Path = require('path');
var fs = require('fs');

/**
 * create loader
 * @param  {object} swig	 The require('swig') instance
 * @param  {string} basepath Same as swig.loaders.fs
 * @param  {string} encoding Same as swig.loaders.fs
 * @param  {boolean} opts.memoize True if use _.memoize() to cache require.resolve's result, default is `true`
 * @param {boolean} opts.prefix default is `npm://`
 * @param {requireInjector} opts.injector you can use with [require-injector](https://www.npmjs.com/package/require-injector)
 * @param {(file: string, content: string) => string} opts.fileContentHandler You can transform origin file content to new content
*/
exports.createLoader = function(swig, basepath, encoding, opts) {
	encoding = encoding || 'utf8';
	opts = _.assign({
		memoize: true,
		prefix: 'npm://'
	}, opts ? opts : {});
	var originLoader = swig.loaders.fs.apply(swig.loaders, [].slice.call(arguments, 1, 3));
	//var _resolvePackage = (opts.memoize !== false ) ? _.memoize(resolvePackage) : resolvePackage ;

	var loader = {
		opts,
		resolve: function(to, from) {
			if (_.startsWith(to, opts.prefix)) {
				return originLoader.resolve.call(this, this.resolveTo(to, from), from);
			}
			return originLoader.resolve.apply(this, arguments);
		},
		load: function(identifier, cb) {
			if (!fs || (cb && !fs.readFile) || !fs.readFileSync) {
				throw new Error('Unable to find file ' + identifier + ' because there is no filesystem to read from.');
			}

			identifier = loader.resolve(identifier);

			if (cb) {
				fs.readFile(identifier, encoding, content => {
					cb(hackFile(identifier, content, opts.fileContentHandler));
				});
				return;
			}
			return hackFile(identifier, fs.readFileSync(identifier, encoding), opts.fileContentHandler);
		},
		resolveTo: resolveTo
	};

	return loader;
};

/**
 * Call swig.setDefaults({loader: exports.createLoader()});
 * @param  {swig} swig
 * @param {boolean} opts.memoize True if use _.memoize() to cache require.resolve's result, default is `true`
 * @param {boolean} opts.prefix default is `npm://`
 * @param {requireInjector} opts.injector you can use with [require-injector](https://www.npmjs.com/package/require-injector)
 * @param {(file: string, content: string) => string} opts.fileContentHandler You can transform origin file content to new content
 */
exports.swigSetup = function(swig, opts) {
	swig.setDefaults({loader: exports.createLoader(swig, undefined, undefined, opts)});
};
exports.resolveTo = function(to, from, injector) {
	var tempObj = {
		opts: {
			prefix: 'npm://',
			injector: injector
		},
		resolveTo: resolveTo
	};
	return tempObj.resolveTo(to, from);
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

function hackFile(file, content, hacker) {
	if (hacker)
		return hacker(file, content);
	else
		return content;
}





