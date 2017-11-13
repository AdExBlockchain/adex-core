pragma solidity ^0.4.15;

import "../../zeppelin-solidity/contracts/token/StandardToken.sol";

/**
 * @title ADXMock
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator. 
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract ADXMock is StandardToken {

  string public name = "AdEx Token";
  string public symbol = "ADX";
  uint256 public decimals = 4;
  uint256 public INITIAL_SUPPLY = 100*1000*1000*10000;

  /**
   * @dev Contructor that gives msg.sender all of existing tokens. 
   */
  function ADXMock() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }
}
