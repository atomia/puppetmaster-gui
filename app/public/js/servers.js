/* eslint-disable no-undef */

$(document).ready(function () {
  var create_aws_environment_button = document.getElementById('create_aws_environment_button')
  if (create_aws_environment_button) {
    create_aws_environment_button.addEventListener('click', function () {
      createAWSEnvironment()
    }, false)
  }
})

function createAWSEnvironment () {
  // Schedule the jobs in the database
  $.post('/servers/schedule', {}, function (data) {

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
            if (taskStatus === 'done') {
              environmentModel()[e].members()[m].provisioning_status(success + ' provisioning finished')
              continue
            }
            (function (taskData, e, m, i) {
              var runId = taskData[i].run_id
              $.get('/restate-machines/' + runId, function (data) {
                var result = JSON.parse(data)
                var status = JSON.parse(result.Input).status
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
                environmentModel()[e].members()[m].provisioning_status(status)
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
