Swig template loader
--------

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
```js
var swig = require('swig');
var templateLoader = require('swig-package-tmpl-loader');
templateLoader.swigSetup(swig); // Calls swig.setDefaults({loader: templateLoader.createLoader()});

swig.renderFile('sampleFile', {locals: {}});
```
