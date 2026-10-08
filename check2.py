import urllib.request
import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

try:
    req = urllib.request.Request('https://sisaudin.ghc.com.br/api/notas-tecnicas')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        for item in data:
            if str(item.get('id')) == '2':
                print(f"ID: 2 - Analise Fatos: {item.get('analiseFatos')}")
except Exception as e:
    print(e)
