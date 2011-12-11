var Protoshop = function() {

  var self = this;

  var $canvas = $('#canvas');
  var $selection = $('#selection');
  var $canvas_wrapper = $('#canvas_wrapper');

  this.$selection = $selection;
  this.selected = [];
  this.$canvas = $canvas;
  this.$canvas_wrapper = $canvas_wrapper;
  this.index = {min: 2000, max: 2000};

  this.selectElement = function(el) {

    $('input').blur();

    if (el) {
      if (el.select()) {
        self.selected.push(el);
      }
      bindKeyMove();
    } else {
      $(document).unbind('.editing');
      _.each(self.selected, function(obj) { obj.deselect.apply(obj); });
      self.selected = [];
    }

    self.$selection.trigger('change', {selected: self.selected});

  };

  this.onSelected = function(callback) {
    var params = _.toArray(arguments).slice(1);
    return _.map(self.selected, function(obj) {
      obj[callback].apply(obj, params);
    });
  };

  function bindMouseMove(e) {

    var start = e, orig = {}, diff = {};

    $canvas_wrapper.bind('mousemove.editing', function(e) {
      diff = {x: e.clientX - start.clientX, y: e.clientY - start.clientY};
      self.onSelected('move', -(orig.y - diff.y), -(orig.x - diff.x));
      orig = diff;
    });

    $canvas_wrapper.bind('mouseup.moving', function(e) {
      $canvas_wrapper.unbind('.editing');
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

    $canvas_wrapper.bind('mousemove.resize', function(e) {
      var obj = {}, i;
      for(i = 0; i < len; i++) {
        resize[type[i]](e, obj);
      }
      self.selected[0].css(obj);
    });

    $canvas_wrapper.bind('mouseup.moving', function(e) {
      $canvas_wrapper.unbind('.resize');
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

    $canvas_wrapper.bind('mousemove.selecting', function(e) {
      e.clientY += yOffset;

      var bounds = {
        top: Math.min(start.clientY, e.clientY),
        left: Math.min(start.clientX, e.clientX)
      };
      bounds.width = Math.max(start.clientX, e.clientX) - bounds.left;
      bounds.height = Math.max(start.clientY, e.clientY) - bounds.top;

      $selection.css(bounds);
      bounds.top -= $canvas[0].offsetTop;

      _.each(selected, function(obj) { obj.removeClass('soft-select'); });
      selected = _.filter(objects, function(obj) {
        var pos = obj.position();
        pos.left += $canvas[0].offsetLeft;
        var inside =  !(pos.left > (bounds.left + bounds.width) ||
                        (pos.left + obj.width()) < bounds.left ||
                        pos.top > (bounds.top + bounds.height) ||
                        (pos.top + obj.height()) < bounds.top);
        if (inside) {
          obj.addClass('soft-select');
        }

        return inside;
      });
    });

    $canvas_wrapper.bind('mouseup.selecting', function(e) {
      $selection.hide();
      $canvas_wrapper.unbind('.selecting');
      _.each(selected, function(obj) {
        obj.removeClass('soft-select');
        self.selectElement(obj.data('obj'));
      });
    });
  }


  $canvas_wrapper.bind('dblclick', function(e) {

    var $targ = $(e.target);
    var obj = $targ.data('obj');

    if (obj instanceof Elements.TextElement) {
      self.selectElement(null);
      self.selectElement(obj);
      obj.startEditing();
    }

  });


  this.globalMouseDown = function(e) {

    if (e.target === this || e.target === $canvas[0]) {
      e.preventDefault();
      e.stopPropagation();
      self.selectElement(null);
      bindMouseSelection(e);
      return true;
    }

    var $el = $(e.target);
    var obj = $el.data('obj');

    if ($el.data('lock') === true && e.altKey) {
      obj.unlock();
    }

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

  $canvas_wrapper.bind('mousedown.global', this.globalMouseDown);

  _.each(shortcuts.global.shortcuts, function(key) {
    $(document).bind(key.e, key.override || key.key, function() {
      key.callback.apply(self, arguments);
    });
  });

  (function() {

    function append(el) {
      el.$dom.appendTo($canvas);
      self.selectElement(null);
      self.selectElement(el);
    }

    var panelFuns = {
      'cursor': function() {
        self.selectElement(null);
      },
      'add-block': function() {
        append(new Elements.BlockElement({index: ++self.index.max}));
      },
      'add-text': function() {
        append(new Elements.TextElement({index: ++self.index.max}));
      },
      'add-h1': function() {
        append(new Elements.TextElement({
          index: ++self.index.max,
          css: {'font-size': 24, 'font-weight': 'bold'},
          text: 'Header'
        }));
      },
      'add-hr': function() {
        append(new Elements.BlockElement({
          attrs: {'data-handles': 'w,e'},
          index: ++self.index.max,
          css: {height: 1, width: 200}
        }));
      },
      'add-vr': function() {
        append(new Elements.BlockElement({
          attrs: {'data-handles': 'n,s'},
          index: ++self.index.max,
          css: {height: 200, width: 1}
        }));
      },
      'add-input': function() {
        append(new Elements.HTMLElement({
          index: ++self.index.max,
          html: '<input type="text" />'
        }));
      },
      'add-checkbox': function() {
        append(new Elements.HTMLElement({
          index: ++self.index.max,
          html: '<input type="checkbox" />',
          attrs: {'data-handles': ''}
        }));
      },
      'add-button': function() {
        append(new Elements.ButtonElement({index: ++self.index.max}));
      },
      'add-select': function() {
        append(new Elements.SelectElement({index: ++self.index.max}));
      },
      'add-image': function() {
        append(new Elements.ImgElement({
          index: ++self.index.max,
          css: { width: 100, height: 100},
          html: '<img src="" />'
        }));
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
      toSave.find('.handles, #selection').remove();
      localStorage.saved = toSave.html();
    }, 5000);

    if (localStorage.saved) {

      $canvas.html(localStorage.saved);

      _.each($canvas.find('div'), function(obj) {

        var type = $(obj).data('type');

        if (type) {

          var index = parseInt($(obj).css('z-index'), 0);
          if (index > self.index.max) {
            self.index.max = index;
          } else if (index < self.index.min) {
            self.index.min = index;
          }

          new Elements[type]({index: index}, $(obj));

        }
      });

      $canvas.find('.selected').each(function() {
        self.selectElement($(this).data('obj'));
      });

      if (localStorage.overlay) {
        $('#grid-overlay').show();
        $('#toggle-grid').addClass('active');
      }

    }

  })();

};


