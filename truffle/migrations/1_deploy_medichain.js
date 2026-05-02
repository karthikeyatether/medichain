const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const MediChain = artifacts.require("MediChain");

module.exports = async function (deployer) {
  await deployProxy(MediChain, [], { deployer, kind: 'uups' });
};
