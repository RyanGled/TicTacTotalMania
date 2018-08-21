## Design Patterns

**Circuit Breaker**

- As the contract was peer-to-peer and multiplayer, I decided that the contract owner having the sole ability to control an emergency stop on a contract was a security risk, as the first player could force an emergency stop just before they lose, and ensure a draw result and a return of their funds, thereby cheating the other player.
Therefore I decided to implement a type of DAO, whereby both users have to vote for an emergency stop. This means if their funds are stuck for whatever reason and the traditional cashout methods are not working, they can both vote to force a circuit breaker.

**Pull over push payments**

- As a protection against re-entrancy and denial of service attacks, I have implemented pull payments instead of push in the form of the `withdraw()` function.

**Fail early and fail loud**

- Functions with a possibility to fail have require methods, and an explicit explanation is returned in case of failure.

**Auto Deprecation**

- Was deemed unnecessary, as each contract has a minimal lifecycle before it is timed out or a result is found.