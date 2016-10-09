/* eslint-disable no-undef */

$(document).ready(function () {
  var new_environment_button = document.getElementById('new_environment_button')
  var existing_environment_button = document.getElementById('existing_environment_button')
  var new_environment_selectors = document.getElementsByClassName('new_environment_select')
  var existing_environment_selectors = document.getElementsByClassName('existing_environment_select')
  var create_environment_button = document.getElementById('create_environment_button')
  var view_requirements_button = document.getElementById('viewRequirementsButton')
  var change_environment_button = document.getElementById('changeEnvironmentButton')

  if (typeof selectedEnvironmentData !== 'undefined' && selectedEnvironmentData !== 'undefined' && selectedEnvironmentData !== '') {
    $('#currentEnvironmentTitle').html('Currently loaded environment: ' + selectedEnvironmentData)
    $('#currentEnvironmentBar').show()
    toggleEnvironmentSelector('#existing_environment_div', '#new_environment_div')
    loadEnvironment(selectedEnvironmentData)
  }
  if (new_environment_button) {
    new_environment_button.addEventListener('click', function () {
      toggleEnvironmentSelector('#new_environment_div', '#existing_environment_div')
    }, false)
  }

  if (existing_environment_button) {
    existing_environment_button.addEventListener('click', function () {
      toggleEnvironmentSelector('#existing_environment_div', '#new_environment_div')
    }, false)
  }

  if (new_environment_selectors) {
    for (var i = 0; i < new_environment_selectors.length; i++) {
      new_environment_selectors[i].addEventListener('click', function () {
        showNewEnvironmentOptions(this)
      }, false)
    }
  }

  if (existing_environment_selectors) {
    for (var a = 0; a < existing_environment_selectors.length; a++) {
      existing_environment_selectors[a].addEventListener('click', function () {
        loadEnvironment($(this).attr('id'))
      }, false)
    }
  }

  if (create_environment_button) {
    create_environment_button.addEventListener('click', function () {
      createEnvironment()
    }, false)
  }

  if (view_requirements_button) {
    view_requirements_button.addEventListener('click', function () {
      viewRequirements()
    }, false)
  }

  if (change_environment_button) {
    change_environment_button.addEventListener('click', function () {
      resetCookies()
    }, false)
  }

  function toggleEnvironmentSelector (div1, div2) {
    $('#live_or_existing_div').hide('slow')
    if ($(div2).is(':visible')) {
      $(div2).hide('fast', function () {
        $(div1).toggle('slow')
      })
    } else {
      $(div1).toggle('slow')
    }
  }

  function showNewEnvironmentOptions (selectorDiv) {
    $('.Box--selected').removeClass('Box--selected')
    $(selectorDiv).addClass('Box--selected')
    $('#environment_name').show()
  }

  function createEnvironment () {
    var environmentName = $('#environment_name_input').val()
    var templateName = $('.Box--selected').attr('id')
    if (environmentName !== '' && templateName !== '') {
      $.post('', {name: environmentName, template: templateName}, function (data) {

      })
    } else {
      alert('Please fill in a name for the new environment')
    }
  }

  function loadEnvironment (environmentName) {
    var selectedId
    $('.Box--selected').removeClass('Box--selected')
    $("[id='" + environmentName + "']").addClass('Box--selected')
    for (var i = 0; i < existingEnvironments.length; i++) {
      if (existingEnvironments[i].name === environmentName) {
        selectedId = i
        $.ajax({
          url: '',
          type: 'PUT',
          success: function () {
            environmentModel = ko.mapping.fromJS(existingEnvironments[selectedId].servers)
            ko.applyBindings(environmentModel, document.getElementById('mainView'))
            ko.applyBindings(computedModel, document.getElementById('counterView'))
          },
          data: { name: environmentName, platformData: JSON.stringify(existingEnvironments[selectedId])}
        })
      }
    }

    $('#customization').show('slow')
    $('#requirements').show()
  }

  function viewRequirements () {
    // Save changes to the cookie
    console.log(JSON.stringify(ko.toJSON(environmentModel)))
    $.ajax({
      url: '',
      type: 'PUT',
      success: function () {
        window.location.replace('/platform-options/requirements')
      },
      data: { platformData: JSON.stringify(ko.toJSON(environmentModel))}
    })
  }

  function resetCookies () {
    $.ajax({
      url: '/platform-options/cookies',
      type: 'DELETE',
      success: function () {
        window.location.replace('/platform-options')
      }
    })
  }
})
