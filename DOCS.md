## ADXRegistry

The registry is the contract that is responsible to registering ethereum addresses as AdEx Accounts, which means a participant in AdEx in general: a  publisher, advertiser or both.

End users do not need to be registered (and can't) to this contract.

The registry also allows registering `Items`, which are basically a combination of `(ItemType, ipfs, name, meta)`, with an ID and an owner. They are used to represent ad units, ad slots, ad campaigns (combo of ad units) and ad channels (combo of ad slots), but could be used to represent other similar structures in the future, because of the flexible `ItemType` value.

More details:

`ItemType` - `uint` - currently understood types are AdUnit (0), AdSlot (1), Campaign (2), Channel (3)

`ipfs` - `bytes32` - link to an IPFS address containing a JSON blob describing this item in more detail

`name` - `bytes32` - used as a 32 characters string with a latin name of the item

`meta` - `bytes32` - blob used for any useful metadata, depending on item

## ADXExchange

The AdEx exchange handles bids, their creation (by an advertiser), acceptance (by a publisher) and then the mutual agreement between advertiser and publisher (consensus), including the facilitation of the payment in ADX tokens. 

Basically the flow is:

1. An advertiser opens a bid with a certain ad unit, certain reward (e.g. 10000 ADX), certain target (e.g. 1000 clicks) and a timeout. To do that, they need to lock 10000 ADX to the smart contract
2. A publisher accepts this bid for one of their compatible ad units
3. The publisher delivers the goal, and confirms that to the smart contract. The advertiser also confirms this to the smart contract. This happens programatically, but the signing of the Ethereum transaction itself may need human intervention (e.g. if using a Trezor wallet)
4. The ADX reward gets transferred to the publisher


Alternative scenarios are:

- The bid times out without the goal being delivered, in which case the ADX gets returned
- The advertiser cancels the bid before it's accepted, in which case the ADX gets returned
- The publisher gives up the bid after they've accepted it, in which case the ADX gets returned