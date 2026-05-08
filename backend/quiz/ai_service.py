import json
from google import genai
from django.conf import settings


def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


CATEGORY_NAMES = {
    "basics": "Python 기초 (자료형, 함수, 예외처리, 내장함수)",
    "oop": "객체지향 프로그래밍 (클래스, 상속, 캡슐화, 다형성, 매직메서드)",
    "algorithms": "자료구조/알고리즘 (리스트, 딕셔너리, 정렬, 탐색, 시간복잡도)",
    "advanced": "고급 Python (데코레이터, 제너레이터, 컨텍스트 매니저, 메타클래스, asyncio)",
    "practical": "실무/면접 (GIL, 메모리 관리, 성능 최적화, 실제 코딩 문제)",
    "mixed": "Python 전반 (랜덤하게 다양한 주제)",
}

DIFFICULTY_NAMES = {
    "easy": "입문 (Python 처음 배우는 분 대상, 기본 개념 위주)",
    "medium": "중급 (1~2년 경험자 대상, 응용과 원리 이해)",
    "hard": "고급 (3년+ 경험자 또는 심화 면접 대상, 깊은 이해 필요)",
}


def generate_questions(category: str, difficulty: str, count: int) -> list[dict]:
    client = get_gemini_client()
    cat_desc = CATEGORY_NAMES.get(category, category)
    diff_desc = DIFFICULTY_NAMES.get(difficulty, difficulty)

    prompt = f"""당신은 Python 기술 면접 전문가입니다.
카테고리: {cat_desc}
난이도: {diff_desc}
문제 수: {count}개

다음 JSON 배열 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:
[
  {{
    "question_text": "질문 내용 (한국어, 면접에서 실제 나올 법한 명확한 질문)",
    "hint": "힌트 (핵심 키워드나 방향만, 1~2문장)",
    "answer_key": "핵심 포인트1|||핵심 포인트2|||핵심 포인트3",
    "code_snippet": "관련 코드가 있으면 Python 코드, 없으면 빈 문자열"
  }}
]

규칙:
- 실제 Python 기술 면접에서 나오는 질문 스타일
- answer_key는 |||로 구분된 3~5개 핵심 채점 포인트
- code_snippet은 질문에 코드 분석/설명이 필요한 경우만 포함
- 모든 내용은 한국어로"""

    response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


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

    response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
