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
  this.attr = function(key, val) {
    this.$dom.attr(key, val);
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


Elements.ButtonElement = function(opts, obj) {

  opts.html = '<input type="button" value="Submit" />';
  this.init(opts, {'data-type': 'ButtonElement', 'class': 'html'}, obj);

  this.setButtonText = function(text) {
    this.$dom.find('input').val(text);
  };

};
Elements.ButtonElement.prototype = new CoreElement();


Elements.SelectElement = function(opts, obj) {

  opts.html = '<select><option>Select Option:</option></select>';
  this.init(opts, {'data-type': 'SelectElement', 'class': 'html'}, obj);

  this.setSelectText = function(text) {
    this.$dom.find('option').text(text);
  };

};
Elements.SelectElement.prototype = new CoreElement();


Elements.ImgElement = function(opts, obj) {

  this.init(opts, {'data-type': 'ImgElement', 'class': 'html image empty'}, obj);

  this.setImage = function(src) {
    var self = this, img = this.$dom.find('img');
    img.load(function() {
      self.$dom.removeClass('empty');
      self.$dom.css({'width': this.naturalWidth, 'height': this.naturalHeight});
      window.protoshop.updateInfo();
    });
    img.attr('src', src);
  };

  this.setImageData = function(data) {
    var self = this, img = this.$dom.find('img');
    img.load(function() {
      self.$dom.removeClass('empty');
      self.$dom.css({'width': this.naturalWidth, 'height': this.naturalHeight});
      window.protoshop.updateInfo();
    });
    img.attr('src', data);
  };

  this.resetImageSize = function() {
    var img = this.$dom.find('img'), src = img.attr('src');
    img.attr('src', '');
    this.setImage(src);
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
    var $span = this.$dom.find('span').attr('contentEditable', true);
    $span[0].focus();
  };

  this.deselect = function() {
    var $span = this.$dom.find('span');
    $span[0].blur();
    $span.removeAttr('contentEditable');
    CoreElement.prototype.deselect.call(this);
    window.protoshop.saveUndoPoint();
  };

};
Elements.TextElement.prototype = new CoreElement();