/* eslint-disable no-undef */

var installationStatus = []
var nextId = 0
var minOrder=null


$(document).ready(function () {
  var start_installation_button = document.getElementById('start_installation_button')
  var retry_provisioning_buttons = document.getElementsByClassName('retry_provisioning')
  var show_log_divs = document.getElementsByClassName('show_log_div')

  if (start_installation_button) {
    start_installation_button.addEventListener('click', function () {
      startInstallation()
    }, false)
  }

  if (retry_provisioning_buttons) {
    for (var a = 0; a < retry_provisioning_buttons.length; a++) {
      retry_provisioning_buttons[a].addEventListener('click', function () {
        retryProvisioning($(this).attr('id'))
      }, false)
    }
  }

  if (show_log_divs) {
    for (var a = 0; a < show_log_divs.length; a++) {
      show_log_divs[a].addEventListener('click', function () {
        $('.log_div', this).toggle();
      }, false)
    }
  }


  if (window.location.href.includes('installation')) {
    updateInstallationTaskStatus()
    updateTimer = window.setInterval(updateInstallationTaskStatus, 5000)
  }

  $('.provisioning_order').each(function() {
    var id = parseInt($(this).text(), 10);
    if ((minOrder===null) || (id < minOrder)) { minOrder = id; }
  });
  nextId = minOrder
  console.log(nextId)

})

function startInstallation () {
  var min=null
  $('.provisioning_order').each(function() {
    var id = parseInt($(this).text(), 10);
    if ((min===null) || (id < min)) { min = id; }
  });
  $.post('/installation/schedule', {orderId: min}, function (data) {
    $('#start_installation_button').hide()
    $('#environment-loading').show()
  })
}

function updateInstallationTaskStatus () {
  String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

  // Get all the current installation tasks
  $.get('/servers/tasks/installation', function (taskData) {
    // Loop through all current tasks
    for (var i = 0; i < taskData.length; i++) {
      var taskName = taskData[i].task_id
      var taskStatus = taskData[i].status
      var taskId = taskData[i].id
      var currentNode = 0
      status = ''
      // Fetch the restate machine information based on task run id
      $.get('/restate-machines/' + taskData[i].run_id, function (data) {
        var input = JSON.parse(data.Input)
        var result = data
        // Find the server in the local json configuration based on the hostname from the restate machine information
        for (var e = 0; e < environmentModel.servers().length; e++) {
          for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
            for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
              if (typeof environmentModel.servers()[e].members()[m].nodes != 'undefined' && environmentModel.servers()[e].members()[m].nodes()[nodeId].hostname() == input.hostname) {
                // We found the matching server update it's status
                console.log(input.hostname)
                try {
                  var tmpStatus = result.StatusMessage.split("|")
                  var status = {
                    status : tmpStatus[0],
                    message : tmpStatus[1],
                    output : tmpStatus[2],
                    running : data.RunningStateCode,
                    next_run: data.NextStateRun,
                    hostname: input.hostname
                  }
                  if(status.status === 'failed') {
                    $.ajax({
                      url: '/installation/task/' + result.id,
                      type: "PUT",
                      data:  {status:'failed'},
                      success: function(result){
                      }
                    })
                  }
                  if(typeof environmentModel.servers()[e].members()[m].nodes()[nodeId] != 'undefined') {
                    environmentModel.servers()[e].members()[m].nodes()[nodeId].installation_status(status)
                  }
                  break;
                }
                catch(err) {
                  console.log(err)
                  environmentModel.servers()[e].members()[m].nodes()[nodeId].installation_status({'status': {'status':'pending', 'message': result.StatusMessage}})
                  break;
                }
              }
            }
          }
        }
      })

      // Count how many servers are provisioned (done status), store the result in the numDone variable
      for (var order = 0; order < 10; order++) {
        var numDone = 0
        var totalOrder = 0
        for (var e = 0; e < environmentModel.servers().length; e++) {
          for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
            if(environmentModel.servers()[e].members()[m].name() != 'OpenStack' && environmentModel.servers()[e].members()[m].selected() == true && environmentModel.servers()[e].members()[m].node_count() > 0 && environmentModel.servers()[e].members()[m].provisioning_order() == order) {
              for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
                if(typeof environmentModel.servers()[e].members()[m].nodes != 'undefined') {
                  totalOrder++
                  if (environmentModel.servers()[e].members()[m].nodes()[nodeId].installation_status().status == 'done') {
                    numDone++
                  }
                }
              }
            }
          }
        }
      //  console.log('Done: ' + numDone + ' Order: ' + order + ' NextId: ' + nextId + ' Total: ' + totalOrder)
        // If we have finished all provisioning tasks in the current order we should initate provisioning of the next order
        // Done: 1 Order: 0 NextId: 0
        if (numDone != 0 && numDone == totalOrder && order == nextId) {
          console.log("want to proceed")
          console.log('done ' + numDone + ' ' + totalOrder + 'next ' + nextId + ' order '+order + ' next ' + nextId)
          installationStatus[order] = 'done'
          var foundOrder = false
          // Find the next defined order id
          for (var iO = order; iO < 20; iO++) {
            for (var e = 0; e < environmentModel.servers().length; e++) {
              for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
                if(environmentModel.servers()[e].members()[m].selected() == true && environmentModel.servers()[e].members()[m].node_count() > 0 && environmentModel.servers()[e].members()[m].provisioning_order() == iO){
                  if (typeof installationStatus[iO] == 'undefined' && !foundOrder) {
                    nextId = iO
                    foundOrder = true
                    break
                  }
                }
              }
            }
          }

          // Found the next order, check if there are tasks created
          if(nextId != null && installationStatus[nextId] != 'done' && nextId != order) {
            var taskCount = 0;
            var totalTasks = 0;
            for (var e = 0; e < environmentModel.servers().length; e++) {
              for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
                if(environmentModel.servers()[e].members()[m].name() != 'OpenStack' && environmentModel.servers()[e].members()[m].selected() == true && environmentModel.servers()[e].members()[m].node_count() > 0 && environmentModel.servers()[e].members()[m].provisioning_order() == nextId) {
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
              console.log(taskCount + ' ' + totalTasks)
              console.log('secheduling' + nextId)
              $.post('/installation/schedule', {orderId: nextId}, function (data) {
                console.log('secheduled' + nextId)
              })
              break;
            }
          }
        }
      }
    }
  })
}

function retryProvisioning(currentHostname) {
  console.log(currentHostname)
  var currentOrder = 0
  for (var e = 0; e < environmentModel.servers().length; e++) {
    for (var m = 0; m < environmentModel.servers()[e].members().length; m++) {
      for (var nodeId = 0; nodeId < environmentModel.servers()[e].members()[m].node_count(); nodeId++) {
        if (typeof environmentModel.servers()[e].members()[m].nodes != 'undefined' && environmentModel.servers()[e].members()[m].nodes()[nodeId].hostname() == currentHostname) {
          currentOrder = environmentModel.servers()[e].members()[m].provisioning_order()
        }
      }
    }
  }
  console.log(currentOrder)
  var foundTask = false
  $.get('/servers/tasks/installation', function (taskData) {
    for (var i = 0; i < taskData.length; i++) {
      if (taskData[i].input.indexOf(currentHostname) !== -1) {
        foundTask = true;
        (function (currentTask) {
          $.ajax({
            url: '/restate-machines/' + currentTask.run_id,
            type: "DELETE",
            success: function(result){
            }
          })
          $.ajax({
            url: '/servers/tasks/' + currentTask.id,
            type: "DELETE",
            success: function(result){
              $.post('/installation/schedule', {orderId: currentOrder}, function (data) {
                console.log('secheduled' + currentOrder)
              })
            }
          })
        })(taskData[i])
      }
    }
    if (!foundTask) {
      $.post('/installation/schedule', {orderId: currentOrder}, function (data) {
        console.log('secheduled' + currentOrder)
      })
    }
  })
}
