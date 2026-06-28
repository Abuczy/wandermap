#!/bin/bash
if [ "$1" == "--init" ]; then
	git clone https://github.com/oliwkata/LAB04 . && \
	export PATH=$PATH:$(pwd)
	echo "Sklonowano repozytorium i dodano PATH"
	exit 0
fi

