
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
		if(typeof data.done != 'undefined' && typeof $('#serverAlertWarning') != 'undefined'){
			if(data.done == "error")
			{
				$("#serverAlertWarning").html("Error: Could not bootstrap the server, please check the log below and try again!");
				$("#serverAlertWarning").show();
				updateProgressBar('#serverProgressbar', "100%");
			}
			if(data.done == "ok")
			{
				updateProgressBar('#serverProgressbar', "100%");
				$("#serverAlertSuccess").html("All done! The server was added succesfully!");
				$("#serverAlertSuccess").show();
				$("#nextStep").show();
			}
	}
});

$(document).ready(function(){
	serverStatusViewModel = {
	    serverConsole: ko.observable('Server output...'),
	};
	ko.applyBindings(serverStatusViewModel);
});
