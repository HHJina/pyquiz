import uuid
import random
import hashlib
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Question, QuizSession, QuizAnswer, LeaderboardEntry
from .serializers import QuizSessionSerializer, LeaderboardEntrySerializer

POINTS_MAP = {"easy": 10, "medium": 20, "hard": 30}


def _answer_text(answer_key: str) -> str:
    return " | ".join(k.strip() for k in answer_key.split("|||") if k.strip())


def _generate_choices(question: Question, difficulty: str, session_key: str) -> tuple[list[str], int]:
    """Return (5 shuffled choices, correct_index) deterministically from session+question."""
    correct_text = _answer_text(question.answer_key)

    distractor_keys = list(
        Question.objects.filter(difficulty=difficulty, source="preset")
        .exclude(id=question.id)
        .values_list("answer_key", flat=True)
    )

    seed = int(hashlib.md5(f"{session_key}{question.id}".encode()).hexdigest(), 16) % (2 ** 32)
    rng = random.Random(seed)

    sampled = rng.sample(distractor_keys, min(4, len(distractor_keys)))
    distractors = [_answer_text(d) for d in sampled]
    while len(distractors) < 4:
        distractors.append("해당 없음")

    choices = [correct_text] + distractors
    indices = list(range(5))
    rng.shuffle(indices)
    shuffled = [choices[i] for i in indices]
    correct_index = indices.index(0)

    return shuffled, correct_index


class SubmitAnswerView(APIView):
    """POST /api/quiz/answer/ — 객관식 답변 제출"""

    def post(self, request):
        session_key = request.data.get("session_key")
        question_id = request.data.get("question_id")
        selected_index = request.data.get("selected_index")

        if session_key is None or question_id is None or selected_index is None:
            return Response({"error": "session_key, question_id, selected_index 필요"}, status=400)

        try:
            session = QuizSession.objects.get(session_key=session_key)
            question = Question.objects.get(id=question_id)
        except (QuizSession.DoesNotExist, Question.DoesNotExist):
            return Response({"error": "세션 또는 문제를 찾을 수 없습니다"}, status=404)

        if session.completed:
            return Response({"error": "이미 완료된 세션입니다"}, status=400)

        _, correct_index = _generate_choices(question, session.difficulty, session_key)
        is_correct = int(selected_index) == correct_index

        result = "correct" if is_correct else "incorrect"
        points = POINTS_MAP.get(session.difficulty, 10)
        score_earned = points if is_correct else 0
        correct_text = _answer_text(question.answer_key)
        feedback = "정답입니다! 정확히 알고 계셨네요." if is_correct else f"오답입니다. 정답을 확인하고 개념을 다시 복습해보세요."

        answer = QuizAnswer.objects.create(
            session=session,
            question=question,
            user_answer=str(selected_index),
            result=result,
            score_earned=score_earned,
            ai_feedback=feedback,
        )

        session.score += score_earned
        session.save()

        return Response({
            "result": answer.result,
            "score_earned": score_earned,
            "feedback": feedback,
            "model_answer": correct_text,
            "session_score": session.score,
        })


class CompleteSessionView(APIView):
    """POST /api/quiz/complete/ — 퀴즈 완료 처리"""

    def post(self, request):
        session_key = request.data.get("session_key")
        nickname = request.data.get("nickname", "").strip()

        try:
            session = QuizSession.objects.get(session_key=session_key)
        except QuizSession.DoesNotExist:
            return Response({"error": "세션을 찾을 수 없습니다"}, status=404)

        session.completed = True
        session.completed_at = timezone.now()
        session.save()

        if nickname:
            percentage = (session.score / session.max_score * 100) if session.max_score > 0 else 0
            LeaderboardEntry.objects.create(
                nickname=nickname,
                category=session.category,
                difficulty=session.difficulty,
                score=session.score,
                max_score=session.max_score,
                percentage=round(percentage, 1),
            )

        return Response(QuizSessionSerializer(session).data)


class LeaderboardView(APIView):
    """GET /api/leaderboard/?category=&difficulty= — 리더보드 조회"""

    def get(self, request):
        queryset = LeaderboardEntry.objects.all()
        category = request.query_params.get("category")
        difficulty = request.query_params.get("difficulty")

        if category:
            queryset = queryset.filter(category=category)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        entries = queryset[:20]
        return Response(LeaderboardEntrySerializer(entries, many=True).data)


class StartQuizFromDBView(APIView):
    """POST /api/quiz/start/ — DB에 저장된 preset 문제로 퀴즈 시작"""

    def post(self, request):
        category = request.data.get("category", "basics")
        difficulty = request.data.get("difficulty", "easy")
        count = int(request.data.get("count", 5))

        if count not in [5, 10, 15]:
            return Response({"error": "count must be 5, 10, or 15"}, status=400)

        qs = Question.objects.filter(difficulty=difficulty, source="preset")
        if category != "mixed":
            qs = qs.filter(category=category)

        questions = list(qs)

        if len(questions) < count:
            return Response(
                {
                    "error": f"DB에 문제가 부족합니다. "
                             f"(카테고리: {category}, 난이도: {difficulty}, 현재: {len(questions)}개 / 필요: {count}개)"
                },
                status=400,
            )

        selected = random.sample(questions, count)

        session = QuizSession.objects.create(
            session_key=str(uuid.uuid4()),
            category=category,
            difficulty=difficulty,
            total_questions=count,
            max_score=count * POINTS_MAP.get(difficulty, 10),
            mode="db",
        )

        questions_data = []
        for q in selected:
            choices, correct_index = _generate_choices(q, difficulty, session.session_key)
            questions_data.append({
                "id": q.id,
                "category": q.category,
                "difficulty": q.difficulty,
                "question_text": q.question_text,
                "hint": q.hint,
                "code_snippet": q.code_snippet,
                "choices": choices,
                "correct_index": correct_index,
            })

        return Response({
            "session_key": session.session_key,
            "questions": questions_data,
            "max_score": session.max_score,
        }, status=201)


class DBQuestionCountView(APIView):
    """GET /api/quiz/db-count/?category=&difficulty= — DB 문제 수 조회"""

    def get(self, request):
        category = request.query_params.get("category")
        difficulty = request.query_params.get("difficulty")

        qs = Question.objects.filter(source="preset")
        if category and category != "mixed":
            qs = qs.filter(category=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        return Response({"count": qs.count(), "category": category, "difficulty": difficulty})


class HealthCheckView(APIView):
    """GET /api/health/ — 서버 상태 확인"""

    def get(self, request):
        return Response({"status": "ok", "message": "PyQuiz API is running"})
