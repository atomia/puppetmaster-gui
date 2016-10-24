/* eslint-disable no-undef */

$(document).ready(function () {
  var create_aws_environment_button = document.getElementById('create_aws_environment_button')
  if (create_aws_environment_button) {
    create_aws_environment_button.addEventListener('click', function () {
      createAWSEnvironment()
    }, false)
  }
  updateProvisioningStatus()
  updateTimer = window.setInterval(updateProvisioningStatus, 2000)
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
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id
      var loading = '<span class="Icon Icon--loading Icon--small" style="color: #373333"><span class="Icon-label"></span></span>'
      var success = '<i class="fa fa-check" aria-hidden="true"></i>'
      var pending = '<i class="fa fa-clock-o" aria-hidden="true"></i>'

      // Match the task with the server in environmentModel
      for (var e = 0; e < environmentModel().length; e++) {
        for (var m = 0; m < environmentModel()[e].members().length; m++) {
          if (environmentModel()[e].members()[m].name() === taskName) {
            (function (taskData, e, m, i) {
              var runId = taskData[i].run_id
              $.get('/restate-machines/' + runId, function (data) {
                var result = JSON.parse(data)
                var status = JSON.parse(result.Input).status
                var hostname = JSON.parse(result.Input).public_dns
                var password = JSON.parse(result.Input).password
                if (taskStatus === 'done') {
                  environmentModel()[e].members()[m].provisioning_status(success + ' provisioning finished')
                  environmentModel()[e].members()[m].hostname(hostname)
                  environmentModel()[e].members()[m].password(password)
                  if (allDone) {
                    $('#environment-loading').hide()
                    $('#provisioning-complete').show()
                    $('#create_aws_environment_button').hide()
                    window.clearInterval(updateTimer)
                  }
                } else {

                  if (typeof status === 'undefined') {
                    switch (result.LastState) {
                      case 'create_security_groups':
                      status = loading + ' creating security groups'
                      case 'create_server':
                      status = loading + ' creating the server'
                      break
                      case 'configure_server':
                      status = loading + ' configuring server'
                      break
                      case 'fetch_admin_password':
                      status = loading + ' waiting for admin password'
                      break
                      default:
                      status = JSON.parse(data).LastState
                    }
                  }
                  else {
                    switch(status) {
                      case 'ok':
                      status = success + ' provisioning finished'
                      // This is the first time we have noticed that provisioning is finished so let's update the task status
                      taskData[i].status = 'done'
                      $.post('/servers/tasks/' + taskStatus, {task: JSON.stringify(taskData[i])}, function (data) {

                      })
                      break
                      default:
                      status = 'provisioning not started'
                    }
                  }
                }
                environmentModel()[e].members()[m].provisioning_status(status)
                environmentModel()[e].members()[m].hostname(hostname)
              })
            })(taskData, e, m, i)
          }
        }
      }

      for (var e = 0; e < environmentModel().length; e++) {
        for (var m = 0; m < environmentModel()[e].members().length; m++) {
          if (environmentModel()[e].members()[m].provisioning_status() === '') {
            environmentModel()[e].members()[m].provisioning_status(pending + ' waiting to start provisioning')
          }
        }
      }

    }
  })
}

function allDone (envornmentModel){
  var enabledServers = 0
  var doneServers = 0
  for (var e = 0; e < environmentModel().length; e++) {
    for (var m = 0; m < environmentModel()[e].members().length; m++) {
      if (environmentModel()[e].members()[m].selected() == true) {
        enabledServers++
        if(environmentModel()[e].members()[m].hostname !== '') {
          doneServers++
        }
      }
    }
  }

  if (enabledServers == doneServers)
    return true

  return false
}
