
## Avoiding Common Attacks

**Reentrancy**

In order to avoid reentrancy, external functions (especially withdrawals within the `withdraw()` function) aren't called until internal checks and updates have been completed, example given below.

> pendingWithdrawals[msg.sender] = 0;
> msg.sender.transfer(amountToWithdraw);

**Integer underflow & overflow**

My only concerns here were the below:

`for (i = 0; i < sizeOfBoard; i++) {`

This is negated as sizeOfBoard is a static value and remains unchanged throughout.

`numOfMoves++;`

This is also negated, as even with a maximum number of moves taken to force a draw, the integer value will only ever be as high as 9, as there is only 9 squares available to place a piece on.

**DoS with (Unexpected) revert**

The contract uses a pull payment system, so does not `send` to a possible malicious contract.

**Forcibly Sending Ether to a Contract**

The payable function `join()` explicitly only allows two players to join the game, so any forcibly-sent Ether (say, through a malicious contract's `selfdestruct`) will only mean that the two valid players are paid an extra bonus!