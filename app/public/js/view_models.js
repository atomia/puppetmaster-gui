/* eslint no-unused-vars: [0, { "vars": "local" }] */

var environmentModel = {}

function computedModel () {
  this.countServers = function (os) {
    var serverCount = 0
    for (var i = 0; i < environmentModel().length; i++) {
      for (var s = 0; s < environmentModel()[i].members().length; s++) {
        var curServer = environmentModel()[i].members()[s]
        if (typeof curServer !== 'undefined' && curServer.selected() === true && curServer.operating_system() === os) {
          serverCount++
        }
      }
    }
    return serverCount
  }
}
