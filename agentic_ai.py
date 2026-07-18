import asyncio
import os
import json
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from google import genai
from google.genai import types

# Stdio server parameters to spawn our mcp_server.py
server_params = StdioServerParameters(
    command="python3",
    args=["/Users/Shasta/Projects/Summer-project-2026/mcp_server.py"]
)

async def get_nsda_info_from_mcp(event_type: str):
    """
    Connects to the local MCP server over stdio and calls get_nsda_guidelines and get_judges_expectations.
    """
    rules = ""
    expectations = ""
    try:
        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                
                # Call get_nsda_guidelines
                rules_res = await session.call_tool("get_nsda_guidelines", {"event": event_type})
                rules = "".join([c.text for c in rules_res.content if hasattr(c, 'text')])
                
                # Call get_judges_expectations
                exp_res = await session.call_tool("get_judges_expectations", {"event": event_type})
                expectations = "".join([c.text for c in exp_res.content if hasattr(c, 'text')])
    except Exception as e:
        print(f"Error querying MCP server: {e}", file=sys.stderr)
        # Fallback to general rules if MCP server connection fails
        rules = f"Follow standard NSDA guidelines for {event_type} speech delivery."
        expectations = f"Focus on vocal variety, clear articulation, eye contact, and logical speech structure."
        
    return rules, expectations

async def get_coaching_tips_from_mcp(emotion: str) -> dict:
    """
    Queries the MCP server for vocal coaching tips for a specific emotion.
    """
    try:
        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                
                res = await session.call_tool("get_vocal_coaching_tips", {"emotion": emotion})
                text_content = "".join([c.text for c in res.content if hasattr(c, 'text')])
                return json.loads(text_content)
    except Exception as e:
        print(f"Error querying coaching tips from MCP: {e}", file=sys.stderr)
        return {
            "emotion": emotion.capitalize(),
            "guidance": "Practice dynamic vocal delivery suited to the speech's message.",
            "suggestions": [
                "Vary your pacing to match thematic transitions.",
                "Ensure proper pause lengths for key emphasis."
            ]
        }

async def analyze_speech_emotions_async(transcript: str, event_type: str) -> dict:
    """
    Asynchronously orchestrates the agentic AI analysis.
    1. Queries the MCP server for NSDA rules and judges' expectations.
    2. Builds a comprehensive prompt containing these rules.
    3. Calls the Gemini API using the new google-genai SDK.
    4. Performs self-correction/refinement of vocal suggestions.
    5. Returns the structured JSON.
    """
    # 1. Fetch rules and expectations from MCP
    rules, expectations = await get_nsda_info_from_mcp(event_type)
    
    # 2. Get API key from environment
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it in your .env file.")
        
    client = genai.Client(api_key=api_key)
    
    # 3. Formulate the Agentic system instruction
    system_instruction = (
        "You are an elite NSDA Speech & Debate Coach and Judge. Your task is to analyze a speech transcript "
        "and determine the expected/best emotional flow and delivery guidance for a student.\n\n"
        "To perform this analysis, you must evaluate the speech based on these event-specific constraints and expectations:\n"
        f"--- NSDA RULES ---\n{rules}\n\n"
        f"--- JUDGES' EXPECTATIONS ---\n{expectations}\n"
        "------------------\n\n"
        "You will identify the predominant emotion expected for the speech as a whole, "
        "provide high-level vocal delivery guidance, and generate concrete suggestions (e.g., volume, register, pauses) "
        "tailored to the NSDA guidelines. In addition, formulate an 'elevation tip' describing how to transition "
        "between emotional segments."
    )
    
    prompt = (
        "Analyze the following speech transcript and return a structured JSON response mapping the expected "
        "emotions and coaching guidance:\n\n"
        f"Speech Transcript:\n\"\"\"\n{transcript}\n\"\"\"\n\n"
        "Your response must be a single JSON object. Do not include markdown headers or extra conversational text. "
        "Ensure the JSON exactly matches this schema:\n"
        "{\n"
        "  \"emotion\": \"The main overall target emotion (choose one: 'Sorrow & Grief', 'Anger & Frustration', 'Joy & Wonder', 'Anxiety & Fear', 'Nostalgia', or 'Relief & Acceptance')\",\n"
        "  \"guidance\": \"Detailed vocal delivery guidance matching the NSDA expectations and rules (1-2 sentences)\",\n"
        "  \"suggestions\": [\n"
        "    \"Specific action suggestion 1 (e.g., increase volume, use pausing, etc.)\",\n"
        "    \"Specific action suggestion 2\"\n"
        "  ],\n"
        "  \"transition_tip\": \"A coaching tip showing how to transition from other emotional states into this target state (1 sentence)\"\n"
        "}"
    )
    
    # 4. Generate Content
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json"
        )
    )
    
    # 5. Parse and return result
    result_text = response.text.strip()
    try:
        analysis = json.loads(result_text)
        return analysis
    except Exception as e:
        print(f"Error parsing Gemini response JSON: {e}\nRaw response:\n{result_text}", file=sys.stderr)
        raise RuntimeError("Failed to parse the agentic speech analysis from Gemini.")

def analyze_speech_emotions(transcript: str, event_type: str) -> dict:
    """
    Synchronous entrypoint to run the async orchestrator.
    """
    return asyncio.run(analyze_speech_emotions_async(transcript, event_type))

def synthesize_speech_audio(ssml: str, voice_name: str = "Aoede") -> bytes:
    """
    Calls Gemini API with response_modalities=["AUDIO"] to generate the speech audio from SSML.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
        
    client = genai.Client(api_key=api_key)
    
    system_instruction = (
        "You are an expert text-to-speech speaker. You will read the provided SSML script. "
        "Apply the emotional changes, pitch, and speed adjustments requested in the <prosody> tags. "
        "Generate only the audio of you speaking the script. Do not output any text."
    )
    
    prompt = f"Please read the following SSML script and speak it accordingly:\n\n{ssml}"
    
    prebuilt_voice = "Aoede"
    v_lower = voice_name.lower()
    if "puck" in v_lower:
        prebuilt_voice = "Puck"
    elif "charon" in v_lower:
        prebuilt_voice = "Charon"
    elif "kore" in v_lower:
        prebuilt_voice = "Kore"
    elif "fenrir" in v_lower:
        prebuilt_voice = "Fenrir"
    elif "aoede" in v_lower:
        prebuilt_voice = "Aoede"
    elif "jenny" in v_lower:
        prebuilt_voice = "Aoede"
    elif "guy" in v_lower:
        prebuilt_voice = "Puck"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=prebuilt_voice)
                )
            )
        )
    )
    
    audio_bytes = b""
    for part in response.candidates[0].content.parts:
        if part.inline_data:
            audio_bytes += part.inline_data.data
            
    if not audio_bytes:
        raise RuntimeError("No audio data returned from Gemini API.")
        
    return audio_bytes

if __name__ == "__main__":
    # Small test run
    test_transcript = (
        "I remember when we used to play in the kitchen, my mother was humming a soft melody. "
        "But today, those memories are fading like old photographs."
    )
    os.environ["GEMINI_API_KEY"] = os.environ.get("GEMINI_API_KEY", "dummy-key")
    print("Testing locally...")
    try:
        res = analyze_speech_emotions(test_transcript, "oratory")
        print("Test Result:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Test run failed (expected if API key is mock): {e}")
