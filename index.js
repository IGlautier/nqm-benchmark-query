var Promise = require("bluebird");
var TDXApi = require("nqm-api-tdx");
var argv = require("minimist")(process.argv.slice(2));
var math = require("mathjs");
var _ = require("lodash");

var filter = require("./filter.json");
var projection = require("./projection.json");
var options = require("./options.json");

var config = {
  commandHost: "https://cmd.nq-m.com",
  queryHost: "https://q.nq-m.com"  
};

var api = new TDXApi(config);
Promise.promisifyAll(api);

var run = function(remaining, results, cb) {
  if (remaining >= 0) {
    console.log("Runs left: %d", remaining);
    const start = process.hrtime();
    api.getDatasetDataAsync(datasetId, filter, projection, options)
    .then(() => {
      results.push(process.hrtime(start)[1]);
      remaining--;
      run(remaining, results, cb);
    })
    .catch((err) => {
      console.log("Run failed, aborting: ", err);
      remaining--;
    });

  } else {
    cb(results);
  }
}

var stats = function(results) {
  var std = math.std(results);
  var mean = math.mean(results);
  _.remove(results, (result) => {
    if (result > mean) return mean + 2 * std < result;
    else return mean - 2 * std > result;
  });
  console.log("Median execution time from %d runs with outliers excluded was %d milliseconds", results.length, Math.round(math.median(results) / 1000000));
};

var nRuns = argv.nRuns;
var remaining = nRuns;
var datasetId = argv.datasetId;

run(remaining, [], stats);
