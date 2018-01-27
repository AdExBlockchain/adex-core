var ADXExchange = artifacts.require("./ADXExchange.sol")
var ADXMock = artifacts.require("./ADXMock.sol") // adx mock token
var Promise = require('bluebird')
var time = require('../helpers/time')

contract('ADXExchange', function (accounts) {
	var accOne = web3.eth.accounts[0]
	var accTwo = web3.eth.accounts[1] // advertiser
	var accThree = web3.eth.accounts[2] // publisher
	var advWallet = web3.eth.accounts[8]
	var pubWallet = web3.eth.accounts[7]

	var SIG = 0x420000000000000002300023400022000000000000000000000000000000000

	var bidTwoAdvReportAddr = 0x3300000000000000000000000000000000000000000000000000000000000000
	var bidTwoPubReportAddr = 0x3400000000000000000000000000000000000000000000000000000000000000

	var ADUNIT = 0
	var ADSLOT = 1

	var adxToken
	it("create adx mock token", function () {
		return ADXMock.new({ from: accOne }).then(function (_adxToken) {
			adxToken = _adxToken
		})
	})

	var adxExchange
	it("create adx exchange", function () {
		return ADXExchange.new(adxToken.address, { from: accOne })
			.then(function (_adxExchange) {
				adxExchange = _adxExchange
			})
	})
})