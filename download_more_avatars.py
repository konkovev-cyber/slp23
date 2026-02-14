import urllib.request
import os

dest_dir = "public/avatars"
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_file(url, filename):
    filepath = os.path.join(dest_dir, filename)
    print(f"Downloading {url} to {filepath}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Done: {filename}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

# Sources
# 1. DiceBear (using initials/seeds for variety)
# DiceBear can return PNG if specified
seeds = ["James", "Maria", "Alex", "Zoe", "Leo"]
for i, seed in enumerate(seeds):
    url = f"https://api.dicebear.com/7.x/big-smile/png?seed={seed}"
    download_file(url, f"dicebear_{i+1}.png")

# 2. Pravatar.cc (Realistic placeholders)
for i in range(1, 6):
    url = f"https://i.pravatar.cc/300?u={i+100}"
    download_file(url, f"pravatar_{i}.jpg")

# 3. RoboHash (Funny robots)
for i in range(1, 6):
    url = f"https://robohash.org/{i+50}?set=set1"
    download_file(url, f"robot_{i}.png")
