
# AdEx State channels:

In the browser, the user generates an identity (if they don't have one) and they generate an event looking like:
```
{
	type: "impression",
	timestamp: 1501944407916,
	url: "https://app.strem.io/#movies",
	bidId: 233
}
```

This gets signed by the user identity and sent to the publisher endpoint AND to the advertiser endpoint.

Example:
```
{
	data: { type: "impression" .... },
	sig: <user signature>
}
```

Both of them:

1. verify the signature; this includes blacklisting/discarding of known malicious identities (lists get synced over IPFS)
2. handle their own DDOS/spam protection by limiting amount of HTTP requests from an IP (nginx)
3. Sign the event (already signed by the user) with their own identity and write it to the database (either scuttlebutt channels #publisher and #advertiser respectively, or their own redis DB)

The user signature is already contained in the message body sent to the publisher/advertiser.

The message that gets written ends up looking like:
```
{
	data: { 
		data: { type: "impression", ... }, 
		sig: <user signature> 
	},
	sig: <publisher/advertiser signature>
}
```

The publisher and advertiser are responsible keeping track of each other's data and signalling to the smart contract when the bid is considered completed.

The SDK will pull a list of all bids for a given space from the publisher's node, because the publisher's node knows which ones are completed even if it's not written to the Ethereum blockchain. There's also the possibility of that list being double-checked against the blockchain via web3+infura 


## secure-scuttlebutt design

secure-scuttlebutt is a database of unforgeable append-only feeds, optimized for efficient replication. This makes it useful for our application.

Messages will be generated and signed by the user, then sent to the advertiser and the publisher nodes, where they will be signed by their own signatures too and written to SSB. They will be replicated between all publisher and advertiser nodes, therefore improving data redundancy.

The node is setup in such a way to only sync messages signed by the publisher's or advertiser's identities.


## redis design

An alternative design is to use redis for the state channel, where both the publisher and the advertiser are responsible for keeping their own copy. 

The advantages of this approach are related to performance, since redis is very well suited to high throughput. Also, there are many implementations of a redis client, allowing more flexibility when implementing the AdEx node.  

In this case, the publisher does not sync the advertiser data or vice versa. This is not a problem, because the user sends the same data to both parties. 

## Signatures

For signatures, we currently use ed25519. 


The public key is written on the blockchain via the ADXRegistry contract. 

For publishers/advertisers, the private key is kept in their keystore file.

The private keys for users are kept in their browser in `localStorage`. They are generated the first time the AdEx SDK is initialized in the user's browser.


## FAQ 

Q: Why is reporting data kept in scuttlebutt/redis and not on the blockchain
A: Reporting data - individual impressions, clicks and events in general - is too big and time-critical to be kept on the blockchain 

Q: Doesn't that make the reporting data manipulatable?
A: The user sends the same events to the publisher node and the advertiser node, so you get the reporting data as it's generated from the user; if one of the parties tries to manipulate the data, the other party will not agree with them and therefore they will not reach an agreement on the blockchain (call the `verifyBid()` on `ADXExchange`)

Q: How is agreement being reached?
A: The publisher and advertiser nodes each monitor their own reporting data in relation to every bid. Each party will call the `verifyBid()` function on the `ADXExchange` smart contract, when it sees that the agreed-upon target of clicks is reached in their own data feed. Once both of them do that, the smart contract will release the bid reward from escrow and allow the publisher to withdraw it.

