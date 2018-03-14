var ADXExchange = artifacts.require("./ADXExchange.sol");
var ADXMock = artifacts.require("./ADXMock.sol"); // adx mock token
var Promise = require('bluebird')
var time = require('../helpers/time')
var web3Utils = require('web3-utils')

contract('ADXExchange', function(accounts) {
	var accOne = web3.eth.accounts[0]
	var accTwo = web3.eth.accounts[1] // advertiser
	var accThree = web3.eth.accounts[2] // publisher

	var SCHEMA = ["address Advertiser",
		"bytes32 Ad Unit ID",
		"uint Opened",
		"uint Target",
		"uint Amount",
		"uint Timeout",
		"address Exchange"]

	var schemaHash = web3Utils.soliditySha3.apply(web3Utils, SCHEMA)

	// PLAN: 

	//# can deposit
	//# can't deposit w/o allowance

	//# can withdraw

	// cannot withdraw more than balance (factoring in on bids); esp test for onbds

	//# cannot accept a bid that is not properly signed
	// cannot accept a bid where the advertiser does not have tokens
	// cannot accept a bid where the advertiser is the publisher
	//# cannot accept a bid that is already accepted
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

	//# can verifyBid from both sides
	//# cannot verifyBid more than once
	//# can verify only if publisher or advertiser

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

	// withdraw()
	it("withdraw(): cannot withdraw from another acc", function() {
		var amnt = 10
		var acc = web3.eth.accounts[4]

		// first add +20 tokens to the exchange so we can try if we can over-withdraw
		return shouldFail(adxExchange.withdraw(amnt, { from: acc }))
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

		var valHash = web3Utils.soliditySha3(acc, '0x1000000000000000000000000000000000000000000000000000000000000000', bidOpened, 10000, 30, 0, adxExchange.address)
		var id = web3Utils.soliditySha3(schemaHash, valHash)

		bidId = id
		
		return new Promise(function(resolve, reject) {
			web3.eth.sign(acc, id, function(err, resp) {
				if (err) return reject(err)

				resp = resp.slice(2)

				r = '0x'+resp.substring(0, 64)
				s = '0x'+resp.substring(64, 128)
				v = parseInt(resp.substring(128, 130), 16) + 27

				resolve()

			})

		})
	})

	it("advertiser: cannot accept their own bid", function() {
		var acc = accTwo

		return shouldFail(adxExchange.acceptBid(acc, '0x1', bidOpened, 10000, 30, 0, '0x2', v, r, s, 1, { from: acc }))
	})

	it("publisher: cannot accept a bid with wrong data", function() {
		var acc = accThree

		return shouldFail(adxExchange.acceptBid(accTwo, '0x1', bidOpened, 10000, 50, 0, '0x2', '0x'+v.toString(16), r, s, 1, { from: acc }))
	})

	it("publisher: can accept bid", function() {
		// TODO: check for balances and etc (if they change)
		// TODO: cannot accept a bid if the advertiser does not have the tokens

		var acc = accThree

		return adxExchange.acceptBid(accTwo, '0x1', bidOpened, 10000, 30, 0, '0x2', '0x'+v.toString(16), r, s, 1, { from: acc })
		.then(function(resp) {
			var ev = resp.logs[0]
			if (! ev) throw 'no event'

			assert.equal(ev.event, 'LogBidAccepted')
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
		var acc = accThree

		return shouldFail(adxExchange.acceptBid(accTwo, '0x1', bidOpened, 10000, 30, 0, '0x2', '0x'+v.toString(16), r, s, 1, { from: acc }))
	})

	it("advertiser: cannot refundBid now", function() {
		var acc = accTwo

		return shouldFail(adxExchange.refundBid(bidId, { from: acc }))
	})

	it("verify bid - should fail if not advertiser or publisher", function() {
		return shouldFail(adxExchange.verifyBid(bidId, '0x22', { from: web3.eth.accounts[4] }))
	})

	it("verify bid - publisher", function() {
		return adxExchange.verifyBid(bidId, '0x22', { from: accThree })
		.then(function(resp) {
			//console.log(resp)
		})
	})

	it("verify bid - cannot more than once", function() {
		return shouldFail(adxExchange.verifyBid(bidId, '0x22', { from: accThree }))
	})

	it("verify bid - advertiser", function() {
		var ctrl 

		return adxToken.balanceOf(accThree)
		.then(function(resp) {
			ctrl = resp.toNumber()
			return adxExchange.verifyBid(bidId, '0x23', { from: accTwo })
		})
		.then(function(resp) {
			var ev = resp.logs.filter(function(x) { return x.event == 'LogBidCompleted' })
			if (! ev) throw 'no event'

			return adxExchange.getBalance(accThree)
		})
		.then(function(resp) {
			assert(resp[0].toNumber() == ctrl + 30, "amount makes sense")
		})
	})

	it("can not send ether accidently", function() {
		return new Promise((resolve, reject) => {
			web3.eth.sendTransaction({
				from: accOne,
				to: adxExchange.address,
				value: 2,
				gas: 80000
			}, (err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
		})
	})

	it('advertiser and publisher: new bid, 0 timeout', function() {
		var v, r, s
		var acc = accThree

		var bidOpened = Date.now()

		return adxExchange.getBidID(accTwo, '0x1', bidOpened, 500, 5, 0)
		.then(function(id) {
			bidId = id
			return web3.eth.sign(accTwo, id)
		})
		.then(function(resp) {
			resp = resp.slice(2)

			r = '0x'+resp.substring(0, 64)
			s = '0x'+resp.substring(64, 128)
			v = parseInt(resp.substring(128, 130), 16) + 27

			return adxExchange.acceptBid(accTwo, '0x1', bidOpened, 500, 5, 0, '0x2', '0x'+v.toString(16), r, s, 1, { from: acc })
		})
		.then(function(resp) {
			var ev = resp.logs[0]
			if (! ev) throw 'no event'
			assert.equal(ev.event, 'LogBidAccepted')
		})
	})

	it("advertiser: cannot refundBid now", function() {
		var acc = accTwo

		return shouldFail(adxExchange.refundBid(bidId, { from: acc }))
	})

	it("advertiser: can refundBid after more than 24 hours", function() {
		return time.move(web3, 365 * 24 * 60 * 60 + 10)
		.then(function() {
			return adxExchange.refundBid(bidId, { from: accTwo })
		})
		.then(function(resp) {
			var ev = resp.logs[0]
			if (! ev) throw 'no event'

			assert.equal(ev.event, 'LogBidExpired')

			// @TODO: test balances
		})
	})

	it('advertiser and publisher: cancel a bid', function() {
		var v, r, s
		var acc = accTwo

		var bidOpened = Date.now()

		return adxExchange.getBidID(acc, '0x1', bidOpened, 500, 5, 0)
		.then(function(id) {
			bidId = id
			return web3.eth.sign(acc, id)
		})
		.then(function(resp) {
			resp = resp.slice(2)

			r = '0x'+resp.substring(0, 64)
			s = '0x'+resp.substring(64, 128)
			v = parseInt(resp.substring(128, 130), 16) + 27

			return adxExchange.cancelBid('0x1', bidOpened, 500, 5, 0, '0x'+v.toString(16), r, s, 1, { from: acc })
		})
		.then(function(resp) {
			var ev = resp.logs[0]
			if (! ev) throw 'no event'

			assert.equal(ev.event, 'LogBidCanceled')
		})
	})


	// didSign tests
	var trezorSignedMsg = {
		"address": "0x7c72e5f169dfcff2293f4690c366ccd107eddfcd",
		"msg": "adex adex adex adex adex adex ad",
		"sig": "0xb9c3dfe8386e67036c139f434fa32017576781e9d1277e436ace887480128e1062611ec535e4ee4c2758930f09efa98e18a45c0013ce26ae3911afdbc86ba9d11c",
	}

	it('didSign should work with a trezor sig', function() {
		var r, s, v
		var sig = trezorSignedMsg.sig
		
		sig = sig.slice(2)
		r = '0x'+sig.substring(0, 64)
		s = '0x'+sig.substring(64, 128)
		v = parseInt(sig.substring(128, 130), 16) // in trezor's case, there is no +27

		var msg = '0x'+(new Buffer(trezorSignedMsg.msg)).toString('hex')

		return adxExchange.didSign(trezorSignedMsg.address, msg, v, r, s, 2)
		.then(function(resp) {
			assert.equal(resp, true)
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
