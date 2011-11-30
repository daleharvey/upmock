var shortcuts = {
  global : {
    description: 'Global Shortcuts',
    shortcuts: [
      {
        key: 'esc',
        e: 'keydown',
        callback: function() {
          $('#panel, #top-bar').toggle();
          $('#canvas_wrapper').css({'margin-top': $('#panel').is(':visible') ? 50 : 0});
        },
        description: 'Preview Design'
      },
      {
        key: '?',
        e:'keypress',
        override: 'shift+?',
        callback: function() { $('#keyboard-help').toggle(); },
        description: 'Show / Hide the help dialog'}
    ]
  },
  editing: {
    description: 'Editing Item Shortcuts',
    shortcuts: [
      {
        key: 'left',
        e: 'keydown',
        callback: function() { this.onSelected('move', 0, -1); },
        description: 'Move Left'
      },
      {
        key: 'right',
        e: 'keydown',
        callback: function() { this.onSelected('move', 0, 1); },
        description: 'Move Right'
      },
      {
        key: 'up',
        e: 'keydown',
        callback: function() { this.onSelected('move', -1, 0); },
        description: 'Move Up'
      },
      {
        key: 'down',
        e: 'keydown',
        callback: function() { this.onSelected('move', 1, 0); },
        description: 'Move Down'
      },
      {
        key: 'backspace',
        e: 'keydown',
        callback: function() {
          _.each(this.selected, function(o) { o.$dom.remove(); });
          this.selectElement(null);
        },
        description: 'Delete Element'
      }
    ]
  }
};
