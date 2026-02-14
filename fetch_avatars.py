import urllib.request
import re

url = "https://uifaces.co/category/cartoon"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    img_urls = re.findall(r'src="([^"]+)"', html)
    avatars = [u for u in img_urls if "uifaces" in u or "mighty.tools" in u]
    
    for url in avatars[:10]:
        print(url)
except Exception as e:
    print(f"Error: {e}")
