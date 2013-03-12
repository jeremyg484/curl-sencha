/** MIT License (c) copyright VMware */

/**
 * cram Sencha modules plugin - for use with ExtJS 4.1+ or Sencha Touch 2.1+
 * //TODO - this is completely untested
 */
define(['curl/cram/jsEncode', '../sencha'], function (jsEncode, wrapSencha) {

	return {
		compile: function (pluginId, resId, req, io, config) {
			io.read(resId, function (text) {
				io.write(jsEncode(wrapSencha(text, resId)));
			}, io.error);
		}
	};

});