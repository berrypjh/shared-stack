---
paths:
  - 'docs/records/**'
---

# 개발 기록 (`docs/records`)

날짜별 개발 기록. 설계 결정 · 문제 해결 · 구현을 한 건에 하나씩 남기고, devhub "기록" 화면이 `apps/devhub/src/data/records.ts` 등록을 읽어 보인다. 문체는 `_generated/docs-ko.md`를 따른다.

## 규칙

- **기록은 "언제 · 무엇을 · 왜"만 쓴다.** "지금 무엇이 맞는지"는 `AGENTS.md` · `.claude/rules` · README 같은 설계 문서가 말한다
- **파일은 `docs/records/<YYYY-MM-DD>-<id>.md`, 첫 줄은 `# 제목` 하나다.** 새 기록은 `apps/devhub/src/data/records.ts`에 함께 등록한다 — 빠지면 devhub `catalog.spec.ts`의 문서 전수 확인이 실패한다
- **절은 `상황`(문제 해결이면 `증상`) · `판단`(또는 `원인`)이 필수이고, `반영` · `검증` · `참고자료`는 쓸 것이 있을 때만 둔다.** `catalog.spec.ts`가 파일 이름 · 날짜 · 절 제목 · 인용한 문서 · 테스트를 대조한다
- **그림은 `docs/records/images/<이름>.svg`(실제 화면 캡처는 `.png`), 다크 판은 옆에 `<이름>.dark.<확장자>` 로 둔다.** 본문에는 한 줄을 혼자 차지한 `![설명](images/<이름>.svg)` 로 넣는다. 설명은 캡션으로도 보인다
- **확인한 것만 쓴다.** 이유를 모르는 변경은 기록하지 않는다
- **기록은 고쳐 쓰지 않는다.** 판단이 뒤집히면 새 기록을 쓰고 이전 기록에서 새 기록으로 링크한다 — 당시 판단의 근거를 남기기 위해서다

## 검증

```bash
pnpm nx test @berrypjh/devhub   # catalog.spec.ts — 등록 · 절 제목 · 링크 대조
```
