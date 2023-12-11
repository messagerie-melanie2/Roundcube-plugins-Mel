$(document).ready(function () {
  let contextMenuOpened = false;
  // Open the context menu on right-click
  $('.link-block').on('contextmenu', function (event) {
    event.preventDefault();

    const contextMenu = $('#context-menu-' + $(this).data('id'));

    if (contextMenuOpened) {
      contextMenuOpened.hide();
    }

    // Show the context menu
    contextMenu.show();
    contextMenuOpened = contextMenu;

    $(document).on('click', function () {
      if (!contextMenu.is(event.target) && contextMenu.has(event.target).length === 0) {
        contextMenu.hide();
        contextMenuOpened = false;
      }
    });
  });  
});