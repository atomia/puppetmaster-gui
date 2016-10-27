/* eslint-disable no-undef */

$(document).ready(function () {
  var advanced_buttons = document.getElementsByClassName('advanced_button')


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


})
