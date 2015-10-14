var socket = io();
var allTldProcesses = {};
$(document).ready(function(){
  // Register listeners
  var newServerButton = document.getElementById('newServerButton');
  var installPuppetButton = document.getElementById('installPuppet');
  var serverHostname = document.getElementById('serverHostname');
  var toggleAdvanced = document.getElementById('toggleAdvanced');

  $('.password').each(
    function (index)
    {
      if($(this).val() == "")
      {
        generatePasswordForm($(this).attr('id'));
      }
      $(this).removeClass("required");
    }
  );
  if(toggleAdvanced)
  {
    toggleAdvanced.addEventListener('click', function() {
      $("#advanced_options").toggle(400, function() {
        if($("#advanced_options").is(":visible")){
          $("#toggleAdvanced").html("Hide advanced configuration options");
        } else {
          $("#toggleAdvanced").html("Show advanced configuration options");
        }
      });

    }, false);
  }

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

  if(serverHostname)
  {
    serverHostname.addEventListener('change', function() {
      var hostname = $(this).val();
      $('input[type=text], textarea').each(
          function(index){
              var input = $(this);
              if (input.val().indexOf("$fqdn") >= 0)
              {
                console.log("found");
                fqdn = input.val().replace("$fqdn",hostname);
                input.val(fqdn);

              }

              //input.attr('id');
          }
      );
    }, false);
  }

});

function addServer () {

  if($('input[type="text"].configVariables').size() != 0 && !validateConfigForm())
    return false;

  $('#serverAlertWarning').hide();
  var hostname = $('#serverHostname').val();
  var username = $('#serverUsername').val();
  var password = $('#serverPassword').val();
  var serverKey = $('#serverKey').val();
  var serverRole = $('#serverRole').val();
  var postData = { serverHostname : hostname, serverUsername : username, serverPassword: password, serverKey: serverKey, serverRole: serverRole };

  $.post("/servers/new", postData, function(data) {
    if(typeof data.ok != 'undefined')
    {
      $('#newServerButton').hide();
      $('#serverProgress').show();
    }
  })
  .error(function(err){
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

  if($('input[type="text"].invalid').size() > 0) {
    alert("One or more variables does not pass validation, please adjust the marked fields");
    return false;
  }
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
        // Special cases
        if(typeof domainregConfigured == 'undefined' && tmpName == "atomia::domainreg::domainreg_tld_config_hash")
        {
          tmpData.value = "";
          $("[name='atomia::domainreg::domainreg_tld_config_hash']").each(function() {
            name = $(this).attr('id').replace("tld_process_","");
            tmpData.value = tmpData.value + "name: | \n" + $($this).val();
          });
          domainregConfigured = true;
        }
        else {
          tmpData.value = this.value;
        }
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
  return true;
};

function validateConfigField(field) {
  $("#" + field).removeClass("invalid");
  var subject = $("#" + field).val();
  var field_val = "";
  if($("#" + field + "_validation").val() == "%password")
  {
      field_val = new RegExp('[a-zA-Z0-9z!@#$%^&*()+<>]{8,}',"g");
  }
  else if($("#" + field + "_validation").val() == "%url")
  {
      field_val = new RegExp('^(https?:\/\/).*',"gi");
  }
  else {
    field_val = new RegExp($("#" + field + "_validation").val().replace(/(\r\n|\n|\r)/gm,"").trim(),"g");
  }

  if(!field_val.test(subject))
    $("#" + field).addClass("invalid");

}

function generatePasswordForm(field) {
  var length = 12;
  var chars = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()+<>ABCDEFGHIJKLMNOP1234567890";
  var pass = "";
  for (var x = 0; x < length; x++) {
    var i = Math.floor(Math.random() * chars.length);
    pass += chars.charAt(i);
  }

  $("#" + field).val(pass);
  validateConfigField(field);
}

function addTLDProcess() {
  if($("#domainreg_tld_config_hash_name").val() == "") {
    alert("Fill in the name field to add the TLD process");
    return;
  }
  // Add hidden fields with current tld process
  var hiddenTLDFields = "<input type='hidden' class='configVariables' id='tld_process_" + $("#domainreg_tld_config_hash_name").val()  + "' name='atomia::domainreg::domainreg_tld_config_hash' value='" + $("#domainreg_tld_config_hash").val() + "' />";
  $("#tld_processes").append(hiddenTLDFields);

  // Add current tld process to list of processes
  var listItem = "<li id='" + $("#domainreg_tld_config_hash_name").val() + "'><a href='#' onClick='loadTLDProcess(\""+$("#domainreg_tld_config_hash_name").val()+"\");return false;'>"+$("#domainreg_tld_config_hash_name").val()+"</a> <a href='#'  onClick='deleteTLDProcess(\""+$("#domainreg_tld_config_hash_name").val()+"\");return false;'>[delete]</a></li>"
  $("#processList").append(listItem);

  allTldProcesses[$("#domainreg_tld_config_hash_name").val()] =  $("#domainreg_tld_config_hash").val();

  // Clear form
  $("#domainreg_tld_config_hash_name").val("");
  $("#domainreg_tld_config_hash").val("");
}

function loadTLDProcess(processName) {
    $("#domainreg_tld_config_hash_name").val(processName);
    $("#domainreg_tld_config_hash").val(allTldProcesses[processName] );
    $("#processList li[id='"+processName+"']").remove();
    $("#tld_processes input[id='tld_process_" + processName+ "'").remove();
}

function deleteTLDProcess(processName) {
  $("#processList li[id='"+processName+"']").remove();
  $("#tld_processes input[id='tld_process_" + processName+ "']").remove();
}

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
  $("#serverConsole").show();
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
    if(data.done == "ok")
    {
      updateProgressBar('#serverProgressbar', "100%");
      $("#serverAlertSuccess").html("All done! The server was added succesfully!");
      $("#serverAlertSuccess").show();
      $("#nextStep").show();

    }
  }
});
