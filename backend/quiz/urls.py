from django.urls import path
from .views import (
    GenerateQuestionsView,
    SubmitAnswerView,
    CompleteSessionView,
    LeaderboardView,
    HealthCheckView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("quiz/generate/", GenerateQuestionsView.as_view(), name="generate"),
    path("quiz/answer/", SubmitAnswerView.as_view(), name="answer"),
    path("quiz/complete/", CompleteSessionView.as_view(), name="complete"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
