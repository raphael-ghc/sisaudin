import urllib.request
import json

try:
    req = urllib.request.Request('https://sisaudin.ghc.com.br/api/notas-tecnicas')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for item in data:
            print(f"ID: {item.get('id')} - Analise Fatos: {item.get('analiseFatos')}")
except Exception as e:
    print(e)
