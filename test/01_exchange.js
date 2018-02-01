var ADXExchange = artifacts.require("./ADXExchange.sol");
var ADXMock = artifacts.require("./ADXMock.sol"); // adx mock token
var Promise = require('bluebird')
var time = require('../helpers/time')

contract('ADXExchange', function(accounts) {
	var accOne = web3.eth.accounts[0]
	var accTwo = web3.eth.accounts[1] // advertiser
	var accThree = web3.eth.accounts[2] // publisher

	// PLAN: 

	//# can deposit
	//# can't deposit w/o allowance

	//# can withdraw

	// cannot withdraw more than balance (factoring in on bids); esp test for onbds

	//# cannot accept a bid that is not properly signed
	// cannot accept a bid where the advertiser does not have tokens
	// cannot accept a bid where the advertiser is the publisher
	// cannot accept a bid that is already accepted
	//# can accept a bid that is properly signed and has tokens
	
	// can cancelBid
	// cannot cancel someone else's bid (is it possible?
	// cannot cancel bid that exists on the SC

	// can giveupBid
	// can not giveupBid if not the publisher
	// can not giveupbid is state is more than accepted

	// can refundBid
	// cannot refundBid if not expired
	// can call this only as the advertiser

	// can verifyBid from both sides
	// cannot verifyBid more than once
	// can verify only if publisher or advertiser

	var adxToken;
	it("create adx mock token", function() {
		return ADXMock.new({ from: accOne }).then(function(_adxToken) {
			adxToken = _adxToken
		})
	})


	var adxExchange 
	it("create adx exchange", function() {
		return ADXExchange.new(adxToken.address, { from: accOne })
		.then(function(_adxExchange) {
			adxExchange = _adxExchange
		})
	})

	// fund advertiser with some tokens
	it("send tokens to advertiser", function() {
		return adxToken.transfer(accTwo, 1000)
	})

	// deposit()
	it("deposit(): cannot if there is no allowance", function() {
		return shouldFail(adxExchange.deposit(500))
	})

	it("deposit(): tokens to the exchange", function() {
		var amnt = 500
		var acc = accTwo
		
		return adxToken.approve(adxExchange.address, amnt, { from: acc })
		.then(function() {
			return adxExchange.deposit(amnt, { from: acc })
		})
		.then(function() {
			return adxExchange.getBalance(acc)
		})
		.then(function(resp) {
			assert(resp[0].toNumber() == amnt, "exchange reports expected balance")
		})

	})

	it("deposit(): the expected balance is on the SC", function() {
		return adxToken.balanceOf(adxExchange.address)
		.then(function(resp) {
			assert(resp.toNumber() == 500, "expected balance is there")
		})
	})


	// withdraw()
	it("withdraw(): cannot withdraw more than our balance", function() {
		var amnt = 20
		var acc = accTwo

		// first add +20 tokens to the exchange so we can try if we can over-withdraw
		return adxToken.transfer(adxExchange.address, amnt, { from: acc })
		.then(function() {
			return shouldFail(adxExchange.withdraw(510, { from: acc }))
		})
	})

	it("withdraw(): can withdraw our balance", function() {
		var orgAmnt = 500
		var amnt = 50
		var ctrl 

		var acc = accTwo

		return adxToken.balanceOf(acc)
		.then(function(resp) {
			ctrl = resp.toNumber()
			return adxExchange.withdraw(amnt, { from: acc })
		})
		.then(function() {
			return adxToken.balanceOf(acc)
		})
		.then(function(resp) {
			assert(resp.toNumber() == ctrl + amnt, "amount makes sense")

			return adxExchange.getBalance(acc)
		})
		.then(function(resp) {
			assert(resp[0].toNumber() == orgAmnt - amnt, "on-exchange amount got reduced")
		})
	})

	// Bids
	var bidId
	var bidOpened = Math.floor(Date.now()/1000)
	var r, s, v

	it("advertiser: sign a bid", function() {
		var acc = accTwo

		// NOTE: not needed to use the SC to get the bid ID, we can do soliditySha3(..., adxExchange.address) too
		return adxExchange.getBidID(acc, '0x1', bidOpened, 10000, 30, 0)
		.then(function(id) {
			bidId = id
			return web3.eth.sign(acc, id)
		})
		.then(function(resp) {
			resp = resp.slice(2)

			r = '0x'+resp.substring(0, 64)
			s = '0x'+resp.substring(64, 128)
			v = parseInt(resp.substring(128, 130)) + 27
		})
	})

	it("advertiser: cannot accept their own bid", function() {
		var acc = accTwo

		return shouldFail(adxExchange.acceptBid(acc, '0x1', bidOpened, 10000, 30, 0, '0x2', v, r, s, { from: acc }))
	})

	it("publisher: cannot accept a bid with wrong data", function() {
		var acc = accThree

		return shouldFail(adxExchange.acceptBid(accTwo, '0x1', bidOpened, 10000, 50, 0, '0x2', '0x'+v.toString(16), r, s, { from: acc }))
	})

	it("publisher: can accept bid", function() {
		// TODO: check for balances and etc (if they change)
		// TODO: cannot accept a bid if the advertiser does not have the tokens

		var acc = accThree


		return adxExchange.acceptBid(accTwo, '0x1', bidOpened, 10000, 30, 0, '0x2', '0x'+v.toString(16), r, s, { from: acc })
		.then(function(resp) {
			var ev = resp.logs[0]
			if (! ev) throw 'no event'

			assert.equal(ev.event, "LogBidAccepted")
			assert.equal(ev.args.bidId, bidId)
			assert.equal(ev.args.advertiser, accTwo)
			assert.equal(ev.args.adunit, '0x1000000000000000000000000000000000000000000000000000000000000000')
			assert.equal(ev.args.publisher, accThree)
			assert.equal(ev.args.adslot, '0x2000000000000000000000000000000000000000000000000000000000000000')
			acceptedTime = ev.args.acceptedTime;
			assert.equal(ev.args.acceptedTime.toNumber() > 1502219400, true) // just ensure the acceptedTime makes vague sense
		})
	})

	it("publisher: cannot accept a bid twice", function() {
		var acc = accTwo

		return shouldFail(adxExchange.acceptBid(accTwo, '0x1', bidOpened, 10000, 30, 0, '0x2', '0x'+v.toString(16), r, s, { from: acc }))
	})

	it("verify bid - publisher", function() {
		adxExchange.verifyBid(bidId, '0x22', { from: accThree })
		.then(function(resp) {
			//console.log(resp)
		})
	})

	it("verify bid - advertiser", function() {
		var ctrl 

		return adxToken.balanceOf(accThree)
		.then(function(resp) {
			ctrl = resp.toNumber()
			return adxExchange.verifyBid(bidId, '0x23', { from: accTwo })
		})
		.then(function(resp) {
			var ev = resp.logs[0]
			if (! ev) throw 'no event'

			assert.equal(ev.event, "LogBidCompleted")

			return adxExchange.getBalance(accThree)
		})
		.then(function(resp) {
			assert(resp[0].toNumber() == ctrl + 30, "amount makes sense")
		})
	})


	function shouldFail(promise)
	{
		return new Promise(function(resolve, reject) {
			promise.catch((err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
			.then(function() { reject('cant be here - unexpected success') })
		})
	}
})
