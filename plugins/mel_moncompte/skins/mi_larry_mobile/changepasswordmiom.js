(function () 
{
	function gotoPortail(evt)
	{
		//Mémoriser la fenêtre courante
		let currentWindow = window;
		//Aller ver le portail de changement du mot de passe dans une nouvelle fenêtre
    	window.open(rcmail.env.portaiPwdlUri, '_blank');
    	//Fermer la fenêtre précédente
    	currentWindow.close();
	}
	
	function init(evt)
	{
		//Aller vers le portail de changement du mot de passe sur clic du bouton
		document.getElementById('changepasswordmiom').addEventListener('click', gotoPortail);		
	}
    rcmail.addEventListener('init', init);
})();
