import urllib.request
import re
import os

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def get_avatar_urls(category):
    url = f"https://uifaces.co/category/{category}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
        img_urls = re.findall(r'src="([^"]+)"', html)
        return [u for u in img_urls if "uifaces" in u or "mighty.tools" in u]
    except Exception as e:
        print(f"Error fetching {category}: {e}")
        return []

def download_avatars(urls, prefix, dest_dir="public/avatars"):
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
    for i, url in enumerate(urls[:10]):
        try:
            filename = f"{prefix}_{i+1}.jpg"
            filepath = os.path.join(dest_dir, filename)
            print(f"Downloading {url} to {filepath}...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Done: {filename}")
        except Exception as e:
            print(f"Error downloading {url}: {e}")

# Fetch and download Human avatars
print("Fetching Human avatars...")
human_urls = get_avatar_urls("human")
if human_urls:
    download_avatars(human_urls, "human")
else:
    print("No Human avatar URLs found.")
