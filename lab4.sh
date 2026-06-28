#!/bin/bash
<<<<<<< HEAD
if [[ $# -eq 0 ]]; then
	echo "Nie podałeś argumentów."
fi

echo "log*.txt" > .gitignore

if [[ $1 == "--date" || $1 == "-d" ]]; then
	date
fi

function logs {
	for ((i=1; i<=100; i++)); do
		echo "Nazwa pliku: log$i.txt" > log$i.txt
		echo "Nazwa skryptu: lab4.sh" >> log$i.txt
		echo "data: $(date)" >> log$i.txt
	done
}



if [[ $1 == "--logs" || $1 == "-l" ]]; then
	if [[ -z $2 ]]; then
		logs
	fi
fi

function logs_n {
	for ((i=1; i<=$1; i++)); do
		echo "Nazwa pliku: log$i.txt" > log$i.txt
		echo "Nazwa skryptu: lab4.sh" >> log$i.txt
		echo "data: $(date)" >> log$i.txt
	done
}

if [[ $1 == "--logs" ]]; then
	if [[ $2 =~ ^[0-9]+$ ]]; then
		logs_n $2
	fi
fi

function help {
	echo"lab4.sh --date (-d)	- wyświetla datę"
	echo"lab4.sh --logs (-l)	- tworzy automatycznie 100 plików logx.txt"
	echo"lab4.sh --logs N   	- tworzy automatycznie N plików log.txt"
	echo"lab4.sh --help (-h)	- wyświetla wszytskie dostępne opcje"
}

if [[ $1 == "--help" || $1 == "-h" ]]; then
	help
fi

if [[ $1 == "--init" ]]; then
	git init
	export PATH=$PATH:$(pwd)
	echo "Sklonowano repozytorium i dodano do PATH."
fi


function error {
	for ((i=1; i<=$1; i++)); do
		echo "To jest plik error$i.txt" > error$i.txt
	done
}

if [[ $1 == "--error" ]]; then 
	if [[ -z $2 ]]; then
		error 100
	elif [[ $2 =~ ^[0-9]+$ ]]; then
		error $2
	fi 
fi 

echo -e "log*.txt\nerror*\n" >> .gitignore

