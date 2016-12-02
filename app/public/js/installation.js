/* eslint-disable no-undef */

var installationStatus = []
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
  $.post('/installation/schedule', {orderId: 0}, function (data) {
    $('#start_installation_button').hide()
    $('#environment-loading').show()
  })
}

function updateInstallationTaskStatus () {
  String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
  $.get('/servers/tasks/installation', function (taskData) {
    for (var i = 0; i < taskData.length; i++) {
      console.log(i)
      var taskName = taskData[i].task_id
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id
      var currentNode = 0
      status = ''

      $.get('/restate-machines/' + taskData[i].run_id, function (data) {
        var input = JSON.parse(data.Input)
        var result = data
        for (var e = 0; e < environmentModel.servers().length; e++) {
          for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
            for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
              if (typeof environmentModel.servers()[e].members()[m].nodes != 'undefined' && environmentModel.servers()[e].members()[m].nodes()[nodeId].hostname() == input.hostname) {
                console.log(input.hostname)
                //  console.log(result.StatusMessage.replace(/'/g,'"'))
                var status = JSON.parse(result.StatusMessage)
                if(status.status === 'failed') {
                  // Do something if task failed?
                }

                if(typeof environmentModel.servers()[e].members()[m].nodes()[nodeId] != 'undefined') {
                  environmentModel.servers()[e].members()[m].nodes()[nodeId].installation_status(status)
                }
                break;
              }
            }
          }
        }
      })


      for (var order = 0; order < 10; order++) {
        var numDone = 0
        var totalOrder = 0
        for (var e = 0; e < environmentModel.servers().length; e++) {
          for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
            if(environmentModel.servers()[e].members()[m].name() != 'OpenStack' && environmentModel.servers()[e].members()[m].selected() == true && environmentModel.servers()[e].members()[m].provisioning_order() == order) {
              for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
                if(typeof environmentModel.servers()[e].members()[m].nodes != 'undefined') {
                  totalOrder++
                  console.log(environmentModel.servers()[e].members()[m].nodes()[nodeId].installation_status().status)
                  if (environmentModel.servers()[e].members()[m].nodes()[nodeId].installation_status().status == 'done') {
                    numDone++
                  }
                }
              }
            }
          }
        }

        //  console.log(environmentModel.servers()[e].members()[m].name() + ' ' + numDone + ' ' + environmentModel.servers()[e].members()[m].node_count())
        console.log(numDone + ' ' + totalOrder)
        if (numDone != 0 && numDone == totalOrder) {
          installationStatus[order] = 'done'

            // find the next order
            var foundCurrent = false
            var nextId = null
            for (var iO = 0; iO < 20; iO++) {
              if (typeof installationStatus[iO] != 'undefined') {
                if (foundCurrent == true) {
                  nextId = iO
                  break
                }
                if(iO == order) {
                  foundCurrent = true
                }
              }
            }
            // Found the next order, check if there are tasks created
            if(nextId != null && installationStatus[nextId] != 'done') {
              var taskCount = 0;
              var totalTasks = 0;
              for (var e = 0; e < environmentModel.servers().length; e++) {
                for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
                  if(environmentModel.servers()[e].members()[m].name() != 'OpenStack' && environmentModel.servers()[e].members()[m].selected() == true && environmentModel.servers()[e].members()[m].provisioning_order() == nextId) {
                    for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
                      totalTasks++
                      for (var ii = 0; ii < taskData.length; ii++) {
                        if(taskData[ii].input.contains(environmentModel.servers()[e].members()[m].nodes()[nodeId].hostname())) {
                          taskCount++
                        }
                      }
                    }
                  }
                }
              }
              if(taskCount == totalTasks) {
                console.log('all tasks created for ' + nextId)
              } else {
                // Tasks are not created so we should create them
                $.post('/installation/schedule', {orderId: nextId}, function (data) {
                  console.log('secheduled' + nextId)
                })
                break;
              }
            }

        }
        else if(totalOrder != 0) {
          installationStatus[order] = 'pending'
          //  console.log(order + ' not done')
          break
        }

      }





    }


  })
}
