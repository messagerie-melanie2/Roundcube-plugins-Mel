function open_research() {
  $('#barup-search-col').toggle()
}


$(window).resize(function () {
  if ($('#barup-search-col').is(":hidden")) {
    if ($(this).width() > 480) {
      $('#barup-search-col').show()
    }
  }
});