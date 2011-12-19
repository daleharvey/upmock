
jscolour.gradientPicker = function(opts) {

  var box = $('<div>', {'class': 'gradientBox'});
  var domStops = $('<div>', {'class': 'stops'});

  var stops = [];

  function init() {

    opts.$domStyle.css('position', 'relative');
    opts.$domStyle.append(box);
    opts.$domStyle.append(domStops);

    if (!opts.initial) {
      stops.push({position: 0, colour: '#FFF'});
      stops.push({position: 100, colour: '#000'});
    }

    drawBox();
    drawStops();
  }

  function stopColorChanged(e) {
    stops[$(e.target).data('index')].colour = e.target.value;
    drawBox();
  }

  function drawBox() {
    var stopsHtml = [];
    $.each(stops, function(i, x) {
      stopsHtml.push(x.colour + ' ' + x.position + '%');
    });

    var css = '-webkit-linear-gradient(90deg, ' + stopsHtml.join(',') + ')';
    box.css('background', '-webkit-linear-gradient(0deg, ' + stopsHtml.join(',') + ')');
    opts.$domValue.val(css).trigger('change');
  }

  function drawStops() {

    domStops.empty();

    $.each(stops, function(i, x) {

      var stopInput = $('<input>', {
        'data-index': i,
        'class': 'stop-input',
      });

      var stopDiv = $('<div>', {
        'data-index': i,
        'class': 'color-stop',
        css: {
          'background-color': x.colour,
          position: 'absolute',
          left: x.position + '%'
        }
      });

      stopInput.bind('change', stopColorChanged);
      stopDiv.bind('mousedown', function() {
        stopInput.trigger('focus');
      });

      stopDiv.append(stopInput);
      domStops.append(stopDiv);

      new jscolour.picker({
        $domStyle: stopDiv,
        $domValue: stopInput
      });

    });
  }

  init();

};