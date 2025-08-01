import os
import json
import requests
import zipfile
from pathlib import Path
import re
import tempfile

# === CONFIG ===
GITHUB_TOKEN = ""  # Leave "" if none
TOPICS = [
    "phaser-game", 
    "phaser3-game", 
    "space-shooter-phaser",
    "platformer-phaser",
    "phaser-tutorial",
    "phaser-examples"
]
MAX_REPOS_PER_TOPIC = 3  # More targeted approach
OUTPUT_DIR = "optimization/phaser_scraped_api"
SNIPPET_JSON = "optimization/phaser_snippets.json"

# === Headers ===
headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'PhaserScraper'
}
if GITHUB_TOKEN:
    headers['Authorization'] = f'token {GITHUB_TOKEN}'

def is_game_repo(repo_data):
    """Filter for actual game repos, not library repos"""
    name = repo_data["name"].lower()
    description = (repo_data.get("description") or "").lower()
    
    # Skip library/framework repos
    skip_keywords = ["library", "framework", "plugin", "engine", "phaser.js", "source", "docs", "documentation"]
    if any(keyword in name or keyword in description for keyword in skip_keywords):
        return False
    
    # Skip if it's the main Phaser repo
    if "photonstorm" in repo_data.get("owner", {}).get("login", "").lower():
        return False
    
    # Prefer game repos
    game_keywords = ["game", "shooter", "platformer", "arcade", "tutorial", "example", "demo"]
    has_game_keywords = any(keyword in name or keyword in description for keyword in game_keywords)
    
    # Additional checks
    stars = repo_data.get("stargazers_count", 0)
    size = repo_data.get("size", 0)
    
    # Prefer repos with some activity but not massive (likely not core library)
    return has_game_keywords and stars > 1 and size < 50000

def search_game_repos(query, max_repos):
    """Search for game repositories with better filtering"""
    url = f"https://api.github.com/search/repositories?q={query}+language:JavaScript&sort=stars&order=desc&per_page=30"
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        print(f"API error: {r.status_code}")
        return []
    
    items = r.json().get("items", [])
    
    # Filter for actual games
    game_repos = [item for item in items if is_game_repo(item)]
    
    # Return top results
    return [repo["html_url"] for repo in game_repos[:max_repos]]

def download_and_extract_repo(repo_url, target_dir):
    repo_name = repo_url.rstrip('/').split('/')[-1]
    owner = repo_url.rstrip('/').split('/')[-2]
    print(f"  📦 Downloading {owner}/{repo_name}...")

    for branch in ['main', 'master']:
        zip_url = f"https://github.com/{owner}/{repo_name}/archive/refs/heads/{branch}.zip"
        try:
            r = requests.get(zip_url, timeout=15)
            if r.status_code == 200:
                with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
                    tmp_file.write(r.content)
                    zip_path = tmp_file.name
                
                extract_path = os.path.join(target_dir, repo_name)
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_path)
                os.unlink(zip_path)
                return extract_path
        except Exception as e:
            print(f"    ❌ Failed to download {branch}: {e}")
            continue
    return None

def is_useful_game_file(filepath):
    """Check if file contains useful game code"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Skip if too small or too large
        if len(content) < 200 or len(content) > 50000:
            return False
        
        # Skip obvious documentation/config files
        skip_patterns = [
            "webpack", "package.json", "readme", "license", "changelog",
            "@license", "@copyright", "module.exports =", "/*!", 
            "documentation", "dist/", "build/", "node_modules/"
        ]
        
        if any(pattern in content.lower() for pattern in skip_patterns):
            return False
        
        # Must contain actual Phaser game code
        game_indicators = [
            "Phaser.Scene", "extends Phaser.Scene", "this.physics", 
            "this.player", "this.enemies", "this.add.sprite", 
            "this.input.keyboard", "this.time.addEvent", "preload()",
            "create()", "update()", "Phaser.Game"
        ]
        
        return any(indicator in content for indicator in game_indicators)
        
    except Exception:
        return False

def extract_phaser_code_blocks(filepath):
    """Extract meaningful game code chunks"""
    if not is_useful_game_file(filepath):
        return []
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        code = f.read()
    
    snippets = []
    
    # Extract scene classes
    scene_pattern = r'class\s+\w+\s+extends\s+Phaser\.Scene\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    scene_matches = re.findall(scene_pattern, code, re.DOTALL)
    for match in scene_matches:
        if len(match) > 100:  # Skip tiny classes
            snippets.append({
                "type": "scene_class",
                "code": match[:2000],  # Limit size
                "file": os.path.basename(filepath)
            })
    
    # Extract key methods (preload, create, update)
    method_patterns = {
        "preload": r'preload\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',
        "create": r'create\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',
        "update": r'update\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    }
    
    for method_name, pattern in method_patterns.items():
        matches = re.findall(pattern, code, re.DOTALL)
        for match in matches:
            if len(match) > 50 and "console.log" not in match:  # Skip debug code
                snippets.append({
                    "type": f"{method_name}_method",
                    "code": match[:1500],
                    "file": os.path.basename(filepath)
                })
    
    # Extract game configuration
    config_pattern = r'(?:const|var|let)\s+config\s*=\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    config_matches = re.findall(config_pattern, code, re.DOTALL)
    for match in config_matches:
        snippets.append({
            "type": "game_config",
            "code": match[:1000],
            "file": os.path.basename(filepath)
        })
    
    return snippets

def scan_dir_for_phaser(path):
    """Scan directory for Phaser game files"""
    snippets = []
    js_files = list(Path(path).rglob("*.js"))
    
    print(f"    🔍 Scanning {len(js_files)} JavaScript files...")
    
    for js_file in js_files:
        try:
            file_snippets = extract_phaser_code_blocks(str(js_file))
            snippets.extend(file_snippets)
            if file_snippets:
                print(f"      ✅ Found {len(file_snippets)} code blocks in {js_file.name}")
        except Exception as e:
            continue
    
    return snippets

# === MAIN ===
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
all_snippets = []

print(f"🔍 Searching for Phaser game repositories...")

for topic in TOPICS:
    print(f"\n📂 Searching topic: {topic}")
    repos = search_game_repos(topic, MAX_REPOS_PER_TOPIC)
    print(f"  Found {len(repos)} game repositories")
    
    for url in repos:
        try:
            extracted_path = download_and_extract_repo(url, OUTPUT_DIR)
            if extracted_path:
                snippets = scan_dir_for_phaser(extracted_path)
                all_snippets.extend(snippets)
                print(f"    📊 Total snippets from this repo: {len(snippets)}")
        except Exception as e:
            print(f"    ❌ Error processing {url}: {e}")

print(f"\n📊 Final Results:")
print(f"  Total snippets collected: {len(all_snippets)}")

# Group by type for better overview
by_type = {}
for snippet in all_snippets:
    snippet_type = snippet.get("type", "unknown")
    by_type[snippet_type] = by_type.get(snippet_type, 0) + 1

for snippet_type, count in by_type.items():
    print(f"  {snippet_type}: {count}")

print(f"\n💾 Saving to {SNIPPET_JSON}...")
with open(SNIPPET_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_snippets, f, ensure_ascii=False, indent=2)

print("✅ Done! Much better quality game code collected.")
