
jscolour.gradientPicker = function(opts) {

  var self = this;
  var CSS = '<style id="gradientCSS">' +
    '.colour-input { margin-top: 5px; border:1px solid black; height: 20px; width:30px; float: left; background: white; }' +
    '.gradient-box { height: 20px; border: 1px solid #000; }' +
    '.gradient-wrapper .angle-picker { float: right; }' +
    '.stop-delete { margin: 6px; }' +
    '</style>';

  if ($('#gradientCSS').length === 0) {
    $(document.body).append(CSS);
  }

  var box = $('<div>', {'class': 'gradient-box'});
  var domStops = $('<div>', {'class': 'stops'});
  var colourDiv = $('<div>', {'class': 'colour-input', 'disabled': 'disabled'});

  var wrapper = $('<div>', {style:'padding-top: 20px;'});

  var deleteButton = $('<input type="button" value="delete" disabled="disabled" ' +
                       'class="stop-delete" />');

  var angleInput = $('<input type="number" value="270" />');
  var angle = 270;

  var colourInput = $('<input>', {
    'type': 'color',
    'style': 'position:absolute; visibility:hidden; margin-top: 20px;'
  });

  var selected = null;
  var selectedObj = null;

  var stops = [];

  function updateGradientFromValue(e, selfUpdated) {

    if (selfUpdated) {
      return;
    }

    var initialGradient = opts.$domValue.val();

    if (/gradient/.test(initialGradient)) {
      var parse = jscolour.gradientPicker.parseGradient(initialGradient);
      stops = parse.stops;
      angle = parse.angle;
      angleInput.val(parse.angle).trigger('change');
    }

    drawBox(false);
    drawStops();

  }

  function unselectStop() {
    selected = null;
    colourDiv.attr('disabled', 'disabled');
    deleteButton.attr('disabled', 'disabled');
  }

  function init() {

    opts.$domStyle.addClass('gradient-wrapper');
    opts.$domStyle.css('position', 'relative');
    opts.$domStyle.append(box);
    opts.$domStyle.append(domStops);

    wrapper.append(colourDiv);
    wrapper.append(colourInput);
    wrapper.append(deleteButton);
    wrapper.append(angleInput);

    opts.$domStyle.append(wrapper);

    if (stops.length === 0) {
      stops.push({position: 0, colour: '#FFF'});
      stops.push({position: 100, colour: '#000'});
    }

    new jscolour.picker({
      $domStyle: colourDiv,
      $domValue: colourInput
    });

    var anglePicker = new jscolour.anglePicker({
      $domValue: angleInput
    });

    colourDiv.bind('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if ($(e.target).attr('disabled') !== 'disabled') {
        colourInput.trigger('focus');
      }
    });

    colourInput.bind('change', function(e) {
      if (selected !== null) {
        stops[selected].colour = e.target.value;
        drawBox(true);
        drawStops();
      }
    });

    angleInput.bind('change input', function() {
      angle = this.value;
      drawBox(true);
    });

    deleteButton.bind('mousedown', function() {
      if (selected !== null) {
        delete stops[selected];
        stops = _.filter(stops, function(obj) {
          return typeof obj !== 'undefined';
        });
        unselectStop();
        drawBox(true);
        drawStops();
      }
    });

    opts.$domValue.bind('change', updateGradientFromValue);
    opts.$domStyle.bind('mousedown', mouseDown);
    box.bind('dblclick', doubleClick);

    updateGradientFromValue();
  }


  function doubleClick(e) {
    var x = e.offsetX || (e.clientX - $(e.target).offset().left);
    stops.push({position: Math.round((x / box.width()) * 100), colour: '#666'});
    drawBox(true);
    drawStops();
  }


  function mouseDown(e) {

    var orig = e.target;
    var $obj = $(e.target);

    if (!$obj.is('.color-stop')) {
      return;
    }

    e.preventDefault();

    if (selectedObj) {
      selectedObj.removeClass('selected');
    }
    selectedObj = $obj;
    selected = $obj.data('index');
    $obj.addClass('selected');
    colourDiv.removeAttr('disabled');
    deleteButton.removeAttr('disabled');

    var colour = $obj.css('background-color');
    var width = box.width();
    var start = {left: box.offset().left};

    colourDiv.css('background', colour);

    $(document.body).bind('mousemove.moving', function(e) {

      var x = e.clientX - start.left;

      if (x > width) {
        x = width;
      } else if (x < 0) {
        x = 0;
      }

      stops[selected].position = Math.round(x / width * 100);
      $obj.css({left: x + 'px'});
      drawBox(true);
    });

    $(document.body).bind('mouseup.moving', function(e) {
      $(document.body).unbind('.moving');
    });

  }

  function stopColorChanged(e) {
    stops[$(e.target).data('index')].colour = e.target.value;
    drawBox(true);
  }

  // function generateCSS(angle, stops) {

  // }

  function drawBox(update) {

    var gradient = jscolour.gradientPicker.generateCSS(angle, stops);
    var preview = jscolour.gradientPicker.generateCSS(0, stops);

    if ($.browser.webkit) {
      box.css('background', preview.webkit);
    } else {
      box.css('background', preview.moz);
    }

    if (update) {
      opts.$domValue.val(gradient.w3c).trigger('change', true);
    }
  }

  function drawStops() {

    domStops.empty();

    $.each(stops, function(i, x) {

      var stopDiv = $('<div>', {
        'data-index': i,
        'class': 'color-stop',
        css: {
          'background': x.colour,
          position: 'absolute',
          left: x.position + '%'
        }
      });

      domStops.append(stopDiv);

    });
  }

  init();

};

jscolour.gradientPicker.generateCSS = function(angle, stops) {

  var stopsHtml = [];
  var tmp = stops.slice(0);
  tmp.sort(function(a, b) { return a.position > b.position; });

  $.each(tmp, function(i, x) {
    stopsHtml.push(x.colour + ' ' + x.position + '%');
  });

  return {
    w3c: '-linear-gradient(' + angle + 'deg, ' + stopsHtml.join(',') + ')',
    webkit: '-webkit-linear-gradient(' + angle + 'deg, ' + stopsHtml.join(',') + ')',
    moz: '-moz-linear-gradient(' + angle + 'deg, ' + stopsHtml.join(',') + ')'
  };

};


jscolour.gradientPicker.parseGradient = function(gradient) {

  var tmpstops = [];
  var tmp = gradient.replace(/^-((webkit|moz)-)*linear-gradient\(/, '').replace(/\)$/, '');
  var deg = tmp.match(/^[0-9]*deg,[ ]*/);
  tmp = tmp.substr(deg[0].length);

  var tmpangle = parseInt(deg[0], 10);

  tmp = tmp.split('%,');

  for(var i = 0, len = tmp.length; i < len; i++) {
    var x = tmp[i].lastIndexOf(' ');
    tmpstops.push({
      position: parseInt(tmp[i].substr(x), 10),
      colour: tmp[i].substr(0, x)
    });
  }

  return {
    stops: tmpstops,
    angle: tmpangle
  };

};