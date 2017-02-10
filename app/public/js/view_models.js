/* eslint no-unused-vars: [0, { "vars": "local" }] */

var environmentModel = {}

function computedModel () {
  this.countServers = function (os) {
    var serverCount = 0
    for (var i = 0; i < environmentModel.servers().length; i++) {
      for (var s = 0; s < environmentModel.servers()[i].members().length; s++) {
        var curServer = environmentModel.servers()[i].members()[s]
        if (curServer.node_count() > 0 && typeof curServer !== 'undefined' && curServer.selected() === true && curServer.operating_system() === os) {
          serverCount++
        }
      }
    }
    return serverCount
  }
}
