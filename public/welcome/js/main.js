(function($){
	function floatLabel(inputType){
		$(inputType).each(function(){
			var $this = $(this);
			// on focus add cladd active to label
			$this.focus(function(){
				$this.next().addClass("active");
			});
			//on blur check field and remove class if needed
			$this.blur(function(){
				if($this.val() === '' || $this.val() === 'blank'){
					$this.next().removeClass();
				}
			});
		});
	}
	// just add a class of "floatLabel to the input field!"
	floatLabel(".floatLabel");

	// Lorsque le focus est sur le password, on afficher les indications
	$('#password').focus(function(){
		$('.password_hint').show();
	});

	// Lorsque le focus est sur le password, on afficher les indications
	$('#password').blur(function(){
		$('.password_hint').hide();
	});

})(jQuery);