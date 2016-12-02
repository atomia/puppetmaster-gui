var express = require('express')
var router = express.Router()
var PlatformOption = require('../platform-options/model')
var Server = require('./model')
var fs = require('fs')
var multer = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/root')
  },
  filename: function (req, file, cb) {
    cb(null, 'amazon.key')
  }
})

var upload = multer({ storage: storage  })

router.get('/', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName

  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {

    PlatformOption.getAllRoles(function (roleData) {
      if(data) {
        var platData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""));
      }
      Server.getAWSConfig(function (awsData) {
        res.render('servers/servers', { awsData: awsData, platformData: platData, roleData: roleData, selectedEnvironment: selectedEnvironmentData })
      })
    },
    function (error) {
      error.message = 'Could not load roles'
      next(error)
    })

  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })
})

router.get('/tasks/:taskType', function (req, res, next) {
  var task_type = req.params.taskType

  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
    var environmentId = data.id
    Server.getAllTasks(environmentId, task_type, function (taskData) {
      res.json(taskData)
    },
    function (error) {
      error.message = 'Could not load tasks'
      next(error)
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })
})

router.get ('/roles/:fqdn', function (req, res, next) {
  var fqdn = req.params.fqdn
  PlatformOption.getRolesForHostname(fqdn, function (data) {
    res.json (data)
  },
  function (error) {
    error.message = 'Could not fetch roles'
    next(error)
  }
)
})

router.post('/tasks', function (req, res, next) {
  var taskData = JSON.parse(req.body.task)
  Server.updateTask(taskData, function () {
    res.json({ status: 'ok' })
  },
  function (error) {
    error.message = 'Could not update task'
    next(error)
  })
})

router.post('/key', upload.single('privateKey'), function (req, res) {
  fs.chmodSync('/root/amazon.key', '0400');
  res.json({ status: 'ok' })
})
router.post('/aws', function (req, res, next) {
  var awsData = JSON.parse(req.body.awsData)
  Server.saveAWSConfig(awsData, function () {
    res.json({ status: 'ok' })
  },
  function (error) {
    error.message = 'Could not update task'
    next(error)
  })
})
router.post('/schedule', function (req, res, next) {
  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
    var environmentData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""))
    var environmentId = data.id
    environmentData.environmentName = req.cookies.platformName
    Server.scheduleEnvironmentFromJson(environmentId, environmentData, function() {
      if (!res.headerSent) {
        res.json({'status': 'ok'})
        return
      }
    },
    function (error) {
      error.message = 'Could not load schedule new tasks'
      next(error)
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })

})

router.get('/export', function (req, res, next) {
  var readme = `In order to create a usable RoyalTS file please follow the directions below carefully. These steps are a bit bulky and we are trying to find a better way!\r\n
  1. Open the royalts file atomia.rtsx\r\n
  2. Go to file -> import -> csv\r\n
  3. Select Object Type: Terminal connection\r\n
  4. Browse for the csv file "linux_servers.csv"\r\n
  5. Click next until done\r\n
  6. Go to file -> import -> csv\r\n
  7. Select Object Type: Remote desktop connection\r\n
  8. Browse for the csv file "windows_servers.csv"\r\n
  9. Click next until you get to the CSV Mapping step\r\n
  10. Add 3 new mappings for the following\r\n
    CredentialMode | $CredentialMode$\r\n
    CredentialUsername | $CredentialUsername$\r\n
    CredentialPassword | $CredentialPassword$\r\n
  11. Click next\r\n
  12. Save the file and Close RoyalTS completely\r\n
  13. Run the fil runme.bat\r\n
  14. Open atomia.rtsx again and you are good to go!\r\n
  `
  var runme = `@echo off
  setlocal enableextensions disabledelayedexpansion

  set "search=atomia.key"
  set "replace=%cd%\\atomia.key"

  set "textFile=atomia.rtsx"

  for /f "delims=" %%i in ('type "%textFile%" ^& break ^> "%textFile%" ') do (
    set "line=%%i"
    setlocal enabledelayedexpansion
    set "line=!line:%search%=%replace%!"
    >>"%textFile%" echo(!line!
      endlocal
    )`

    var royaltTS = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
    <NewDataSet>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>RoyalObjectType</Key>
    <Value>RoyalDocument</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>ID</Key>
    <Value>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>Modified</Key>
    <Value>11/28/2016 14:11:19</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>Name</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>Created</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>ModifiedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>CreatedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>PositionNr</Key>
    <Value>0</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>IsExpanded</Key>
    <Value>True</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>DocumentType</Key>
    <Value>Workspace</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>PreConnectTaskName</Key>
    <Value />
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>CredentialUsername</Key>
    <Value />
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>CredentialPassword</Key>
    <Value />
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>CredentialId</Key>
    <Value>00000000-0000-0000-0000-000000000000</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>CredentialName</Key>
    <Value />
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>SaveOption</Key>
    <Value>1</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</ObjectID>
    <Key>FileName</Key>
    <Value>C:\Users\stefan\Documents\stefantest\atomia (13)\atomia.rtsx</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>RoyalObjectType</Key>
    <Value>RoyalTrash</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>ID</Key>
    <Value>bf9a901c-769a-462a-9544-9ed8e451bcd4</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>Modified</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>Name</Key>
    <Value>Trashcan</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>Created</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>ModifiedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>CreatedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>PositionNr</Key>
    <Value>1</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>IsExpanded</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>bf9a901c-769a-462a-9544-9ed8e451bcd4</ObjectID>
    <Key>ParentID</Key>
    <Value>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>RoyalObjectType</Key>
    <Value>RoyalFolder</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>ID</Key>
    <Value>098f8a82-8e14-4eb1-b31c-7f72181ac50b</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>Modified</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>Name</Key>
    <Value>Connections</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>Created</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>ModifiedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>CreatedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>PositionNr</Key>
    <Value>3</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>IsExpanded</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>IsDynamic</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>ParentID</Key>
    <Value>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>098f8a82-8e14-4eb1-b31c-7f72181ac50b</ObjectID>
    <Key>ObjectSpecialUsage</Key>
    <Value />
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>RoyalObjectType</Key>
    <Value>RoyalFolder</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>ID</Key>
    <Value>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>Modified</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>Name</Key>
    <Value>Credentials</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>Created</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>ModifiedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>CreatedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>PositionNr</Key>
    <Value>5</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>IsExpanded</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>IsDynamic</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>ParentID</Key>
    <Value>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>e0bb6b83-ece4-4f49-8115-95ad3fa3adca</ObjectID>
    <Key>ObjectSpecialUsage</Key>
    <Value />
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>RoyalObjectType</Key>
    <Value>RoyalFolder</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>ID</Key>
    <Value>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>Modified</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>Name</Key>
    <Value>Tasks</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>Created</Key>
    <Value>11/28/2016 14:11:01</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>ModifiedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>CreatedBy</Key>
    <Value>atomia</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>PositionNr</Key>
    <Value>7</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>IsExpanded</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>IsDynamic</Key>
    <Value>False</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>ParentID</Key>
    <Value>49113be4-2cb0-4c62-b9da-2c7f5fbe3607</Value>
    </KeyValuePairs>
    <KeyValuePairs>
    <ObjectID>6bfd21c6-71d2-46a8-808f-a2b3f83ebbe0</ObjectID>
    <Key>ObjectSpecialUsage</Key>
    <Value />
    </KeyValuePairs>
    </NewDataSet>`

    var linuxCSV = '"Name","Description","CustomField1","CustomField2","CustomField3","CustomField4","CustomField5","CustomField6","CustomField7","CustomField8","CustomField9","CustomField10","CustomField11","CustomField12","CustomField13","CustomField14","CustomField15","CustomField16","CustomField17","CustomField18","CustomField19","CustomField20","URI","Port","PhysicalAddress","PrivateKeyPath","Passphrase","Path"\n'

    var windowsCSV = '"Name","Description","CustomField1","CustomField2","CustomField3","CustomField4","CustomField5","CustomField6","CustomField7","CustomField8","CustomField9","CustomField10","CustomField11","CustomField12","CustomField13","CustomField14","CustomField15","CustomField16","CustomField17","CustomField18","CustomField19","CustomField20","URI","RDPPort","PhysicalAddress","DesktopWidth","DesktopHeight","ColorDepth","ConnectToAdministerOrConsole","SmartReconnect","SmartSizing","EnableWindowsKey","StartProgram","WorkDir","CredentialMode","CredentialUsername","CredentialPassword","AudioRedirectionMode","AudioCaptureRedirectionMode","RedirectPrinters","RedirectClipboard","RedirectSmartCards","RedirectPorts","RedirectDrives","Drives","AllowFontSmoothing","AllowDesktopComposition","AllowWallpaper","AllowFullWindowDrag","AllowMenuAnimations","AllowThemes","BitmapPersistence","EnableAutoReconnect","AllowMouseCursorShadow","AllowTextCursorBlinking","AuthenticationLevel","GatewayUsageMethod","GatewayHostName","GatewayCredentialMode","GatewayUsername","GatewayPassword","Path"\n'

    PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
      var environmentData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""))
      environmentData.environmentName = req.cookies.platformName
      var servers = environmentData.servers
      for (var categoryId = 0; categoryId < servers.length; categoryId++) {
        for (var memberId = 0; memberId < servers[categoryId].members.length; memberId++) {
          if(servers[categoryId].members[memberId].selected == true) {
            //serverList.push(servers[categoryId].members[memberId])
            for(var nodeId = 0; nodeId < servers[categoryId].members[memberId].nodes.length; nodeId++) {
              if(servers[categoryId].members[memberId].operating_system == 'ubuntu') {
                linuxCSV = linuxCSV + '"' + servers[categoryId].members[memberId].name + '_' + nodeId + '",' // Name
                linuxCSV = linuxCSV + '"",' // Description
                linuxCSV = linuxCSV + '"","","","","","","","","","","","","","","","","","","","",' // 20 custom fields
                linuxCSV = linuxCSV + '"' + servers[categoryId].members[memberId].nodes[nodeId].hostname + '",' // URI
                linuxCSV = linuxCSV + '"22",' // Port
                linuxCSV = linuxCSV + '"",' // Physical address
                linuxCSV = linuxCSV + '"atomia.key",' // PrivateKeyPath
                linuxCSV = linuxCSV + '"",' // Passphrase
                linuxCSV = linuxCSV + '"connections",\n' // Path
              } else {
                windowsCSV = windowsCSV + '"' + servers[categoryId].members[memberId].name + '_' + nodeId + '",' // Name
                windowsCSV = windowsCSV + '"",' // Description
                windowsCSV = windowsCSV + '"","","","","","","","","","","","","","","","","","","","",' // 20 custom fields
                windowsCSV = windowsCSV + '"' + servers[categoryId].members[memberId].nodes[nodeId].hostname + '",' // URI
                windowsCSV = windowsCSV + '"3389",' // Port
                windowsCSV = windowsCSV + '"",' // Physical address
                windowsCSV = windowsCSV + '"0",' // DesktopWidth
                windowsCSV = windowsCSV + '"0",' // DesktopHeight
                windowsCSV = windowsCSV + '"24",' // ColorDepth
                windowsCSV = windowsCSV + '"False",' // ConnectToAdministerOrConsole
                windowsCSV = windowsCSV + '"False",' // SmartReconnect
                windowsCSV = windowsCSV + '"False",' // SmartSizing
                windowsCSV = windowsCSV + '"False",' // EnableWindowsKey
                windowsCSV = windowsCSV + '"",' // StartProgram
                windowsCSV = windowsCSV + '"",' // WorkDir
                windowsCSV = windowsCSV + '"2",' // CredentialMode
                windowsCSV = windowsCSV + '"Administrator",' // CredentialUsername
                windowsCSV = windowsCSV + '"' + servers[categoryId].members[memberId].nodes[nodeId].password + '",' // CredentialPassword
                windowsCSV = windowsCSV + '"0",' // AudioRedirectionMode
                windowsCSV = windowsCSV + '"False",' // AudioCaptureRedirectionMode
                windowsCSV = windowsCSV + '"False",' // RedirectPrinters
                windowsCSV = windowsCSV + '"True",' // RedirectClipboard
                windowsCSV = windowsCSV + '"False",' // RedirectSmartCards
                windowsCSV = windowsCSV + '"False",' // Drives
                windowsCSV = windowsCSV + '"False",' // AllowFontSmoothing
                windowsCSV = windowsCSV + '"",' // AllowDesktopComposition
                windowsCSV = windowsCSV + '"True",' // AllowFullWindowDrag
                windowsCSV = windowsCSV + '"False",' // AllowMenuAnimations
                windowsCSV = windowsCSV + '"True",' // AllowThemes
                windowsCSV = windowsCSV + '"True",' // BitmapPersistence
                windowsCSV = windowsCSV + '"True",' // EnableAutoReconnect
                windowsCSV = windowsCSV + '"True",' // AllowMouseCursorShadow
                windowsCSV = windowsCSV + '"True",' // AllowTextCursorBlinking
                windowsCSV = windowsCSV + '"False",' // AuthenticationLevel
                windowsCSV = windowsCSV + '"True",' // GatewayUsageMethod
                windowsCSV = windowsCSV + '"True",' // GatewayHostName
                windowsCSV = windowsCSV + '"0",' // GatewayCredentialMode
                windowsCSV = windowsCSV + '"0",' // GatewayPassword
                windowsCSV = windowsCSV + '"",' // Path
                windowsCSV = windowsCSV + '"0",' // Path
                windowsCSV = windowsCSV + '"",' // Path
                windowsCSV = windowsCSV + '"",' // Path
                windowsCSV = windowsCSV + '"connections",\n' // Path

              }
            }
          }
        }
      }

      Server.getAWSConfig(function(aws) {
        var fs = require('fs');
        fs.writeFileSync('/tmp/linux_servers.csv', linuxCSV)
        fs.writeFileSync('/tmp/windows_servers.csv', windowsCSV)
        fs.writeFileSync('/tmp/atomia.rtsx', royaltTS)
        fs.writeFileSync('/tmp/runme.bat', runme)
        fs.writeFileSync('/tmp/README.txt', readme)
        /* eslint-disable no-unused-vars */
        var zip = require('express-zip');
        /* eslint-enable no-unused-vars */
        res.zip([
          { path: '/tmp/linux_servers.csv', name: 'linux_servers.csv' },
          { path: '/tmp/windows_servers.csv', name: 'windows_servers.csv' },
          { path: '/root/.ssh/' + aws.private_key + '.pem', name: 'atomia.key'},
          { path: '/tmp/runme.bat', name: 'runme.bat'},
          { path: '/tmp/README.txt', name: 'README.txt'},
          { path: '/tmp/atomia.rtsx', name: 'atomia.rtsx'},
        ], 'atomia.zip');
      })
    },
    function (error) {
      error.message = 'Could not load environment'
      next(error)
    })

  })


  module.exports = router
