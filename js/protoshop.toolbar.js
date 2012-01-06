$.fn.findAll = function(selector) {
  return this.find(selector).add(this.filter(selector));
};

// This shouldnt be a monolithic function, its just the ability to add a global
// shim function to all rendered templates
Trail.View.shim = function(dom) {

  dom.findAll('.color').each(function() {

    if ($(this).data('processed-color')) {
      return;
    }
    $(this).data('processed-color', true);
    new jscolour.picker({$domValue: $(this), $domStyle: $(this)});
  });

  dom.findAll('[type=angle]').each(function() {

    if ($(this).data('processed-angle')) {
      return;
    }
    $(this).data('processed-angle', true);

    new jscolour.anglePicker({$domValue: $(this)});
  });

  dom.findAll('.dropdown').each(function() {

    if ($(this).data('processed-dropdown')) {
      return;
    }
    $(this).data('processed-dropdown', true);

    var $el = $(this);
    var $inner = $el.find('.inner');
    $(this).bind('mousedown', function() {
      if (!$inner.is(':visible')) {
        $el.addClass('active');
        window.protoshop.$canvas_wrapper.unbind('mousedown.global');
        setTimeout(function() {
          $(document).bind('mousedown.range', function(e) {
            if (!(Utils.is_inside(e.target, $el[0]) ||
                  $(e.target).parents().hasClass('jscolour'))) {
              jscolour.hide();
              $(document).unbind('mousedown.range');
              $el.removeClass('active');
              window.protoshop.$canvas_wrapper
                .bind('mousedown.global', window.protoshop.globalMouseDown);
            }
          });
        }, 0);
      }
    });
  });

  dom.findAll('.picker').each(function() {

    if ($(this).data('processed-picker')) {
      return;
    }
    $(this).data('processed-picker', true);

    var $value = $(this).find('.picker-value');
    var $preview = $(this).find('.picker-preview');

    //$preview.css('background-color', '#' + $value.val());

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

  dom.findAll('.tabs').each(function() {

    if ($(this).data('processed-tabs')) {
      return;
    }
    $(this).data('processed-tabs', true);

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
};


PickerWidget = Trail.View.extend({

  template: '#picker-tpl',
  postRender: function(dom) {

    function switchToTab(colour) {
      if (/gradient/.test(colour)) {
        $('[data-target=gradient-placeholder]', dom).trigger('select');
      } else if (/image/.test(colour)) {
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
        switchToTab(colour);
        $('.picker-value', dom).val(colour).trigger('change');
      }
    });

    $('.image-placeholder a', dom).bind('click', function(e) {
      var el = $(e.target);
      el.parent().find('input').val(el.text()).trigger('change');
    });

    $('.image-placeholder', dom).bind('change', function() {

      var colour = $('#img-color', dom).val();
      var url = colour + ' url(' + $('#img-url').val() + ') ' +
        ($('#img-top').val() || 0) + ' ' + ($('#img-left').val() || 0);

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
      $('#grid-overlay').slideUp();
    } else {
      $('#grid-overlay').slideDown();
    }
    $(btn).toggleClass('active');
  },

  postRender: function($dom, opts) {
    var self = this, prefix = window.protoshop.site_prefix + '-overlay';
    $('#toggle-grid', $dom).bind('mousedown', function(e) {
      localJSON.set(prefix, !localJSON.get(prefix));
      self.updateOverlay(this, localJSON.get(prefix));
    });
    return $dom;
  },

  load: function() {
    return this.render({data: {
      isOverlay: $('#grid-overlay').is(':visible')
    }});
  }
});


BgView = Trail.View.extend({

  template: '#background-toolbar-tpl',

  postRender: function($dom) {

    var bg = localJSON.get(window.protoshop.site_prefix + '-bgColour', 'white');
    var style = $('<div />').css('background', bg)[0].style;
    var picker = PickerWidget.render({data: {
      pickerId: 'background-picker',
      background: bg,
      backgroundRepeatX: style['background-repeat-x'] === 'repeat',
      backgroundRepeatY: style['background-repeat-y'] === 'repeat',
      backgroundPosX: style['background-position-x'],
      backgroundPosY: style['background-position-y'],
      backgroundColor: style['background-color'],
      backgroundUrl: style['background-image'].replace(/url\(/, '').replace(/\)/, '')
    }});

    $('.picker-value', picker).bind('change', function() {
      $('.picker-preview', picker).css('background', this.value);
      localJSON.set(window.protoshop.site_prefix + '-bgColour', this.value);
      window.protoshop.updateUsedColours();
      window.protoshop.redraw();
    });

    return picker;
  },

  load: function() {
    return this.render();
  }
});


SelectView = Trail.View.extend({

  template: '#select-toolbar-tpl',

  postRender: function(dom) {
    $('#set-select-text', dom).bind('submit', function(e) {
      e.preventDefault();
      window.protoshop.onSelected('setSelectText', $('#select-text').val());
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
      window.protoshop.onSelected('setButtonText', $('#button-text', dom).val());
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
      window.protoshop.onSelected('setImage', $('#image-src').val());
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
    $('#font-family', dom).bind('change', function() {
      self.protoshop.onSelected('css',{'font-family': Protoshop.Toolbar.fonts[$(this).val()]});
    });
    $('#bold', dom).bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelected('toggleBold');
    });
    $('#italic', dom).bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelected('toggleItalic');
    });
    $('#underline', dom).bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelected('toggleUnderline');
    });
    $('#align-left', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'left'});
    });
    $('#align-center', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'center'});
    });
    $('#align-right', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'right'});
    });
    $('#align-justify', dom).bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'justify'});
    });

    $('#text-shadow', dom).bind('change keyup', function() {
      var distance = $('#text-shadow-distance', dom).val();
      var size = $('#text-shadow-size', dom).val();
      var angle = $('#text-shadow-angle', dom).val() - 90;
      var color = $('#text-shadow-color', dom).val();

      if (angle < 0) {
        angle = 360 + angle;
      }

      var x = Math.round(distance * Math.cos(angle * (Math.PI/180)));
      var y = Math.round(distance * Math.sin(angle * (Math.PI/180)));

      if (/^([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        color = '#' + color;
      }
      var css = x + 'px ' + y + 'px ' + size + 'px ' + color;
      self.protoshop.onSelected('css',{'text-shadow': css});
    });

    Protoshop.Toolbar.bindChange($('#font-size', dom));
    Protoshop.Toolbar.bindChange($('#line-height', dom));
    Protoshop.Toolbar.bindChange($('#letter-spacing', dom));
    return dom;
  },

  load: function(obj) {

    var dom = obj.$dom;
    var family = Utils.findKey(Protoshop.Toolbar.fonts, dom.css('font-family')) || 'helvetica';
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

SingleElementView = Trail.View.extend({

  template: '#single-toolbar-tpl',

  postRender: function(dom) {
    $('#css-form', dom).bind('submit', function(e) {
      e.preventDefault();
      window.protoshop.onSelected('attr', 'style', $('#css-value').val());
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

    $('#bring-to-front', dom).bind('mousedown', function() {
      window.protoshop.onSelected('css', {'z-index': ++window.protoshop.index.max});
    });
    $('#send-to-back', dom).bind('mousedown', function() {
      window.protoshop.onSelected('css', {'z-index': --window.protoshop.index.min});
    });

    $('#lock', dom).bind('mousedown', function() {
      window.protoshop.onSelected('lock');
      window.protoshop.selectElement(null);
    });

    Protoshop.Toolbar.bindChange($('#border-width', dom));
    Protoshop.Toolbar.bindChange($('#border-radius', dom));
    Protoshop.Toolbar.bindChange($('#opacity', dom));

    $('#shadow', dom).bind('change keyup', function() {

      var distance = $('#shadow-distance', dom).val();
      var size = $('#shadow-size', dom).val();
      var angle = $('#shadow-angle', dom).val() - 90;
      var color = $('#shadow-color', dom).val();

      if (angle < 0) {
        angle = 360 + angle;
      }

      var x = Math.round(distance * Math.cos(angle * (Math.PI/180)));
      var y = Math.round(distance * Math.sin(angle * (Math.PI/180)));

      if (/^([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        color = '#' + color;
      }

      var css = x + 'px ' + y + 'px ' + size + 'px ' + color;
      window.protoshop.onSelected('css',{'box-shadow': css});
    });

    var placeholder = $('#bg-picker-placeholder', dom);

    var style = $('<div />')
      .css('background', placeholder.data('background'))[0].style;

    var picker = PickerWidget.render({data: {
      pickerId: 'bg-picker',
      background: placeholder.data('background'),
      backgroundRepeatX: style['background-repeat-x'] === 'repeat',
      backgroundRepeatY: style['background-repeat-y'] === 'repeat',
      backgroundPosX: style['background-position-x'],
      backgroundPosY: style['background-position-y'],
      backgroundColor: style['background-color'],
      backgroundUrl: style['background-image'].replace(/url\(/, '').replace(/\)/, '')
    }});

    placeholder.replaceWith(picker);

    $('.picker-value', picker).bind('change', function() {
      $('.picker-preview', picker).css('background', this.value);
      window.protoshop.onSelected('css', {'background': this.value});
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

    if (obj.borderWidth > 0) {
      obj.borderColor = dom.css('borderTopColor');
    }

    return this.render({data: data});
  }
});


Protoshop.Toolbar = function(protoshop) {

  var self = this;
  this.protoshop = protoshop;


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
    }

    return sections;
  }


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
    var sections = pickSections(data.selected);
    self.render(sections, data);
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
    window.protoshop.onSelected('css', obj);
  });
}

// TODO: Major major ugly
Protoshop.Toolbar.parseShadow = function(text) {

  var parts = text.split(" ");

  if (parts.length < 1) {
    return false;
  }

  var x = parseInt(parts[3], 10) || 0;
  var y = parseInt(parts[4], 10) || 0
  var colour = [parts[0], parts[1], parts[2]].join('');
  var distance = Math.sqrt((x * x) + (y * y));
  var angle = Math.round(Math.acos (y / distance) * (180 / Math.PI)) - 180;

  if (angle < 0) {
    angle = 360 + angle;
  }

  return {
    x: x,
    y: y,
    distance: distance,
    angle: angle,
    size: parseInt(parts[5], 10) || 0,
    colour: colour
  };
}

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
