from fastapi import APIRouter
from app.analytics.war_room import WarRoomEngine

router = APIRouter()

@router.get("/compare")
def compare_strategies():
    """Returns the Plan A vs Plan B vs Plan C comparison with Risk-Adjusted Values."""
    return WarRoomEngine.compare_strategies()
