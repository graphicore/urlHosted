define([
    'marked'
], function(
    marked
){
    "use strict";
    /*global document:true setTimeout:true*/

    function appendChildren(elem, contents, cloneChildNodes) {
        var _contents, i, l, child;

        if(contents === undefined)
            _contents = [];
        else
            _contents = contents instanceof Array ? contents : [contents];

        for(i=0,l=_contents.length;i<l;i++) {
            child = _contents[i];
            if(typeof child.nodeType !== 'number')
                child = document.createTextNode(child);
            else if(cloneChildNodes)
                child = child.cloneNode(true);//always a deep clone
            elem.appendChild(child);
        }
    }

    function createElement(tagname, attr, contents, cloneChildNodes) {
        var elem = document.createElement(tagname)
          , k
          ;

        if(attr) for(k in attr)
            elem.setAttribute(k, attr[k]);

        appendChildren(elem, contents, cloneChildNodes);
        return elem;
    }


    function makeCell(thing, cloneChildNodes) {
        return createElement('td', {dir:'RTL'}, thing);
    }

    function makeRow(cells) {
        return createElement('tr', null, cells.map(makeCell));
    }
    function makeTable(rows) {
        return createElement('tbody', null , rows.map(makeRow));
    }

    function makeTableHead(attr, text, colCount) {
        return createElement('thead', attr ,
            createElement('tr', null ,
                createElement('td', {'colspan': colCount} , text)
            )
        );
    }

    function onLoad(main, doc) {
        var _doc = doc || document;
        if(_doc.readyState === 'complete')
            // make it async to reduce confusion
            setTimeout(main, 0);
        else
            _doc.addEventListener("DOMContentLoaded", main);
    }

    function createElementfromHTML(tag, attr, innerHTMl) {
        var element = createElement(tag, attr);
        element.innerHTML = innerHTMl;
        return element;
    }

    function createElementfromMarkdown(tag, attr, mardownText) {
        return createElementfromHTML(tag, attr, marked(mardownText, {gfd: true}));
    }

    function createFragment(contents, cloneChildNodes) {
        var frag = document.createDocumentFragment();
        appendChildren(frag, contents, cloneChildNodes);
        return frag;
    }

    function isDOMElement(node) {
        return node && node.nodeType && node.nodeType === 1;
    }

    function replaceNode(newNode, oldNode){
        oldNode.parentNode.replaceChild(newNode, oldNode);
    }

    return {
        createElement: createElement
      , makeCell: makeCell
      , makeRow: makeRow
      , makeTable: makeTable
      , makeTableHead: makeTableHead
      , onLoad: onLoad
      , createElementfromHTML: createElementfromHTML
      , createElementfromMarkdown: createElementfromMarkdown
      , appendChildren: appendChildren
      , createFragment: createFragment
      , isDOMElement: isDOMElement
      , replaceNode: replaceNode
    };
});
