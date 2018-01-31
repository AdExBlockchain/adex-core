pragma solidity ^0.4.15;

import "../../zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../zeppelin-solidity/contracts/token/ERC20.sol";

contract Drainable is Ownable {
	function withdrawToken(address tokenaddr) 
		onlyOwner
		public
	{
		ERC20 token = ERC20(tokenaddr);
		uint bal = token.balanceOf(address(this));
		token.transfer(msg.sender, bal);
	}

	function withdrawEther() 
		onlyOwner
		public
	{
	    require(msg.sender.send(this.balance));
	}
}
