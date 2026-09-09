#!/usr/bin/env python3
"""
Automated WordPress Publisher for shastamudda.com
Uploads smart_funds_standalone.html to WordPress Media Library
and creates/updates the Smart Funds Manager page.
"""
import os
import sys
import json
import base64
import urllib.request
import urllib.error

WP_BASE = "https://shastamudda.com/wp-json/wp/v2"

def publish(username, app_password):
    auth_header = "Basic " + base64.b64encode(f"{username}:{app_password}".encode()).decode()

    # 1. Upload standalone HTML to Media
    html_path = os.path.join(os.path.dirname(__file__), "smart_funds_standalone.html")
    if not os.path.exists(html_path):
        print(f"Error: {html_path} not found.")
        sys.exit(1)

    print("1. Uploading smart_funds_standalone.html to WordPress Media Library...")
    with open(html_path, "rb") as f:
        file_bytes = f.read()

    media_req = urllib.request.Request(
        f"{WP_BASE}/media",
        data=file_bytes,
        headers={
            "Authorization": auth_header,
            "Content-Disposition": 'attachment; filename="smart_funds_standalone.html"',
            "Content-Type": "text/html"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(media_req) as response:
            media_data = json.loads(response.read().decode())
            media_url = media_data.get("source_url")
            print(f"   ✓ Uploaded successfully: {media_url}")
    except urllib.error.HTTPError as e:
        print(f"   ✗ Media upload failed: HTTP {e.code} - {e.read().decode()}")
        return False

    # 2. Create or Update WordPress Pages
    pages_to_publish = [
        {"slug": "smart-fund-manager", "title": "Smart Funds Manager"},
        {"slug": "smart-fund-managar", "title": "Smart Funds Manager"}
    ]

    iframe_html = f'<p><iframe src="{media_url}" style="width: 100%; height: 980px; border: none; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);" allow="autoplay"></iframe></p>'

    for p in pages_to_publish:
        slug = p["slug"]
        title = p["title"]
        print(f"2. Checking for existing page with slug '{slug}'...")

        # Search existing
        search_req = urllib.request.Request(
            f"{WP_BASE}/pages?slug={slug}",
            headers={"Authorization": auth_header}
        )
        existing_id = None
        try:
            with urllib.request.urlopen(search_req) as response:
                pages = json.loads(response.read().decode())
                if pages:
                    existing_id = pages[0]["id"]
        except Exception as e:
            pass

        page_payload = json.dumps({
            "title": title,
            "slug": slug,
            "status": "publish",
            "content": iframe_html
        }).encode("utf-8")

        if existing_id:
            print(f"   Updating existing page ID {existing_id} ({slug})...")
            url = f"{WP_BASE}/pages/{existing_id}"
        else:
            print(f"   Creating new page ({slug})...")
            url = f"{WP_BASE}/pages"

        page_req = urllib.request.Request(
            url,
            data=page_payload,
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/json"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(page_req) as response:
                result = json.loads(response.read().decode())
                print(f"   ✓ Page live at: {result.get('link')}")
        except urllib.error.HTTPError as e:
            print(f"   ✗ Page creation failed: HTTP {e.code} - {e.read().decode()}")
            return False

    print("
SUCCESS! Smart Funds Manager is published to shastamudda.com via WordPress!")
    return True

if __name__ == "__main__":
    user = os.environ.get("WP_USER")
    pw = os.environ.get("WP_APP_PASSWORD")
    if not user or not pw:
        if len(sys.argv) >= 3:
            user = sys.argv[1]
            pw = sys.argv[2]
        else:
            import getpass
            user = input("WordPress Username: ").strip()
            pw = getpass.getpass("WordPress Application Password: ").strip()

    publish(user, pw)
