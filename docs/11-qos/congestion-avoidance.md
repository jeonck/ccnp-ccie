---
sidebar_position: 6
title: 혼잡 회피
---

# 혼잡 회피 (Congestion Avoidance)

## 정의

큐가 가득 찬 후 전체 드롭(Tail Drop)이 발생하기 **전에** 선제적으로 일부 패킷을 확률적으로 드롭하여 TCP 혼잡 제어를 조기에 유도함으로써 전체 네트워크 처리량을 최대화하는 QoS 기법이다.

## 특징

- **(TCP 전역 동기화 방지)** Tail Drop은 다수의 TCP 세션이 동시에 윈도우를 줄이는 Global Synchronization을 유발하지만, WRED는 세션별로 다른 시점에 드롭하여 동기화 방지
- **(DSCP 기반 차등 드롭)** WRED는 트래픽 클래스별로 min/max 임계값을 달리 설정하여 중요 트래픽(EF/AF4x)은 드롭을 최소화하고 낮은 우선순위 트래픽을 선별 드롭
- **(ECN 협력 혼잡 알림)** ECN은 패킷을 드롭하는 대신 IP 헤더 비트로 혼잡을 알려 TCP 엔드포인트가 자발적으로 속도를 낮추도록 유도하여 드롭 없는 혼잡 제어 실현

## 왜 필요한가?

Tail Drop은 큐가 가득 찼을 때 이후 모든 패킷을 버리므로 TCP 세션 다수가 동시에 혼잡을 감지하고 윈도우를 일제히 축소한다. 그 결과 링크가 순간적으로 비어버리고 다시 채워지는 사이클이 반복되는 **TCP 글로벌 동기화**로 링크 효율이 50% 이하로 떨어진다.

---

## WRED 임계값 동작

```mermaid
flowchart LR
    Q0["큐 점유율 0%"]
    MIN["min-threshold<br/>드롭 확률 증가 시작"]
    MAX["max-threshold<br/>최대 드롭 확률"]
    FULL["큐 Full<br/>모든 패킷 드롭<br/>(Tail Drop)"]

    Q0 -->|"전송"| MIN
    MIN -->|"확률적 드롭 시작<br/>(0 → max-prob)"| MAX
    MAX -->|"최대 드롭 확률 유지"| FULL

    style Q0 fill:#16A34A,stroke:#15803D,color:#fff
    style MIN fill:#EA580C,stroke:#C2410C,color:#fff
    style MAX fill:#DC2626,stroke:#B91C1C,color:#fff
    style FULL fill:#DC2626,stroke:#B91C1C,color:#fff
```

| 구간 | 동작 |
|------|------|
| 0 ~ min-threshold | 드롭 없음, 전량 전송 |
| min ~ max-threshold | 드롭 확률 선형 증가 (0 → 1/mark-prob-denominator) |
| max-threshold 초과 | 고정 최대 드롭 확률 |
| 큐 Full (Tail Drop) | 모든 패킷 드롭 |

---

## DSCP별 WRED 임계값 예시

| DSCP 클래스 | min-threshold | max-threshold | mark-prob |
|------------|--------------|--------------|-----------|
| EF (46) | 40 | 60 | 1/10 |
| AF41 (34) | 35 | 55 | 1/10 |
| AF31 (26) | 30 | 50 | 1/10 |
| AF21 (18) | 25 | 45 | 1/10 |
| BE (0) | 20 | 40 | 1/10 |

---

## 설정 및 검증

```bash
! DSCP 기반 WRED (CBWFQ 클래스 내)
R(config)# policy-map WAN-OUT
R(config-pmap)#  class BULK-DATA
R(config-pmap-c)#   bandwidth percent 20
R(config-pmap-c)#   random-detect dscp-based     ! DSCP 기반 WRED 활성화

! 임계값 수동 조정 (선택)
R(config-pmap-c)#   random-detect dscp 26 30 50 10  ! AF31: min 30, max 50, 1/10

! ECN 활성화 (WRED와 함께)
R(config-pmap)#  class VOIP
R(config-pmap-c)#   priority 512
R(config-pmap)#  class class-default
R(config-pmap-c)#   random-detect ecn            ! ECN 마킹 활성화

! IP Precedence 기반 WRED (레거시)
R(config-pmap)#  class class-default
R(config-pmap-c)#   random-detect precedence-based

! 검증
R# show policy-map interface Serial0/0
R# show queue Serial0/0
R# show random-detect interface Serial0/0
```

---

## CCNP/CCIE 시험 포인트

- **TCP 글로벌 동기화**: Tail Drop → 다수 TCP 동시 윈도우 축소 → 링크 낭비
- WRED는 **TCP 트래픽에 효과적** — UDP는 윈도우 조절 없으므로 드롭해도 속도 불변
- `random-detect dscp-based` 와 `random-detect precedence-based` 동시 사용 불가
- ECN 동작에는 **양쪽 엔드포인트의 TCP ECN 지원** 필요 (RFC 3168)
- ECN 마킹 비트: IP 헤더 ToS의 마지막 2비트 (ECT + CE 비트)
- WRED는 **Priority 큐(LLQ)에서는 설정 불가** — Priority 큐는 드롭이 없어야 함
- mark-prob-denominator: 기본 10 → 1/10(10%) 드롭 확률
