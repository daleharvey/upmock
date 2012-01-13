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
      try {
        return JSON.parse((localStorage.getItem(prop) || 'false')) || def;
      } catch(err) {
        return def;
      }
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

Utils.lorum_ipsum = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?".split(' ');