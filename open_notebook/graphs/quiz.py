import json
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from loguru import logger
from typing_extensions import TypedDict

from open_notebook.ai.provision import provision_langchain_model
from open_notebook.domain.notebook import Source
from open_notebook.domain.quiz import Quiz


class QuizState(TypedDict):
    source: Source
    num_questions: int
    difficulty: str
    output: dict


QUIZ_SYSTEM_PROMPT = """You are a Quiz Generation Assistant. Your task is to generate a structured JSON quiz based on the provided source content.

STRICT RULES:
1. You MUST generate EXACTLY {num_questions} questions. 
2. The difficulty must be {difficulty}.
3. Each question MUST have exactly 4 options (A, B, C, D).
4. The "options" field MUST be a list of 4 strings.
5. Return ONLY a single JSON object. No other text, no markdown fences.

JSON FORMAT:
{{
  "title": "Quiz Title",
  "questions": [
    {{
      "id": 1,
      "question": "Question 1 text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "answer": "A",
      "explanation": "Brief reasoning"
    }},
    {{
      "id": 2,
      "question": "Question 2 text?",
      "options": ["A. Opt 1", "B. Opt 2", "C. Opt 3", "D. Opt 4"],
      "answer": "B",
      "explanation": "Brief reasoning"
    }}
  ]
}}"""


def repair_json(s: str) -> str:
    """Robustly fix truncated or poorly formatted JSON using a stack to close in correct order."""
    s = s.strip()
    
    # Remove any trailing junk after the last potential closer
    last_closer = max(s.rfind('}'), s.rfind(']'))
    if last_closer != -1 and last_closer < len(s) - 1:
        # Check if we are potentially truncated after a closer
        pass 

    stack = []
    is_in_string = False
    is_escaped = False
    
    for char in s:
        if is_escaped:
            is_escaped = False
            continue
        if char == '\\':
            is_escaped = True
            continue
        if char == '"':
            is_in_string = not is_in_string
            continue
        
        if not is_in_string:
            if char == '{':
                stack.append('}')
            elif char == '[':
                stack.append(']')
            elif char == '}':
                if stack and stack[-1] == '}':
                    stack.pop()
            elif char == ']':
                if stack and stack[-1] == ']':
                    stack.pop()
    
    if is_in_string:
        s += '"'
    
    while stack:
        s += stack.pop()
        
    return s


def validate_and_repair_quiz_data(data: dict, expected_questions: int) -> dict:
    """Ensure the quiz data matches the expected structure and fix common model errors."""
    if not isinstance(data, dict):
        return {"title": "Quiz", "questions": []}

    title = data.get("title", "Quiz")
    questions = data.get("questions", [])
    if not isinstance(questions, list):
        questions = []

    validated_questions = []
    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            continue
            
        question_text = q.get("question") or q.get("text") or f"Question {i+1}"
        options = q.get("options", [])
        
        # If options is a string (common small model error), try to split it
        if isinstance(options, str):
            # Try splitting by newlines or letters
            split_options = re.split(r'\n|[A-D]\.', options)
            options = [opt.strip() for opt in split_options if opt.strip()]
        
        if not isinstance(options, list):
            options = []
            
        # Ensure exactly 4 options
        if len(options) < 4:
            logger.warning(f"Question {i+1} has only {len(options)} options. Padding.")
            letters = ["A", "B", "C", "D"]
            while len(options) < 4:
                letter = letters[len(options)]
                options.append(f"{letter}. [Option placeholder]")
        elif len(options) > 4:
            options = options[:4]
            
        answer = str(q.get("answer", "A")).strip().upper()
        if not answer or answer not in ["A", "B", "C", "D"]:
            # Try to extract from text if it says "Answer: A"
            match = re.search(r'Answer:\s*([A-D])', str(q), re.I)
            answer = match.group(1).upper() if match else "A"
            
        validated_questions.append({
            "id": i + 1,
            "question": question_text,
            "options": options,
            "answer": answer,
            "explanation": q.get("explanation", "No explanation provided.")
        })

    # If we have too many or too few, we keep what we have but log it
    if len(validated_questions) != expected_questions:
        logger.warning(f"Generated {len(validated_questions)} questions instead of {expected_questions}")

    return {
        "title": title,
        "questions": validated_questions
    }


async def generate_quiz(state: dict) -> dict:
    source: Source = state["source"]
    num_questions: int = state.get("num_questions", 5)
    difficulty: str = state.get("difficulty", "medium")

    system_prompt = QUIZ_SYSTEM_PROMPT.format(
        num_questions=num_questions,
        difficulty=difficulty,
    )

    insights = await source.get_insights()
    summary = next(
        (i.content for i in insights if i.insight_type == "dense_summary"), None
    )
    content = summary or source.full_text or ""

    if len(content) > 12000:
        content = content[:12000] + "... [truncated]"

    payload = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Source content to quiz on:\n\n{content}"),
    ]

    chain = await provision_langchain_model(
        str(payload),
        None,
        "transformation",
        max_tokens=2048,
        temperature=0,
    )

    response = await chain.ainvoke(payload)

    response_text = (
        response.content
        if isinstance(response.content, str)
        else str(response.content)
    )

    response_text = response_text.strip()
    response_text = re.sub(r"^```json\s*", "", response_text)
    response_text = re.sub(r"^```\s*", "", response_text)
    response_text = re.sub(r"\s*```$", "", response_text)
    response_text = response_text.strip()

    try:
        try:
            quiz_data = json.loads(response_text)
        except json.JSONDecodeError:
            logger.info("Attempting to repair JSON...")
            repaired = repair_json(response_text)
            quiz_data = json.loads(repaired)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON. Raw: {response_text[:500]}")
        raise ValueError(f"AI returned invalid JSON: {str(e)}")

    # Validate and repair the structure
    quiz_data = validate_and_repair_quiz_data(quiz_data, num_questions)

    quiz = Quiz(
        source=str(source.id),
        title=quiz_data.get("title", "Quiz"),
        questions=quiz_data.get("questions", []),
    )
    await quiz.save()

    return {"output": quiz_data}


agent_state = StateGraph(QuizState)
agent_state.add_node("generate_quiz", generate_quiz)
agent_state.add_edge(START, "generate_quiz")
agent_state.add_edge("generate_quiz", END)
quiz_graph = agent_state.compile()

