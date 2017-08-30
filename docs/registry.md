## ADXRegistry

The registry is the contract that is responsible to registering ethereum addresses as AdEx Accounts, which means a participant in AdEx in general: a  publisher, advertiser or both.

End users do not need to be registered (and can't) to this contract.

The registry also allows registering `Items`, which are basically a combination of `(ItemType, ipfs, name, meta)`, with an ID and an owner. They are used to represent ad units, ad slots, ad campaigns (combo of ad units) and ad channels (combo of ad slots), but could be used to represent other similar structures in the future, because of the flexible `ItemType` value.

More details:

`ItemType` - `uint` - currently understood types are AdUnit (0), AdSlot (1), Campaign (2), Channel (3)

`ipfs` - `bytes32` - link to an IPFS address containing a JSON blob describing this item in more detail

`name` - `bytes32` - used as a 32 characters string with a latin name of the item

`meta` - `bytes32` - blob used for any useful metadata, depending on item