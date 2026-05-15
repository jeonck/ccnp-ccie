---
sidebar_position: 5
title: 포트 보안
---

# 포트 보안
**Port Security / DAI / DHCP Snooping**

## 왜 필요한가?

L2 네트워크는 MAC 주소를 신뢰 기반으로 동작하기 때문에 다양한 공격에 취약하다. 대표적인 3가지 위협과 그 방어책을 다룬다.

```mermaid
flowchart LR
    subgraph THREATS["L2 주요 위협"]
        T1["MAC Flooding<br/>가짜 MAC 주소 대량 생성<br/>→ 스위치가 허브처럼 동작"]
        T2["ARP Spoofing<br/>가짜 ARP 응답으로<br/>트래픽 가로채기 (MITM)"]
        T3["DHCP Starvation/<br/>Rogue DHCP<br/>가짜 DHCP 서버로<br/>잘못된 IP 배포"]
    end

    subgraph DEFENSES["방어 메커니즘"]
        D1["Port Security<br/>MAC 주소 제한"]
        D2["Dynamic ARP<br/>Inspection (DAI)"]
        D3["DHCP Snooping"]
    end

    T1 -->|"방어"| D1
    T2 -->|"방어"| D2
    T3 -->|"방어"| D3

    style T1 fill:#DC2626,stroke:#B91C1C,color:#fff
    style T2 fill:#DC2626,stroke:#B91C1C,color:#fff
    style T3 fill:#DC2626,stroke:#B91C1C,color:#fff
    style D1 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style D2 fill:#16A34A,stroke:#15803D,color:#fff
    style D3 fill:#7C3AED,stroke:#6D28D9,color:#fff
```

---

## 1. Port Security — MAC 플러딩 방어

### 동작 원리

포트에 허용할 **MAC 주소의 수와 종류**를 제한한다. 위반 시 설정된 위반 모드에 따라 포트를 차단하거나 트래픽을 버린다.

```mermaid
flowchart TD
    FR["프레임 수신"] --> CHK{"허용된 MAC?"}
    CHK -->|"Yes"| FWD["정상 포워딩"]
    CHK -->|"No — 위반 발생"| VM{"위반 모드"}
    VM -->|"Shutdown"| SD["포트 err-disabled<br/>관리자 복구 필요"]
    VM -->|"Restrict"| RS["트래픽 차단<br/>SNMP 알림 · 카운터"]
    VM -->|"Protect"| PT["트래픽만 차단<br/>알림 없음"]

    style FR fill:#F1F5F9,stroke:#64748B
    style FWD fill:#16A34A,stroke:#15803D,color:#fff
    style SD fill:#DC2626,stroke:#B91C1C,color:#fff
    style RS fill:#D97706,stroke:#B45309,color:#fff
    style PT fill:#6B7280,stroke:#4B5563,color:#fff
```

### MAC 학습 방식 비교

| 방식 | 설명 | 재부팅 후 유지 |
|------|------|----------------|
| **Static** | 관리자가 직접 MAC 지정 | 유지 |
| **Dynamic** | 자동 학습 (기본) | 유지 안됨 |
| **Sticky** | 자동 학습 + running-config 저장 | 저장 시 유지 |

### 설정 예시

```bash
! Access 포트에만 적용 가능
SW(config)# interface FastEthernet0/1
SW(config-if)# switchport mode access
SW(config-if)# switchport port-security                         ! 활성화
SW(config-if)# switchport port-security maximum 2              ! 최대 2개 MAC 허용
SW(config-if)# switchport port-security mac-address sticky     ! Sticky 학습
SW(config-if)# switchport port-security violation shutdown      ! 위반 시 차단

! err-disabled 복구
SW(config-if)# shutdown
SW(config-if)# no shutdown
! 또는 자동 복구 (타이머)
SW(config)# errdisable recovery cause psecure-violation
SW(config)# errdisable recovery interval 300
```

### 검증

```bash
SW# show port-security
SW# show port-security interface FastEthernet0/1
SW# show port-security address
```

---

## 2. DHCP Snooping — 가짜 DHCP 방어

### 공격 시나리오

```mermaid
sequenceDiagram
    participant C as "클라이언트"
    participant SW as "스위치"
    participant R as "가짜 DHCP 서버 (공격자)"
    participant REAL as "진짜 DHCP 서버"

    C->>SW: "DHCP Discover (브로드캐스트)"
    SW->>R: "전달 (모든 포트로)"
    SW->>REAL: "전달"
    R->>SW: "DHCP Offer (가짜 게이트웨이 IP)"
    Note over C: "잘못된 게이트웨이로 설정됨<br/>→ 모든 트래픽이 공격자를 경유"
```

### DHCP Snooping 동작

**Trusted Port** (업링크, 진짜 DHCP 서버 방향)와 **Untrusted Port** (엔드포인트)를 구분한다. Untrusted 포트에서 DHCP Offer/Ack가 오면 차단한다.

```mermaid
flowchart LR
    REAL["진짜 DHCP 서버"] <-->|"Trusted Port<br/>DHCP 응답 허용"| SW["스위치"]
    SW <-->|"Untrusted Port<br/>DHCP 요청만 허용<br/>응답 차단"| C1["클라이언트 1"]
    SW <-->|"Untrusted Port"| C2["클라이언트 2"]
    FAKE["가짜 DHCP 서버<br/>(공격자)"] -->|"DHCP Offer → 차단!"| SW

    style SW fill:#2563EB,stroke:#1D4ED8,color:#fff
    style REAL fill:#16A34A,stroke:#15803D,color:#fff
    style FAKE fill:#DC2626,stroke:#B91C1C,color:#fff
```

DHCP Snooping은 **바인딩 테이블**을 생성한다: `MAC 주소 + IP + VLAN + 포트`

### 설정 예시

```bash
! DHCP Snooping 활성화
SW(config)# ip dhcp snooping
SW(config)# ip dhcp snooping vlan 10,20

! Trusted Port (DHCP 서버 방향)
SW(config)# interface GigabitEthernet0/1
SW(config-if)# ip dhcp snooping trust

! Rate Limit (Untrusted 포트, 기본 적용됨)
SW(config)# interface range FastEthernet0/1 - 24
SW(config-if-range)# ip dhcp snooping limit rate 15    ! 초당 15 패킷

! 검증
SW# show ip dhcp snooping
SW# show ip dhcp snooping binding
```

---

## 3. Dynamic ARP Inspection (DAI) — ARP 스푸핑 방어

### ARP Spoofing 공격

```mermaid
sequenceDiagram
    participant A as "PC A (10.0.0.1)"
    participant SW as "스위치"
    participant ATK as "공격자 (10.0.0.3)"
    participant GW as "게이트웨이 (10.0.0.254)"

    ATK->>SW: "Gratuitous ARP:<br/>10.0.0.254 = MAC(공격자)"
    SW->>A: "ARP 테이블 업데이트"
    Note over A: "게이트웨이 MAC = 공격자 MAC으로 변조"
    A->>SW: "게이트웨이로 보내는 트래픽"
    SW->>ATK: "실제로는 공격자에게 전달 (MITM)"
```

### DAI 동작

**DHCP Snooping 바인딩 테이블**을 참조해 ARP 패킷의 IP-MAC 매핑이 올바른지 검증한다.

```mermaid
flowchart TD
    ARP["ARP 패킷 수신"] --> TRUST{"Trusted Port?"}
    TRUST -->|"Yes"| FWD["그대로 통과"]
    TRUST -->|"No"| VAL{"바인딩 테이블<br/>IP-MAC 일치?"}
    VAL -->|"일치"| FWD2["정상 포워딩"]
    VAL -->|"불일치"| DROP["패킷 폐기<br/>로그 기록"]

    style FWD fill:#16A34A,stroke:#15803D,color:#fff
    style FWD2 fill:#16A34A,stroke:#15803D,color:#fff
    style DROP fill:#DC2626,stroke:#B91C1C,color:#fff
```

### 설정 예시

```bash
! DAI 활성화 (DHCP Snooping 설정 필요)
SW(config)# ip arp inspection vlan 10,20

! Trusted Port (업링크 방향)
SW(config)# interface GigabitEthernet0/1
SW(config-if)# ip arp inspection trust

! ARP Rate Limit
SW(config)# interface range FastEthernet0/1 - 24
SW(config-if-range)# ip arp inspection limit rate 100    ! 초당 100 ARP

! 정적 IP 환경: ARP ACL로 예외 처리
SW(config)# arp access-list STATIC_ARP
SW(config-arp-nacl)# permit ip host 10.0.0.100 mac host aabb.cc00.0100
SW(config)# ip arp inspection filter STATIC_ARP vlan 10

! 검증
SW# show ip arp inspection
SW# show ip arp inspection vlan 10
SW# show ip arp inspection statistics
```

---

## 3가지 보안 기능 통합 구조

```mermaid
flowchart TD
    subgraph SWITCH["스위치 보안 레이어"]
        DS["DHCP Snooping<br/>바인딩 테이블 생성<br/>(IP + MAC + Port + VLAN)"]
        DAI["Dynamic ARP Inspection<br/>바인딩 테이블 참조<br/>ARP 위조 차단"]
        PS["Port Security<br/>MAC 주소 수 제한<br/>MAC Flooding 방지"]
    end

    DS -->|"바인딩 테이블 제공"| DAI

    style DS fill:#7C3AED,stroke:#6D28D9,color:#fff
    style DAI fill:#16A34A,stroke:#15803D,color:#fff
    style PS fill:#2563EB,stroke:#1D4ED8,color:#fff
```

### 설정 순서 (권장)

```
1. DHCP Snooping 활성화 → 바인딩 테이블 생성
2. DAI 활성화 → 바인딩 테이블 참조
3. Port Security 적용 → MAC 수 제한
```

---

## 기능 비교 요약

| 기능 | 방어 대상 | 기반 기술 | Trusted 개념 |
|------|-----------|-----------|--------------|
| Port Security | MAC Flooding | MAC 주소 테이블 | 없음 |
| DHCP Snooping | Rogue DHCP / DHCP 고갈 | 바인딩 테이블 | Trusted Port |
| DAI | ARP Spoofing (MITM) | DHCP Snooping 바인딩 | Trusted Port |

---

## CCNP/CCIE 시험 포인트

- Port Security는 **Access 포트**에만 적용 가능 (Trunk 포트 불가)
- Sticky MAC: `copy running-config startup-config` 없이는 재부팅 후 사라짐
- DHCP Snooping이 비활성화 상태에서 DAI 설정 시 → 모든 ARP 폐기 (바인딩 테이블 없음)
- `ip dhcp snooping information option` — DHCP Option 82 삽입 (중간 스위치에서 비활성화 필요할 수 있음)
- DAI에서 `arp access-list`는 DHCP 없이 정적 IP를 사용하는 장비에 필수
- Rate limit 초과 시 포트 **err-disabled** → `errdisable recovery cause arp-inspection`으로 자동 복구 설정
