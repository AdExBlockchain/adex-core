#!/usr/bin/env bash 

# simple version, does not work because of no dedup
#echo $1 >&2
#cat $1 | egrep "^import " | cut -d"\"" -f2 | cut -d"'" -f2 | while read line; do $0 "$(dirname $1)/$line"; done
#cat $1 | egrep -v "^(pragma solidity |import )"


listFiles() {
	# brew install coreutils
	cat $1 | egrep "^import " | cut -d"\"" -f2 | cut -d"'" -f2 | while read line; do listFiles $(dirname $1)/$line; done
        realpath $1
}

#echo "pragma solidity ^0.4.15;"
egrep -h "^pragma solidity" $1 | head -n1

listFiles $1 | awk '!x[$0]++' | while read line; do
	cat $line | egrep -v "^(pragma solidity |import )" 
done

