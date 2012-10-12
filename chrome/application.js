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
    if (window.location.pathname.match(/^\/viewprofile\.aspx/)) {
      return true
    }
    return false;
  };
  
  klass.determine_distance = function(start, end, callback) {
    chrome.extension.sendMessage({ what: "test" }, function(response) {
      debugger
    });
    
    // use gmaps to calculate distance
    
  };
  
  return klass;
};

$(function(){
  window.app = new Pof();
  app.fetch_user_info(function(data) {
    localStorage["user_data"] = JSON.stringify(data);
    
    console.log("done fetching user info");
    
    if (app.is_profile_page()) {
      console.log("On another profile page");
      // get the location
      var region = app.parse_region();
      app.determine_distance(region[0], region[1]);
    }
  });
});