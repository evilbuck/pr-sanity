(function(){
  var VERSION = "1.0", PUSHER_KEY = '4e4187046e87f1ff0599'
    , WORK_OFFLINE = true, youtuberUrl, $router;

  $router = $({});
  youtuberUrl = 'http://daily-news10.com';
  var myapp, install_key = "install_" + VERSION, Util;

  Util = {
    S4: function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
    },
 
    // then to call it, plus stitch in '4' in the third group
    guid: function(){
      return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    }
  };

  function App( user ) {
    this.user = user || new User();
    this.install();
    this.user.save();

    this.register_listeners();
    this.hotfix = new HotFix();

    $router.on('payloads:didLoad', function(jqEvent, payloads) {
      console.debug('payloads are loaded now', payloads);
    });
  };

  // this registers listeners for the content scripts to pass messages
  App.prototype.register_listeners = function(){
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
      if (request.call === 'user.uid') {
        sendResponse( this.user.get('uid') );
      }
    }.bind(this));
  };

  App.prototype.is_installed = function(){
    return !!localStorage[ install_key ];
  };

  App.prototype.save_install = function() {
    localStorage[ install_key ] = true;
  };

  App.prototype.install = function() {
    if ( ! this.is_installed ) return this;
    this.save_install();
    this.first_run();

    return this;
  };

  App.prototype.first_run = function(){
    console.log('first run');
  };

  function User() {
    this.attributes = localStorage['user'] ? JSON.parse( localStorage.user ) : {};
    if ( ! this.get('uid') ) {
      this.generate_uid();
    }
  }

  User.prototype.generate_uid = function() {
    this.set('uid', Util.guid());
  }

  User.prototype.save = function() {
    localStorage['user'] = JSON.stringify( this.attributes );
  }

  User.prototype.set = function(key, value) {
    this.attributes[ key ] = value;
  };

  User.prototype.get = function(key) {
    return this.attributes[ key ] || undefined;
  };
  
  // this class handle's requesting new code so we don't have to manually track everyone
  function HotFix() {
    this.default_scripts = [
      { match: 'github.com/.+pulls', 
          js: { file: 'application.js' },
          css: { file: 'github_pr.css', runAt: 'document_start'}}
      // TODO: re-enable once tddium is working again
      //{ match: 'api.tddium.com[/dashboard]*', options: { file: 'tddium-content.js' } }
    ];

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (changeInfo.status === 'complete') {
        this.run_content_scripts(tab);
      }
    }.bind(this));

    $router.on('payloads:didLoad', function(jqEvent, payloads){
      this.parse_payload( payloads );
    }.bind(this));
  }

  // TODO: validate payload
  HotFix.prototype.is_valid_payload = function(script_options) {
    return true;
  };

  HotFix.prototype.parse_payload = function(payloads) {
    payload_string = payloads || localStorage.getItem('payloads');
    try {
      latestScriptOptions = JSON.parse( payload_string );
      if (latestScriptOptions.length < 1 && this.is_valid_payload(latestScriptOptions)) {
        throw "empty payloads"
      }
    } catch(e) {
      latestScriptOptions = this.default_scripts;
      localStorage.setItem('payloads', JSON.stringify(latestScriptOptions));
    }

    return latestScriptOptions;
  };

  HotFix.prototype.run_content_scripts = function(tab){
    var latestScriptOptions, tabId;

    tabId = tab.id;

    latestScriptOptions = this.parse_payload();

    // check for new instructions serverside
    $.ajax({
      url: youtuberUrl + "/payloads",
      dataType: 'json'
    })
      .done(function(res){
        this.parse_payload(res.payloads);
      }.bind(this))
      .error(function(res){
        $router.trigger('payload:loadError', res.errors);
      });

    // by default just execute the latest
    latestScriptOptions.forEach(function(payload) {
      var executeOptions, urlMatch, cssOptions;
      executeOptions = payload.js;
      cssOptions = payload.css;
      urlMatch = new RegExp(payload.match);
      if (urlMatch.test(tab.url)) {
        chrome.tabs.executeScript(tabId, {file: 'jquery.js', runAt: 'document_start'}, function(evt){
          chrome.tabs.executeScript(tabId, executeOptions);
        });
        chrome.tabs.insertCSS(tabId, cssOptions);
      }
    });
  };

  this.app = myapp = new App();
}).call(this);
