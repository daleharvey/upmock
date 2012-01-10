// Basic wrapper for localStorage
var localJSON = (function(){
  if (!localStorage) {
    return false;
  }
  return {
    set:function(prop, val) {
      localStorage.setItem(prop, JSON.stringify(val));
    },
    get:function(prop, def) {
      return JSON.parse(localStorage.getItem(prop) || 'false') || def;
    },
    remove:function(prop) {
      localStorage.removeItem(prop);
    }
  };
})();

var Utils = {};


Utils.is_inside = function(obj, parent) {
  return ( obj == parent ) ||
    ( obj.parentNode !== null && Utils.is_inside(obj.parentNode, parent) );
};


Utils.findKey = function(obj, val) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (obj[prop] === val) {
        return prop;
      }
    }
  }
  return false;
};


Utils.rgbToHex = function(R,G,B) {
  return Utils.toHex(R)+Utils.toHex(G)+Utils.toHex(B);
};


Utils.toHex = function(n) {
  n = parseInt(n,10);
  if (isNaN(n)) return "00";
  n = Math.max(0,Math.min(n,255));
  return "0123456789ABCDEF".charAt((n-n%16)/16) +
    "0123456789ABCDEF".charAt(n%16);
};


Utils.readBackground = function(el) {

  var style = getComputedStyle(el,'');
  var bg = style.getPropertyValue('background-image');

  if (/^url/.test(bg)) {
    return style.getPropertyValue('background-color') + ' ' +
      style.getPropertyValue('background-image') + ' ' +
      style.getPropertyValue('background-position') + ' ' +
      style.getPropertyValue('background-repeat') + ' ';
  }

  if (/gradient/.test(bg)) {
    return bg;
  }

  return getComputedStyle(el,'').getPropertyValue('background-color');
};


Utils.w3cGradient2Browser = function(background) {
  if (/gradient/.test(background)) {
    var gradient = jscolour.gradientPicker.parseGradient(background);
    var css = jscolour.gradientPicker.generateCSS(gradient.angle, gradient.stops);
    return $.browser.webkit ? css.webkit : css.moz;
  }
  return background;
};

Utils.browserGradient2w3c = function(background) {
  if (/gradient/.test(background)) {
    var gradient = jscolour.gradientPicker.parseGradient(background);
    var css = jscolour.gradientPicker.generateCSS(gradient.angle, gradient.stops);
    return css.w3c;
  }
  return background;
};

Utils.alert = function(str) {
  var alert = $('<div class="alert">' + str + '<div>').appendTo(document.body);
  setTimeout(function () {
    alert.fadeOut('fast', function() {
      alert.remove();
    });
  }, 500);
};