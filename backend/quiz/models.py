from django.db import models


CATEGORY_CHOICES = [
    ("basics", "Python 기초"),
    ("oop", "객체지향 프로그래밍"),
    ("algorithms", "자료구조/알고리즘"),
    ("advanced", "고급 Python"),
    ("practical", "실무/면접"),
    ("docker", "Docker"),
    ("git", "Git"),
    ("mixed", "Python 전반"),
]

SOURCE_CHOICES = [
    ("ai", "AI 생성"),
    ("preset", "사전 등록"),
]

MODE_CHOICES = [
    ("ai", "AI 생성"),
    ("db", "DB 문제"),
]

DIFFICULTY_CHOICES = [
    ("easy", "입문"),
    ("medium", "중급"),
    ("hard", "고급"),
]


class Question(models.Model):
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    question_text = models.TextField()
    hint = models.TextField()
    answer_key = models.TextField(help_text="Comma-separated key points for evaluation")
    code_snippet = models.TextField(blank=True, null=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default="ai")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}/{self.difficulty}] {self.question_text[:60]}"


class QuizSession(models.Model):
    session_key = models.CharField(max_length=64, unique=True)
    category = models.CharField(max_length=20)
    difficulty = models.CharField(max_length=10)
    total_questions = models.IntegerField(default=5)
    score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default="ai")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.session_key[:8]} - {self.category} ({self.score}/{self.max_score})"


class QuizAnswer(models.Model):
    RESULT_CHOICES = [
        ("correct", "정답"),
        ("partial", "부분 정답"),
        ("incorrect", "오답"),
    ]

    session = models.ForeignKey(QuizSession, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_answer = models.TextField()
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    score_earned = models.IntegerField(default=0)
    ai_feedback = models.TextField()
    answered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.session.session_key[:8]} - Q{self.question.id} - {self.result}"


class LeaderboardEntry(models.Model):
    nickname = models.CharField(max_length=30)
    category = models.CharField(max_length=20)
    difficulty = models.CharField(max_length=10)
    score = models.IntegerField()
    max_score = models.IntegerField()
    percentage = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-percentage", "-score", "-created_at"]

    def __str__(self):
        return f"{self.nickname} - {self.score}/{self.max_score} ({self.percentage:.0f}%)"
