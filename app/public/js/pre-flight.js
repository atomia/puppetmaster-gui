/* eslint-disable no-undef */

$(document).ready(function () {
  var start_pre_flight_button = document.getElementById('start_pre_flight_button')

  if (start_pre_flight_button) {
    start_pre_flight_button.addEventListener('click', function () {
      startPreFlight()
    }, false)
  }

})

function startPreFlight () {
  $.post('/pre-flight/schedule', {}, function (data) {
    $('#create_aws_environment_button').hide()
    $('#environment-loading').show()
  })
}

function updateTaskStatus () {
  String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
  $.get('/servers/tasks', function (taskData) {

    for (var i = 0; i < taskData.length; i++) {
      var taskName = taskData[i].task_id
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id
      // Match the task with the server in environmentModel
      for (var e = 0; e < environmentModel.servers().length; e++) {
        for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
          status = ''
          if (taskName.contains('pre-flight') && taskName.contains(environmentModel.servers()[e].members()[m].name())) {

            (function (taskData, e, m, i) {
              var runId = taskData[i].run_id
              console.log(runId)
              $.get('/restate-machines/' + runId, function (data) {
                var result = JSON.parse(data)
                var status = JSON.parse(result.StatusMessage)
                console.log(status)
                switch(status.status) {
                  case 'error':
                    environmentModel.servers()[e].members()[m].preflight_status(status)
                  break
                }

              })
            })(taskData, e, m, i)
          }
        }
      }

      for (var e = 0; e < environmentModel.servers().length; e++) {
        for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
          if (environmentModel.servers()[e].members()[m].preflight_status() === '') {
            environmentModel.servers()[e].members()[m].preflight_status('pending')
          }
        }
      }

    }
  })
}
