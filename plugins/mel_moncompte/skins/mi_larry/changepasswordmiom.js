(function () 
{
    rcmail.addEventListener('init', function(evt) {
		//Aller ver le portail de changement du mot de passe
    	window.open(rcmail.env.portaiPwdlUri, '_parent');
    });
})();
