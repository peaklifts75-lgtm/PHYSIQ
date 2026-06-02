/* ============================================
   FORMD — app.js
   ============================================ */

// ============================================
// SCROLL REVEAL
// ============================================
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
reveals.forEach(r => observer.observe(r));


// ============================================
// FORM STATE
// ============================================
let currentStep = 0;
const totalSteps = 4;
const formData = {};


// ============================================
// OPTION CARD SELECTION
// ============================================
function selectOption(el, group) {
  document.querySelectorAll(`input[name="${group}"]`).forEach(inp => {
    inp.closest('.option-card').classList.remove('selected');
  });
  el.classList.add('selected');
  formData[group] = el.querySelector('input').value;
}


// ============================================
// STEP NAVIGATION
// ============================================
function updateDots(step) {
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.getElementById(`dot${i}`);
    dot.className = 'step-dot';
    if (i < step) dot.classList.add('done');
    else if (i === step) dot.classList.add('active');
  }
}

function nextStep(current) {
  document.getElementById(`step${current}`).classList.remove('active');
  currentStep = current + 1;
  document.getElementById(`step${currentStep}`).classList.add('active');
  updateDots(currentStep);
}

function prevStep(current) {
  document.getElementById(`step${current}`).classList.remove('active');
  currentStep = current - 1;
  document.getElementById(`step${currentStep}`).classList.add('active');
  updateDots(currentStep);
}


// ============================================
// AI PROMPT
// Edit this section to control what exercises
// and programming style the AI generates.
// ============================================
function buildPrompt(data) {
  const ageNum = parseInt(data.age) || 16;
  const audienceTone = ageNum <= 19
    ? 'teenager who is new to serious training'
    : 'adult lifter focused on aesthetics';

  // ---- CUSTOMIZE YOUR PROGRAMMING PHILOSOPHY HERE ----
  // Add any rules you always want the AI to follow.
  // Examples:
  //   "Always include barbell bench press on push days."
  //   "Never recommend Smith Machine exercises."
  //   "Always start sessions with a compound movement."
  const programmingRules = `
- Always prioritize compound movements first, accessories second.
- Follow a Push/Pull/Legs structure for 5-6 day programs, Upper/Lower for 3-4 day programs.
- Keep rest times at 90 seconds for compounds, 60 seconds for accessories.
- Focus on aesthetic muscle development — V-taper, shoulder width, arm definition.
- Never recommend dangerous exercises for teenagers (e.g. heavy barbell good mornings).
  `;

  // ---- CUSTOMIZE EXERCISE DEFAULTS HERE ----
  // If you want specific exercises always included or excluded, add them below.
  const exercisePreferences = `
Preferred exercises to include where appropriate:
- Chest: Incline Barbell Press, Cable Flyes, Dips
- Back: Pull-Ups, Barbell Rows, Lat Pulldowns, Face Pulls
- Shoulders: Overhead Press, Lateral Raises, Rear Delt Flyes
- Arms: Barbell Curls, Hammer Curls, Tricep Pushdowns, Skull Crushers
- Legs: Squats, Romanian Deadlifts, Leg Press, Leg Curls
  `;

  return `You are a strength and aesthetics coach. Create a personalized 12-week lifting program for this person:

Name: ${data.name}
Age: ${data.age}
Tone: Write as if speaking to a ${audienceTone}
Height: ${data.height}
Weight: ${data.weight} lbs
Experience: ${data.experience || 'beginner'}
Goal: ${data.goal || 'aesthetic physique'}
Body Type: ${data.bodytype || 'average'}
Training Days/Week: ${data.days || '4'}
Equipment: ${data.equipment || 'full gym'}
Priority Muscle Group: ${data.focus || 'back and lats'}
Additional Notes: ${data.notes || 'none'}

Programming rules to follow:
${programmingRules}

${exercisePreferences}

Write a detailed but friendly 12-week program overview. Include:
1. A personal intro paragraph addressing ${data.name} directly explaining why this program suits their situation
2. The weekly training split
3. Week 1-4: focus and key exercises with sets/reps (4-5 exercises per session)
4. Week 5-8: progression adjustments
5. Week 9-12: intensity phase
6. One key nutrition tip for their specific goal

Be motivating and real. No generic filler. Format clearly with headers. ~400-500 words.`;
}


// ============================================
// GENERATE PROGRAM
// ============================================
async function generateProgram() {
  // Collect form data
  formData.name   = document.getElementById('userName').value || 'Athlete';
  formData.age    = document.getElementById('userAge').value || '16';
  formData.height = document.getElementById('userHeight').value || 'not specified';
  formData.weight = document.getElementById('userWeight').value || 'not specified';
  formData.notes  = document.getElementById('userNotes').value || '';

  // Switch to loading state
  document.getElementById('step3').classList.remove('active');
  document.getElementById('stepIndicator').style.display = 'none';
  document.getElementById('loadingPanel').classList.add('active');

  // Cycle loading messages
  const loadingMessages = [
    'Analyzing your stats...',
    'Mapping your aesthetic goals...',
    'Structuring your split...',
    'Selecting exercises...',
    'Finalizing your 12-week plan...'
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    if (msgIdx < loadingMessages.length) {
      document.getElementById('loadingText').textContent = loadingMessages[msgIdx++];
    }
  }, 480);

  try {
  const response = await fetch('https://physiq-xotj.onrender.com/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: buildPrompt(formData) }]
    })
  });

    const data = await response.json();
    clearInterval(msgInterval);

    const text = data.content?.[0]?.text || 'Program generated. Check back shortly for full details.';

    // Show result panel
    document.getElementById('loadingPanel').classList.remove('active');
    document.getElementById('resultPanel').classList.add('active');
    document.getElementById('resultName').textContent = `${formData.name}'s Personalized Plan`;

    const goalLabels = {
      bulk:      'Mass Building Program',
      cut:       'Lean & Shredded Program',
      aesthetic: 'Aesthetic Physique Program',
      strength:  'Raw Strength Program'
    };
    document.getElementById('resultTitle').textContent =
      goalLabels[formData.goal] || '12-Week Aesthetic Program';

    // Render output sections
    const output = document.getElementById('programOutput');
    output.classList.add('active');

    const sections = text.split('\n\n').filter(s => s.trim());
    output.innerHTML = sections.map(section => {
      const isHeader = section.startsWith('#') || section.match(/^(Week|Phase|Split|Nutrition)/i);
      if (isHeader) {
        const lines  = section.split('\n');
        const header = lines[0].replace(/#+\s*/, '');
        const body   = lines.slice(1).join('\n');
        return `<div class="week-block">
          <div class="week-header">${header}</div>
          ${body ? `<div class="week-content">${body.replace(/\n/g, '<br>')}</div>` : ''}
        </div>`;
      }
      return `<div style="margin-bottom:16px;font-size:14px;line-height:1.85;color:var(--charcoal);font-weight:300;">
        ${section.replace(/\n/g, '<br>')}
      </div>`;
    }).join('');

  } catch (err) {
    clearInterval(msgInterval);
    document.getElementById('loadingPanel').classList.remove('active');
    document.getElementById('resultPanel').classList.add('active');
    document.getElementById('programOutput').classList.add('active');
    document.getElementById('programOutput').innerHTML = `
      <div class="week-block">
        <div class="week-header">Something went wrong</div>
        <div class="week-content">High demand right now — refresh and try again.</div>
      </div>`;
  }
}