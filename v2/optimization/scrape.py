import os
import json
import requests
import zipfile
from pathlib import Path
import re

# === CONFIG ===
GITHUB_TOKEN = ""  # Leave "" if none
TOPIC = "phaser"
MAX_REPOS = 5
OUTPUT_DIR = "optimization/phaser_scraped_api"
SNIPPET_JSON = "optimization/phaser_snippets.json"

# === Headers ===
headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'PhaserScraper'
}
if GITHUB_TOKEN:
    headers['Authorization'] = f'token {GITHUB_TOKEN}'

def search_repos(query, max_repos):
    url = f"https://api.github.com/search/repositories?q={query}+language:JavaScript&sort=stars&order=desc&per_page={max_repos}"
    r = requests.get(url, headers=headers)
    items = r.json().get("items", [])
    return [item["html_url"] for item in items]

def download_and_extract_repo(repo_url, target_dir):
    repo_name = repo_url.rstrip('/').split('/')[-1]
    owner = repo_url.rstrip('/').split('/')[-2]

    for branch in ['main', 'master']:
        zip_url = f"https://github.com/{owner}/{repo_name}/archive/refs/heads/{branch}.zip"
        try:
            r = requests.get(zip_url, timeout=10)
            if r.status_code == 200:
                zip_path = os.path.join(target_dir, f"{repo_name}.zip")
                with open(zip_path, "wb") as f:
                    f.write(r.content)
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(os.path.join(target_dir, repo_name))
                os.remove(zip_path)
                return os.path.join(target_dir, repo_name)
        except:
            continue
    return None

def extract_phaser_code_blocks(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        code = f.read()

    code_blocks = {}
    for fn in ['preload', 'create', 'update']:
        match = re.search(rf'{fn}\s*\([^)]*\)\s*\{{[\s\S]*?\n\}}', code)
        if match:
            code_blocks[fn] = match.group(0)

    if 'Phaser.Scene' in code or 'extends Phaser.Scene' in code:
        code_blocks['full_file'] = code

    return code_blocks if code_blocks else None

def scan_dir_for_phaser(path):
    results = []
    for root, _, files in os.walk(path):
        for file in files:
            if file.endswith('.js') or file.endswith('.ts'):
                fullpath = os.path.join(root, file)
                blocks = extract_phaser_code_blocks(fullpath)
                if blocks:
                    results.append({
                        "path": fullpath,
                        "functions": blocks
                    })
    return results

# === MAIN ===
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
all_snippets = []

print(f"[1/3] Querying GitHub API...")
repos = search_repos(TOPIC, MAX_REPOS)

print(f"[2/3] Downloading and scanning {len(repos)} repos...")
for url in repos:
    print(f"→ {url}")
    repo_dir = download_and_extract_repo(url, OUTPUT_DIR)
    if not repo_dir:
        print("  ❌ Failed to download")
        continue
    found = scan_dir_for_phaser(repo_dir)
    all_snippets.extend(found)

print(f"[3/3] Saving {len(all_snippets)} snippets to {SNIPPET_JSON}...")
with open(SNIPPET_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_snippets, f, indent=2)

print("✅ Done.")
