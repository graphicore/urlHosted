define([
    'domStuff'
  , 'templatingStuff'
  , 'sAndD'
], function(
    domStuff
  , templatingStuff
  , sAndD
) {
    "use strict";
    /*global document:true window:true location:true*/

    var createElement = domStuff.createElement
      , createElementfromMarkdown = domStuff.createElementfromMarkdown
      , replaceNode = domStuff.replaceNode
      , createElementFromTemplate = templatingStuff.createElementFromTemplate
      , setElementContentFromTemplate = templatingStuff.setElementContentFromTemplate
      , deserialize = sAndD.deserialize
      , serialize = sAndD.serialize
      ;

    function makeConfig(userConfig, defaults) {
        var k, config = Object.create(defaults);
        for(k in userConfig) config[k] = userConfig[k];
        return config;
    }

    var defaults = {
        documentTitleFormat: '{title} | urlHosted'
      , documentTitleFallback: '(untitled)'
      , authorFallback: '(anonymus)'
      , articleTemplate: '<header>{title}<span class="author"><em>by</em> {author}</span>'
                        + ' <span class="date"><em>generated on</em> {date} </header>{content}'
      , editTemplate: '<label>{title}</label><label>{content}</label><label>{author}</label>'
      , controlsTemplate: '<h3 class="app-title">urlHosted</h3> {edit} {generate} <a class="about" href="about.html">about</a> {shareBox}'
      , shareBoxTemplate: '<span class="call-to-action">Share your post</span> {link} <p class="tip">ProTip: use a URL-shortener service with this link!</p>'
      , generateLabel: 'Share!'
      , editLabel: 'Edit'
      , dataMark: '?'
      , placeholderTitle: 'The Title'
      , placeholderName: 'Your Name'
      , placeholderContent:'Write your post here. You can use Markdown!'
    };

    function URLHostedController(hostElement, config) {
        var data
          , k
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
        data = this._readLoacalData();
        this._displays = this._createDisplays(data);
        this.dom = createElement('main', {'class': 'url-hosted'}, [
            createElement('header', null, [
                this._createControls(this._controls)
              , this._infoBox
              , this._createEdit(this._inputs)
            ])
          , this._createArticle(this._displays)
        ]);

        // wire the controller up
        this._controls.edit.addEventListener('click', this.toggleEdit.bind(this));
        this._controls.generate.addEventListener('click', this.toggleSharebox.bind(this));
        for(k in this._inputs)
            this._inputs[k].addEventListener('input', onUpdate);
         // Listen to hash changes.
        window.addEventListener('hashchange', this.hashChangeHandler.bind(this), false);

        // mount into the document
        this._hostElement.appendChild(this.dom);
    }
    var _p = URLHostedController.prototype;

    // export static functions
    URLHostedController.makeConfig = makeConfig;

    // controller
    _p.update = function() {
        var data = this._readLoacalData();
        this._render(data);
    };

    _p.updateHandler = function() {
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
        return {
            title: this._inputs.title.value
          , author: this._inputs.author.value
          , date: this._lastGenerated || null
          , content: this._inputs.content.value
        };
    };

    _p._writeLocalData = function(data) {
        this._inputs.title.value = data.title
            ? data.title + ''
            : ''
            ;

        this._inputs.author.value = data.author
            ? data.author + ''
            : ''
            ;

        this._inputs.content.value = data.content
            ? data.content + ''
            : ''
            ;
        var date = null
          , checkdate
          ;
        if(data.date) {
            date = new Date(data.date);
            checkdate = date.getDate();
            if(checkdate !== checkdate)
                // NaN
                date = null;
        }
        this._lastGenerated = date;
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

    _p._createControlElements = function() {
        return {
            edit: createElement('button', {'class': 'control-edit'}, this._config.editLabel)
          , generate: createElement('button', {'class': 'control-generate'}, this._config.generateLabel)
          , shareBox: createElement('div', {'class': 'share-box'})
        };
    };

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

    _p._createArticle = function(displays) {
        return createElementFromTemplate('article', null, this._config.articleTemplate, displays);
    };

    _p._createEdit = function(inputs) {
        return createElementFromTemplate('form', {'class': 'edit'}, this._config.editTemplate, inputs);
    };

    _p._createControls = function(inputs) {
        return createElementFromTemplate('div', {'class': 'controls'}, this._config.controlsTemplate, inputs);
    };

    // view behavior
    _p._render = function(data) {
        var displays
          , k
          ;
        document.title = this._config.documentTitleFormat.replace('{title}'
                            , data.title || this._config.documentTitleFallback);

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

    return URLHostedController;
});
