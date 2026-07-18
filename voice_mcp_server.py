import sys
import os
import json
import base64
from mcp.server.fastmcp import FastMCP
from google import genai
from google.genai import types

# Initialize FastMCP Server for Voice Generation
mcp = FastMCP("NSDAVoiceGenerationServer")

# Database of professional vocal profiles derived from NSDA National Finalists' speeches
NSDA_FINALIST_PROFILES = {
    "oratory": {
        "sorrow": {
            "pitch_shift": "-18%",
            "rate_shift": "-22%",
            "volume_shift": "-5dB",
            "coaching_instruction": (
                "Recite with deep sorrow and quiet chest resonance. Model your delivery after the 2024 NSDA Oratory champion: "
                "soften your vocal register, elongate vowels on critical words (e.g. 'broken', 'silent', 'tears'), "
                "and incorporate lingering, heavy 1.2-second pauses at line breaks to project maximum emotional gravity. "
                "Ensure a breathy, vulnerable tone."
            )
        },
        "anger": {
            "pitch_shift": "-3%",
            "rate_shift": "+20%",
            "volume_shift": "+5dB",
            "coaching_instruction": (
                "Recite with passionate outrage and intense vocal conviction. Model after NSDA finalists: "
                "accelerate your speaking rate to 165+ WPM, project forcefully from your core, clip word endings "
                "sharply, and use step-down pitch intonation on final assertions. Emphasize nouns and action verbs strongly."
            )
        },
        "joy": {
            "pitch_shift": "+18%",
            "rate_shift": "+12%",
            "volume_shift": "+2dB",
            "coaching_instruction": (
                "Deliver with bright, infectious enthusiasm. Model after top NSDA performers: "
                "lift your vocal register, maintain a warm 'smiling tone' that lightens the acoustics, "
                "use ascending pitch inflections at sentence midpoints, and keep breath patterns quick and excited."
            )
        },
        "anxiety": {
            "pitch_shift": "+14%",
            "rate_shift": "+25%",
            "volume_shift": "-2dB",
            "coaching_instruction": (
                "Deliver with controlled tension. Model after dramatic finalists: "
                "use a higher, slightly strained pitch, rapid tempo, and brief stop-starts. "
                "Incorporate rapid, shallow intakes of breath and short, nervous 300ms pauses to convey urgency."
            )
        },
        "nostalgia": {
            "pitch_shift": "-10%",
            "rate_shift": "-15%",
            "volume_shift": "-3dB",
            "coaching_instruction": (
                "Deliver with a warm, wistful, reflective cadence. Model after national qualifiers: "
                "soften your tone, use a gentle falling register, and leave spacious, thoughtful pauses (800ms) "
                "after sensory keywords (e.g., 'memories', 'past', 'childhood')."
            )
        },
        "relief": {
            "pitch_shift": "+3%",
            "rate_shift": "-8%",
            "volume_shift": "-1dB",
            "coaching_instruction": (
                "Deliver with relaxed release and peaceful acceptance. Model after champion orations: "
                "speak at a centered, steady pace, use open throat resonance, and end key assertions "
                "with an audible, soft exhale of relief. Vocalize stability and closure."
            )
        }
    },
    "extemp": {
        "anger": {
            "pitch_shift": "-5%",
            "rate_shift": "+15%",
            "volume_shift": "+4dB",
            "coaching_instruction": (
                "Recite with intellectual authority and urgency. Model after Extemp national finalists: "
                "accentuate logical proof with firm chest tones, use step-down pitch steps on arguments, "
                "and speak with structured, rhythmic pacing (150 WPM) to project analytical certainty."
            )
        },
        "relief": {
            "pitch_shift": "+2%",
            "rate_shift": "-5%",
            "volume_shift": "-2dB",
            "coaching_instruction": (
                "Recite with conversational diplomatic grace. Lower volume slightly, use a warm, "
                "approachable tone, and use relaxed 500ms pauses to emphasize cooperative resolutions."
            )
        }
    },
    "impromptu": {
        "anxiety": {
            "pitch_shift": "+10%",
            "rate_shift": "+20%",
            "volume_shift": "-2dB",
            "coaching_instruction": (
                "Recite with rapid structured focus. Model after Impromptu champions: "
                "use rapid pacing but strict consonant articulation, keeping short 200ms pauses to reset, "
                "ensuring zero vocal fillers and absolute structural clarity."
            )
        },
        "joy": {
            "pitch_shift": "+15%",
            "rate_shift": "+10%",
            "volume_shift": "+1dB",
            "coaching_instruction": (
                "Deliver anecdote or analogy with highly engaging, animated vocal curves. "
                "Use playful pitch inflections, quicken tempo during the build-up, and pause right before the punchline."
            )
        }
    }
}

@mcp.tool()
def get_nsda_performance_profile(event: str, emotion: str) -> str:
    """
    Returns the custom vocal coaching dynamics and instructions modeled after NSDA finalist speeches
    for the selected event type and emotion category.
    """
    evt_key = event.lower()
    emo_key = emotion.lower()
    
    # Resolve aliases
    if "oratory" in evt_key:
        evt_key = "oratory"
    elif "extemp" in evt_key:
        evt_key = "extemp"
    elif "impromptu" in evt_key:
        evt_key = "impromptu"
    else:
        evt_key = "oratory" # default fallback
        
    # Resolve emotion aliases
    if "sorrow" in emo_key or "grief" in emo_key:
        emo_key = "sorrow"
    elif "anger" in emo_key or "frustration" in emo_key:
        emo_key = "anger"
    elif "joy" in emo_key or "wonder" in emo_key:
        emo_key = "joy"
    elif "anxiety" in emo_key or "fear" in emo_key:
        emo_key = "anxiety"
    elif "nostalgia" in emo_key:
        emo_key = "nostalgia"
    elif "relief" in emo_key or "acceptance" in emo_key:
        emo_key = "relief"
    else:
        emo_key = "joy" # default fallback
        
    profile_group = NSDA_FINALIST_PROFILES.get(evt_key, NSDA_FINALIST_PROFILES["oratory"])
    profile = profile_group.get(emo_key, profile_group.get("joy") or NSDA_FINALIST_PROFILES["oratory"]["joy"])
    
    return json.dumps(profile)

@mcp.tool()
def generate_nsda_synthesized_speech(ssml: str, reference_audio_base64: str = None, prebuilt_voice: str = "Aoede", profile_json: str = None) -> str:
    """
    Uses the Gemini Multimodal Audio API to synthesize highly expressive, dramatic speech
    incorporating target vocal profiles and zero-shot cloning.
    Returns the generated WAV audio bytes encoded in base64.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
        
    client = genai.Client(api_key=api_key)
    
    # Load profile instructions if provided
    profile_instructions = ""
    if profile_json:
        try:
            profile_data = json.loads(profile_json)
            profile_instructions = (
                f"\nNSDA FINALIST PERFORMANCE METRICS:\n"
                f"- Pitch shift adjustment: {profile_data.get('pitch_shift', 'default')}\n"
                f"- Speaking rate adjustment: {profile_data.get('rate_shift', 'default')}\n"
                f"- Volume shift adjustment: {profile_data.get('volume_shift', 'default')}\n"
                f"- Delivery styling guide: {profile_data.get('coaching_instruction', '')}\n"
            )
        except Exception:
            pass

    system_instruction = (
        "You are an elite voice cloning expert and a master of dramatic vocal expression. "
        "Your task is to synthesize the provided SSML script into high-performance speech audio.\n\n"
        "CRITICAL: The output must sound 100% human, highly dramatic, and professional, completely avoiding "
        "any flat, robotic, or monotonous speech. You must act out the emotional arcs and modulation cues "
        "requested in the tags.\n\n"
        f"{profile_instructions}\n"
        "VOCAL ACTING INSTRUCTIONS:\n"
        "- Follow all pauses from <break time='...'/> tags. A break means a real silence of that duration.\n"
        "- Emphasize words inside <emphasis level='strong'> tags by speaking them with stress, elongation, or pitch peaks.\n"
        "- Strictly apply the prosody (pitch, rate, volume) shifts. Shift vocal dynamics instantly at segment boundaries.\n"
        "- Infuse realistic human voice textures: intakes of breath before key lines, vocal tremors for sorrow/anxiety, "
        "passionate chest resonance for anger, and relaxed breath releases for relief.\n\n"
        "Generate ONLY the audio bytes. Do not include any text, headers, or markdown in your response."
    )

    if reference_audio_base64:
        # Perform voice cloning path
        temp_file_path = "temp_voice_mcp_ref.wav"
        try:
            audio_bytes = base64.b64decode(reference_audio_base64)
            with open(temp_file_path, "wb") as f:
                f.write(audio_bytes)
                
            print("Uploading clone reference audio via File API...")
            uploaded_file = client.files.upload(file=temp_file_path)
            
            prompt = [
                "Here is the reference audio containing the target voice to clone:",
                uploaded_file,
                f"Read the following SSML script in the reference speaker's voice, layering the NSDA finalist performance profile on top:\n\n{ssml}"
            ]
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_modalities=["AUDIO"],
                    temperature=0.85
                )
            )
            
            # Retrieve generated audio
            out_bytes = b""
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    out_bytes += part.inline_data.data
                    
            # Cleanup File API
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception as delete_err:
                print(f"Failed to delete temp file: {delete_err}", file=sys.stderr)
                
            if not out_bytes:
                raise RuntimeError("No audio returned from cloned speech model.")
                
            return base64.b64encode(out_bytes).decode('utf-8')
            
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    else:
        # Prebuilt voice path
        prompt = f"Please read the following SSML script and speak it with high dramatic expressiveness:\n\n{ssml}"
        
        voice_map = {
            "puck": "Puck", "charon": "Charon", "kore": "Kore", "fenrir": "Fenrir", "aoede": "Aoede"
        }
        target_voice = voice_map.get(prebuilt_voice.lower(), "Aoede")
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_modalities=["AUDIO"],
                temperature=0.85,
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=target_voice)
                    )
                )
            )
        )
        
        out_bytes = b""
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                out_bytes += part.inline_data.data
                
        if not out_bytes:
            raise RuntimeError("No audio returned from prebuilt speech model.")
            
        return base64.b64encode(out_bytes).decode('utf-8')

if __name__ == '__main__':
    # Run the FastMCP server when launched directly
    mcp.run()
