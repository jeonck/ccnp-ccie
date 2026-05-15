import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const GITHUB_USERNAME = 'jeonck';
const REPO_NAME = 'ccnp-ccie';
const SITE_TITLE = 'CCNP/CCIE 지식베이스';
const SITE_TAGLINE = '네트워크 전문가를 위한 CCNP/CCIE 학습 가이드';

const config: Config = {
  title: SITE_TITLE,
  tagline: SITE_TAGLINE,
  favicon: 'img/favicon.ico',

  future: { v4: true },

  url: `https://${GITHUB_USERNAME}.github.io`,
  baseUrl: `/${REPO_NAME}/`,
  organizationName: GITHUB_USERNAME,
  projectName: REPO_NAME,
  trailingSlash: false,

  onBrokenLinks: 'throw',

  themes: ['@docusaurus/theme-mermaid'],
  markdown: { mermaid: true },

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const items = await defaultSidebarItemsGenerator(args);
            function reorder(list: any[]): any[] {
              const docs = list.filter(i => i.type === 'doc');
              const cats = list.filter(i => i.type === 'category').map(c => ({
                ...c, items: reorder(c.items ?? []),
              }));
              const rest = list.filter(i => i.type !== 'doc' && i.type !== 'category');
              return [...docs, ...cats, ...rest];
            }
            return reorder(items);
          },
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: { respectPrefersColorScheme: true },
    mermaid: { theme: { light: 'neutral', dark: 'dark' } },
    navbar: {
      title: `🌐 ${SITE_TITLE}`,
      items: [
        {
          type: 'dropdown',
          label: 'L2/L3 라우팅',
          position: 'left',
          items: [
            { label: '01. Layer 2 스위칭', to: '/docs/layer2/intro' },
            { label: '02. OSPF', to: '/docs/ospf/intro' },
            { label: '03. EIGRP', to: '/docs/eigrp/intro' },
            { label: '04. BGP', to: '/docs/bgp/intro' },
            { label: '05. 경로 재배포 & 필터링', to: '/docs/route-policy/intro' },
          ],
        },
        {
          type: 'dropdown',
          label: 'WAN & 서비스',
          position: 'left',
          items: [
            { label: '06. MPLS', to: '/docs/mpls/intro' },
            { label: '07. SD-WAN', to: '/docs/sdwan/intro' },
          ],
        },
        {
          type: 'dropdown',
          label: '보안 & VPN',
          position: 'left',
          items: [
            { label: '08. 네트워크 보안', to: '/docs/security/intro' },
            { label: '09. VPN 기술', to: '/docs/vpn/intro' },
            { label: '10. 방화벽 (ASA/FTD)', to: '/docs/firewall/intro' },
          ],
        },
        {
          type: 'dropdown',
          label: '인프라 서비스',
          position: 'left',
          items: [
            { label: '11. QoS', to: '/docs/qos/intro' },
            { label: '12. IP 서비스', to: '/docs/ip-services/intro' },
            { label: '13. IPv6', to: '/docs/ipv6/intro' },
          ],
        },
        {
          type: 'dropdown',
          label: '자동화 & 설계',
          position: 'left',
          items: [
            { label: '14. 네트워크 자동화', to: '/docs/automation/intro' },
            { label: '15. 네트워크 설계', to: '/docs/design/intro' },
            { label: '16. 트러블슈팅', to: '/docs/troubleshooting/intro' },
          ],
        },
        {
          href: `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} ${SITE_TITLE}. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'python', 'yaml', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
