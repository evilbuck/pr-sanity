;(function($){
  var $sort, $sortByOldestLink;
  // are we sorted by oldest?
  $sort = $('.issues-list-options .js-select-button');
  if (!(/oldest/i).test($sort.text())) {
    $sortByOldestLink = $('<span class="failed">&larr;This is not sorted by oldest?</a></span>').click(function(){
      window.location.href = window.location.origin + window.location.pathname + "?direction=asc&sort=created&state=open";
    }).css('cursor', 'pointer');
    $sort.parents('.select-menu').append($sortByOldestLink);
  }

  function updatePR(details) {
    var $prListItem, $prHeader;

    // save details
    localStorage.setItem('pr:' + details.id, JSON.stringify(details));
    $prListItem = this;
    $prHeader = $prListItem.find('h4');

    if ((/good to merge/im).test(details.status)) {
      $prListItem.addClass('passed');
      status_color = 'green';
    } else if ((/failed/im).test(details.status)) {
      $prListItem.addClass('failed');
      status_color = 'red';
    } else {
      status_color = 'auto';
    }
    $prHeader.find('.pr-sanity').remove();
    assignee_style = "font-weight: normal; color: green;";
    if (details.assignee == "No one is assigned"){
      assignee_style = "font-weight: bold; color: blue;";
    }

    $prHeader.append('<div class="pr-sanity">' + 
                       '<span style="' + assignee_style + '">' + details.assignee + '-- <span class="files-changed">Files Changed: ' + details.files_changed + '</span></span>' +
                       '<div style="clear: both; color: ' + status_color + '; font-size: 12px; font-weight: normal">' + details.status + '</div>' +
                       '<span class="updating" style="display:none">updating</span>' +
                     '</div>');
  }

  $('.list-group-item h4 a').each(function(){
    var $prHeader, $prListItem, $this, key, jqxhr, prNumber, cache;

    $prHeader = $(this).parent();
    $prListItem = $prHeader.parent();
    $this = $(this);

    // did we already fetch this?
    prNumber = $(this).attr('href').match(/\/([\d]+)$/)[1];
    cache = localStorage.getItem('pr:' + prNumber);

    if (cache) {
      updatePR.call($prListItem, JSON.parse(cache));
    }
    $prListItem.find('.pr-sanity .updating').show();

    jqxhr = $.ajax({
      url: $(this).attr('href'),
      dataType: 'html'
    });


    jqxhr.error(function(j, status, e){
      console.warn('some error', e, status);
    });

    jqxhr.done(function(res){
        var d, $prDoc, assignee, status, status_color, files_changed;
        // parse document
        d = document.implementation.createHTMLDocument('');
        d.body.innerHTML = res.replace(/<!DOCTYPE html>/i, '');
        $prDoc = $(d);

        // find if anyone is assigned
        assignee = $prDoc.find('.js-assignee-infobar-item-wrapper').text().trim();

        // get status
        status = $prDoc.find('.merge-branch .branch-status').text().trim();
        
        // get the files changed
        files_changed = $prDoc.find('a[data-container-id="files_bucket"]').text().trim().replace(/[^\d]/gm, '');

        updatePR.call($prListItem, {assignee: assignee, status: status, id: prNumber, files_changed: files_changed});
    });
  });
})(jQuery);
