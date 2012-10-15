jscolour.anglePicker = function(opts) {

  opts.size = opts.size || 30;
  var angle = parseInt(opts.$domValue.val(), 10) || 0;

  var $canvas = $('<canvas />', {'style': 'float:left'});

  var $wrapper = $('<div />', {
    'class': 'angle-picker',
    'style': 'height: ' + opts.size + 'px; overflow: auto;'
  });

  var $input = $('<input />', {
    type: 'number',
    min: 0,
    max: 360,
    size: 5,
    style: 'margin: 5px 0 0 10px',
    value: angle
  });

  $canvas.attr('width', opts.size);
  $canvas.attr('height', opts.size);

  $wrapper.append($canvas);
  $wrapper.append($input);
  opts.$domValue.hide();
  opts.$domValue.after($wrapper);

  var ctx = $canvas[0].getContext('2d');

  this.input = $input;

  $input.bind('change input', function() {
    angle = this.value;
    opts.$domValue.val(angle).trigger('change');
    draw();
  });

  opts.$domValue.bind('change input', function() {
    angle = this.value;
    $input.val(angle);
    draw();
  });

  $canvas.bind('mousedown', function(e) {

    e.preventDefault();
    e.stopPropagation();

    var center = $canvas.offset();
    center.top += opts.size / 2;
    center.left += opts.size / 2;

    function mouseMove(e) {
      var dx = e.pageX - center.left;
      var dy = e.pageY - center.top;
      var angle = Math.round(- Math.atan2(dx, dy) * (180 / Math.PI) + 90);
      if (angle < 0) {
        angle += 360;
      }
      setAngle(angle);
    }

    mouseMove(e);

    $(document.body).bind('mousemove', mouseMove);

    $(document.body).bind('mouseup', function() {
      $(document.body).unbind('mousemove', mouseMove);
    });

  });

  function setAngle(newAngle) {
    opts.$domValue.val(newAngle).trigger('change');
    $input.val(newAngle);
  }

  function draw() {

    var angleRad = (angle) * Math.PI / 180;

    var point = {
      y: (opts.size / 2) + (14 * Math.sin(angleRad)),
      x: (opts.size / 2) + (14 * Math.cos(angleRad))
    };

    ctx.clearRect (0, 0, opts.size, opts.size);

    ctx.beginPath();
    ctx.arc(opts.size / 2, opts.size / 2, 14, 0, Math.PI*2, true);

    ctx.moveTo(point.x, point.y);
    ctx.lineTo(opts.size / 2, opts.size / 2);

    ctx.stroke();
  }

  $input.trigger('change');

};
