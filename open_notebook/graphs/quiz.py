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


QUIZ_SYSTEM_PROMPT = """You are a Quiz Generation Assistant. Your task is to generate a JSON quiz based on the source content.

STRICT RULES:
1. You MUST generate EXACTLY {num_questions} questions. 
2. Count them one by one: 1, 2, 3, 4, ..., {num_questions}.
3. The difficulty must be {difficulty}.
4. Each question must have exactly 4 options (A, B, C, D).
5. Return ONLY a single JSON object. No other text.

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
    // ... continue until you reach question {num_questions}
  ]
}}"""


async def generate_quiz(state: dict) -> dict:
    source: Source = state["source"]
    num_questions: int = state.get("num_questions", 5)
    difficulty: str = state.get("difficulty", "medium")

    system_prompt = QUIZ_SYSTEM_PROMPT.format(
        num_questions=num_questions,
        difficulty=difficulty,
    )

    # Prioritize dense summary to save context space for the model
    insights = await source.get_insights()
    summary = next(
        (i.content for i in insights if i.insight_type == "dense_summary"), None
    )
    content = summary or source.full_text or ""

    # Truncate content if it's still too large for 0.5b models
    if len(content) > 12000:
        content = content[:12000] + "... [truncated]"

    payload = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Source content to quiz on:\n\n{content}"),
    ]

    # Explicitly set temperature to 0 for more stable JSON
    chain = await provision_langchain_model(
        str(payload),
        None,
        "transformation",
        max_tokens=2048,
        temperature=0,
    )

    response = await chain.ainvoke(payload)

    # Extract text content from response
    response_text = (
        response.content
        if isinstance(response.content, str)
        else str(response.content)
    )

    # Strip markdown JSON fences if present
    response_text = response_text.strip()
    response_text = re.sub(r"^```json\s*", "", response_text)
    response_text = re.sub(r"^```\s*", "", response_text)
    response_text = re.sub(r"\s*```$", "", response_text)
    response_text = response_text.strip()

    def repair_json(s):
        """Simple bracket counter to fix truncated JSON."""
        open_brackets = s.count('{')
        close_brackets = s.count('}')
        if open_brackets > close_brackets:
            s += '}' * (open_brackets - close_brackets)
        
        open_sq = s.count('[')
        close_sq = s.count(']')
        if open_sq > close_sq:
            # Need to close objects inside the array first? 
            # Simple approach: just add ]
            s += ']' * (open_sq - close_sq)
            # Re-check main brackets
            open_brackets = s.count('{')
            close_brackets = s.count('}')
            if open_brackets > close_brackets:
                s += '}' * (open_brackets - close_brackets)
        return s

    try:
        try:
            quiz_data = json.loads(response_text)
        except json.JSONDecodeError:
            logger.info("Attempting to repair truncated JSON...")
            repaired = repair_json(response_text)
            quiz_data = json.loads(repaired)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON response: {e}")
        logger.error(f"Raw response: {response_text[:500]}")
        raise ValueError(
            f"AI returned invalid JSON for quiz generation. "
            f"Parse error: {str(e)}"
        )

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
