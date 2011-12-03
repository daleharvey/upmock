if (Modernizr.inputtypes.range ){
  $(document.body).addClass('range');
}

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

  this.$handles = null;
  this.$dom = null;

  this.select = function() {

    if (this.$dom.attr('data-lock') === 'true') {
      return false;
    }

    this.$handles = $handles.clone();
    this.$dom.addClass('selected');
    this.$dom.append(this.$handles);

    return true;
  };

  CoreElement.prototype.deselect = function() {
    this.$dom.removeClass('selected');
    this.$handles.remove();
    this.$handles = null;
  };

  this.css = function(obj) {
    this.$dom.css(obj);
  };

  CoreElement.prototype.move = function(y, x) {
    this.css({
      left: this.$dom.position().left + x,
      top: this.$dom.position().top + y
    });
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

  this.lock = function() {
    this.$dom.attr('data-lock', true);
  };
  this.unlock = function() {
    this.$dom.removeAttr('data-lock');
  };

};

var BlockElement = function(index, obj) {
  this.$dom = obj || $('<div>', {
    'data-type': 'block',
    'class': 'block'
  });
  this.$dom.css('z-index', index);
  this.$dom.data('obj', this);
};
BlockElement.prototype = new CoreElement();

var TextElement = function(index, obj) {

  this.$dom = obj || $('<div>', {
    'data-type': 'text',
    'class': 'text'
  }).append('<span>text</span>');

  this.$dom.css('z-index', index);
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
  var $selection = $('#selection');
  var $canvas_wrapper = $('#canvas_wrapper');

  this.$selection = $selection;
  this.selected = [];
  this.$canvas = $canvas;
  this.index = {min: 2000, max: 2000};

  this.selectElement = function(el) {

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
    _.each(self.selected, function(obj) {
      obj[callback].apply(obj, params);
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

  $canvas.bind('mousedown.global', this.globalMouseDown);

  _.each(shortcuts.global.shortcuts, function(key) {
    $(document).bind(key.e, key.override || key.key, function() {
      key.callback.apply(self, arguments);
    });
  });

  (function() {


    var panelFuns = {
      'cursor': function() {
        self.selectElement(null);
      },
      'add-block': function() {
        var el = new BlockElement(++self.index.max);
        el.$dom.appendTo($canvas);
        self.selectElement(null);
        self.selectElement(el);
      },
      'add-text': function() {
        var el = new TextElement(++self.index.max);
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
      toSave.find('.handles').remove();
      localStorage.saved = toSave.html();
    }, 5000);

    if (localStorage.saved) {
      $canvas.html(localStorage.saved);

      _.each($canvas.find('[data-type=block]'), function(obj) {
        var index = parseInt($(obj).css('z-index'), 0);
        if (index > self.index.max) {
          self.index.max = index;
        } else if (index < self.index.min) {
          self.index.min = index;
        }
        new BlockElement(index, $(obj));
      });
      _.each($canvas.find('[data-type=text]'), function(obj) {
        var index = parseInt($(obj).css('z-index'), 0);
        if (index > self.index.max) {
          self.index.max = index;
        } else if (index < self.index.min) {
          self.index.min = index;
        }
        new TextElement(index, $(obj));
      });

      var sel = $canvas.find('.selected').data('obj');
      if (sel) {
        self.selectElement(sel);
      }
    }
  })();

};

Protoshop.Toolbar = function(protoshop) {

  var self = this;
  var $root = $('#top-bar-inner');

  var fonts = {
    'tnr': "Cambria, 'Hoefler Text', 'Times New Roman', serif",
    'georgia': "Constantia, 'Lucida Bright', 'Bitstream Vera Serif', " +
      "'Liberation Serif', Georgia, serif",
    'garamond': "'Palatino Linotype', Baskerville, 'Bookman Old Style', " +
      "'Bitstream Charter', Garamond, Georgia, serif",
    'helvetica': "Frutiger, Univers, Helvetica, Arial, sans-serif",
    'verdana': "Corbel, 'Bitstream Vera Sans', Verdana, sans-serif",
    'trebuchet': "'Segoe UI', 'Trebuchet MS', Verdana, sans-serif",
    'impact': "Impact, 'Franklin Gothic Bold', 'Arial Black', sans-serif",
    'monospace': "Consolas, 'DejaVu Sans Mono', Monaco, Courier, monospace"
  };

  this.protoshop = protoshop;

  this.tpls = {
    'global': Handlebars.compile($('#global-toolbar-tpl').html()),
    'text': Handlebars.compile($('#text-toolbar-tpl').html()),
    'element': Handlebars.compile($('#textandblock-toolbar-tpl').html())
  };

  this.events = {};

  this.events['global'] = function() {
    $('#toggle-grid').bind('mousedown', function(e) {
      $('#grid-overlay').toggle();
      $(this).toggleClass('active');
    });
  }


  this.events['element'] = function() {
    $('#bring-to-front').bind('mousedown', function() {
      self.protoshop.onSelected('css', {'z-index': ++self.index.max});
    });
    $('#send-to-back').bind('mousedown', function() {
      self.protoshop.onSelected('css', {'z-index': --self.index.min});
    });

    $('#lock').bind('mousedown', function() {
      self.protoshop.onSelected('lock');
      self.protoshop.selectElement(null);
    });

    bindRange($('#border-width'));
    bindRange($('#border-radius'));
    bindRange($('#opacity'));

    $('#shadow').bind('change keyup', function() {
      var x = $('#shadow-x').val();
      var y = $('#shadow-y').val();
      var size = $('#shadow-size').val();
      var color = $('#shadow-color').val();
      var css = x + 'px ' + y + 'px ' + size + 'px #' + color;
      self.protoshop.onSelected('css',{'box-shadow': css});
    });

  }


  this.events['text'] = function() {

    $('#font-family').bind('change', function() {
      self.protoshop.onSelected('css',{'font-family': fonts[$(this).val()]});
    });
    $('#bold').bind('mousedown', function() {
      self.protoshop.onSelected('toggleBold');
    });
    $('#italic').bind('mousedown', function() {
      self.protoshop.onSelected('toggleItalic');
    });
    $('#underline').bind('mousedown', function() {
      self.protoshop.onSelected('toggleUnderline');
    });
    $('#align-left').bind('mousedown', function() {
      self.protoshop.onSelected('css',{'text-align': 'left'});
    });
    $('#align-center').bind('mousedown', function() {
      self.protoshop.onSelected('css',{'text-align': 'center'});
    });
    $('#align-right').bind('mousedown', function() {
      self.protoshop.onSelected('css',{'text-align': 'right'});
    });
    $('#align-justify').bind('mousedown', function() {
      self.protoshop.onSelected('css',{'text-align': 'justify'});
    });

    $('#text-shadow').bind('change keyup', function() {
      var x = $('#text-shadow-x').val();
      var y = $('#text-shadow-y').val();
      var size = $('#text-shadow-size').val();
      var color = $('#text-shadow-color').val();
      var css = x + 'px ' + y + 'px ' + size + 'px #' + color;
      self.protoshop.onSelected('css',{'text-shadow': css});
    });

    bindRange($('#font-size'));
    bindRange($('#line-height'));
    bindRange($('#letter-spacing'));

  }

  this.protoshop.$selection.bind('change', function(evt, data) {
    if (data.selected.length > 0) {
      self.render(['global', 'text', 'element']);
    } else {
      self.render(['global']);
    }
  });


  this.render = function(sections, selected) {

    var html = _.map(sections, function(section) {
      return self.tpls[section](selected);
    });

    $root.html(html.join(""));

    _.each(sections, function(section) {
      if (self.events[section]) {
        self.events[section]();
      }
    });

    $('.dropdown').each(bindDropDown);
    $('.picker').each(bindColour);
    $('.color').each(bindPlainColour);
  }


  function is_inside(obj, parent) {
    return ( obj == parent ) ||
      ( obj.parentNode != null && is_inside(obj.parentNode, parent) );
  }

  function bindPlainColour() {
    new jscolor.color(this, {pickerClosable:true});
  }

  function bindColour() {

    var picker = new jscolor.color(this, {
      pickerClosable:true,
      styleElement:null
    });

    $(this).bind('change', function() {
      var obj = {};
      obj[$(this).data('css')] = '#' + picker.toString();
      self.protoshop.onSelected('css', obj);
    });

  }


  function bindDropDown() {
    var $el = $(this);
    var $inner = $el.find('.inner');
    $(this).bind('mousedown', function() {
      if (!$inner.is(':visible')) {
        $el.addClass('active');
        self.protoshop.$canvas.unbind('mousedown.global');
        setTimeout(function() {
          $(document).bind('mousedown.range', function(e) {
            if (!(is_inside(e.target, $el[0]) ||
                  $(e.target).parent().hasClass('jscolor'))) {
              $(document).unbind('mousedown.range');
              $el.removeClass('active');
              self.protoshop.$canvas.bind('mousedown.global',
                                          self.protoshop.globalMouseDown);
            }
          });
        }, 0);
      }
    });
  }


  function bindRange($dom) {
    var $label = $dom.find('.label');
    $dom.bind('change keyup', function(e) {
      var tmp = {}, key = $(e.target).attr('data-css');
      tmp[key] = new Number(e.target.value).toFixed(1) + 'px';
      if (key === 'opacity') {
        tmp[key] = parseInt(tmp[key], 0) / 100;
      }
      $label.text(tmp[key]);
      self.protoshop.onSelected('css', tmp);
    });
  }


  this.render(['global', 'text', 'element']);

};

var protoshop = new Protoshop();
var toolbar = new Protoshop.Toolbar(protoshop);


