;(function($){

  // are we sorted by oldest?
  $sort = $('.issues-list-options .js-select-button');
  if (!(/oldest/i).test($sort.text())) {
    $sort.parents('.select-menu').append('<span class="failed">&larr;This is not sorted by oldest?</span>');
  }

  $('.list-group-item h4 a').each(function(){
    var $prHeader, $prListItem;

    $prHeader = $(this).parent();
    $prListItem = $prHeader.parent();

    $.ajax({
      url: $(this).attr('href'),
      error: function(j, status, e){
        console.warn('some error', e, status);
      },
      success: function(res){
        var d, $prDoc, assignee, status, status_color;
        // parse document
        d = document.implementation.createHTMLDocument('');
        d.body.innerHTML = res.replace(/<!DOCTYPE html>/i, '');
        $prDoc = $(d);

        // find if anyone is assigned
        assignee = $prDoc.find('.js-assignee-infobar-item-wrapper').text().trim();

        // get status
        status = $prDoc.find('.merge-branch .branch-status').text().trim();
        if ((/good to merge/).test(status)) {
          $prListItem.addClass('passed');
          status_color = 'green';
        } else if ((/failed/).test(status)) {
          $prListItem.addClass('failed');
          status_color = 'red';
        }
        $prHeader.find('#pr-sanity').remove();
        $prHeader.append('<div id="pr-sanity"><span style="font-weight: bold; color: blue">' + assignee + '</span><div style="clear: both; color: ' + status_color + '; font-size: 12px; font-weight: normal">' + status + '</div></div>');
      },
      dataType: 'html'
    });
  })
})(jQuery);
