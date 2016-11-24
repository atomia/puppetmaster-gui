/* eslint-disable no-undef */

$(document).ready(function () {
  var start_installation_button = document.getElementById('start_installation_button')

  if (start_installation_button) {
    start_installation_button.addEventListener('click', function () {
      startInstallation()
    }, false)
  }

  if (window.location.href.includes('installation')) {
    updateInstallationTaskStatus()
    updateTimer = window.setInterval(updateInstallationTaskStatus, 5000)
  }
})

function startInstallation () {
  $.post('/installation/schedule', {}, function (data) {
    $('#start_installation_button').hide()
    $('#environment-loading').show()
  })
}

function updateInstallationTaskStatus () {
  String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
  $.get('/servers/tasks/installation', function (taskData) {

    for (var i = 0; i < taskData.length; i++) {
      var taskName = taskData[i].task_id
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id
      // Match the task with the server in environmentModel
      for (var e = 0; e < environmentModel.servers().length; e++) {
        for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
          status = ''
          if (taskName.contains(environmentModel.servers()[e].members()[m].name())) {

            (function (taskData, e, m, i) {
              var runId = taskData[i].run_id
              $.get('/restate-machines/' + runId, function (data) {

                console.log(data)
                var result = data
                console.log(result.StatusMessage.replace(/'/g,'"'))
                var status = JSON.parse(result.StatusMessage)
                if(status.status === 'failed') {
                    // Do something if task failed?
                }
                environmentModel.servers()[e].members()[m].installation_status(status)
              })
            })(taskData, e, m, i)
          }
        }
      }
      for (var e = 0; e < environmentModel.servers().length; e++) {
        for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
          if (environmentModel.servers()[e].members()[m].installation_status() === '') {
            environmentModel.servers()[e].members()[m].installation_status('pending')
          }
        }
      }

    }
  })
}
