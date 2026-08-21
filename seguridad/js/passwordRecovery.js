    toolcontent = '<div class="passwordRecovery" >'+  
                '<h1>Recuperación de contraseña</h1>'+ 
                '<p>Ingresa tu usuario y correo registrado, te enviaremos una clave temporal que después podrás cambiar.</p><br>'+
                  '<span>Usuario</span><input type="text" required="" name="login"><br>'+
                  '<span>Correo electrónico</span><input type="mail" required="" name="mail"><br><br>'+
                '<input onclick="pass()" type="button" name="reiniciar" value="Recuperar contraseña"><br><br>'+
              '</div>';  



// toolcontent = '<div class="passwordRecovery" >'+  
//                 '<h1>Restablecer contraseña</h1>'+ 
//                 '<p>Se enviará una contraseña temporal a tu correo electrónico registrado en el sistema. Deberás modificarla una vez ingresado, caso contrario expirará durante la próxima hora y tendrás que restablecer nuevamente.</p><br>'+
//                   '<span>Usuario</span><input type="text" required="" name="login"><br>'+
//                   '<span>Correo electrónico</span><input type="mail" required="" name="mail"><br><br>'+
//                 '<input onclick="pass()" type="button" name="reiniciar" value="Reiniciar contraseña"><br><br>'+
//               '</div>';


var pass = function(fromLogin, callback=null, vLogin=null){
	// 
	if(!vLogin){
		var vLogin = $('input[name="txtUsuario"]').val();
	}
	var mail = $('input[name="email"]').val();
	
	if(vLogin != "" && mail != ""){
		$.ajax({
			url: '/4DACTION/_V3_SetRandomPassword',
			data: {
				'loginUser': vLogin,
				'fromLogin': fromLogin,
				'mail': mail
			},
			async:false,
			dataType: 'json',
			success: function(data) {
				
				if(data.success){
					toastr.success('Contraseña reestablecida, verifique su correo electrónico.');
					// $('div.passwordRecovery').hide();
					$('body').trigger('click');
					$('p.backToLogin').trigger('click');
				}else if(data.readonly){
					toastr.warning('Contraseña ya reiniciada.');
				}else {
					toastr.error('Nombre de usuario y/o correo electrónico no coinciden. Por favor comunicarse con soporte para verificar la información.');
				}
				if(callback) callback();
			}
		});

	}else{					
		toastr.error('Complete todos los campos para reestablecer la contraseña');
	}
}