//met toute la chaine en capitale
function uppercaseFunction(x)
{
	x.value=x.value.toUpperCase();
}

//met chaque mot de la chaine en ucfirst (séparateur de mots : ' ' ou '-'
function upperfisrtFunction(x)
{
   var splitStr = x.value.toLowerCase().split(' ');
   for (var i = 0; i < splitStr.length; i++) {
       // You do not need to check if i is larger than splitStr length, as your for does that for you
       // Assign it back to the array
       splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
   }
   x.value = splitStr.join(' ');
   var splitStr = x.value.split('-');
   for (var i = 0; i < splitStr.length; i++) {
       // You do not need to check if i is larger than splitStr length, as your for does that for you
       // Assign it back to the array
       splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
   }
   // Directly return the joined string
   x.value = splitStr.join('-'); 
}

//met une majuscule à la premiere lettre de la chaine
function ucfirstFunction(x)
{
		x.value=x.value.charAt(0).toUpperCase() + x.value.slice(1);
}


function phoneFunction(x)
{
	if(x.value != ""){
		var res = x.value.split('');
		var clean = new Array();
		for(var i=0;i<res.length;i++){
			if(/^\d$/.test(res[i])){
				clean.push(res[i]);
			}
		}

		if((clean.length>10) && (clean[0]==1)){

			clean.splice(0, 1);
		}

		clean.splice(2, 0, " ");
		clean.splice(5, 0, " ");
		clean.splice(8, 0, " ");
		clean.splice(11, 0, " ");

		x.value=clean.join('');
	}
}

function httpFunction(id)
{
	var x=document.getElementById(id);
	x.value=x.value.toLowerCase();
	if(x.value != ""){
		if((x.value.substring(0,7)!="http://")&&(x.value.substring(0,8)!="https://")){
			x.value="http://"+x.value; 
		}
	}
}

