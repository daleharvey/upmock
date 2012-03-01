Handlebars.registerHelper('checkbox', function(checked) {
  return checked ? 'checked="checked"' : '';
});

Handlebars.registerHelper('option', function(selected) {
  return selected ? 'selected="selected"' : '';
});

Handlebars.registerHelper('disabled', function(disabled) {
  return disabled ? 'disabled=disabled' : '';
});

Handlebars.registerHelper('active', function(active) {
  return active ? 'active' : '';
});

Handlebars.registerHelper('selected', function(current, active) {
  return current === active.replace(/'/g, '') ? 'selected="selected"' : '';
});
