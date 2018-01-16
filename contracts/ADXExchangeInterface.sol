pragma solidity ^0.4.18;

contract ADXExchangeInterface {
	// events
	event LogBidAccepted(uint bidId, address publisher, uint adslotId, bytes32 adslotIpfs, uint acceptedTime);
	event LogBidCanceled(uint bidId);
	event LogBidExpired(uint bidId);
	event LogBidCompleted(uint bidId, bytes32 advReport, bytes32 pubReport);

	function acceptBid(address _advertiser, bytes32 _adunit, uint _target, uint _rewardAmount, uint _timeout, bytes32 _adslot, bytes32 v, bytes32 s, bytes32 r);
	function cancelBid(bytes32 _bidId);
	function refundBid(bytes32 _bidId);
	function verifyBid(bytes32 _bidId, bytes32 _report);

	// constants 
	function getBid(bytes32 _bidId) 
		constant external 
		returns (
			uint, uint, uint, uint, uint, 
			// advertiser (advertiser, ad unit, confiration)
			bytes32, bytes32, bytes32
			// publisher (publisher, ad slot, confirmation)
			bytes32, bytes32, bytes32
		);

	function getBalance(address _user)
		constant
		external
		returns (uint, uint);
}