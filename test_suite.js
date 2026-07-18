const tests = [
  {
    panel: "Speech Audio Input Panel",
    tests: [
      {
        id: "input_tab_switching",
        name: "Tab Switching Interaction",
        desc: "Verifies switching tabs toggles active CSS classes between Upload and Record views",
        run: (win, doc) => {
          const tabRecord = doc.getElementById('tab-record');
          const tabUpload = doc.getElementById('tab-upload');
          const contentRecord = doc.getElementById('content-record');
          const contentUpload = doc.getElementById('content-upload');
          
          tabRecord.click();
          if (!contentRecord.classList.contains('active') || contentUpload.classList.contains('active')) {
            throw new Error("Failed to activate Record view on tab click");
          }
          
          tabUpload.click();
          if (!contentUpload.classList.contains('active') || contentRecord.classList.contains('active')) {
            throw new Error("Failed to reactivate Upload view on tab click");
          }
          return true;
        }
      },
      {
        id: "input_mock_file_load",
        name: "Mock File Upload Loader",
        desc: "Verifies handleAudioFile correctly populates filename, size, and shows the file-info block",
        run: (win, doc) => {
          const mockFile = new File([new ArrayBuffer(1024 * 1024 * 2)], "test_speech.mp3", { type: "audio/mp3" });
          win.handleAudioFile(mockFile);
          
          const fileInfo = doc.getElementById('uploaded-file-info');
          const filename = doc.getElementById('info-filename');
          const filesize = doc.getElementById('info-filesize');
          
          if (!fileInfo.classList.contains('visible') && fileInfo.style.display !== 'block') {
            throw new Error("Uploaded file info container was not made visible");
          }
          if (filename.textContent !== "test_speech.mp3") {
            throw new Error(`Expected filename to be test_speech.mp3, got ${filename.textContent}`);
          }
          if (!filesize.textContent.includes("2.0 MB")) {
            throw new Error(`Expected size to be around 2.0 MB, got ${filesize.textContent}`);
          }
          return true;
        }
      }
    ]
  },
  {
    panel: "Speech Transcript Panel",
    tests: [
      {
        id: "transcript_char_word_count",
        name: "Character & Word Counter",
        desc: "Verifies text inputs trigger real-time character and word count calculations",
        run: (win, doc) => {
          const textInput = doc.getElementById('transcript-input');
          const readout = doc.getElementById('char-word-count');
          
          textInput.value = "Hello world from the NSDA evaluator tool.";
          // Dispatch input event to trigger calculations
          textInput.dispatchEvent(new Event('input'));
          
          if (!readout.textContent.includes("Words: 7") || !readout.textContent.includes("Characters: 40")) {
            throw new Error(`Expected Words: 7 | Characters: 40, got ${readout.textContent}`);
          }
          return true;
        }
      },
      {
        id: "transcript_quote_counter",
        name: "Direct Quotes Rules Tracker",
        desc: "Verifies quoted words are tracked and quote limit indicators update dynamically",
        run: (win, doc) => {
          const textInput = doc.getElementById('transcript-input');
          const readout = doc.getElementById('quote-count-readout');
          
          win.state.selectedEvent = 'oratory';
          textInput.value = 'The speaker said: "We must strive for integrity and honesty in all things."';
          textInput.dispatchEvent(new Event('input'));
          
          if (!readout.textContent.includes("Quoted: 9")) {
            throw new Error(`Expected Quoted: 9, got ${readout.textContent}`);
          }
          return true;
        }
      }
    ]
  },
  {
    panel: "Rules Guidelines & Checklist Panel",
    tests: [
      {
        id: "guidelines_update_on_event_change",
        name: "Dynamic Guidelines Load",
        desc: "Verifies guidelines description updates when event selection changes",
        run: (win, doc) => {
          const selector = doc.getElementById('event-selector');
          const title = doc.getElementById('guideline-event-title');
          const maxTime = doc.getElementById('rule-max-time');
          
          selector.value = 'extemp';
          selector.dispatchEvent(new Event('change'));
          
          if (title.textContent !== "Extemporaneous Speaking") {
            throw new Error(`Expected Extemporaneous Speaking, got ${title.textContent}`);
          }
          if (!maxTime.textContent.includes("7:00")) {
            throw new Error(`Expected time limit 7:00, got ${maxTime.textContent}`);
          }
          return true;
        }
      },
      {
        id: "rules_checklist_compliance",
        name: "Speech Compliance Status Update",
        desc: "Verifies WPM and Time compliance checklists update to correct status styles",
        run: (win, doc) => {
          const chkPacing = doc.getElementById('chk-rule-pacing');
          
          win.state.audioDuration = 60; // 1 minute
          win.state.transcript = "This is a simple speech with moderate speed."; // 8 words
          win.evaluateSpeech();
          
          // 8 words in 1 min is extremely slow pacing (8 WPM), pacing should fail
          if (chkPacing.classList.contains('pass')) {
            throw new Error("Checklist pacing rule was marked pass for extremely slow speed (8 WPM)");
          }
          return true;
        }
      }
    ]
  },
  {
    panel: "Vocal Emotion Comparison Matrix Panel",
    tests: [
      {
        id: "matrix_expected_emotion_classification",
        name: "Target Script Emotion Mapper",
        desc: "Verifies correct emotion mappings and tips populate based on target script content",
        run: (win, doc) => {
          const transcriptInput = doc.getElementById('transcript-input');
          
          // Sorrow vocabulary triggers Sorrow & Grief script emotion
          transcriptInput.value = "We mourned our tragic loss and wept tears of grief and sadness.";
          transcriptInput.dispatchEvent(new Event('input'));
          
          const expectedTag = doc.getElementById('emotion-expected-tag');
          if (expectedTag.textContent !== "Sorrow & Grief") {
            throw new Error(`Expected Sorrow & Grief target, got ${expectedTag.textContent}`);
          }
          return true;
        }
      },
      {
        id: "matrix_text_color_highlighting",
        name: "Color-Coded Script Highlighting",
        desc: "Verifies emotional keywords get wrapped in correct emotional HTML class spans",
        run: (win, doc) => {
          const highlighted = win.highlightEmotionWords("This is a beautiful natural dream of growth and joy.");
          
          if (!highlighted.includes("word-joy")) {
            throw new Error(`Expected color class word-joy inside highlights, got ${highlighted}`);
          }
          return true;
        }
      }
    ]
  },
  {
    panel: "Judge Ballot & Print Panel",
    tests: [
      {
        id: "ballot_score_calculations",
        name: "Overall Score & Rank Calculations",
        desc: "Verifies overall score and rank updates dynamically on subscore sliders adjust",
        run: (win, doc) => {
          const deliveryVal = doc.getElementById('score-delivery-val');
          const contentVal = doc.getElementById('score-content-val');
          const orgVal = doc.getElementById('score-org-val');
          const scoreGauge = doc.getElementById('score-gauge-val');
          const rank = doc.getElementById('ballot-rank-readout');
          
          win.state.scores.delivery = 9;
          win.state.scores.content = 9;
          win.state.scores.org = 8;
          win.updateOverallScore();
          
          const overall = scoreGauge.textContent;
          if (overall !== "8.7") {
            throw new Error(`Expected overall score 8.7, got ${overall}`);
          }
          if (rank.textContent !== "Excellent (Rank 2-3)") {
            throw new Error(`Expected Excellent (Rank 2-3) rank, got ${rank.textContent}`);
          }
          return true;
        }
      },
      {
        id: "ballot_comment_generation",
        name: "Ballot Comment Generator",
        desc: "Verifies dynamic feedback comments are populated into the ballot box",
        run: (win, doc) => {
          const commentsBox = doc.getElementById('ballot-comments-box');
          
          win.state.audioDuration = 120;
          win.state.transcript = "This is a mock speech transcript for ballot generation testing.";
          win.evaluateSpeech();
          
          if (commentsBox.value.trim().length === 0) {
            throw new Error("Ballot comments box remained empty after speech evaluation");
          }
          return true;
        }
      }
    ]
  },
  {
    panel: "Expressive Voice Clone Synthesis Panel",
    tests: [
      {
        id: "voice_options_mapping",
        name: "Synthesis Voice Dropdown Mappings",
        desc: "Verifies available synthesis voices load correctly in the select dropdown menu",
        run: (win, doc) => {
          const select = doc.getElementById('voice-select');
          if (select.options.length < 3) {
            throw new Error(`Expected at least 3 voice choices, got ${select.options.length}`);
          }
          return true;
        }
      },
      {
        id: "voice_synthesis_ssml_builder",
        name: "SSML Voice Cues Builder",
        desc: "Verifies voice clone synthesizer successfully parses script markers into SSML",
        run: (win, doc) => {
          const transcriptInput = doc.getElementById('transcript-input');
          transcriptInput.value = "This is a sad lost tragedy.";
          transcriptInput.dispatchEvent(new Event('input'));
          
          const ssml = win.generateSSMLFromMatrix();
          if (!ssml.includes("<speak>") || !ssml.includes("<break") || !ssml.includes("</speak>")) {
            throw new Error(`Generated invalid SSML structure: ${ssml}`);
          }
          return true;
        }
      }
    ]
  }
];

function initTestInterface() {
  const container = document.getElementById('test-panels');
  container.innerHTML = '';
  
  let total = 0;
  tests.forEach(group => {
    const section = document.createElement('div');
    section.className = 'panel-section';
    
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <span>${group.panel}</span>
      <span class="panel-badge" id="badge-${group.panel.replace(/\s+/g, '')}">${group.tests.length} tests</span>
    `;
    section.appendChild(header);
    
    const list = document.createElement('ul');
    list.className = 'test-list';
    
    group.tests.forEach(t => {
      total++;
      const item = document.createElement('li');
      item.className = 'test-item';
      item.innerHTML = `
        <div class="test-info">
          <span class="test-name">${t.name}</span>
          <span class="test-desc">${t.desc}</span>
        </div>
        <span class="test-status pending" id="status-${t.id}">PENDING</span>
      `;
      list.appendChild(item);
    });
    
    section.appendChild(list);
    container.appendChild(section);
  });
  
  document.getElementById('total-val').textContent = total;
}

function runAllTests() {
  const iframe = document.getElementById('app-frame');
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  
  let passed = 0;
  let failed = 0;
  
  // Reset application status
  if (win && win.resetApplication) {
    win.resetApplication();
  }

  tests.forEach(group => {
    group.tests.forEach(t => {
      const el = document.getElementById(`status-${t.id}`);
      try {
        const success = t.run(win, doc);
        if (success) {
          el.textContent = "PASSED";
          el.className = "test-status pass";
          passed++;
        } else {
          el.textContent = "FAILED";
          el.className = "test-status fail";
          failed++;
        }
      } catch (err) {
        console.error(`Test ${t.id} failed:`, err);
        el.textContent = "FAILED";
        el.className = "test-status fail";
        el.title = err.message;
        failed++;
      }
    });
  });
  
  document.getElementById('passed-val').textContent = passed;
  document.getElementById('failed-val').textContent = failed;
}

// Run on page load
window.addEventListener('load', () => {
  initTestInterface();
  const iframe = document.getElementById('app-frame');
  iframe.addEventListener('load', () => {
    // Run tests automatically on load once the iframe content loads
    setTimeout(runAllTests, 500);
  });
});
