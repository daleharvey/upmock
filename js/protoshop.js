var shortcuts = {
  global : {
    description: 'Global Shortcuts',
    shortcuts: [
      {
        key: 'esc',
        e: 'keydown',
        callback: function() { $('#panel').toggle(); },
        description: 'Preview Design'
      },
      {
        key: '?',
        e:'keypress',
        override: 'shift+?',
        callback: function() { $('#keyboard-help').toggle(); },
        description: 'Show / Hide the help dialog'}
    ]
  },
  editing: {
    description: 'Editing Item Shortcuts',
    shortcuts: [
      {
        key: 'left',
        e: 'keydown',
        callback: function() {
          this.selected.css({left: this.selected.$dom.position().left - 1});
        },
        description: 'Move Left'
      },
      {
        key: 'right',
        e: 'keydown',
        callback: function() {
          this.selected.css({left: this.selected.$dom.position().left + 1});
        },
        description: 'Move Right'
      },
      {
        key: 'up',
        e: 'keydown',
        callback: function() {
          this.selected.css({top: this.selected.$dom.position().top - 1});
        },
        description: 'Move Up'
      },
      {
        key: 'down',
        e: 'keydown',
        callback: function() {
          this.selected.css({top: this.selected.$dom.position().top + 1});
        },
        description: 'Move Down'
      },
      {
        key: 'backspace',
        e: 'keydown',
        callback: function() {
          this.selected.$dom.remove();
          this.selectElement(null);
        },
        description: 'Delete Element'
      },
      {
        key: 'shift+left',
        e: 'keydown',
        callback: function() {
          this.selected.css({width: this.selected.$dom.width() - 1});
        },
        description: 'Decrease Width'
      },
      {
        key: 'shift+right',
        e: 'keydown',
        callback: function() {
          this.selected.css({width: this.selected.$dom.width() + 1});
        },
        description: 'Increase Width'
      },
      {
        key: 'shift+up',
        e: 'keydown',
        callback: function() {
          this.selected.css({height: this.selected.$dom.height() - 1});
        },
        description: 'Decrease Height'
      },
      {
        key: 'shift+down',
        e: 'keydown',
        callback: function() {
          this.selected.css({height: this.selected.$dom.height() + 1});
        },
        description: 'Increase Height'
      }
    ]
  }
};


    // keyBind('keymove', {
    //   'Shift+Left'  : function() { $el.css({width: $el.width() - 1}); },
    //   'Shift+Right' : function() { $el.css({width: $el.width() + 1}); },
    //   'Shift+Up'    : function() { $el.css({height: $el.height() - 1}); },
    //   'Shift+Down'  : function() { $el.css({height: $el.height() + 1}); },
    // });

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
  };

  this.deselect = function() {
    this.$dom.removeClass('selected');
    $handles.remove();
    $info.remove();
  };

  this.updateInfo = function() {
    $info.text("y:" + this.$dom.position().top + " x:" +
               this.$dom.position().left +
               " [" + this.$dom.width() + "x" + this.$dom.height() + "]");
  };

  this.css = function(obj) {
    this.$dom.css(obj);
    this.updateInfo();
  };
};

var BlockElement = function(index) {
  this.$dom = $('<div>', {
    'z-index': index,
    'data-type': 'block',
    'class': 'block'
  });
  this.$dom.data('obj', this);
};
BlockElement.prototype = new CoreElement();

var TextElement = function(index) {
  this.$dom = $('<div>', {
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


};

var x = new Protoshop();

