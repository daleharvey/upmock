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
    'element': Handlebars.compile($('#textandblock-toolbar-tpl').html()),
    'img': Handlebars.compile($('#img-toolbar-tpl').html()),
    'button': Handlebars.compile($('#button-toolbar-tpl').html()),
    'select': Handlebars.compile($('#select-toolbar-tpl').html())
  };

  this.events = {};
  this.data = {};

  this.events.select = function() {
    $('#set-select-text').bind('submit', function(e) {
      e.preventDefault();
      self.protoshop.onSelected('setSelectText', $('#select-text').val());
    });
  };

  this.events.button = function() {
    $('#set-button-text').bind('submit', function(e) {
      e.preventDefault();
      self.protoshop.onSelected('setButtonText', $('#button-text').val());
    });
  };

  this.events.img = function() {
    $('#set-image-src').bind('submit', function(e) {
      e.preventDefault();
      self.protoshop.onSelected('setImage', $('#image-src').val());
    });
  };


  this.events.global = function() {
    $('#toggle-grid').bind('mousedown', function(e) {
      if ($('#grid-overlay').is(":visible")) {
        localStorage.overlay = false;
        $('#grid-overlay').slideUp();
      } else {
        localStorage.overlay = true;
        $('#grid-overlay').slideDown();
      }
      $(this).toggleClass('active');
    });
  };


  this.events.element = function() {

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

    bindChange($('#border-width'));
    bindChange($('#border-radius'));
    bindChange($('#opacity'));

    $('#shadow').bind('change keyup', function() {
      var x = $('#shadow-x').val();
      var y = $('#shadow-y').val();
      var size = $('#shadow-size').val();
      var color = $('#shadow-color').val();
      var css = x + 'px ' + y + 'px ' + size + 'px #' + color;
      self.protoshop.onSelected('css',{'box-shadow': css});
    });

  };


  this.events.text = function() {

    $('#font-family').bind('change', function() {
      self.protoshop.onSelected('css',{'font-family': fonts[$(this).val()]});
    });
    $('#bold').bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelected('toggleBold');
    });
    $('#italic').bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelected('toggleItalic');
    });
    $('#underline').bind('mousedown', function() {
      $(this).toggleClass('active');
      self.protoshop.onSelected('toggleUnderline');
    });
    $('#align-left').bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'left'});
    });
    $('#align-center').bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'center'});
    });
    $('#align-right').bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
      self.protoshop.onSelected('css',{'text-align': 'right'});
    });
    $('#align-justify').bind('mousedown', function() {
      $('.align').removeClass('active');
      $(this).toggleClass('active');
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

    bindChange($('#font-size'));
    bindChange($('#line-height'));
    bindChange($('#letter-spacing'));

  };

  function parseRBG(text) {
    var parts = text.split(" ");
    return rgbToHex(parts[0].slice(4), parseInt(parts[1], 10), parseInt(parts[2], 10));
  }

  // TODO: Major major ugly
  function parseShadow(text) {

    var parts = text.split(" ");

    if (parts.length < 1) {
      return false;
    }

    return {
      x: parseInt(parts[3], 10) || 0,
      y: parseInt(parts[4], 10) || 0,
      size: parseInt(parts[5], 10) || 0,
      colour: rgbToHex(parts[0].slice(4), parseInt(parts[1], 10), parseInt(parts[2], 10))
    };
  }

  this.data.button = function(obj) {
    return {'buttonText': obj.$dom.find('input').val()};
  };


  this.data.select = function(obj) {
    return {'selectText': obj.$dom.find('option').text()};
  };


  this.data.img = function(obj) {
    return {'backgroundImage': obj.$dom.find('img').attr('src')};
  };


  this.data.global = function(obj) {
    return {isOverlay: $('#grid-overlay').is(':visible')};
  };

  this.data.element = function(obj) {
    var dom = obj.$dom;
    var obj = {
      borderRadius: parseInt(dom.css('borderTopLeftRadius'), 0),
      borderWidth: parseInt(dom.css('border-top-width'), 0),
      opacity: parseFloat(dom.css('opacity'), 0).toFixed(2),
      shadow: parseShadow(dom.css('box-shadow')),
      backgroundColor: parseRBG(dom.css('background-color')),
      borderColor: 'transparent'
    };

    if (obj.borderWidth > 0) {
      obj.borderColor = parseRBG(dom.css('borderTopColor'));
    }

    return obj;
  };

  this.data.text = function(obj) {
    var dom = obj.$dom;
    var family = findKey(fonts, dom.css('font-family')) || 'helvetica';
    var align = dom.css('text-align');
    var obj = {
      fontSize: parseInt(dom.css('font-size'), 0),
      lineHeight: parseInt(dom.css('line-height'), 0),
      letterSpacing: parseInt(dom.css('letter-spacing'), 0) || 0,
      isBold: /(bold|700)/.test(dom.css('font-weight')),
      isItalic: dom.css('font-style') === 'italic',
      isUnderline: dom.css('text-decoration') === 'underline',
      shadow: parseShadow(dom.css('text-shadow')),
      color: parseRBG(dom.css('color'))
    };

    if ($.inArray(align, ['left', 'center', 'right', 'justify']) === -1) {
      align = 'left';
    }

    obj['family-' + family] = true;
    obj['align-' + align] = true;

    return obj;
  };


  function rgbToHex(R,G,B) {
    return toHex(R)+toHex(G)+toHex(B);
  }

  function toHex(n) {
    n = parseInt(n,10);
    if (isNaN(n)) return "00";
    n = Math.max(0,Math.min(n,255));
    return "0123456789ABCDEF".charAt((n-n%16)/16) +
      "0123456789ABCDEF".charAt(n%16);
  }


  function findKey(obj, val) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (obj[prop] === val) {
          return prop;
        }
      }
    }
    return false;
  }


  this.protoshop.$selection.bind('change', function(evt, data) {

    if (data.selected.length < 1) {
      return self.render(['global'], data);
    }

    if (_.all(data.selected, function(x) { return x instanceof Elements.SelectElement; })) {
      return self.render(['global', 'select'], data);
    }

    if (_.all(data.selected, function(x) { return x instanceof Elements.ButtonElement; })) {
      return self.render(['global', 'button'], data);
    }

    if (_.all(data.selected, function(x) { return x instanceof Elements.ImgElement; })) {
      return self.render(['global', 'img'], data);
    }

    if (_.all(data.selected, function(x) { return x instanceof Elements.TextElement; })) {
      return self.render(['global', 'text'], data);
    }

    if (_.all(data.selected, function(x) { return x instanceof Elements.BlockElement; })) {
      return self.render(['global', 'element'], data);
    }

    self.render(['global', 'element'], data);

  });


  this.render = function(sections, args) {

    var picked = (args && args.selected && args.selected.length > 0) ?
      args.selected[0] : false;

    var html = _.map(sections, function(section) {
      var data = self.data[section](picked);
      return self.tpls[section](data);
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

  };


  function is_inside(obj, parent) {
    return ( obj == parent ) ||
      ( obj.parentNode !== null && is_inside(obj.parentNode, parent) );
  }

  function bindPlainColour() {
    new jscolor.color(this, {pickerClosable:true});
  }

  function bindColour() {

    var $preview = $('<div class="picker-preview"></div>')
      .css('background-color', '#' + this.value);

    var picker = new jscolor.color(this, {
      pickerClosable: true,
      styleElement: null
    });

    $(this).wrap('<div class="picker-wrapper"></div>')
      .after($preview);

    $(this).bind('change', function() {
      var obj = {};
      obj[$(this).data('css')] = '#' + picker.toString();
      $preview.css('background-color', '#' + picker.toString());
      self.protoshop.onSelected('css', obj);
    });

  }


  function bindChange($dom) {
    var key = $dom.attr('data-css');
    $dom.bind('change input', function() {
      var obj = {};
      obj[key] = this.value + 'px';
      if (key === 'opacity') {
        obj[key] = Number(parseFloat(obj[key], 10)).toFixed(2);
      }
      self.protoshop.onSelected('css', obj);
    });
  }


  function bindDropDown() {
    var $el = $(this);
    var $inner = $el.find('.inner');
    $(this).bind('mousedown', function() {
      if (!$inner.is(':visible')) {
        $el.addClass('active');
        self.protoshop.$canvas_wrapper.unbind('mousedown.global');
        setTimeout(function() {
          $(document).bind('mousedown.range', function(e) {
            if (!(is_inside(e.target, $el[0]) ||
                  $(e.target).parent().hasClass('jscolor'))) {
              $(document).unbind('mousedown.range');
              $el.removeClass('active');
              self.protoshop.$canvas_wrapper.bind('mousedown.global',
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
      tmp[key] = e.target.value + 'px';
      if (key === 'opacity') {
        tmp[key] = Number(parseFloat(tmp[key], 10)).toFixed(2);
      }
      $label.text(tmp[key]);
      self.protoshop.onSelected('css', tmp);
    });
  }

  protoshop.$selection.trigger('change', {selected: protoshop.selected});

};
