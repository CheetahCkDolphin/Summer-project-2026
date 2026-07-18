import unittest
from unittest.mock import patch, MagicMock, mock_open
import json
import io
import os

# Import the code to test
import mcp_server
import agentic_ai
import server

class TestMCPServer(unittest.TestCase):
    def test_get_nsda_guidelines_valid(self):
        rules = mcp_server.get_nsda_guidelines("oratory")
        self.assertIn("Original Oratory", rules)
        self.assertIn("Time Limit", rules)

    def test_get_nsda_guidelines_invalid(self):
        rules = mcp_server.get_nsda_guidelines("nonexistent_event")
        self.assertIn("Unknown event", rules)

    def test_get_judges_expectations_valid(self):
        exp = mcp_server.get_judges_expectations("informative")
        self.assertIn("Informative Speaking", exp)
        self.assertIn("Topic & Value", exp)

    def test_get_vocal_coaching_tips_valid(self):
        tips = mcp_server.get_vocal_coaching_tips("sorrow")
        self.assertEqual(tips["emotion"], "Sorrow & Grief")
        self.assertTrue(len(tips["suggestions"]) > 0)

    def test_get_vocal_coaching_tips_synonym(self):
        tips = mcp_server.get_vocal_coaching_tips("grief")
        self.assertEqual(tips["emotion"], "Sorrow & Grief")


class TestAgenticAI(unittest.TestCase):
    @patch('agentic_ai.genai.Client')
    def test_analyze_speech_emotions(self, mock_genai_client_class):
        mock_client = MagicMock()
        mock_genai_client_class.return_value = mock_client
        
        # Mock response from Gemini
        mock_response = MagicMock()
        # Mock structured response text
        mock_response.text = json.dumps({
            "vocal_modulation_cues": [
                {
                    "segment": "Hello world",
                    "primary_emotion": "joy",
                    "coaching_tip": "Speak with a smile"
                }
            ],
            "overall_feedback": "Great delivery!"
        })
        mock_client.models.generate_content.return_value = mock_response

        # Mock MCP queries and environment to avoid active stdio subprocess connection during unit tests
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
            with patch('agentic_ai.get_nsda_info_from_mcp', return_value=("Rules content", "Expectations content")):
                with patch('agentic_ai.get_coaching_tips_from_mcp', return_value={"emotion": "Joy", "suggestions": []}):
                    # Run function
                    result = agentic_ai.analyze_speech_emotions("Hello world", "oratory")
                    self.assertIn("vocal_modulation_cues", result)
                    self.assertEqual(result["overall_feedback"], "Great delivery!")

    @patch('agentic_ai.genai.Client')
    def test_synthesize_speech_audio(self, mock_genai_client_class):
        mock_client = MagicMock()
        mock_genai_client_class.return_value = mock_client
        
        # Mock response audio
        mock_response = MagicMock()
        mock_part = MagicMock()
        mock_part.inline_data.data = b"fake_wav_bytes"
        mock_response.candidates = [MagicMock(content=MagicMock(parts=[mock_part]))]
        mock_client.models.generate_content.return_value = mock_response

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
            audio = agentic_ai.synthesize_speech_audio("<speak>Test</speak>", "Aoede")
            self.assertEqual(audio, b"fake_wav_bytes")

    @patch('agentic_ai.genai.Client')
    def test_synthesize_speech_audio_with_clone(self, mock_genai_client_class):
        mock_client = MagicMock()
        mock_genai_client_class.return_value = mock_client
        
        # Mock File upload and Content generation
        mock_file = MagicMock()
        mock_file.name = "files/testfile"
        mock_client.files.upload.return_value = mock_file
        
        mock_response = MagicMock()
        mock_part = MagicMock()
        mock_part.inline_data.data = b"fake_cloned_wav_bytes"
        mock_response.candidates = [MagicMock(content=MagicMock(parts=[mock_part]))]
        mock_client.models.generate_content.return_value = mock_response

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
            # Mock file operations
            with patch('builtins.open', mock_open()):
                with patch('os.path.exists', return_value=True):
                    with patch('os.remove') as mock_remove:
                        audio = agentic_ai.synthesize_speech_audio(
                            "<speak>Test</speak>", 
                            "Aoede", 
                            reference_audio_bytes=b"fake_ref_bytes"
                        )
                        self.assertEqual(audio, b"fake_cloned_wav_bytes")
                        mock_client.files.upload.assert_called_once()
                        mock_client.files.delete.assert_called_once_with(name="files/testfile")


class TestWebServer(unittest.TestCase):
    def test_server_routes(self):
        # We can construct a mock HTTP request and response flow to verify routing
        # Setup mocks for Agentic AI
        mock_agentic_ai = MagicMock()
        mock_agentic_ai.analyze_speech_emotions.return_value = {"status": "ok"}
        mock_agentic_ai.synthesize_speech_audio.return_value = b"wav_response"

        # Mock Request Handler
        class MockSocket:
            def getsockname(self):
                return ('127.0.0.1', 8080)
            def setsockopt(self, *args, **kwargs):
                pass
            def close(self):
                pass

        # We can test the handler directly by instantiating it with StringIO/BytesIO
        # Mock request path and headers
        handler_class = server.NoCacheHTTPRequestHandler
        
        # Helper to run handler on custom path
        def run_handler(method, path, body=b"", headers=None):
            req_stream = io.BytesIO(body)
            res_stream = io.BytesIO()
            
            # Setup mock socket and server
            mock_request = MockSocket()
            mock_server = MagicMock()
            
            # Subclass standard request handler to capture response without printing/writing to stdout
            class TestHandler(handler_class):
                def __init__(self):
                    self.rfile = req_stream
                    self.wfile = res_stream
                    self.request = mock_request
                    self.server = mock_server
                    self.client_address = ('127.0.0.1', 49000)
                    self.headers = headers or {}
                    self.path = path
                    self.command = method
                    self.requestline = f"{method} {path} HTTP/1.1"
                    
                    # Prevent sending header prints
                    self.send_response = MagicMock(side_effect=lambda code, message=None: None)
                    self.send_header = MagicMock(side_effect=lambda keyword, value: None)
                    self.end_headers = MagicMock()
                    
                def setup(self):
                    pass
                def handle(self):
                    pass
                def finish(self):
                    pass
            
            h = TestHandler()
            if method == 'GET':
                h.do_GET()
            elif method == 'POST':
                h.do_POST()
            return h, res_stream.getvalue()

        # Mock sys.modules['agentic_ai'] during the request handler lifecycle
        with patch.dict('sys.modules', {'agentic_ai': mock_agentic_ai}):
            # Test GET / returning 200 or 404 (depending on file exists)
            with patch('http.server.SimpleHTTPRequestHandler.do_GET') as mock_do_get:
                h, res = run_handler('GET', '/')
                mock_do_get.assert_called_once()

            # Test POST /analyze-emotions
            body = json.dumps({"transcript": "Hello", "event": "oratory"}).encode('utf-8')
            headers = {'Content-Length': str(len(body)), 'Content-Type': 'application/json'}
            h, res = run_handler('POST', '/analyze-emotions', body, headers)
            
            h.send_response.assert_called_once_with(200)
            self.assertIn(b"status", res)

            # Test POST /synthesize
            body = json.dumps({"ssml": "Hello", "voice": "Aoede"}).encode('utf-8')
            headers = {'Content-Length': str(len(body)), 'Content-Type': 'application/json'}
            h, res = run_handler('POST', '/synthesize', body, headers)
            
            h.send_response.assert_called_once_with(200)
            self.assertEqual(res, b"wav_response")

            # Test POST /analyze-emotions with invalid JSON
            body = b"{invalid_json"
            headers = {'Content-Length': str(len(body)), 'Content-Type': 'application/json'}
            h, res = run_handler('POST', '/analyze-emotions', body, headers)
            h.send_response.assert_called_once_with(500)
            self.assertIn(b"error", res)

            # Test POST /transcribe with empty body (which fails wave validation)
            body = b""
            headers = {'Content-Length': "0", 'Content-Type': 'audio/wav'}
            h, res = run_handler('POST', '/transcribe', body, headers)
            h.send_response.assert_called_once_with(500)
            self.assertIn(b"error", res)

    def test_agentic_ai_api_key_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                agentic_ai.analyze_speech_emotions("Hello", "oratory")

    def test_agentic_ai_empty_transcript(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
            with self.assertRaises(ValueError):
                agentic_ai.analyze_speech_emotions("", "oratory")

if __name__ == '__main__':
    unittest.main()
