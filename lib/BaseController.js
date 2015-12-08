define([
    'urlHosted/dom-tool'
  , 'urlHosted/templating'
  , 'urlHosted/sAndD'
], function(
    dom
  , templating
  , sAndD
) {
    "use strict";
    /*global document:true window:true location:true*/

    var createElement = dom.createElement
      , createElementfromMarkdown = dom.createElementfromMarkdown
      , replaceNode = dom.replaceNode
      , createElementFromTemplate = templating.createElementFromTemplate
      , setElementContentFromTemplate = templating.setElementContentFromTemplate
      , deserialize = sAndD.deserialize
      , serialize = sAndD.serialize
      ;


    function NotImplementedError(message) {
        this.name = 'NotImplementedErrot';
        this.message = message || 'Something is not implemented.';
        this.stack = (new Error()).stack;
    }
    NotImplementedError.prototype = Object.create(Error.prototype);
    NotImplementedError.prototype.constructor = NotImplementedError;


    function makeConfig(userConfig, defaults) {
        var k, config = Object.create(defaults);
        for(k in userConfig) config[k] = userConfig[k];
        return config;
    }

    var defaults = {
        documentTitleFormat: '{title} | urlHosted'
      , documentTitleFallback: '(untitled)'
      , authorFallback: '(anonymus)'
      , displayTemplate: '(this needs to be filled by the subclass)'
      , inputTemplate: '(this needs to be filled by the subclass)'
      , controlsTemplate: '<h3 class="app-title">urlHosted</h3> {edit} {generate} <a class="about" href="about.html">about</a> {shareBox}'
      , shareBoxTemplate: '<span class="call-to-action">Share your post</span> {link} <p class="tip">ProTip: use a URL-shortener service with this link!</p>'
      , generateLabel: 'Share!'
      , editLabel: 'Edit'
      , doneLabel: 'Done'
      , dataMark: '?'
      // the render function will try to pick the document title from this key in the data
      , titleKey: 'title'
      // if this is set the _lastGenerated date will be stored with the data at lastGeneratedKey
      , lastGeneratedKey: 'date' // false to not save this
    };

    function BaseController(hostElement, config) {
        var data
          , k, editorElements, controls
          , onUpdate = this.updateHandler.bind(this)
          ;

        this._config = makeConfig(config, defaults);
        this._hostElement = hostElement;
        this.editing = true;
        this._lastGenerated = null;
        this._blockNextHashChangeHandler = false; // see _p.updateHandler

        // init the model
        // we need this to display possible errors
        this._infoBox = createElement('div', {'class': 'info-box'});
        // The input elements are also DOM but we initialize them first,
        // because we use them as the datastorage/model as well
        this._inputs = this._createInputs();
        this._updateLocalDataFromHash();

        // init the dom
        this._controls = this._createControlElements();
        this._doneEditing = this._controls.edit.cloneNode(true);

        data = this._readLoacalData();
        this._displays = this._createDisplays(data);

        editorElements = {};
        for(k in this._inputs)
            editorElements[k] = this._inputs[k];
        editorElements.done = this._doneEditing;

        this._articleElement = this._createArticle(this._displays);

        this.dom = createElement('main', {'class': 'url-hosted'}, [
            createElement('header', null, [
                this._createControls(this._controls)
              , this._infoBox
              , this._createEdit(editorElements)
            ])
          , this._articleElement
        ]);

        // wire the controller up
        this._controls.edit.addEventListener('click', this.toggleEditHandler.bind(this));
        this._doneEditing.addEventListener('click', this.toggleEditHandler.bind(this));

        this._controls.generate.addEventListener('click', this.toggleSharebox.bind(this));
        for(k in this._inputs)
            this._inputs[k].addEventListener(
                (this._inputs[k].tagName.toLowerCase() === 'textarea'
                    || this._inputs[k].getAttribute('type') === 'text')
                                ? 'input'
                                : 'change'
                , onUpdate
            );
         // Listen to hash changes.
        window.addEventListener('hashchange', this.hashChangeHandler.bind(this), false);

        // mount into the document
        this._hostElement.appendChild(this.dom);
    }
    var _p = BaseController.prototype;
    _p.constructor = BaseController;

    // export static functions
    BaseController.makeConfig = makeConfig;
    BaseController.NotImplementedError = NotImplementedError;

    /**
     * Implement this!
     *
     * Return an object with key value pairs of {name, form-input-element}
     *
     * This method is called once initially.
     */
    _p._createInputs = function() {
        throw new NotImplementedError('_createInputs must be implemented by a subclass.');
    };

    /**
     * Implement this!
     *
     * Read data from the objects created in _createInputs
     *
     * Return key->value pairs where the values should be strings or
     * behave well when being casted to strings.
     */
    _p._readData = function(inputElements) {
        throw new NotImplementedError('_readData must be implemented by a subclass.');
    };

    /**
     * Implement this!
     *
     * Write data to the objects created in _createInputs.
     * NOTE: this is user input, so be careful with the data.
     */
    _p._writeData = function(inputElements, data) {
        throw new NotImplementedError('_writeData must be implemented by a subclass.');
    };

    /**
     * Implement this!
     *
     * Return an object with key value pairs of {name: html-element}
     *
     * The keys of data correspond with the keys of the return value of _createInputs
     * plus, if used, a date or null at this._config.lastGeneratedKey.
     *
     * This method will be called initially and for each update i.e. these
     * elements are replaced on each update.
     */
    _p._createDisplays = function(data) {
        throw new NotImplementedError('_createInputs must be implemented by a subclass.');
    };

    // controller
    _p.update = function() {
        var data = this._readLoacalData();
        this._render(data);
    };

    _p.updateHandler = function() {
        if(this._config.lastGeneratedKey)
            this._lastGenerated = null;// not true anymore
        // otherwise people may share an old url!
        // hashChangeHandler must not handle this change
        // also, it fires asynchronously.
        this._blockNextHashChangeHandler = true;
        window.location.hash = '';

        this._closeShareBox();
        this._hideInfo();
        this.update();
    };

    _p.hashChangeHandler = function() {
        if(this._blockNextHashChangeHandler) {
            this._blockNextHashChangeHandler = false;
            return;
        }
        this._updateLocalDataFromHash();
        this._closeShareBox();
        this.update();
    };

    _p.toggleSharebox = function() {
        if(this._controls.shareBox.classList.contains('visible')) {
            this._closeShareBox();
            return;
        }
        this._openShareBox(this.generate());
    };

    Object.defineProperty(_p, 'editing', {
        get: function() {
            return !!this._editing;
        }
      , set: function(val) {
            this._editing = !!val;
            this._hostElement.classList[this._editing && 'add' || 'remove']('editing');
        }
    });

    _p.toggleEditHandler = function(evt) {
        evt.preventDefault();
        this.toggleEdit();
    };

    _p.toggleEdit = function() {
        this.editing = !this.editing;
    };

    _p._getPayload = function() {
        var payload = this._getPayloadFromURL(location)
          , data
          ;
        if(!payload) {
            // there was no payload
            this._hideInfo();
            return false;
        }
        try {
            data = deserialize(payload);
        } catch(e) {
            this._showInfo('I don\'t understand your data. This is the error message:', e);
            return false;
        }
        if(!data) {
            this._showInfo('I can\'t extract any information from your data');
            return false;
        }
        this._hideInfo();
        return data;
    };

    _p.generate = function() {
        var payload, link;
        if(this._config.lastGeneratedKey)
            this._lastGenerated = new Date();
        payload = serialize(this._readLoacalData());
        link = this._makeLink(payload);
        // because now we have a date
        this.update();
        return link;
    };

    _p._updateLocalDataFromHash = function() {
        var payload = this._getPayload();
        this._writeLocalData(payload || {});
        if(payload)
            // when we load fresh data the editor is turned of
            this.editing = false;

    };

    // model
    _p._readLoacalData = function() {
        var data = this._readData(this._inputs);

        if(this._config.lastGeneratedKey)
            data[this._config.lastGeneratedKey] = this._lastGenerated || null;
        return data;
    };

    _p._writeLocalData = function(data) {
        this._writeData(this._inputs, data);
        var date = null
          , checkdate
          ;
        if(this._config.lastGeneratedKey) {
            if(data[this._config.lastGeneratedKey]) {
                date = new Date(data[this._config.lastGeneratedKey]);
                checkdate = date.getDate();
                if(checkdate !== checkdate)
                    // NaN
                    date = null;
            }
            this._lastGenerated = date;
        }

    };

    _p._makeLink = function(payload) {
        return [
            location.origin
          , location.pathname
          , location.search
          , '#'
          , this._config.dataMark
          , payload
        ].join('');
    };

    _p._getPayloadFromURL = function(url) {
        // read the hash
        var hash = url.hash
          , dataPos
          , payload
          ;
        if(hash)
            hash = hash.slice(1);
        if(!hash)
            return false;

        dataPos = hash.indexOf(this._config.dataMark);
        if(dataPos === -1)
            return false;

        return hash.slice(dataPos + this._config.dataMark.length);
    };

    // view init
    _p._createControlElements = function() {

        var editChildren = [
            createElement('span', {'class': 'init'}, this._config.editLabel)
          , createElement('span', {'class': 'end'}, this._config.doneLabel)
        ];

        return {
            edit: createElement('button', {'class': 'control-edit'}, editChildren)
          , generate: createElement('button', {'class': 'control-generate'}, this._config.generateLabel)
          , shareBox: createElement('div', {'class': 'share-box'})
        };
    };

    _p._createArticle = function(displays) {
        return createElementFromTemplate('article', null, this._config.displayTemplate, displays);
    };

    _p._createEdit = function(inputs) {
        return createElementFromTemplate('form', {'class': 'edit'}, this._config.inputTemplate, inputs);
    };

    _p._createControls = function(inputs) {
        return createElementFromTemplate('div', {'class': 'controls'}, this._config.controlsTemplate, inputs);
    };

    // view behavior
    // override this this to implement more avanced behavior
    _p._render = function(data) {
        var displays
          , k
          ;
        document.title = this._config.documentTitleFormat.replace('{title}'
                            , this._config.titleKey
                                && this._config.titleKey in data
                                && data[this._config.titleKey]
                                || this._config.documentTitleFallback);

        displays = this._createDisplays(data);
        for(k in displays) {
            replaceNode(displays[k],  this._displays[k]);
            this._displays[k] = displays[k];
        }
    };

    _p._openShareBox = function(link) {
        // make it readonly
        var input = createElement('input', {
                'class':'link'
              , type: 'text'
              , value: link
              , readonly: 'readonly'
        });
        // select all text on click
        input.addEventListener('click', input.select);

        setElementContentFromTemplate(this._controls.shareBox
                        , this._config.shareBoxTemplate, {link: input});
        this._controls.shareBox.classList.add('visible');
        this._hostElement.classList.add('sharing');
    };

    _p._closeShareBox = function() {
        this._controls.shareBox.classList.remove('visible');
        this._hostElement.classList.remove('sharing');
        this._controls.shareBox.innerHTML = '';
    };

    _p._showInfo = function(/* args */) {
        var args = Array.prototype.slice.call(arguments)
               .map(function(arg){ return createElement('p', null, '' + arg);})
          , info = createElement('div',null, args)
          ;
        this._infoBox.appendChild(info);
        this._infoBox.classList.add('visible');
    };

    _p._hideInfo = function() {
        this._infoBox.classList.remove('visible');
        this._infoBox.innerHTML = '';
    };

    return BaseController;
});
