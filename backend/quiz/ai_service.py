import json
from google import genai
from django.conf import settings


def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


DIFFICULTY_NAMES = {
    "easy": "입문 (Python 처음 배우는 분 대상, 기본 개념 위주)",
    "medium": "중급 (1~2년 경험자 대상, 응용과 원리 이해)",
    "hard": "고급 (3년+ 경험자 또는 심화 면접 대상, 깊은 이해 필요)",
}


def evaluate_answer(question_text: str, answer_key: str, user_answer: str, difficulty: str) -> dict:
    client = get_gemini_client()
    diff_desc = DIFFICULTY_NAMES.get(difficulty, difficulty)

    prompt = f"""당신은 Python 기술 면접 평가관입니다. 아래 답변을 평가하세요.

난이도: {diff_desc}
질문: {question_text}
채점 기준 포인트: {answer_key}
지원자 답변: {user_answer}

다음 JSON 형식으로만 응답하세요:
{{
  "result": "correct" | "partial" | "incorrect",
  "score_ratio": 0.0~1.0,
  "feedback": "피드백 내용 (한국어, 구체적으로 잘한 점/부족한 점/보완할 내용 설명, 3~5문장)",
  "model_answer": "모범 답변 핵심 정리 (한국어, 3~5줄)"
}}

평가 기준:
- correct (1.0): 핵심 포인트 80% 이상 커버, 정확한 이해
- partial (0.5): 핵심 포인트 40~79% 커버, 부분적 이해
- incorrect (0.0): 핵심 포인트 40% 미만 또는 틀린 내용
- 답변이 너무 짧거나 "모르겠다"는 incorrect 처리"""

    response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
