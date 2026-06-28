#!/bin/bash
if [ ! -d "errorx" ]; then
	mkdir errorx
fi 

for ((i=1; i<=100; i++)); do 
	touch "errorx"
done 
