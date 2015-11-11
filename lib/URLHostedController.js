define([
    'urlHosted/BaseController'
  , 'urlHosted/dom-tool'
], function(
    Parent
  , dom
) {
    "use strict";
    /*global document:true window:true location:true*/

    var createElement = dom.createElement
      , createElementfromMarkdown = dom.createElementfromMarkdown
      ;

    var defaults = {
        displayTemplate: '<header>{title}<span class="author"><em>by</em> {author}</span>'
                        + ' <span class="date"><em>generated on</em> {date} </header>{content}'
      , inputTemplate: '<label>{title}</label><label>{content}</label><label>{author}</label> {done}'
      , placeholderTitle: 'The Title'
      , placeholderName: 'Your Name'
      , placeholderContent:'Write your post here. You can use Markdown!'
    };

    function URLHostedController(hostElement, config) {
        Parent.call(this, hostElement, Parent.makeConfig(config, defaults));
    }
    var _p = URLHostedController.prototype = Object.create(Parent.prototype);
    _p.constructor = URLHostedController;

    // model

    /**
     * Return an object with key value pairs of {name, form-input-element}
     *
     * This method is called once initially.
     */
    _p._createInputs = function() {
        return {
            title: createElement('input', {type: 'text', 'class': 'input-title'
                            , placeholder:  this._config.placeholderTitle})
          , author: createElement('input', {type: 'text', 'class': 'input-author'
                            , placeholder: this._config.placeholderName})
          , content: createElement('textarea', {'class': 'input-content'
                            , placeholder: this._config.placeholderContent})
        };
    };

    /**
     * Read data from the objects created in _createInputs
     *
     * Return key->value pairs where the values should be strings or
     * behave well when being casted to strings.
     */
    _p._readData = function(inputElements) {
        return {
            title: inputElements.title.value
          , author: inputElements.author.value
          , content: inputElements.content.value
        };
    };

    /**
     * Write data to the objects created in _createInputs.
     * NOTE: this is user input, so be careful with the data.
     */
    _p._writeData = function(inputElements, data) {
        inputElements.title.value = data.title
            ? data.title + ''
            : ''
            ;

        inputElements.author.value = data.author
            ? data.author + ''
            : ''
            ;

        inputElements.content.value = data.content
            ? data.content + ''
            : ''
            ;
    };

    /**
     * Return an object with key value pairs of {name: html-element}
     *
     * The keys of data correspond with the keys of the return value of _createInputs
     * plus, if used, a date or null at this._config.lastGeneratedKey.
     *
     * This method will be called initially and for each update i.e. these
     * elements are replaced on each update.
     */
    _p._createDisplays = function(data) {
        return {
            title: createElement('h1', null, data.title)
          , author: createElement('span', null
                          , data.author || this._config.authorFallback)
          , content: createElementfromMarkdown('div', {'class': 'display-content'}
                          , data.content || "")
          , date: createElement(
                            'time'
                          , {
                                'class': 'display-date'
                              , datetime: data.date && data.date.toISOString() || ''
                            }
                          , data.date || ''
            )
        };
    };

    return URLHostedController;
});
