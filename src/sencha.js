/** MIT License (c) copyright VMware */

/**
 * curl Sencha Module loader - for use with ExtJS 4.1+ or Sencha Touch 2.1+
 *
 * Heavily borrows from curl's cjsm11 loader
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 */

/**
 * @experimental
 */
(function (global, document) {

	define(function () {

		var head, insertBeforeEl, injectSource, cache;

		head = document && (document['head'] || document.getElementsByTagName('head')[0]);
		// to keep IE from crying, we need to put scripts before any
		// <base> elements, but after any <meta>. this should do it:
		insertBeforeEl = head && head.getElementsByTagName('base')[0] || null;

		cache = {};
		
		function wrapSource (source, resourceId, fullUrl) {
			var sourceUrl = fullUrl ? '/*\n////@ sourceURL=' + fullUrl.replace(/\s/g, '%20') + '.js\n*/' : '';
			return "(function (global) {\n" +
					"define('" + resourceId + "'," +
											//Didn't want to expose the global Ext, but there are some sad cases where Ext code requires it
			(!global.Ext ? "[],function(){" + source + "\nglobal.Ext = Ext;\nreturn Ext;\n" :
											//This could be a bit over-optimistic, but seems to work with every module tried so far
											"['Ext'],function(Ext){\nvar mod = " + source + "\n return mod;\n") +
			"});\n})(this);\n" + sourceUrl + "\n";
		}

		injectSource = function (el, source) {
			injectSource = ('text' in el) ?
				function (el, source) { el.text = source; } :
				function (el, source) { el.appendChild(document.createTextNode(source)); };
			injectSource(el, source);
		};

		function injectScript(source) {
			var el = document.createElement('script');
			injectSource(el, source);
			el.charset = 'utf-8';
			head.insertBefore(el, insertBeforeEl);
		}
		
		function extractDeps(src) {
			//TODO - All of this regex parsing is pretty heinous - is there a better way?
			var commentsEx = /(\/\*([\s\S]*?)\*\/)/mg,
				extendEx = /\bextend\b\s*:\s*(["'])([^\1]+?)\1/m,
				requiresEx = /\brequires\b\s*:\s*([\["'])([^\]^\1]+?)(?:\]|\1)/m,
				mixinsEx = /\bmixins\b\s*:\s*[{\[]([^\]^}]+?)(?:\]|})/m,
				unwantedEx = /\s|"|'|\b\w+?\b\s*:\s*/gm,
				deps = [];
				
			src = src.replace(commentsEx, '');
			deps = extendEx.test(src) ? deps.concat(extendEx.exec(src)[2]) : deps;
			deps = requiresEx.test(src) ? deps.concat(requiresEx.exec(src)[2].replace(unwantedEx, "").split(",")) : deps;
			deps = mixinsEx.test(src) ? deps.concat(mixinsEx.exec(src)[1].replace(unwantedEx, "").split(",")) : deps;
			
			return deps.filter(
						function (cl) {
							var ns = global, exists;
							
							//if (cache[cl]) { console.log("Cache hit for " + cl); }
							cache[cl] = exists = cache[cl] || cl.split(".").every(function (path, index) {
								return (ns = ns[path]);
							});
							//if (exists) { console.log('Already loaded ' + cl); }
							return !exists;
						})
						.map(function (cl) {
							return cl.replace(/\./g, "/");
						});
		}
		
		function resolvePath(resourceId) {
			var pathEx = /^.+?\//, prefix, rootPath, extPath, path;
			//console.log("Resolving path for " + resourceId);
			prefix = pathEx.exec(resourceId)[0];
			extPath = global.Ext.Loader.getPath(resourceId.replace(/\//g, ".")).replace(/\.js$/, "");
			rootPath = pathEx.exec(extPath)[0];
			path = prefix !== rootPath ? prefix + extPath : extPath;
			//console.log("Resolved to " + path);
			return path;
		}

		wrapSource['load'] = function (resourceId, require, callback, config) {
			
			var path = (!global.Ext ? resourceId : resolvePath(resourceId)) + ".js",
			    moduleMap;
			
			require(['text!' + path], function (source) {
			
				// find dependencies
				moduleMap = (global.Ext ? extractDeps(source) : ['']);
				
				//console.log("Module Map for " + resourceId + " : " + moduleMap);
				
				// get deps
				require(moduleMap, function () {

					//console.log("All dependencies resolved for " + resourceId);
					
					// wrap source in a define
					source = wrapSource(source, resourceId);
					
					injectScript(source);
					
					cache[resourceId] = true;

					// call callback now that the module is defined
					callback(require(resourceId));

				}, callback['error'] || function (ex) { throw ex; });

			}, callback['error'] || function (ex) { throw ex; });
		
		};

		wrapSource['cramPlugin'] = '../cram/sencha';

		return wrapSource;

	});

})(this, this.document);
