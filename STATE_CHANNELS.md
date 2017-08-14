
# AdEx State channels:

In the browser, the user generates an identity (if they don't have one) and they generate an event looking like:
```{
	type: "impression",
	timestamp: 1501944407916,
	url: "https://app.strem.io/#movies",
	bidId: 233
}```

This gets signed by the user identity and sent to the publisher endpoint AND to the advertiser endpoint.

Example:
```{
	data: { type: "impression" .... },
	sig: <user signature>
}
```

Both of them:

1. verify the signature; this includes blacklisting/discarding of known malicious identities (lists get synced over IPFS)
2. handle their own DDOS/spam protection by limiting amount of HTTP requests from an IP (nginx)
3. Sign the event (already signed by the user) with their own identity; then they write to scuttlebutt channels #publisher and #advertiser respectively; 

The DB is setup in such a way to only accept messages signed by the publisher's or advertiser's identities. The user signature is already contained in the message body sent to the publisher/advertiser.

The message that gets written ends up looking like:
```{
	data: { 
		data: { type: "impression", ... }, 
		sig: <user signature> 
	},
	sig: <publisher/advertiser signature>
}```

The publisher and advertiser are responsible keeping track of each other's data and signalling to the smart contract when the bid is considered completed

The SDK will pull a list of all bids for a given space from the publisher's node, because the publisher's node knows which ones are completed even if it's not written to the Ethereum blockchain. There's also the possibility of that list being double-checked against the blockchain via web3+infura 


## Signatures

For signatures, we currently use ed25519. 


The public key is written on the blockchain via the ADXRegistry contract. 

For publishers/advertisers, the private key is kept in their keystore file.

The private keys for users are kept in their browser in `localStorage`. They are generated the first time the AdEx SDK is initialized in the user's browser.
