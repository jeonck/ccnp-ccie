---
sidebar_position: 2
title: NAT
---

# NAT (Network Address Translation)

## 정의

사설(Private) IP 주소와 공인(Public) IP 주소 간의 변환을 수행하여 IPv4 주소 공간을 절약하고 내부 네트워크를 외부로부터 은닉하는 RFC 1918 기반 주소 변환 메커니즘.

## 특징

- **(IPv4 주소 절약)** 다수의 내부 호스트가 소수의 공인 IP를 공유하여 고갈 위기의 IPv4 주소 공간을 효율적으로 활용
- **(내부 네트워크 은닉)** 외부에서 내부 사설 주소가 직접 노출되지 않아 보안 레이어가 한 겹 추가됨
- **(PAT를 통한 다대일 매핑)** 포트 번호를 활용해 수천 개 호스트가 공인 IP 1개를 동시에 사용 가능

## 왜 필요한가?

인터넷에서 실제로 라우팅 가능한 공인 IP 주소는 한정되어 있다. 기업·가정의 모든 단말에 공인 IP를 할당하면 주소가 빠르게 소진된다. NAT는 내부 네트워크를 사설 주소 범위(10.x, 172.16~31.x, 192.168.x)로 구성하고, 인터넷 접속 시에만 공인 IP로 변환함으로써 이 문제를 해결한다.

## NAT 유형 비교

| 구분 | Static NAT | Dynamic NAT | PAT (Overload) |
|------|-----------|-------------|----------------|
| 매핑 방식 | 1:1 고정 | 1:1 동적 (풀에서) | 다:1 (포트 구분) |
| 풀(Pool) 필요 | 불필요 | 필요 | 불필요 (인터페이스 IP 사용 가능) |
| 서버 공개 | 가능 | 불가 | 불가 |
| 주소 절약 효과 | 없음 | 낮음 | 매우 높음 |
| 설정 키워드 | `static` | `pool` | `overload` |

## NAT 변환 흐름

```mermaid
flowchart LR
    PC["내부 호스트<br/>192.168.1.10"]
    R["NAT 라우터<br/>Inside ↔ Outside"]
    INT["인터넷<br/>목적지 서버"]

    PC -->|"패킷: src=192.168.1.10"| R
    R -->|"변환: src=203.0.113.1 (PAT: :5000)"| INT
    INT -->|"응답: dst=203.0.113.1:5000"| R
    R -->|"역변환: dst=192.168.1.10"| PC

    style PC fill:#16A34A,stroke:#15803D,color:#fff
    style R fill:#2563EB,stroke:#1D4ED8,color:#fff
    style INT fill:#0891B2,stroke:#0E7490,color:#fff
```

## NAT 용어

| 용어 | 설명 | 예시 |
|------|------|------|
| **Inside Local** | 내부 호스트의 사설 IP (NAT 전) | 192.168.1.10 |
| **Inside Global** | NAT 후 인터넷에서 보이는 공인 IP | 203.0.113.1 |
| **Outside Local** | 내부에서 바라보는 외부 목적지 IP | 8.8.8.8 |
| **Outside Global** | 실제 외부 서버의 공인 IP | 8.8.8.8 |

> 일반적으로 Outside Local = Outside Global (외부 주소는 변환하지 않는 경우).

## 설정 및 검증

### Static NAT (1:1 고정 매핑)

```bash
! 인터페이스에 Inside/Outside 방향 지정
R1(config-if)# ip nat inside          ! 내부 인터페이스 (LAN 쪽)
R1(config-if)# ip nat outside         ! 외부 인터페이스 (WAN 쪽)

! 사설 IP ↔ 공인 IP 고정 매핑
R1(config)# ip nat inside source static 192.168.1.10 203.0.113.5
```

### Dynamic NAT (풀 방식)

```bash
! 공인 IP 풀 정의
R1(config)# ip nat pool PUBLIC_POOL 203.0.113.1 203.0.113.10 netmask 255.255.255.240

! 변환 대상 내부 호스트 지정 (ACL)
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255

! NAT 정책 연결
R1(config)# ip nat inside source list 1 pool PUBLIC_POOL
```

### PAT (Overload — 가장 일반적인 구성)

```bash
! 인터페이스 IP를 공인 IP로 사용
R1(config)# ip nat inside source list 1 interface GigabitEthernet0/0 overload
```

### 검증 명령어

```bash
R1# show ip nat translations           ! NAT 변환 테이블 확인
R1# show ip nat translations verbose   ! 타이머 포함 상세 출력
R1# show ip nat statistics             ! 변환 횟수, 미스, 히트 통계
R1# clear ip nat translation *         ! NAT 테이블 전체 초기화
R1# debug ip nat                       ! NAT 변환 실시간 디버그 (주의: 트래픽 많으면 부하)
```

## CCNP/CCIE 시험 포인트

- Inside/Outside 방향 구분이 핵심 — `ip nat inside`와 `ip nat outside`를 인터페이스에 반드시 설정
- PAT 설정 시 `overload` 키워드를 빠뜨리면 Dynamic NAT로 동작 (주소 부족 시 연결 실패)
- NAT 처리 순서: **라우팅 결정 전**에 Inside→Outside 변환, **라우팅 결정 후**에 Outside→Inside 역변환
- `show ip nat translations` 출력에서 Inside Local / Inside Global / Outside Local / Outside Global 4열 위치를 정확히 파악해야 함
- Static NAT는 양방향 통신 허용 (서버 공개에 사용), Dynamic/PAT는 내부→외부 단방향 시작만 허용
- NAT-PT(IPv6↔IPv4 변환)는 deprecated — 현재는 NAT64 사용
- DNS와 NAT가 함께 있을 때 DNS ALG(Application Layer Gateway) 또는 DNS 외부 호스트 문제 주의
