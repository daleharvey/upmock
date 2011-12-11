var Elements = {};

var CoreElement = function() {

  var self = this;

  this.$handles = null;
  this.$dom = null;


  this.init = function(opts, attributes, obj) {

    var attrs = $.extend({}, attributes, opts.attrs);

    this.$dom = obj || $('<div>', attrs);

    if (opts.css) {
      this.$dom.css(opts.css);
    }

    if (opts.html && this.$dom.children().length < 1) {
      this.$dom.append(opts.html);
    }

    this.$dom.css('z-index', opts.index);
    this.$dom.data('obj', this);

  };


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


Elements.BlockElement = function(opts, obj) {
  this.init(opts, {'data-type': 'BlockElement', 'class': 'block'}, obj);
};
Elements.BlockElement.prototype = new CoreElement();


Elements.ImgElement = function(opts, obj) {

  this.init(opts, {'data-type': 'ImgElement', 'class': 'html image'}, obj);

  this.setImage = function(src) {
    this.$dom.find('img').attr('src', src);
    this.$dom.css({width: 'auto', 'height': 'auto'});
  };

};
Elements.ImgElement.prototype = new CoreElement();

Elements.HTMLElement = function(opts, obj) {
  this.init(opts, {'data-type': 'HTMLElement', 'class': 'html'}, obj);
};
Elements.HTMLElement.prototype = new CoreElement();


Elements.TextElement = function(opts, obj) {

  opts.html = '<span>' + (opts.text || 'text') + '</span>';
  this.init(opts, {'data-type': 'TextElement', 'class': 'text'}, obj);

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
Elements.TextElement.prototype = new CoreElement();