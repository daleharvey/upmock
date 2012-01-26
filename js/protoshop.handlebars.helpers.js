Handlebars.registerHelper('checkbox', function(checked) {
  return checked ? 'checked="checked"' : '';
});

Handlebars.registerHelper('option', function(selected) {
  return selected ? 'selected="selected"' : '';
});

Handlebars.registerHelper('active', function(active) {
  return active ? 'active' : '';
});

Handlebars.registerHelper('selected', function(current, active) {
  return current === active ? 'selected="selected"' : '';
});