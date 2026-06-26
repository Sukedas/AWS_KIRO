---
inclusion: manual
---

# Flash Card Generator Skill

## Description

Creates educational AWS flash cards with structured learning content. Defines the prompt templates, JSON schemas, and validation rules used by the `Card_Generator` module.

## Output Schema

Every generated flash card MUST conform to this structure:

```json
{
  "question": "string (required) — the question shown on the card front",
  "answer": "string (required) — the concise answer shown on card back",
  "explanation": "string (required) — detailed explanation with context",
  "difficulty": "easy | medium | hard (required)",
  "aws_category": "string (required) — one of the 8 defined categories",
  "aws_service": "string — specific AWS service name (e.g. 'Amazon S3')",
  "real_world_scenario": "string — a practical use-case framing the question",
  "documentation_links": ["string"] — official AWS docs URLs"
}
```

## Prompt Template

```
[SYSTEM]
You are an AWS educational content creator. You ONLY generate content about
Amazon Web Services and cloud computing. Respond only with valid JSON.

[TASK]
Generate {count} AWS flash cards for the topic "{topic_name}" in the
"{category}" category at "{difficulty}" difficulty level.

The user's learning level is "{learning_level}":
- beginner: focus on definitions, basic concepts, simple analogies
- intermediate: include comparisons, trade-offs, configuration options
- advanced: include architecture decisions, edge cases, cost/performance optimization

[OUTPUT FORMAT]
Return a JSON object with this exact structure:
{
  "cards": [ { ...card schema... } ]
}
No additional text, no markdown code fences — pure JSON only.
```

## Validation Rules

After parsing the AI response, validate each card:

1. Required fields present: `question`, `answer`, `explanation`, `difficulty`, `aws_category`
2. `difficulty` is one of: `easy`, `medium`, `hard`
3. `aws_category` is one of: `Fundamentals`, `Compute`, `Storage`, `Databases`, `Networking`, `Security`, `Serverless`, `AI Services`
4. `documentation_links` entries match URL format: `https://docs.aws.amazon.com/...`
5. `question` length: 10–500 characters
6. `answer` length: 10–1000 characters
7. `explanation` length: 20–2000 characters

If a card fails validation, discard that card and log the failure. Do not surface invalid cards to the user.

## Round-Trip Guarantee

Parsing → serializing → parsing a generated flash card MUST produce an equivalent object. Use `JSON.parse(JSON.stringify(card))` to verify before saving.

## Batch Limits

- Minimum: 1 card per request
- Maximum: 20 cards per request
- Default: 5 cards if not specified

## ai_generated Flag

Always set `ai_generated: true` on all cards created by this generator. This triggers the visual AI badge in the UI.
