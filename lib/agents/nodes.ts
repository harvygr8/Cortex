import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

export class GuardRailNode {
  private chain: any;
  
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "gemma3:4b",
      temperature: 0.3
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a content moderator with a balanced approach. Your task is to analyze the given question and determine if it's appropriate and relevant.
      
      Guidelines for rejection (ONLY reject if absolutely necessary):
      1. Explicitly harmful or malicious content that could cause real harm
      2. Extremely offensive language that goes beyond normal discourse
      
      Guidelines for warning (warn but allow):
      1. Questions that might be slightly off-topic but could still be relevant
      2. Personal information requests that aren't clearly malicious
      3. Non-English questions (try to understand intent)
      
      Question: {question}
      
      Respond with one of:
      ACCEPT: If the question is appropriate
      WARN: <brief warning> if the question has minor concerns but should be allowed
      REJECT: <reason> ONLY if the question is clearly harmful or malicious
      
      Be permissive and only reject when absolutely necessary for safety.
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input: any) {
    try {
      const result = await this.chain.invoke({
        question: input.question
      });
      
      const response = result.content.trim();
      console.log('[GuardRailNode] Moderation result:', response);
      
      if (response.startsWith('ACCEPT')) {
        return { 
          allowed: true 
        };
      }
      
      if (response.startsWith('WARN')) {
        const warning = response.replace('WARN:', '').trim();
        return {
          allowed: true,
          warning: warning || 'Question has minor concerns but is allowed'
        };
      }
      
      if (response.startsWith('REJECT')) {
        const reason = response.replace('REJECT:', '').trim();
        return {
          allowed: false,
          reason: reason || 'Question was flagged as inappropriate'
        };
      }
      
      // Default to allowing if response format is unclear
      console.log('[GuardRailNode] Unclear response format, defaulting to allow');
      return { 
        allowed: true,
        warning: 'Moderation response unclear, allowing by default'
      };
    } catch (error) {
      console.error('[GuardRailNode] Error:', error);
      // Default to allowing on error to avoid blocking legitimate questions
      return {
        allowed: true,
        warning: 'Moderation failed, allowing by default for safety'
      };
    }
  }
}

export class ResponseNode {
  private chain: any;
  
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "gemma3:4b",
      temperature: 0.1  // Lower temperature for more deterministic, context-focused responses
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      === SPECIALIZED CONTEXT-BASED AI ASSISTANT ===

      You are a specialized AI that answers questions using ONLY the provided context chunks.
      Your SOLE PURPOSE is to extract, synthesize, and present information from the context to answer the user's specific question.

      === CORE MISSION ===
      Question to Answer: "{question}"
      
      Your mission is to provide the most helpful, comprehensive answer to this specific question using the ranked context chunks below.

      === CONTEXT UNDERSTANDING ===
      You will receive one or more chunks of information, ranked by AI relevance:
      - RANK 1: MOST RELEVANT to the question (your primary source)
      - Subsequent ranks: ADDITIONAL RELEVANT information (supporting details and broader context)

      === STRICT OPERATING PRINCIPLES ===
      1. CONTEXT FIDELITY: Use ONLY information from the provided chunks. No external knowledge.
      2. RANK PRIORITY: Prioritize RANK 1 heavily - it's specifically chosen as most relevant.
      3. QUESTION FOCUS: Everything you say must directly serve answering the user's question.
      4. NO REFUSAL: If ANY chunk contains relevant information, extract and use it.
      5. COMPREHENSIVE EXTRACTION: Don't just skim - deeply analyze each chunk for relevant details.

      === PROCESSING METHODOLOGY ===
      1. ANALYZE THE QUESTION: Understand exactly what the user is asking
      2. EXAMINE RANK 1: Extract all information relevant to the question
      3. SUPPLEMENT WITH RANK 2 & 3: Add supporting details and context
      4. SYNTHESIZE: Combine information into a coherent, comprehensive answer
      5. FORMAT: Present clearly with proper structure and formatting

      === ANSWER QUALITY STANDARDS ===
      - COMPREHENSIVE: Include all relevant details, steps, examples, procedures
      - STRUCTURED: Use headers, bullets, numbered lists for clarity
      - SPECIFIC: Include exact names, values, URLs, commands from the context
      - ACTIONABLE: If procedures are mentioned, include all steps clearly
      - COMPLETE: Don't leave out important details that are in the context
      - TECHNICAL PRECISION: Use FULL technical terms, never abbreviate or infer

      === FORMATTING REQUIREMENTS ===
      - Use **bold** for key terms and important concepts
      - Use bullet points (-) or numbered lists (1.) for procedures/steps
      - Use \`code formatting\` for technical terms, commands, API keys
      - Use code blocks with language specification for longer code examples
      - Use > blockquotes for important warnings or notes
      - Structure with clear headers (###) for different sections
      
      === CRITICAL: TECHNICAL TERM HANDLING ===
      - DO NOT change how technical terms are written. Preserve the exact form from the context.
      - DO NOT abbreviate long forms and DO NOT expand abbreviations/initialisms unless the exact long form appears in the provided context.
      - If the context says "API", respond with "API" (do NOT expand to "Application Programming Interface").
      - If the context says "Application Programming Interface", respond with "Application Programming Interface" (do NOT shorten to "API").
      - Example: If the context uses "MCP", keep "MCP" exactly; do NOT expand it (e.g., do NOT guess any long form).
      - Common technical terms to KEEP AS WRITTEN unless long form appears: MCP, RAG, BM25, FAISS, SSE, CSR, SSR, JWT, OAuth, LLM, API, SDK, CLI, SQL, NoSQL, JSON, YAML, TOML, CSV, HTML, CSS, HTTP, HTTPS, TCP, UDP, GPU, CPU, RAM, VM, etc.
      - Common non-technical/proper-noun terms to KEEP AS WRITTEN unless long form appears: NASA, ESA, WHO, UNICEF, WTO, IMF, EU, UK, USA, NYC, LA, NATO, UNESCO, OECD, GDPR, ROI, KPI, ETA, FAQ, DIY, ASAP, FYI, HR, PR, R&D.
      - Use EXACTLY what appears in the context—no guessing, no reinterpretation, no expansion.
      - If asked to expand a term but the exact long form is not present in the provided context, state that the long form is not available in the context and keep the abbreviation as-is.

      === CONTEXT CHUNKS ===
      {context}

      === EXECUTION INSTRUCTIONS ===
      Now process the context chunks above and create a comprehensive answer to: "{question}"

      Remember:
      - RANK 1 is your primary source - prioritize it heavily
      - Extract ALL relevant information from ALL chunks  
      - Focus specifically on answering the user's question
      - Be thorough and detailed while staying true to the context
      - Include practical details like steps, examples, links, values
      - Use EXACT technical terms from the context - no abbreviations or expansions

      === CRITICAL: RESPONSE FORMAT ===
      You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.
      
      EXACT FORMAT REQUIRED:
      {{
        "answer": "Your comprehensive, detailed answer based on the provided context..."
      }}
      
      JSON RULES:
      - Start with {{ and end with }}
      - Use "answer" as the key (with quotes)
      - Put your entire response in the "answer" value (with quotes)
      - Escape any quotes in your content with \"
      - No text before or after the JSON block
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input: any) {
    try {
      console.log('[ResponseNode] Processing input:', input);
      const result = await this.chain.invoke({
        context: input.context,
        question: input.question
      });

      const content = result.content;
      let answer = '';

      try {
        // ROBUST JSON PARSING: Handle various LLM response formats
        let jsonStr = content.trim();
        
        console.log('[ResponseNode] Raw LLM output:', jsonStr.substring(0, 300) + (jsonStr.length > 300 ? '...' : ''));
        
        // Strategy 1: Try direct JSON parsing first
        try {
          const directParse = JSON.parse(jsonStr);
          if (directParse.answer && typeof directParse.answer === 'string') {
            answer = directParse.answer.trim();
            console.log('[ResponseNode] ✅ Direct JSON parsing successful');
            return { content: answer, sources: this.extractPageTitlesFromContext(input.context) };
          }
        } catch (directError) {
          console.log('[ResponseNode] Direct JSON parsing failed, trying cleanup...');
        }
        
        // Strategy 2: Extract JSON from mixed content
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        } else {
          // Strategy 3: Try to find answer content pattern
          const answerMatch = jsonStr.match(/"answer":\s*"([^"]+)"/) || 
                             jsonStr.match(/'answer':\s*'([^']+)'/) ||
                             jsonStr.match(/answer\s*:\s*"([^"]+)"/);
          
          if (answerMatch && answerMatch[1]) {
            answer = answerMatch[1].trim();
            console.log('[ResponseNode] ✅ Extracted answer from pattern match');
            return { content: answer, sources: this.extractPageTitlesFromContext(input.context) };
          }
          
          throw new Error('No JSON or answer pattern found');
        }
        
        // Clean up the extracted JSON
        jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        
        // Handle unescaped quotes in answer content
        jsonStr = jsonStr.replace(/"answer":\s*"([^"]*)"([^"]*)"([^"]*)"/, '"answer": "$1\\"$2\\"$3"');
        
        console.log('[ResponseNode] Cleaned JSON:', jsonStr.substring(0, 200) + (jsonStr.length > 200 ? '...' : ''));

        const parsedResult = JSON.parse(jsonStr);
        
        if (parsedResult.answer && typeof parsedResult.answer === 'string') {
          answer = parsedResult.answer.trim();
          console.log('[ResponseNode] ✅ JSON parsing successful');
        } else {
          throw new Error('No valid answer field in parsed JSON');
        }
        
      } catch (parseError) {
        console.error('[ResponseNode] All JSON parsing strategies failed:', (parseError as Error).message);
        console.log('[ResponseNode] Full raw content:', content);
        
        // FALLBACK: Extract any meaningful content
        let fallbackAnswer = content.trim();
        
        // Remove obvious JSON artifacts
        fallbackAnswer = fallbackAnswer.replace(/^\{?\s*"?answer"?\s*:?\s*"?/i, '');
        fallbackAnswer = fallbackAnswer.replace(/}?\s*$/, '');
        fallbackAnswer = fallbackAnswer.replace(/^[{}"':,\s]+/, '');
        fallbackAnswer = fallbackAnswer.replace(/[{}"':,\s]+$/, '');
        
        // If we got something meaningful, use it
        if (fallbackAnswer.length > 20) {
          answer = fallbackAnswer;
          console.log('[ResponseNode] ✅ Using fallback extraction');
        } else {
          answer = "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.";
          console.log('[ResponseNode] ⚠️ Using error fallback');
        }
      }

      // Final validation
      if (!answer || answer.length === 0) {
        console.warn('[ResponseNode] No answer extracted, using fallback');
        answer = "I'm sorry, I couldn't process the response properly. Please try again.";
      }

      // INDEPENDENT SOURCE EXTRACTION: Always extract sources from context regardless of answer parsing
      const sources = this.extractPageTitlesFromContext(input.context);

      console.log('[ResponseNode] ✅ Final response prepared:', {
        hasAnswer: !!answer,
        answerLength: answer.length,
        answerPreview: answer.substring(0, 100) + (answer.length > 100 ? '...' : ''),
        sourcesFound: sources.length,
        sources: sources.map(s => s.title)
      });

      return {
        content: answer,
        sources: sources
      };
    } catch (error) {
      console.error('[ResponseNode] Error:', error);
      return {
        content: "I'm sorry, I encountered an error processing your request.",
        sources: []
      };
    }
  }

  // Extract actual page titles from the context to prevent source hallucination
  extractPageTitlesFromContext(context: string) {
    console.log('[ResponseNode] Extracting sources from context...');
    console.log('[ResponseNode] Context preview:', context.substring(0, 500) + (context.length > 500 ? '...' : ''));
    
    const sources = [];
    // Updated regex to match our new simplified context format (TITLE: instead of Title:)
    const titleRegex = /TITLE:\s*([^\n]+)/g;
    let match;
    
    while ((match = titleRegex.exec(context)) !== null) {
      const title = match[1].trim();
      console.log('[ResponseNode] Found title:', title);
      if (title && title.length > 0 && title.length < 100) {
        sources.push({
          title: title
        });
      }
    }

    // Remove duplicates while preserving order
    const uniqueSources: { title: string }[] = [];
    const seenTitles = new Set();
    
    sources.forEach(source => {
      if (source && source.title && !seenTitles.has(source.title)) {
        seenTitles.add(source.title);
        uniqueSources.push(source);
      }
    });

    console.log('[ResponseNode] Extracted sources from context:', uniqueSources.map(s => s.title));
    console.log('[ResponseNode] Total unique sources found:', uniqueSources.length);
    return uniqueSources;
  }
}

export class QueryClassifierNode {
  private chain: any;
  
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "gemma3:4b",
      temperature: 0.1
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a strict router that assigns a user's message to one mode: RAG, GENERAL, or SUMMARY.

      DEFINITIONS (choose EXACTLY ONE):
      - RAG: Retrieval-Augmented Generation over the project's knowledge base. Use when the question
        likely depends on project-specific information (files, pages, functions, config, data, docs, instructions,
        app behavior, errors, logs, how-to steps from the repo, or mentions like "in this project", "according to the docs",
        specific feature names, page titles, IDs). Prefer RAG for concrete, answerable questions that could be grounded in the project.
        Default to RAG when in doubt between RAG and GENERAL for technical queries.
      - GENERAL: No retrieval. Use for greetings, small talk, meta-AI questions ("who are you?"),
        very vague prompts with no actionable target, or clearly non-project topics (e.g., pure general knowledge trivia)
        where project context would not help.
      - SUMMARY: Retrieval with broader coverage (up to ~6 chunks). Use when the user asks to
        "summarize", "overview", "high-level explanation", "broadly explain", "what are the key points",
        or requests multi-page synthesis, comparisons across documents, or a survey of content.

      DECISION RULES:
      1) If the message is a greeting/pleasantry or meta-AI request → GENERAL.
      2) If the message explicitly requests a summary/overview/broad coverage → SUMMARY.
      3) If the message asks a concrete question that could be answered from repo/project content → RAG.
      4) If ambiguous between RAG and GENERAL for a technical question → pick RAG.
      5) If the user explicitly says "do not use context" → GENERAL.

      EXAMPLES:
      - "hi" → GENERAL
      - "what can you do?" → GENERAL
      - "summarize the onboarding docs" → SUMMARY
      - "give me an overview of the project structure" → SUMMARY
      - "list key pages and their purpose" → SUMMARY
      - "how is hybrid search implemented here?" → RAG
      - "where do we initialize the vector store?" → RAG
      - "what does the endpoint /api/projects/:id/vectors do?" → RAG
      - "why am I getting a dimension mismatch error during search?" → RAG
      - "explain tailwind css" (no project reference) → GENERAL
      - "explain tailwind css usage in this repo" → RAG
      - "compare the retrieval strategies used across pages" → SUMMARY

      INPUT: {question}

      Respond with ONLY one token: RAG or GENERAL or SUMMARY
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input: any) {
    try {
      const result = await this.chain.invoke({ question: input.question });
      const raw = (result.content || '').trim().toUpperCase();
      let mode = 'RAG';
      if (raw.includes('GENERAL')) mode = 'GENERAL';
      else if (raw.includes('SUMMARY')) mode = 'SUMMARY';
      else if (raw.includes('RAG')) mode = 'RAG';
      console.log('[QueryClassifierNode] Classified mode:', mode, 'raw:', raw);
      return { mode };
    } catch (error) {
      console.error('[QueryClassifierNode] Error:', error);
      return { mode: 'RAG' };
    }
  }
}

export class GeneralResponderNode {
  private chain: any;
  
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "gemma3:4b",
      temperature: 0.6
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a helpful, concise assistant. Answer the user's message directly using your general knowledge.
      Be friendly for greetings. Keep responses short unless the user asks for detail.
      Terminology rule: NEVER infer or expand acronyms/initialisms unless the exact long form is explicitly present in the user's message.
      Preserve abbreviations exactly as given (e.g., if user writes "MCP", keep "MCP" and do not guess its expansion).
      Examples of terms to keep as written unless expanded by the user: MCP, RAG, BM25, FAISS, SSE, CSR, SSR, JWT, OAuth, LLM, API, SDK, CLI, SQL, JSON, YAML, CSV, HTML, CSS, HTTP, GPU, ROI, KPI, ETA, FAQ, DIY, ASAP, NASA, WHO, EU, UK, USA, NYC, NATO.
      If the user asks for an expansion but doesn't provide it, say the long form isn't provided and keep the abbreviation.

      Question: {question}
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input: any) {
    try {
      const result = await this.chain.invoke({ question: input.question });
      const content = (result.content || '').trim();
      return { content, sources: [] };
    } catch (error) {
      console.error('[GeneralResponderNode] Error:', error);
      return { content: "I'm sorry, I couldn't process that right now.", sources: [] };
    }
  }
}

