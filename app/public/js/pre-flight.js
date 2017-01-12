/* eslint-disable no-undef */

$(document).ready(function () {
  var start_pre_flight_button = document.getElementById('start_pre_flight_button')

  if (start_pre_flight_button) {
    start_pre_flight_button.addEventListener('click', function () {
      startPreFlight()
    }, false)
  }

  if (window.location.href.includes('pre-flight')) {
    updateTaskStatus()
    updateTimer = window.setInterval(updateTaskStatus, 5000)
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
  $.get('/servers/tasks/pre_flight', function (taskData) {

    for (var i = 0; i < taskData.length; i++) {
      var taskName = taskData[i].task_id
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id
      var currentNode = 0;
      // Match the task with the server in environmentModel

      $.get('/restate-machines/' + taskData[i].run_id, function (data) {
        var input = JSON.parse(data.Input)
        var result = data
        for (var e = 0; e < environmentModel.servers().length; e++) {
          for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
            for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
              if (typeof environmentModel.servers()[e].members()[m].nodes != 'undefined' && environmentModel.servers()[e].members()[m].nodes()[nodeId].hostname() == input.hostname) {
                console.log(input.hostname)


                var status = JSON.parse(result.StatusMessage)
                if(status.status === 'failed') {
                $("#pre-flight-failed").show()
                }
                environmentModel.servers()[e].members()[m].nodes()[currentNode].preflight_status(status)

              }
            }
          }
        }
      })
}
})
}
