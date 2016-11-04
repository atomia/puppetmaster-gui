/* eslint-disable no-undef */

$(document).ready(function () {
  var create_aws_environment_button = document.getElementById('create_aws_environment_button')
  var save_environment_button = document.getElementById('save_environment_button')
  if (create_aws_environment_button) {
    create_aws_environment_button.addEventListener('click', function () {
      createAWSEnvironment()
    }, false)
  }
  if (save_environment_button) {
    save_environment_button.addEventListener('click', function () {
      saveData()
    }, false)
  }

  if (window.location.href.includes('servers')) {
    updateProvisioningStatus()
    updateTimer = window.setInterval(updateProvisioningStatus, 2000)
  }
})

var updateTimer

function createAWSEnvironment () {
  // Schedule the jobs in the database
  $.post('/servers/schedule', {}, function (data) {
    $('#create_aws_environment_button').hide()
    $('#environment-loading').show()
  })
  /*
  {
  "data": {
  "machine": "create_ec2_server",
  "key_name": "stefan-test-aws",
  "instance_name": "Atomia-Test",
  "vpc_id": "vpc-ad0f6ac9",
  "ami": "ami-ed82e39e",
  "type": "t2.micro",
  "security_groups": [{
  "name": "Test_group",
  "rules": [{
  "name": "Allow_SSH",
  "protocol": "tcp",
  "port": 22,
  "cidr": "0.0.0.0/0"
}]
}],
"existing_security_groups": ["default"]
}
}
*/
}

function updateProvisioningStatus () {
  $.get('/servers/tasks', function (taskData) {

    for (var i = 0; i < taskData.length; i++) {
      var taskName = taskData[i].task_id
      console.log(taskData[i])
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id

      // Match the task with the server in environmentModel
      for (var e = 0; e < environmentModel.servers().length; e++) {
        for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
          status = ''
          if (environmentModel.servers()[e].members()[m].name() === taskName) {
            console.log(taskName);
            (function (taskData, e, m, i) {
              var runId = taskData[i].run_id
              console.log(runId)
              $.get('/restate-machines/' + runId, function (data) {
                var result = JSON.parse(data)
                var status = JSON.parse(result.Input).status

                var hostname = JSON.parse(result.Input).public_dns
                var password = JSON.parse(result.Input).password
                if (taskStatus === 'done') {
                  status = 'provisioning finished'
                  if(typeof password != 'undefined') {
                    environmentModel.servers()[e].members()[m].password(password)
                  }
                  if (allDone()) {
                    $('#environment-loading').hide()
                    $('#provisioning-complete').show()
                    $('#create_aws_environment_button').hide()
                    window.clearInterval(updateTimer)
                  }
                } else {
                  if (typeof status === 'undefined') {
                    switch (result.LastState) {
                      case 'create_security_groups':
                      status = 'creating security groups'
                      case 'create_server':
                      status = 'creating the server'
                      break
                      case 'configure_server':
                      status = 'configuring server'
                      break
                      case 'fetch_admin_password':
                      status = 'waiting for admin password'
                      break
                      default:
                      status = JSON.parse(data).LastState
                    }
                  }
                  else {
                    switch(status) {
                      case 'ok':
                      status = 'provisioning finished'
                      // This is the first time we have noticed that provisioning is finished so let's update the task status
                      taskData[i].status = 'done'
                      $.post('/servers/tasks/', {task: JSON.stringify(taskData[i])}, function (data) {

                      })
                      break
                      default:
                      status = 'provisioning not started'
                    }
                  }
                }
                environmentModel.servers()[e].members()[m].provisioning_status(status)
                environmentModel.servers()[e].members()[m].hostname(hostname)
              })
            })(taskData, e, m, i)
          }
        }
      }

      for (var e = 0; e < environmentModel.servers().length; e++) {
        for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
          if (environmentModel.servers()[e].members()[m].provisioning_status() === '') {
            environmentModel.servers()[e].members()[m].provisioning_status('waiting to start provisioning')
          }
        }
      }

    }
  })
}

function allDone (envornmentModel){
  var enabledServers = 0
  var doneServers = 0
  for (var e = 0; e < environmentModel.servers().length; e++) {
    for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
      if (environmentModel.servers()[e].members()[m].selected() == true) {
        enabledServers++
        if(environmentModel.servers()[e].members()[m].hostname !== '') {
          doneServers++
        }
      }
    }
  }

  if (enabledServers == doneServers)
  return true

  return false
}

function saveData () {
  $.ajax({
    url: '/platform-options',
    type: 'PUT',
    success: function () {
      console.log("data saved")
    },
    data: { name: environmentName, platformData: ko.toJSON(environmentModel)}
  })
}
