var express = require('express')
var router = express.Router()
var PlatformOption = require('./model')

router.get('/', function (req, res, next) {
	PlatformOption.getAllEnvironments(function (data) {
		if (data) {
			console.log(data.data)
			environment = data.data[0]
			res.render('platform-options/platform-options', { environments: data.data, environment: data.data[0] })
		}
	},
	function (error) {
		error.message = 'Could not load environments from the file system'
		next(error)
	})
})

module.exports = router
