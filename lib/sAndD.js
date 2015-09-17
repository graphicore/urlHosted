define([
    'pako'
], function(
    pako
) {
    "use strict";
    /*global atob:true btoa:true*/

    function serialize(data) {
        return btoa( // to base64
                    pako.deflate( // compress
                        JSON.stringify(data) // serialize
                      , { to: 'string' }));
    }

    function deserialize(payload) {
        return JSON.parse( // deserialize
                    pako.inflate( // decompress
                        atob(payload) // from base64
                      , { to: 'string' }));
    }

    return {
        serialize: serialize
      , deserialize: deserialize
    }
});
