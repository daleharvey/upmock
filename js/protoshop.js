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

  this.snap = {
    x: [],
    y: [],
    xcenter: [],
    ycenter: []
  };

  function collectSnapPoints(arr) {

    var x = [], y = [], xcenter = [], ycenter = [];

    xcenter.push(Math.round($canvas.width() / 2));
    ycenter.push(Math.round($canvas.height() / 2));

    // Snap to 960gs grid if visible
    if ($('#grid-overlay').is(":visible")) {
      var g = 10;
      while (g < 1024) {
        x.push(g);
        x.push(g + 40);
        g += 60;
      }
    }

    var objects = _.filter($canvas.find('div'), function(obj) {

      var $obj = $(obj);
      var el = $obj.data('obj');

      if (typeof el !== 'undefined' && $.inArray(el, arr) === -1) {
        var left = parseInt($obj.css('left'), 10);
        var top = parseInt($obj.css('top'), 10);
        var width = parseInt($obj.css('width'), 10);
        var height = parseInt($obj.css('height'), 10);
        x.push(left);
        x.push(left + width);
        y.push(top);
        y.push(top + height);
        xcenter.push(Math.round(left + (width / 2)));
        ycenter.push(Math.round(top + (height / 2)));
      }
    });

    return {x: x, y: y, xcenter: xcenter, ycenter: ycenter};
  }

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


  var snap = 4;
  var $guide = {
    x: $('#snapx'),
    y: $('#snapy')
  };


  function within(a, b) {
    return (a > (b - snap)) && (a < (b + snap));
  }


  function snapPlane(position, size, points, centerPoints) {

    for (i = 0, len = points.length; i < len; i++) {
      if (within(position, points[i])) {
        return {point: 'start', value: points[i]};
      }
      if (within(position + size, points[i])) {
        return {point: 'end', value: points[i]};
      }
    }

    for (i = 0, len = centerPoints.length; i < len; i++) {
      if (within(Math.round((position + (size / 2))), centerPoints[i])) {
        return {point: 'middle', value: centerPoints[i]};
      }
    }

    return false;
  }


  function offsetSnap(bounds) {

    var snap = {};

    var offset = {
      x: $canvas[0].offsetLeft,
      y: $canvas[0].offsetTop
    };

    var snapX = snapPlane(bounds.left, bounds.width, self.snap.x, self.snap.xcenter);
    var snapY = snapPlane(bounds.top, bounds.height, self.snap.y, self.snap.ycenter);

    if (snapX !== false) {
      $guide.x.css('left', snapX.value + offset.x).show();
      snap.x = snapX;
    }

    if (snapY !== false) {
      $guide.y.css('top', snapY.value + offset.y).show();
      snap.y = snapY;
    }

    return snap;
  }

  function calculateResizeBounds(bounds, snap) {
    if (snap.x) {
      if (snap.x.point === 'start') {
        bounds.width += bounds.left - snap.x.value;
        bounds.left = snap.x.value;
      } else if (snap.x.point === 'end') {
        bounds.width = snap.x.value - bounds.left;
      } else if (snap.x.point === 'middle') {
        bounds.width = ((bounds.left + bounds.width) - snap.x.value * 2);
      }
    }

    if (snap.y) {
      if (snap.y.point === 'start') {
        bounds.height += bounds.top - snap.y.value;
        bounds.top = snap.y.value;
      } else if (snap.y.point === 'end') {
        bounds.height = snap.y.value - bounds.top;
      } else if (snap.y.point === 'middle') {
        bounds.height = ((bounds.top + bounds.height) - snap.y.value * 2);
      }
    }

    return bounds;
  }


  function bindMouseMove(e) {

    var start = e, orig = {}, diff = {}, bounds = {};
    var startBounds = self.calculateSelectionBounds();

    var size = {
      width: startBounds.se.x - startBounds.nw.x,
      height: startBounds.se.y - startBounds.nw.y
    };

    self.snap = collectSnapPoints(self.selected);

    $canvas_wrapper.bind('mousemove.editing', function(e) {

      diff = {x: e.clientX - start.clientX, y: e.clientY - start.clientY};

      $guide.x.hide();
      $guide.y.hide();

      if (!e.metaKey) {

        var snap = offsetSnap({
          top: startBounds.nw.y + diff.y,
          left: startBounds.nw.x + diff.x,
          height: size.height,
          width: size.width
        });

        if (snap.x) {
          if (snap.x.point === 'middle') {
            snap.x.value -= Math.round(size.width / 2);
          } else if (snap.x.point === 'end') {
            snap.x.value -= size.width;
          }
          diff.x = snap.x.value - startBounds.nw.x;
        }

        if (snap.y) {
          if (snap.y.point === 'middle') {
            snap.y.value -= Math.round(size.height / 2);
          } else if (snap.y.point === 'end') {
            snap.y.value -= size.height;
          }
          diff.y = snap.y.value - startBounds.nw.y;
        }
      }

      self.onSelected('move', -(orig.y - diff.y), -(orig.x - diff.x));
      orig = diff;
    });

    $canvas_wrapper.bind('mouseup.moving', function(e) {
      $guide.x.hide();
      $guide.y.hide();
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

    var diff = {};
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

    var startBounds = self.calculateSelectionBounds();
    self.snap = collectSnapPoints(self.selected);

    $canvas_wrapper.bind('mousemove.resize', function(e) {

      $guide.x.hide();
      $guide.y.hide();

      var obj = {}, i;
      for(i = 0; i < len; i++) {
        resize[type[i]](e, obj);
      }

      if (!e.metaKey) {
        var tmp = $.extend({}, size, offset, obj);
        var snap = offsetSnap(tmp);
        obj = calculateResizeBounds(tmp, snap);
      }

      self.selected[0].css(obj);
    });

    $canvas_wrapper.bind('mouseup.moving', function(e) {
      $guide.x.hide();
      $guide.y.hide();
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


  this.calculateSelectionBounds = function() {

    var min = function(a, b) { return a === null ? b : Math.min(a, b); };
    var max = function(a, b) { return a === null ? b : Math.max(a, b); };
    var bounds = {nw: { x: null, y: null}, se: { x: null, y: null}};

    _.each(self.selected, function(obj) {
      var pos = obj.$dom.position();
      bounds.nw.x = min(bounds.nw.x, pos.left);
      bounds.nw.y = min(bounds.nw.y, pos.top);
      bounds.se.x = max(bounds.se.x, pos.left + obj.$dom.width());
      bounds.se.y = max(bounds.se.y, pos.top + obj.$dom.height());
    });

    return bounds;
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

      if (localStorage.overlay === "true") {
        $('#grid-overlay').show();
        $('#toggle-grid').addClass('active');
      }

    }

  })();

};


