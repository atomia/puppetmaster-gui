var socket = io();

$(document).ready(function(){
  // Register listeners
  var newServerButton = document.getElementById('newServerButton');
  var installPuppetButton = document.getElementById('installPuppet');

  if(newServerButton)
  {
    newServerButton.addEventListener('click', function() {
      addServer();
    }, false);
  }

  if(installPuppetButton)
  {
    installPuppetButton.addEventListener('click', function() {
      installPuppetMaster();
    }, false);
  }
});

function addServer () {

  if(!validateConfigForm())
    return false;

  $('#serverAlertWarning').hide();
  var hostname = $('#serverHostname').val();
  var username = $('#serverUsername').val();
  var password = $('#serverPassword').val();
  var serverKey = $('#serverKey').val();

  var postData = { serverHostname : hostname, serverUsername : username, serverPassword: password, serverKey: serverKey };

  $.post("/servers/new", postData, function(data) {
    if(typeof data.ok != 'undefined')
    {
      $('#newServerButton').hide();
      $('#serverProgress').show();
    }
  })
  .error(function(err){
    console.log(err);
    $('#serverAlertWarning').html("Error validating server: " + err.responseText);
    $('#serverAlertWarning').show();
  });

};

function installPuppetMaster() {

  var postData = {};
  $.post("/wizard/puppet", postData, function(data) {

    if(typeof data.ok != 'undefined')
    {
      $('#installPuppet').hide();
      $('#serverProgress').show();
      $('#serverConsole').show();
    }
  })
  .error(function(err){
    console.log(err);
    $('#serverAlertWarning').html("Error validating server: " + err.responseText);
    $('#serverAlertWarning').show();
  });
};

function validateConfigForm() {
  var data = [];
  $('input[type="text"].required').each(function() {
    if(typeof (this) != 'undefined')
    {
      if(this.value == "")
      {
        alert("Please fill in all required configuration variables");
        $(this).focus();
        return false;
      }
    }
  });

  moduleName = $("#moduleName").val();
  // Config is OK let's save it
  $('input[type="text"].configVariables').each(function() {
    if(typeof (this) != 'undefined')
    {
      if(this.value != "")
      {
        var tmpData = {};
        var tmpName = moduleName + "::" + $('#'+this.id).attr("name");
        tmpData.value = this.value;
        tmpData.key = tmpName;
        data.push(tmpData);
      }
    }
  });

  postData = {};
  postData.configData = data;

  $.ajax({
    type: 'POST',
    data: JSON.stringify(postData),
    contentType: 'application/json',
    url: '/config'
  });
  console.log(data);
  return false;
};

function updateProgressBar(barId, progress) {
  $(barId).css( "width", progress );
}
function updateConsole(consoleId, data) {
  $(consoleId).append(data);
  $(consoleId).animate({
    scrollTop:$(consoleId)[0].scrollHeight - $(consoleId).height()
  },1,function(){});

}
socket.on('server', function (data) {
  console.log(data);
  if(typeof data.status != 'undefined' && typeof $('#serverProgressbar') != 'undefined'){
      updateProgressBar('#serverProgressbar', data.progress);
  }
  if(typeof data.consoleData != 'undefined' && typeof $('#serverConsole') != 'undefined'){
      updateConsole('#serverConsole', data.consoleData);
  }
  if(typeof data.done != 'undefined' && typeof $('#serverAlertWarning') != 'undefined'){
    if(data.done == "error")
    {
      $("#serverAlertWarning").html("Error: Could not bootstrap the server, please check the log below and try again!");
      $("#serverAlertWarning").show();
      updateProgressBar('#serverProgressbar', "100%");
    }
  }
});
