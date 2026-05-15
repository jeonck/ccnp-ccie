---
sidebar_position: 2
title: 스패닝 트리 프로토콜
---

# 스패닝 트리 프로토콜
**Spanning Tree Protocol (STP / RSTP / MSTP)**

## 정의

스위치 네트워크에서 **물리적 루프**를 감지하고 특정 포트를 논리적으로 차단함으로써 루프 없는 **트리(Tree) 구조**를 형성하는 IEEE 802.1D 기반 프로토콜. RSTP(802.1w)와 MSTP(802.1s)는 그 확장 표준이다.

## 특징

- **(루프 방지)** BPDU 교환으로 중복 경로를 감지하고 해당 포트를 Blocking 상태로 전환하여 브로드캐스트 스톰 차단
- **(자동 대체 경로 활성화)** 링크 장애 시 Blocking 포트가 자동으로 Forwarding으로 전환되어 네트워크 복구 (STP 최대 50초, RSTP 수 초)
- **(Root Bridge 중심 트리 구조)** Bridge ID가 가장 낮은 스위치를 Root로 선출하고 모든 스위치가 Root 방향으로 단일 경로를 유지

## 왜 필요한가? — 루프의 재앙

스위치를 두 대 이상 연결하면 **물리적 루프**가 생길 수 있다. 루프가 발생하면 브로드캐스트 프레임이 네트워크를 영구히 순환하면서 **브로드캐스트 스톰(Broadcast Storm)** 을 일으켜 네트워크를 완전히 마비시킨다.

```mermaid
flowchart LR
    subgraph LOOP["루프 발생 시나리오"]
        SW1["스위치 1"] -->|"링크 1"| SW2["스위치 2"]
        SW2 -->|"링크 2"| SW3["스위치 3"]
        SW3 -->|"링크 3 — 루프!"| SW1
    end

    BC["브로드캐스트<br/>프레임"] -->|"루프를 따라 무한 순환"| SW1

    style SW1 fill:#EA580C,stroke:#C2410C,color:#fff
    style SW2 fill:#EA580C,stroke:#C2410C,color:#fff
    style SW3 fill:#EA580C,stroke:#C2410C,color:#fff
    style BC fill:#FEF2F2,stroke:#DC2626,color:#DC2626
```

STP는 특정 포트를 논리적으로 **차단(Blocking)** 해서 루프 없는 트리 구조를 만든다.

---

## STP 구성 요소

### 핵심 개념 3가지

```mermaid
flowchart TD
    STP["STP 동작 원리"]
    STP --> RB["Root Bridge 선출<br/>Bridge ID가 가장 낮은 스위치"]
    STP --> RP["Root Port 선출<br/>각 비루트 스위치에서<br/>Root로 가는 최적 포트"]
    STP --> DP["Designated Port 선출<br/>각 세그먼트에서<br/>Root로 보내는 포트"]

    style STP fill:#1E3A5F,stroke:#1E3A5F,color:#fff
    style RB fill:#EA580C,stroke:#C2410C,color:#fff
    style RP fill:#2563EB,stroke:#1D4ED8,color:#fff
    style DP fill:#16A34A,stroke:#15803D,color:#fff
```

### Bridge ID 구조

```
[ Priority (2B) ] [ MAC Address (6B) ]
     32768           아래 MAC 주소
```

- 기본 Priority: **32768** (0~61440, 4096 단위)
- Bridge ID가 **낮을수록** Root Bridge로 선출
- Priority가 같으면 **MAC 주소가 낮은** 스위치가 Root

### Path Cost (포트 속도별)

| 링크 속도 | STP Cost | RSTP Cost |
|-----------|----------|-----------|
| 10 Mbps | 100 | 2,000,000 |
| 100 Mbps | 19 | 200,000 |
| 1 Gbps | 4 | 20,000 |
| 10 Gbps | 2 | 2,000 |

---

## STP 동작 흐름

```mermaid
sequenceDiagram
    participant SW1 as "SW1 (Root)"
    participant SW2 as "SW2"
    participant SW3 as "SW3"

    Note over SW1,SW3: "1단계 — Root Bridge 선출"
    SW1->>SW2: "BPDU (BID: 32768 + MAC A)"
    SW2->>SW1: "BPDU (BID: 32768 + MAC B)"
    SW3->>SW1: "BPDU (BID: 32768 + MAC C)"
    Note over SW1: "MAC A가 가장 낮음 → Root Bridge"

    Note over SW1,SW3: "2단계 — Root Port 선출 (각 스위치)"
    SW1->>SW2: "BPDU (Root Cost = 0)"
    Note over SW2: "SW1 방향 포트 = Root Port"
    Note over SW3: "SW1 방향 포트 = Root Port"

    Note over SW1,SW3: "3단계 — Designated/Blocking Port 결정"
    Note over SW2: "SW2↔SW3 세그먼트: 더 낮은 BID → Designated"
    Note over SW3: "SW3 쪽 포트 → Blocking!"
```

### STP 포트 상태 전이 (802.1D)

```mermaid
flowchart LR
    BLK["Blocking<br/>BPDU 수신만"] -->|"20초 (Max Age)"| LIS["Listening<br/>BPDU 송수신"]
    LIS -->|"15초 (Forward Delay)"| LRN["Learning<br/>MAC 주소 학습"]
    LRN -->|"15초 (Forward Delay)"| FWD["Forwarding<br/>정상 동작"]
    FWD -->|"장애 감지"| BLK

    style BLK fill:#DC2626,stroke:#B91C1C,color:#fff
    style LIS fill:#EA580C,stroke:#C2410C,color:#fff
    style LRN fill:#D97706,stroke:#B45309,color:#fff
    style FWD fill:#16A34A,stroke:#15803D,color:#fff
```

> 링크 장애 → 수렴까지 **최대 50초** (20 + 15 + 15)

---

## RSTP (802.1w) — 빠른 수렴

RSTP는 STP의 느린 수렴 문제를 해결한다. 50초 → **수 초 이내** 수렴.

### RSTP 포트 역할

```mermaid
flowchart TD
    subgraph RSTP["RSTP 포트 역할"]
        R["Root Port<br/>Root로 가는 최적 경로"]
        D["Designated Port<br/>세그먼트의 포워딩 포트"]
        A["Alternate Port<br/>Root Port의 백업"]
        B["Backup Port<br/>Designated Port의 백업"]
    end

    style R fill:#2563EB,stroke:#1D4ED8,color:#fff
    style D fill:#16A34A,stroke:#15803D,color:#fff
    style A fill:#D97706,stroke:#B45309,color:#fff
    style B fill:#6B7280,stroke:#4B5563,color:#fff
```

### RSTP 포트 상태 (단순화)

| STP 상태 | RSTP 상태 |
|----------|-----------|
| Disabled | Discarding |
| Blocking | Discarding |
| Listening | Discarding |
| Learning | Learning |
| Forwarding | Forwarding |

### Edge Port (PortFast)

```mermaid
flowchart LR
    SW["스위치"] -->|"Edge Port<br/>즉시 Forwarding"| PC["PC / 서버"]
    SW -->|"일반 포트<br/>STP 계산 필요"| SW2["다른 스위치"]

    style SW fill:#2563EB,stroke:#1D4ED8,color:#fff
    style PC fill:#EFF6FF,stroke:#2563EB
    style SW2 fill:#7C3AED,stroke:#6D28D9,color:#fff
```

---

## MSTP (802.1s) — VLAN별 트리

여러 VLAN에 하나의 STP 인스턴스를 사용하는 낭비를 줄이기 위해, VLAN 그룹별로 **독립된 STP 인스턴스**를 구성한다.

```mermaid
flowchart TD
    subgraph MST0["MST Instance 0 (IST)"]
        R0["Root Bridge A"]
    end
    subgraph MST1["MST Instance 1 (VLAN 10, 20)"]
        R1["Root Bridge B"]
    end
    subgraph MST2["MST Instance 2 (VLAN 30, 40)"]
        R2["Root Bridge C"]
    end

    style R0 fill:#1E3A5F,stroke:#1E3A5F,color:#fff
    style R1 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style R2 fill:#7C3AED,stroke:#6D28D9,color:#fff
```

---

## STP / RSTP / MSTP 비교

| 구분 | STP (802.1D) | RSTP (802.1w) | MSTP (802.1s) |
|------|--------------|----------------|----------------|
| 수렴 시간 | ~50초 | ~수 초 | ~수 초 |
| VLAN 지원 | 단일 인스턴스 | 단일 인스턴스 | 그룹별 인스턴스 |
| 포트 상태 | 5단계 | 3단계 | 3단계 |
| Cisco 기본 | PVST+ | Rapid-PVST+ | 별도 설정 |

> **PVST+** (Per-VLAN Spanning Tree Plus): Cisco의 STP 확장판 — VLAN마다 별도 STP 인스턴스

---

## 설정 및 검증

### Root Bridge 수동 지정

```bash
! Root Bridge로 지정 (Priority 낮춤)
SW1(config)# spanning-tree vlan 10 priority 4096
! 또는 매크로 사용
SW1(config)# spanning-tree vlan 10 root primary
SW1(config)# spanning-tree vlan 20 root secondary
```

### Rapid-PVST+ 활성화

```bash
SW1(config)# spanning-tree mode rapid-pvst
```

### PortFast + BPDU Guard (엔드포인트 포트)

```bash
SW1(config-if)# spanning-tree portfast
SW1(config-if)# spanning-tree bpduguard enable
```

### 검증 명령어

```bash
SW# show spanning-tree vlan 10
SW# show spanning-tree vlan 10 detail
SW# show spanning-tree summary
```

---

## STP 보호 기능 비교

```mermaid
flowchart TD
    subgraph PROT["STP 보호 메커니즘"]
        PF["PortFast<br/>엔드포인트 포트<br/>즉시 Forwarding"]
        BG["BPDU Guard<br/>PortFast 포트에서<br/>BPDU 수신 시 err-disable"]
        BF["BPDU Filter<br/>BPDU 송수신 차단<br/>(주의: 루프 위험)"]
        RG["Root Guard<br/>지정 포트에서 우월<br/>BPDU 수신 시 차단"]
        LG["Loop Guard<br/>Blocking 포트에서<br/>BPDU 미수신 시 보호"]
    end

    style PF fill:#16A34A,stroke:#15803D,color:#fff
    style BG fill:#2563EB,stroke:#1D4ED8,color:#fff
    style BF fill:#6B7280,stroke:#4B5563,color:#fff
    style RG fill:#EA580C,stroke:#C2410C,color:#fff
    style LG fill:#7C3AED,stroke:#6D28D9,color:#fff
```

| 기능 | 적용 위치 | 목적 |
|------|-----------|------|
| PortFast | 엔드포인트 포트 | 빠른 포워딩 전환 |
| BPDU Guard | PortFast 포트 | 비인가 스위치 연결 차단 |
| Root Guard | 업링크 포트 | 비인가 Root 선출 방지 |
| Loop Guard | 블로킹 포트 | 단방향 링크 장애 보호 |

---

## CCNP/CCIE 시험 포인트

- Root Bridge 선출 기준: **낮은 Priority → 낮은 MAC 주소**
- 기본 타이머: Hello=**2초**, Max Age=**20초**, Forward Delay=**15초**
- RSTP에서 Alternate Port는 STP의 Blocking Port와 동일 역할
- PortFast + BPDU Guard는 **항상 함께** 설정 (단독 PortFast는 루프 위험)
- MSTP는 **Region** 개념이 있고, Region 내부만 MSTP 인스턴스 공유
- `show spanning-tree inconsistentports` — 루프 가드/루트 가드에 의해 차단된 포트 확인
