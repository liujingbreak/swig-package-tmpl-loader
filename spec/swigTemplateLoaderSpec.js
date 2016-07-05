var tmploader = require('../swigTemplateLoader.js');
var Path = require('path');
var swig = require('swig');
var shell = require('shelljs');

describe('swig-template-loader', ()=> {
	beforeAll(()=> {
		shell.cp('-r', 'spec/node_modules/*', 'node_modules');
	});

	it('.resolveTo(to) should work', ()=> {
		var file = tmploader.testable.resolveTo('npm://mothership/package.json');
		expect(Path.relative(process.cwd(), file).replace(/\\/g, '/')).toBe('node_modules/mothership/package.json');
	});

	it('loader should work for swig.renderFile()', ()=> {
		var loader = tmploader.createLoader(swig);
		spyOn(loader, 'resolve').and.callThrough();
		swig.setDefaults({loader: loader});
		var out = swig.renderFile(Path.resolve(__dirname, 'template-1.html'), {locals: {}});
		console.log(loader.resolve.calls.allArgs());
		console.log(out);
		expect(out.indexOf('hellow include')).toBeGreaterThan(0);
		expect(out.indexOf('hellow import')).toBeGreaterThan(0);
	});

	it('swigSetup() should work for swig.renderFile()', ()=> {
		swig.setDefaults({loader: null});
		tmploader.swigSetup(swig);
		var out = swig.renderFile(Path.resolve(__dirname, 'template-1.html'), {locals: {}});
		expect(out.indexOf('hellow include')).toBeGreaterThan(0);
		expect(out.indexOf('hellow import')).toBeGreaterThan(0);
	});
});
