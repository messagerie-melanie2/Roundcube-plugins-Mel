function open_research() {
  $('#barup-search-col').toggle();
  $('.hide-button-search').toggle();
}


$(window).resize(function () {
  if ($(this).width() > 480) {
    if ($('#barup-search-col').is(":hidden")) {
      $('#barup-search-col').show();
    }
    else {
      $('.hide-button-search').show();
    }
  }
});