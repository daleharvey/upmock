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
