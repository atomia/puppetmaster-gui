var fs = require('fs')
var FileHelper = function () { }

// Read all files in a directory
FileHelper.readFiles = function (dirname, onFileContent, onError) {
  var fileCount = 0
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err)
      return
    }
    filenames.forEach(function (filename) {
      fs.readFile(dirname + filename, 'utf-8', function (err, content) {
        if (err) {
          onError(err)
          return
        }
        fileCount++
        onFileContent(filename, content, fileCount, filenames.length)
      })
    })
  })
}

module.exports = FileHelper
