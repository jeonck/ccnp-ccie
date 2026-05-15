---
sidebar_position: 4
title: 이더채널
---

# 이더채널
**EtherChannel (LACP / PAgP)**

## 왜 필요한가?

두 스위치를 연결할 때 단일 링크의 대역폭이 부족하거나 장애에 취약하다. 여러 링크를 추가하면 STP가 루프를 막기 위해 하나만 남기고 나머지를 **차단(Blocking)** 해버린다.

**EtherChannel** 은 여러 물리 링크를 **하나의 논리 인터페이스**로 묶어서, STP 눈에는 단일 링크처럼 보이게 하면서 **대역폭 집계와 이중화**를 동시에 달성한다.

```mermaid
flowchart LR
    subgraph BEF["EtherChannel 없음 — STP가 차단"]
        SW1A["스위치 1"] -->|"활성 (1 Gbps)"| SW2A["스위치 2"]
        SW1A -->|"STP 차단"| SW2A
        SW1A -->|"STP 차단"| SW2A
    end

    subgraph AFT["EtherChannel 적용 — 3 Gbps 논리 링크"]
        SW1B["스위치 1"] <-->|"Po1 — 3 Gbps<br/>(3 × 1G 논리 집계)"| SW2B["스위치 2"]
    end

    style SW1A fill:#EA580C,stroke:#C2410C,color:#fff
    style SW2A fill:#EA580C,stroke:#C2410C,color:#fff
    style SW1B fill:#2563EB,stroke:#1D4ED8,color:#fff
    style SW2B fill:#2563EB,stroke:#1D4ED8,color:#fff
```

---

## 구성 요소

```mermaid
flowchart TD
    EC["EtherChannel"] --> PO["Port-Channel<br/>논리 인터페이스 (Po1~Po48)"]
    EC --> LACP["LACP (802.3ad)<br/>IEEE 표준 — 벤더 무관"]
    EC --> PAGP["PAgP<br/>Cisco 독점 프로토콜"]
    EC --> STATIC["Static (On)<br/>협상 없이 강제 설정"]
    EC --> LB["Load Balancing<br/>트래픽 분산 알고리즘"]

    style EC fill:#1E3A5F,stroke:#1E3A5F,color:#fff
    style PO fill:#2563EB,stroke:#1D4ED8,color:#fff
    style LACP fill:#16A34A,stroke:#15803D,color:#fff
    style PAGP fill:#7C3AED,stroke:#6D28D9,color:#fff
    style STATIC fill:#6B7280,stroke:#4B5563,color:#fff
    style LB fill:#EA580C,stroke:#C2410C,color:#fff
```

---

## LACP vs PAgP vs Static 비교

| 항목 | LACP (802.3ad) | PAgP | Static (On) |
|------|----------------|------|-------------|
| 표준 | IEEE 802.3ad | Cisco 독점 | - |
| 협상 방식 | Active / Passive | Desirable / Auto | On (협상 없음) |
| 최대 멤버 | 16개 (8개 활성) | 8개 | 제한 없음 |
| 권장 여부 | **권장** | Cisco 환경 | 주의 필요 |

### 모드 조합 — 채널이 형성되는 조건

```mermaid
flowchart LR
    subgraph LACP_MODES["LACP 모드 조합"]
        LA["Active"] <-->|"채널 형성"| LP["Active 또는 Passive"]
        LPA["Passive"] <-->|"형성 안됨"| LPB["Passive"]
    end

    subgraph PAGP_MODES["PAgP 모드 조합"]
        PD["Desirable"] <-->|"채널 형성"| PA["Desirable 또는 Auto"]
        PAA["Auto"] <-->|"형성 안됨"| PAB["Auto"]
    end

    style LA fill:#16A34A,stroke:#15803D,color:#fff
    style LP fill:#16A34A,stroke:#15803D,color:#fff
    style PD fill:#7C3AED,stroke:#6D28D9,color:#fff
    style PA fill:#7C3AED,stroke:#6D28D9,color:#fff
```

---

## 로드 밸런싱 알고리즘

EtherChannel은 트래픽을 여러 멤버 링크에 분산한다. **해시 알고리즘**을 기반으로 동일 플로우는 항상 같은 링크를 사용한다.

```mermaid
flowchart TD
    TR["트래픽 플로우"] --> HASH["해시 계산<br/>(XOR 기반)"]
    HASH --> L1["링크 1"]
    HASH --> L2["링크 2"]
    HASH --> L3["링크 3"]

    subgraph METHODS["해시 기준 선택"]
        M1["src-mac — 출발지 MAC"]
        M2["dst-mac — 목적지 MAC"]
        M3["src-dst-mac — 양쪽 MAC (기본값)"]
        M4["src-ip — 출발지 IP"]
        M5["src-dst-ip — 양쪽 IP (권장)"]
    end

    style HASH fill:#EA580C,stroke:#C2410C,color:#fff
    style L1 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style L2 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style L3 fill:#2563EB,stroke:#1D4ED8,color:#fff
```

```bash
! 로드 밸런싱 방식 변경 (글로벌 설정)
SW(config)# port-channel load-balance src-dst-ip

! 확인
SW# show etherchannel load-balance
```

---

## 동작 흐름 — LACP 협상

```mermaid
sequenceDiagram
    participant SW1 as "스위치 1 (Active)"
    participant SW2 as "스위치 2 (Active)"

    SW1->>SW2: "LACPDU (Actor: Active, Priority, MAC)"
    SW2->>SW1: "LACPDU (Actor: Active, Priority, MAC)"
    Note over SW1,SW2: "양쪽 모두 Active → 협상 성공"
    Note over SW1,SW2: "System Priority + MAC으로 키 결정"
    Note over SW1,SW2: "Port-Channel (Po1) 논리 인터페이스 생성"
    SW1->>SW2: "일반 데이터 트래픽 (해시 기반 분산)"
```

---

## 설정 — 완전한 예시

### LACP (권장)

```bash
! 스위치 1
SW1(config)# interface range GigabitEthernet0/1 - 3
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel 1
SW1(config-if)# switchport trunk encapsulation dot1q
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20,30

! 스위치 2
SW2(config)# interface range GigabitEthernet0/1 - 3
SW2(config-if-range)# channel-group 1 mode active
```

### PAgP

```bash
SW1(config)# interface range GigabitEthernet0/1 - 2
SW1(config-if-range)# channel-group 1 mode desirable
```

### Static (On) — 주의

```bash
! 양쪽 모두 On 설정 — 한쪽만 On이면 채널 안 만들어짐
SW1(config-if-range)# channel-group 1 mode on
```

---

## 검증 명령어

```bash
! 전체 채널 상태
SW# show etherchannel summary
! 출력 예시:
! Po1(SU)   LACP     Gi0/1(P) Gi0/2(P) Gi0/3(P)
! S=Layer2  U=in use  P=bundled

! 상세 정보
SW# show etherchannel 1 detail
SW# show etherchannel port-channel

! LACP 협상 상태
SW# show lacp neighbor
SW# show lacp 1 counters

! 포트채널 인터페이스 상태
SW# show interfaces port-channel 1
```

---

## EtherChannel 장애 시나리오

```mermaid
flowchart TD
    subgraph FAIL["멤버 링크 1개 장애"]
        SW1["스위치 1<br/>Po1 = Gi0/1 + Gi0/2 + Gi0/3"]
        SW2["스위치 2<br/>Po1 = Gi0/1 + Gi0/2 + Gi0/3"]
        SW1 <-->|"Gi0/1 — 활성"| SW2
        SW1 <-->|"Gi0/2 — 장애!"| SW2
        SW1 <-->|"Gi0/3 — 활성"| SW2
    end

    NOTE["채널 유지 (2/3 링크 사용)<br/>STP 재계산 없음<br/>트래픽은 나머지 링크로 자동 이동"]

    style SW1 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style SW2 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style NOTE fill:#F0FDF4,stroke:#16A34A,color:#16A34A
```

---

## 활용 시나리오

```mermaid
flowchart TD
    CORE["코어 스위치<br/>Po1 — 10G (4×10G)"]
    DIST1["분산 스위치 1<br/>Po2 — 2G (2×1G)"]
    DIST2["분산 스위치 2<br/>Po3 — 2G (2×1G)"]
    SERVER["서버팜 스위치<br/>Po4 — 4G (4×1G)"]

    CORE <--> DIST1
    CORE <--> DIST2
    CORE <--> SERVER

    style CORE fill:#1E3A5F,stroke:#1E3A5F,color:#fff
    style DIST1 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style DIST2 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style SERVER fill:#16A34A,stroke:#15803D,color:#fff
```

---

## CCNP/CCIE 시험 포인트

- EtherChannel 형성 실패 원인: 양단의 **속도·듀플렉스·VLAN·Trunk 설정 불일치**
- `show etherchannel summary`의 플래그: `P`=bundled, `D`=down, `I`=stand-alone
- LACP는 **16개 포트** 지원하지만 최대 **8개 활성** (나머지 8개는 Hot-Standby)
- PAgP의 **Desirable-Desirable** 또는 **Desirable-Auto** 조합만 채널 형성
- **Static(On)** 은 협상이 없으므로 한쪽만 설정되어도 오류 없이 올라와서 미스매치를 감지하기 어렵다
- L3 EtherChannel: `no switchport` 후 `ip address` 직접 할당 가능
