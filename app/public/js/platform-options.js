/* eslint-disable no-undef */

$(document).ready(function () {
  var new_environment_button = document.getElementById('new_environment_button')
  var existing_environment_button = document.getElementById('existing_environment_button')
  var new_environment_selectors = document.getElementsByClassName('new_environment_select')
  var existing_environment_selectors = document.getElementsByClassName('existing_environment_select')
  var create_environment_button = document.getElementById('create_environment_button')

  if (typeof selectedEnvironmentData !== 'undefined') {
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
    $('.Selected-box').removeClass('Selected-box')
    $(selectorDiv).addClass('Selected-box')
    $('#environment_name').show()
  }

  function createEnvironment () {
    var environmentName = $('#environment_name_input').val()
    var templateName = $('.Selected-box').attr('id')
    if (environmentName !== '' && templateName !== '') {
      $.post('', {name: environmentName, template: templateName}, function (data) {

      })
    } else {
      alert('Please fill in a name for the new environment')
    }
  }

  function loadEnvironment (environmentName) {
    var selectedId
    $('.Selected-box').removeClass('Selected-box')
    $("[id='" + environmentName + "']").addClass('Selected-box')
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
          data: { name: environmentName }
        })
      }
    }

    $('#customization').show('slow')
    $('#requirements').show()
  }
})
