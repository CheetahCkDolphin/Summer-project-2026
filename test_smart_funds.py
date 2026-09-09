import unittest
import json
import io
import os
from unittest.mock import MagicMock

import server

class TestSmartFundsManager(unittest.TestCase):
    def setUp(self):
        # Reset funds store to clean spreadsheet baseline before each test
        server.FUNDS_STORE = server.get_initial_funds_dataset()

    def test_initial_dataset_integrity(self):
        """Validates that all 12 chapters and spreadsheet values match Sheet 1 and Sheet 2."""
        data = server.FUNDS_STORE
        self.assertEqual(data["organization"], "Chirag Hope")
        self.assertEqual(len(data["chapters"]), 12)

        # Check Evergreen Bay Area Chapter numbers from Sheet 1 & Sheet 2
        evergreen = next(c for c in data["chapters"] if c["name"] == "Evergreen Bay Area Chapter")
        self.assertEqual(evergreen["raised"], 20070.0)
        self.assertEqual(evergreen["withdrawals"], 13186.0)
        self.assertEqual(evergreen["balance"], 6884.0)

        # Check Washington D.C Chapter numbers from Sheet 2
        dc = next(c for c in data["chapters"] if c["name"] == "Washington D.C Chapter")
        self.assertEqual(dc["raised"], 22000.0)
        self.assertEqual(dc["withdrawals"], 10000.0)
        self.assertEqual(dc["balance"], 12000.0)

        # Check Orange County Chapter
        oc = next(c for c in data["chapters"] if c["name"] == "Orange County Chapter")
        self.assertEqual(oc["raised"], 13093.0)
        self.assertEqual(oc["withdrawals"], 12000.0)
        self.assertEqual(oc["balance"], 1093.0)

        # Check Sunnyvale Chapter negative balance (-$472.00)
        sunnyvale = next(c for c in data["chapters"] if c["name"] == "Sunnyvale Chapter")
        self.assertEqual(sunnyvale["raised"], 0.0)
        self.assertEqual(sunnyvale["withdrawals"], 472.0)
        self.assertEqual(sunnyvale["balance"], -472.0)

        # Check project presence from Sheet 1
        projects = {p["name"]: p for p in data["projects"]}
        self.assertIn("Aid4Afghans", projects)
        self.assertIn("Chirag O2 & Food - Support for 2nd Covid Wave", projects)
        self.assertIn("Education support and Seats of Hope for rural India", projects)
        self.assertIn("Education support and Seats of Hope for rural India Phase 2", projects)
        self.assertIn("Mini-Library & Sports Club", projects)

        # Check volunteers from Sheet 1
        volunteers = {v["name"]: v for v in data["volunteers"]}
        self.assertIn("Shasta Mudda", volunteers)
        self.assertIn("Ojasvi Mudda", volunteers)

    def test_server_routes_api_get(self):
        """Tests GET /api/funds/data returns valid JSON."""
        handler_class = server.NoCacheHTTPRequestHandler

        def run_handler(method, path):
            req_stream = io.BytesIO()
            res_stream = io.BytesIO()
            mock_request = MagicMock()
            mock_server = MagicMock()

            class TestHandler(handler_class):
                def __init__(self):
                    self.rfile = req_stream
                    self.wfile = res_stream
                    self.request = mock_request
                    self.server = mock_server
                    self.client_address = ('127.0.0.1', 49000)
                    self.headers = {}
                    self.path = path
                    self.command = method
                    self.requestline = f"{method} {path} HTTP/1.1"
                    self.send_response = MagicMock()
                    self.send_header = MagicMock()
                    self.end_headers = MagicMock()

            h = TestHandler()
            h.do_GET()
            return h, res_stream.getvalue()

        h, res = run_handler('GET', '/api/funds/data')
        h.send_response.assert_called_with(200)
        parsed = json.loads(res.decode('utf-8'))
        self.assertEqual(parsed["organization"], "Chirag Hope")
        self.assertEqual(len(parsed["chapters"]), 12)

    def test_server_routes_redirects(self):
        """Tests that /smart-fund-manager and /smart-fund-managar redirect to trailing slash."""
        handler_class = server.NoCacheHTTPRequestHandler

        for target in ['/smart-fund-manager', '/smart-fund-managar']:
            req_stream = io.BytesIO()
            res_stream = io.BytesIO()
            mock_request = MagicMock()
            mock_server = MagicMock()

            class TestHandler(handler_class):
                def __init__(self):
                    self.rfile = req_stream
                    self.wfile = res_stream
                    self.request = mock_request
                    self.server = mock_server
                    self.client_address = ('127.0.0.1', 49000)
                    self.headers = {}
                    self.path = target
                    self.command = 'GET'
                    self.requestline = f"GET {target} HTTP/1.1"
                    self.send_response = MagicMock()
                    self.send_header = MagicMock()
                    self.end_headers = MagicMock()

            h = TestHandler()
            h.do_GET()
            h.send_response.assert_called_with(302)
            h.send_header.assert_any_call('Location', '/smart-fund-manager/')

    def test_donate_endpoint(self):
        """Tests fundraising donation increments project and chapter funds."""
        handler_class = server.NoCacheHTTPRequestHandler
        payload = json.dumps({
            "volunteer": "Shasta Mudda",
            "project": "Mini-Library & Sports Club",
            "amount": 500.0,
            "donor": "Community Partner",
            "notes": "Book grant"
        }).encode('utf-8')

        req_stream = io.BytesIO(payload)
        res_stream = io.BytesIO()

        class TestHandler(handler_class):
            def __init__(self):
                self.rfile = req_stream
                self.wfile = res_stream
                self.request = MagicMock()
                self.server = MagicMock()
                self.client_address = ('127.0.0.1', 49000)
                self.headers = {'Content-Length': str(len(payload)), 'Content-Type': 'application/json'}
                self.path = '/api/funds/donate'
                self.command = 'POST'
                self.requestline = 'POST /api/funds/donate HTTP/1.1'
                self.send_response = MagicMock()
                self.send_header = MagicMock()
                self.end_headers = MagicMock()

        h = TestHandler()
        h.do_POST()
        h.send_response.assert_called_with(200)

        # Verify project raised amount increased
        proj = next(p for p in server.FUNDS_STORE["projects"] if p["name"] == "Mini-Library & Sports Club")
        self.assertEqual(proj["raised"], 3950.0) # 3450 + 500

    def test_withdraw_endpoint_valid_and_insufficient(self):
        """Tests fund withdrawal succeeds within balance and rejects when exceeding balance."""
        handler_class = server.NoCacheHTTPRequestHandler

        # 1. Valid withdrawal from Education support Phase 2 (Raised 9000, Withdrawn 2116 => Balance 6884)
        payload = json.dumps({
            "volunteer": "Shasta Mudda",
            "project": "Education support and Seats of Hope for rural India Phase 2",
            "amount": 1000.0,
            "purpose": "Purchase 40 school desks"
        }).encode('utf-8')

        req_stream = io.BytesIO(payload)
        res_stream = io.BytesIO()

        class TestHandler(handler_class):
            def __init__(self):
                self.rfile = req_stream
                self.wfile = res_stream
                self.request = MagicMock()
                self.server = MagicMock()
                self.client_address = ('127.0.0.1', 49000)
                self.headers = {'Content-Length': str(len(payload)), 'Content-Type': 'application/json'}
                self.path = '/api/funds/withdraw'
                self.command = 'POST'
                self.requestline = 'POST /api/funds/withdraw HTTP/1.1'
                self.send_response = MagicMock()
                self.send_header = MagicMock()
                self.end_headers = MagicMock()

        h = TestHandler()
        h.do_POST()
        h.send_response.assert_called_with(200)

        proj = next(p for p in server.FUNDS_STORE["projects"] if p["name"] == "Education support and Seats of Hope for rural India Phase 2")
        self.assertEqual(proj["withdrawn"], 3116.0) # 2116 + 1000

        # 2. Attempt excessive withdrawal exceeding remaining balance ($5884)
        excess_payload = json.dumps({
            "volunteer": "Shasta Mudda",
            "project": "Education support and Seats of Hope for rural India Phase 2",
            "amount": 999999.0,
            "purpose": "Invalid oversized withdrawal"
        }).encode('utf-8')

        req_stream2 = io.BytesIO(excess_payload)
        res_stream2 = io.BytesIO()

        class TestHandler2(handler_class):
            def __init__(self):
                self.rfile = req_stream2
                self.wfile = res_stream2
                self.request = MagicMock()
                self.server = MagicMock()
                self.client_address = ('127.0.0.1', 49000)
                self.headers = {'Content-Length': str(len(excess_payload)), 'Content-Type': 'application/json'}
                self.path = '/api/funds/withdraw'
                self.command = 'POST'
                self.requestline = 'POST /api/funds/withdraw HTTP/1.1'
                self.send_response = MagicMock()
                self.send_header = MagicMock()
                self.end_headers = MagicMock()

        h2 = TestHandler2()
        h2.do_POST()
        h2.send_response.assert_called_with(400)

    def test_static_files_exist(self):
        """Verifies all Smart Funds Manager HTML, JS, and CSS files are created and non-empty."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sf_index = os.path.join(base_dir, "smart-fund-manager", "index.html")
        sf_css = os.path.join(base_dir, "smart-fund-manager", "smart_funds.css")
        sf_js = os.path.join(base_dir, "smart-fund-manager", "smart_funds.js")
        sf_alias = os.path.join(base_dir, "smart-fund-managar", "index.html")

        self.assertTrue(os.path.isfile(sf_index), f"Missing {sf_index}")
        self.assertTrue(os.path.isfile(sf_css), f"Missing {sf_css}")
        self.assertTrue(os.path.isfile(sf_js), f"Missing {sf_js}")
        self.assertTrue(os.path.isfile(sf_alias), f"Missing {sf_alias}")

        self.assertGreater(os.path.getsize(sf_index), 500)
        self.assertGreater(os.path.getsize(sf_js), 500)

    def test_chapter_admin_volunteers_roster_integrity(self):
        """Verifies that each volunteer in Evergreen chapter matches the 12 tabs of Google Doc Sheet 1."""
        data = server.FUNDS_STORE
        evergreen_vols = [v for v in data["volunteers"] if v.get("chapter") == "Evergreen Bay Area Chapter"]
        self.assertEqual(len(evergreen_vols), 12)

        # Verify all 12 Sheet 1 tab names are present
        expected_tabs = {
            "Ojasvi Mudda", "Shasta Mudda", "Suravi", "Hasini",
            "Shreshtha Mudda", "Esha Shivakumar", "Pranati Prashanth",
            "Sindu Sirigineni", "Samhita Mahadevan", "Anh Tran",
            "General", "Kaavya Kethini"
        }
        actual_names = {v["name"] for v in evergreen_vols}
        self.assertEqual(expected_tabs, actual_names)

        # Check Suravi and Hasini tabs exist
        suravi = next(v for v in evergreen_vols if v["name"] == "Suravi")
        self.assertEqual(suravi["tabName"], "Suravi")
        hasini = next(v for v in evergreen_vols if v["name"] == "Hasini")
        self.assertEqual(hasini["tabName"], "Hasini")

        # Check Shasta Mudda
        shasta = next(v for v in evergreen_vols if v["name"] == "Shasta Mudda")
        self.assertEqual(len(shasta["assignments"]), 3)
        raised = sum(a["raised"] for a in shasta["assignments"])
        target = sum(a["target"] for a in shasta["assignments"])
        withdrawn = sum(a["withdrawn"] for a in shasta["assignments"])
        self.assertEqual(raised, 8810.0)
        self.assertEqual(target, 8810.0)
        self.assertEqual(withdrawn, 6810.0)
        self.assertEqual(raised - withdrawn, 2000.0)

        # Check Ojasvi Mudda
        ojasvi = next(v for v in evergreen_vols if v["name"] == "Ojasvi Mudda")
        self.assertEqual(len(ojasvi["assignments"]), 4)
        o_raised = sum(a["raised"] for a in ojasvi["assignments"])
        o_target = sum(a["target"] for a in ojasvi["assignments"])
        o_withdrawn = sum(a["withdrawn"] for a in ojasvi["assignments"])
        self.assertEqual(o_raised, 7284.0)
        self.assertEqual(o_target, 7284.0)
        self.assertEqual(o_withdrawn, 5400.0)
        self.assertEqual(o_raised - o_withdrawn, 1884.0)

    def test_chapter_admin_volunteer_selection_filter(self):
        """Verifies filtering by volunteer isolates their specific assignments and withdrawal transactions."""
        data = server.FUNDS_STORE
        target_volunteer = "Shreshtha Mudda"
        matched = [v for v in data["volunteers"] if v["name"] == target_volunteer]
        self.assertEqual(len(matched), 1)
        v = matched[0]
        self.assertEqual(len(v["assignments"]), 2)
        proj_names = [a["project"] for a in v["assignments"]]
        self.assertIn("Education support and Seats of Hope for rural India Phase 2", proj_names)
        self.assertIn("Mini-Library & Sports Club", proj_names)

        # Check volunteer-filtered transactions
        shasta_txs = [t for t in data["transactions"] if t.get("volunteer") == "Shasta Mudda"]
        self.assertGreaterEqual(len(shasta_txs), 1)

    def test_create_project_api(self):
        """Tests POST /api/funds/create_project creates project and links volunteer."""
        handler_class = server.NoCacheHTTPRequestHandler
        mock_req = MagicMock()
        mock_client_addr = ('127.0.0.1', 8888)
        mock_srv = MagicMock()

        payload = json.dumps({
            "name": "Solar Lamps for Rural Classrooms",
            "chapter": "Evergreen Bay Area Chapter",
            "target": 2500.0,
            "assignedVolunteer": "Shasta Mudda",
            "description": "Solar lighting kits for off-grid schools",
            "status": "Planning"
        }).encode('utf-8')

        inst = handler_class.__new__(handler_class)
        inst.command = 'POST'
        inst.path = '/api/funds/create_project'
        inst.headers = {'Content-Length': str(len(payload))}
        inst.rfile = io.BytesIO(payload)
        inst.wfile = io.BytesIO()
        inst.send_response = MagicMock()
        inst.send_header = MagicMock()
        inst.end_headers = MagicMock()

        inst.do_POST()
        inst.send_response.assert_called_with(200)

        data = server.FUNDS_STORE
        p = next((p for p in data["projects"] if p["name"] == "Solar Lamps for Rural Classrooms"), None)
        self.assertIsNotNone(p)
        self.assertEqual(p["target"], 2500.0)
        self.assertEqual(p["chapter"], "Evergreen Bay Area Chapter")

        # Check Shasta Mudda's assignments
        shasta = next(v for v in data["volunteers"] if v["name"] == "Shasta Mudda")
        self.assertTrue(any(a["project"] == "Solar Lamps for Rural Classrooms" for a in shasta["assignments"]))

    def test_add_volunteer_api(self):
        """Tests POST /api/funds/add_volunteer registers a new youth volunteer."""
        handler_class = server.NoCacheHTTPRequestHandler
        payload = json.dumps({
            "name": "Aarav Sharma",
            "chapter": "Evergreen Bay Area Chapter",
            "email": "aarav.sharma@chiraghope.org",
            "tabName": "Aarav Sharma",
            "initialProject": "Mini-Library & Sports Club",
            "initialTarget": 500.0
        }).encode('utf-8')

        inst = handler_class.__new__(handler_class)
        inst.command = 'POST'
        inst.path = '/api/funds/add_volunteer'
        inst.headers = {'Content-Length': str(len(payload))}
        inst.rfile = io.BytesIO(payload)
        inst.wfile = io.BytesIO()
        inst.send_response = MagicMock()
        inst.send_header = MagicMock()
        inst.end_headers = MagicMock()

        inst.do_POST()
        inst.send_response.assert_called_with(200)

        data = server.FUNDS_STORE
        v = next((vol for vol in data["volunteers"] if vol["name"] == "Aarav Sharma"), None)
        self.assertIsNotNone(v)
        self.assertEqual(v["chapter"], "Evergreen Bay Area Chapter")
        self.assertEqual(v["tabName"], "Aarav Sharma")
        self.assertEqual(len(v["assignments"]), 1)
        self.assertEqual(v["assignments"][0]["project"], "Mini-Library & Sports Club")
        self.assertEqual(v["assignments"][0]["target"], 500.0)

    def test_create_chapter_api(self):
        """Tests POST /api/funds/create_chapter creates a new regional chapter."""
        handler_class = server.NoCacheHTTPRequestHandler
        payload = json.dumps({
            "name": "Austin Chapter",
            "location": "Texas, USA",
            "initialTarget": 10000.0
        }).encode('utf-8')

        inst = handler_class.__new__(handler_class)
        inst.command = 'POST'
        inst.path = '/api/funds/create_chapter'
        inst.headers = {'Content-Length': str(len(payload))}
        inst.rfile = io.BytesIO(payload)
        inst.wfile = io.BytesIO()
        inst.send_response = MagicMock()
        inst.send_header = MagicMock()
        inst.end_headers = MagicMock()

        inst.do_POST()
        inst.send_response.assert_called_with(200)

        data = server.FUNDS_STORE
        c = next((chap for chap in data["chapters"] if chap["name"] == "Austin Chapter"), None)
        self.assertIsNotNone(c)
        self.assertEqual(c["location"], "Texas, USA")
        self.assertEqual(c["initialTarget"], 10000.0)
        self.assertEqual(len(data["chapters"]), 13)

    def test_create_organization_api(self):
        """Tests POST /api/funds/create_organization adds a new non-profit organization."""
        handler_class = server.NoCacheHTTPRequestHandler
        data = server.FUNDS_STORE
        self.assertEqual(len(data.get("organizations", [])), 1)
        self.assertEqual(data["organizations"][0]["name"], "Chirag Hope")

        payload = json.dumps({
            "name": "Global Youth Education Foundation",
            "ein": "94-9876543",
            "location": "Seattle, WA",
            "contactEmail": "admin@globalyouth.org",
            "cause": "Global STEM & Digital Literacy",
            "description": "Equipping rural classrooms with modern learning devices."
        }).encode('utf-8')

        inst = handler_class.__new__(handler_class)
        inst.command = 'POST'
        inst.path = '/api/funds/create_organization'
        inst.headers = {'Content-Length': str(len(payload))}
        inst.rfile = io.BytesIO(payload)
        inst.wfile = io.BytesIO()
        inst.send_response = MagicMock()
        inst.send_header = MagicMock()
        inst.end_headers = MagicMock()

        inst.do_POST()
        inst.send_response.assert_called_with(200)

        self.assertEqual(len(data["organizations"]), 2)
        new_org = next(o for o in data["organizations"] if o["name"] == "Global Youth Education Foundation")
        self.assertEqual(new_org["ein"], "94-9876543")
        self.assertEqual(new_org["location"], "Seattle, WA")
        self.assertEqual(new_org["contactEmail"], "admin@globalyouth.org")
        self.assertEqual(new_org["cause"], "Global STEM & Digital Literacy")

if __name__ == '__main__':
    unittest.main()
