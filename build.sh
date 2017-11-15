#!/usr/bin/env bash

mkdir -p build-contract/{bundled,final}

if [ -z "`which solcjs`" ];
then
	function solcjs() {
		./node_modules/solc/solcjs $@
	}
fi

# NOTE: the bundled thing has to be on the top level, at least while building... because of the way solcjs relativizes the paths
ls contracts/ADX*.sol | while read line
do
	contract=$(basename $line .sol)

	./bundle.sh ./contracts/$contract.sol > $contract.sol
	
	solcjs --optimize --bin -o build-contract/final $contract.sol
	solcjs --optimize --abi -o build-contract/final $contract.sol
	
	mv $contract.sol build-contract/bundled/$contract.sol
done
