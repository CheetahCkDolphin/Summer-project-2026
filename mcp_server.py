import sys
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("NSDASpeechRulesServer")

# Internal Database of NSDA Event Guidelines & Expectations
NSDA_DATABASE = {
    "oratory": {
        "rules": (
            "Event: Original Oratory (OO)\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Must be an original work written by the student. No more than 150 quoted words are permitted.\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Original Oratory:\n"
            "- Topic & Purpose: The speech must address a significant societal issue, analyze its causes, and offer a practical, multi-level solution.\n"
            "- Structure: Clear introduction (with hook and thesis), body (problem, cause, solution), and conclusion (call to action).\n"
            "- Delivery: Should be sincere, empathetic, and persuasive. Natural movement (the 'oratorical triangle') is expected.\n"
            "- Emotional Tone Flow: Starts with concern or urgency (Problem), transitions into intellectual/critical analysis (Cause), and peaks with hope, inspiration, and resolution (Solution)."
        )
    },
    "informative": {
        "rules": (
            "Event: Informative Speaking (INF)\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Must be an original informative work written by the student. No more than 150 quoted words are permitted.\n"
            "- Visual Aids: Permitted and highly encouraged. Must be managed smoothly without distracting from the speech."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Informative Speaking:\n"
            "- Topic & Value: The topic should educate the audience on a unique concept, technology, history, or phenomenon. Must explain why this information matters.\n"
            "- Structure: Clear division of subtopics (signposting) to ensure the audience can follow complex details.\n"
            "- Delivery: Highly enthusiastic, clear, professional, and accessible. Use visual aids as extension of vocal delivery.\n"
            "- Emotional Tone Flow: Dominantly joy, wonder, and curiosity. Tone should shift to convey interest and excitement about learning."
        )
    },
    "extemp": {
        "rules": (
            "Event: Extemporaneous Speaking (IX/USX)\n"
            "- Preparation Time: 30 minutes to prepare a speech on a drawn question.\n"
            "- Time Limit: Maximum of 7 minutes (420 seconds) with a 30-second grace period.\n"
            "- Script Requirements: No prepared script allowed. Delivered from memory or brief notes.\n"
            "- Sources: Judges expect 5-10 high-quality external news sources cited orally."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Extemporaneous Speaking:\n"
            "- Structure: Must directly answer the chosen question in the introduction. Structured with 2-3 clear points supporting the answer, and a concise summary.\n"
            "- Content: Deep analysis of current events, politics, or economics. Avoid simple opinion; ground points in facts.\n"
            "- Delivery: Fluent, authoritative, and conversational. Movement should align with transitions between points.\n"
            "- Emotional Tone Flow: Analytical, serious, and composed. Transitions should sound logical and objective."
        )
    },
    "impromptu": {
        "rules": (
            "Event: Impromptu Speaking (IMP)\n"
            "- Preparation & Speaking Time: Total of 7 minutes (420 seconds) combined. Typically 1-2 minutes of prep and 5-6 minutes of speaking.\n"
            "- Script Requirements: No prepared script. Delivered based on a selected prompt (quote, word, or cartoon)."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Impromptu Speaking:\n"
            "- Content & Focus: Must provide a unique interpretation of the prompt in the introduction. Establish a clear thesis.\n"
            "- Structure: Typically a 3-part structure (e.g. historical, literary, personal examples) that links back to the prompt.\n"
            "- Delivery: Fluid, composed, and quick-witted. Use transitions to mask any preparation pauses.\n"
            "- Emotional Tone Flow: Reflective, engaging, and dynamic. Able to shift from a serious example to a lighthearted personal anecdote."
        )
    },
    "dramatic": {
        "rules": (
            "Event: Dramatic Interpretation (DI)\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Solo performance of a published literary script (play, novel, or poem). Monologues or multi-character scenes allowed.\n"
            "- Props/Costumes: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Dramatic Interpretation:\n"
            "- Characterization: Clear distinction between characters in voice (vocal split), posture, and facial expression. Sincere and realistic acting is preferred over melodrama.\n"
            "- Narrative Arc: A clear buildup of conflict, climax, and resolution.\n"
            "- Delivery: High vocal range, effective use of silence/pauses, and emotional authenticity.\n"
            "- Emotional Tone Flow: Deeply emotional. Moves from vulnerability, sadness, or fear, peaking with high intensity (anger, despair, or grief), followed by quiet resolution."
        )
    },
    "humorous": {
        "rules": (
            "Event: Humorous Interpretation (HI)\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Solo performance of a published humorous literary script.\n"
            "- Props/Costumes: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Humorous Interpretation:\n"
            "- Comedic Timing: Effective use of beats, double-takes, and pacing to land jokes.\n"
            "- Characterization: Broad, exaggerated, and highly distinct physical and vocal character switches ('popping').\n"
            "- Delivery: High energy, rapid physical transitions, animated expressions, and physical comedy.\n"
            "- Emotional Tone Flow: Dominantly joy, humor, excitement, and playfulness, with rapid shifts for comedic contrast."
        )
    }
}

EMOTION_COACHING = {
    "sorrow": {
        "emotion": "Sorrow & Grief",
        "guidance": "Exploring loss, heartache, or tragedy. Deliver with soft volume, chest/breathy register, and elongated pauses.",
        "suggestions": [
            "Lower your average volume and speak in a soft, breathy tone to project vulnerability.",
            "Use long, reflective pauses (2+ seconds) between key lines to allow the emotional weight to sink in."
        ]
    },
    "anger": {
        "emotion": "Anger & Frustration",
        "guidance": "Outbursts against injustice or conflict. Use sharp word stress, elevated volume, and rapid transitions.",
        "suggestions": [
            "Increase volume on key active verbs to project outrage and conviction.",
            "Utilize sudden, sharp pitch changes and clip the ends of sentences to emphasize urgency."
        ]
    },
    "joy": {
        "emotion": "Joy & Wonder",
        "guidance": "Celebrating success, discovery, or hope. Deliver with light, rising inflections and high energy.",
        "suggestions": [
            "Adopt a smiling vocal posture and raise your pitch register slightly to convey authentic warmth.",
            "Keep the delivery fluid and energetic, letting enthusiasm speed up descriptions."
        ]
    },
    "anxiety": {
        "emotion": "Anxiety & Fear",
        "guidance": "Conveying vulnerability, crisis, or tension. Use trembling tempo and narrow pitch ranges.",
        "suggestions": [
            "Compress your pitch variance (monotone/flat) to project internal tension or containment.",
            "Integrate short, shallow breath patterns before starting high-tension sentences."
        ]
    },
    "nostalgia": {
        "emotion": "Nostalgia",
        "guidance": "Reflecting on childhood or fading memories. Deliver with warm, chest register and calm pacing.",
        "suggestions": [
            "Adopt a warm, chest-resonant tone to invite the judge into personal reflective narratives.",
            "Maintain smooth, even volume, avoiding abrupt spikes during storytelling segments."
        ]
    },
    "relief": {
        "emotion": "Relief & Acceptance",
        "guidance": "Finding closure or peace after turmoil. Deliver with stable register and gentle pauses.",
        "suggestions": [
            "Maintain a balanced, conversational cadence with natural breathing to project composure.",
            "Transition from high-intensity segments to a soft, centered pitch to express resolution."
        ]
    }
}

@mcp.tool()
def get_nsda_guidelines(event: str) -> str:
    """
    Returns the official NSDA rules and guidelines for a given speech event.
    Accepts: 'oratory', 'informative', 'extemp', 'impromptu', 'dramatic', 'humorous'
    """
    key = event.lower().strip()
    if key in NSDA_DATABASE:
        return NSDA_DATABASE[key]["rules"]
    return f"Unknown event '{event}'. Available events: {', '.join(NSDA_DATABASE.keys())}"

@mcp.tool()
def get_judges_expectations(event: str) -> str:
    """
    Returns the qualitative expectations of NSDA judges for a given speech event.
    Accepts: 'oratory', 'informative', 'extemp', 'impromptu', 'dramatic', 'humorous'
    """
    key = event.lower().strip()
    if key in NSDA_DATABASE:
        return NSDA_DATABASE[key]["expectations"]
    return f"Unknown event '{event}'. Available events: {', '.join(NSDA_DATABASE.keys())}"

@mcp.tool()
def get_vocal_coaching_tips(emotion: str) -> dict:
    """
    Returns vocal coaching tips and guidelines for a specific target emotion.
    Accepts: 'sorrow', 'anger', 'joy', 'anxiety', 'nostalgia', 'relief'
    """
    key = emotion.lower().strip()
    # Handle variations/synonyms
    if "grief" in key or "sad" in key:
        key = "sorrow"
    elif "frustration" in key:
        key = "anger"
    elif "wonder" in key or "happy" in key:
        key = "joy"
    elif "fear" in key or "tension" in key:
        key = "anxiety"
    elif "accept" in key or "peace" in key:
        key = "relief"
        
    if key in EMOTION_COACHING:
        return EMOTION_COACHING[key]
    return {
        "emotion": emotion.capitalize(),
        "guidance": "Vocal pacing and delivery should fit the context of the script.",
        "suggestions": [
            "Adjust volume and tempo dynamically to maintain audience engagement.",
            "Practice transitions to guide the audience through shifting sentiments."
        ]
    }

if __name__ == "__main__":
    mcp.run()
