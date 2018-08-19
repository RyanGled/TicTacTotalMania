pragma solidity ^0.4.24;

// import "github.com/oraclize/ethereum-api/blob/master/oraclizeAPI_0.5.sol";
// import "./oraclizeAPI_0.5.sol";

// contract TicTacTotalMania is usingOraclize {
contract TicTacTotalMania {

    /**
    * - what happens when Ether is sent to the contract beyond the initial stakes? Is it lost?
      - check withdrawal pattern
    */

    //Initialise a minimum stake
    uint256 public stake = 0.1 ether;
    mapping (address => uint) public pendingWithdrawals;

    uint8 public sizeOfBoard = 3;
    address[3][3] public gameBoard;
    bool isGameActive;

    uint8 numOfMoves;
    address public firstPlayer;
    address public secondPlayer;
    address public currActivePlayer;

    /** 
      Is there a DOS concern here? Could a player just DOS the contract until they are able to timeout/withdraw? 
      Is it also possible miners can cheat the timestamp and force a timeout if it looked like they were losing?
    */
    uint256 timeout = 5 minutes;
    uint256 nextTimeoutPhase;

    bool playWithMutations;
    string[3] MutationType = [
        "BOARD_SIZE_INCREASE",
        "BOARD_SIZE_DECREASE",
        "GAME_PIECE_MUTINY"
    ];

    uint256 public randomNumber;

    event PlayerHasJoined(address player);
    event NextPlayersTurn(address player);
    event Win(address winningPlayer);
    event Mutation(uint256 mutationType);
    event Draw();
    event Payout(uint256 amountWithdrawn, address playerWithdrawn);

    // constructor(bool mutatorsOn) public payable {
    constructor() public payable {
        //Check first player has sent at least an equal amount of Ether to start game.
        require(msg.value >= stake);
        
        //If initialised Ether value is HIGHER than minimum cost, the first player is setting a higher stake.
        //It is up to the second player whether they are happy to stake the same amount.
        if (msg.value > stake) {
            stake = msg.value;
        }

        // playWithMutations = mutatorsOn;

        firstPlayer = msg.sender;
    }

    function join() public payable {
        //Check that there isn't already a second player.
        assert(secondPlayer == address(0x0));
        //Check that player one isn't trying to join their own game!
        assert(firstPlayer != msg.sender);
        //Check that the second player has MATCHED the first player's stake. Anything more or less would be unfair.
        assert(msg.value == stake);

        secondPlayer = msg.sender;
        currActivePlayer = secondPlayer;
        isGameActive = true;
        nextTimeoutPhase = (now + timeout);
        emit PlayerHasJoined(secondPlayer);
    }
    
    function returnBoard() public view returns(address[3][3] existingGameBoard) {
        return gameBoard;
    }

    function placePiece(uint8 xPos, uint8 yPos) public payable {
        //Ensure a piece isn't already on position.
        require(gameBoard[xPos][yPos] == address(0x0));
        //Ensure players aren't trying to play outside of their turn!
        require(msg.sender == currActivePlayer);
        //Ensure game hasn't timed out
        require(nextTimeoutPhase > now);
        //Ensure player isn't trying to play a completed game.
        assert(isGameActive == true);
        //Ensure pieces aren't placed out of scope of the board.
        assert(xPos < sizeOfBoard);
        assert(yPos < sizeOfBoard);

        gameBoard[xPos][yPos] = msg.sender;
        numOfMoves++;
        nextTimeoutPhase = (now + timeout);

        checkForWinner(xPos, yPos);

        // if (playWithMutations) {
        //     oraclize_query("WolframAlpha", "random number between 0 and 100");
        // }
    }

    function findNewActivePlayer() internal {
        //Ensure the address is one of our players!
        require((currActivePlayer == firstPlayer) || (currActivePlayer == secondPlayer));

        if (currActivePlayer == firstPlayer) {
            currActivePlayer = secondPlayer;
        } else if (currActivePlayer == secondPlayer) {
            currActivePlayer = firstPlayer;
        }

        emit NextPlayersTurn(currActivePlayer);
    }

    function checkForWinner(uint8 xPos, uint8 yPos) internal {
        //Check for y axis win
        for (uint8 i = 0; i < sizeOfBoard; i++) {
            if (gameBoard[i][yPos] != currActivePlayer) {
                break;
            }

            if (i == sizeOfBoard - 1) {
                //Player has won
                placeCrown(currActivePlayer);
                return;
            }
        }

        //Check for x axis win
        for (i = 0; i < sizeOfBoard; i++) {
            if (gameBoard[xPos][i] != currActivePlayer) {
                break;
            }

            if (i == sizeOfBoard - 1) {
                //Player has won
                placeCrown(currActivePlayer);
                return;
            }
        }

        //Check for forward diagonal win
        if (xPos == yPos) {
            for (i = 0; i < sizeOfBoard; i++) {
                if (gameBoard[i][i] != currActivePlayer) {
                    break;
                }

                if (i == sizeOfBoard - 1) {
                    //Player has won
                    placeCrown(currActivePlayer);
                    return;
                }
            }
        }

        //Check for backward diagonal win
        if ((xPos + yPos) == sizeOfBoard - 1) {
            for (i = 0; i < sizeOfBoard; i++) {
                if (gameBoard[i][(sizeOfBoard-1)-i] != currActivePlayer) {
                    break;
                }
                

                if (i == sizeOfBoard - 1) {
                    //Player has won
                    placeCrown(currActivePlayer);
                    return;
                }
            }
        }

        //Check for Draw
        if (numOfMoves == (sizeOfBoard**2)) {
            isDraw();
            return;
        }
        
        //Find new active player IF nobody has won or drawn.
        findNewActivePlayer();
    }

    function placeCrown(address winner) private {
        isGameActive = false;
        pendingWithdrawals[winner] = address(this).balance;
        emit Win(winner);
    }

    function isDraw() private {
        isGameActive = false;
        uint balanceToShare = (address(this).balance / 2);
        pendingWithdrawals[firstPlayer] = balanceToShare;
        pendingWithdrawals[secondPlayer] = balanceToShare;
        emit Draw();
    }

    function withdraw() public {
        require(pendingWithdrawals[msg.sender] != 0, "You have no Ether to withdraw");
        uint amountToWithdraw = pendingWithdrawals[msg.sender];
        // require(amountToWithdraw > 0, "You have no Ether to withdraw");
        // Zero the transfer before sending amount to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amountToWithdraw);
        emit Payout(amountToWithdraw, msg.sender);
    }
    
    // function __callback(bytes32 myid, uint256 result) public {
    //     require(msg.sender == oraclize_cbAddress());
    //     mutateBoard(result);
    // }

    /** 
      Consideration and research needs to be undertaken on game theory & economic incentives here.
      In theory the time on the block can be gamed, with the one constraint that miners have being that the timestamp
      cannot be ahead of the current time. In theory the long-term mean of the timestamps should be more accurate, 
      but one needs to consider the possibility of a malicious miner 'timing out' the game unfairly when it looks like
      they are losing. A win cannot be cheated but a loss could be avoided.
      
      ** This is called manually by one of the players.
    */
    function unlockFundsAfterTimeout() public {
        //Game must be timed out & still active
        require(nextTimeoutPhase < now);
        require(isGameActive == true);

        isDraw();
    }

    /** MUTATIONS */
    function mutateBoard(uint256 randomNum) internal {
        //Board must not mutate below 3x3 or game is unwinnable
        //RNG determines type of mutation

        emit Mutation(randomNum);

        //Switch statement for type of mutation
    }
    /** MUTATIONS */

}