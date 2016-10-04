var fh = require('../lib/file_helper')

var PlatformOption = function (data) {
	this.data = data
}

PlatformOption.prototype.data = {}

PlatformOption.getAllEnvironments = function (callback, onError) {
	var environments = []
	fh.readFiles('config/environments/', function (filename, content, count, total) {
		environment = JSON.parse(content)
		environments[environment.priority] = environment
		if (count === total) {
			callback(new PlatformOption(environments))
		}
	}, function (err) {
		onError(err)
	})
}

module.exports = PlatformOption
