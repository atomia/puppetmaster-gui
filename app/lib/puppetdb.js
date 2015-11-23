

var currentReportStep = 0;
exports.getReports = function (hostname, callback) {
	if( hostname != 'undefined'){
	var q = "/v3/reports?query=" + encodeURIComponent('["=", "certname", "' + hostname + '"]');
	puppetDbRequest(q, null, function(result) {
		getRunStatus(JSON.parse(result), callback);
	});
	}
}

exports.getEvents = function (reportId, callback) {

	var q = "/v3/events?query=" + encodeURIComponent('["=", "report", "' + reportId + '"]');
	puppetDbRequest(q, null, function(result) {
		console.log(result);
		callback(JSON.parse(result));
	});

}


function comp(a, b) {
    return new Date(a["end-time"]).getTime() - new Date(b["end-time"]).getTime();
}

function isReportReady(reportSize, result,callback){
	console.log("isReportReady" + reportSize + " " + currentReportStep);
	if(currentReportStep >= reportSize)
	{

		callback(result.sort(comp).reverse());
		currentReportStep = 0;
	}
	else
		currentReportStep++;
}
function getRunStatus(report, callback){
	parsedReport = [];
	for(var i = 0; i < report.length -1; i++) {
		console.log(report.hash);
		var q = "/v3/events?query=" + encodeURIComponent('["and", ["=", "status", "failure"],["=", "report", "'+report[i].hash+'"]]');
		args = {
			'report' : report,
			'i' : i
		};
		puppetDbRequest(q, args, function(result, rep) {
			console.log(result);
			if(JSON.parse(result).length > 0)
				stat = "failure";
			else
				stat = "successful";

			console.log(rep['i']);
			r = {
				'status' :stat,
				'hash': rep['report'][rep['i']].hash,
				'start-time': rep['report'][rep['i']]["start-time"],
				'end-time': rep['report'][rep['i']]["end-time"]
			};
			parsedReport.push(r);

			//callback(result);
			isReportReady(report.length -2, parsedReport, callback)
			//report[i].status = getRunStatus(json[i].hash)
		});

	}

}

function puppetDbRequest(query, args, callback)
{

	var http = require("http");
	var options = {
      port: 8080,
      hostname: '127.0.0.1',
      method: 'GET',
      path: query
    };

	parseRequest = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	    callback(str,args);
	  });
	}

	http.request(options, parseRequest).end();
}
