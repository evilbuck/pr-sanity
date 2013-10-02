$(function(){
  var filterPrefix = localStorage.getItem('filterPrefix'), filterTimeout, domTimeout, totalCount, tddiumNotifier_active = true;
  var hide = function(jqEvent){
    if ( ! filterPrefix || ! tddiumNotifier_active ) { return };

    totalCount = $('.suites tbody > tr:visible').length;
    requestAnimationFrame(function(timestamp){
      $('.branch-list .branch-item').each(function(){
        var $this = $(this);
        if ( !$(this).find('.branch-info header:contains('+ filterPrefix + ')').length) {
          $this.hide();
        } else {
          $this.show();
        }
      });
    });
  };

  hide();

  // activate and deactivate hiding
  // determined by whether or not the tab is active
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
    switch(request) {
      case "activate":
        tddiumNotifier_active = true;
        hide();
        break;
      case "deactivate":
        tddiumNotifier_active = false;
        break;
      default:
        console.log( "we're not expecting other messages" )
    }
  });

  var $filterWrapper = $('<div><label for="tddium-filter">Filter:</label><input name="tddium_filter" id="tddium-filter" placeholder="type in your filter"/></div>');
  var $filterInput = $filterWrapper.find('input');
  $filterWrapper.appendTo('.new-repo h2');

  // hide the branches that don't match
  $filterInput.on('keyup', function(){
    filterTimeout = setTimeout(function(){
     if ( filterTimeout ) {
       clearTimeout( filterTimeout );
     }
     filterPrefix = $filterInput.val();
     localStorage.setItem('filterPrefix', filterPrefix );
     $('.suites tbody > tr').show();
     hide();
    }, 300);
     
  }).val( filterPrefix || '');
});
