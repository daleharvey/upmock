var shortcuts = {
  global : {
    description: 'Global Shortcuts',
    shortcuts: [
      {
        key: 'esc',
        e: 'keydown',
        callback: function() {
          var showing = !$('#panel').is(':visible');
          this.selectElement(null);
          $('#panel, header').toggle();
          $('#canvas_wrapper').css({'top': showing ? 30 : 0});

          if (showing) {
            if (localJSON.get(window.protoshop.site_prefix + '-overlay') === true) {
              $('.grid-overlay').show();
            }
          } else {
            $('.grid-overlay').hide();
          }
        },
        description: 'Preview Design'
      },
      {
        key: '?',
        e:'keypress',
        override: 'shift+?',
        callback: function() { $('#keyboard-help').toggle(); },
        description: 'Show / Hide the help dialog'
      },
      {
        key: 'meta+c',
        e: 'keydown',
        callback: function() {
          localJSON.set('clipboard', this.copy());
        },
        description: 'Copy'
      },
      {
        key: 'meta+v',
        e: 'keydown',
        callback: function() {
          var self = this;
          self.selectElement(null);
          this.paste(localJSON.get('clipboard', []), true);
        },
        description: 'Paste'
      },
      {
        key: 'meta+z',
        e: 'keydown',
        callback: function() {
          this.undo();
        },
        description: 'Undo'
      },
      {
        key: 'meta+shift+z',
        e: 'keydown',
        callback: function() {
          this.redo();
        },
        description: 'Redo'
      },
      {
        key: 'ctrl+c',
        e: 'keydown',
        callback: function() {
          localJSON.set('clipboard', this.copy());
        },
        description: 'Copy'
      },
      {
        key: 'ctrl+v',
        e: 'keydown',
        callback: function() {
          var self = this;
          self.selectElement(null);
          this.paste(localJSON.get('clipboard', []), true);
        },
        description: 'Paste'
      },
      {
        key: 'ctrl+z',
        e: 'keydown',
        callback: function() {
          this.undo();
        },
        description: 'Undo'
      },
      {
        key: 'ctrl+shift+z',
        e: 'keydown',
        callback: function() {
          this.redo();
        },
        description: 'Redo'
      }
    ]
  },
  editing: {
    description: 'Editing Item Shortcuts',
    shortcuts: [
      {
        key: 'left',
        e: 'keydown',
        callback: function() { this.onSelected('move', 0, -1); this.updateInfo(); },
        description: 'Move Left'
      },
      {
        key: 'right',
        e: 'keydown',
        callback: function() { this.onSelected('move', 0, 1); this.updateInfo(); },
        description: 'Move Right'
      },
      {
        key: 'up',
        e: 'keydown',
        callback: function() { this.onSelected('move', -1, 0); this.updateInfo(); },
        description: 'Move Up'
      },
      {
        key: 'down',
        e: 'keydown',
        callback: function() { this.onSelected('move', 1, 0); this.updateInfo(); },
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
      },
      {
        key: 'shift+left',
        e: 'keydown',
        callback: function() { this.onSelected('move', 0, -10); this.updateInfo(); },
        description: 'Move Left'
      },
      {
        key: 'shift+right',
        e: 'keydown',
        callback: function() { this.onSelected('move', 0, 10); this.updateInfo(); },
        description: 'Move Right'
      },
      {
        key: 'shift+up',
        e: 'keydown',
        callback: function() { this.onSelected('move', -10, 0); this.updateInfo(); },
        description: 'Move Up'
      },
      {
        key: 'shift+down',
        e: 'keydown',
        callback: function() { this.onSelected('move', 10, 0); this.updateInfo(); },
        description: 'Move Down'
      }
    ]
  }
};
