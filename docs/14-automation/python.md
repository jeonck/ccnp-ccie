---
sidebar_position: 2
title: Python 네트워크 자동화
---

# Python 네트워크 자동화

## 정의

Python 언어와 Netmiko·NAPALM·Nornir 등의 라이브러리를 활용하여 Cisco 네트워크 장비에 SSH/TELNET으로 접속하고 CLI 명령어 실행, 설정 변경, 출력 파싱을 자동화하는 기법이다.

## 특징

- **(멀티벤더 추상화)** Netmiko는 60개 이상의 NOS를 지원하는 통합 API로, Cisco IOS·IOS-XE·NX-OS·ASA의 접속·명령어·설정 패턴 차이를 추상화하여 동일 코드로 다중 벤더 장비 제어
- **(구조화 데이터 파싱)** TextFSM·Genie·TTP 라이브러리로 CLI 평문 출력을 JSON/딕셔너리로 파싱하여 조건 분기·비교·리포팅 자동화 가능
- **(비동기 대규모 처리)** Nornir는 비동기·멀티스레드 실행 엔진으로 수천 대 장비에 동시 접속하여 순차 처리 대비 수십 배 빠른 대규모 배치 자동화 지원

---

## 주요 라이브러리 비교

| 라이브러리 | 방식 | 특징 | 적합 용도 |
|-----------|------|------|---------|
| Netmiko | SSH CLI | 간단, 멀티벤더 | 단순 CLI 자동화 |
| Paramiko | SSH (Raw) | 저수준 SSH, 유연성 | 커스텀 SSH 처리 |
| NAPALM | 추상화 API | 표준 getter/setter | 구성 비교·백업 |
| Nornir | 실행 엔진 | 비동기·병렬 | 대규모 장비 작업 |
| pyntc | 멀티벤더 | 간단 API | 교육·프로토타입 |

---

## Netmiko 기본 사용법

```python
from netmiko import ConnectHandler

# 장비 정의
device = {
    'device_type': 'cisco_ios',
    'host': '192.168.1.1',
    'username': 'admin',
    'password': 'Cisco123!',
    'secret': 'Enable123!',  # Enable 패스워드
}

# 접속 및 명령어 실행
with ConnectHandler(**device) as conn:
    conn.enable()                               # Enable 모드 진입
    output = conn.send_command('show ip route') # show 명령어
    print(output)

    # 설정 변경
    commands = [
        'interface GigabitEthernet0/1',
        'description WAN-Link',
        'no shutdown',
    ]
    result = conn.send_config_set(commands)     # 설정 명령어 전송
    conn.save_config()                          # write memory
```

---

## YAML 인벤토리 + 다중 장비 자동화

```python
import yaml
from netmiko import ConnectHandler

# inventory.yaml
# ---
# routers:
#   - host: 192.168.1.1
#     device_type: cisco_ios
#   - host: 192.168.1.2
#     device_type: cisco_ios_xe

with open('inventory.yaml') as f:
    inventory = yaml.safe_load(f)

for device in inventory['routers']:
    device.update({'username': 'admin', 'password': 'Cisco123!'})
    with ConnectHandler(**device) as conn:
        ver = conn.send_command('show version', use_textfsm=True)
        print(f"{device['host']}: {ver[0]['version']}")
```

---

## Genie / TextFSM 구조화 파싱

```python
from genie.testbed import load

# Genie로 파싱 (PyATS 기반)
device.connect()
parsed = device.parse('show ip ospf neighbor')
# 결과: 딕셔너리 {'interfaces': {'Gi0/0': {'neighbors': {...}}}}

# TextFSM (Netmiko 내장)
output = conn.send_command('show ip bgp summary', use_textfsm=True)
# 결과: 리스트 of 딕셔너리
for peer in output:
    print(f"Peer: {peer['bgp_neigh']}, State: {peer['state_pfxrcd']}")
```

---

## CCNP/CCIE 시험 포인트

- `device_type` 문자열: `cisco_ios`, `cisco_ios_xe`, `cisco_nxos`, `cisco_asa`
- **Netmiko vs Paramiko**: Netmiko는 Paramiko 위에 구축된 고수준 래퍼
- `send_command` vs `send_config_set`: show 명령은 전자, config는 후자
- **TextFSM**: `use_textfsm=True` 옵션으로 Netmiko 내장 파싱 활성화
- NAPALM `get_facts()`, `get_interfaces()`, `compare_config()` — 표준 getter
- Nornir `nr.run(task=netmiko_send_command, command_string='show ver')` — 병렬 실행
- CCNP ENCOR/ENARSI에서 Python은 **개념·라이브러리 구분** 중심 출제
