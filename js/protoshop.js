var shortcuts = {
  global : {
    description: 'Global Shortcuts',
    shortcuts: [
      {key: 'esc', e: 'keydown',
       callback: function() { $('#panel').toggle(); },
       description: 'Preview Design'},
      {key: '?', e:'keypress', override: 'shift+?',
       callback: function() { $('#keyboard-help').toggle(); },
       description: 'Show / Hide the help dialog'}
    ]
  }
};

var rr = (function() {

  var $canvas = $('#canvas');
  var $selected = null;

  function selectElement($el) {

    if ($selected) {
      $(document).unbind('.keymove');
      $selected.removeClass('selected');

      if ($selected.data('deselect')) {
        $selected.data('deselect')();
        $selected.data('deselect', null);
      }
    }

    $selected = $el;

    if ($el) {
      $selected.addClass('selected');
      bindKeyMove($selected);
    }
  }

  function bindMouseMove($el, e) {

    var offset = {
      left: e.clientX - $selected.position().left,
      top: e.clientY - $selected.position().top
    };

    var $info = $el.find('.info-box');

    $canvas.bind('mousemove.moving', function(e) {
      $el.css({left: e.clientX - offset.left, top: e.clientY - offset.top});
      $info.text("y:" + $el.position().top + " x:" + $el.position().left +
                 " [" + $el.width() + "x" + $el.height() + "]");
    });

    $canvas.bind('mouseup.moving', function(e) {
      $canvas.unbind('.moving');
    });

  }


  function bindMouseResize($el, e, type) {

    var size = {width: $selected.width(), height: $selected.height()};

    var offset = {
      left: e.pageX - size.width,
      top: e.pageY - size.height
    };
    var len = type.length;

    var resize = {
      'n': function(e, obj) {
        obj.top = e.pageY - size.height;
        //obj.height = size.height - (e.clientY - offset.top);
      },
      'e': function(e, obj) {
        obj.width = e.clientX - offset.left;
      },
      's': function(e, obj) {
        obj.height = e.clientY - offset.top;
      },
      'w': function(e, obj) {
        obj.left = e.clientX;
        obj.width = size.width - (e.clientX - offset.left);
      }
    };

    var $info = $el.find('.info-box');

    $canvas.bind('mousemove.resize', function(e) {
      var obj = {}, i;
      for(i = 0; i < len; i++) {
        resize[type[i]](e, obj);
      }
      $el.css(obj);
      $info.text("y:" + $el.position().top + " x:" + $el.position().left +
                 " [" + $el.width() + "x" + $el.height() + "]");

    });

    $canvas.bind('mouseup.moving', function(e) {
      $canvas.unbind('.resize');
    });

  }

  function bindKeyMove($el) {
    keyBind('keymove', {
      'Shift+Left'  : function() { $el.css({width: $el.width() - 1}); },
      'Shift+Right' : function() { $el.css({width: $el.width() + 1}); },
      'Shift+Up'    : function() { $el.css({height: $el.height() - 1}); },
      'Shift+Down'  : function() { $el.css({height: $el.height() + 1}); },
      'Left'        : function() { $el.css({left: $el.position().left - 1}); },
      'Right'       : function() { $el.css({left: $el.position().left + 1}); },
      'Up'          : function() { $el.css({top: $el.position().top - 1}); },
      'Down'        : function() { $el.css({top: $el.position().top + 1}); },
      'Backspace'   : function() { $el.remove(); selectElement(null); }
    });
  }


  $canvas.bind('dblclick', function(e) {

    var $targ = $(e.target);

    if ($targ.data('type') === 'text') {
      $selected = $targ;
      var text = $targ.find('span').text();
      var $inp = $('<textarea>' + text + '</textarea>');
      $targ.find('span').replaceWith($inp);
      $inp[0].focus();
      $inp[0].select();

      $targ.data('deselect', function() {
        var text = $inp.val();
        $targ.find('textarea').replaceWith('<span>' + text + '</span>');
      });
    }

  });

  $canvas.bind('mousedown', function(e) {

    if (e.target === this) {
      selectElement(null);
      return true;
    }

    var $el = $(e.target);

    if ($el.data('type') === 'block' || $el.data('type') === 'text') {
      e.preventDefault();
      e.stopPropagation();
      selectElement($el);
      bindMouseMove($el, e);
    }

    if ($el.data('type') === 'handle') {
      e.preventDefault();
      e.stopPropagation();
      bindMouseResize($el.parent().parent(), e, $el.data('handle'));
   }

  });

  _.each(shortcuts, function(section) {
    _.each(section.shortcuts, function(key) {
      $(document).bind(key.e, key.override || key.key, key.callback);
    });
  });

  var handles = '<div class="handles">' +
    '<div class="top-left" data-handle="nw" data-type="handle"></div>' +
    '<div class="top-right" data-handle="ne" data-type="handle"></div>' +
    '<div class="bottom-left" data-handle="sw" data-type="handle"></div>' +
    '<div class="bottom-right" data-handle="se" data-type="handle"></div>' +
    '<div class="top" data-handle="n" data-type="handle"></div>' +
    '<div class="right" data-handle="e" data-type="handle"></div>' +
    '<div class="bottom" data-handle="s" data-type="handle"></div>' +
    '<div class="left" data-handle="w" data-type="handle"></div>' +
    '</div><div class="info-box">5 x 5</div>';

  (function() {

    var index = 0;

    var panelFuns = {
      'add-block': function() {
        var $el = $('<div>', {
          'z-index': ++index,
          'data-type': 'block',
          'class': 'block'
        }).appendTo($canvas).append(handles);
        selectElement($el);
      },
      'add-text': function() {
        var $el = $('<div>', {
          'z-index': ++index,
          'data-type': 'text',
          'class': 'text'
        }).appendTo($canvas).append('<span>text</span>').append(handles);
        selectElement($el);
      }
    };

    var $panel = $('<div id="panel"></div>');
    var $ul = $('<ul></ul>');

    _.each(panelFuns, function(v, k) {
      var $li = $('<li />');
      var $btn = $('<a id="' + k + '"></a>');
      $btn.bind('mousedown', v);
      $li.append($btn);
      $ul.append($li);
    });

    $panel.append($ul);
    $(document.body).append($panel);

  })();

  $('#top-bar').bind('mousedown', function(e) {
    var id = $(e.target).attr('id');
    if (e.target.nodeName === 'A') {
      $('#grid-overlay').toggle();
    }
  });

  var template = Handlebars.compile($('#shortcut-section-tpl').html());
  var html = _.map(shortcuts, function(data) {
    return template(data);
  });
  $('#keyboard-placer').html(html.join(''));


})();

