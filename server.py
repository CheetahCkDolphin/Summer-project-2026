import http.server
import socketserver
import json
import speech_recognition as sr
import os
import dotenv

# Load .env environment variables (such as GEMINI_API_KEY)
dotenv.load_dotenv()

PORT = 8080

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

    def do_POST(self):
        if self.path == '/transcribe':
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
                
                # Transcribe using Google's free API with graceful error handling
                try:
                    text = r.recognize_google(audio)
                except sr.UnknownValueError:
                    text = ""
                except sr.RequestError as e:
                    print(f"Speech recognition network notice: {e}")
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

