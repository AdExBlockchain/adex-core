# Glossary

* conversion goal

# Overview

The core philosophy of AdEx is it's balanced/correct use of blockchain. The AdEx Network only uses the blockchain for mission-critical data, such as accomplished conversion goals and payment. That way, it eliminates the ability for fraud and lack of transparency when it comes to the critical things, therefore eliminating the incentive to manipulate statistics, which will be kept off-chain to allow for great volumes of analytics data.

We call the critical set of smart contracts that facilitate the most important interactions between publishers, users and advertisers the "AdEx Core". The AdEx Core will be kept small and highly modular, to mitigate the possibility and impact of potential bugs in smart contracts.

## This is the architecture of the Core:

* ADXToken: the ERC20 token used to trade advertising space
* ADXPublisherRegistry: handles information about publishers, such as accounts and individual websites/apps
* ADXAdvertiserRegistry: handles information about advertisers, such as accounts and invidual campaigns
* ADXUserRegistry: handles information about end users and their legitimacy
* ADXExchange: handles the bidding, bid accept/execute, payment processes; once a bid has been accepted, it locks the ADX tokens until both publisher and advertiser have successfully confirmed the execution of the bid, after which it unlocks the ADX tokens and transfers them to the publisher

## Possible additions:
* ADXToken2 (ADXT): an upgradable ERC20 token with an inflation model designed to improve the token's scalability and avoid too much scarcity; the migration to this token will happen seamlessly - both would be usable in the core, but the token contract will allow buying ADXT with the old ADX token, so that the token will be upgraded voluntarily 


## The AdEx core versioning scheme is as follows:

* The entire package has a generation number; e.g. AdEx Core V1; this number is only meant to change when the model is very significantly altered, essentially a new big iteration of the core; this will happen when enough real-world usage data has been gathered to design an improved model; it's not expected that modules from older generations of the core will be compatible with the next generations, with the exception of the tokens (ADXToken/ADXToken2); within one generation, there must be a common interface of interaction between the modules

* Every module has an individual version, and within the same generation of the core, every module can be upgraded individually without breaking other modules; this allows for easy upgradability


## Level two

For later generations of the core, there's the posibility of adding off-chain solutions that supplement the main smart contracts, for example a layer 2 solution that will handle real-time bidding and commit the overall results to the ethereum blockchain (`ADXRealTimeBiddingExchange`) - therefore replacing the current off-chain hyperlog-based solution.

Possible level two solutions: TrueBit, polkadot

## Ports

The AdEx Core may be ported to other technologies such as aeternity or rootstock if they have the necessary scalability and maturity. This, again, is something that may change only across generations of the Core.

# SDK 

Another key advantage of AdEx is it's strong interoperability - the AdEx SDK for publishers works just like any other publisher SDK in the browser, built right on top of HTML5 and compatible with any modern browser. The publisher SDK can be integrated in your web site / web application in a matter of minutes with just copying/pasting code.

The SDK has two modes of operation: 
Full mode: directly connects to Ethereum, IPFS and hyperlog nodes through protocols like WebRTC and WebSockets
Light mode: connects to a publisher endpoint, which facilitates the connection to Ethereum and hyperlog; reads IPFS through an IPFS gateway or through the publisher endpoint

The full mode is suitable for web-based single-page applications, which load once and dynamically change their content based on user interactions. This mode does not put any strains on the publisher's servers, but it requires a modern browser and some small loading time.

The light mode is suitable for simpler websites, such as news websites and blogs. This mode is also more suitable for mobile browsers or older browsers. The light mode does require infrastructure from the part of the publisher, which means a central point, but it's still as fraud-proof, because it still needs to submit proof of conversion and user ID to the blockchain-based core (the exchange).

The SDK is based on web tech, but this doesn't mean it's restricted to web browsers only. Mobile and desktop applications can still easily benefit from this SDK by using a web view, which is a standard approach for the adtech industry anyway, and ensures the same technological stack in any case. For mobile/desktop, publishers can choose the full/light mode depending on their needs and use case.


# The publisher portal

The publisher portal is a client-side dapp bundled along with a server that contains a hyperlog instance, publisher endpoint server (used by the SDK and the AdEx Profile) and serves the app itself.

The publisher portal will handle publisher registration, registering different websites/apps (channels) and advertising properties (particular places in the given channel).

But most importantly, the publisher will use this portal for accepting particular bids for their advertising property.

The publisher will be able to set-up automatic bid accepting through the publisher portal - the portal server itself will be responsible for monitoring bids and accepting them for the free properties, based on rules set out by the publisher themselves. Multiple bids can be accepted for a single property too, which will lead to ad rotation and dynamic selection of ads depending on user profile.

Publishers will be encouraged to self-host the portal themselves, but for convenience the AdEx organization will provide a cloud-hosted portal for an appropriate hosting fee.


# The advertiser portal

Similarly to the publisher portal, the advertiser portal is a client-side dapp bundled along with a server that contains a hyperlog instance.

The advertiser portal allows advertisers to register themselves, register different ad campaigns and then place bids over advertising space. The bids are placed by defining a conversion goal, how many times it has to be achieved, what's the ADX reward for executing the bid, maximum time to execute the bid and recommended target audience.

The number of executed conversion goals to be executed is an important parameter of each bid. Smaller numbers ensure more granularity and control, while bigger numbers allow for a more hands-off approach for the publisher and advertiser, but less control over the price. Of course, the number has to be big enough to justify the gas that will be paid to confirm the execution of the bid. The need of balancing out this number will be eliminated in the future by adding real-time bidding with AdEx V2.

As with the publisher portal, advertisers will be encouraged to self-host the portal themselves, but for convenience the AdEx organization will provide a cloud-hosted portal for an appropriate hosting fee.



# User targeting

The user targeting algorithm is public and is ran entirely on the client side, so as to keep personal user data only in the user's browser. This has the added overhead of having to pull information about multiple ads directly on the client side, and then make the selection. We believe this is not an issue: since bids are accepted manually, and publishers/advertisers have control over who they work with, we expect no more than couple of hundred of different ads (at most!) are going to be in contension for one impression. Pulling targeting metadata about, for example, 300 different ad units, is not a challenging task for modern internet conenctions (even slow ones), and the selection algorithm itself is not anything heavy either.

Of course, the ad selection algorithm is a yet another thing that can be customized in AdEx, besides giving you control of which bids you accept in the first place.

To keep the personal data of the user, we intend using `localStorage`. Data kept in `localStorage` is sandboxed to domains, which means we're going to need a central domain (e.g. `user.adex.network`) where the `localStorage` data is going to be sandboxed to. This is a central component, but `localStorage` data is not accessible on the server-side of `user.adex.network`, nor from anywhere outside the user's own browser. The domain is merely used to confine this data to a sandbox that will be readable by the SDK any time an ad selection needs to be made.

[visual info of what is readable from where]

# The AdEx Profile

The AdEx profile is a client-side dapp (HTML5, in browser) that allows users to change their preferences regarding advertising and essentially describe their interests by themselves. To avoid the need for users to have ETH wallets, users will be completely passive, only reading from the ethereum network. In order for them to change their taste preferences (or to log a conversion action), they would have to go through the publisher, who'd be responsible for paying the gas.

The change of preferences can be verified directly in the Profile dapp, by reading information from the AdEx Core - reading data from smart contracts does not charge gas - and then displaying a success message or an error message.

Through the same process, the user will be able to report particular advertisements to the publisher, in case they consider them inappropriate.


# Reporting

Detailed reporting data is kept off-chain in a multi-master append-only database called hyperlog (mafintosh/hyperlog), although any database with similar characteristics can be used instead. To ensure consistency, the overall result will be verified through the AdEx Core ADXExchange module. 

Every involved party - advertisers, publishers and users - would log events to the this database, ensuring that detailed reports can be extracted from it.

Because the database is peet-to-peer, and is stored by the publishers and advertisers, there's pratically no scalability issue to record as many events as possible.

Separate databases will be used for every publisher<->advertiser relationship, which allows for private databases in case the involved parties do not want their detailed data public (although the result outline will be kept on the blockchain, therefore still being transparent enough), and inheritly improves scalability because it's essentially equivalent to sharding.

See the "Scalability" section for more details on how the data is kept.

A further perk of keeping reporting data in such a database only shared between publisher/advertiser, is that only they get access to the detailed reports, while the public can still see on the blockchain that the overall result makes sense and the data is not being manipulated.


To ensure quick aggregation of the data, the publisher portal server will allow executing MapReduce queries on the dataset. MapReduce is a declarative programming model for processing and aggregating big data sets. The advantage of the MapReduce model is that the computation of the overall result can be distributed, therefore faster and easier to facilitate. But the biggest advantage in this particular case is that the aggregation can happen over time, as the data set grows larger, which provides an up-to-date result at any moment without having to re-compute it from scratch. This is similar to the "Views" in CouchDB. This model also allows for any kind of aggregation, including custom queries that the publishers/advertisers define themselves. 

This access to raw data with a quick aggregation system makes AdEx highly flexible and powerful when it comes to reporting.

# Storage 

The metadata and multimedia for advertising campaigns is kept in a peer to peer storage system called IPFS.

IPFS will be used to keep advertisement-related media, such as images, videos and larger media (e.g video/interactive ads), as well as smaller files like metadata JSON, HTML and CSS.

IPFS is an open source project developed since 2014 by Protocol Labs with help from the open source community.

AdEx would still allow ads hosted on existing infrastructure (e.g. CDNs), to allow compatibility with the existing ad industry, while still having the reporting transparency and overall process efficiency of our solution.

In the HTML5 SDK, IPFS can be read through a HTTP gateway (just like regular CDNs), or WebSockets/WebRTC, which are planned transport protocols for IPFS.


# Exchange mechanism

The exchange mechanism is implemented by the ADXExchange module of the AdEx core - it works by keeping a simple list of bids and giving the opportunity for publishers to accept them. Automatic or real time bidding will be implemented in later generations as the technology evolves, but for now manual or semi-automatic bidding are the two available options

# Scalability

The system is designed in such a way that only critical data is verified on the blockchain. Detailed data is only synced between publishers/advertisers, and the overall result of that is verified on the blockchain upon completion of certain bigger goals (e.g. 1000 conversions). Bids on the exchange are done for whole packages (e.g. "1000 conversions for this ad") instead of granularly, which allows us to define the bigger goal that the blockchain part (AdEx Core) will be verifying.

Even though you can technically manipulate the statistical data (e.g.  details about individual conversion goals), there's no incentive for you to do that, because the overall result (e.g total conversion goals completed, therefore revenue) must be verified through the blockchain. Furthermore, publishers, advertisers and users alike log events in this off-chain peer-to-peer DB, so any inconsistency is quickly noticable.

This is very similar to the concept of Ethereum state channels described by Stephan Tual in his blog (https://blog.stephantual.com/what-are-state-channels-32a81f7accab).

For now, off-chain data is kept in a peer-to-peer multi-master-replication database, but if a technology that allows some further verification/confirmation of the data emerges, while still being scalable enough, for example BigchainDB, it can be used instead.

Because of the potential inconsistency with that kind of off-chain DBs, the AdEx core will allow certain margin of error for archieving the overall goals (accepted bids), so as to still allow verification of the goal achievement even if some small data points are lost. The advertiser will be able to set the accepted margin of error, and to prevent fraud by exploiting the limits of the margin of error, the exact number will be logged to the blockchain - if an advertiser decides that a publisher is consistently arriving at the upper-bound of the allowed margin of error, they can opt out of working with them.



# User verification

To prevent the possibility of publishers performing sybil attacks on the network by registering multiple users and logging conversion goals, there will be an algorithm that tracks the possible legitimacy of every user. Once user data is written to ADXUserRegistry by publishers upon achieving conversion goals, users would be able to gain point towards their legitimacy rating.

Possible factors for gaining points include:

* Number of publishers have confirmed this user achieved conversion goals
* Advertisers confirmed this user as a user with a unique IP
* A trusted authority confirmed the legitimacy of this user through the client-side SDK
* The user solved a captcha shown by the client-side SDK (only once per every cryptographic identity)

Every advertiser will be able to set a minimum threshold of user legitimacy before a conversion goal is being counted.

But most importantly, the AdEx Network in designed to work with conversion goals, which decreases the incentive for such a sybil attack anyway: if, for example, the conversion goal is to onboard a paying user, then there's no incentive to actually create a paying user to get the reward from that, since you'll end up losing money. A conversion goal may also be to successfully onboard a user to a new product and get them to complete a conversion goal of an advertisement within that product.

This ensures a model that may be slow to generate revenue, but discourages any possibility of ad fraud.

It also gives advertisers an option of how much they want to verify legitimacy, therefore balancing between anti-fraud measures and the speed that they achieve results.


# Full process walk-through

[put a visual here]

This is an example walk through of the entire process of an user seeing an ad, and the publisher receiving the ADX reward for it:

1. Publisher registers themselves, their website and the ad property in the publisher portal
2. Advertiser registers themselves and the advertising campaign in the advertiser portal
3. Advertiser places bid for 1 executed conversion goal (for the sale of simplicity, only 1; in the real world, this will be set to 10-1000 conversion goals)
4. Publisher accepts that bid
5. User goes to the website, and triggers the SDK
6. The SDK initializes, pulls data from the AdEx core smart contracts, the publisher and the advertiser; finds out that the publisher accepted one bid, and the 1 conversion goal is not yet realized; it pulls data from IPFS to display the ad, and displays it, meanwhile logging a "Load" and "Impression" to the hyperlog database
7. The user clicks on the ad (logging "Click" on the hyperlog), and signs-up for the advertised product, therefore triggering a confirmation from the advertiser side that the conversion goal is met
8. Since the bid now should be executed, the publisher calls the AdEx core to confirm with the aggregate data of executing the bid; the advertiser confirms this and the AdEx core (ADXExchange in particular) unlocks the ADX reward and transfers it to the publisher


# ADXToken2 (ADXT)

ADXT is a conceptual token that may be launched in the future, once the AdEx Network is highly developed and seeing large traffic.

The ADXT is used in the same way as ADX, but has a built-in inflation model that rewards network participants with newly minted token, therefore incentivizing usage of the platform and also inheritly increases the scalability of the token by ensuring it won't become too scarce.

The reason this inflation model is not included in the initial version (ADX) is that this model needs to be designed by using real-world usage data of the AdEx Network instead of theoretical speculation.

ADXT would be a smart contract, part of the AdEx Core, and it would allow exchange of the ADX token for the new ADXT token, allowing ADX token holders to easily upgrade. 

# AdEx Fund

The AdEx Fund is a pool of tokens used by the AdEx Network organization to sell to advertisers at the moment of their registration and usage of the platform, therefore giving them [easy access to ADX tokens](https://imgflip.com/i/1rwbzf)
