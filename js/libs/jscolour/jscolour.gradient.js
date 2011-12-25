
jscolour.gradientPicker = function(opts) {

  var CSS = '<style>' +
    '.colour-input { margin-top: 20px; border:1px solid black; height: 20px; width:30px; }' +
    '.gradientBox { height: 20px; border: 1px solid #000; }' +
    '</style>';

  $(document.body).append(CSS);

  var box = $('<div>', {'class': 'gradientBox'});
  var domStops = $('<div>', {'class': 'stops'});
  var colourDiv = $('<div>', {'class': 'colour-input'});
  var angleInput = $('<input type="number" min="0" max="360" />').val(90);
  var angle = 90;

  var colourInput = $('<input>', {
    'type': 'color',
    'style': 'position:absolute; visibility:hidden; margin-top: 20px;'
  });

  var selected = null;
  var stops = [];

  function init() {

    opts.$domStyle.css('position', 'relative');
    opts.$domStyle.append(box);
    opts.$domStyle.append(domStops);
    opts.$domStyle.append(colourInput);
    opts.$domStyle.append(colourDiv);
    opts.$domStyle.append(angleInput);

    if (!opts.initial) {
      stops.push({position: 0, colour: '#FFF'});
      stops.push({position: 50, colour: 'green'});
      stops.push({position: 100, colour: '#000'});
    }

    new jscolour.picker({
      $domStyle: colourDiv,
      $domValue: colourInput
    });

    colourDiv.bind('mousedown', function(e) {
      colourInput.trigger('focus')
    });

    colourInput.bind('change', function(e) {
      if (selected !== null) {
        stops[selected].colour = e.target.value;
        drawBox();
        drawStops();
      }
    });

    angleInput.bind('change input', function() {
      angle = angleInput.val();
      drawBox();
    });


    opts.$domStyle.bind('mousedown', mouseDown);
    box.bind('dblclick', doubleClick);

    drawBox();
    drawStops();
  }


  function doubleClick(e) {
    stops.push({position: Math.round((e.offsetX / box.width()) * 100), colour: '#666'});
    drawBox();
    drawStops();
  }


  function mouseDown(e) {

    var orig = e.target;
    var $obj = $(e.target);

    if (!$obj.is('.color-stop')) {
      return;
    }

    e.preventDefault();

    selected = $obj.data('index');

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
      drawBox();
    });

    $(document.body).bind('mouseup.moving', function(e) {
      $(document.body).unbind('.moving');
    });

  }

  function stopColorChanged(e) {
    stops[$(e.target).data('index')].colour = e.target.value;
    drawBox();
  }

  function drawBox() {

    var stopsHtml = [];

    var tmp = stops.slice(0);
    tmp.sort(function(a, b) {
      return a.position > b.position;
    });

    $.each(tmp, function(i, x) {
      stopsHtml.push(x.colour + ' ' + x.position + '%');
    });

    var css = '-webkit-linear-gradient(' + angle + 'deg, ' + stopsHtml.join(',') + ')';
    box.css('background', '-webkit-linear-gradient(0deg, ' + stopsHtml.join(',') + ')');

    opts.$domValue.val(css).trigger('change');
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