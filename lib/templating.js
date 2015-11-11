define([
    'urlHosted/dom-tool'
], function(
    dom
) {
    "use strict";

    var createElement = dom.createElement
      , replaceNode = dom.replaceNode
      ;

    function prepareTemplate(template, tagPrefix, keys) {
        var i, l, k, find, replace, tag, result = template;
        for(i=0,l=keys.length;i<l;i++) {
            k = keys[i];
            find = '{'+k+'}';
            tag  = tagPrefix + k;
            replace = '<'+tag+'></'+tag+'>';
            result = result.replace(new RegExp(find, 'g'), replace);
        }
        return result;
    }

    /**
     * Note that using a placeholder multiple times will NOT copy the element.
     * The element will be set to the first matching placeholder instead.
     */
    function fillParsedTemplate(templateElement, tagPrefix, children) {
        var k, items;
        for(k in children) {
            items = templateElement.getElementsByTagName(tagPrefix + k);
            if(!items.length)
                continue;
            replaceNode(children[k], items[0]);
        }
    }

    function setElementContentFromTemplate(element, template, data) {
        var prefix = 'template-tag-'
          , prepared = prepareTemplate(template, prefix, Object.keys(data))
          ;
        element.innerHTML = prepared;
        fillParsedTemplate(element, prefix, data);
    }

    function createElementFromTemplate(tag, attr, template, data) {
        var element = createElement(tag, attr);
        setElementContentFromTemplate(element, template, data);
        return element;
    }

    return {
        prepareTemplate: prepareTemplate
      , fillParsedTemplate: fillParsedTemplate
      , setElementContentFromTemplate: setElementContentFromTemplate
      , createElementFromTemplate: createElementFromTemplate
    };
});
