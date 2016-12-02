/* eslint-disable no-undef */

$(document).ready(function () {
  var advanced_buttons = document.getElementsByClassName('advanced_button')
  var save_puppet_config = document.getElementById('save_puppet_config')
  var generate_certificates_button = document.getElementById('generate_certificates_button')

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

  if (generate_certificates_button) {
    generate_certificates_button.addEventListener('click', function () {
      generateCertificates()
    }, false)
  }
console.log(certExists)
  if(certExists == true) {
    $("#have_cert").show()
  } else {
    $("#no_cert").show()
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

  function generateCertificates () {
    var appDomain = $('#appdomain').val()
    var loginUrl = $('#login_host').val()
    var orderUrl = $('#store_host').val()
    var billingUrl = $('#billing_host').val()
    var hcpUrl = $('#hcp_host').val()

    if(appDomain == '') {
      alert('You need to fill in the marked fields before proceeding')
      $("#appdomain").css('border-color','red')
      return
    }
    $("#generate_certificates_button").hide()
    $("#loading_cert").show()
    $("#appdomain").css('border-color','#d3d1ce')
    $.post('/puppet-config/certificate', {appDomain:appDomain,loginUrl:loginUrl,orderUrl:orderUrl,billingUrl:billingUrl,hcpUrl:hcpUrl}, function (data) {
      if(data.status == 0) {
        $("#have_cert").show()
        $("#no_cert").hide()
      }

      console.log(data)
    })
  }

})
