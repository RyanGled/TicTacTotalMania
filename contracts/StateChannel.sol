pragma solidity ^0.4.23;

import "./RandomNumber.sol";

contract StateChannel {
    struct Game {
        bytes32 combinedSeed;
        address playersTurn;
    }
    Game public gameState;
    
    uint private constant ACTION_BET_HEAD_TAIL = 0;

    uint private constant ROUND_STATE_PREVIOUS_FLIP = 0;
    uint private constant ROUND_STATE_STAKE = 2;
    uint private constant ROUND_STATE_TOTAL_WINNINGS = 3;

    bytes32[9] outputSessionState;
    bytes32[3] outputRoundState;

    address public firstPlayer;
    address public secondPlayer;
    uint256 public amountStaked;
    uint256 public firstPlayerBalance;
    uint256 public secondPlayerBalance;
    bool public isGameFinished;

    bytes32 currentSeed;
    bytes32 nextSeed;

    uint256 public timeoutInterval;
    uint256 public timeout = 1**256 - 1;

    event StateChannelOpened();
    event StartTimeout();
    // event Play(address player, bytes32 combinedSeed, );

    constructor(uint256 _timeoutInterval) public payable {
        firstPlayer = msg.sender;
        firstPlayerBalance = msg.value;
        timeoutInterval = _timeoutInterval;
    }

    function joinGame() public payable {
        require(secondPlayer == 0, "Game has already started.");
        require(msg.value == firstPlayerBalance, "Deposit amount too low.");

        secondPlayer = msg.sender;
        secondPlayerBalance = msg.value;

        emit StateChannelOpened();
    }

    // RNG
    function getCombinedSeed(bytes32 house, bytes32 player) pure internal returns (bytes32 combinedSeed) {
        return keccak256(house, player);
    }

    function validateRng(bytes32 currentSeed, bytes32 nextSeed) internal pure returns (bool) {
        // only need to check that RNG is progressing and 
        if (keccak256(nextSeed) != currentSeed) {
            return false;
        }

        return true;
    }

    function advanceState(bytes32 nextHouseSeed, bytes32 nextPlayerSeed, uint256 playerStake, bool action) internal view returns (bytes32[30] newState) {

        bytes32 combinedSeed = getCombinedSeed(nextHouseSeed, nextPlayerSeed);

        uint winloss;

        (winloss, outputRoundState, outputSessionState) = startRound(
            playerStake,
            combinedSeed,
            action
        );
    }

    function startRound(uint stake, bytes32 rngSeed, bool action) public pure returns (int winLoss, bytes32[3] outputRoundState, bytes32[9] outputSessionState) {
        //Check for valid balance etc, here.

        bool betOnHeads = action;
        bool isHeads = ((uint(rngSeed) & 1) == 1);

        winLoss = -int(stake);
        if (betOnHeads == isHeads) {
            outputRoundState[ROUND_STATE_TOTAL_WINNINGS] = bytes32(stake * 2);
        }

        outputRoundState[ROUND_STATE_STAKE] = bytes32(stake);
        outputRoundState[ROUND_STATE_PREVIOUS_FLIP] = bytes32(isHeads ? 1 : 0);

        return (winLoss, outputRoundState, outputSessionState);
    }

    // // Timeout methods

    // function startTimeout() public {
    //     require(!gameOver, "Game has ended.");
    //     require(state.whoseTurn == opponentOf(msg.sender),
    //         "Cannot start a timeout on yourself.");

    //     timeout = now + timeoutInterval;
    //     emit TimeoutStarted();
    // }

    // function claimTimeout() public {
    //     require(!gameOver, "Game has ended.");
    //     require(now >= timeout);

    //     gameOver = true;
    //     opponentOf(state.whoseTurn).transfer(address(this).balance);
    // }


    // // Signature methods

    // function splitSignature(bytes sig)
    //     internal
    //     pure
    //     returns (uint8, bytes32, bytes32)
    // {
    //     require(sig.length == 65);

    //     bytes32 r;
    //     bytes32 s;
    //     uint8 v;

    //     assembly {
    //         // first 32 bytes, after the length prefix
    //         r := mload(add(sig, 32))
    //         // second 32 bytes
    //         s := mload(add(sig, 64))
    //         // final byte (first byte of the next 32 bytes)
    //         v := byte(0, mload(add(sig, 96)))
    //     }

    //     return (v, r, s);
    // }

    // function recoverSigner(bytes32 message, bytes sig)
    //     internal
    //     pure
    //     returns (address)
    // {
    //     uint8 v;
    //     bytes32 r;
    //     bytes32 s;

    //     (v, r, s) = splitSignature(sig);

    //     return ecrecover(message, v, r, s);
    // }

    // // Builds a prefixed hash to mimic the behavior of eth_sign.
    // function prefixed(bytes32 hash) internal pure returns (bytes32) {
    //     return keccak256("\x19Ethereum Signed Message:\n32", hash);
    // }
}