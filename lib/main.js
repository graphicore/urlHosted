requirejs.config({
    baseUrl: 'lib'
  , paths: {
        'require/domReady': 'bower_components/requirejs-domready/domReady'
      , 'marked': 'bower_components/marked/lib/marked'
      , 'pako': 'bower_components/pako/dist/pako.min'
      , 'urlHosted': './'
    }
});

require([
    'require/domReady'
  , 'urlHosted/URLHostedController'
], function(
    domReady
  , URLHostedController
) {
    "use strict";
    /*global document:true*/
    function main () {
        var ctrl = new URLHostedController(document.body);
    }
    domReady(main);
});
