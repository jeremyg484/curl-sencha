var curlConfig = {
	paths: {
		curl: 'components/curl/src/curl',
		sencha: 'src/sencha'
	},
	packages: [{
		name: 'Ext',
		location: 'components/ext',
		main: 'ext',
		config: {
			moduleLoader: 'sencha'
		}
	}, {
		name: 'MyCompany',
		location: 'test/MyCompany',
		config: {
			moduleLoader: 'sencha'
		}
	}],
	preloads: ['Ext']
};

var global = this;

describe('Using Curl to load Ext', function () {
	curl(curlConfig);
	
	var loadSpy;
	beforeEach(function () {
		var done = false;
		curl(['Ext']).then(function (Ext) {
			loadSpy = spyOn(Ext.Loader, 'loadScriptFile');
			done = true;
		});
		waitsFor(function () {
			return done;
		});
	});
	
	afterEach(function () {
		expect(loadSpy).not.toHaveBeenCalled();
	});

	it('should be able to load the top-level Ext object', function () {
		var done = false;
		curl(['Ext']).then(function (localExt) {
			var foo = false;
			expect(global.Ext).toBeDefined();
			expect(localExt).toBeDefined();
			expect(global.Ext.define).toBeDefined();
			expect(global.Ext.create).toBeDefined();
			expect(localExt.define).toBeDefined();
			expect(localExt.create).toBeDefined();
			done = true;
		});
		waitsFor(function () {
			return done;
		});
	});


	it('should be able to load an AMD module that defines an Ext class', function () {
		var done = false;
		curl(['test/TestExtClassAMD', 'Ext']).then(function (cl, Ext) {
			var foo, foo2, foo3;

			expect(cl).toBeDefined();

			expect(cl.create).toBeDefined();

			foo = new cl();
			expect(foo.bar).toBe(foo.getBar());
			foo.setBar('baz');
			expect(foo.getBar()).toBe('baz');

			foo2 = Ext.create('test.TestExtClassAMD');
			expect(foo2.bar).toBe(foo2.getBar());
			foo2.setBar('baz');
			expect(foo2.getBar()).toBe('baz');

			foo3 = cl.create();
			expect(foo3.bar).toBe(foo3.getBar());
			foo3.setBar('baz');
			expect(foo3.getBar()).toBe('baz');

			done = true;
		});
		waitsFor(function () {
			return done;
		});
	});

	it('should be able to load vanilla Ext modules with no dependencies', function () {
		var done = false;
		curl(['MyCompany/test/TestExtClass']).then(function (cl) {
			var inst1, inst2;
			expect(cl).toBeDefined();
			inst1 = cl.create();
			expect(inst1).toBeDefined();
			inst2 = new cl();
			expect(inst2).toBeDefined();
			done = true;
		});
		waitsFor(function () {
			return done;
		});
	});

	it('should be able to load provided Ext modules with dependencies', function () {
		var done = false;
		
		curl(['Ext', 'Ext/form/field/ComboBox', 'Ext/data/Store']).then(function (Ext, cb) {
			var inst1, inst2;
			try {
				expect(cb).toBeDefined();
				inst1 = cb.create();
				expect(inst1).toBeDefined();
				inst2 = new cb();
				expect(inst2).toBeDefined();
			} catch (e) {
				expect(e).toBeUndefined();
				throw e;
			}
			done = true;
		}, function (e) {
			expect(e).toBeUndefined();
			done = true;
			throw e;
		});
		waitsFor(function () {
			return done;
		});
	});
});