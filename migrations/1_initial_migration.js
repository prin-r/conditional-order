const Migrations = artifacts.require("Migrations");
const ConditionalOrder = artifacts.require("ConditionalOrder");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
