pragma solidity ^0.4.18;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../zeppelin-solidity/contracts/math/SafeMath.sol";
import "./helpers/Drainable.sol";
import "./ADXExchangeInterface.sol";
import "../zeppelin-solidity/contracts/token/ERC20.sol";

contract ADXExchange is ADXExchangeInterface, Ownable, Drainable {
	string public name = "AdEx Exchange";

	ERC20 public token;

	// TODO: ensure every func mutates bid state and emits an event

 	mapping (address => uint) balances;

 	// escrowed on bids
 	mapping (address => uint) onBids; 

	mapping (bytes32 => Bid) bids;
	mapping (bytes32 => BidState) bidStates;

	// TODO: some properties in the bid structure - achievedPoints/peers for example - are not used atm
	
	// TODO: keep bid state separately, because of canceling
	// An advertiser would be able to cancel their own bid (id is hash) when signing a message of the hash and calling the cancelBid() fn

	enum BidState { 
		DoesNotExist, // default state

		// There is no 'Open' state - the Open state is just a signed message that you're willing to place such a bid
		Accepted, // in progress

		// the following states MUST unlock the ADX amount (return to advertiser)
		// fail states
		Canceled,
		Expired,

		// success states
		Completed
	}

	struct Bid {
		// Links on advertiser side
		address advertiser;
		bytes32 adUnit;

		// Links on publisher side
		address publisher;
		bytes32 adSlot;

		uint acceptedTime; // when was it accepted by a publisher

		// ADX reward amount
		uint amount;

		// Requirements
		uint target; // how many impressions/clicks/conversions have to be done
		uint timeout; // the time to execute

		// Confirmations from both sides; any value other than 0 is vconsidered as confirm, but this should usually be an IPFS hash to a final report
		bytes32 publisherConfirmation;
		bytes32 advertiserConfirmation;
	}

	//
	// MODIFIERS
	//
	modifier onlyBidAdvertiser(bytes32 _bidId) {
		require(msg.sender == bids[_bidId].advertiser);
		_;
	}

	modifier onlyBidPublisher(bytes32 _bidId) {
		require(msg.sender == bids[_bidId].publisher);
		_;
	}

	modifier onlyBidState(bytes32 _bidId, BidState _state) {
		require(bidStates[_bidId] == _state);
		_;
	}

	// Functions

	function ADXExchange(address _token)
	{
		token = ERC20(_token);
	}

	//
	// Bid actions
	// 

	// the bid is accepted by the publisher
	function acceptBid(bytes32 _adunit, uint _opened, uint _target, uint _rewardAmount, uint _timeout, bytes32 _adslot, uint8 v, bytes32 s, bytes32 r)
		public
	{
		// _opened acts as a nonce here
		bytes32 bidId = keccak256(_adunit, _opened, _target, _rewardAmount, _timeout, this);

		address _advertiser = ecrecover(keccak256("\x19Ethereum Signed Message:\n32", bidId), v, r, s);

		// It can be proven that onBids will never exceed balances which means this can't underflow
		// SafeMath can't be used here because of the stack depth
		uint avail = balances[_advertiser] - onBids[_advertiser];
		require(avail >= _rewardAmount);

		require(bidStates[bidId] == BidState.DoesNotExist);

		Bid storage bid = bids[bidId];

		bid.target = _target;
		bid.amount = _rewardAmount;

		bid.timeout = _timeout;

		bid.advertiser = _advertiser;
		bid.adUnit = _adunit;

		bid.publisher = msg.sender;
		bid.adSlot = _adslot;

		bids[bidId] = bid;

		bidStates[bidId] = BidState.Accepted;

		onBids[_advertiser] += _rewardAmount;

		// static analysis?
		// require(onBids[_advertiser] <= balances[advertiser]);

		LogBidAccepted(bidId, _advertiser, _adunit, msg.sender, _adslot, bid.acceptedTime);
	}

	// The bid is canceled by the advertiser or the publisher
	function cancelBid(bytes32 _bidId, uint8 v, bytes32 s, bytes32 r)
		public
	{
		BidState state = bidStates[_bidId];

		require(state == BidState.DoesNotExist || state == BidState.Accepted);

		if (state == BidState.DoesNotExist) {
			// only an advertiser can cancel
			address advertiser = ecrecover(keccak256("\x19Ethereum Signed Message:\n32", _bidId), v, r, s);
			require(msg.sender == advertiser);
		} else {
			// only a publisher can cancel an Accepted bid
			Bid storage bid = bids[_bidId];
			require(msg.sender == bid.publisher);
			onBids[bid.advertiser] -= bid.amount;
		}

		bidStates[_bidId] = BidState.Canceled;
		LogBidCanceled(_bidId);
	}


	// This can be done if a bid is accepted, but expired
	// This is essentially the protection from never settling on verification, or from publisher not executing the bid within a reasonable time
	function refundBid(bytes32 _bidId)
		public
		onlyBidAdvertiser(_bidId)
		onlyBidState(_bidId, BidState.Accepted)
	{
		Bid storage bid = bids[_bidId];
		require(bid.timeout > 0); // you can't refund if you haven't set a timeout
		require(SafeMath.add(bid.acceptedTime, bid.timeout) < now);

		bidStates[_bidId] = BidState.Expired;

		onBids[bid.advertiser] -= bid.amount;

		LogBidExpired(_bidId);
	}


	// both publisher and advertiser have to call this for a bid to be considered verified
	function verifyBid(bytes32 _bidId, bytes32 _report)
		public
		onlyBidState(_bidId, BidState.Accepted)
	{
		Bid storage bid = bids[_bidId];

		require(bid.publisher == msg.sender || bid.advertiser == msg.sender);

		if (bid.publisher == msg.sender) {
			require(bid.publisherConfirmation == 0);
			bid.publisherConfirmation = _report;
		}

		if (bid.advertiser == msg.sender) {
			require(bid.advertiserConfirmation == 0);
			bid.advertiserConfirmation = _report;
		}

		if (bid.advertiserConfirmation != 0 && bid.publisherConfirmation != 0) {
			bidStates[_bidId] = BidState.Completed;

			onBids[bid.advertiser] = SafeMath.sub(onBids[bid.advertiser], bid.amount);
			balances[bid.advertiser] = SafeMath.sub(balances[bid.advertiser], bid.amount);
			balances[bid.publisher] = SafeMath.add(balances[bid.publisher], bid.amount);

			LogBidCompleted(_bidId, bid.advertiserConfirmation, bid.publisherConfirmation);
		}
	}

	// Deposit and withdraw
	function deposit(uint _amount)
		public
	{
		balances[msg.sender] = SafeMath.add(balances[msg.sender], _amount);
		require(token.transferFrom(msg.sender, address(this), _amount));
	}

	function withdraw(uint _amount)
		public
	{
		uint available = SafeMath.sub(balances[msg.sender], onBids[msg.sender]);
		require(_amount <= available);

		balances[msg.sender] = SafeMath.sub(balances[msg.sender], _amount);
		require(token.transfer(msg.sender, _amount));
	}

	//
	// Public constant functions
	//
	function getBid(bytes32 _bidId) 
		constant
		external
		returns (
			uint, uint, uint, uint, uint, 
			// advertiser (advertiser, ad unit, confiration)
			address, bytes32, bytes32,
			// publisher (publisher, ad slot, confirmation)
			address, bytes32, bytes32
		)
	{
		var bid = bids[_bidId];
		return (
			uint(bidStates[_bidId]), bid.target, bid.timeout, bid.amount, bid.acceptedTime,
			bid.advertiser, bid.adUnit, bid.advertiserConfirmation,
			bid.publisher, bid.adSlot, bid.publisherConfirmation
		);
	}

	function getBalance(address _user)
		constant
		external
		returns (uint, uint)
	{
		return (balances[_user], onBids[_user]);
	}

	//
	// Events
	//

	event LogBidAccepted(uint bidId, address advertiser, bytes32 adunit, address publisher, bytes32 adslot, uint acceptedTime);

	event LogBidCanceled(uint bidId);
	event LogBidExpired(uint bidId);
	event LogBidCompleted(uint bidId, bytes32 advReport, bytes32 pubReport);
}
