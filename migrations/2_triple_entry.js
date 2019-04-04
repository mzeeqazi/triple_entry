const TripleEntry = artifacts.require('TripleEntry');
const web3Utils = require('web3-utils');


module.exports = function(deployer,accounts) {
      //console.log(deployer);
      //console.log("Zeeshan");

      deployer.deploy(TripleEntry);
}
