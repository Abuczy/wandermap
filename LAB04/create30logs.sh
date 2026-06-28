#!/bin/bash

liczba=$2
for ((i=1; i<=liczba; i++)); do
	nazwa="log$i.txt"
	echo "Nazwa pliku: $nazwa" > "$nazwa"
	echo "Nazwa skryptu: $0" >> "$nazwa"
	echo "Data: $(date)" >> "$nazwa"
done

