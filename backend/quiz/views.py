import uuid
import random
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Question, QuizSession, QuizAnswer, LeaderboardEntry
from .serializers import QuestionSerializer, QuizSessionSerializer, LeaderboardEntrySerializer
from .ai_service import generate_questions, evaluate_answer

POINTS_MAP = {"easy": 10, "medium": 20, "hard": 30}


def _keyword_evaluate(answer_key: str, user_answer: str) -> dict:
    import re
    keywords = [k.strip() for k in answer_key.split("|||") if k.strip()]
    if not keywords:
        return {"result": "incorrect", "score_ratio": 0.0, "feedback": "채점 기준이 없습니다.", "model_answer": answer_key}

    answer_lower = user_answer.lower()

    def _keyword_hit(keyword: str) -> bool:
        if keyword.lower() in answer_lower:
            return True
        tokens = [t for t in re.split(r"[\s,.()+\-/|:]+", keyword.lower()) if len(t) >= 2]
        if not tokens:
            return False
        hits = sum(1 for t in tokens if t in answer_lower)
        return hits / len(tokens) >= 0.5

    matched = [k for k in keywords if _keyword_hit(k)]
    missed = [k for k in keywords if not _keyword_hit(k)]
    ratio = len(matched) / len(keywords)

    if ratio >= 0.7:
        result = "correct"
    elif ratio >= 0.35:
        result = "partial"
    else:
        result = "incorrect"

    feedback_parts = []
    if matched:
        feedback_parts.append(f"언급한 핵심 포인트: {', '.join(matched)}")
    if missed:
        feedback_parts.append(f"보완할 포인트: {', '.join(missed)}")
    feedback_parts.append("(AI 평가 서비스 일시 불가 — 키워드 기반 채점)")

    return {
        "result": result,
        "score_ratio": round(ratio, 2),
        "feedback": " | ".join(feedback_parts),
        "model_answer": " | ".join(keywords),
    }


class GenerateQuestionsView(APIView):
    """POST /api/quiz/generate/ — Gemini로 문제 생성 후 DB 저장, 세션 반환"""

    def post(self, request):
        category = request.data.get("category", "basics")
        difficulty = request.data.get("difficulty", "easy")
        count = int(request.data.get("count", 5))

        if count not in [5, 10, 15]:
            return Response({"error": "count must be 5, 10, or 15"}, status=400)

        try:
            raw_questions = generate_questions(category, difficulty, count)
        except Exception as e:
            return Response({"error": f"AI 문제 생성 실패: {str(e)}"}, status=500)

        questions = []
        for q in raw_questions:
            obj = Question.objects.create(
                category=category,
                difficulty=difficulty,
                question_text=q["question_text"],
                hint=q.get("hint", ""),
                answer_key=q.get("answer_key", ""),
                code_snippet=q.get("code_snippet") or None,
                source="ai",
            )
            questions.append(obj)

        session = QuizSession.objects.create(
            session_key=str(uuid.uuid4()),
            category=category,
            difficulty=difficulty,
            total_questions=len(questions),
            max_score=len(questions) * POINTS_MAP.get(difficulty, 10),
        )

        return Response({
            "session_key": session.session_key,
            "questions": QuestionSerializer(questions, many=True).data,
            "max_score": session.max_score,
        }, status=201)


class SubmitAnswerView(APIView):
    """POST /api/quiz/answer/ — 답변 제출 → Gemini 평가"""

    def post(self, request):
        session_key = request.data.get("session_key")
        question_id = request.data.get("question_id")
        user_answer = request.data.get("user_answer", "").strip()

        if not all([session_key, question_id, user_answer]):
            return Response({"error": "session_key, question_id, user_answer 필요"}, status=400)

        try:
            session = QuizSession.objects.get(session_key=session_key)
            question = Question.objects.get(id=question_id)
        except (QuizSession.DoesNotExist, Question.DoesNotExist):
            return Response({"error": "세션 또는 문제를 찾을 수 없습니다"}, status=404)

        if session.completed:
            return Response({"error": "이미 완료된 세션입니다"}, status=400)

        try:
            evaluation = evaluate_answer(
                question_text=question.question_text,
                answer_key=question.answer_key,
                user_answer=user_answer,
                difficulty=session.difficulty,
            )
        except Exception:
            evaluation = _keyword_evaluate(question.answer_key, user_answer)

        points = POINTS_MAP.get(session.difficulty, 10)
        score_ratio = float(evaluation.get("score_ratio", 0))
        score_earned = round(points * score_ratio)

        answer = QuizAnswer.objects.create(
            session=session,
            question=question,
            user_answer=user_answer,
            result=evaluation.get("result", "incorrect"),
            score_earned=score_earned,
            ai_feedback=evaluation.get("feedback", ""),
        )

        session.score += score_earned
        session.save()

        return Response({
            "result": answer.result,
            "score_earned": score_earned,
            "feedback": evaluation.get("feedback", ""),
            "model_answer": evaluation.get("model_answer", ""),
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

        questions = list(
            Question.objects.filter(category=category, difficulty=difficulty, source="preset")
        )

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

        return Response({
            "session_key": session.session_key,
            "questions": QuestionSerializer(selected, many=True).data,
            "max_score": session.max_score,
        }, status=201)


class DBQuestionCountView(APIView):
    """GET /api/quiz/db-count/?category=&difficulty= — DB 문제 수 조회"""

    def get(self, request):
        category = request.query_params.get("category")
        difficulty = request.query_params.get("difficulty")

        qs = Question.objects.filter(source="preset")
        if category:
            qs = qs.filter(category=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        return Response({"count": qs.count(), "category": category, "difficulty": difficulty})


class HealthCheckView(APIView):
    """GET /api/health/ — 서버 상태 확인"""

    def get(self, request):
        return Response({"status": "ok", "message": "PyQuiz API is running"})
