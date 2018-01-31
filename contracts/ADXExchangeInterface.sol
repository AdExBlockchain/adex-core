pragma solidity ^0.4.18;

contract ADXExchangeInterface {
	// events
	event LogBidAccepted(bytes32 bidId, address advertiser, bytes32 adunit, address publisher, bytes32 adslot, uint acceptedTime);
	event LogBidCanceled(bytes32 bidId);
	event LogBidExpired(bytes32 bidId);
	event LogBidCompleted(bytes32 bidId, bytes32 advReport, bytes32 pubReport);

	function acceptBid(address _advertiser, bytes32 _adunit, uint _opened, uint _target, uint _rewardAmount, uint _timeout, bytes32 _adslot, uint8 v, bytes32 s, bytes32 r) public;
	function cancelBid(bytes32 _adunit, uint _opened, uint _target, uint _rewardAmount, uint _timeout, uint8 v, bytes32 s, bytes32 r) public;
	function giveupBid(bytes32 _bidId) public;
	function refundBid(bytes32 _bidId) public;
	function verifyBid(bytes32 _bidId, bytes32 _report) public;

	function deposit(uint _amount) public;
	function withdraw(uint _amount) public;

	// constants 
	function getBid(bytes32 _bidId) 
		constant external 
		returns (
			uint, uint, uint, uint, uint, 
			// advertiser (advertiser, ad unit, confiration)
			address, bytes32, bytes32,
			// publisher (publisher, ad slot, confirmation)
			address, bytes32, bytes32
		);

	function getBalance(address _user)
		constant
		external
		returns (uint, uint);
}