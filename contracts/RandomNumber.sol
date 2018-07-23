pragma solidity 0.4.24;

// Random number generation
contract RandomNumber {

    /**
     * Gets a random number between the minimium and maximum
     * @return A random number between min (inclusive) and max (exclusive)
     */
    function getRandomNumber(bytes32 seed, uint256 min, uint256 max) internal pure returns (uint256 value) {
        assert(max > min);

        return getRandomNumberModulo(seed, (max - min)) + min;
    }

    /**
     * Gets a random number.
     * @param modulo - the number to divide by.
     * @return A random number between betwen zero and modulo - 1.
     */
    function getRandomNumberModulo(bytes32 seed, uint256 modulo) internal pure returns (uint256 value) {
        assert(modulo > 0);

        return uint256(seed) % modulo;
    }

    /**
     * Gets the next seed to use.
     * @return the next seed.
     */
    function nextSeed(bytes32 seed) internal pure returns(bytes32 next) {
        return keccak256(abi.encodePacked(seed));
    }
}