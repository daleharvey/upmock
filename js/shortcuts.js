var shortcuts = {
  global : {
    description: 'Global Shortcuts',
    shortcuts: [
      {
        key: 'esc',
        e: 'keydown',
        callback: function() { $('#panel').toggle(); },
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
        callback: function() {
          this.selected.css({left: this.selected.$dom.position().left - 1});
        },
        description: 'Move Left'
      },
      {
        key: 'right',
        e: 'keydown',
        callback: function() {
          this.selected.css({left: this.selected.$dom.position().left + 1});
        },
        description: 'Move Right'
      },
      {
        key: 'up',
        e: 'keydown',
        callback: function() {
          this.selected.css({top: this.selected.$dom.position().top - 1});
        },
        description: 'Move Up'
      },
      {
        key: 'down',
        e: 'keydown',
        callback: function() {
          this.selected.css({top: this.selected.$dom.position().top + 1});
        },
        description: 'Move Down'
      },
      {
        key: 'backspace',
        e: 'keydown',
        callback: function() {
          this.selected.$dom.remove();
          this.selectElement(null);
        },
        description: 'Delete Element'
      },
      {
        key: 'shift+left',
        e: 'keydown',
        callback: function() {
          this.selected.css({width: this.selected.$dom.width() - 1});
        },
        description: 'Decrease Width'
      },
      {
        key: 'shift+right',
        e: 'keydown',
        callback: function() {
          this.selected.css({width: this.selected.$dom.width() + 1});
        },
        description: 'Increase Width'
      },
      {
        key: 'shift+up',
        e: 'keydown',
        callback: function() {
          this.selected.css({height: this.selected.$dom.height() - 1});
        },
        description: 'Decrease Height'
      },
      {
        key: 'shift+down',
        e: 'keydown',
        callback: function() {
          this.selected.css({height: this.selected.$dom.height() + 1});
        },
        description: 'Increase Height'
      }
    ]
  }
};
