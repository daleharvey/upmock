var defaultSite = {
  html: '',
  fonts: [],
  width: 1024,
  overlay: true,
  bgColour: 'white',
  grid: {
    width:40,
    gutter: 20,
    columns: 16,
    height: 20,
    colour: 'rgb(0, 0, 0)',
    opacity: 0.05
  }
};

var DataStore = {

  data: null,
  local: true,

  load: function(name, callback) {
    this.data = localJSON.get('default', defaultSite);
    callback();
  },

  save: function() {
    localJSON.set('default', this.data);
    var dfd = $.Deferred();
    setTimeout(dfd.resolve, 0);
    return dfd;
  }

};

var AutoSave = {

  TIMEOUT: 3000,
  timer: null,

  isDirty: function() {
    return this.timer !== null;
  },

  autoSave: function() {
    var toSave = $('#canvas').clone();
    toSave.find('#info, .handles, #selection').remove();
    DataStore.data.html = toSave.html();
    this.timer = null;
    $('#save-data').attr('disabled', 'disabled');
    return DataStore.save();
  },

  trigger: function(immediately) {

    $('#save-data').removeAttr('disabled');

    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (immediately) {
      return this.autoSave();
    } else {
      this.timer = setTimeout($.proxy(this.autoSave, this), this.TIMEOUT);
    }
  }
};



var Protoshop = function() {

  var self = this;

  var UNDO_ITEMS_LIMIT = 50;
  var AUTOSCROLL_INCREMENT = 15;
  var AUTOSCROLL_INTERVAL = 25;

  var $window = $(window);
  var $canvas = $('#canvas');
  var $selection = $('#selection');
  var $canvas_wrapper = $('#canvas_wrapper');
  var $canvas_copy = $('#canvas_copy');
  var $info = $('<div id="info">info</div>');

  var cursors = {
    nw: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    se: 'nwse-resize',
    n: 'ns-resize',
    e: 'ew-resize',
    s: 'ns-resize',
    w: 'ew-resize'
  };

  var $guide = {
    x: $('#snapx'),
    y: $('#snapy')
  };

  var TOP_OFFSET = parseInt($canvas_wrapper.css('top'), 10);

  this.scrollHorizontal = false;
  this.scrollVertical = false;
  this.scrollInterval = null;

  this.deferredUndoAttribute = null;
  this.$selection = $selection;
  this.selected = [];
  this.$canvas = $canvas;
  this.$canvas_wrapper = $canvas_wrapper;
  this.index = {min: 2000, max: 2000};
  this.usedColours = [];
  this.bgColour = null;

  this.maxHeight = 1000;
  this.maxWidth = 1024;

  this.snap = {
    x: [],
    y: [],
    xcenter: [],
    ycenter: []
  };

  this.undo_stack = [];
  this.redo_stack = [];

  this.user = false;

  Protoshop.States = {
    'EDIT': 1,
    'CREATE': 2
  };

  this.state = null;
  this.createMode = null;

  this.setState = function(state) {
    $('#panel .active').removeClass('active');
    if (state === Protoshop.States.EDIT) {
      $(document.body).css('cursor', 'auto');
      $('#cursor').addClass('active');
    } else if (state === Protoshop.States.CREATE) {
      if (self.createMode === 'add-h1' || self.createMode === 'add-text') {
        $(document.body).css('cursor', 'text');
      } else {
        $(document.body).css('cursor', 'crosshair');
      }
      $('#panel #' + this.createMode).addClass('active');
    }
    self.state = state;
  };

  this.redo = function() {
    if (this.redo_stack.length > 0) {
      self.selectElement(null);
      var html = self.redo_stack.pop();
      this.undo_stack.push(html);
      self.restore(html);
    } else {
      Utils.alert('nothing to redo');
    }
  };

  this.undo = function() {

    // if there is a change that we delayed being saved as an undo point, do it now
    if (self.deferredUndoAttribute !== null) {
      self.saveUndoPoint();
      self.deferredUndoAttribute = null;
    }

    if (self.undo_stack.length > 1) {
      self.selectElement(null);

      // This is the current state
      var current = self.undo_stack.pop();
      self.redo_stack.push(current);
      var html = self.undo_stack[self.undo_stack.length-1];
      self.restore(html);
    } else {
      Utils.alert('nothing to undo');
    }
  };

  this.commitUndoPoint = function() {
    if (this.deferredUndoAttribute) {
      this.deferredUndoAttribute = null;
      self.saveUndoPoint();
    }
  };


  this.deferredSaveUndoPoint = function(key) {

    if (self.deferredUndoAttribute !== null && self.deferredUndoAttribute !== key) {
      self.commitUndoPoint();
    }

    if (self.deferredUndoAttribute === null) {
      self.deferredUndoAttribute = key;
    }
  };

  this.maybeShowSnap = function(direction) {

    $guide.x.hide();
    $guide.y.hide();

    if (!self.snap) {
      self.snap = collectSnapPoints(self.selected);
    }

    var bounds = self.calculateSelectionBounds();
    offsetSnap({
      top: bounds.nw.y,
      left: bounds.nw.x,
      width: bounds.se.x - bounds.nw.x,
      height: bounds.se.y - bounds.se.y
    }, null, 1);

  };

  this.saveUndoPoint = function() {

    this.redo_stack = [];
    var toSave = $canvas.clone();
    // Probably do this when loading instead of saving
    toSave.find('#info, .handles, #selection').remove();
    this.undo_stack.push({
      html: toSave.html(),
      grid: DataStore.data.grid,
      background: DataStore.data.bgColour
    });
    while(this.undo_stack.length > UNDO_ITEMS_LIMIT) {
      this.undo_stack.shift();
    }
    AutoSave.trigger();
  };


  this.setCanvasWidth = function() {
    var grid = DataStore.data.grid;
    var wholeWidth = grid.width + grid.gutter;
    DataStore.data.width = wholeWidth * grid.columns - grid.gutter;
    self.redraw();
  };

  this.drawOverlay = function() {

    var grid = DataStore.data.grid;
    var wholeWidth = grid.width + grid.gutter;
    var width = wholeWidth * grid.columns - grid.gutter;
    var gridHeight = grid.height;

    var canvas = $('<canvas width="' + width + '" height="' + (gridHeight || 1) +
                   '"></canvas>');
    var ctx = canvas[0].getContext("2d");

    ctx.fillStyle = grid.colour;
    for (var i = 0; i < grid.columns; i++) {
      ctx.fillRect(wholeWidth * i, 0, grid.width, gridHeight || 1);
    }

    if (gridHeight !== 0) {
      ctx.fillRect(0, gridHeight - 1, width, 1);
    }

    var oldGrid = $('.grid-overlay[data-deleted!=true]:eq(0)');
    var newGrid = oldGrid.clone().css({
      background: 'url(' + canvas[0].toDataURL() + ')',
      width: width,
      'margin-left': (width / 2) * -1,
      opacity: grid.opacity
    }).appendTo($canvas_copy);

    oldGrid.attr('data-deleted', 'true');

    // defer removal, gets rid of flickering
    setTimeout(function() {
      oldGrid.remove();
    }, 0);

  };

  this.releaseFocus = function() {
    this.$canvas_wrapper.bind('mousedown.global', this.globalMouseDown);
  };

  this.grabFocus = function() {
    this.$canvas_wrapper.unbind('mousedown.global');
  };

  this.addFont = function(font) {
    if (font.source === 'system') {
      return;
    }
    DataStore.data.fonts.push(font);
    DataStore.data.fonts = _.uniq(DataStore.data.fonts, false, function (v) {
      return v.family;
    });
  };

  this.loadFonts = function(fonts, preview, callback) {
    var loaded = 0;

    var google = fonts
      .filter(function(x) { return x.source !== 'system'; })
      .map(function(x) { return x.family; });

    var hasLoaded = function() {
      if (callback) {
        callback();
      }
    };

    var fontDone = function() {
      loaded++;
      hasLoaded();
    };

    if (!google.length) {
      hasLoaded();
      return;
    }

    // We are gonna want to wrap this so we can detect font loading
    var link =
      '<link rel="stylesheet" href="http://fonts.googleapis.com/css?family=' +
      google.join('|') + '">';

    if (preview) {
      $('#font-preview-links').append(link);
    } else {
      $('#font-links').html(link);
    }

    hasLoaded();
  };

  this.loadOwnFonts = function() {
    this.loadFonts(DataStore.data.fonts, false);
  };

  this.redraw = function() {
    var bgColour = DataStore.data.bgColour;
    var width = DataStore.data.width;
    $canvas_wrapper.css('background', Utils.w3cGradient2Browser(bgColour));
    $canvas.width(width).css('margin-left', -Math.round(width/2));
    $canvas_copy.width(width).css('margin-left', -Math.round(width/2));
  };

  this.updateInfo = function() {
    var bnd = self.calculateSelectionBounds();
    var text = bnd.nw.x + 'x' + bnd.nw.y + ' ' + (bnd.se.x - bnd.nw.x) + 'px ' +
      (bnd.se.y - bnd.nw.y) + 'px';
    $info.css({left: bnd.nw.x, top: bnd.se.y + 15}).text(text);
  };


  function collectSnapPoints(arr) {

    var x = [], y = [], xcenter = [], ycenter = [];

    x.push(0);
    x.push($canvas.width());

    y.push(0);
    y.push($canvas.height());

    xcenter.push(Math.round($canvas.width() / 2));
    ycenter.push(Math.round($canvas.height() / 2));

    // Snap to 960gs grid if visible
    if (DataStore.data.overlay) {
      var overlay = DataStore.data.grid;
      var gridHeight = overlay.height;
      var width = $canvas.width();
      var height = $canvas.height();
      var g = 0;
      for (var i = 0; i < overlay.columns; i++) {
        x.push((overlay.width + overlay.gutter) * i);
        x.push(((overlay.width + overlay.gutter) * i) + overlay.width);
      }
      if (gridHeight !== 0) {
        while(g < height) {
          y.push(g);
          g += gridHeight;
        }
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
      $(document).unbind('.editing');
      bindKeyMove();
    } else {
      $(document).unbind('.editing');
      _.each(self.selected, function(obj) { obj.deselect.apply(obj); });
      self.selected = [];
    }

    var bounds = self.calculateSelectionBounds();

    if (el === null) {
      $info.remove();
    } else if (bounds.se.x !== null) {
      $canvas.append($info);
      self.updateInfo();
    }

    self.$selection.trigger('change', {selected: self.selected});

  };


  this.recalcHeight = function() {
    var maxHeight = Math.max(self.maxHeight, $(document.body).height());
    var maxWidth = Math.max(self.maxWidth, $canvas.width());
    var objects = _.each($canvas.find('div'), function(obj) {
      var top = parseInt($(obj).css('top'), 10);
      var height = parseInt($(obj).css('height'), 10);
      if (!isNaN(top) && !isNaN(height)) {
        maxHeight = Math.max(maxHeight, top + height);
      }
    });

    $canvas_copy.height(maxHeight);
  };


  this.onSelectedUndo = function(callback, args) {

    var saveUndoPoint = true;

    // These elements will get changed in quick succession, filling the
    // clipboard with junk, we squash changes to these attributes into a single
    // undo point
    var delayApply = [
      'box-shadow', 'background', 'text-shadow', 'line-height', 'letter-spacing',
      'opacity', 'border-top-left-radius', 'border-top-right-radius',
      'border-bottom-right-radius', 'border-bottom-left-radius', 'border-radius',
      'move', 'top', 'left', 'right', 'bottom'];

    if (callback === 'css' || callback === 'move') {

      var key = callback === 'move' ? 'move' : Object.keys(args)[0];

      if (this.deferredUndoAttribute !== null && this.deferredUndoAttribute !== key) {
        self.commitUndoPoint();
      } else if (key === this.deferredUndoAttribute) {
        saveUndoPoint = false;
      }

      if ($.inArray(key, delayApply) !== -1) {
        saveUndoPoint = false;
        this.deferredUndoAttribute = key;
      }
    }

    self.onSelected.apply(self, arguments);

    if (saveUndoPoint) {
      self.saveUndoPoint();
    }
  };

  this.onSelected = function(callback, undoPoint) {
    var params = _.toArray(arguments).slice(1);
    var ret = _.map(self.selected, function(obj) {
      obj[callback].apply(obj, params);
    });
    AutoSave.trigger();
    self.recalcHeight();
    return ret;
  };


  this.copy = function() {
    return _.map(this.selected, function(obj) {
      var tmp = obj.$dom.clone().removeClass('selected');
      tmp.find('.handles').remove();
      return tmp.wrap('<div>').parent().html();
    });
  };

  this.paste = function(data, offset) {
    var arr = _.map(data, function(html) {
      var $obj = $(html);
      var top = !offset ? parseInt($obj.css('top'), 10)
        : $canvas_wrapper[0].scrollTop + 50;
      $obj.css({
        left: parseInt($obj.css('left'), 10) + (offset ? 50 : 0),
        top: top
      });
      var obj = new Elements[$obj.data('type')]({index: ++self.index.max}, $obj);
      obj.$dom.appendTo($('#canvas'));
      if (offset) {
        self.selectElement(obj);
      }
    });
  };


  function within(a, b, accuracy) {
    return (a > (b - accuracy)) && (a < (b + accuracy));
  }


  function snapPlane(position, size, points, centerPoints, type, accuracy) {

    for (i = 0, len = points.length; i < len; i++) {
      if (within(position, points[i], accuracy) && !/(s|e)/.test(type)) {
        return {point: 'start', value: points[i]};
      }
      if (within(position + size, points[i], accuracy)) {
        return {point: 'end', value: points[i]};
      }
    }

    for (i = 0, len = centerPoints.length; i < len; i++) {
      if (within(Math.round((position + (size / 2))), centerPoints[i], accuracy) &&
          !/(n|w)/.test(type)) {
        return {point: 'middle', value: centerPoints[i]};
      }
    }

    return false;
  }

  this.autoScroll = function() {
    if (self.scrollVertical) {
      $canvas_wrapper[0].scrollTop += self.scrollVertical;
    }
    $window.trigger('mousemove');
  };


  function offsetSnap(bounds, type, accuracy) {

    type = type || '';

    var snap = {};

    var offset = {
      x: $canvas[0].offsetLeft,
      y: $canvas[0].offsetTop
    };

    var x = type.replace(/(n|s)/, '');
    var y = type.replace(/(w|e)/, '');

    var snapX = snapPlane(bounds.left, bounds.width, self.snap.x,
                          self.snap.xcenter, x, accuracy);
    var snapY = snapPlane(bounds.top, bounds.height, self.snap.y,
                          self.snap.ycenter, y, accuracy);

    if (snapX !== false) {
      $guide.x.css('left', snapX.value + offset.x - $canvas_wrapper[0].scrollLeft)
        .show();
      snap.x = snapX;
    }

    if (snapY !== false) {
      $guide.y.css('top', snapY.value + offset.y + TOP_OFFSET -
                   $canvas_wrapper[0].scrollTop)
        .show();
      snap.y = snapY;
    }

    return snap;
  }

  function calculateResizeBounds(bounds, snap, constrain) {

    var ratio = bounds.width / bounds.height;

    if (snap.x) {
      if (snap.x.point === 'start') {
        bounds.width += bounds.left - snap.x.value;
        bounds.left = snap.x.value;
      } else if (snap.x.point === 'end') {
        bounds.width = snap.x.value - bounds.left;
      } else if (snap.x.point === 'middle') {
        bounds.width = ((bounds.left + bounds.width) - snap.x.value * 2);
      }
      if (constrain) {
        bounds.height = bounds.width * (1/ratio);
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
      if (constrain) {
        bounds.width = bounds.height * ratio;
      }
    }

    return bounds;
  }


  function bindMouseMove(e) {

    var start = e, orig = {x:0, y:0}, diff = {}, bounds = {};
    var startBounds = self.calculateSelectionBounds();

    if (e.altKey) {
      self.paste(self.copy(), false);
    }

    var size = {
      width: startBounds.se.x - startBounds.nw.x,
      height: startBounds.se.y - startBounds.nw.y
    };

    var startScrollTop = $canvas_wrapper[0].scrollTop;
    var startScrollLeft = $canvas_wrapper[0].scrollLeft;

    var cacheClientX = 0;
    var cacheClientY = 0;

    var startHeight = $canvas_copy.height();

    self.snap = collectSnapPoints(self.selected);
    $window.bind('mousemove.editing', function(e) {

      if (!e.clientX && !e.clientY) {
        e.clientY = cacheClientY;
        e.clientX = cacheClientX;
      } else {
        cacheClientY = e.clientY;
        cacheClientX = e.clientX;
      }

      diff = {x: e.clientX - start.clientX, y: e.clientY - start.clientY};

      $guide.x.hide();
      $guide.y.hide();

      if (!e.metaKey) {

        var snap = offsetSnap({
          top: startBounds.nw.y + diff.y,
          left: startBounds.nw.x + diff.x,
          height: size.height,
          width: size.width
        }, null, 4);

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

      if (e.shiftKey) {
        if (Math.abs(diff.y) > Math.abs(diff.x)) {
          diff.x = 0;
        } else {
          diff.y = 0;
        }
      }

      diff.y -= startScrollTop - $canvas_wrapper[0].scrollTop;
      diff.x -= startScrollLeft - $canvas_wrapper[0].scrollLeft;

      self.onSelectedUndo('move', -(orig.y - diff.y), -(orig.x - diff.x));
      self.updateInfo();

      if (startBounds.se.y + diff.y > self.maxHeight) {
        self.maxHeight = startBounds.se.y + diff.y;
      }
      if (startBounds.se.x + diff.x > self.maxWidth) {
        self.maxWidth = startBounds.se.x + diff.x;
      }

      orig = diff;

      self.maybeScroll(e);
    });

    $window.bind('mouseup.editing', function(e) {
      if (self.scrollInterval !== null) {
        clearInterval(self.scrollInterval);
        self.scrollInterval = null;
      }
      $guide.x.hide();
      $guide.y.hide();
      $window.unbind('.editing');
      self.commitUndoPoint();
    });

  }

  this.maybeScroll = function(e) {

    self.scrollVertical = 0;
    if (e.clientY > $(window).height()) {
      self.scrollVertical = AUTOSCROLL_INCREMENT;
    } else if (e.clientY < TOP_OFFSET) {
      self.scrollVertical = -AUTOSCROLL_INCREMENT;
    }

    if (self.scrollInterval !== null && !self.scrollHorizontal &&
        !self.scrollVertical) {
      clearInterval(self.scrollInterval);
      self.scrollInterval = null;
    } else if (self.scrollInterval === null &&
               (self.scrollHorizontal || self.scrollVertical)) {
      self.scrollInterval = setInterval(self.autoScroll, AUTOSCROLL_INTERVAL);
    }

  };

  function bindMouseResize($el, e, type) {

    $('#cursor-overlay').css('cursor', cursors[type]).show();

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

    var startScrollTop = $canvas_wrapper[0].scrollTop;
    var startScrollLeft = $canvas_wrapper[0].scrollLeft;

    var cacheClientX = 0;
    var cacheClientY = 0;

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

    $window.bind('mousemove.resize', function(e) {

      if (!e.clientX && !e.clientY) {
        e.clientY = cacheClientY;
        e.clientX = cacheClientX;
      } else {
        cacheClientY = e.clientY;
        cacheClientX = e.clientX;
      }

      $guide.x.hide();
      $guide.y.hide();

      var yDiff = startScrollTop - $canvas_wrapper[0].scrollTop;
      e.clientY -= yDiff;

      if (e.shiftKey && type.length === 2) {

        var yMult = (type[0] === 's') ? 1 : -1;
        var xMult = (type[1] === 'e') ? 1 : -1;
        var ratio = size.width / size.height;

        var axis = {
          y: (type[0] === 's') ? e.clientY - (start.pageY - size.height)
            : (start.pageY + size.height) - e.clientY,
          x: (type[1] === 'e') ? e.clientX - (start.pageX - size.width)
            : (start.pageX + size.width) - e.clientX
        };

        if (axis.x / axis.y > ratio) {
          e.clientY = (start.pageY - (size.height * yMult)) +
            (axis.x * (1 / ratio) * yMult);
        } else {
          e.clientX = (start.pageX - (size.width * xMult)) +
            (axis.y * ratio * xMult);
        }
      }

      var obj = {}, i;
      for(i = 0; i < len; i++) {
        resize[type[i]](e, obj);
      }

      if (!e.metaKey) {
        var tmp = $.extend({}, size, offset, obj);
        var snap = offsetSnap(tmp, type, 4);
        obj = calculateResizeBounds(tmp, snap, e.shiftKey);
      }

      self.selected[0].css(obj);
      self.updateInfo();
      self.recalcHeight();

      if (obj.top + obj.height > self.maxHeight) {
        self.maxHeight = obj.top + obj.height;
      }

      e.clientY += yDiff;
      self.maybeScroll(e);
    });

    $window.bind('mouseup.resize', function(e) {

      $('#cursor-overlay').hide();

      if (self.scrollInterval !== null) {
        clearInterval(self.scrollInterval);
        self.scrollInterval = null;
      }
      $guide.x.hide();
      $guide.y.hide();
      $window.unbind('.resize');
      self.saveUndoPoint();

      if (self.state === Protoshop.States.CREATE) {
        self.setState(Protoshop.States.EDIT);
      }

    });

  }

  function bind(scope, fn) {
    return function (evt) {
      var target = $(evt.target);
      if (!(target.is('span[contenteditable=true]') || target.is('input'))) {
        evt.stopPropagation();
        evt.preventDefault();
        if (fn.apply(scope, arguments) !== false) {
          // maybe need to cancel or something in the future
        }
      }
    };
  }

  function bindKeyMove($el) {
    _.each(shortcuts.editing.shortcuts, function(key) {
      $(document).bind(key.e + '.editing', key.override || key.key,
                       bind(self, key.callback));
    });
  }

  function bindMouseSelection(e) {

    var yOffset = $canvas_wrapper[0].scrollTop - $canvas_wrapper[0].offsetTop;
    var xOffset = $('#canvas_copy')[0].offsetLeft - $canvas_wrapper[0].scrollLeft;
    var start = e;
    var selected = [];

    start.clientY += yOffset;
    start.clientX -= xOffset;

    var objects = _.filter($canvas.find('div'), function(obj) {
      return typeof $(obj).data('obj') !== 'undefined';
    });

    objects = _.map(objects, function(obj) { return $(obj); });

    $selection.css({top: start.clientY, left: 0, height: 1, width: 1});
    $selection.show();

    $window.bind('mousemove.selecting', function(e) {

      e.clientY += yOffset;
      e.clientX -= xOffset;

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

    $window.bind('mouseup.selecting', function(e) {
      $selection.hide();
      $window.unbind('.selecting');
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

    if ($(e.target).is('span[contenteditable=true]')) {
      return true;
    }

    if (self.state === Protoshop.States.CREATE) {

      e.preventDefault();
      e.stopPropagation();

      var yOffset = $canvas_wrapper[0].scrollTop - $canvas_wrapper[0].offsetTop;
      var xOffset = $('#canvas_copy')[0].offsetLeft - $canvas_wrapper[0].scrollLeft;

      e.clientY += yOffset;
      e.clientX -= xOffset;

      var element = panelFuns[self.createMode].create(e);
      append(element);

      if (panelFuns[self.createMode].handle) {
        return bindMouseResize(element.$dom, e, panelFuns[self.createMode].handle);
      }

      if (self.createMode === 'add-h1' || self.createMode === 'add-text') {
        element.startEditing();
      }

      self.setState(Protoshop.States.EDIT);
      return;
    }

    if (e.target === this || e.target === $canvas[0]) {
      e.preventDefault();
      e.stopPropagation();
      self.selectElement(null);
      bindMouseSelection(e);
      return true;
    }

    var $el = $(e.target);
    var obj = $el.data('obj');

    if ($el.data('lock') === true && e.shiftKey) {
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

  this.updateUsedColours = function() {

    var html = "", colours = {};

    colours[DataStore.data.bgColour] = true;

    $.each($('.block, .text'), function(i, obj) {
      colours[$(obj).css('color')] = true;
      colours[Utils.readBackground(obj)] = true;
    });

    colours = _.keys(colours);
    colours.sort();

    $.each(colours, function(i, key) {

      if (key === 'rgba(0, 0, 0, 0)') {
        return;
      }

      var css = /gradient/.test(key) ? 'gradient' :
        (/url/.test(key) ? 'image' : 'plain');

      html += '<div class="used-colour ' + css + '" data-background="' +
        Utils.browserGradient2w3c(key).replace(/"/g, '') + '" ' +
        'style="background: ' +
        Utils.w3cGradient2Browser(key).replace(/"/g, '') + '"></div>';
    });
    $('#used-colours').html(html);
  };

  this.restore = function(restore) {

    self.redraw();
    self.drawOverlay();

    $canvas.html(restore.html);

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

  };

  $canvas_wrapper.bind('mousedown.global', this.globalMouseDown);


  function drop(e) {

    e.stopPropagation();
    e.preventDefault();

    var offset = {
      x: $canvas[0].offsetLeft,
      y: $canvas_wrapper[0].offsetTop - $canvas_wrapper[0].scrollTop
    };

    var i, len, reader, file;
    var files = e.dataTransfer.files;
    var done = [];
    var count = files.length;

    function fileLoaded(event) {
      var img = new Elements.ImgElement({
        index: ++self.index.max,
        css: { width: 100, height: 100},
        html: '<img src="" />'
      });
      img.css({
        top: e.clientY - offset.y,
        left: e.clientX - offset.x + (done.length * 50)
      });
      img.setImageData(event.target.result);
      append(img);

      done.push(img);

      if (done.length === count) {
        self.selectElement(null);
        _.each(done, function(obj) {
          self.selectElement(obj);
        });
      }
    }

    for (i = 0; i < files.length; i++) {

      file = files[i];

      if (file.size > (1048576 * 2)) {
        Utils.alert('2MB Limit');
        continue;
      }

      if (!file.type.match(/image.(png|jpg|jpeg)/)) {
        Utils.alert('file is not an image');
        continue;
      }

      reader = new FileReader();
      reader.index = i;
      reader.file = file;

      if (!hasStupidChromeBug()) {
        reader.addEventListener("loadend", fileLoaded, false);
      } else {
        reader.onload = fileLoaded;
      }
      reader.readAsDataURL(file);
    }
  }

  function hasStupidChromeBug() {
    return typeof(FileReader.prototype.addEventListener) !== "function";
  }

  function doNothing(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function append(el) {
    el.$dom.appendTo($canvas);
    self.selectElement(null);
    self.selectElement(el);
    self.saveUndoPoint();
  }

  document.addEventListener("dragenter", doNothing, false);
  document.addEventListener("dragover", doNothing, false);
  document.addEventListener("drop", drop, false);


  _.each(shortcuts.global.shortcuts, function(key) {
    $(document).bind(key.e, key.override || key.key, function(e) {
      if (!$(e.target).is('span[contenteditable=true]')) {
        e.preventDefault();
        e.stopPropagation();
        key.callback.apply(self, arguments);
      }
    });
  });

  var panelFuns = {
    'cursor': {
      title: 'Select elements',
      callback: function() {
        self.setState(Protoshop.States.EDIT);
        self.selectElement(null);
      }
    },
    'add-block': {
      title: 'Add Block Element',
      callback: function() {
        self.createMode = 'add-block';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.BlockElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX, width: 0, height: 0}
        });
      },
      handle: 'se'
    },
    'add-h1': {
      title: 'Add Headers',
      callback: function() {
        self.createMode = 'add-h1';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.TextElement({
          index: ++self.index.max,
          css: {
            top: e.clientY,
            left: e.clientX,
            'font-size': 24,
            'font-weight': 'bold'
          }
        });
      }
    },
    'add-text': {
      title: 'Add Paragraph',
      callback: function() {
        self.createMode = 'add-text';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.TextElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX}
        });
      }
    },
    'add-hr': {
      title: 'Add Horizontal Rule',
      callback: function() {
        self.createMode = 'add-hr';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.HRElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX, width: 0}
        });
      },
      handle: 'e'
    },
    'add-vr': {
      title: 'Add Vertical Rule',
      callback: function() {
        self.createMode = 'add-vr';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.VRElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX, height: 0}
        });
      },
      handle: 's'
    },
    'add-input': {
      title: 'Add Input Element',
      callback: function() {
        self.createMode = 'add-input';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.HTMLElement({
          index: ++self.index.max,
          html: '<input type="text" />',
          css: {top: e.clientY, left: e.clientX}
        });
      }
    },
    'add-checkbox': {
      title: 'Add Checkbox',
      callback: function() {
        self.createMode = 'add-checkbox';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.HTMLElement({
          index: ++self.index.max,
          html: '<input type="checkbox" />',
          attrs: {'data-handles': ''},
          css: {top: e.clientY, left: e.clientX}
        });
      }
    },
    'add-button': {
      title: 'Add Button',
      callback: function() {
        self.createMode = 'add-button';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.ButtonElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX, width: 0, height: 0}
        });
      },
      handle: 'se'
    },
    'add-select': {
      title: 'Add Dropdown Menu',
      callback: function() {
        self.createMode = 'add-select';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.SelectElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX}
        });
      }
    },
    'add-image': {
      title: 'Add Image',
      callback: function() {
        self.createMode = 'add-image';
        self.setState(Protoshop.States.CREATE);
        self.selectElement(null);
      },
      create: function(e) {
        return new Elements.ImgElement({
          index: ++self.index.max,
          css: {top: e.clientY, left: e.clientX, width: 0, height: 0},
          html: '<img src="" />'
        });
      },
      handle: 'se'
    },
    'help': {
      title: 'Show Help',
      callback: function() {
        HelpDialog.toggle();
      }
    }
  };


  var $panel = $('<div id="panel"></div>');
  var $ul = $('<ul></ul>');

  _.each(panelFuns, function(v, k) {
    var $li = $('<li />', {title: v.title});
    var $btn = $('<a id="' + k + '"></a>');
    $btn.bind('mousedown', v.callback);
    $li.append($btn);
    $ul.append($li);
  });

  $panel.append($ul);
  $(document.body).append($panel);

  var isMac = /Mac/.test(navigator.appVersion);
  var html = _.map(shortcuts, function(data) {
    var tmp = $.extend({}, data);
    var newShortcuts = [];
    _.each(tmp.shortcuts, function(shortcut, key) {
      shortcut.key = shortcut.key.replace('meta', 'cmd');
      if ((isMac && !/ctrl/.test(shortcut.key) ||
           !isMac && !/cmd/.test(shortcut.key)) && shortcut.description) {
        newShortcuts.push(shortcut);
      }
    });
    tmp.shortcuts = newShortcuts;
    return tmp;
  });
  HelpDialog.data.sections = html;

  this.refreshToolbar = function() {
    self.$selection.trigger('change', {
      selected: self.selected
    });
  };

  this.initaliseData = function(callback) {

    self.site_prefix = 'default';

    DataStore.load(self.site_prefix, function() {

      self.undo_stack.push(DataStore.data);
      self.restore(DataStore.data);

      self.recalcHeight();
      self.setCanvasWidth();
      self.loadOwnFonts();

      if (DataStore.data.overlay) {
        $('.grid-overlay[data-deleted!=true]:eq(0)').show();
      }

      self.refreshToolbar();
      callback();
    });

  };

  function show() {
    if (self.user) {
      $('#home a').attr('href', '/user/' + self.user.name + '/');
    }
    // browser detection, thats the cool way right?
    if ($.browser.webkit || $.browser.mozilla) {
      self.setState(Protoshop.States.EDIT);
      self.initaliseData(function () {
        $('#loading').fadeOut('fast', function() {
          $('#loading').remove();
          document.title = self.site_prefix + ' | ' + document.title;
          $(document.body).append('<div id="selenium"></div>');
        });
      });
    } else {
      $('#loading span').text('Sorry, currently chrome only :(');
    }
  }

  self.user = false;
  show();

  $(window).bind('beforeunload', function() {
    if (AutoSave.isDirty()) {
      return 'You have unsaved changes!';
    }
  });

};
