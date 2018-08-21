## What is TicTacTotalMania?

TicTacTotalMania is an EVM-inspired turn-based, multiplayer version of the well-known game - Tic Tac Toe.
It allows player one to deploy a contract, pass the address of the contract to a second player, and that player may then join.
Players then take it in turns to place pieces by submitting changes of state to the deployed contract, until a result is found. The contract then divides up the value of the contract in turn, and allows winners/drawing players to withdraw.

## How to set up
- Download project, then extract OR Clone via CLI: `git clone https://github.com/RyanGled/TicTacTotalMania.git`
-  `cd tic-tac-totalmania` from project root
-  `npm install` (this will take some time to complete, and you may see some warnings from packages. It is safe to ignore these.)
- Start Ganache via the GUI (recommended), OR via CLI:
-  `npm install -g ganache-cli`, then `ganache-cli`
- (RPC server should be: http://127.0.0.1:8545)
-  `truffle compile` (ignore SafeMath.sol warnings - these are from an EthPM library)
-  `truffle migrate`
- Run Truffle testing suite: `truffle test`
-  `npm start` - Angular should build, and you shoud receive a 'Compiled successfully' message.
- Navigate to http://localhost:4200/
- TicTacTotalMania is a peer-to-peer, two-player game. Should you be unable to test with a peer, simply use two browsers with the Metamask extension installed (I used Brave; https://brave.com/ and Chrome). Start a game with one browser, and join with the second. You should see them update simultaneously as they receive events/logs from the chain.
- Please note: sometimes events are missed, as the subscription via Web3 (1.0.x) and websockets are in beta currently. Just refresh if you think an event has been missed (you may check a transaction status on Etherscan https://rinkeby.etherscan.io/), and the chain data should be retrieved as expected.
- Please note: Ganache does not support websocket event subscriptions, so a player will need to refresh manually to see updates on the UI. *Therefore I highly recommend Rinkeby is used for now*
- Enjoy! Remember to change Metamask to use Rinkeby before playing.

## What I would do differently/improve upon
- I would implement a specialised state channel to allow users to only pay to open/close the contract. The rest of the functionality would then be free, with moves being agreed and counter-signed by both parties until the contract is closed (https://counterfactual.com/ are working on a framework to make this task easier). 
The risk of funds becoming stuck and the consideration of dispute processes made this too lengthy and out of scope for this project. Another (more difficult) option would have been to implement a sidechain. Some projects such as Loom (https://loomx.io/developers/docs/en/web3js-loom-provider-truffle.html) are attempting to provide a turnkey solution to host your own sidechain/nodes, or you may soon use Loom tokens to host 'ZombieChain'; an EOS-like DPOS solution that can be easily spun up and apps deployed to for a fee. Others, like OmiseGo (https://github.com/omisego/plasma-mvp), are attempting to create an MVP of Plasma (initial idea by Joseph Poon and Vitalik Buterin; https://plasma.io/) that can be easily replicated by future developers.

- Event/Log watching in Web3 1.0.x is still very inconsistent as it is in Beta. It also needs Websocket (ws or wss support), which I have currently solved with Infura integration.
I would likely attempt to host a local node to connect to, or implement polling on top of the WS Event/Log watching as a fallback method.

- Finality could become a problem with a live implementation. PlacePiece() currently only waits for a single block confirmation before acting, whereas waiting for >1 block confirmation would exponentially reduce the chance of double-spend attacks, or the risk of a transaction being included as a transaction within an Uncle/Ommer block and therefore not part of the canonical chain.

- I have implemented a 'Time Lock' to ensure user's funds cannot be locked up. Without this, a 'Tragedy of the Commons' could occur whereby a user joins a contract, and then refuses to act further - thus both user's deposits into the contract would be locked thereon. The time lock ensures that after a period of 30 minutes of inactivity, either player may release their deposited funds and it is then distributed equally.
However, This is clearly a rather serious design flaw, as a player that is certain they will lose can just invoke a timeout and have their funds returned rather than losing them altogether. I have since rewritten this portion of the contract to penalise the player who has timed out with an automatic loss.

- I would implement an interface to store all active instances of the contract within a parent contract (or perhaps a JSON file hosted by IFPS) and enable a frontend to allow players to browse and join games that are awaiting a second player pseudonymously without having to be explicitly given the contract address.

- I would have used Protactor, Cypress, Nightwatch or something similar to implement End to End testing.

- I was planning to implement RNG in order to mutate the board unexpectedly; for example switching the pieces between players as a type of mutiny. There are many considerations to take into account when creating an RNG on the blockchain. Contrary to popular belief you cannot use the blocknumber, time, or anything else considered random as these can be manipulated by miners. Miners are able to alter blocktimes or withhold blocks completely, should the potential gains from withholding a block outweigh the block reward. To counter these issues I would have used Oraclize for RNG, or an off-chain Mersenne twister solution but did not have time to complete.

- Implemented a version of TicTacTotalMania in Vyper, to make full use of the language's simplicity and ease of writing secure code.