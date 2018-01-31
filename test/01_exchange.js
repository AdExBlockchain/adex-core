var ADXExchange = artifacts.require("./ADXExchange.sol");
var ADXMock = artifacts.require("./ADXMock.sol"); // adx mock token
var Promise = require('bluebird')
var time = require('../helpers/time')

contract('ADXExchange', function(accounts) {
	var accOne = web3.eth.accounts[0]
	var accTwo = web3.eth.accounts[1] // advertiser
	var accThree = web3.eth.accounts[2] // publisher

	// PLAN: 

	// can deposit

	// cannot accept a bid that is not properly signed
	// cannot accept a bid where the advertiser does not have tokens
	// can accept a bid that is properly signed and has tokens
	
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

	// can withdraw
	// cannot withdraw more than balance (factoring in on bids)

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

	it("deposit(): cannot if there is no allowance", function() {
		return shouldFail(adxExchange.deposit(500 * 10000))
	})

	it("deposit(): tokens to the exchange", function() {
		var amnt = 500 * 10000
		
		return adxToken.approve(adxExchange.address, amnt, { from: accOne })
		.then(function() {
			return adxExchange.deposit(amnt)
		})
		.then(function() {
			return adxExchange.getBalance(accOne)
		})
		.then(function(resp) {
			assert(resp[0].toNumber() == amnt, "exchange reports expected balance")
		})

	})

	it("deposit(): the expected balance is on the SC", function() {
		return adxToken.balanceOf(adxExchange.address)
		.then(function(resp) {
			assert(resp.toNumber() == 500 * 10000, "expected balance is there")
		})
	})


	// HELPERS
	function bidID(advertiser, adunit, opened, target, amount, timeout, sc)
	{
		return web3.utils.soliditySha3(advertiser, adunit, opened, target, amount, timeout, sc)
	}

	// TODO sign

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
