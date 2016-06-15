var currentReportStep = 0;
exports.getReports = function (hostname, callback) {
	if (hostname != 'undefined' && hostname.length > 0) {
		var q = '/v3/reports?query=' + encodeURIComponent('["=", "certname", "' + hostname + '"]');
		puppetDbRequest(q, null, function (result) {
			getRunStatus(JSON.parse(result), callback);
		});
	} else {
		callback([]);
	}
};
exports.getLatestReportAndEvents = function (hostname, callback) {
	if (hostname != 'undefined' && hostname.length > 0) {
		var q = '/v3/reports?query=' + encodeURIComponent('["=", "certname", "' + hostname + '"]');
		puppetDbRequest(q, null, function (result) {
			if(result.length > 0) {
				getRunStatus(JSON.parse(result), function (report) {
					if (report.length > 0) {
						exports.getEvents(report[0].hash, function (events) {
							callback(report[0], events);
						});
					} else {
						callback([], []);
					}
				});
			}
			else
				callback([]);
		});
	} else {
		callback([]);
	}
};
exports.getEvents = function (reportId, callback) {
	var q = '/v3/events?query=' + encodeURIComponent('["=", "report", "' + reportId + '"]');
	puppetDbRequest(q, null, function (result) {
		callback(JSON.parse(result));
	});
};
function comp(a, b) {
	return new Date(a['end-time']).getTime() - new Date(b['end-time']).getTime();
}
function isReportReady(reportSize, result, callback) {
	if (currentReportStep >= reportSize) {
		callback(result.sort(comp).reverse());
		currentReportStep = 0;
	} else
		currentReportStep++;
}
function getRunStatus(report, callback) {
	parsedReport = [];
	if (report.length <= 1)
		callback([]);
	for (var i = 0; i < report.length - 1; i++) {
		var q = '/v3/events?query=' + encodeURIComponent('["and", ["=", "status", "failure"],["=", "report", "' + report[i].hash + '"]]');
		args = {
			'report': report,
			'i': i
		};
		puppetDbRequest(q, args, function (result, rep) {
			if (JSON.parse(result).length > 0)
				stat = 'failure';
			else
				stat = 'successful';
			r = {
				'status': stat,
				'hash': rep.report[rep.i].hash,
				'start-time': rep.report[rep.i]['start-time'],
				'end-time': rep.report[rep.i]['end-time']
			};
			parsedReport.push(r);
			isReportReady(report.length - 2, parsedReport, callback);
		});
	}
}
function puppetDbRequest(query, args, callback) {
	var http = require('http');
	var options = {
		port: 8080,
		hostname: '127.0.0.1',
		method: 'GET',
		path: query
	};
	parseRequest = function (response) {
		var str = '';
		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function (chunk) {
			str += chunk;
		});
		//the whole response has been recieved, so we just print it out here
		response.on('end', function () {
			callback(str, args);
		});
	};
	http.request(options, parseRequest).end();
}