#!/usr/bin/env python3
# push-via-api.py — github.com:443 不可达时，通过 GitHub REST API (api.github.com) 推送提交
import base64, json, os, subprocess, sys, urllib.request, urllib.error

REPO = "shiyuanxu666-svg/msdribbon.com"
BRANCH = "main"
ROOT = "/workspace/new-site"
API = f"https://api.github.com/repos/{REPO}"

TOKEN = subprocess.run(
    ["grep", "-oP", r"ghp_[A-Za-z0-9]+", "/workspace/.github-config"],
    capture_output=True, text=True).stdout.strip().split("\n")[0]
if not TOKEN:
    sys.exit("no token found")

HDR = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "openclaw-push",
}

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:600]}", file=sys.stderr)
        raise

def git(*args):
    return subprocess.run(["git", "-C", ROOT] + list(args),
                          capture_output=True, text=True).stdout.strip()

# 1) 本地待推送的文件（相对仓库根）
files = git("diff", "--name-only", "origin/main", "HEAD").split("\n")
files = [f for f in files if f.strip()]
untracked = git("ls-files", "--others", "--exclude-standard").split("\n")
files = sorted(set(files + [f for f in untracked if f.strip()]))
print(f"待推送文件 {len(files)} 个")
for f in files:
    print("  -", f)

# 2) 基线 commit
base = git("rev-parse", "origin/main")
print("base commit:", base)

# 3) 构建 tree（blob 逐个上传）
base_sha = api("GET", f"/git/commits/{base}")[1]["sha"]
base_tree = api("GET", f"/git/commits/{base}")[1]["tree"]["sha"]
tree_entries = []

for rel in files:
    full = os.path.join(ROOT, rel)
    with open(full, "rb") as f:
        content = f.read()
    sha = api("POST", "/git/blobs", {
        "content": base64.b64encode(content).decode(),
        "encoding": "base64",
    })[1]["sha"]
    tree_entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": sha})
    print(f"  blob {rel} -> {sha[:8]}")

# 4) 创建新 tree（基于 base tree）
new_tree_sha = api("POST", "/git/trees", {
    "base_tree": base_tree,
    "tree": tree_entries,
})[1]["sha"]
print("new tree:", new_tree_sha)

# 5) 创建 commit
msg = git("log", "-1", "--pretty=%B", "HEAD").strip()
commit_sha = api("POST", "/git/commits", {
    "message": msg,
    "tree": new_tree_sha,
    "parents": [base_sha],
})[1]["sha"]
print("new commit:", commit_sha)

# 6) 更新分支 ref
api("PATCH", f"/git/refs/heads/{BRANCH}", {"sha": commit_sha, "force": False})
print(f"branch {BRANCH} -> {commit_sha}")

# 7) 校验
cur = api("GET", f"/git/ref/heads/{BRANCH}")[1]["object"]["sha"]
print("remote head now:", cur)
print("MATCH" if cur == commit_sha else "MISMATCH")
