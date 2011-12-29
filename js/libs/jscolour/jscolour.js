var jscolour = (function() {

  var pickerImg = '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';

  var pickerCSS = '<style>' +
    '.jscolour{ background:#EEE; border:1px solid #999; width:220px; z-index: 9000; text-indent: 0px; margin: 0 10px; }' +
    '.jscolour { padding:10px; position:absolute; }' +
    '.jscolour .hv{ width:20px; height:100px; float:right; }' +
    '.jscolour .wrapper { overflow:visible; position:relative; }' +
    '.jscolour .close { margin-top:10px; }' +
    '.jscolour .pointer { position:absolute; right:25px; top:0px; width:0px; ' +
    'height: 0px; border-top: 6px solid transparent; ' +
    'border-bottom: 6px solid transparent; border-left: 6px solid black; }' +
    '</style>';

  var pickerHTML = '<div class="jscolour"><div class="wrapper">' +
    '<img src="data:image/png;base64,' + pickerImg + '" class="hs" />' +
    '<canvas class="hv"></canvas>' +
    '<div class="pointer"></div></div>' +
    '<input type="button" class="close" value="close" />' +
    '</div>';

  var $globalPicker = $(pickerHTML).hide();
  $(document.body).append($globalPicker);
  $(document.body).append(pickerCSS);

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');

  var defaultOpts = {};
  var activePicker;
  var pickerWidth, pickerHeight = 100, slideWidth = 20;

  var img = new Image();

  img.onload = function() {

    pickerHeight = canvas.height = img.height;
    pickerWidth = canvas.width = img.width;
    ctx.drawImage(img, 0, 0);

  };
  img.src = 'data:image/png;base64,' + pickerImg;

  function hide() {
    if (activePicker) {
      activePicker.hide();
    }
  }

  // This is ugly and likely to break, canvas items need their dimensions set
  // if its set async then the clones items wont have it set correctly
  var tmp = $globalPicker.find('.hv')[0];
  tmp.height = pickerHeight;
  tmp.width = slideWidth;

  $globalPicker.find('.close').bind('mousedown', function() {
    activePicker.hide();
  });

  $globalPicker.find('.hs').bind('mousedown', function(e) {
    activePicker.hsMouseDown(e, $globalPicker.find('.hs')[0]);
  });
  $globalPicker.find('.hv').bind('mousedown', function(e) {
    activePicker.hvMouseDown(e, $globalPicker.find('.hv')[0]);
  });

  var picker = function(pickerOpts) {

    var self = this;
    var opts = $.extend({}, defaultOpts, pickerOpts);
    var standalone = typeof opts.$wrapper !== 'undefined';
    var $dom = standalone ? opts.$wrapper : $globalPicker;
    var yVal = 0;

    function bound(x, y, width, height) {
      return {
        x: Math.max(Math.min(x, width-1), 0),
        y: Math.max(Math.min(y, height-1), 0)
      };
    }

    function bindMove(e, callback, obj) {
      e.preventDefault();
      var f = function(e) {
        if (e.target === obj) {
          self[callback](e);
        }
      };
      $(document.body).bind('mousemove', f);
      $(document.body).bind('mouseup', function() {
        $(document.body).unbind('mousemove', f);
      });
      self[callback](e);
    }

    function drawGradient(ctx, colour) {
      var linear = ctx.createLinearGradient(0, 0, 20, 100);
      linear.addColorStop(0, colour);
      linear.addColorStop(1, 'black');
      ctx.fillStyle = linear;
      ctx.fillRect(0, 0, 20, 100);
    }

    function createRGB(pixel) {
      return 'rgb(' + pixel[0] + ',' + pixel[1] + ', ' + pixel[2] + ')';
    }

    this.show = function() {
      activePicker = self;
      var position = opts.$domValue.offset();
      $globalPicker.css({
        left: position.left,
        top: position.top + opts.$domValue.height() + 10
      });

      $globalPicker.show();
    };

    this.hide = function() {
      $globalPicker.hide();
    };

    this.hsMouseMove = function(e) {
      var pix = bound(e.offsetX, e.offsetY, pickerWidth, pickerHeight);
      var data = ctx.getImageData(pix.x, pix.y, pickerWidth, pickerHeight).data;
      var colour = createRGB(data);
      drawGradient(self.slideCtx, colour);
      self.hasChanged();
    };

    this.hvMouseMove = function(e) {
      yVal = bound(e.offsetX, e.offsetY, pickerWidth, pickerHeight).y;
      self.pointer.css('top', yVal - 5);
      self.hasChanged();
    };

    this.hasChanged = function() {
      var data = self.slideCtx.getImageData(10, yVal, slideWidth, pickerHeight).data;
      var colour = createRGB(data);
      opts.$domValue.val(colour);
      opts.$domStyle.css('background-color', colour);
      opts.$domValue.trigger('change');
    };

    this.hsMouseDown = function(e, obj) {
      bindMove(e, 'hsMouseMove', obj);
    };
    this.hvMouseDown = function(e, obj) {
      bindMove(e, 'hvMouseMove', obj);
    };

    if (standalone) {
      var $clone = $globalPicker.clone().css({position: 'relative', top: 0, left: 0});
      $clone.find('.close').remove();
      $clone.find('.hs').bind('mousedown', function(e) {
        self.hsMouseDown(e, $clone.find('.hs')[0]);
      });
      $clone.find('.hv').bind('mousedown', function(e) {
        self.hvMouseDown(e, $clone.find('.hv')[0]);
      });
      opts.$wrapper.append($clone.show());
    } else {
      opts.$domValue.bind('focus', self.show);
    }

    self.slideCtx = $dom.find('.hv')[0].getContext('2d');
    self.pointer = $dom.find('.pointer');
    self.pointer.css('top', self.y - 5);

    var initColour = /(gradient|url)/.test(opts.$domValue.val()) ? 'white' : opts.$domValue.val() || 'white';
    drawGradient(self.slideCtx, initColour);
  };

  var bindAll = function() {
    $('input[type=color]').each(function() {
      new picker({$domStyle: $(this), $domValue: $(this)});
    });
  };

  return {
    picker: picker,
    bindAll: bindAll,
    hide: hide
  };
})();


// jscolour.bindAll();

// var test = new jscolour.picker({
//   $wrapper: $('#wrapper'),
//   $domStyle: $('#preview'),
//   $domValue: $('#preview')
// });

// var test2 = new jscolour.picker({
//   $wrapper: $('#wrapper2'),
//   $domStyle: $('#preview2'),
//   $domValue: $('#preview2')
// });

