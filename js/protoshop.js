var CoreElement = function() {

  var $handles = $('<div class="handles">' +
    '<div class="top-left" data-handle="nw" data-type="handle"></div>' +
    '<div class="top-right" data-handle="ne" data-type="handle"></div>' +
    '<div class="bottom-left" data-handle="sw" data-type="handle"></div>' +
    '<div class="bottom-right" data-handle="se" data-type="handle"></div>' +
    '<div class="top" data-handle="n" data-type="handle"></div>' +
    '<div class="right" data-handle="e" data-type="handle"></div>' +
    '<div class="bottom" data-handle="s" data-type="handle"></div>' +
    '<div class="left" data-handle="w" data-type="handle"></div>' +
    '</div>');

  var $info = $('<div class="info-box"></div>');

  var $dom = this.$dom = null;

  this.select = function() {
    this.$dom.addClass('selected');
    this.$dom.append($handles);
    this.$dom.append($info);
    this.updateInfo();
  };

  this.deselect = function() {
    this.$dom.removeClass('selected');
    $handles.remove();
    $info.remove();
  };

  this.updateInfo = function() {
    $info.text("y:" + this.$dom.position().top + " x:" + this.$dom.position().left +
               " [" + this.$dom.width() + "x" + this.$dom.height() + "]");
  };

  this.css = function(obj) {
    this.$dom.css(obj);
    this.updateInfo();
  };
};

var BlockElement = function(index, obj) {
  this.$dom = obj || $('<div>', {
    'z-index': index,
    'data-type': 'block',
    'class': 'block'
  });
  this.$dom.data('obj', this);
};
BlockElement.prototype = new CoreElement();

var TextElement = function(index, obj) {
  this.$dom = obj || $('<div>', {
    'z-index': index,
    'data-type': 'text',
    'class': 'text'
  }).append('<span>text</span>');
  this.$dom.data('obj', this);
};
TextElement.prototype = new CoreElement();


var Protoshop = function() {

  var self = this;
  var $canvas = $('#canvas');

  this.selected = null;

  this.selectElement = function(el) {

    if (self.selected) {
      self.selected.deselect();
      $(document).unbind('.keymove');

      if (self.selected.$dom.data('deselect')) {
        self.selected.$dom.data('deselect')();
        self.selected.$dom.data('deselect', null);
      }
    }

    self.selected = el;

    if (el) {
      var $el = el.$dom;
      el.select();
      bindKeyMove(self.selected.$dom);
    }
  };

  function bindMouseMove(e) {

    var offset = {
      left: e.clientX - self.selected.$dom.position().left,
      top: e.clientY - self.selected.$dom.position().top
    };

    $canvas.bind('mousemove.editing', function(e) {
      self.selected.css({
        left: e.clientX - offset.left,
        top: e.clientY - offset.top
      });
    });

    $canvas.bind('mouseup.moving', function(e) {
      $canvas.unbind('.editing');
    });

  }


  function bindMouseResize($el, e, type) {

    var size = {
      width: self.selected.$dom.width(),
      height: self.selected.$dom.height()
    };

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

    $canvas.bind('mousemove.resize', function(e) {
      var obj = {}, i;
      for(i = 0; i < len; i++) {
        resize[type[i]](e, obj);
      }
      self.selected.css(obj);
    });

    $canvas.bind('mouseup.moving', function(e) {
      $canvas.unbind('.resize');
    });

  }

  function bind(scope, fn) {
    return function (evt) {
      evt.stopPropagation();
      evt.preventDefault();
      if (fn.apply(scope, arguments) !== false) {
      }
    };
  }

  function bindKeyMove($el) {
    _.each(shortcuts.editing.shortcuts, function(key) {
      $(document).bind(key.e + '.editing', key.override || key.key, bind(self, key.callback));
    });
  }


  $canvas.bind('dblclick', function(e) {

    var $targ = $(e.target);
    var obj = $targ.data('obj');

    if (obj instanceof TextElement) {
      self.selected = obj;
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
      self.selectElement(null);
      return true;
    }

    var $el = $(e.target);
    var obj = $el.data('obj');

    if (obj instanceof CoreElement) {
      e.preventDefault();
      e.stopPropagation();
      if (!$el.is('.selected')) {
        self.selectElement($el.data('obj'));
      }
      bindMouseMove(e);
    }

    if ($el.data('type') === 'handle') {
      e.preventDefault();
      e.stopPropagation();
      bindMouseResize($el.parent().parent(), e, $el.data('handle'));
   }

  });

  _.each(shortcuts.global.shortcuts, function(key) {
    $(document).bind(key.e, key.override || key.key, key.callback);
  });


  (function() {

    var index = 0;

    var panelFuns = {
      'add-block': function() {
        var el = new BlockElement(++index);
        el.$dom.appendTo($canvas);
        self.selectElement(el);
      },
      'add-text': function() {
        var el = new TextElement(++index);
        el.$dom.appendTo($canvas);
        self.selectElement(el);
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

  (function() {
    var autoSave = setInterval(function() {
      var toSave = $canvas.clone();
      toSave.find('.handles, .info-box').remove();
      localStorage.saved = toSave.html();
    }, 5000);

    var index = 0;
    if (localStorage.saved) {
      $canvas.html(localStorage.saved);

      _.each($canvas.find('[data-type=block]'), function(obj) {
        new BlockElement(++index, $(obj));
      });
      _.each($canvas.find('[data-type=text]'), function(obj) {
        new TextElement(++index, $(obj));
      });

      var sel = $canvas.find('.selected').data('obj');
      if (sel) {
        self.selectElement(sel);
      }
    }
  })();

};

new Protoshop();

