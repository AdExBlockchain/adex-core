pragma solidity ^0.4.13;

import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../zeppelin-solidity/contracts/token/ERC20.sol";

contract Drainable is Ownable {
	function withdrawToken(address tokenaddr) 
		onlyOwner 
	{
		ERC20 token = ERC20(tokenaddr);
		uint bal = token.balanceOf(address(this));
		token.transfer(msg.sender, bal);
	}

	function withdrawEther() 
		onlyOwner
	{
	    require(msg.sender.send(this.balance));
	}
}
