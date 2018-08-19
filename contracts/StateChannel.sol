pragma solidity ^0.4.24;

// import "./RandomNumber.sol";
// import "./CoinToss.sol";

// contract StateChannel is CoinToss, RandomNumber {
//     Game public CoinToss;

//     uint8 numOfPlays;

//     bytes32[9] outputSessionState;
//     bytes32[3] outputRoundState;

//     address public firstPlayer;
//     address public secondPlayer;
//     uint256 public amountStaked;
//     uint256 public firstPlayerBalance;
//     uint256 public secondPlayerBalance;
//     bool public isGameFinished;

//     bytes32 currentSeed;
//     bytes32 nextSeed;

//     uint256 public timeout;
//     uint256 public timeoutLeft= 2**256 - 1;

//     event StateChannelOpened(address firstPlayer, address secondPlayer);
//     event StartTimeout();
//     event Play(uint8 numOfPlays, int winLoss);

//     /**
//     * Start a game with the 'house' (first player, who deploys the contract).
//     * Specify a timeout 
//     */
//     constructor(uint256 _timeout) public payable {
//         firstPlayer = msg.sender;
//         firstPlayerBalance = msg.value;
//         timeout = _timeout;
//     }

//     function joinGame() public payable {
//         require(msg.value == firstPlayerBalance, "Deposit amount too low.");
//         require(secondPlayer == 0, "Game has already started.");

//         secondPlayer = msg.sender;
//         secondPlayerBalance = msg.value;

//         emit StateChannelOpened(firstPlayer, secondPlayer);
//     }

//     // RNG
//     function getCombinedSeed(bytes32 _house, bytes32 _player) pure internal returns (bytes32 combinedSeed) {
//         return keccak256(_house, _player);
//     }

//     function validateRng(bytes32 _currentSeed, bytes32 _nextSeed) internal pure returns (bool) {
//         // only need to check that RNG is progressing and 
//         if (keccak256(_nextSeed) != _currentSeed) {
//             return false;
//         }

//         return true;
//     }

//     function advanceState(
//         bytes32 nextHouseSeed, bytes32 nextPlayerSeed, uint256 playerStake, bool action, uint8 nonce) 
//         internal view 
//         returns (bytes32[30] newState)
//     {
//         //Prevent race conditions or cheating by matching the nonces with the current contract
//         require(numOfPlays >= nonce, "Incorrect nonce, please try again");

//         bytes32 combinedSeed = getCombinedSeed(nextHouseSeed, nextPlayerSeed);

//         int winLoss;

//         (winLoss, outputRoundState, outputSessionState) = startRound(
//             playerStake,
//             combinedSeed,
//             action
//         );

//         bytes32 message = prefixed(keccak256(address(this), seq, num));
//         require(recoverSigner(message, sig) == opponentOf(msg.sender));

//         numOfPlays += 1;
//         timeoutLeft = 2**256 - 1;
//         emit Play(numOfPlays, winLoss);
//     }

//     function startTimeout() public {
//         require(!gameOver, "Game has ended.");
//         require(state.whoseTurn == opponentOf(msg.sender),
//             "Cannot start a timeout on yourself.");

//         timeout = now + timeoutInterval;
//         emit TimeoutStarted();
//     }

//     function claimTimeout() public {
//         require(!gameOver, "Game has ended.");
//         require(now >= timeout);

//         gameOver = true;
//         opponentOf(state.whoseTurn).transfer(address(this).balance);
//     }


//     // Signature methods

//     function splitSignature(bytes sig)
//     internal
//     pure
//     returns (uint8, bytes32, bytes32)
//     {
//         require(sig.length == 65);

//         bytes32 r;
//         bytes32 s;
//         uint8 v;

//         assembly {
//             // first 32 bytes, after the length prefix
//             r := mload(add(sig, 32))
//             // second 32 bytes
//             s := mload(add(sig, 64))
//             // final byte (first byte of the next 32 bytes)
//             v := byte(0, mload(add(sig, 96)))
//         }

//         return (v, r, s);
//     }

//     function recoverSigner(bytes32 message, bytes sig)
//     internal
//     pure
//     returns (address)
//     {
//         uint8 v;
//         bytes32 r;
//         bytes32 s;

//         (v, r, s) = splitSignature(sig);

//         return ecrecover(message, v, r, s);
//         }

//         // Builds a prefixed hash to mimic the behavior of eth_sign.
//         function prefixed(bytes32 hash) internal pure returns (bytes32) {
//         return keccak256("\x19Ethereum Signed Message:\n32", hash);
//     }
// }