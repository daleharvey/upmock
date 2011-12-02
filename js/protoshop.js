var CoreElement = function() {

  var self = this;

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

  this.$handles = null;
  this.$info = null;
  this.$dom = null;

  this.select = function() {
    this.$handles = $handles.clone();
    //this.$info = $info.clone();
    this.$dom.addClass('selected');
    this.$dom.append(this.$handles);
    //this.$dom.append(this.$info);
    this.updateInfo();
  };

  CoreElement.prototype.deselect = function() {
    this.$dom.removeClass('selected');
    this.$handles.remove();
    this.$handles = null;
    //this.$info.remove();
    //this.$info = null;
  };

  this.updateInfo = function() {
    //this.$info.text("y:" + this.$dom.position().top + " x:" +
    //                this.$dom.position().left +
    //                " [" + this.$dom.width() + "x" + this.$dom.height() + "]");
  };

  this.css = function(obj) {
    this.$dom.css(obj);
    this.updateInfo();
  };

  CoreElement.prototype.move = function(y, x) {
    this.css({
      left: this.$dom.position().left + x,
      top: this.$dom.position().top + y
    });
    this.updateInfo();
  };

  this.toggleBold = function() {
    if (this.$dom.css('font-weight') !== '700' &&
        this.$dom.css('font-weight') !== 'bold') {
      this.$dom.css('font-weight', 'bold');
    } else {
      this.$dom.css('font-weight', '');
    }
  };

  this.toggleItalic = function() {
    if (this.$dom.css('font-style') !== 'italic') {
      this.$dom.css('font-style', 'italic');
    } else {
      this.$dom.css('font-style', '');
    }
  };

  this.toggleUnderline = function() {
    if (this.$dom.css('text-decoration') !== 'underline') {
      this.$dom.css('text-decoration', 'underline');
    } else {
      this.$dom.css('text-decoration', '');
    }
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

  this.startEditing = function() {
    var text = this.$dom.find('span').text();
    this.$inp = $('<textarea>' + text + '</textarea>');
    this.$dom.find('span').replaceWith(this.$inp);
    this.$inp[0].focus();
    this.$inp[0].select();
  };

  this.deselect = function() {
    if (this.$inp) {
      var text = this.$inp.val();
      this.$inp.replaceWith('<span>' + text + '</span>');
      this.$inp = null;
    }
    CoreElement.prototype.deselect.call(this);
  };

};
TextElement.prototype = new CoreElement();


var Protoshop = function() {

  var self = this;

  var $canvas = $('#canvas');
  var $canvas_wrapper = $('#canvas_wrapper');

  this.selected = [];
  this.bounds = {};
  this.$canvas = $canvas;

  this.selectElement = function(el) {

    if (el) {
      self.selected.push(el);
      var $el = el.$dom;
      el.select();
      bindKeyMove();
    } else {
      $(document).unbind('.editing');
      _.each(self.selected, function(obj) { obj.deselect.apply(obj); });
      self.selected = [];
    }

    this.calculateSelectionBounds();
  };

  this.onSelected = function(callback) {
    var params = _.toArray(arguments).slice(1);
    _.each(self.selected, function(obj) {
      obj[callback].apply(obj, params);
    });
  };

  this.calculateSelectionBounds = function() {

    var min = function(a, b) { return a === null ? b : Math.min(a, b); };
    var max = function(a, b) { return a === null ? b : Math.max(a, b); };

    self.bounds = {nw: { x: null, y: null}, se: { x: null, y: null}};

    _.each(self.selected, function(obj) {
      var pos = obj.$dom.position();
      self.bounds.nw.x = min(self.bounds.nw.x, pos.left);
      self.bounds.nw.y = min(self.bounds.nw.y, pos.top);
      self.bounds.se.x = max(self.bounds.se.x, pos.left + obj.$dom.width());
      self.bounds.se.y = max(self.bounds.se.y, pos.top + obj.$dom.height());
    });
  };

  function bindMouseMove(e) {

    var start = e, orig = {}, diff = {};

    $canvas.bind('mousemove.editing', function(e) {
      diff = {x: e.clientX - start.clientX, y: e.clientY - start.clientY};
      self.onSelected('move', -(orig.y - diff.y), -(orig.x - diff.x));
      orig = diff;
    });

    $canvas.bind('mouseup.moving', function(e) {
      $canvas.unbind('.editing');
    });

  }


  function bindMouseResize($el, e, type) {

    var size = {
      width: self.selected[0].$dom.width(),
      height: self.selected[0].$dom.height()
    };

    var offset = {
      left: self.selected[0].$dom.position().left,
      top: self.selected[0].$dom.position().top
    };

    var start = e;
    var len = type.length;

    var resize = {
      'n': function(e, obj) {
        obj.top = e.clientY - (start.clientY - offset.top);
        obj.height = size.height + (offset.top - obj.top);
      },
      'e': function(e, obj) {
        obj.width = e.clientX - (start.pageX - size.width);
      },
      's': function(e, obj) {
        obj.height = e.clientY - (start.pageY - size.height);
      },
      'w': function(e, obj) {
        obj.left = e.clientX - (start.clientX - offset.left);
        obj.width = size.width + (offset.left - obj.left);
      }
    };

    $canvas.bind('mousemove.resize', function(e) {
      var obj = {}, i;
      for(i = 0; i < len; i++) {
        resize[type[i]](e, obj);
      }
      self.selected[0].css(obj);
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

  var $selection = $('#selection');

  function bindMouseSelection(e) {

    var yOffset = $canvas_wrapper[0].scrollTop - $canvas_wrapper[0].offsetTop;
    var start = e;
    var selected = [];

    start.clientY += yOffset;

    var objects = _.filter($canvas.find('div'), function(obj) {
      return typeof $(obj).data('obj') !== 'undefined';
    });

    objects = _.map(objects, function(obj) { return $(obj); });

    $selection.css({top: start.clientY, left: start.clientX, height: 1, width: 1});
    $selection.show();

    $canvas.bind('mousemove.selecting', function(e) {
      e.clientY += yOffset;
      var top = Math.min(start.clientY, e.clientY);
      var left = Math.min(start.clientX, e.clientX);
      var width = Math.max(start.clientX, e.clientX) - left;
      var height = Math.max(start.clientY, e.clientY) - top;
      $selection.css({width: width, height: height, top: top, left: left});
      top -= $canvas[0].offsetTop;
      _.each(selected, function(obj) { obj.removeClass('soft-select'); });

      selected = _.filter(objects, function(obj) {
        var pos = obj.position();
        pos.left += $canvas[0].offsetLeft;
        return !(pos.left > (left + width) || (pos.left + obj.width()) < left ||
                 pos.top > (top + height) || (pos.top + obj.height()) < top);
      });
      _.each(selected, function(obj) { obj.addClass('soft-select'); });

    });

    $canvas.bind('mouseup.selecting', function(e) {
      $selection.hide();
      $canvas.unbind('.selecting');
      _.each(selected, function(obj) {
        obj.removeClass('soft-select');
        self.selectElement(obj.data('obj'));
      });
    });
  }



  $canvas.bind('dblclick', function(e) {

    var $targ = $(e.target);
    var obj = $targ.data('obj');

    if (obj instanceof TextElement) {
      self.selectElement(null);
      self.selectElement(obj);
      obj.startEditing();
    }

  });


  this.globalMouseDown = function(e) {

    if (e.target === this) {
      self.selectElement(null);
      bindMouseSelection(e);
      return true;
    }

    var $el = $(e.target);
    var obj = $el.data('obj');

    if (obj instanceof CoreElement) {

      e.preventDefault();
      e.stopPropagation();

      if (!e.shiftKey && $.inArray(obj, self.selected) === -1) {
        self.selectElement(null);
      }

      if (!$el.is('.selected')) {
        self.selectElement($el.data('obj'));
      }

      bindMouseMove(e);
    }

    if ($el.data('type') === 'handle') {

      e.preventDefault();
      e.stopPropagation();

      var tmp = $el.parent().parent().data('obj');
      self.selectElement(null);
      self.selectElement(tmp);

      bindMouseResize($el.parent().parent(), e, $el.data('handle'));
   }

  };

  $canvas.bind('mousedown.global', this.globalMouseDown);

  _.each(shortcuts.global.shortcuts, function(key) {
    $(document).bind(key.e, key.override || key.key, function() {
      key.callback.apply(self, arguments);
    });
  });


  (function() {

    var index = 0;

    var panelFuns = {
      'cursor': function() {
        self.selectElement(null);
      },
      'add-block': function() {
        var el = new BlockElement(++index);
        el.$dom.appendTo($canvas);
        self.selectElement(null);
        self.selectElement(el);
      },
      'add-text': function() {
        var el = new TextElement(++index);
        el.$dom.appendTo($canvas);
        self.selectElement(null);
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


  var $bg = $('#bg-picker');
  var bgPicker = new jscolor.color($bg[0], {pickerClosable:true});

  $bg.bind('change', function() {
    self.onSelected('css',{'background-color': '#' + bgPicker.toString()});
  });

  var $fg = $('#fg-picker');
  var fgPicker = new jscolor.color($fg[0], {pickerClosable:true});

  $fg.bind('change', function() {
    self.onSelected('css',{'color': '#' + fgPicker.toString()});
  });

  $('#font-family').bind('change', function() {
    self.onSelected('css',{'font-family': $(this).val()});
  });

  $('#bold').bind('mousedown', function() {
    self.onSelected('toggleBold');
  });
  $('#italic').bind('mousedown', function() {
    self.onSelected('toggleItalic');
  });
  $('#underline').bind('mousedown', function() {
    self.onSelected('toggleUnderline');
  });

  $('#align-left').bind('mousedown', function() {
    self.onSelected('css',{'text-align': 'left'});
  });
  $('#align-center').bind('mousedown', function() {
    self.onSelected('css',{'text-align': 'center'});
  });
  $('#align-right').bind('mousedown', function() {
    self.onSelected('css',{'text-align': 'right'});
  });
  $('#align-justify').bind('mousedown', function() {
    self.onSelected('css',{'text-align': 'justify'});
  });

  $('#toggle-grid').bind('mousedown', function(e) {
    $('#grid-overlay').toggle();
    $(this).toggleClass('active');
  });

  $('.slider').each(function() {
    var $slider = $(this);
    var $value = $slider.find('span');
    var $input = $slider.find('input');
    $(this).bind('mousedown', function() {
      if (!$input.is(':visible')) {
        $slider.addClass('active');
        self.$canvas.unbind('mousedown.global');
        $input.show();
        setTimeout(function() {
          $(document).bind('mousedown.range', function(e) {
            if (e.target !== $input[0]) {
              $(document).unbind('mousedown.range');
              $input.hide();
              $slider.removeClass('active');
              if (!$(e.target).parents().hasClass('slider')) {
                self.$canvas.bind('mousedown.global', self.globalMouseDown);
              }
            }
          });
        }, 0);
      }
    });
    $input.bind('change', function() {
      $value.text(this.value);
      var tmp = {}, key = $(this).attr('data-css');
      tmp[key] = this.value + 'px';
      if (key === 'opacity') {
        tmp[key] = parseInt(tmp[key], 0) / 100;
      }
      self.onSelected('css', tmp);
    });

  });


};

new Protoshop();

