var tmploader = require('../swigTemplateLoader.js');
var Path = require('path');
var swig = require('swig-templates');
var shell = require('shelljs');
var rj = require('require-injector');

describe('swig-template-loader', ()=> {
	beforeAll(()=> {
		shell.cp('-rf', 'spec/node_modules/*', 'node_modules');
	});

	xit('.resolveTo(to) should work', ()=> {
		var foo = {
			opts: {
				prefix: 'npm://'
			},
			resolveTo: tmploader.testable.resolveTo
		};
		var file = foo.resolveTo('npm://mothership/package.json', __dirname,
			tmploader.testable.resolvePackage);
		expect(Path.relative(process.cwd(), file).replace(/\\/g, '/')).toBe('node_modules/mothership/package.json');
	});

	it('loader should work for swig.renderFile()', ()=> {
		var loader = tmploader.createLoader(swig);
		spyOn(loader, 'resolve').and.callThrough();
		swig.setDefaults({loader: loader});
		var out = swig.renderFile(Path.resolve(__dirname, 'template-1.html'), {locals: {}});
		console.log(loader.resolve.calls.allArgs());
		console.log(out);
		expect(out.indexOf('hellow include') >= 0).toBe(true);
		expect(out.indexOf('hellow import') >= 0).toBe(true);
		expect(out.indexOf('hellow @dr/test2') >= 0).toBe(true);
		expect(out.indexOf('hellow normal') >= 0).toBe(true);
	});

	it('swigSetup() should work for swig.renderFile()', ()=> {
		swig.setDefaults({loader: null});
		tmploader.swigSetup(swig);
		var out = swig.renderFile(Path.resolve(__dirname, 'template-1.html'), {locals: {}});
		expect(out.indexOf('hellow include') >= 0).toBe(true);
		expect(out.indexOf('hellow import') >= 0).toBe(true);
		expect(out.indexOf('hellow @dr/test2') >= 0).toBe(true);
		expect(out.indexOf('hellow normal') >= 0).toBe(true);
	});

	it('When prefix is "xyz" swigSetup() should work for swig.renderFile()', ()=> {
		swig.setDefaults({loader: null});
		tmploader.swigSetup(swig, {
			prefix: 'xyz:'
		});
		var out = swig.renderFile(Path.resolve(__dirname, 'template-prefix.html'), {locals: {}});
		expect(out.indexOf('hellow include')).toBeGreaterThan(0);
		expect(out.indexOf('hellow import')).toBeGreaterThan(0);
	});

	it('require-inejctor .substitute() should work', ()=> {
		var injector = rj();
		swig.setDefaults({loader: null});
		injector.fromDir(process.cwd())
			.substitute('test', '@dr/test2');
		tmploader.swigSetup(swig, {injector: injector});
		var out = swig.renderFile(Path.resolve(__dirname, 'template-inject-subs.html'), {locals: {}});
		console.log(out);
		expect(out.indexOf('hellow @dr/test2/template-2.html') >= 0).toBe(true);
		expect(out.indexOf('hellow import @dr/test2') >= 0).toBe(true);
		expect(out.indexOf('hellow @dr/test2') >= 0).toBe(true);
		expect(out.indexOf('hellow normal') >= 0).toBe(true);
	});

	it('require-inejctor .swigTemplateDir() should work', ()=> {
		var injector = rj();
		//swig.invalidateCache();
		swig.setDefaults({loader: null});
		injector.fromDir(process.cwd())
			.swigTemplateDir('test', 'node_modules/@dr/test2');
		tmploader.swigSetup(swig, {injector: injector});
		var out = swig.renderFile(Path.resolve(__dirname, 'template-inject-swig.html'), {locals: {}});
		expect(out.indexOf('hellow @dr/test2/template-2.html') >= 0).toBe(true);
		expect(out.indexOf('hellow import @dr/test2') >= 0).toBe(true);
		expect(out.indexOf('hellow @dr/test2') >= 0).toBe(true);
		expect(out.indexOf('hellow normal') >= 0).toBe(true);
	});
});
