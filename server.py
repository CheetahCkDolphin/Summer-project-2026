import http.server
import socketserver
import json
import speech_recognition as sr
import os
import dotenv

# Load .env environment variables (such as GEMINI_API_KEY)
dotenv.load_dotenv()

PORT = 8080

# Baseline Google Sheets dataset for Smart Funds Manager
def get_initial_funds_dataset():
    return {
        "organization": "Chirag Hope",
        "organizations": [
            {
                "id": "org-chirag-hope",
                "name": "Chirag Hope",
                "ein": "77-0489123",
                "headquarters": "San Jose, California, USA",
                "location": "San Jose, California, USA",
                "contactEmail": "admin@chiraghope.org",
                "cause": "Child Education & Rural Relief",
                "status": "Active",
                "foundedYear": 2018,
                "description": "Empowering rural students and underserved communities through education support, seats of hope, sports clubs, and classroom infrastructure."
            }
        ],
        "users": [
            {
                "id": "u-shasta",
                "name": "Shasta Mudda",
                "email": "shasta@chiraghope.org",
                "password": "password123",
                "role": "volunteer",
                "chapter": "Evergreen Bay Area Chapter"
            },
            {
                "id": "u-ojasvi",
                "name": "Ojasvi Mudda",
                "email": "ojasvi@chiraghope.org",
                "password": "password123",
                "role": "volunteer",
                "chapter": "Evergreen Bay Area Chapter"
            },
            {
                "id": "u-chapter-admin",
                "name": "Evergreen Chapter Admin",
                "email": "admin@evergreen.org",
                "password": "password123",
                "role": "chapter_admin",
                "chapter": "Evergreen Bay Area Chapter"
            },
            {
                "id": "u-nonprofit-admin",
                "name": "Chirag Hope Executive Admin",
                "email": "exec@chiraghope.org",
                "password": "password123",
                "role": "nonprofit_admin",
                "chapter": "National Office"
            },
            {
                "id": "u-platform-admin",
                "name": "Smart Funds Platform Super Admin",
                "email": "superadmin@smartfunds.org",
                "password": "password123",
                "role": "platform_admin",
                "chapter": "Platform Headquarters"
            }
        ],
        "chapters": [
            {"name": "Evergreen Bay Area Chapter", "raised": 20070.0, "withdrawals": 13186.0, "balance": 6884.0},
            {"name": "Washington D.C Chapter", "raised": 22000.0, "withdrawals": 10000.0, "balance": 12000.0},
            {"name": "Orange County Chapter", "raised": 13093.0, "withdrawals": 12000.0, "balance": 1093.0},
            {"name": "Fremont Chapter", "raised": 9000.0, "withdrawals": 0.0, "balance": 9000.0},
            {"name": "San Jose Chapter", "raised": 3000.0, "withdrawals": 3000.0, "balance": 0.0},
            {"name": "Sunnyvale Chapter", "raised": 0.0, "withdrawals": 472.0, "balance": -472.0},
            {"name": "Cupertino Chapter", "raised": 0.0, "withdrawals": 0.0, "balance": 0.0},
            {"name": "Frisco Chapter", "raised": 0.0, "withdrawals": 0.0, "balance": 0.0},
            {"name": "Michigan Chapter", "raised": 0.0, "withdrawals": 0.0, "balance": 0.0},
            {"name": "New Jersey Chapter", "raised": 0.0, "withdrawals": 0.0, "balance": 0.0},
            {"name": "Seattle Chapter", "raised": 0.0, "withdrawals": 0.0, "balance": 0.0},
            {"name": "Virginia Chapter", "raised": 0.0, "withdrawals": 0.0, "balance": 0.0}
        ],
        "projects": [
            {"id": "p1", "name": "Aid4Afghans", "chapter": "Evergreen Bay Area Chapter", "target": 120.0, "raised": 120.0, "withdrawn": 120.0, "status": "Complete"},
            {"id": "p2", "name": "Chirag O2 & Food - Support for 2nd Covid Wave", "chapter": "Evergreen Bay Area Chapter", "target": 1500.0, "raised": 1500.0, "withdrawn": 1500.0, "status": "Complete"},
            {"id": "p3", "name": "Education support and Seats of Hope for rural India", "chapter": "Evergreen Bay Area Chapter", "target": 6000.0, "raised": 6000.0, "withdrawn": 6000.0, "status": "Complete"},
            {"id": "p4", "name": "Education support and Seats of Hope for rural India Phase 2", "chapter": "Evergreen Bay Area Chapter", "target": 9000.0, "raised": 9000.0, "withdrawn": 2116.0, "status": "In Progress"},
            {"id": "p5", "name": "Mini-Library & Sports Club", "chapter": "Evergreen Bay Area Chapter", "target": 3450.0, "raised": 3450.0, "withdrawn": 3450.0, "status": "Complete"},
            {"id": "p6", "name": "MIssionKids", "chapter": "Fremont Chapter", "target": 9000.0, "raised": 9000.0, "withdrawn": 0.0, "status": "In Progress"},
            {"id": "p7", "name": "Anganwadi", "chapter": "Orange County Chapter", "target": 12000.0, "raised": 13093.0, "withdrawn": 12000.0, "status": "In Progress"},
            {"id": "p8", "name": "Safe School #1", "chapter": "San Jose Chapter", "target": 3000.0, "raised": 3000.0, "withdrawn": 3000.0, "status": "Complete"},
            {"id": "p9", "name": "Aid4Amputees", "chapter": "Washington D.C Chapter", "target": 35000.0, "raised": 22000.0, "withdrawn": 10000.0, "status": "In Progress"},
            {"id": "p10", "name": "Vision Rehab Treatment", "chapter": "Washington D.C Chapter", "target": 3500.0, "raised": 0.0, "withdrawn": 0.0, "status": "Planning"},
            {"id": "p11", "name": "CHIRAG O2 & FOOD", "chapter": "Michigan Chapter", "target": 700.0, "raised": 0.0, "withdrawn": 0.0, "status": "Planning"},
            {"id": "p12", "name": "DEESHA Project Noteworthy", "chapter": "Sunnyvale Chapter", "target": 472.0, "raised": 0.0, "withdrawn": 472.0, "status": "Execution"},
            {"id": "p13", "name": "General Donation", "chapter": "New Jersey Chapter", "target": 2000.0, "raised": 0.0, "withdrawn": 0.0, "status": "Planning"},
            {"id": "p14", "name": "Project X", "chapter": "Cupertino Chapter", "target": 200.0, "raised": 0.0, "withdrawn": 0.0, "status": "Planning"}
        ],
        "volunteers": [
            {
                "name": "Ojasvi Mudda",
                "tabName": "Ojasvi Mudda",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "ojasvi@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 1784.0, "raised": 1784.0, "withdrawn": 1784.0},
                    {"project": "Chirag O2 & Food - Support for 2nd Covid Wave", "target": 1500.0, "raised": 1500.0, "withdrawn": 1500.0},
                    {"project": "Education support and Seats of Hope for rural India Phase 2", "target": 3000.0, "raised": 3000.0, "withdrawn": 1116.0},
                    {"project": "Education support and Seats of Hope for rural India", "target": 1000.0, "raised": 1000.0, "withdrawn": 1000.0}
                ]
            },
            {
                "name": "Shasta Mudda",
                "tabName": "Shasta Mudda",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "shasta@chiraghope.org",
                "assignments": [
                    {"project": "Education support and Seats of Hope for rural India", "target": 5000.0, "raised": 5000.0, "withdrawn": 5000.0},
                    {"project": "Education support and Seats of Hope for rural India Phase 2", "target": 3000.0, "raised": 3000.0, "withdrawn": 1000.0},
                    {"project": "Mini-Library & Sports Club", "target": 810.0, "raised": 810.0, "withdrawn": 810.0}
                ]
            },
            {
                "name": "Suravi",
                "tabName": "Suravi",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "suravi@chiraghope.org",
                "assignments": []
            },
            {
                "name": "Hasini",
                "tabName": "Hasini",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "hasini@chiraghope.org",
                "assignments": []
            },
            {
                "name": "Shreshtha Mudda",
                "tabName": "Shreshtha Mudda",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "shreshtha@chiraghope.org",
                "assignments": [
                    {"project": "Education support and Seats of Hope for rural India Phase 2", "target": 3000.0, "raised": 3000.0, "withdrawn": 0.0},
                    {"project": "Mini-Library & Sports Club", "target": 0.0, "raised": 0.0, "withdrawn": 0.0}
                ]
            },
            {
                "name": "Esha Shivakumar",
                "tabName": "Esha Shivakumar",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "esha@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 310.0, "raised": 310.0, "withdrawn": 310.0}
                ]
            },
            {
                "name": "Pranati Prashanth",
                "tabName": "Pranati Prashanth",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "pranati@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 200.0, "raised": 200.0, "withdrawn": 200.0}
                ]
            },
            {
                "name": "Sindu Sirigineni",
                "tabName": "Sindu Sirigineni",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "sindu@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 150.0, "raised": 150.0, "withdrawn": 150.0}
                ]
            },
            {
                "name": "Samhita Mahadevan",
                "tabName": "Samhita Mahadevan",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "samhita@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 0.0, "raised": 0.0, "withdrawn": 0.0}
                ]
            },
            {
                "name": "Anh Tran",
                "tabName": "Anh Tran",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "anh@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 0.0, "raised": 0.0, "withdrawn": 0.0}
                ]
            },
            {
                "name": "General",
                "tabName": "General",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "general@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 46.0, "raised": 46.0, "withdrawn": 46.0},
                    {"project": "Aid4Afghans", "target": 120.0, "raised": 120.0, "withdrawn": 120.0}
                ]
            },
            {
                "name": "Kaavya Kethini",
                "tabName": "Kaavya Kethini",
                "chapter": "Evergreen Bay Area Chapter",
                "email": "kaavya@chiraghope.org",
                "assignments": [
                    {"project": "Mini-Library & Sports Club", "target": 150.0, "raised": 150.0, "withdrawn": 150.0}
                ]
            }
        ],
        "transactions": [
            {
                "id": "tx-init-1",
                "date": "2026-06-15",
                "type": "donation",
                "volunteer": "Shasta Mudda",
                "chapter": "Evergreen Bay Area Chapter",
                "project": "Education support and Seats of Hope for rural India Phase 2",
                "amount": 3000.0,
                "donor": "Community Donors & Matching",
                "notes": "Campaign kickoff for school benches"
            },
            {
                "id": "tx-init-2",
                "date": "2026-06-20",
                "type": "withdrawal",
                "volunteer": "Shasta Mudda",
                "chapter": "Evergreen Bay Area Chapter",
                "project": "Education support and Seats of Hope for rural India Phase 2",
                "amount": 1000.0,
                "purpose": "Procure classroom dual-desks",
                "notes": "Wire disbursement to manufacturer"
            }
        ]
    }

FUNDS_STORE = get_initial_funds_dataset()

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Route alias handling for Smart Funds Manager endpoints
        clean_path = self.path.split('?')[0]
        if clean_path in ['/smart-fund-manager', '/smart-fund-managar']:
            self.send_response(302)
            self.send_header('Location', '/smart-fund-manager/')
            self.end_headers()
            return

        if clean_path in ['/smart-fund-managar/', '/smart-fund-managar/index.html']:
            self.path = '/smart-fund-manager/index.html'
            return super().do_GET()

        # REST API endpoint to fetch funds dataset
        if clean_path == '/api/funds/data':
            response_data = json.dumps(FUNDS_STORE).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_data)))
            self.end_headers()
            self.wfile.write(response_data)
            return

        # REST API endpoint to fetch organizations summary
        if clean_path == '/api/funds/organizations':
            orgs = FUNDS_STORE.get('organizations', [])
            response_data = json.dumps({"success": True, "organizations": orgs}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_data)))
            self.end_headers()
            self.wfile.write(response_data)
            return

        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0]

        # 1. API: Record Donation / Raise Funds
        if clean_path == '/api/funds/donate':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                project_name = body.get('project')
                amount = float(body.get('amount', 0))
                donor = body.get('donor', 'Supporter')
                volunteer = body.get('volunteer', 'Volunteer')

                if amount <= 0:
                    raise ValueError("Amount must be greater than 0")

                # Update project
                proj = next((p for p in FUNDS_STORE['projects'] if p['name'].lower() == project_name.lower()), None)
                if not proj:
                    raise ValueError(f"Project '{project_name}' not found")
                proj['raised'] += amount

                # Update chapter
                chap = next((c for c in FUNDS_STORE['chapters'] if c['name'].lower() == proj['chapter'].lower()), None)
                if chap:
                    chap['raised'] += amount
                    chap['balance'] = chap['raised'] - chap['withdrawals']

                # Record transaction
                tx = {
                    "id": f"tx-{len(FUNDS_STORE['transactions']) + 1}",
                    "type": "donation",
                    "project": proj['name'],
                    "amount": amount,
                    "donor": donor,
                    "volunteer": volunteer
                }
                FUNDS_STORE['transactions'].append(tx)

                res = json.dumps({"success": True, "transaction": tx, "project": proj}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 2. API: Withdraw Funds
        elif clean_path == '/api/funds/withdraw':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                project_name = body.get('project')
                amount = float(body.get('amount', 0))
                purpose = body.get('purpose', 'Disbursement')
                volunteer = body.get('volunteer', 'Volunteer')

                if amount <= 0:
                    raise ValueError("Amount must be greater than 0")

                proj = next((p for p in FUNDS_STORE['projects'] if p['name'].lower() == project_name.lower()), None)
                if not proj:
                    raise ValueError(f"Project '{project_name}' not found")

                avail_balance = proj['raised'] - proj['withdrawn']
                if amount > avail_balance:
                    raise ValueError(f"Withdrawal of ${amount:.2f} exceeds available balance of ${avail_balance:.2f}")

                proj['withdrawn'] += amount
                chap = next((c for c in FUNDS_STORE['chapters'] if c['name'].lower() == proj['chapter'].lower()), None)
                if chap:
                    chap['withdrawals'] += amount
                    chap['balance'] = chap['raised'] - chap['withdrawals']

                tx = {
                    "id": f"tx-{len(FUNDS_STORE['transactions']) + 1}",
                    "type": "withdrawal",
                    "project": proj['name'],
                    "amount": amount,
                    "purpose": purpose,
                    "volunteer": volunteer
                }
                FUNDS_STORE['transactions'].append(tx)

                res = json.dumps({"success": True, "transaction": tx, "project": proj}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 3. API: Reset State
        elif clean_path == '/api/funds/reset':
            FUNDS_STORE.clear()
            FUNDS_STORE.update(get_initial_funds_dataset())
            res = json.dumps({"success": True, "message": "Funds dataset reset to spreadsheet baseline"}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(res)))
            self.end_headers()
            self.wfile.write(res)
            return

        # 4. API: Create Project
        elif clean_path == '/api/funds/create_project':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                project_name = body.get('name', '').strip()
                chapter_name = body.get('chapter', 'Evergreen Bay Area Chapter').strip()
                target_amount = float(body.get('target', 0))
                description = body.get('description', '')
                assigned_volunteer = body.get('assignedVolunteer', '').strip()
                status = body.get('status', 'Planning')

                if not project_name:
                    raise ValueError("Project name is required")
                if target_amount < 0:
                    raise ValueError("Target amount must be non-negative")

                if any(p['name'].lower() == project_name.lower() for p in FUNDS_STORE['projects']):
                    raise ValueError(f"Project '{project_name}' already exists")

                # Ensure chapter exists
                chap = next((c for c in FUNDS_STORE['chapters'] if c['name'].lower() == chapter_name.lower()), None)
                if not chap:
                    chap = {"name": chapter_name, "raised": 0.0, "withdrawals": 0.0, "balance": 0.0}
                    FUNDS_STORE['chapters'].append(chap)

                new_proj = {
                    "name": project_name,
                    "chapter": chap['name'],
                    "target": target_amount,
                    "raised": 0.0,
                    "withdrawn": 0.0,
                    "status": status,
                    "progress": 0,
                    "description": description or f"Community initiative under {chap['name']}"
                }
                FUNDS_STORE['projects'].append(new_proj)

                # Link volunteer assignment if specified
                if assigned_volunteer and assigned_volunteer != 'none':
                    v = next((vol for vol in FUNDS_STORE['volunteers'] if vol['name'].lower() == assigned_volunteer.lower()), None)
                    if not v:
                        v = {
                            "name": assigned_volunteer,
                            "chapter": chap['name'],
                            "email": f"{assigned_volunteer.lower().replace(' ', '.')}@chiraghope.org",
                            "assignments": []
                        }
                        FUNDS_STORE['volunteers'].append(v)
                    v.setdefault('assignments', []).append({
                        "project": project_name,
                        "target": target_amount,
                        "raised": 0.0,
                        "withdrawn": 0.0
                    })

                res = json.dumps({"success": True, "project": new_proj}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 5. API: Add Volunteer
        elif clean_path == '/api/funds/add_volunteer':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                vol_name = body.get('name', '').strip()
                chapter_name = body.get('chapter', 'Evergreen Bay Area Chapter').strip()
                email = body.get('email', '').strip()
                tab_name = body.get('tabName', '').strip() or vol_name
                init_proj = body.get('initialProject', '').strip()
                init_target = float(body.get('initialTarget', 0))

                if not vol_name:
                    raise ValueError("Volunteer name is required")

                if any(v['name'].lower() == vol_name.lower() for v in FUNDS_STORE['volunteers']):
                    raise ValueError(f"Volunteer '{vol_name}' already exists")

                v_email = email or f"{vol_name.lower().replace(' ', '.')}@chiraghope.org"
                new_vol = {
                    "name": vol_name,
                    "tabName": tab_name,
                    "chapter": chapter_name,
                    "email": v_email,
                    "assignments": []
                }
                if init_proj and init_proj != 'none':
                    new_vol['assignments'].append({
                        "project": init_proj,
                        "target": init_target,
                        "raised": 0.0,
                        "withdrawn": 0.0
                    })

                FUNDS_STORE['volunteers'].append(new_vol)
                res = json.dumps({"success": True, "volunteer": new_vol}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 6. API: Create Chapter
        elif clean_path == '/api/funds/create_chapter':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                chap_name = body.get('name', '').strip()
                location = body.get('location', '').strip() or "United States"
                init_target = float(body.get('initialTarget', 0))

                if not chap_name:
                    raise ValueError("Chapter name is required")

                if any(c['name'].lower() == chap_name.lower() for c in FUNDS_STORE['chapters']):
                    raise ValueError(f"Chapter '{chap_name}' already exists")

                new_chap = {
                    "name": chap_name,
                    "location": location,
                    "raised": 0.0,
                    "withdrawals": 0.0,
                    "balance": 0.0,
                    "initialTarget": init_target
                }
                FUNDS_STORE['chapters'].append(new_chap)
                res = json.dumps({"success": True, "chapter": new_chap}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 7. API: Create Non-Profit Organization
        elif clean_path == '/api/funds/create_organization':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                org_name = body.get('name', '').strip()
                ein = body.get('ein', '').strip() or "Pending"
                location = (body.get('location') or body.get('headquarters') or '').strip() or "United States"
                contact_email = body.get('contactEmail', '').strip() or f"admin@{org_name.lower().replace(' ', '')}.org"
                cause = body.get('cause', '').strip() or "Community Development & Education"
                description = body.get('description', '').strip() or f"Dedicated non-profit organization focused on {cause}."

                if not org_name:
                    raise ValueError("Organization name is required")

                FUNDS_STORE.setdefault('organizations', [])
                if any(o['name'].lower() == org_name.lower() for o in FUNDS_STORE['organizations']):
                    raise ValueError(f"Organization '{org_name}' already exists")

                org_id = f"org-{len(FUNDS_STORE['organizations']) + 1}"
                new_org = {
                    "id": org_id,
                    "name": org_name,
                    "ein": ein,
                    "headquarters": location,
                    "location": location,
                    "contactEmail": contact_email,
                    "cause": cause,
                    "status": "Active",
                    "foundedYear": 2026,
                    "description": description
                }
                FUNDS_STORE['organizations'].append(new_org)
                res = json.dumps({"success": True, "organization": new_org}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 8. API: Authenticate User (Login)
        elif clean_path == '/api/funds/login':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                identifier = str(body.get('identifier') or body.get('email') or body.get('username') or '').strip().lower()
                password = str(body.get('password') or '').strip()

                if not identifier or not password:
                    raise ValueError("Email/username and password are required")

                users = FUNDS_STORE.setdefault('users', [])
                matched = next((u for u in users if (u.get('email', '').lower() == identifier or u.get('name', '').lower() == identifier) and u.get('password') == password), None)

                if not matched:
                    res = json.dumps({"error": "Invalid email/username or password"}).encode('utf-8')
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(res)))
                    self.end_headers()
                    self.wfile.write(res)
                    return

                safe_user = {
                    "id": matched.get("id"),
                    "name": matched.get("name"),
                    "email": matched.get("email"),
                    "role": matched.get("role"),
                    "chapter": matched.get("chapter")
                }
                res = json.dumps({"success": True, "user": safe_user}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 9. API: Register New User Account (Sign Up)
        elif clean_path == '/api/funds/register':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                name = str(body.get('name') or '').strip()
                email = str(body.get('email') or '').strip().lower()
                password = str(body.get('password') or '')
                role = str(body.get('role') or 'volunteer').strip()
                chapter = str(body.get('chapter') or 'Evergreen Bay Area Chapter').strip()

                if not name:
                    raise ValueError("Full name is required")
                if not email:
                    raise ValueError("Email address is required")
                if len(password) < 6:
                    raise ValueError("Password must be at least 6 characters long")

                users = FUNDS_STORE.setdefault('users', [])
                if any(u.get('email', '').lower() == email for u in users):
                    raise ValueError("An account with this email address already exists")

                new_user = {
                    "id": f"u-{len(users) + 1}",
                    "name": name,
                    "email": email,
                    "password": password,
                    "role": role,
                    "chapter": chapter
                }
                users.append(new_user)

                # If registered as volunteer, ensure record in volunteers
                if role == 'volunteer':
                    volunteers = FUNDS_STORE.setdefault('volunteers', [])
                    if not any(v.get('name', '').lower() == name.lower() for v in volunteers):
                        volunteers.append({
                            "name": name,
                            "chapter": chapter,
                            "tabName": name,
                            "assignments": [
                                {
                                    "project": "Mini-Library & Sports Club",
                                    "target": 1000.0,
                                    "raised": 0.0,
                                    "withdrawn": 0.0,
                                    "status": "Assigned"
                                }
                            ]
                        })

                safe_user = {
                    "id": new_user["id"],
                    "name": new_user["name"],
                    "email": new_user["email"],
                    "role": new_user["role"],
                    "chapter": new_user["chapter"]
                }
                res = json.dumps({"success": True, "user": safe_user}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res)))
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                err = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # 4. Transcribe Endpoint
        elif self.path == '/transcribe':
            try:
                # Read content length
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)

                # Write to temp file in current directory
                temp_filename = "temp_transcribe.wav"
                with open(temp_filename, "wb") as f:
                    f.write(post_data)

                # Initialize SpeechRecognition
                r = sr.Recognizer()
                with sr.AudioFile(temp_filename) as source:
                    audio = r.record(source)
                
                # Transcribe using Google's free API, falling back to PocketSphinx offline STT engine
                text = ""
                try:
                    text = r.recognize_google(audio)
                except Exception as e1:
                    try:
                        text = r.recognize_sphinx(audio)
                    except Exception as e2:
                        print(f"STT recognition note: {e1} | {e2}")
                        text = ""

                # Delete temp file
                if os.path.exists(temp_filename):
                    os.remove(temp_filename)

                # Send response
                response_data = json.dumps({"transcript": text}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_data)))
                self.end_headers()
                self.wfile.write(response_data)
            except Exception as e:
                # Handle general error
                response_data = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_data)))
                self.end_headers()
                self.wfile.write(response_data)
        elif self.path == '/analyze-emotions':
            try:
                # Read content length
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)

                # Decode request payload
                request_data = json.loads(post_data.decode('utf-8'))
                transcript = request_data.get('transcript', '')
                event_type = request_data.get('event', 'oratory')

                # Import and call Agentic AI
                import agentic_ai
                result = agentic_ai.analyze_speech_emotions(transcript, event_type)

                # Send response
                response_data = json.dumps(result).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_data)))
                self.end_headers()
                self.wfile.write(response_data)
            except Exception as e:
                # Handle general error
                response_data = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_data)))
                self.end_headers()
                self.wfile.write(response_data)
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    ports_to_try = [int(os.environ.get("PORT", 8080)), 8080, 8000, 8085, 9000]
    httpd = None
    for port in ports_to_try:
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", port), NoCacheHTTPRequestHandler)
            PORT = port
            break
        except OSError:
            continue
    if httpd:
        print(f"Serving at port {PORT} with caching disabled, /transcribe, and /analyze-emotions POST endpoints ready...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
    else:
        print("Error: Could not bind to any port.")

