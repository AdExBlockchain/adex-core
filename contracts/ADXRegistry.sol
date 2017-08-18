pragma solidity ^0.4.13;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./helpers/Drainable.sol";

contract ADXRegistry is Ownable, Drainable {
	string public name = "AdEx Registry";

	// Structure:
	// AdUnit (advertiser) - a unit of a single advertisement
	// AdSlot (publisher) - a particular property (slot) that can display an ad unit
	// Campaign (advertiser) - group of ad units ; not vital
	// Channel (publisher) - group of properties ; not vital
	// Each Account is linked to all the items they own through the Account struct

	mapping (address => Account) public accounts;

	// XXX: mostly unused, because solidity does not allow mapping with enum as primary type.. :( we just use uint
	enum ItemType { AdUnit, AdSlot, Campaign, Channel }

	// uint here corresponds to the ItemType
	mapping (uint => uint) public counts;
	mapping (uint => mapping (uint => Item)) public items;

	// Publisher or Advertiser (could be both)
	struct Account {		
		address addr;
		address wallet;

		bytes32 ipfs; // ipfs addr for additional (larger) meta
		bytes32 name; // name
		bytes32 meta; // metadata, can be JSON, can be other format, depends on the high-level implementation

		bytes32 signature; // signature in the off-blockchain state channel
		
		// Items, by type, then in an array of numeric IDs	
		mapping (uint => uint[]) items;
	}

	// Sub-item, such as AdUnit, AdSlot, Campaign, Channel
	struct Item {
		uint id;
		address owner;

		ItemType itemType;

		bytes32 ipfs; // ipfs addr for additional (larger) meta
		bytes32 name; // name
		bytes32 meta; // metadata, can be JSON, can be other format, depends on the high-level implementation
	}

	modifier onlyRegistered() {
		var acc = accounts[msg.sender];
		require(acc.addr != 0);
		_;
	}

	// can be called over and over to update the data
	// XXX consider entrance barrier, such as locking in some ADX
	function register(bytes32 _name, address _wallet, bytes32 _ipfs, bytes32 _sig, bytes32 _meta)
		external
	{
		require(_wallet != 0);
		// XXX should we ensure _sig is not 0? if so, also add test

		var isNew = accounts[msg.sender].addr == 0;

		var acc = accounts[msg.sender];
		acc.addr = msg.sender;
		acc.wallet = _wallet;
		acc.ipfs = _ipfs;
		acc.name = _name;
		acc.meta = _meta;

		if (!isNew) require(acc.signature == _sig);
		acc.signature = _sig;

		if (isNew) LogAccountRegistered(acc.addr, acc.wallet, acc.ipfs, acc.name, acc.meta);
		else LogAccountModified(acc.addr, acc.wallet, acc.ipfs, acc.name, acc.meta);
	}

	// use _id = 0 to create a new item, otherwise modify existing
	function registerItem(uint _type, uint _id, bytes32 _ipfs, bytes32 _name, bytes32 _meta)
		onlyRegistered
	{
		// XXX _type sanity check?
		var item = items[_type][_id];

		if (_id == 0) {
			// XXX: what about overflow here?
			var newId = ++counts[_type];

			item = items[_type][newId];
			item.id = newId;
			item.itemType = ItemType(_type);
			item.owner = msg.sender;

			accounts[msg.sender].items[_type].push(item.id);
		}

		require(item.owner == msg.sender);

		item.name = _name;
		item.meta = _meta;
		item.ipfs = _ipfs;

		if (_id == 0) LogItemRegistered(
			item.owner, uint(item.itemType), item.id, item.ipfs, item.name, item.meta
		);
		else LogItemModified(
			item.owner, uint(item.itemType), item.id, item.ipfs, item.name, item.meta
		);
	}

	// NOTE
	// There's no real point of un-registering items
	// Campaigns need to be kept anyway, as well as ad units
	// END NOTE

	//
	// Constant functions
	//
	function isRegistered(address who)
		public 
		constant
		returns (bool)
	{
		var acc = accounts[who];
		return acc.addr != 0;
	}

	// Functions exposed for web3 interface
	// NOTE: this is sticking to the policy of keeping static-sized values at the left side of tuples
	function getAccount(address _acc)
		constant
		public
		returns (address, bytes32, bytes32, bytes32)
	{
		var acc = accounts[_acc];
		require(acc.addr != 0);
		return (acc.wallet, acc.ipfs, acc.name, acc.meta);
	}

	function getAccountItems(address _acc, uint _type)
		constant
		public
		returns (uint[])
	{
		var acc = accounts[_acc];
		require(acc.addr != 0);
		return acc.items[_type];
	}

	function getItem(uint _type, uint _id) 
		constant
		public
		returns (address, bytes32, bytes32, bytes32)
	{
		var item = items[_type][_id];
		require(item.id != 0);
		return (item.owner, item.ipfs, item.name, item.meta);
	}

	function hasItem(uint _type, uint _id)
		constant
		public
		returns (bool)
	{
		var item = items[_type][_id];
		return item.id != 0;
	}

	// Events
	event LogAccountRegistered(address addr, address wallet, bytes32 ipfs, bytes32 name, bytes32 meta);
	event LogAccountModified(address addr, address wallet, bytes32 ipfs, bytes32 name, bytes32 meta);
	
	event LogItemRegistered(address owner, uint itemType, uint id, bytes32 ipfs, bytes32 name, bytes32 meta);
	event LogItemModified(address owner, uint itemType, uint id, bytes32 ipfs, bytes32 name, bytes32 meta);
}
