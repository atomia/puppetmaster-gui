/* eslint-disable no-undef */

$(document).ready(function () {
  var advanced_buttons = document.getElementsByClassName('advanced_button')
  var save_puppet_config = document.getElementById('save_puppet_config')

  if (save_puppet_config) {
    save_puppet_config.addEventListener('click', function () {
      savePuppetConfig()
    }, false)
  }

  if (advanced_buttons) {
    for (var i = 0; i < advanced_buttons.length; i++) {
      advanced_buttons[i].addEventListener('click', function () {
        toggleAdvanced(this)
      }, false)
    }
  }



  function toggleAdvanced (item) {
    $(item).parent().parent().parent().find(".advanced").toggle(100, function() {
      if($(item).parent().parent().parent().find(".advanced").is(":visible")) {
        $(item).removeClass('Icon--plus')
        $(item).addClass('Icon--minus')
      } else {
        $(item).removeClass('Icon--minus')
        $(item).addClass('Icon--plus')
      }
    })

  }

  // Saves the current knockout model to the database
  function savePuppetConfig() {
    $.post('', {configuration: ko.toJSON(environmentModel)}, function (data) {
      console.log('saved')
    })
  }

})
