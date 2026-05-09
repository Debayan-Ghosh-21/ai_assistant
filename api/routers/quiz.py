from typing import List

from fastapi import APIRouter, HTTPException
from loguru import logger

from api.models import (
    GenerateQuizRequest,
    QuizResponse,
    QuizResultResponse,
    SubmitAnswersRequest,
)
from open_notebook.domain.notebook import Source
from open_notebook.domain.quiz import Quiz
from open_notebook.graphs.quiz import quiz_graph

router = APIRouter()


def _quiz_to_response(quiz: Quiz, source_id: str) -> QuizResponse:
    return QuizResponse(
        id=quiz.id or "",
        source_id=source_id,
        title=quiz.title,
        questions=quiz.questions,
        created=str(quiz.created),
        updated=str(quiz.updated),
    )


@router.post("/quiz/generate", response_model=QuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    """Generate a quiz from a source using AI."""
    try:
        source = await Source.get(request.source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching source {request.source_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Source not found")

    try:
        await quiz_graph.ainvoke(
            {
                "source": source,
                "num_questions": request.num_questions,
                "difficulty": request.difficulty,
            }
        )

        # Fetch the most recently created quiz for this source
        quizzes = await Quiz.get_for_source(request.source_id)
        if not quizzes:
            raise HTTPException(
                status_code=500, detail="Quiz was generated but could not be retrieved"
            )

        quiz = quizzes[0]
        return _quiz_to_response(quiz, request.source_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz for source {request.source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating quiz")


@router.get("/quiz/source/{source_id}", response_model=List[QuizResponse])
async def list_quizzes_for_source(source_id: str):
    """List all quizzes for a source."""
    try:
        quizzes = await Quiz.get_for_source(source_id)
        return [_quiz_to_response(quiz, source_id) for quiz in quizzes]
    except Exception as e:
        logger.error(f"Error listing quizzes for source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error listing quizzes")


@router.get("/quiz/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: str):
    """Get a specific quiz by ID."""
    try:
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        source = await quiz.get_source()
        return _quiz_to_response(quiz, source.id or "")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz {quiz_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Quiz not found")


@router.post("/quiz/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz_answers(quiz_id: str, request: SubmitAnswersRequest):
    """Submit answers for a quiz and get results. Pure comparison, no AI call."""
    try:
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz {quiz_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Quiz not found")

    try:
        results = []
        score = 0
        total = len(quiz.questions)

        for idx, question in enumerate(quiz.questions):
            user_answer = request.answers.get(idx, "")
            correct_answer = question.get("answer", "")
            is_correct = user_answer.strip().upper() == correct_answer.strip().upper()

            if is_correct:
                score += 1

            results.append(
                {
                    "question": question.get("question", ""),
                    "your_answer": user_answer,
                    "correct_answer": correct_answer,
                    "is_correct": is_correct,
                    "explanation": question.get("explanation", ""),
                }
            )

        percentage = round((score / total * 100) if total > 0 else 0.0, 1)

        return QuizResultResponse(
            score=score,
            total=total,
            percentage=percentage,
            results=results,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answers for quiz {quiz_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error submitting quiz answers")


@router.delete("/quiz/{quiz_id}")
async def delete_quiz(quiz_id: str):
    """Delete a specific quiz."""
    try:
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        await quiz.delete()

        return {"message": "Quiz deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quiz {quiz_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting quiz")
