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

	// cannot accept a bid that is not properly signed
	// cannot accept a bid where the advertiser does not have tokens
	// cannot accept a bid where the advertiser is the publisher
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

	// deposit()
	it("deposit(): cannot if there is no allowance", function() {
		return shouldFail(adxExchange.deposit(500))
	})

	it("deposit(): tokens to the exchange", function() {
		var amnt = 500
		
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
			assert(resp.toNumber() == 500, "expected balance is there")
		})
	})


	// withdraw()
	it("withdraw(): cannot withdraw more than our balance", function() {
		var amnt = 20

		// first add +20 tokens to the exchange so we can try if we can over-withdraw
		return adxToken.transfer(adxExchange.address, amnt, { from: accOne })
		.then(function() {
			return shouldFail(adxExchange.withdraw(510, { from: accOne }))
		})
	})

	it("withdraw(): can wihdraw our balance", function() {
		var orgAmnt = 500
		var amnt = 50
		var ctrl 

		return adxToken.balanceOf(accOne)
		.then(function(resp) {
			ctrl = resp.toNumber()
			return adxExchange.withdraw(amnt)
		})
		.then(function() {
			return adxToken.balanceOf(accOne)
		})
		.then(function(resp) {
			assert(resp.toNumber() == ctrl + amnt, "amount makes sense")

			return adxExchange.getBalance(accOne)
		})
		.then(function(resp) {
			assert(resp[0].toNumber() == orgAmnt - amnt, "on-exchange amount got reduced")
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
