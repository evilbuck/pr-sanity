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

  // TODO make the assignee keep track of it's pr elements
  function filterPrs(assignee) {
    $('.list-group-item').hide()
      .filter(function(index){
        return $(this).data('assignee-name') === assignee.name;
      }).show();
  }

  function parseDocument(html){
    var d = document.implementation.createHTMLDocument('');
    d.body.innerHTML = html.replace(/<!DOCTYPE html>/i, '');
    return $(d);
  }

  function AssigneeContainer() {
    this.assignees = {};
    // create assignee container
    this.$assigneeContainer = $('<div class="sanity-assignees-wrapper"><h5>Assignees</h5><ul class="sanity-assignees"></ul></div>');
    this.$assignees = this.$assigneeContainer.find('.sanity-assignees');

    return this;
  }

  AssigneeContainer.prototype.addAssignee = function(data) {
    var name = data.name, assignee;

    // TODO: this is a lot of un-coallesced DOM manipulation. We should do this better
    if (!this.assignees[name]) {
      this.assignees[name] = $.extend(data, {count: 0});
      assignee = this.assignees[name];
      assignee.$el = $('<li class="sanity-assignee ' + assignee.name.replace(/[\W\s]/, '-').toLowerCase() +  '"><span class="count">' + data.count + '</span><span class="name">' + name + '</span></li>');
      assignee.$el.click(function(){
        // is this already selected?
        assignee.$el.siblings().removeClass('active');
        
        // TODO this is wasteful - we're showing them all then hiding 
        if (assignee.$el.hasClass('active')) {
          $('.list-group-item').show();
          // remove filter
          assignee.$el.removeClass('active');
        } else {
          filterPrs(assignee);
          assignee.$el.addClass('active');
        }
      });
      this.$assignees.append(assignee.$el);
    } else {
      // TODO: DRY this up
      assignee = this.assignees[name];
    }
    
    assignee.count++;
    assignee.$el.find('.name').text(name);
    assignee.$el.find('.count').text(assignee.count);
  };


  function updatePR(details) {
    var $prListItem, $prHeader, $assigneeName, $prSanity, $meta, assigneeClass,
      $prSanityMeta;

    // save details
    localStorage.setItem('pr:' + details.id, JSON.stringify(details));
    $prListItem = this;
    $prHeader = $prListItem.find('h4');
    $meta     = $prListItem.find('.list-group-item-meta');

    $prListItem.data('assignee-name', details.assignee);
    if ((/good to merge/im).test(details.status)) {
      $prListItem.addClass('passed');
    } else if ((/failed/im).test(details.status)) {
      $prListItem.addClass('failed');
    }

    // just updating might be better
    $prListItem.find('.pr-sanity').remove();
    $prListItem.find('*[class^="pr-sanity"]').remove();

    $prSanity = $('<div class="pr-sanity">' + 
                    '<span class="files-changed">' + details.files_changed + '<span class="copy"> files changed</span></span>' +
                    '<span class="updating" style="display:none">updating</span>' +
                  '</div>');
    $prListItem.find('.list-group-item-name').append($prSanity);

    $prSanityMeta = $('<div class="pr-sanity-meta"></div>');
    $prSanityMeta.append('<div class="pr-sanity-status"><span class="pass">&#10004;</span><span class="fail">' + details.status + '</span></div>');

    // check for a passing message
    if ((/all is well|pass/i).test(details.status)) {
      $prSanityMeta.find('.pr-sanity-status').addClass('pr-sanity-passed');
    }
    // failing
    if ((/fail/i).test(details.status)) {
      $prSanityMeta.find('.pr-sanity-status').addClass('pr-sanity-fail');
    }
    
    if ((/no one/i).test(details.assignee)) {
      $prSanityMeta.append('<span class="pr-sanity-name pr-sanity-no-assignee">UNASSIGNED</span>');
    }
    $meta.prepend($prSanityMeta);
  }

  // add the assignee container
  var assigneeContainer = new AssigneeContainer();
  $('.column.sidebar').append(assigneeContainer.$assigneeContainer);

  $('.list-group-item h4 a').each(function(){
    var $prHeader, $prListItem, $this, key, jqxhr, prNumber, cache, $prSanity;

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


    // types of files
    // TODO: DRY this up
    var filesChangedUrl = $(this).attr('href') + '/files';
    var filesChangedXhr = $.get(filesChangedUrl);

    jqxhr.error(function(j, status, e){
      console.error('some error', e, status);
    });

    jqxhr.done(function(res){
        var d, $prDoc, assignee, status, status_color, files_changed, prInfo;

        prInfo = {id: prNumber};

        $prDoc = parseDocument(res);

        // find if anyone is assigned
        prInfo.assignee = $prDoc.find('.js-assignee-infobar-item-wrapper').text().trim().replace(/ is assigned/i, '');

        // get status
        prInfo.status = $prDoc.find('.branch-status').text().trim().split('—')[0];
        
        // get the files changed
        prInfo.files_changed = $prDoc.find('a[data-container-id="files_bucket"]').text().trim().replace(/[^\d]/gm, '');


        updatePR.call($prListItem, prInfo);
        $prSanity = $prListItem.find('.pr-sanity');
        assigneeContainer.addAssignee({name: prInfo.assignee});

        // TODO: cleanup nested promsises
        filesChangedXhr.done(function(res){
          var $doc, fileTypeCount, filesChanged, filesChanged,
            sorted, sortableFileTypeCounts;
          $doc = parseDocument(res);
          fileTypeCount = $doc.find('#toc li > a').map(function(_, el){ 
            return $(el).text().trim().match(/\.\w+$/i);
          }).get().reduce(function(memo, item){
            if (!memo[item]) memo[item] = 0;
            memo[item]++;
            return memo;
          }, {});

          $fileTypeCounts = $('<ul class="pr-sanity-file-type-counts"></ul>');
          
          sortableFileTypeCounts = [];
          for(type in fileTypeCount) {
            sortableFileTypeCounts.push({type: type, count: fileTypeCount[type]});
          }
          sorted = sortableFileTypeCounts.sort(function(a, b){
            return b.count - a.count;
          }).slice(0, 5).forEach(function(fileTypeCount){ 
            var fileType = fileTypeCount.type.replace(/\./, '');
            $fileTypeCounts.append('<li>' +
                                    fileTypeCount.count +
                                   '<span class="file-type-icon ' + fileType + '">' + fileType + '</span>' +
                                   '</li>');
          });
          
          $prListItem.append($fileTypeCounts);
        });
    });
  });
})(jQuery);
