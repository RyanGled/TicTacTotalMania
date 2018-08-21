## What is TicTacTotalMania?

TicTacTotalMania is an EVM-inspired turn-based, multiplayer version of the well-known game - Tic Tac Toe.

It allows player one to deploy a contract, pass the address of the contract to a second player, and that player may then join.

Players then take it in turns to place pieces by submitting changes of state to the deployed contract, until a result is found. The contract then divides up the value of the contract in turn, and allows winners/drawing players to withdraw.

## How to set up

## What I would do differently/improve upon given more time

- I would have implemented a specialised state channel to allow users to only pay to open/close the contract, and the rest of the functionality would be free, with moves being agreed and signed by both parties. The risk of funds becoming stuck and the dispute process made this too lengthy.

- Event/Log watching in Web3 1.0.x is still very inconsistent as it is in Beta. It also needs Websocket (ws or wss support), which I have currently solved with Infura integration.
I would likely attempt to host a local node to connect to, or implement polling on top of the WS Event/Log watching as a fallback method.

- Finality could become a problem with a live implementation. PlacePiece() currently only waits for a single block confirmation before acting, whereas waiting for >1 block confirmation would reduce the chance of double-spend attacks, or the transaction being include inside an Uncle/Ommer block and therefore not being part of the canonical chain.

- I have implemented a 'Time Lock' to ensure user's funds cannot be locked up. Without this, a 'Tragedy of the Commons' could occur whereby a user joins a contract, and then refuses to act further - thus the users deposits into the contract would be locked thereon. The time lock ensures that after a period of 30 minutes of activity, either player may release their deposited funds and it would be distributed equally.
However, This is clearly a rather serious design flaw, as a player that is certain they will lose can just invoke a timeout and have their funds returned rather than losing them altogether. I have since rewritten this portion of the contract to penalise the player who has timed out with an automatic loss.

- I would implement an interface to store all active instances of the contract within a parent contract (or perhaps a JSON file hosted by IFPS) and enable a frontend to allow players to join games anonymously without having to be explicitly given the contract address.

- I would have used Protactor, Cypress, Nightwatch or something similar to implement End to End testing.

 - I was planning to implement RNG in order to mutate the board unexpectedly, but there are many considerations to take into account when creating an RNG on the blockchain. Contrary to popular belief you cannot use the blocknumber, time, or anything else considered random as these can be manipulated by miners. I would have used Oraclize for RNG, or an off-chain Mersenne twister solution but did not have time to complete.