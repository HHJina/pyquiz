from django.urls import path
from .views import (
    GenerateQuestionsView,
    StartQuizFromDBView,
    DBQuestionCountView,
    SubmitAnswerView,
    CompleteSessionView,
    LeaderboardView,
    HealthCheckView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("quiz/generate/", GenerateQuestionsView.as_view(), name="generate"),   # AI 생성
    path("quiz/start/", StartQuizFromDBView.as_view(), name="start"),            # DB 문제
    path("quiz/db-count/", DBQuestionCountView.as_view(), name="db-count"),      # DB 문제 수 조회
    path("quiz/answer/", SubmitAnswerView.as_view(), name="answer"),
    path("quiz/complete/", CompleteSessionView.as_view(), name="complete"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
