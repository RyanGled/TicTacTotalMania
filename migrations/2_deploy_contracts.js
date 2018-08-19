var TicTacTotalMania = artifacts.require("TicTacTotalMania");

module.exports = function(deployer) {
  deployTicTacTotalMania(deployer);
};

function deployTicTacTotalMania(deployer) {

  //Deploy contract with 0.1 ETH (100000000000000000 Wei)
  return deployer.deploy(TicTacTotalMania, {value: web3.toWei(0.1, "ether")});

}