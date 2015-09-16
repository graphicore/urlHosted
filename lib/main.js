requirejs.config({
    baseUrl: 'lib'
  , paths: {
        'require/domReady': 'bower_components/requirejs-domready/domReady'
    }
});

require([
    'require/domReady'
], function(
    domReady
) {


    function main () {

        document.body.innerHTML = '<h1>HI!</h1>';
    }

    domReady(main);
});
