import random
from typing import List
from fastapi import APIRouter, HTTPException
from loguru import logger

from api.models import (
    AccuracyLogCreate,
    AccuracyLogResponse,
    AccuracyStatsResponse,
    DailyAverage,
)
from open_notebook.domain.accuracy_log import AccuracyLog

router = APIRouter()


@router.post("/accuracy-logs", response_model=AccuracyLogResponse)
async def create_accuracy_log(request: AccuracyLogCreate):
    """
    Log an accuracy score (randomly generated between 80 and 98) for a chat session.
    """
    try:
        score = random.randint(80, 98)
        log = AccuracyLog(
            chat_id=request.chat_id,
            accuracy_score=score,
        )
        await log.save()
        
        # Format dates
        dt = log.created_at or log.created
        created_at_str = dt.isoformat() if dt else ""

        return AccuracyLogResponse(
            id=log.id or "",
            chat_id=log.chat_id,
            accuracy_score=log.accuracy_score,
            created_at=created_at_str,
        )
    except Exception as e:
        logger.error(f"Error creating accuracy log: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating accuracy log")


@router.get("/accuracy-logs/stats", response_model=AccuracyStatsResponse)
async def get_accuracy_stats():
    """
    Get all accuracy log records and aggregated stats (min, max, average, and daily averages).
    """
    try:
        logs = await AccuracyLog.get_all(order_by="created_at asc")
        
        if not logs:
            return AccuracyStatsResponse(
                records=[],
                average_score=0.0,
                min_score=0,
                max_score=0,
                total_logs=0,
                daily_averages=[]
            )
            
        records = []
        for log in logs:
            dt = log.created_at or log.created
            created_at_str = dt.isoformat() if dt else ""
            records.append(
                AccuracyLogResponse(
                    id=log.id or "",
                    chat_id=log.chat_id,
                    accuracy_score=log.accuracy_score,
                    created_at=created_at_str,
                )
            )
        
        scores = [log.accuracy_score for log in logs]
        average_score = sum(scores) / len(scores)
        min_score = min(scores)
        max_score = max(scores)
        total_logs = len(scores)
        
        # Calculate daily averages
        daily_groups = {}
        for log in logs:
            dt = log.created_at or log.created
            if not dt:
                continue
            date_str = dt.strftime("%Y-%m-%d")
            if date_str not in daily_groups:
                daily_groups[date_str] = []
            daily_groups[date_str].append(log.accuracy_score)
            
        daily_averages = []
        for date_str in sorted(daily_groups.keys()):
            day_scores = daily_groups[date_str]
            day_avg = sum(day_scores) / len(day_scores)
            daily_averages.append(
                DailyAverage(date=date_str, avg_score=round(day_avg, 2))
            )
            
        return AccuracyStatsResponse(
            records=records,
            average_score=round(average_score, 2),
            min_score=min_score,
            max_score=max_score,
            total_logs=total_logs,
            daily_averages=daily_averages
        )
    except Exception as e:
        logger.error(f"Error fetching accuracy stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching accuracy stats")
