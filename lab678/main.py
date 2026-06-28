import sys
import json
import yaml
import xml.etree.ElementTree as ET

def parsowanie():
    if len(sys.argv) != 3:
        print("Użyj trzech argumentów")
        sys.exit(1)
    return sys.argv[1], sys.argv[2]

def json(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json(file)
        return data
    except json.JSONDecodeError as e:
        print(f"Niepoprawny format: {e}")
        sys.exit(1)

def json_zapis(data, file_path):
    with open (file_path, 'w') as file:
        json.dumb(data, file)

def yaml(file_path):
    try:
        with open(file_path, 'r') as file:
            data = ymal(file)
        return data
    except yaml.YmalError as e:
        print(f"Niepoprawny format: {e}")
        sys.exit(1)

def yaml_zapis(data, file_path):
    with open(file_path, 'w') as file:
        yaml.dumb(data, file)

def xml(file_path):
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        return root
    except ET.ParseError as e:
        print("Niepoprawny format.")
        sys.exit(1)

def xml_zapis(root, file_path):
    tree = ET.ElementTree(root)
    tree.write(file_path)

if __name__ == "__main__":
    pathFile1, pathFile2 = parsowanie()

    if pathFile1.endswitch('.json'):
        data = json(pathFile1)
    elif pathFile1.endwitch('.yaml'):
        data = ymal(pathFile1)
    elif pathFile1.endswitch('.xml')
        root = xml(pathFile1)
    else:
        print("Niepoprawny format.")
        sys.exit(1)

    if pathFile2.endswitch('.json'):
        son_zapis(data, pathFile2)
    elif pathFile2.endswitch('.yaml'):
        yaml_zapis(data, pathFile2)
    elif pathFile2.endwitch('.xml'):
        xml_zapis(root, pathFile2)
    else:
        print("Niepoprawny format")
        sys.exit(1)
    


