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