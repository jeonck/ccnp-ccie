import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/layer2/intro">
            학습 시작하기
          </Link>
        </div>
      </div>
    </header>
  );
}

const topics = [
  { label: 'L2/L3 라우팅', items: ['Layer 2 스위칭', 'OSPF', 'EIGRP', 'BGP', '경로 정책'], to: '/docs/layer2/intro' },
  { label: 'WAN & 서비스', items: ['MPLS', 'MPLS VPN', 'SD-WAN', 'Segment Routing'], to: '/docs/mpls/intro' },
  { label: '보안 & VPN', items: ['AAA / 802.1X', 'IPsec / DMVPN', 'FlexVPN', 'ASA / FTD'], to: '/docs/security/intro' },
  { label: '인프라 서비스', items: ['QoS', 'NAT / DHCP / FHRP', 'IPv6', 'SNMP / NetFlow'], to: '/docs/qos/intro' },
  { label: '자동화', items: ['Python / Netmiko', 'Ansible', 'NETCONF/YANG', 'DNA Center API'], to: '/docs/automation/intro' },
  { label: '설계 & 트러블슈팅', items: ['엔터프라이즈 설계', 'HA 설계', '진단 도구', '방법론'], to: '/docs/design/intro' },
];

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="네트워크 전문가를 위한 CCNP/CCIE 학습 가이드">
      <HomepageHeader />
      <main>
        <section style={{padding: '2rem 0'}}>
          <div className="container">
            <div className="row">
              {topics.map((topic) => (
                <div key={topic.label} className="col col--4" style={{marginBottom: '1.5rem'}}>
                  <div className="card" style={{height: '100%'}}>
                    <div className="card__header">
                      <h3>{topic.label}</h3>
                    </div>
                    <div className="card__body">
                      <ul style={{paddingLeft: '1.2rem', margin: 0}}>
                        {topic.items.map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="card__footer">
                      <Link className="button button--primary button--sm" to={topic.to}>
                        바로가기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
