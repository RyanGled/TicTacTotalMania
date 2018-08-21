var TicTacTotalMania = artifacts.require("TicTacTotalMania");

contract('TicTacTotalMania', (accounts) => {
  
  const accountOne = accounts[0];
  const accountTwo = accounts[1];
  const accountThree = accounts[2];
  
  describe('Ensure player joining is fair and cannot be gamed', () => {
    it("should not allow a player to join without providing the requisite stake.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.join({from: accountTwo})); // should throw exception as no value is provided
    })
    it("should not allow a player to join if they attempt to provide MORE than the requisite stake.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.join({from: accountTwo, value: web3.toWei(0.2, "ether")}));
    })
    it("should not allow player one to join their own game.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.join({from: accountOne, value: web3.toWei(0.1, "ether")}));
    })
    it("should allow a player to join on providing the requisite stake.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await instance.join({from: accountTwo, value: web3.toWei(0.1, "ether")});
      let playerHasJoinedRes = await assertEvent(instance, { event: "PlayerHasJoined" });
      assert.equal(playerHasJoinedRes[0].args.player, accountTwo, 
        'Account Two ${accountTwo} should have joined the game.');
    })
    it("should not allow more than two players to join the game (including contract creator).", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.join({from: accountThree, value: web3.toWei(0.1, "ether")}));
    })
  })
  
  describe('Test placement of pieces', () => {
    it("should not allow a piece to placed beyond the board's limits.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.placePiece(4, 4, {from: accountTwo}));
    })
    it("should allow the first piece to placed within the board's limits.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await instance.placePiece(0, 0, {from: accountTwo});
      assert.equal(await instance.currActivePlayer.call(), accountOne);
    })
    it("should not allow the second player to place two pieces in a row, or play outside of their turn.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.placePiece(0, 1, {from: accountTwo}));
    })
    it("should not allow a player to overwrite another player's piece.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await expectThrow(instance.placePiece(0, 0, {from: accountOne}));
    })
    it("should allow player one to respond with a valid move.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await instance.placePiece(2, 2, {from: accountOne});
      assert.equal(await instance.currActivePlayer.call(), accountTwo);
    })
  });
  
  describe('Test winning result', () => {
    it("should award player two the win.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await instance.placePiece(0, 1, {from: accountTwo});
      await instance.placePiece(2, 1, {from: accountOne});
      await instance.placePiece(0, 2, {from: accountTwo});
      let winRes = await assertEvent(instance, { event: "Win" });
      assert.equal(winRes[0].args.winningPlayer, accountTwo);
    })
  });
  describe('Test withdrawal of funds after a win', () => {
    it("should not allow player one to withdraw any funds.", async () => {
      let instance = await TicTacTotalMania.deployed();
      const playerOneMayWithdraw = await instance.pendingWithdrawals.call(accountOne);
      const playerTwoMayWithdraw = await instance.pendingWithdrawals.call(accountTwo);
      assert.equal(playerOneMayWithdraw.toString(10), 0);
      assert.equal(playerTwoMayWithdraw.toString(10), 200000000000000000);
      await expectThrow(instance.withdraw({from: accountOne}));
    })
    it("should allow player two to withdraw all winnings.", async () => {
      let instance = await TicTacTotalMania.deployed();
      await instance.withdraw({from: accountTwo});
      let payoutRes = await assertEvent(instance, { event: "Payout" });
      assert.equal(payoutRes[0].args.playerWithdrawn, accountTwo);
      assert.equal(payoutRes[0].args.amountWithdrawn.toString(10), 200000000000000000);
    })
  });
  
  let newInstance;
  describe('Test draw result', () => {
    it("should award a draw.", async () => {
      newInstance = await TicTacTotalMania.new({ from: accountOne, value: web3.toWei(0.1, "ether") });
      await newInstance.join({from: accountTwo, value: web3.toWei(0.1, "ether")});
      await newInstance.placePiece(0, 0, {from: accountTwo});
      await newInstance.placePiece(0, 1, {from: accountOne});
      await newInstance.placePiece(2, 2, {from: accountTwo});
      await newInstance.placePiece(1, 1, {from: accountOne});
      await newInstance.placePiece(2, 1, {from: accountTwo});
      await newInstance.placePiece(2, 0, {from: accountOne});
      await newInstance.placePiece(0, 2, {from: accountTwo});
      await newInstance.placePiece(1, 2, {from: accountOne});
      await newInstance.placePiece(1, 0, {from: accountTwo});
      await assertEvent(newInstance, { event: "Draw" });
    })
  });
  describe('Test withdrawal of funds after a draw', () => {
    it("should allow both players to withdraw any funds.", async () => {
      const playerOneMayWithdraw = await newInstance.pendingWithdrawals.call(accountOne);
      const playerTwoMayWithdraw = await newInstance.pendingWithdrawals.call(accountTwo);
      assert.equal(playerOneMayWithdraw.toString(10), 100000000000000000);
      assert.equal(playerTwoMayWithdraw.toString(10), 100000000000000000);

      await newInstance.withdraw({from: accountOne});
      let payoutRes = await assertEvent(newInstance, { event: "Payout" });
      assert.equal(payoutRes[0].args.playerWithdrawn, accountOne);
      assert.equal(payoutRes[0].args.amountWithdrawn.toString(10), 100000000000000000);

      await newInstance.withdraw({from: accountTwo});
      let payoutTwoRes = await assertEvent(newInstance, { event: "Payout" });
      assert.equal(payoutTwoRes[0].args.playerWithdrawn, accountTwo);
      assert.equal(payoutTwoRes[0].args.amountWithdrawn.toString(10), 100000000000000000);
    })
  });

  let emergencyStopInstance;
  describe('Test emergency stop voting functionality with a single player', () => {
    it("should allow a single player to control the vote if a second player hasn't joined", async () => {
      emergencyStopInstance = await TicTacTotalMania.new({ from: accountOne, value: web3.toWei(0.1, "ether") });
      await emergencyStopInstance.voteEmergencyStop(true, "Didnt mean to start contract", {from: accountOne});
      assert.equal(await emergencyStopInstance.stoppedInEmergency.call(), true);
      const playerOneMayWithdraw = await emergencyStopInstance.pendingWithdrawals.call(accountOne);
      assert.equal(playerOneMayWithdraw.toString(10), 100000000000000000);
    });
    it("should allow a withdrawal", async () => {
      await emergencyStopInstance.withdraw({from: accountOne});
      let payoutRes = await assertEvent(emergencyStopInstance, { event: "Payout" });
      assert.equal(payoutRes[0].args.playerWithdrawn, accountOne);
      assert.equal(payoutRes[0].args.amountWithdrawn.toString(10), 100000000000000000);
    })
  });

  describe('Test emergency stop voting functionality with both players', () => {
    it("should not allow a single player to control the vote", async () => {
      emergencyStopInstance = await TicTacTotalMania.new({ from: accountOne, value: web3.toWei(0.1, "ether") });
      emergencyStopInstance.join({from: accountTwo, value: web3.toWei(0.1, "ether")});
      await emergencyStopInstance.voteEmergencyStop(true, "I dont like gambling", {from: accountOne});
      assert.equal(await emergencyStopInstance.stoppedInEmergency.call(), false);
      await emergencyStopInstance.voteEmergencyStop(true, "I dont like gambling too", {from: accountTwo});
      assert.equal(await emergencyStopInstance.stoppedInEmergency.call(), true);
    });
    it("should allow a withdrawal from both users", async () => {
      await emergencyStopInstance.unlockFundsInEmergency();

      const playerOneMayWithdraw = await emergencyStopInstance.pendingWithdrawals.call(accountOne);
      assert.equal(playerOneMayWithdraw.toString(10), 100000000000000000);
      const playerTwoMayWithdraw = await emergencyStopInstance.pendingWithdrawals.call(accountTwo);
      assert.equal(playerTwoMayWithdraw.toString(10), 100000000000000000);
      
      await emergencyStopInstance.withdraw({from: accountOne});
      let payoutRes = await assertEvent(emergencyStopInstance, { event: "Payout" });
      assert.equal(payoutRes[0].args.playerWithdrawn, accountOne);
      assert.equal(payoutRes[0].args.amountWithdrawn.toString(10), 100000000000000000);

      await emergencyStopInstance.withdraw({from: accountTwo});
      let payoutResPlayerTwo = await assertEvent(emergencyStopInstance, { event: "Payout" });
      assert.equal(payoutResPlayerTwo[0].args.playerWithdrawn, accountTwo);
      assert.equal(payoutResPlayerTwo[0].args.amountWithdrawn.toString(10), 100000000000000000);
    })
  });
});

async function expectThrow (promise, message) {
  try {
    await promise;
  } catch (error) {
    if (message) {
      assert(
        error.message.search(message) >= 0,
        'Expected \'' + message + '\', got \'' + error + '\' instead',
      );
      return;
    } else {
      const invalidOpcode = error.message.search('invalid opcode') >= 0;
      const outOfGas = error.message.search('out of gas') >= 0;
      const revert = error.message.search('revert') >= 0;
      assert(
        invalidOpcode || outOfGas || revert,
        'Expected throw, got \'' + error + '\' instead',
      );
      return;
    }
  }
  assert.fail('Expected throw not received');
}

async function assertEvent (contract, filter) {
  return new Promise((resolve, reject) => {
      var event = contract[filter.event]();
      event.watch();
      event.get((error, logs) => {
          var log = _.filter(logs, filter);
          if (log) {
              resolve(log);
          } else {
              throw Error("Failed to find filtered event for " + filter.event);
          }
      });
      event.stopWatching();
  });
}

module.exports = {
  expectThrow, assertEvent
};