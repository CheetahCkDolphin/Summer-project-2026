import sys
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("NSDASpeechRulesServer")

# Internal Database of NSDA Event Guidelines & Expectations
NSDA_DATABASE = {
    "oratory": {
        "rules": (
            "Event: Original Oratory (OO)\n"
            "- Category: Main Event - Public Speaking\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Must be an original work written by the student. No more than 150 quoted words permitted.\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Original Oratory:\n"
            "- Topic & Purpose: The speech must address a significant societal issue, analyze its causes, and offer a practical solution.\n"
            "- Structure: Clear introduction (with hook and thesis), body (problem, cause, solution), and conclusion (call to action).\n"
            "- Delivery: Should be sincere, empathetic, and persuasive. Natural movement (the 'oratorical triangle') is expected.\n"
            "- Emotional Tone Flow: Starts with concern or urgency (Problem), transitions into critical analysis (Cause), and peaks with hope and resolution (Solution)."
        )
    },
    "informative": {
        "rules": (
            "Event: Informative Speaking (INF)\n"
            "- Category: Main Event - Public Speaking\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Must be an original informative work written by the student. No more than 150 quoted words permitted.\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids: PERMITTED and optional (up to 30s total setup/takedown time, managed solely by contestant; no live animals or weapons)."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Informative Speaking:\n"
            "- Topic & Value: Educate the audience on a unique concept, technology, history, or phenomenon. Must explain why this information matters.\n"
            "- Structure: Clear division of subtopics (signposting) to ensure the audience can follow complex details.\n"
            "- Delivery: Highly enthusiastic, clear, professional, and accessible. Use visual aids seamlessly as extension of vocal delivery.\n"
            "- Emotional Tone Flow: Dominantly joy, wonder, and curiosity. Tone should shift to convey interest and excitement about learning."
        )
    },
    "usx": {
        "rules": (
            "Event: United States Extemporaneous Speaking (USX)\n"
            "- Category: Main Event - Limited Preparation\n"
            "- Preparation Time: 30 minutes to prepare a speech on a drawn US domestic policy question.\n"
            "- Time Limit: Maximum of 7 minutes (420 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Delivered from memory or brief prep notes. 5-10 oral news citations expected.\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for US Extemporaneous Speaking:\n"
            "- Structure: Directly answer the question in the introduction. 2-3 main points supporting the answer, and concise conclusion.\n"
            "- Content: Deep analysis of US politics, economics, and social policy. Ground points in cited news facts.\n"
            "- Delivery: Fluent, authoritative, and conversational. Movement should align with transitions between points.\n"
            "- Emotional Tone Flow: Analytical, serious, objective, and composed."
        )
    },
    "extemp": {
        "rules": (
            "Event: United States Extemporaneous Speaking (USX/Extemp)\n"
            "- Category: Main Event - Limited Preparation\n"
            "- Preparation Time: 30 minutes to prepare a speech on a drawn US domestic policy question.\n"
            "- Time Limit: Maximum of 7 minutes (420 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Delivered from memory or brief prep notes. 5-10 oral news citations expected.\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Extemporaneous Speaking:\n"
            "- Structure: Directly answer the question in intro. 2-3 main points supporting the answer, and concise conclusion.\n"
            "- Content: Deep analysis of current events. Ground points in cited news facts.\n"
            "- Delivery: Fluent, authoritative, and conversational. Movement aligns with transitions.\n"
            "- Emotional Tone Flow: Analytical, serious, objective, and composed."
        )
    },
    "ix": {
        "rules": (
            "Event: International Extemporaneous Speaking (IX)\n"
            "- Category: Main Event - Limited Preparation\n"
            "- Preparation Time: 30 minutes to prepare a speech on a drawn foreign affairs question.\n"
            "- Time Limit: Maximum of 7 minutes (420 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Delivered from memory or brief prep notes. 5-10 oral news citations expected.\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for International Extemporaneous Speaking:\n"
            "- Structure: Clear thesis answering foreign policy prompt. 2-3 supporting points with global news citations.\n"
            "- Content: Deep geopolitical and economic analysis of international issues.\n"
            "- Delivery: Diplomatic, fluent, objective, and structured.\n"
            "- Emotional Tone Flow: Analytical, serious, globally aware, and authoritative."
        )
    },
    "impromptu": {
        "rules": (
            "Event: Impromptu Speaking (IMP)\n"
            "- Category: Supplemental Event - Limited Preparation\n"
            "- Preparation & Speaking Time: Total of 7 minutes (420 seconds) combined. Typically 1-2 minutes prep and 5-6 minutes speaking.\n"
            "- Script Requirements: Delivered based on drawn prompt (quote, word, or cartoon). Prep notes allowed.\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Impromptu Speaking:\n"
            "- Content: Unique interpretation of the prompt in introduction. Establish a clear central thesis.\n"
            "- Structure: Typically 2-3 supporting examples (historical, literary, personal) linking back to prompt.\n"
            "- Delivery: Fluid, composed, quick-witted, and structured under tight time pressure.\n"
            "- Emotional Tone Flow: Reflective, engaging, dynamic, and expressive."
        )
    },
    "dramatic": {
        "rules": (
            "Event: Dramatic Interpretation (DI)\n"
            "- Category: Main Event - Interpretation\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Solo performance of a single published dramatic script (play, novel, movie script).\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids/Props: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Dramatic Interpretation:\n"
            "- Characterization: Distinct vocal split, posture, and facial expression for all characters.\n"
            "- Narrative Arc: Emotional buildup from vulnerability to dramatic climax and quiet resolution.\n"
            "- Delivery: Wide vocal range, emotional authenticity, and effective dramatic pauses.\n"
            "- Emotional Tone Flow: Vulnerability, fear, tension -> High intensity conflict -> Quiet resolution."
        )
    },
    "humorous": {
        "rules": (
            "Event: Humorous Interpretation (HI)\n"
            "- Category: Main Event - Interpretation\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Solo performance of a single published humorous literary script.\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids/Props: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Humorous Interpretation:\n"
            "- Comedic Timing: Effective use of beats, double-takes, and physical comedy.\n"
            "- Characterization: Exaggerated, distinct physical and vocal character switches ('popping').\n"
            "- Delivery: High energy, rapid physical transitions, animated expressions, and comedic contrast.\n"
            "- Emotional Tone Flow: Joy, humor, excitement, playfulness."
        )
    },
    "duo": {
        "rules": (
            "Event: Duo Interpretation (DUO)\n"
            "- Category: Main Event - Interpretation\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Performers: Two contestants.\n"
            "- Focus & Interaction: Off-stage focal point (no direct eye contact except intro), no physical contact permitted.\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids/Props: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Duo Interpretation:\n"
            "- Synchronization: Seamless off-stage focal placement, physical positioning, and chemistry.\n"
            "- Characterization: Precise vocal split and distinct character personas for both performers.\n"
            "- Delivery: Balanced performance where both partners contribute equally to narrative.\n"
            "- Tone Flow: Dynamic narrative arc tailored to selected literature."
        )
    },
    "poi": {
        "rules": (
            "Event: Program Oral Interpretation (POI)\n"
            "- Category: Main Event - Interpretation\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Multi-genre program interweaving at least TWO of Prose, Poetry, Drama.\n"
            "- Manuscript/Binder: Handheld Manuscript Binder REQUIRED (used as stage prop/focal point).\n"
            "- Visual Aids: Not allowed (except the manuscript binder)."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Program Oral Interpretation:\n"
            "- Program Design: Cohesive central theme uniting diverse literary genres.\n"
            "- Binder Mechanics: Creative manuscript handling (page turns, binder snaps, focal stance).\n"
            "- Delivery: Distinct vocal transitions between different literary genres and characters.\n"
            "- Tone Flow: Shifting emotional landscape across poetry, prose, and drama."
        )
    },
    "prose": {
        "rules": (
            "Event: Prose Interpretation (PROSE)\n"
            "- Category: Supplemental Event - Interpretation\n"
            "- Time Limit: Maximum of 5 minutes (300 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Selection from published prose literature (short story, novel excerpt, essay).\n"
            "- Manuscript/Binder: Handheld Manuscript Binder REQUIRED.\n"
            "- Visual Aids/Props: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Prose Interpretation:\n"
            "- Storytelling: Strong narrative voice, descriptive imagery, and character portrayal.\n"
            "- Binder Usage: Smooth page turns, holding binder cleanly at waist/chest level.\n"
            "- Delivery: Warm, engaging narrative tempo with emotional resonance.\n"
            "- Tone Flow: Narrative-driven emotional progression."
        )
    },
    "poetry": {
        "rules": (
            "Event: Poetry Interpretation (POETRY)\n"
            "- Category: Supplemental Event - Interpretation\n"
            "- Time Limit: Maximum of 5 minutes (300 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Selection from published poetry (single poem or collection).\n"
            "- Manuscript/Binder: Handheld Manuscript Binder REQUIRED.\n"
            "- Visual Aids/Props: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Poetry Interpretation:\n"
            "- Rhythm & Meter: Sensitivity to poetic cadence, line breaks, rhyme, and imagery.\n"
            "- Binder Usage: Fluid binder movement enhancing poetic expression.\n"
            "- Delivery: Expressive vocal melody, emotional depth, and precise diction.\n"
            "- Tone Flow: Lyrical, passionate, reflective, or intense based on the poem."
        )
    },
    "declamation": {
        "rules": (
            "Event: Declamation (DEC)\n"
            "- Category: Supplemental / Middle School Event - Public Speaking\n"
            "- Time Limit: Maximum of 10 minutes (600 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Delivery of a speech previously given by another orator, with original student intro.\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids: Not allowed."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Declamation:\n"
            "- Interpretation: Convey original speaker's message with conviction while adding personal interpretation.\n"
            "- Student Intro: Original introduction explaining historical or modern relevance.\n"
            "- Delivery: Polished, clear, persuasive, and commanding vocal presence.\n"
            "- Tone Flow: Inspiring, urgent, educational, or motivational."
        )
    },
    "expository": {
        "rules": (
            "Event: Expository Speaking (EXP)\n"
            "- Category: Supplemental Event - Public Speaking\n"
            "- Time Limit: Maximum of 5 minutes (300 seconds) with a 30-second grace period.\n"
            "- Script Requirements: Original informative speech written by the student.\n"
            "- Manuscript/Binder: Memorized (off-book).\n"
            "- Visual Aids: PERMITTED and optional."
        ),
        "expectations": (
            "NSDA Judges' Expectations for Expository Speaking:\n"
            "- Clarity & Focus: Clear 5-minute explanation of an object, process, or idea.\n"
            "- Visual Aids: Visual aids used effectively and smoothly without distraction.\n"
            "- Delivery: Energetic, clear, concise, and engaging.\n"
            "- Tone Flow: Informative, enthusiastic, curious, and clear."
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
    Accepts: 'oratory', 'informative', 'usx', 'ix', 'extemp', 'impromptu', 'dramatic', 'humorous', 'duo', 'poi', 'prose', 'poetry', 'declamation', 'expository'
    """
    key = event.lower().strip()
    if key in NSDA_DATABASE:
        return NSDA_DATABASE[key]["rules"]
    return f"Unknown event '{event}'. Available events: {', '.join(NSDA_DATABASE.keys())}"

@mcp.tool()
def get_judges_expectations(event: str) -> str:
    """
    Returns the qualitative expectations of NSDA judges for a given speech event.
    Accepts: 'oratory', 'informative', 'usx', 'ix', 'extemp', 'impromptu', 'dramatic', 'humorous', 'duo', 'poi', 'prose', 'poetry', 'declamation', 'expository'
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
