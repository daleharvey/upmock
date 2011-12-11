var CoreElement = function() {

  var self = this;

  this.$handles = null;
  this.$dom = null;

  CoreElement.prototype.select = function() {

    if (this.$dom.attr('data-lock') === 'true') {
      return false;
    }

    var handles = this.$dom.data('handles');
    handles = typeof handles !== 'undefined' ? handles.split(',') :
      ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w'];
    if (handles.length > 0 && handles[0] === "") {
      handles = [];
    }

    if (handles.length > 0) {
      this.$handles = $('<div class="handles">' + _.map(handles, function(x) {
        return '<div class="handle-' + x + '" data-handle="' + x +
          '" data-type="handle"></div>';
      }).join("") + '</div>');
      this.$dom.append(this.$handles);
    }

    this.$dom.addClass('selected');

    return true;
  };

  CoreElement.prototype.setImage = function() { };

  CoreElement.prototype.deselect = function() {
    this.$dom.removeClass('selected');
    if (this.$handles) {
      this.$handles.remove();
    }
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

var BlockElement = function(opts, obj) {

  var attrs = $.extend({}, opts.attrs, {
    'data-type': 'block',
    'class': 'block'
  });

  this.$dom = obj || $('<div>', attrs);

  if (opts.css) {
    this.$dom.css(opts.css);
  }

  this.$dom.css('z-index', opts.index);
  this.$dom.data('obj', this);
};
BlockElement.prototype = new CoreElement();


var ImgElement = function(opts, obj) {

  var attrs = $.extend({}, {
    'data-type': 'img',
    'class': 'block'
  }, opts.attrs);

  this.$dom = obj || $('<div>', attrs);
  this.$dom.append(opts.html);

  if (opts.css) {
    this.$dom.css(opts.css);
  }

  this.$dom.css('z-index', opts.index);
  this.$dom.data('obj', this);

  this.setImage = function(src) {
    this.$dom.find('img').attr('src', src);
    this.$dom.css({width: 'auto', 'height': 'auto'});
  };

};

ImgElement.prototype = new CoreElement();



var HTMLElement = function(opts, obj) {

  var attrs = $.extend({}, {
    'data-type': 'block',
    'class': 'html'
  }, opts.attrs);

  this.$dom = obj || $('<div>', attrs);
  this.$dom.append(opts.html);

  if (opts.css) {
    this.$dom.css(opts.css);
  }

  var handles = this.$dom.data('handles');
  this.handles = typeof handles !== 'undefined' ? handles.split(',') :
    ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w'];

  this.$dom.css('z-index', opts.index);
  this.$dom.data('obj', this);
};
HTMLElement.prototype = new CoreElement();


var TextElement = function(opts, obj) {

  this.$dom = obj || $('<div>', {
    'data-type': 'text',
    'class': 'text'
  }).append('<span>' + (opts.text || 'text') + '</span>');

  this.handles = ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w'];

  if (opts.css) {
    this.$dom.css(opts.css);
  }

  this.$dom.css('z-index', opts.index);
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