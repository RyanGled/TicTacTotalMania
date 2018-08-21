pragma solidity ^0.4.24;

import "../installed_contracts/zeppelin/contracts/math/SafeMath.sol";

/** @title Tic Tac Total Mania */
contract TicTacTotalMania {

    using SafeMath for uint;
    bool public stoppedInEmergency = false;
    struct EmergencyVote {
        bool isInSupport;
        string reasonGiven;
    }
    mapping (address => EmergencyVote) public Votes;

    //Initialise a minimum stake
    uint256 public stake = 0.01 ether;
    mapping (address => uint) public pendingWithdrawals;

    uint public sizeOfBoard = 3;
    address[3][3] public gameBoard;
    bool isGameActive;

    uint numOfMoves;
    address public firstPlayer;
    address public secondPlayer;
    address public currActivePlayer;

    uint256 timeout = 30 minutes;
    uint256 nextTimeoutPhase;

    event PlayerHasJoined(address player);
    event NextPlayersTurn(address player);
    event Win(address winningPlayer);
    event Draw();
    event Payout(uint256 amountWithdrawn, address playerWithdrawn);

    modifier allowedUnlessEmergency { 
        if (!stoppedInEmergency) {
            _;
        }
    }
    modifier onlyInEmergency { 
        if (stoppedInEmergency) {
            _;
        }  
    }

    
    /** @dev Create an instance of the contract. NOTE: Minimum amount defined in stake var.
      */
    constructor() public payable {
        //Check first player has sent at least an equal amount of Ether to start game.
        require(msg.value >= stake, "Initial value must be at least 0.01 Ether");
        
        //If initialised Ether value is HIGHER than minimum cost, the first player is setting a higher stake.
        //It is up to the second player whether they are happy to stake the same amount.
        if (msg.value > stake) {
            stake = msg.value;
        }

        // playWithMutations = mutatorsOn;

        firstPlayer = msg.sender;
    }

    /** @dev Allows a second player to join once contract is instantiated, as long as second player hasn't already joined.
      */
    function join() public payable allowedUnlessEmergency {
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
    
    /** @dev Returns existing Gameboard instance.
      * @return existingGameBoard The existing gameboard, including already-claimed places by players.
      */
    function returnBoard() public view returns(address[3][3] existingGameBoard) {
        return gameBoard;
    }

    /** @dev Places a player's piece on the gameboard, as long as place is free.
      * @param xPos Position as per X axis on board
      * @param yPos Position as per y axis on board
      */
    function placePiece(uint8 xPos, uint8 yPos) public allowedUnlessEmergency {
        //Ensure a piece isn't already on position.
        require(gameBoard[xPos][yPos] == address(0x0), "Game piece already exists on this square!");
        //Ensure players aren't trying to play outside of their turn!
        require(msg.sender == currActivePlayer, "You may not place a piece outside of your turn");
        //Ensure game hasn't timed out
        require(nextTimeoutPhase > now, "This game has timed out");
        //Ensure player isn't trying to play a completed game.
        assert(isGameActive == true);
        //Ensure pieces aren't placed out of scope of the board.
        assert(xPos < sizeOfBoard);
        assert(yPos < sizeOfBoard);

        //Claim position for player
        gameBoard[xPos][yPos] = msg.sender;
        //SafeMath ++
        numOfMoves = numOfMoves.add(1);
        //Reset Timeout
        nextTimeoutPhase = (now + timeout);

        checkForWinner(xPos, yPos);
    }

    /** @dev Finds the next player and updates state after a previous player's turn.
      */
    function findNewActivePlayer() internal {
        //Ensure the address is one of our players!
        require((currActivePlayer == firstPlayer) || (currActivePlayer == secondPlayer), "Not a valid player");

        if (currActivePlayer == firstPlayer) {
            currActivePlayer = secondPlayer;
        } else if (currActivePlayer == secondPlayer) {
            currActivePlayer = firstPlayer;
        }

        emit NextPlayersTurn(currActivePlayer);
    }

    /** @dev Checks for a winner on the gameboard; diagonally; x-axis; y-axis wins are all valid, as well as a draw.
      * @param xPos Position as per X axis on board
      * @param yPos Position as per y axis on board
      */
    function checkForWinner(uint8 xPos, uint8 yPos) internal {
        //Check for y axis win
        for (uint8 i = 0; i < sizeOfBoard; i++) {
            if (gameBoard[i][yPos] != currActivePlayer) {
                break;
            }

            if (i == sizeOfBoard.sub(1)) {
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

            if (i == sizeOfBoard.sub(1)) {
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

                if (i == sizeOfBoard.sub(1)) {
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
                

                if (i == sizeOfBoard.sub(1)) {
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

    /** @dev Crowns a winner, and assigns the contract balance as winnings.
      * @param winner Player winner
      */
    function placeCrown(address winner) private {
        isGameActive = false;
        //Assign winnings to winner
        pendingWithdrawals[winner] = address(this).balance;
        emit Win(winner);
    }

    /** @dev Assigns game result as a draw, assigns balance as winnings equally between both players.
      */
    function isDraw() private {
        isGameActive = false;
        //Assign winnings divided equally
        uint balanceToShare = (address(this).balance / 2);
        pendingWithdrawals[firstPlayer] = balanceToShare;
        pendingWithdrawals[secondPlayer] = balanceToShare;
        emit Draw();
    }

    /** @dev Pull payment functionality which transfers pre-approved amounts via placeCrown() or isDraw().
      */
    function withdraw() public {
        require(pendingWithdrawals[msg.sender] != 0, "You have no Ether to withdraw");
        uint amountToWithdraw = pendingWithdrawals[msg.sender];
        // Zero the transfer before sending amount to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amountToWithdraw);
        emit Payout(amountToWithdraw, msg.sender);
    }

    /*
      Consideration and research needs to be undertaken on game theory & economic incentives during a timeout.
      Theoretically the time on the block can be gamed, with the one constraint that miners have being that the timestamp
      cannot be ahead of the current time. In theory the long-term mean of the timestamps should be more accurate, 
      but one needs to consider the possibility of a malicious miner 'timing out' the game unfairly when it looks like
      they are losing. A win cannot be cheated but a loss could be avoided.
      
      - This is called manually by one of the players.
    */
    /** @dev Unlocks funds once the contract's timeout period has passed on any one player's turn.
      */
    function unlockFundsAfterTimeout() public {
        //Game must be timed out & still active
        require(nextTimeoutPhase < now, "Game has not yet timed out");
        require(isGameActive == true, "Game has already been rendered inactive.");

        if (currActivePlayer == firstPlayer) {
            placeCrown(secondPlayer);
        } else if (currActivePlayer == secondPlayer) {
            placeCrown(firstPlayer);
        }
    }

    /** @dev DAO-like implementation which allows the first player (in the event of no second player) 
    or both players to agree on an emergency stop, allowing withdrawal of funds.
      * @param voteInFavour boolean as to whether the player is in favour of an emergency stop. 
      * @param reason Reason given for voting, either in favour or not, of an emergency stop.
      */
    function voteEmergencyStop(bool voteInFavour, string reason) public {
        Votes[msg.sender].isInSupport = voteInFavour;
        Votes[msg.sender].reasonGiven = reason;

        if (Votes[firstPlayer].isInSupport && Votes[secondPlayer].isInSupport) {
            //Both players have voted to stop the game.
            stoppedInEmergency = true;
        }
        if (Votes[firstPlayer].isInSupport && secondPlayer == address(0x0)) {
            //Only one player has joined so far, thus they hold all voting power.
            stoppedInEmergency = true;
            pendingWithdrawals[firstPlayer] = address(this).balance;
        }
    }

    /** @dev Unlocks funds and divides equally ONLY once an Emergency Stop vote has passed successfully.
      */
    function unlockFundsInEmergency() public onlyInEmergency {
        isDraw();
    }

}