import http.server
import socketserver
import json
import speech_recognition as sr
import os

PORT = 8080

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

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
                
                # Transcribe using Google's free API
                try:
                    text = r.recognize_google(audio)
                except sr.UnknownValueError:
                    text = "[Speech was not clear enough to transcribe]"
                except sr.RequestError as e:
                    text = f"[Speech Recognition API error: {e}]"

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
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f"Serving at port {PORT} with caching disabled and /transcribe POST endpoint ready...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
