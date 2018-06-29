# Bid

An advertising bid is a generic request to purchase advertising space/time.

An advertising bid is defined as:

exchange
token
tokenAmount
goal (IPFS)
validators (array of addresses)

And is signed by the advertiser

@TODO trading for a bid (i.e. treating it like a NFT)

# Execution period

Once a bid has been accepted by a publisher, the execution time starts. 

The execution, in the case of display advertising, involves the publisher showing contributing towards the goal by showing the display ad to users.
The AdEx SDK will use the user's auto-generated keypair to sign all interactions (Events; for example seeing the ad, clicking on it, or dismissing it) and send them to all the delegates.
Delegates must also gossip the signed Events between themselves, to ensure  

Within the execution period, all delegates must submit proof of successful execution by posting a ValidateBid(ProofHash) transaction it this happened. If a supermajority (over 2/3) of proofs is achieved, then the bid would be considered valid and the token reward will be transfered to the publisher



@TODO ring sigs and groups