---
sidebar_position: 4
title: 프리픽스 리스트
---

# 프리픽스 리스트 (Prefix List)

## 정의

네트워크 주소와 프리픽스 길이 범위(**ge/le**)를 기준으로 경로를 정밀하게 매칭하는 필터링 도구로, ACL 대비 경로 필터링에 특화되어 있다.

## 특징

- **(프리픽스 길이 범위 매칭)** ge(greater-or-equal)와 le(less-or-equal) 키워드로 /16~/24처럼 길이 범위를 지정하여 ACL로는 불가능한 서브넷 집합을 한 줄에 표현
- **(이진 트리 검색)** 내부적으로 이진 트리(trie) 구조로 저장되어 ACL의 순차 검색보다 빠른 검색 성능을 제공하며 대규모 BGP 테이블 필터링에 적합
- **(경로 전용 도구)** 패킷 필터링이 아닌 라우팅 프로토콜의 경로(네트워크 주소) 필터링에만 사용되며 ACL처럼 permit/deny의 암묵적 deny 규칙이 동일하게 적용

## ACL vs Prefix-List 비교

| 구분 | ACL (Extended) | Prefix-List |
|------|----------------|-------------|
| 매칭 대상 | 패킷 헤더 (src/dst IP, port) | 라우팅 경로 (네트워크 주소) |
| 프리픽스 길이 매칭 | 불가 (와일드카드만) | ge/le로 길이 범위 지정 가능 |
| 검색 방식 | 순차 검색 | 이진 트리 (고속) |
| 순서 번호 | 암묵적 자동 증가 | 명시적 seq 번호 |
| 용도 | 패킷 필터 / distribute-list 보조 | BGP·OSPF·EIGRP 경로 필터 |
| 수정 용이성 | seq 삽입 어려움 | seq 번호로 중간 삽입 가능 |

## Prefix-List 문법 상세

```
ip prefix-list [NAME] seq [n] permit|deny [network/len] [ge [min]] [le [max]]
```

| 표현 | 의미 |
|------|------|
| `10.0.0.0/8` | 정확히 10.0.0.0/8만 매칭 |
| `10.0.0.0/8 le 24` | 10.0.0.0/8 ~ /24 범위의 모든 서브넷 |
| `10.0.0.0/8 ge 16 le 24` | 10.0.0.0 내의 /16 ~ /24 범위 서브넷 |
| `0.0.0.0/0` | 기본 경로(default route) 0.0.0.0/0만 매칭 |
| `0.0.0.0/0 le 32` | 모든 경로(길이 무관, 전체 라우팅 테이블) |
| `192.168.0.0/16 ge 24 le 28` | 192.168.x.x 내의 /24 ~ /28 서브넷 |

### ge/le 조건 규칙

```
len ≤ prefix-length ≤ le   (le만 지정 시)
ge ≤ prefix-length ≤ 32    (ge만 지정 시)
ge ≤ prefix-length ≤ le    (ge와 le 모두 지정 시)
```

> **조건 제약:** `len ≤ ge ≤ le ≤ 32` 를 반드시 만족해야 한다. `ge` 값은 지정된 prefix 길이 이상이어야 한다.

## 설정 및 검증

```bash
! ── 기본 Prefix-List 설정 ────────────────────────────
ip prefix-list DENY_DEFAULT seq 5 deny 0.0.0.0/0
ip prefix-list DENY_DEFAULT seq 10 permit 0.0.0.0/0 le 32
!  기본 경로만 차단하고 나머지 모든 경로는 허용

! ── 범위 매칭 예시 ───────────────────────────────────
ip prefix-list CORP_SUBNETS seq 10 permit 10.0.0.0/8 ge 24 le 28
!  10.x.x.x 대역의 /24 ~ /28 서브넷만 허용

ip prefix-list EXACT_NET seq 10 permit 192.168.1.0/24
!  정확히 192.168.1.0/24만 매칭

ip prefix-list ALL_ROUTES seq 10 permit 0.0.0.0/0 le 32
!  모든 경로 매칭 (catch-all)

! ── BGP 필터링에 적용 ────────────────────────────────
router bgp 65001
 neighbor 10.0.0.1 prefix-list CORP_SUBNETS in
 !  인바운드 BGP 업데이트 필터링

! ── OSPF distribute-list에 적용 ─────────────────────
router ospf 1
 distribute-list prefix DENY_DEFAULT in
 !  OSPF 경로 수신 필터링

! ── EIGRP distribute-list에 적용 ────────────────────
router eigrp 100
 distribute-list prefix CORP_SUBNETS out GigabitEthernet0/0
 !  특정 인터페이스로 광고되는 경로 필터링

! ── 검증 명령어 ──────────────────────────────────────
show ip prefix-list [NAME]
show ip prefix-list [NAME] detail      ! 매칭 횟수 포함 상세 정보
show ip prefix-list summary
show ip bgp neighbors [IP] received-routes
```

## CCNP/CCIE 시험 포인트

- **`ge` 값은 지정된 prefix 길이 이상**이어야 하며 위반 시 명령어 오류 발생 (`/8 ge 4` 불가)
- prefix-list 마지막에는 ACL과 동일하게 **implicit deny** 가 존재
- `0.0.0.0/0` 은 **기본 경로만** 매칭; 모든 경로를 매칭하려면 `0.0.0.0/0 le 32` 사용
- ACL의 와일드카드 마스크는 호스트 비트를 무시하지만, prefix-list는 **정확한 네트워크 주소**와 길이를 매칭
- `show ip prefix-list detail` 로 각 항목의 **hit count** 확인 가능 — 필터 동작 여부 검증에 필수
