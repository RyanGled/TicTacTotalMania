/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  //JSONRPC
  // networks: {
  //   development: {
  //   host: "localhost",
  //   port: 8545,
  //   network_id: "*" // Match any network id
  //  }
  // } 
  //GANACHE LOCAL
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      host: "localhost",
      from: "0x0085f8e72391Ce4BB5ce47541C846d059399fA6c",
      port: 8545,
      network_id: 4,
      gas: 5000000
    }
  } 
};
