Swig template loader
--------
<img src="https://travis-ci.org/dr-web-house/swig-package-tmpl-loader.svg" alt="build:">

Allow you to reference `npm://<package name>/filepath` in your Swig template's `include` and `import` tags.

It extends swig default loader: `swig.loaders.fs`
[Swig builtin loaders](http://paularmstrong.github.io/swig/docs/loaders/#builtin)

e.g.

```html
{% import "npm://package-a/spec/template-3.html" as foo %}

{% include "npm://@scope-name/package-b/views/template-2.html" %}

{{foo.doSomething()}}

```

It uses `require.resolve()` to locate and cache package path by its name, replace `npm://...` with exact package path when swig loads your template
```
npm install swig-package-tmpl-loader
```
```js
var swig = require('swig');
var templateLoader = require('swig-package-tmpl-loader');
templateLoader.swigSetup(swig); // Calls swig.setDefaults({loader: templateLoader.createLoader()});

swig.renderFile('sampleFile', {locals: {}});
```
Now you can split your template files to different Node modules , publish and share them with fellows.

### <a name="injection">Injection</a>
When Working with [require-injector](https://www.npmjs.com/package/require-injector), it supports package Name and package path injection, like IoC container does.
```js
var rj = require('require-injector');
var tmploader = require('swig-package-tmpl-loader');
// Setup injector
var injector = rj();
injector.fromDir(process.cwd())
	.substitute('oldPackage', 'newPackage');
// Or
injector.fromDir(process.cwd())
	.swigTemplateDir('oldPackage', 'node_modules/newPackage');

// Setup Swig
tmploader.swigSetup(swig, {injector: injector});
var out = swig.renderFile('./template.html'), {locals: {}});
```
While in `template.html`
```
{% include "npm://oldPackage/includedTemplate.html" %}
```
Will actually work as
`{% include "npm://newPackage/includedTemplate.html" %}`



### API
#### 1. swigSetup(swig, opts)
It calls `swig.setDefaults({loader: templateLoader.createLoader()})`\
Parameters:
- `swig`\
Instance of `require('swig')`
- `opts.memoize`, True if use _.memoize() to cache require.resolve's result, default is `true`.
- `opts.prefix`, default is `npm://`
- `opts.injector` [require-injector](https://www.npmjs.com/package/require-injector)

#### 2. createLoader(swig, basepath, encoding, opts)
create file system loader.\
Parameter is same as what `swig.loaders.fs` has, except:
- `swig`\
Instance of `require('swig')`
- `opts.memoize`, True if use _.memoize() to cache require.resolve's result, default is `true`.
- `opts.prefix`, default is `npm://`
