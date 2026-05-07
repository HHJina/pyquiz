from rest_framework import serializers
from .models import Question, QuizSession, QuizAnswer, LeaderboardEntry


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "category", "difficulty", "question_text", "hint", "code_snippet"]


class QuizAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question_text", read_only=True)

    class Meta:
        model = QuizAnswer
        fields = ["id", "question_text", "user_answer", "result", "score_earned", "ai_feedback", "answered_at"]


class QuizSessionSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizSession
        fields = ["id", "session_key", "category", "difficulty", "total_questions",
                  "score", "max_score", "completed", "created_at", "completed_at", "answers"]


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaderboardEntry
        fields = ["id", "nickname", "category", "difficulty", "score", "max_score", "percentage", "created_at"]
