var shortcuts = {
  global : {
    description: 'Global Shortcuts',
    shortcuts: [
      {
        key: 'esc',
        e: 'keydown',
        callback: function() {
          this.selectElement(null);
          $('#panel, header').toggle();
          $('#canvas_wrapper').css({'top': $('#panel').is(':visible') ? 30 : 0});
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
        key: 'ctrl+c',
        e: 'keydown',
        callback: function() {
          localJSON.set('clipboard', _.map(this.selected, function(obj) {
            var tmp = obj.$dom.clone().removeClass('selected');
            tmp.find('.handles').remove();
            return tmp.wrap('<div>').parent().html();
          }));
        },
        description: 'Copy'
      },
      {
        key: 'ctrl+v',
        e: 'keydown',
        callback: function() {
          var self = this;
          self.selectElement(null);
          var arr = _.map(localJSON.get('clipboard'), function(html) {
            var $obj = $(html);
            $obj.css({
              left: parseInt($obj.css('left'), 10) + 50,
              top: parseInt($obj.css('top'), 10) + 50
            });
            var obj = new Elements[$obj.data('type')](++self.index.max, $obj);
            obj.$dom.appendTo($('#canvas'));
            self.selectElement(obj);
          });
        },
        description: 'Paste'
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
      }
    ]
  }
};
