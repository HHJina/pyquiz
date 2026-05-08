from django.contrib import admin
from .models import Question, QuizSession, QuizAnswer, LeaderboardEntry


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["id", "category", "difficulty", "source", "question_text_short", "created_at"]
    list_filter = ["category", "difficulty", "source"]
    search_fields = ["question_text"]
    ordering = ["-created_at"]

    def question_text_short(self, obj):
        return obj.question_text[:60]
    question_text_short.short_description = "질문"


@admin.register(QuizSession)
class QuizSessionAdmin(admin.ModelAdmin):
    list_display = ["session_key", "category", "difficulty", "mode", "score", "max_score", "completed", "created_at"]
    list_filter = ["category", "difficulty", "mode", "completed"]
    ordering = ["-created_at"]


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "result", "score_earned", "answered_at"]
    list_filter = ["result"]
    ordering = ["-answered_at"]


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ["nickname", "category", "difficulty", "score", "max_score", "percentage", "created_at"]
    list_filter = ["category", "difficulty"]
    ordering = ["-percentage", "-score"]
