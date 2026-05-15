---
sidebar_position: 1
title: MPLS 개요
---

# MPLS (Multiprotocol Label Switching)

## 정의

IP 패킷에 **레이블(Label)** 을 부착하여 목적지 IP 주소 대신 레이블 값만으로 패킷을 고속 전달하는 레이어 2.5 스위칭 기술 (RFC 3031).

## 특징

- **(레이블 기반 고속 포워딩)** IP 라우팅 테이블 조회 없이 레이블만으로 스위칭하여 코어망 포워딩 속도 극대화
- **(프로토콜 독립성)** IPv4, IPv6, Ethernet 등 다양한 L3 프로토콜을 단일 MPLS 인프라로 전송 가능
- **(VPN·TE·QoS 통합)** L3VPN, L2VPN, Traffic Engineering, QoS를 하나의 레이블 스택으로 통합 제공

---

## MPLS 전체 아키텍처

```mermaid
flowchart LR
    CE1["CE1<br/>(고객 장비)"]
    PE1["PE1<br/>(Provider Edge)<br/>레이블 Push"]
    P1["P<br/>(Provider Core)<br/>레이블 Swap"]
    P2["P<br/>(Provider Core)<br/>레이블 Swap"]
    PE2["PE2<br/>(Provider Edge)<br/>레이블 Pop"]
    CE2["CE2<br/>(고객 장비)"]

    CE1 -->|"IP 패킷"| PE1
    PE1 -->|"레이블 부착<br/>(Push)"| P1
    P1 -->|"레이블 교체<br/>(Swap)"| P2
    P2 -->|"레이블 교체<br/>(Swap)"| PE2
    PE2 -->|"레이블 제거<br/>(Pop)"| CE2

    style CE1 fill:#6B7280,stroke:#4B5563,color:#fff
    style CE2 fill:#6B7280,stroke:#4B5563,color:#fff
    style PE1 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style PE2 fill:#2563EB,stroke:#1D4ED8,color:#fff
    style P1 fill:#7C3AED,stroke:#6D28D9,color:#fff
    style P2 fill:#7C3AED,stroke:#6D28D9,color:#fff
```

| 역할 | 장비 | 기능 |
|------|------|------|
| **CE** (Customer Edge) | 고객 라우터 | MPLS 비인식, PE와 라우팅 교환 |
| **PE** (Provider Edge) | 사업자 엣지 라우터 | 레이블 Push/Pop, VRF 관리 |
| **P** (Provider Core) | 사업자 코어 라우터 | 레이블 Swap만 수행, 고속 포워딩 |

---

## 섹션 문서 안내

| 문서 | 내용 |
|------|------|
| [MPLS 기본](./mpls-basics) | 레이블 동작, LDP, FEC, PHP |
| [MPLS L3VPN](./mpls-l3vpn) | VRF, RD/RT, MP-BGP VPNv4 |
| [MPLS L2VPN](./mpls-l2vpn) | AToM, VPLS, Pseudowire |
| [세그먼트 라우팅](./segment-routing) | SR-MPLS, SRv6, SR-TE |

---

## CCNP/CCIE 시험 비중

| 시험 | 토픽 | 비중 |
|------|------|------|
| CCNP ENCOR (350-401) | MPLS 개념, L3VPN, 세그먼트 라우팅 | ~10% |
| CCIE Enterprise Lab | MPLS L3VPN 전체 구성, SR-TE | 높음 |
| CCIE SP Lab | MPLS 전 영역 (L2VPN/L3VPN/SR) | 핵심 |

- CCNP ENCOR 시험에서 **LDP, PHP, VRF, RD/RT** 개념이 자주 출제된다.
- CCIE Lab은 전체 MPLS 토폴로지 구성 및 트러블슈팅 능력을 요구한다.
- 세그먼트 라우팅(SR)은 최신 SP/Enterprise 시험에서 비중이 빠르게 증가하고 있다.
