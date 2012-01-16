Trail.View.addShim('.color', function() {
  new jscolour.picker({$domValue: $(this), $domStyle: $(this)});
});


Trail.View.addShim('[type=angle]', function() {
  new jscolour.anglePicker({$domValue: $(this)});
});


Trail.View.addShim('.dropdown', function() {

  var $dropdown_wrapper = $(this);
  var $dropdown = $dropdown_wrapper.find('.inner');

  function hideDropdown(e) {

    var insidePicker = $(e.target).parents().hasClass('jscolour');

    if (!Utils.is_inside(e.target, $dropdown[0]) && !insidePicker) {
      jscolour.hide();
      $(document).unbind('mousedown.dropdown');
      $dropdown_wrapper.removeClass('active');
      window.protoshop.releaseFocus();
    }
  }

  $dropdown_wrapper.bind('mousedown', function(e) {

    if ($dropdown.is(':visible')) {
      return;
    }

    // Yeild to make sure the mousedown that gets bound isnt triggered from
    // here
    setTimeout(function() {
      $dropdown_wrapper.addClass('active');
      window.protoshop.grabFocus();
      $(document).bind('mousedown.dropdown', hideDropdown);
    }, 0);
  });

});


Trail.View.addShim('.picker', function() {

  var $value = $(this).find('.picker-value');
  var $preview = $(this).find('.picker-preview');

  var picker = new jscolour.picker({
    $wrapper: $(this).find('.picker-placeholder'),
    $domStyle: $preview,
    $domValue: $value
  });

  new jscolour.gradientPicker({
    $domValue: $value,
    $domStyle: $(this).find('.gradient-dom')
  });

  $value.bind('change', function() {
    var obj = {};
    obj[$(this).data('css')] = $value.val();
    self.protoshop.updateUsedColours();
    self.protoshop.onSelected('css', obj);
  });

});


Trail.View.addShim('.tabs', function() {

    var $dom = $(this);
    var selected = null;

    function select(tab) {

      $dom.find('.tab-link').removeClass('selected');
      $dom.find('.tab-link[data-target=' + tab + ']').addClass('selected');

      if (selected) {
        selected.hide();
      }
      selected = $dom.find('.' + tab);
      selected.css('display', 'block');
    }

    $dom.find('.tab-link').bind('mousedown select', function() {
      select($(this).data('target'));
    });

    select($dom.find('.tab-link:first').data('target'));

});


PickerWidget = Trail.View.extend({

  template: '#picker-tpl',

  create: function(colour) {

    var bg = Protoshop.Toolbar.getBGProperties(colour);

    return this.render({data: {
      pickerId: 'background-picker',
      bg: colour,
      bgRepeatX: bg.repeatX,
      bgRepeatY: bg.repeatY,
      bgPosX: bg.posX,
      bgPosY: bg.posY,
      bgColor: bg.colour,
      bgUrl: bg.url
    }});

  },

  postRender: function(dom) {

    function switchToTab(colour) {

      if (/gradient/.test(colour)) {
        $('[data-target=gradient-placeholder]', dom).trigger('select');
      } else if (/url/.test(colour)) {
        $('[data-target=image-placeholder]', dom).trigger('select');
      } else {
        $('[data-target=colour-placeholder]', dom).trigger('select');
      }
    }

    $('#used-colours', dom).bind('mousedown', function(e) {
      if ($(e.target).is('.used-colour')) {

        e.preventDefault();
        e.stopPropagation();

        var colour = $(e.target).data('background');
        var bg = Protoshop.Toolbar.getBGProperties(colour);

        $('.picker-value', dom).val(colour).trigger('change');
        window.protoshop.saveUndoPoint();

        $('#img-url', dom).val(bg.url);
        $('#img-color', dom).val(bg.colour);
        $('#img-top', dom).val(bg.posY);
        $('#img-left', dom).val(bg.posY);

        $('#repeat-x').attr('checked', bg.repeatX);
        $('#repeat-y').attr('checked', bg.repeatX);

        switchToTab(colour);
      }
    });

    $('.image-placeholder a', dom).bind('click', function(e) {
      var el = $(e.target);
      el.parent().find('input').val(el.text()).trigger('change');
    });

    $('.image-placeholder', dom).bind('change', function() {

      var colour = $('#img-color', dom).val();
      var url = colour + ' url(' + $('#img-url').val() + ') ' +
        ($('#img-left').val() || 0) + ' ' + ($('#img-top').val() || 0);

      var repeatx = $('#repeat-x').is(':checked');
      var repeaty = $('#repeat-y').is(':checked');

      if (!repeatx && !repeaty) {
        url += ' no-repeat';
      } else if (repeatx && !repeaty) {
        url += ' repeat-x';
      } else if (repeaty && !repeatx) {
        url += ' repeat-y';
      }

      $('.picker-value', dom).val(url).trigger('change');
    });

    switchToTab($('.picker-value', dom).val());

    return dom;
  }
});


GlobalView = Trail.View.extend({

  template: '#global-toolbar-tpl',

  updateOverlay: function(btn, visible) {
    if (!visible) {
      $('.grid-overlay:eq(0)').slideUp();
    } else {
      $('.grid-overlay:eq(0)').slideDown();
    }
    $(btn).toggleClass('active', visible);
  },

  postRender: function($dom, opts) {
    var self = this, prefix = window.protoshop.site_prefix;
    $('#toggle-grid', $dom).bind('mousedown', function(e) {
      localJSON.set(prefix + '-overlay', !localJSON.get(prefix + '-overlay', true));
      self.updateOverlay(this, localJSON.get(prefix + '-overlay'));
    });

    $('#overlay-form', $dom).bind('change input', function() {
      localJSON.set(prefix + '-grid', {
        width: parseInt($('#overlay-width', $dom).val(), 10),
        gutter: parseInt($('#overlay-gutter', $dom).val(), 10),
        colour: $('#overlay-colour', $dom).val(),
        opacity: parseFloat($('#overlay-opacity', $dom).val())
      });
      window.protoshop.deferredSaveUndoPoint('grid');
      window.protoshop.drawOverlay();
    });
    return $dom;
  },

  load: function() {
    return this.render({data: {
      overlay: localJSON.get(window.protoshop.site_prefix + '-grid'),
      isOverlay: localJSON.get(window.protoshop.site_prefix + '-overlay', true)
    }});
  }
});


BgView = Trail.View.extend({

  template: '#background-toolbar-tpl',

  postRender: function($dom) {

    var bg = localJSON.get(window.protoshop.site_prefix + '-bgColour', 'white');
    var picker = PickerWidget.create(bg);

    var placeholder = $dom.findAll('#picker-placeholder');
    placeholder.replaceWith(picker);

    $('.picker-value', picker).bind('change', function() {
      $('.picker-preview', picker).css('background',
                                       Utils.w3cGradient2Browser(this.value));

      window.protoshop.deferredSaveUndoPoint('bgColour');
      localJSON.set(window.protoshop.site_prefix + '-bgColour', this.value);
      window.protoshop.updateUsedColours();
      window.protoshop.redraw();
    });

    $('#canvas-width', $dom).bind('change input', function() {
      localJSON.set(window.protoshop.site_prefix + '-width', parseInt(this.value, 10));
      window.protoshop.redraw();
    });

    return $dom;
  },

  load: function() {
    return this.render({data: {
      canvasWidth: localJSON.get(window.protoshop.site_prefix + '-width', 1024)
    }});
  }
});


SelectView = Trail.View.extend({

  template: '#select-toolbar-tpl',

  postRender: function(dom) {
    $('#set-select-text', dom).bind('submit', function(e) {
      e.preventDefault();
      window.protoshop.onSelectedUndo('setSelectText', $('#select-text').val());
    });
    return dom;
  },

  load: function(obj) {
    return this.render({data: {
      'selectText': obj.$dom.find('option').text()
    }});
  }
});


ButtonView = Trail.View.extend({

  template: '#button-toolbar-tpl',

  postRender: function(dom) {
    $('#set-button-text', dom).bind('submit', function(e) {
      e.preventDefault();
      window.protoshop.onSelectedUndo('setButtonText', $('#button-text', dom).val());
    });
    return dom;
  },

  load: function(obj) {
    return this.render({data: {
      'buttonText': obj.$dom.find('input').val()
    }});
  }
});


ImgView = Trail.View.extend({

  template: '#img-toolbar-tpl',

  postRender: function(dom) {
    $('#set-image-src', dom).bind('submit', function(e) {
      e.preventDefault();
      window.protoshop.onSelectedUndo('setImage', $('#image-src').val());
    });
    return dom;
  },

  load: function(obj) {
    return this.render({data: {
      'backgroundImage': obj.$dom.find('img').attr('src')
    }});
  }
});

TextView = Trail.View.extend({

  template: '#text-toolbar-tpl',

  postRender: function(dom) {
    $('#lorum-ipsum', dom).bind('mousedown', function() {
      var selected = self.protoshop.selected[0].$dom;
      var clone = selected.clone().css('visibility', 'hidden').appendTo(document.body);
      var height = selected.height();
      var width = selected.width();
      var span = clone.find('span');
      var words = Utils.lorum_ipsum.slice();
      var acc = [];
      do {
        var t = words.shift();
        acc.push(t);
        span.text(acc.join(' '));
      } while(span.height() < height && span.width() < width);
      acc.pop();
      clone.remove();
      selected.find('span').text(acc.join(' '));
    });
    $('#font-family', dom).bind('change', function() {
      self.protoshop.onSelectedUndo('css',{
        'font-family': Protoshop.Toolbar.fonts[$(this).val()]
      });
    });
    $('#bold', dom).bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('toggleBold');
    });
    $('#italic', dom).bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('toggleItalic');
    });
    $('#underline', dom).bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('toggleUnderline');
    });
    $('#text-align-left', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('css',{'text-align': 'left'});
    });
    $('#text-align-center', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('css',{'text-align': 'center'});
    });
    $('#text-align-right', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('css',{'text-align': 'right'});
    });
    $('#align-justify', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelectedUndo('css',{'text-align': 'justify'});
    });

    $('#text-shadow', dom).bind('change keyup', function() {
      var distance = parseInt($('#text-shadow-distance', dom).val(), 10);
      var size = $('#text-shadow-size', dom).val();
      var angle = parseInt($('#text-shadow-angle', dom).val(), 10);
      var color = $('#text-shadow-color', dom).val();
      var xy = Protoshop.Toolbar.vector2xy(angle, distance);

      if (/^([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        color = '#' + color;
      }
      var css = xy.x + 'px ' + xy.y + 'px ' + size + 'px ' + color;
      self.protoshop.onSelectedUndo('css',{'text-shadow': css});
    });

    Protoshop.Toolbar.bindChange($('#font-size', dom));
    Protoshop.Toolbar.bindChange($('#line-height', dom));
    Protoshop.Toolbar.bindChange($('#letter-spacing', dom));
    return dom;
  },

  load: function(obj) {

    var dom = obj.$dom;
    var family = Utils.findKey(Protoshop.Toolbar.fonts, dom.css('font-family')) ||
      'helvetica';
    var align = dom.css('text-align');

    var data = {
      fontSize: parseInt(dom.css('font-size'), 0),
      lineHeight: parseInt(dom.css('line-height'), 0),
      letterSpacing: parseInt(dom.css('letter-spacing'), 0) || 0,
      isBold: /(bold|700)/.test(dom.css('font-weight')),
      isItalic: dom.css('font-style') === 'italic',
      isUnderline: dom.css('text-decoration') === 'underline',
      shadow: Protoshop.Toolbar.parseShadow(dom.css('text-shadow')),
      color: dom.css('color')
    };

    if ($.inArray(align, ['left', 'center', 'right', 'justify']) === -1) {
      align = 'left';
    }

    data['family-' + family] = true;
    data['align-' + align] = true;

    return this.render({data: data});
  }
});


DistributeElementView = Trail.View.extend({

  template: '#distribute-toolbar-tpl',

  postRender: function(dom) {

    function space(prop, dim) {

      var ps = window.protoshop;
      var count = ps.selected.length;
      var gap = 0;
      var a, b, $a, i;

      ps.selected.sort(function(a, b) {
        return parseInt(a.$dom.css(prop), 10) > parseInt(b.$dom.css(prop), 10);
      });

      for (i = 0; i < count - 1; i++) {
        a = ps.selected[i].$dom;
        b = ps.selected[i+1].$dom;
        gap += parseInt(b.css(prop), 10) - (parseInt(a.css(prop), 10) + a[dim]());
      }

      if (gap > 0) {
        var diff = Math.ceil(gap / (count - 1));
        for (i = 0; i < count - 1; i++) {
          $a = ps.selected[i].$dom;
          var obj = {};
          obj[prop] = parseInt($a.css(prop), 10) + $a[dim]() + diff;
          ps.selected[i+1].css(obj);
        }
      }

      ps.updateInfo();
    }

    $('#distribute-horizontal', dom).bind('mousedown', function() {
      space('left', 'width');
    });
    $('#distribute-vertical', dom).bind('mousedown', function() {
      space('top', 'height');
    });

    return dom;
  },

  load: function(obj) {
    return this.render();
  }

});


MultipleElementView = Trail.View.extend({

  template: '#multiple-toolbar-tpl',

  postRender: function(dom) {
    $('button', dom).bind('mousedown', function(e) {

      var ps = window.protoshop;
      var align = $(e.target).data('align');
      var bounds = ps.calculateSelectionBounds();
      var yMid = (bounds.nw.y + bounds.se.y) / 2;
      var xMid = (bounds.nw.x + bounds.se.x) / 2;

      if (align === 'top') {
        ps.onSelectedUndo('css', {top: bounds.nw.y});
      } else if (align === 'left') {
        ps.onSelectedUndo('css', {left: bounds.nw.x});
      } else {
        _.each(ps.selected, function(obj) {
          if (align === 'bottom') {
            ps.onSelectedUndo('css', {top: bounds.se.y - obj.$dom.height()});
          } else if (align === 'right') {
            ps.onSelectedUndo('css', {left: bounds.se.x - obj.$dom.width()});
          } else if (align === 'center') {
            ps.onSelectedUndo('css', {left: xMid - (obj.$dom.width() / 2)});
          } else if (align === 'middle') {
            ps.onSelectedUndo('css', {top: yMid - (obj.$dom.height() / 2)});
          }
        });
      }
      ps.updateInfo();
    });
    return dom;
  },

  load: function(obj) {
    return this.render();
  }

});


SingleElementView = Trail.View.extend({

  template: '#single-toolbar-tpl',

  postRender: function(dom) {
    $('#css-form', dom).bind('submit', function(e) {
      e.preventDefault();
      window.protoshop.onSelectedUndo('attr', 'style', $('#css-value').val());
    });
    return dom;
  },

  load: function(obj) {
    return this.render({data: {
      cssValue: obj.$dom[0].style.cssText.split('; ').join(';\n')
    }});
  }

});

ElementView = Trail.View.extend({

  template: '#textandblock-toolbar-tpl',

  postRender: function(dom) {

    $('#border-radius-value', dom).bind('change input', function(e) {
      var key = $('#border-radius-picked', dom).val() === 'all' ? 'border-radius' :
        'border-' + $('#border-radius-picked', dom).val() + '-radius';

      var data = {};
      data[key] = this.value + 'px';

      window.protoshop.onSelectedUndo('css', data);

    });

    $('#border-picker', dom).bind('change input', function(e) {

      if ($(e.target).is('#border-picked')) {
        return;
      }

      var val = $('#border-width', dom).val() + 'px ' +
        $('#border-style', dom).val() + ' ' +
        $('#border-colour', dom).val();

      var key = $('#border-picked', dom).val() === 'all' ? 'border' :
        'border-' + $('#border-picked', dom).val();

      var data = {};
      data[key] = val;

      window.protoshop.onSelectedUndo('css', data);
    });

    $('#bring-to-front', dom).bind('mousedown', function() {
      window.protoshop.onSelectedUndo('css', {'z-index': ++window.protoshop.index.max});
    });
    $('#send-to-back', dom).bind('mousedown', function() {
      window.protoshop.onSelectedUndo('css', {'z-index': --window.protoshop.index.min});
    });

    $('#lock', dom).bind('mousedown', function() {
      window.protoshop.onSelectedUndo('lock');
      window.protoshop.selectElement(null);
    });

    Protoshop.Toolbar.bindChange($('#opacity', dom));

    $('#shadow', dom).bind('change keyup', function() {

      var distance = parseInt($('#shadow-distance', dom).val(), 10);
      var size = $('#shadow-size', dom).val();
      var angle = parseInt($('#shadow-angle', dom).val(), 10);
      var color = $('#shadow-color', dom).val();
      var xy = Protoshop.Toolbar.vector2xy(angle, distance);

      if (/^([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        color = '#' + color;
      }

      var css = xy.x + 'px ' + xy.y + 'px ' + size + 'px ' + color;
      window.protoshop.onSelectedUndo('css',{'box-shadow': css});
    });

    var placeholder = $('#bg-picker-placeholder', dom);
    var picker = PickerWidget.create(placeholder.data('background'));

    placeholder.replaceWith(picker);

    $('.picker-value', picker).bind('change', function() {
      var colour = Utils.w3cGradient2Browser(this.value);
      $('.picker-preview', picker).css('background', colour);
      window.protoshop.onSelectedUndo('css', {'background': colour});
      window.protoshop.updateUsedColours();
    }).val(placeholder.data('background'));

    return dom;
  },

  load: function(obj) {
    var dom = obj.$dom;
    var data = {
      borderRadius: parseInt(dom.css('borderTopLeftRadius'), 0),
      borderWidth: parseInt(dom.css('border-top-width'), 0),
      opacity: parseFloat(dom.css('opacity'), 0).toFixed(2),
      shadow: Protoshop.Toolbar.parseShadow(dom.css('box-shadow')),
      backgroundColor: Utils.readBackground(dom[0]),
      borderColor: 'transparent'
    };

    if (data.borderWidth > 0) {
      data.borderColor = dom.css('borderTopColor');
    }

    return this.render({data: data});
  }
});


Protoshop.Toolbar = function(protoshop) {

  var self = this;

  this.protoshop = protoshop;
  this.sections = [];

  function areAll(arr, type) {
    return _.all(arr, function(x) {
      return x instanceof type;
    });
  }


  function pickSections(arr) {

    var sections;

    if (arr.length < 1) {
      return [GlobalView, BgView];
    } else if (areAll(arr, Elements.SelectElement)) {
      sections = [GlobalView, SelectView];
    } else if (areAll(arr, Elements.ButtonElement)) {
      sections = [GlobalView, ButtonView];
    } else if (areAll(arr, Elements.ImgElement)) {
      sections = [GlobalView, ImgView];
    } else if (areAll(arr, Elements.TextElement)) {
      sections = [GlobalView, TextView];
    } else if (areAll(arr, Elements.BlockElement)) {
      sections = [GlobalView, ElementView];
    } else {
      sections = [GlobalView, ElementView];
    }

    if (arr.length === 1) {
      sections.push(SingleElementView);
    } else if (arr.length > 1) {
      sections.push(MultipleElementView);
    }

    if (arr.length > 2) {
      sections.push(DistributeElementView);
    }

    return sections;
  }


  this.refresh = function() {
    self.render(self.sections, data);
  };


  this.render = function(sections, args) {

    var picked = (args && args.selected && args.selected.length > 0) ?
      args.selected[0] : false;

    var $el = $('#top-bar-inner').empty();
    _.each(sections, function(section) {
      $el.append(section.load(picked));
    });

    self.protoshop.updateUsedColours();
  };


  this.protoshop.$selection.bind('change', function(evt, data) {
    self.sections = pickSections(data.selected);
    self.render(self.sections, data);
  });

  protoshop.$selection.trigger('change', {
    selected: protoshop.selected
  });

};

Protoshop.Toolbar.bindChange = function($dom) {
  var key = $dom.attr('data-css');
  $dom.bind('change input', function() {
    var obj = {};
    obj[key] = this.value + 'px';
    if (key === 'opacity') {
      obj[key] = Number(parseFloat(obj[key], 10)).toFixed(2);
    }
    window.protoshop.onSelectedUndo('css', obj);
  });
};

// TODO: Major major ugly
Protoshop.Toolbar.parseShadow = function(text) {

  var parts = text.split(" ");

  if (parts.length < 1) {
    return false;
  }

  var x = parseInt(parts[3], 10) || 0;
  var y = parseInt(parts[4], 10) || 0;
  var colour = [parts[0], parts[1], parts[2]].join('');

  return $.extend(Protoshop.Toolbar.xy2vector(x, y), {
    x: x,
    y: y,
    size: parseInt(parts[5], 10) || 0,
    colour: colour
  });
};

Protoshop.Toolbar.vector2xy = function(angle, distance) {

  angle -= 270;

  if (angle < 0) {
    angle = 360 + angle;
  }

  return {
    x: Math.round(distance * Math.cos(angle * (Math.PI/180))),
    y: Math.round(distance * Math.sin(angle * (Math.PI/180)))
  };

};

Protoshop.Toolbar.xy2vector = function(x, y) {

  var distance = Math.sqrt((x * x) + (y * y));

  return {
    angle: Math.round(Math.atan2(x, -y) * (180 / Math.PI)) + 180,
    distance: distance
  };
};

Protoshop.Toolbar.getBGProperties = function(colour) {

  colour = colour === 'initial' ? 'transparent' : Utils.w3cGradient2Browser(colour);
  var style = $('<div />').css('background', colour)[0].style;

  var bgRepeatX = false;
  var bgRepeatY = false;

  var backgroundImage = style.getPropertyValue('background-image');
  if (/url/.test(backgroundImage)) {
    backgroundImage = backgroundImage.replace(/url\(/, '').replace(/\)/, '')
      .replace(/"/g, '');
  } else {
    backgroundImage = '';
  }

  var repeat = style.getPropertyValue('background-repeat');
  if (repeat === 'repeat') {
    bgRepeatY = bgRepeatX = true;
  } else if (repeat === 'repeat-y') {
    bgRepeatY = true;
  } else if (repeat === 'repeat-x') {
    bgRepeatX = true;
  }

  var bgColour = style.getPropertyValue('background-color');

  if (bgColour === 'initial') {
    bgColour = 'transparent';
  }

  var position = (style.getPropertyValue('background-position') || '0 0').split(' ');

  return {
    colour: bgColour,
    url: backgroundImage,
    posX: position[0],
    posY: position[1],
    repeatX: bgRepeatX,
    repeatY: bgRepeatY
  };
};

Protoshop.Toolbar.fonts = {
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
