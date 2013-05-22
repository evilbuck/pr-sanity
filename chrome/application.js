;(function($){
  $('.list-group-item h4 a').each(function(){
    var $prHeader;

    $prHeader = $(this).parent();

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
        status_color = (/good to merge/i).test(status) ? 'green' : 'red';
        $prHeader.find('#pr-sanity').remove();
        $prHeader.append('<div id="pr-sanity"><span style="font-weight: bold; color: blue">' + assignee + '</span><div style="clear: both; color: ' + status_color + '; font-size: 12px; font-weight: normal">' + status + '</div></div>');
      },
      dataType: 'html'
    });
  })
})(jQuery);
