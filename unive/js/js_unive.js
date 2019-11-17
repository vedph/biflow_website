/**
 * js focus su ricerca
 * @data 04/12/2018
 * @Author ciccio pasticcio
 * @Version 0.11
 */

$(document.body).on('shown.bs.dropdown', function () {
    $(".tendina > form > div.input-group.input-group-lg > input.form-control").focus();
});

/**
 * js tasto go up
 * @data 04/12/2018
 * @Author ciccio pasticcio
 * @Version 0.1
 */
 
$(function() {
	$(window).scroll(function() {
		if($(this).scrollTop() != 0) {
						  //se non siamo in cima alla pagina
			$('#top').fadeIn(); //faccio apparire il box  
    		$('.navbar').addClass('menu-scroll');
		} else {
						  //altrimenti (il visitatore è in cima alla pagina scrollTop = 0)
			$('#top').fadeOut();//Il box scompare
    		$('.navbar').removeClass('menu-scroll');
		}
	});//Allo scroll function
	
	$('#top').click(function() {
				  //Se clicco sul box torno su (scrollTop:0) con un timing di animazione.
	  $('body,html').animate({scrollTop:0},800);
	});//Click

});//DOM
  
  
   
/**
 * js CookieControl
 * @data 10/09/2015
 * @Author ciccio pasticcio
 * @Version 0.2
 */
 
$(window).bind("load", function(){MyCookieControl('cookie');});

$(window).click(function() {
  CookieOnClick('cookie', 1, 30);
});

$(window).scroll(function() {
  CookieOnClick('cookie', 1, 30);
});

function CookieOnClick(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
	var elem = document.getElementById("cookie-alert");
	if(elem) {
		elem.parentElement.removeChild(elem);
	}
} 

function MyCookieControl(cname) {
	var elem = document.getElementById("cookie-alert");
	if(elem) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		var done = false;
		for(var i = 0; i < ca.length; i ++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') c = c.substring(1);
			if (c.indexOf(name) == 0) {
				elem.parentElement.removeChild(elem);
				done = true;
				break;
			}
		}
		if(!done) {
			elem.style.display = 'block';
		}
	}
}

$(function () {
  $('[data-toggle="popover"]').popover()
})