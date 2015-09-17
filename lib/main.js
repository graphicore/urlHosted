requirejs.config({
    baseUrl: 'lib'
  , paths: {
        'require/domReady': 'bower_components/requirejs-domready/domReady'
      , 'marked': 'bower_components/marked/lib/marked'
      , 'pako': 'bower_components/pako/dist/pako.min'
    }
});

require([
    'require/domReady'
  , 'domStuff'
  , 'pako'
], function(
    domReady
  , domStuff
  , pako
) {
    "use strict";
    /*global document:true window:true location:true atob:true btoa:true*/

    var createElement = domStuff.createElement
      , createElementfromMarkdown = domStuff.createElementfromMarkdown
      ;


    function replaceNode(newNode, oldNode){
        oldNode.parentNode.replaceChild(newNode, oldNode);
    }

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

    // data will be:
    // title // default ""
    // author // default ""
    // date // Date set automatically, if the data has no date, it is not displayed
    // content // default ""
    // edit// bool, default false -> check extra link generation to make true

    // title: input type text
    // author: input type text
    // date: only changed when link is generated i.e. "last generated" date
    // content: textarea
    // edit: checkbox => post a note to the generate button if edit is true

    var defaults = {
        documentTitleFormat: '{title} | urlHosted'
      , documentTitleFallback: '(untitled)'
      , authorFallback: '(anonymus)'
      , articleTemplate: '<header>{title}<span class="author"><em>by</em> {author}</span>'
                        + ' <span class="data"><em>generated on</em> {date} </header>{content}'
      , editTemplate: '<label>{title}</label><label>{content}</label><label>{author}</label>'
      , controlsTemplate: '{edit} {generate} {shareBox}'
      , shareBoxTemplate: 'Share this link {link} <p class="tip">ProTip: use a URL-shortener service with this link!</p>'
      , generateLabel: 'Share now!'
      , editLabel: 'Edit'
      , dataMark: '?'
    };

    function makeConfig(userConfig, defaults) {
        var k, config = Object.create(defaults);
        for(k in userConfig) config[k] = userConfig[k];
        return config;
    }

    function Controller(hostElement, config) {
        var data
          , k
          , onUpdate = this.updateHandler.bind(this)
          ;

        this._config = makeConfig(config, defaults);
        this._hostElement = hostElement;
        this._lastGenerated = null;
        this.editing = true;
        this._blockNextHashChangeHandler = false; // see _p.updateHandler

        this._controls = this._createControlElements();
        this._controls.edit.addEventListener('click', this.toggleEdit.bind(this));
        this._controls.generate.addEventListener('click', this.toggleSharebox.bind(this));

        this._infoBox = createElement('div', {'class': 'info-box'});

        this._inputs = this._createInputs();
        for(k in this._inputs)
            this._inputs[k].addEventListener('input', onUpdate);


        this._loadDataFromHash();

        data = this._collectData();
        this._displays = this._createDisplays(data);
        this.dom = createElement('main', {'class': 'url-hosted'}, [
            createElement('header', null, [
                this._createControls(this._controls)
              , this._infoBox
              , this._createEdit(this._inputs)
            ])
          , this._createArticle(this._displays)
        ]);
         // Listen to hash changes.
        window.addEventListener('hashchange', this.hashChangeHandler.bind(this), false);
        this._hostElement.appendChild(this.dom);
    }
    var _p = Controller.prototype;

    _p._loadData = function(payload) {
        this._inputs.title.value = payload.title
            ? payload.title + ''
            : ''
            ;

        this._inputs.author.value  = payload.author
            ? payload.author + ''
            : ''
            ;

        this._inputs.content.value = payload.content
            ? payload.content + ''
            : ''
            ;
        var date = null
          , checkdate
          ;
        if(payload.date) {
            date = new Date(payload.date);
            checkdate = date.getDate();
            if(checkdate !== checkdate)
                // NaN
                date = null;
        }
        this._lastGenerated = date;
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
    _p.update = function() {
        var data = this._collectData();
        this._render(data);
    };

    _p._loadDataFromHash = function() {
        var payload = this._getPayload(location);
        this._loadData(payload || {});
        if(payload)
            // when we load fresh data the editor is turned of
            this.editing = false;

    };

    _p.hashChangeHandler = function() {
        if(this._blockNextHashChangeHandler) {
            this._blockNextHashChangeHandler = false;
            return;
        }
        this._loadDataFromHash();
        this._closeShareBox();
        this.update();
    };

    _p._createInputs = function() {
        return {
            title: createElement('input', {type: 'text', 'class': 'input-title', placeholder: 'The Title'})
          , author: createElement('input', {type: 'text', 'class': 'input-author', placeholder: 'Your Name'})
          , content: createElement('textarea', {'class': 'input-content', placeholder: 'Write your post here. You can use Markdown!'})
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

    _p._getPayload = function(url) {
        var payload = this._getPayloadFromURL(url)
          , data
          ;
        if(!payload) {
            // there was no payload
            this._hideInfo();
            return false;
        }
        try {
            data = this._deserializePayload(payload);
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

    _p._deserializePayload = function(payload) {
        return JSON.parse( // deserialize
                    pako.inflate( // decompress
                        atob(payload) // from base64
                      , { to: 'string' }));
    };

    _p._serializePayload = function(data) {
        return btoa( // to base64
                    pako.deflate( // compress
                        JSON.stringify(data) // serialize
                      , { to: 'string' }));
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

    _p.toggleSharebox = function() {
        if(this._controls.shareBox.classList.contains('visible')) {
            this._closeShareBox();
            return;
        }
        this._openShareBox(this.generate());
    }

    _p.generate = function() {
        var payload, link;
        this._lastGenerated = new Date();
        payload = this._serializePayload(this._collectData());
        link = this._makeLink(payload);
        // because now we have a date
        this.update();
        return link;
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
    };

    _p._closeShareBox = function() {
        this._controls.shareBox.classList.remove('visible');
        this._controls.shareBox.innerHTML = '';
    };

    _p._makeLink = function (payload) {
        return [
            location.origin
          , location.pathname
          , location.search
          , '#'
          , this._config.dataMark
          , payload
        ].join('');
    };

    _p._collectData = function() {
        return {
            title: this._inputs.title.value
          , author: this._inputs.author.value
          , date: this._lastGenerated || null
          , content: this._inputs.content.value
        };
    };

    _p._render = function (data) {
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



    function main () {
        var ctrl = new Controller(document.body);
    }
    domReady(main);
});
