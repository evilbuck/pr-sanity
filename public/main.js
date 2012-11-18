var POF = { ENVIRONMENT: 'development' };
if ((!console && !console.log) || POF.ENVIRONMENT === 'production') {
  console = {log: function(){}};
}
var Pof = function() {
  var klass = {};
  console.log("initializing pof");
  // grab the user's location and save it
  
  klass.is_signed_in = function() {
    return !$('.topbar a:contains("Sign In")').length;
  }
  
  klass.parse_region = function(context) {
    var region,
      context = context || document,
      region_text;
    
    region_text = $(context).find('.user-details td:contains("City") + td').text();
    
    region = $(region_text.split("\n")).map(function(index, item){
      var cleaned = $.trim(this);
      if (cleaned.length > 0) {
        return $.trim(this);
      }
    });
    
    return region;
  };
  
  klass.fetch_user_info = function (callback) {
    var that = this;
    // get the profile id
    if (!this.is_signed_in()) {
      console.log('Must be logged in.');
      return;
    }
    var user_profile_id = $('.topbar a:contains("My Profile")').attr('href').match(/=(\d+)$/)[1];
    
    $.ajax({
      url: "/viewprofile.aspx?profile_id=" + user_profile_id,
      success: function(res) {
        var user_data = {}, region_text;
        
        user_data.region = that.parse_region(res);
        
        if ($.isFunction(callback)) {
          callback(user_data);
        }
      }
    });
  };
  
  klass.is_profile_page = function(){
    // determine if we're on a profile page (not the current browsing us)
    return (/^\/viewprofile\.aspx/).test(window.location.pathname);
  };

  klass.is_search_page = function(){
    return (/basicsearch\.aspx/).test(window.location.pathname);
  };
  
  klass.update_region = function(distance) {
    $(document).find('.user-details td:contains("City") + td')
      .append('<span> -- ' + distance + '</span>');
  };

  klass.determine_distance = function(start, end, callback) {
    // use gmaps to calculate distance
    var service = new google.maps.DistanceMatrixService(),
      key = start + ':' + end + ':distance';
    
    if (localStorage[key]) {
      this.update_region(localStorage[key]);
      return;
    } 

    service.getDistanceMatrix({
      origins: [ start ],
      destinations: [ end ],
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      unitSystem: google.maps.UnitSystem.IMPERIAL
    }, callback || function(res, status) {
      var distance = res.rows[0].elements[0].distance.text;
      // cache the distance
      localStorage[key] = distance;
      klass.update_region(distance);
    });
  };
  
  return klass;
};

// HOWTO: load LABjs itself dynamically!
// inline this code in your page to load LABjs itself dynamically, if you're so inclined.

(function (global, oDOC, handler) {
    var head = oDOC.head || oDOC.getElementsByTagName("head");

    function LABjsLoaded() {
        // do cool stuff with $LAB here
        // load google api
        google.load('maps', '3', { other_params: "sensor=false", callback: function(){
          var app = new Pof(),
              region = app.parse_region();
          if (app.is_profile_page()) {
            if (localStorage['user_data']) {
              console.log('cached user data');
              var user_data = JSON.parse(localStorage['user_data']);
              app.determine_distance(region[0] + ', ' + region[1], user_data.region[0] + ', ' + user_data.region[1]);
            } else {
              app.fetch_user_info(function(data){
                var user_data = localStorage['user_data'] = JSON.stringify(data);
                if (app.is_profile_page()) {
                  console.log("On another profile page");
                  // get the location
                  app.determine_distance(region[0] + ', ' + region[1], user_data.region[0] + ', ' + user_data.region[1]);
                }
              });
            }
          } else if (app.is_search_page()) {
            console.log("on a search page");
            $('.results > .description > .headline').each(function(){
              var $this = $(this),
                headline = $this.find('.headline').text()
                text = $this.text(),
                region,
                user_data = JSON.parse(localStorage['user_data']);

              region = $.trim(text.replace(headline, ''));
              app.determine_distance(
                region.join(", "), 
                user_data.region.join(", ")

              );
            });
          }
        }});
    }

    // loading code borrowed directly from LABjs itself
    setTimeout(function () {
        if ("item" in head) { // check if ref is still a live node list
            if (!head[0]) { // append_to node not yet ready
                setTimeout(arguments.callee, 25);
                return;
            }
            head = head[0]; // reassign from live node list ref to pure node ref -- avoids nasty IE bug where changes to DOM invalidate live node lists
        }
        var scriptElem = oDOC.createElement("script"),
            scriptdone = false;
        scriptElem.onload = scriptElem.onreadystatechange = function () {
            if ((scriptElem.readyState && scriptElem.readyState !== "complete" && scriptElem.readyState !== "loaded") || scriptdone) {
                return false;
            }
            scriptElem.onload = scriptElem.onreadystatechange = null;
            scriptdone = true;
            LABjsLoaded();
        };
        scriptElem.src = "https://www.google.com/jsapi";
        head.insertBefore(scriptElem, head.firstChild);
    }, 0);

    // required: shim for FF <= 3.5 not having document.readyState
    if (oDOC.readyState == null && oDOC.addEventListener) {
        oDOC.readyState = "loading";
        oDOC.addEventListener("DOMContentLoaded", handler = function () {
            oDOC.removeEventListener("DOMContentLoaded", handler, false);
            oDOC.readyState = "complete";
        }, false);
    }
})(window, document);
