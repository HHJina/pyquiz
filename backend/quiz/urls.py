from django.urls import path
from .views import (
    StartQuizFromDBView,
    DBQuestionCountView,
    SubmitAnswerView,
    CompleteSessionView,
    LeaderboardView,
    HealthCheckView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("quiz/start/", StartQuizFromDBView.as_view(), name="start"),
    path("quiz/db-count/", DBQuestionCountView.as_view(), name="db-count"),
    path("quiz/answer/", SubmitAnswerView.as_view(), name="answer"),
    path("quiz/complete/", CompleteSessionView.as_view(), name="complete"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
