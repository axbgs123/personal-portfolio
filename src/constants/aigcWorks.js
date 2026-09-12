const aigcWorks = [
  {
    id: 'campus',
    title: '校园文创科技空间',
    category: '创亿鸭 · AI 视频',
    type: 'video',
    src: '/migrated-portfolio/ip/campus-cultural-tech-space.mp4',
    poster: '/migrated-posters/campus-cultural-tech-space.webp',
  },
  {
    id: 'ecommerce-traffic-ai',
    title: '电商引流',
    category: '创亿鸭 · AI 视频',
    type: 'video',
    src: '/aigc/videos/ecommerce-traffic.mp4',
    poster: '/aigc/videos/ecommerce-traffic.webp',
  },
  ...['01', '02', '03', '04'].map((number) => ({
    id: `zhaoyun-${number}`,
    title: `赵云作品 ${number}`,
    category: '赵云',
    group: 'zhaoyun',
    type: 'image',
    src: `/aigc/zhaoyun/${number}.webp`,
    hideTitle: true,
  })),
  ...['01', '02', '03', '04', '05', '06', '07', '08', '09'].map((number) => ({
    id: `lipstick-${number}`,
    title: `口红作品 ${number}`,
    category: '口红',
    group: 'lipstick',
    type: 'image',
    src: `/aigc/lipstick/${number}.webp`,
    hideTitle: true,
  })),
];
export default aigcWorks;
