
scrollcount = 0;
socket.on('server', function (data) {
	if(typeof data.status != 'undefined' && typeof $('#serverProgressbar') != 'undefined'){
		updateProgressBar('#serverProgressbar', data.progress);
	}
	if(typeof data.consoleData != 'undefined' && typeof $('#serverConsole') != 'undefined'){
		serverStatusViewModel.serverConsole(serverStatusViewModel.serverConsole() + data.consoleData);
		if(scrollcount > 10)
		{
			$("#serverConsole").animate({
				scrollTop:$("#serverConsole")[0].scrollHeight - $("#serverConsole").height()
			},1,function(){});
			scrollcount = 0;
		}
		scrollcount++;
		}
		if(typeof data.done != 'undefined'){
			if(data.done == "error")
			{
				$("#alert-content").html(data.error)
				$(".alert-danger").show();
			}
			if(data.done == "ok")
			{
				$("#ok-content").html(data.ok)
				$(".alert-success").show();
			}
	}
});

$(document).ready(function(){
	serverStatusViewModel = {
	    serverConsole: ko.observable('Server output...'),
	};
	ko.applyBindings(serverStatusViewModel);
});
