
checkLogin.func =() => {	
	return new Promise((resolve, reject) => {
		$.ajax({
		url: '/4DACTION/_v3_checkLogin',
		data: {
		},
		async:false,
		dataType: 'json',
		success: function(data) {
			resolve(data);
		},
		error: function(err){
			reject(err);
		}
	});
}

checkLogin.set = (func, time, alert) => {
	uvar.checkLogin.interval = setInterval(() => {
		func().then(data => {
			if(!data.isLogin){				
				unaBase.ui.block();
				if(alert){
					alert("Tu sesión ha caducado");
				}
				checkLogin.clearInterval();
				checkLogin.set(checkLogin.func, 15, false);
			}
		}).catch(err => {
			console.warn(err);
		});
	}, time);
}

checkLogin.clearInterval = () => {
	clearInterval(uvar.checkLogin.interval);
}