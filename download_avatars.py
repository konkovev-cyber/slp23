import urllib.request
import os

urls = [
    "https://mockmind-api.uifaces.co/content/cartoon/23.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/24.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/25.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/26.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/27.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/28.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/29.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/30.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/31.jpg",
    "https://mockmind-api.uifaces.co/content/cartoon/32.jpg"
]

dest_dir = "public/avatars"
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for i, url in enumerate(urls):
    try:
        filename = f"avatar_{i+1}.jpg"
        filepath = os.path.join(dest_dir, filename)
        print(f"Downloading {url} to {filepath}...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Done: {filename}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
