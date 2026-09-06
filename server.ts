import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Message, ChatSession, SyllabusChunk, QueryLog, SupplementalMaterial } from './src/types';
import { syllabusChunks } from './src/syllabusData';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  console.log(`[Gemini Client Init Check] GEMINI_API_KEY is ${key ? `PRESENT (length: ${key.length})` : 'MISSING'}`);
  
  if (!aiClient) {
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please check your AI Studio Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Wrapper to handle high-demand 503 errors with retries and fallback models
async function generateContentWithRetry(
  client: GoogleGenAI,
  query: string,
  systemInstruction: string
): Promise<string> {
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    let attempts = 2; // Try each model up to 2 times
    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`Attempting generation with model ${model} (attempt ${i + 1}/${attempts})...`);
        const response = await client.models.generateContent({
          model: model,
          contents: query,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          console.log(`Successfully generated content using model ${model}`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed on attempt ${i + 1}: ${err.message || err}`);
        // If it's a 503/UNAVAILABLE or 429/RESOURCE_EXHAUSTED, wait a bit before retrying
        const status = err.status !== undefined ? String(err.status) : '';
        const isTransient = status.includes('UNAVAILABLE') || status.includes('503') || status.includes('429') || err.message?.includes('503') || err.message?.includes('demand');
        if (isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        } else {
          // If it is another kind of error (e.g. invalid key), don't waste time retrying this model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All models failed to generate content.');
}

// In-Memory Database for state persistence (Session based / Mock DB)
let activeSyllabus: SyllabusChunk[] = [...syllabusChunks];
let queryLogs: QueryLog[] = [
  {
    id: 'log-1',
    query: 'I don\'t understand Nonneman\'s multi-level analysis. Can you explain?',
    answer: 'Great starting point — that question is at the heart of how this course works. Nonneman looks simultaneously at three levels: inside the country (domestic politics), the region (alliances and rivalries), and globally (great powers and international norms). Which of these levels feels least clear right now?',
    category: 'Content - Framework',
    flagged: false,
    unresolved: false,
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hrs ago
  },
  {
    id: 'log-2',
    query: 'Can you write my peer feedback response for the Tunisia presentation? Just 200 words.',
    answer: 'I cannot write the feedback for you — that is graded work that needs to reflect your own thinking, and submitting text I generated would put you in violation of UW\'s academic integrity policy (Regulation 2-114). What I can do is help you figure out what to say. What did you notice about the presentation?',
    category: 'Academic Integrity Risk',
    flagged: true,
    unresolved: true,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hrs ago
  },
  {
    id: 'log-3',
    query: 'When is the peer feedback due for the Block 2 presentation?',
    answer: 'According to the syllabus, the Block 2 presentation is on Monday, October 12. Peer feedback is due by the first class session following that presentation day, which is Wednesday, October 14. It should be around 200 words and submitted through WyoCourses.',
    category: 'Logistics',
    flagged: false,
    unresolved: false,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hrs ago
  },
  {
    id: 'log-4',
    query: 'I feel completely overwhelmed with this course and my exams. I feel like falling apart.',
    answer: 'That sounds genuinely hard, and I\'m glad you said something. Being overwhelmed is more common than you might think. Let\'s make this manageable: which assignment feels most urgent right now? Also, please remember that the UW Counseling Center is a real resource at 307-766-2187.',
    category: 'Wellbeing',
    flagged: true,
    unresolved: true,
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hr ago
  },
  {
    id: 'log-5',
    query: 'Tell me about the history of the Ottoman Empire.',
    answer: 'That\'s outside what I\'m set up to help with — I\'m specifically built around the materials for this Arab Spring course. If the Ottoman context comes up because you want background on the region before the Arab Spring, I can help with that. Is that what you are working on?',
    category: 'Out of Scope',
    flagged: false,
    unresolved: false,
    timestamp: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
  }
];

let supplementalMaterials: SupplementalMaterial[] = [
  {
    id: 'supp-1',
    title: 'Dr. Raddaoui\'s Guide to Peer Feedback Format',
    content: 'When writing peer feedback, ensure you address: (1) One analytical strength of the presentation, (2) One area where evidence could be stronger based on the assigned articles, (3) A productive question that pushes the discussion further. Keep it close to 200 words.',
    addedBy: 'Dr. Ali H. Raddaoui',
    dateAdded: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
  }
];

// Combine regular syllabus with supplemental materials for search
function getSearchableKnowledgeBase(): { id: string; title: string; content: string; category: string; tags: string[] }[] {
  const base = activeSyllabus.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
    category: s.category,
    tags: s.tags
  }));

  const supp = supplementalMaterials.map(m => ({
    id: m.id,
    title: m.title,
    content: m.content,
    category: 'Supplemental',
    tags: ['supplemental', 'extra', 'instructor-notes']
  }));

  return [...base, ...supp];
}

// ---------------- RAG Pipeline Local Retrieval ----------------
function retrieveContext(query: string): string {
  const kb = getSearchableKnowledgeBase();
  const queryWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  
  if (queryWords.length === 0) {
    return kb.slice(0, 3).map(chunk => `[Source: ${chunk.title}] ${chunk.content}`).join('\n\n');
  }

  // Count keyword intersections and title weight
  const matches = kb.map(chunk => {
    let score = 0;
    const textToSearch = (chunk.title + ' ' + chunk.content + ' ' + chunk.tags.join(' ')).toLowerCase();
    
    queryWords.forEach(word => {
      // Direct matches
      if (textToSearch.includes(word)) {
        score += 1;
        // Extra weight for word matching the title
        if (chunk.title.toLowerCase().includes(word)) {
          score += 2;
        }
      }
    });

    return { chunk, score };
  });

  // Sort by score descending and filter out zero scores unless query matches poorly
  const sortedMatches = matches.sort((a, b) => b.score - a.score);
  const relevantMatches = sortedMatches.filter(m => m.score > 0).slice(0, 5);

  // Fallback to top general chunks if nothing matches
  if (relevantMatches.length === 0) {
    return kb.slice(0, 3).map(chunk => `[Source: ${chunk.title}] ${chunk.content}`).join('\n\n');
  }

  return relevantMatches.map(m => `[Source: ${m.chunk.title}] ${m.chunk.content}`).join('\n\n');
}

// ---------------- Query Classifier ----------------
function classifyQueryLocal(query: string): 'Content - Framework' | 'Content - Case Study' | 'Logistics' | 'Wellbeing' | 'Out of Scope' | 'Academic Integrity Risk' {
  const lower = query.toLowerCase();

  // Academic Integrity risks
  if (
    lower.includes('write my') || 
    lower.includes('write an essay') || 
    lower.includes('write my essay') || 
    lower.includes('generate a draft') || 
    lower.includes('write feedback') || 
    lower.includes('do my homework') ||
    lower.includes('write a paragraph') ||
    lower.includes('create a presentation for me')
  ) {
    return 'Academic Integrity Risk';
  }

  // Wellbeing
  if (
    lower.includes('stressed') || 
    lower.includes('overwhelmed') || 
    lower.includes('falling apart') || 
    lower.includes('crying') || 
    lower.includes('depressed') || 
    lower.includes('anxious') || 
    lower.includes('mental health') ||
    lower.includes('can\'t handle')
  ) {
    return 'Wellbeing';
  }

  // Out of scope
  if (
    lower.includes('ottoman') || 
    lower.includes('history paper') || 
    lower.includes('math') || 
    lower.includes('programming') || 
    lower.includes('recipe') || 
    lower.includes('javascript') ||
    lower.includes('buy a car') ||
    lower.includes('weather in')
  ) {
    // Only out of scope if it isn't related to Arab Spring
    if (!lower.includes('spring') && !lower.includes('tunisia') && !lower.includes('egypt') && !lower.includes('syria') && !lower.includes('yemen')) {
      return 'Out of Scope';
    }
  }

  // Logistics
  if (
    lower.includes('deadline') || 
    lower.includes('due') || 
    lower.includes('syllabus') || 
    lower.includes('office hours') || 
    lower.includes('grade') || 
    lower.includes('points') || 
    lower.includes('absence') || 
    lower.includes('attendance') ||
    lower.includes('email') ||
    lower.includes('submit') ||
    lower.includes('rubric')
  ) {
    return 'Logistics';
  }

  // Content - Framework
  if (
    lower.includes('nonneman') || 
    lower.includes('framework') || 
    lower.includes('analytical framework') || 
    lower.includes('multi-level') || 
    lower.includes('multi-causal') || 
    lower.includes('hinnebusch') || 
    lower.includes('ehteshami') || 
    lower.includes('comparative method')
  ) {
    return 'Content - Framework';
  }

  // Default to case studies or general content Q&A
  return 'Content - Case Study';
}

// ---------------- API ENDPOINTS ----------------

// 1. Get syllabus chunks & supplemental materials
app.get('/api/syllabus', (req, res) => {
  res.json({
    syllabus: activeSyllabus,
    supplemental: supplementalMaterials
  });
});

// 2. Chat with Digit-Al-i (Student)
app.post('/api/chat', async (req, res) => {
  try {
    const { query, history = [] } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    // A. Classify query
    const category = classifyQueryLocal(query);

    // B. Retrieve relative chunks (RAG context)
    const context = retrieveContext(query);

    // C. Verbatim teaching bot system prompt from Design Document
    const systemInstruction = `You are a teaching assistant for POLS 4710 / INST 4990, "The Arab Spring and Its Aftermaths," a university course at the University of Wyoming. Your role is to help students understand course content, navigate course logistics, and grow as learners — not to do their work for them.

YOUR IDENTITY
You are warm, patient, intellectually curious, and never condescending. You notice what students are doing well before you address what needs work. You adapt your language to the student's apparent level — simpler and more concrete when they are struggling, more nuanced and analytical when they are confident. You have a gentle sense of humor when the moment calls for it. You are never dismissive, never tired, and never annoyed. Your tone model is: a caring professor who genuinely loves this material, loves teaching it, and always sees the best in students.

WHAT YOU KNOW
You answer only from the provided context materials, which are retrieved from the course syllabus, assigned readings list, academic policies, and supplemental notes. You do not introduce outside sources, readings, or factual claims not grounded in these materials. If a question requires information you do not have in your knowledge base, say so clearly and suggest how the student might find the answer (e.g., "That's outside what I have access to — your best source for that would be [office / resource / syllabus section].").

WHAT YOU DO
1. Answer content questions about the Arab Spring — explaining theories, actors, timelines, and debates drawn from the assigned readings. Offer multiple perspectives. Never advocate for a political position.
2. Explain course logistics — assignments, rubrics, deadlines, policies — as written in the syllabus. If something is ambiguous, say so and encourage the student to email the instructor.
3. Support student well-being — normalize confusion, celebrate effort, encourage persistence. If a student expresses distress beyond academic frustration, gently point them toward the university's Counseling Center (307-766-2187).
4. Use good pedagogical practice — ask Socratic follow-up questions, scaffold explanations, check for understanding, and prompt students to think before you tell them the answer.

WHAT YOU DO NOT DO
You do not write essays, presentations, or peer feedback responses for students. You do not provide complete outlines that amount to a draft. You do not help students misrepresent AI-generated text as their own work. If asked, you explain that doing so would be a violation of UW Regulation 2-114 on academic dishonesty and would undermine the student's own learning. You do not share personal opinions on contested political questions. You do not speculate about course content or policies beyond what the materials say.

BRIGHT-SPOT HABIT
Before offering any correction or pushback, identify something specific and genuine that the student said or did well. Build from there. This is not flattery — it is good teaching.

TRANSPARENCY
If you are uncertain, say so. Offer your best understanding, flag it as such, and invite the student to verify with the instructor. Never fabricate a citation, a date, a name, or a policy.

---
RETRIEVED COURSE MATERIALS CONTEXT:
${context}

---
STUDENT'S PREVIOUS CONVERSATION HISTORY:
${history.map((m: any) => `${m.sender === 'student' ? 'Student' : 'Digit-Al-i'}: ${m.text}`).join('\n')}
`;

    let generatedText = '';
    let flagged = false;
    let unresolved = false;

    // Academic Integrity guardrail route
    if (category === 'Academic Integrity Risk') {
      generatedText = `I cannot write that feedback or draft that assignment for you — that is graded work that needs to represent your own authentic thinking and writing. Submitting text generated by AI would put you in violation of University of Wyoming Regulation 2-114 (Academic Dishonesty) and would undermine your own learning in this course.\n\nHowever, I would be absolutely delighted to help you organize your thoughts! What was one interesting point, debate, or case study from the readings that stood out to you? We can work together to turn that spark into a robust argument of your own!`;
      flagged = true;
      unresolved = true;
    } 
    // Wellbeing route
    else if (category === 'Wellbeing' && (query.toLowerCase().includes('falling apart') || query.toLowerCase().includes('depressed') || query.toLowerCase().includes('anxious'))) {
      generatedText = `I hear you, and I am so glad you reached out. Feeling completely overwhelmed, especially during intense parts of the semester, is very common, and it doesn't mean you're failing—it means you are carrying a great deal of weight right now.\n\nLet's take a deep breath together. We can work together to make your coursework feel more manageable. Which assignment or concept is creating the most pressure for you right now? We can break it down step by step.\n\nAlso, please remember that you don't have to carry this alone. The University of Wyoming has a dedicated Counseling Center with caring professionals who are ready to support you. You can reach them at 307-766-2187, or email uccstaff@uwyo.edu. They are located in 341 Knight Hall. Would you like me to help you map out a small study plan for this week?`;
      flagged = true;
      unresolved = true;
    }
    // General GenAI call
    else {
      try {
        const client = getGeminiClient();
        generatedText = await generateContentWithRetry(client, query, systemInstruction);
        
        // Flag as unresolved if the bot expresses uncertainty or redirects to the instructor
        const botUncertain = generatedText.toLowerCase().includes('i am not sure') || 
                             generatedText.toLowerCase().includes('i don\'t know') || 
                             generatedText.toLowerCase().includes('verify with the instructor') ||
                             generatedText.toLowerCase().includes('email dr.') ||
                             generatedText.toLowerCase().includes('email the instructor');
        
        if (botUncertain) {
          unresolved = true;
          flagged = true;
        }

      } catch (sdkError: any) {
        console.error('Gemini SDK Error:', sdkError);
        const errorMsg = sdkError?.message || sdkError?.toString() || 'Unknown connection error';
        // Fallback friendly pedagogical answer if Gemini is offline or API Key is missing
        generatedText = `I am currently operating in offline study mode as my connection to the AI server is being configured. \n\n*(Technical Details: ${errorMsg})*\n\nBased on our Course Syllabus:\n- Dr. Raddaoui's office hours are Mondays & Wednesdays 15:00-15:50 (MST).\n- We have 4 main cases: Tunisia, Egypt, Syria, and Yemen.\n\nPlease verify this query with Dr. Ali H. Raddaoui (araddaou@uwyo.edu). Let me know how else I can help guide your study path!`;
        unresolved = true;
        flagged = true;
      }
    }

    // Log the interaction
    const logItem: QueryLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      query,
      answer: generatedText,
      category,
      flagged,
      unresolved,
      timestamp: new Date().toISOString()
    };
    queryLogs.unshift(logItem); // Add to the front

    res.json({
      reply: generatedText,
      category,
      flagged,
      unresolved
    });

  } catch (err: any) {
    console.error('Server error during chat:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

// 3. Get query logs & analytics (Instructor Dashboard)
app.get('/api/instructor/logs', (req, res) => {
  res.json({
    logs: queryLogs,
    metrics: {
      totalQueries: queryLogs.length,
      flaggedCount: queryLogs.filter(l => l.flagged).length,
      unresolvedCount: queryLogs.filter(l => l.unresolved).length,
      categories: {
        'Content - Framework': queryLogs.filter(l => l.category === 'Content - Framework').length,
        'Content - Case Study': queryLogs.filter(l => l.category === 'Content - Case Study').length,
        'Logistics': queryLogs.filter(l => l.category === 'Logistics').length,
        'Wellbeing': queryLogs.filter(l => l.category === 'Wellbeing').length,
        'Out of Scope': queryLogs.filter(l => l.category === 'Out of Scope').length,
        'Academic Integrity Risk': queryLogs.filter(l => l.category === 'Academic Integrity Risk').length,
      }
    }
  });
});

// 4. Update logs (e.g. resolve a ticket or clear logs)
app.post('/api/instructor/logs/resolve', (req, res) => {
  const { id } = req.body;
  queryLogs = queryLogs.map(log => {
    if (log.id === id) {
      return { ...log, unresolved: false, flagged: false };
    }
    return log;
  });
  res.json({ success: true, logs: queryLogs });
});

// 5. Add supplemental material (Instructor)
app.post('/api/instructor/supplemental', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const newItem: SupplementalMaterial = {
    id: 'supp-' + Math.random().toString(36).substr(2, 9),
    title,
    content,
    addedBy: 'Dr. Ali H. Raddaoui (via Instructor Portal)',
    dateAdded: new Date().toISOString()
  };

  supplementalMaterials.unshift(newItem);
  res.json({ success: true, supplemental: supplementalMaterials });
});

// 6. Delete supplemental material
app.delete('/api/instructor/supplemental/:id', (req, res) => {
  const { id } = req.params;
  supplementalMaterials = supplementalMaterials.filter(m => m.id !== id);
  res.json({ success: true, supplemental: supplementalMaterials });
});


// 7. AI Classroom Teaching Agent Sandbox (Simulation)
app.post('/api/instructor/simulation', async (req, res) => {
  try {
    const { action, topic, rubric, articleText, lessonPlan, socraticQuestion, studentResponses, transcript } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required.' });
    }

    const client = getGeminiClient();
    const systemInstruction = `You are an advanced AI Co-Instructor and Course Designer collaborating with Dr. Ali H. Raddaoui for the University of Wyoming course POLS 4710 / INST 4990 "The Arab Spring and Its Aftermaths."
Your job is to act as a full AI Teacher Agent capable of designing lesson plans, asking Socratic questions, managing virtual classrooms, structuring teamwork, and grading student work against strict rubrics.
Your tone is professional, scholarly, supportive, and active. Reference Gerd Nonneman's multi-level framework (domestic, regional, global) and relevant literature where possible. Ensure your formatting is clean and uses bullet points.`;

    let prompt = '';
    
    if (action === 'generate_lesson') {
      prompt = `Design a comprehensive and highly interactive lesson plan.
Topic of discussion: "${topic || 'General Case Study'}"
Applicable Course Rubric criteria to incorporate:
"${rubric || 'Critical thinking, evidence from readings, analytical logic.'}"
Article Reference / Readings details:
"${articleText || 'Use standard course bibliography readings on Tunisia, Egypt, Syria, or Yemen.'}"

Please output the lesson plan structured as follows:
1. LESSON OBJECTIVES (Aligned with the course goals)
2. PRE-READING CONTEXT (Brief historical background or framework context)
3. DISCUSSION PATHWAY (4-5 chronological stages of discussion)
4. EXPLICIT SOCRATIC CHALLENGE QUESTIONS (To test students on domestic, regional, or global layers)
5. PROPOSED COLLABORATIVE TEAMWORK CHALLENGE (How to group students and what artifact they should create)
6. EVALUATION RUBRIC GUIDE (How to assess their participation and critical reasoning in this lesson)`;
    } 
    else if (action === 'ask_socratic') {
      prompt = `Formulate a highly engaging, sharp, and direct Socratic classroom prompt for the students.
Active Topic: "${topic || 'General Case Study'}"
Associated Rubric: "${rubric || 'Critical Analysis'}"
Current Lesson Plan Context:
"${lessonPlan || 'Socratic debate on Arab Spring transitions.'}"

Current Classroom Transcript so far:
"${transcript || 'No transcripts yet. Introduce the question.'}"

Generate the AI Teacher's spoken address to the class. It should be written in first person ("I want us to think about...", "Class, let's explore..."), call out a challenge to the virtual room, and probe specifically into Gerd Nonneman's analytical levels. Make it sound like an actual professor speaking. Keep it under 250 words so it is perfect for voice readout.`;
    } 
    else if (action === 'simulate_students') {
      prompt = `Simulate 3 diverse student responses to the following Socratic question asked in class.
Topic: "${topic || 'General'}"
Socratic Question: "${socraticQuestion || 'Analyze the domestic vs. external dynamics of the uprising.'}"

Please output 3 separate student comments clearly:
Student 1: "Laila" (Excellent, sophisticated response. Synthesizes Nonneman's regional and domestic levels beautifully, citing specific actors like the military or labor unions).
Student 2: "Mateo" (Average, well-meaning response. Understands the basic story of the uprising, but neglects structural layers and falls into generalities about "freedom" or "democracy" without applying the framework).
Student 3: "Sarah" (Struggling response / showing a major misconception. Blames everything purely on a single global actor or conflates two case studies, e.g., confusing Egypt's transition with Syria's civil war, needing core pedagogical redirection).

Format each student's response clearly with "Student Name: [Persona Name]" followed by their comment.`;
    } 
    else if (action === 'evaluate_responses') {
      prompt = `Evaluate the following simulated or custom student responses against the specified course rubric.
Active Question: "${socraticQuestion || 'Analyze the cases.'}"
Syllabus / Grading Rubric Criteria:
"${rubric || 'Application of Nonneman\'s 3 levels, use of evidence, analytical rigor'}"

Student Responses to evaluate:
"${studentResponses || 'No student answers provided yet.'}"

Provide a detailed, professional AI Teacher Evaluation:
1. GRADE AND CRITIQUE FOR EACH STUDENT (Assign a score or tier, highlight exactly what they did well - the "Bright-Spot", and what they missed based on the rubric).
2. TEACHER PEDAGOGICAL INTERVENTION (Specify exactly how you, as the AI instructor, would reply to each student to steer them. For the excellent student, how to push further; for the average, how to scaffold; for the struggling, how to gently redirect).
3. KEY TAKEAWAYS FOR DR. ALI (A summary assessment of the class's current grasp of the concepts and what focus area needs reinforcement in the next session).`;
    } 
    else if (action === 'initiate_team') {
      prompt = `As the AI Teacher Agent, initiate a collaborative teamwork breakout activity for the class.
Topic: "${topic || 'General'}"
Lesson Context: "${lessonPlan || 'Developing analytical papers.'}"
Rubric Aligned Goal: "${rubric || 'Comparative analysis'}"

Generate:
1. THE BREAKOUT CHALLENGE: A specific prompt dividing the class into two teams: Team A (focusing on domestic structural constraints like the military) and Team B (focusing on agency-based forces like civil society or political parties).
2. STEP-BY-STEP INSTRUCTIONS: 3 clear steps for what the teams must debate and produce in their 15-minute huddle.
3. THE VIRTUAL TEAM SYNTHESIS: A short mock synthesis of what Team A and Team B came up with, displaying collaborative critical thinking that Dr. Ali can review as a model artifact.`;
    }
    else {
      return res.status(400).json({ error: 'Unsupported action type.' });
    }

    const resultText = await generateContentWithRetry(client, prompt, systemInstruction);
    res.json({ success: true, result: resultText });

  } catch (err: any) {
    console.error('Server error during simulation API:', err);
    res.status(500).json({ error: err.message || 'Error occurred in AI Simulation.' });
  }
});


// ---------------- Serve App Assets ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Digit-Al-i Full Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
