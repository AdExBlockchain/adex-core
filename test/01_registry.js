var ADXRegistry = artifacts.require("./ADXRegistry.sol");
var ADXMock = artifacts.require("./ADXMock.sol"); // adx mock token
var Promise = require('bluebird')
var time = require('../helpers/time')

contract('ADXRegistry', function(accounts) {
	var accOne = web3.eth.accounts[0]
	var wallet = web3.eth.accounts[8]

	var ADUNIT = 0 
	var PROPERTY = 1

	var adxRegistry 

	var SIG = 0x4200000000000000023000234000220000000000000000000000000000000000

	it("initialize contract", function() {
		return ADXRegistry.new().then(function(_adxRegistry) {
			adxRegistry = _adxRegistry
		})
	});

	it("can't register a property w/o being an account", function() {
		return new Promise((resolve, reject) => {
			adxRegistry.registerItem(PROPERTY, 0, 0, "test campaign", "{}", {
				from: accOne,
				gas: 130000
			}).catch((err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
			.then(function() { reject('cant be here - unexpected success') })
		})
	});

	it("can't register an ad unit w/o being an account", function() {
		return new Promise((resolve, reject) => {
			adxRegistry.registerItem(ADUNIT, 0, 0, "blank name", "blank meta", {
				from: accOne,
				gas: 130000
			}).catch((err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
			.then(function() { reject('cant be here - unexpected success') })
		})
	})


	it("can't register as a publisher w/o a wallet", function() {
		return new Promise((resolve, reject) => {
			adxRegistry.register("stremio", 0, 0x47, SIG, "{}", {
				from: accOne,
				gas: 130000
			}).catch((err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
			.then(function() { reject('cant be here - unexpected success') })
		})
	})

	it("account not registered", function() {
		return adxRegistry.isRegistered(accOne)
		.then(function(isReg) {
			assert.equal(isReg, false)
		})
	})

	it("can register as an account", function() {
		return adxRegistry.register("stremio", wallet, 0x47, SIG, "{}", {
			from: accOne,
			gas: 180000
		}).then(function(res) {
			var ev = res.logs[0]
			if (! ev) throw 'no event'
			assert.equal(ev.event, 'LogAccountRegistered')
			assert.equal(ev.args.addr, accOne)
			assert.equal(web3.toUtf8(ev.args.accountName), 'stremio')
			assert.equal(ev.args.ipfs, '0x4700000000000000000000000000000000000000000000000000000000000000');
			assert.equal(ev.args.wallet, wallet)
			assert.equal(web3.toUtf8(ev.args.meta), '{}')
			assert.equal(ev.args.signature, web3.toHex(SIG))
		})
	})

	it("account is registered", function() {
		return adxRegistry.isRegistered(accOne)
		.then(function(isReg) { 
			assert.equal(isReg, true)
		})
	})

	it("can update account info", function() {
		return adxRegistry.register("stremio", wallet, 0x42, SIG, '{ "email": "office@strem.io" }', {
			from: accOne,
			gas: 130000
		}).then(function(res) {
			var ev = res.logs[0]
			if (! ev) throw 'no event'
			assert.equal(ev.event, 'LogAccountModified')
			assert.equal(ev.args.addr, accOne)
			assert.equal(web3.toUtf8(ev.args.accountName), 'stremio')
			assert.equal(ev.args.ipfs, '0x4200000000000000000000000000000000000000000000000000000000000000')
			assert.equal(ev.args.wallet, wallet)
			assert.equal(web3.toUtf8(ev.args.meta), '{ "email": "office@strem.io" }')
			assert.equal(ev.args.signature, web3.toHex(SIG))
		})
	})

	it("cant update account info if signature is changed", function() {
		return new Promise((resolve, reject) => {
			adxRegistry.register("stremio", wallet, 0x42, 0x45, '{ "email": "office@strem.io" }', {
				from: accOne,
				gas: 180000
			}).catch(function(err) {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
			.then(function() { reject('cant be here - unexpected success') })
		})
	})

	var adunitId;
	it("can register a new ad unit", function() {
		return adxRegistry.registerItem(ADUNIT, 0, 0x42, "foobar ad unit", "{}", {
			from: accOne,
			gas: 230000
		}).then(function(res) {
			var ev = res.logs[0]
			if (! ev) throw 'no event'
			assert.equal(ev.event, 'LogItemRegistered')
			assert.equal(ev.args.itemType, ADUNIT);
			assert.equal(ev.args.id, 1)
			assert.equal(web3.toUtf8(ev.args.itemName), 'foobar ad unit')
			assert.equal(web3.toUtf8(ev.args.meta), '{}')
			assert.equal(ev.args.ipfs, '0x4200000000000000000000000000000000000000000000000000000000000000');
			assert.equal(ev.args.owner, accOne)

			adunitId = ev.args.id.toNumber()

			// TODO check all ad units for an account after
		})
	})
	it("can update an ad unit", function() {
		return adxRegistry.registerItem(ADUNIT, adunitId, 0x45, "foobar campaign", "{ someMeta: 's' }", {
			from: accOne,
			gas: 230000
		}).then(function(res) {
			var ev = res.logs[0]
			if (! ev) throw 'no event'
			assert.equal(ev.event, 'LogItemModified')
			assert.equal(ev.args.itemType, ADUNIT);
			assert.equal(web3.toUtf8(ev.args.itemName), 'foobar campaign')
			assert.equal(web3.toUtf8(ev.args.meta), "{ someMeta: 's' }")
			assert.equal(ev.args.ipfs, '0x4500000000000000000000000000000000000000000000000000000000000000');
			assert.equal(ev.args.id.toNumber(), adunitId)
			assert.equal(ev.args.owner, accOne)
		})
	})
	it("can't update another accounts' ad unit", function() {
		return new Promise((resolve, reject) => {
			adxRegistry.registerItem(ADUNIT, adunitId, 0x45, "foobar campaign", "{ someMeta: 'sx' }", {
				from: web3.eth.accounts[3],
				gas: 230000
			}).catch((err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
			.then(function() { reject('cant be here - unexpected success') })	
		})
	})

	// TODO: also do some testing with properties

	// can drain ether: can't test that, because we can't send ether in the first place...
	// maybe figure out a way to test it?

	// TODO: all the *get methods 
	// also test if they are callable for non-registered accounts

	it("can get an account, account meta correct", function() {
		return adxRegistry.getAccount(accOne)
		.then(function(res) {
			assert.equal(res[0], wallet)
			assert.equal(res[1], '0x4200000000000000000000000000000000000000000000000000000000000000')
			assert.equal(web3.toUtf8(res[2]), 'stremio')
			assert.equal(web3.toUtf8(res[3]), '{ "email": "office@strem.io" }')
		})
	})

	it("can get items for an acc", function() {
		return adxRegistry.getAccountItems(accOne, ADUNIT)
		.then(function(res) {
			assert.equal(res.length, 1)
			assert.equal(res[0].toNumber(), adunitId)
		})
	})


	it("can get a single item", function() {
		return adxRegistry.getItem(ADUNIT, adunitId)
		.then(function(res) {
			assert.equal(res[0], accOne)
			assert.equal(res[1], '0x4500000000000000000000000000000000000000000000000000000000000000')
			assert.equal(web3.toUtf8(res[2]), 'foobar campaign')
			assert.equal(web3.toUtf8(res[3]), "{ someMeta: 's' }")
		})
	})


	it("hasItem - item exists", function() {
		return adxRegistry.hasItem(ADUNIT, adunitId)
		.then(function(res) {
			assert.equal(res, true)
		})
	})

	it("hasItem - item does not exist", function() {
		return adxRegistry.hasItem(ADUNIT, 24135)
		.then(function(res) {
			assert.equal(res, false)
		})
	})

	it("can't send ether accidently", function() {
		return new Promise((resolve, reject) => {
			web3.eth.sendTransaction({
				from: accOne,
				to: adxRegistry.address,
				value: 1*Math.pow(10,18),
				gas: 180000
			}, (err) => {
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
		})
	})

	var adxToken;
	it("create adx mock token", function() {
		return ADXMock.new({ from: accOne }).then(function(_adxToken) {
			adxToken = _adxToken
		})
	})

	it("can recover accidently sent tokens", function() {
		return adxToken.transfer(adxRegistry.address, 100*10000, { from: accOne })
		.then(function() {
			return adxToken.balanceOf(adxRegistry.address)
		})
		.then(function(balance) {
			assert.equal(balance.toNumber(), 100*10000)

			return adxRegistry.withdrawToken(adxToken.address, { from: accOne })
		})
		.then(function() {
			return adxToken.balanceOf(accOne)
		})
		.then(function(balance) {
			assert.equal(balance.toNumber(), 100 * 1000 * 1000 * 10000)
		})
	})
})
