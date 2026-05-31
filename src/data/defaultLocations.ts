import { TravelLocation } from '../types';

export const DEFAULT_LOCATIONS: TravelLocation[] = [
  {
    id: 'halong',
    name: 'Vịnh Hạ Long, Quảng Ninh',
    region: 'Miền Bắc',
    image: 'https://images.unsplash.com/photo-1524230507669-e29d737aa2ee?auto=format&fit=crop&q=80&w=1000',
    lat: 20.9101,
    lng: 107.1839,
    visited: false,
    notes: 'Kì quan thiên nhiên thế giới. Cần chuẩn bị vé tàu thăm vịnh trước, nên đi tour 2 ngày 1 đêm trên du thuyền để ngắm cảnh hoàng hôn cực đẹp.',
    plannedDate: '2026-08-15',
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    id: 'hoian',
    name: 'Phố Cổ Hội An, Quảng Nam',
    region: 'Miền Trung',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000',
    lat: 15.8801,
    lng: 108.3380,
    visited: true,
    notes: 'Khám phá khu phố đèn lồng lung linh về đêm. Ăn thử bánh mì Phượng, cao lầu Thanh và đi thuyền thả hoa đăng trên sông Hoài.',
    plannedDate: '2026-05-10',
    createdAt: new Date('2026-05-02').toISOString()
  },
  {
    id: 'sapa',
    name: 'Sa Pa, Lào Cai',
    region: 'Miền Bắc',
    image: 'https://images.unsplash.com/photo-1508215885820-4585e56135c8?auto=format&fit=crop&q=80&w=1000',
    lat: 22.3364,
    lng: 103.8438,
    visited: false,
    notes: 'Săn mây đỉnh Fansipan bằng cáp treo thế kỷ. Thăm bản Cát Cát của người H’Mông, thưởng thức đồ nướng Sa Pa và thắng cố nóng hổi trong buổi đêm lạnh lạnh.',
    plannedDate: '2026-11-20',
    createdAt: new Date('2026-05-03').toISOString()
  },
  {
    id: 'dalat',
    name: 'Thành Phố Đà Lạt, Lâm Đồng',
    region: 'Miền Nam',
    image: 'https://images.unsplash.com/photo-1583244532610-2a234e7c3eca?auto=format&fit=crop&q=80&w=1000',
    lat: 11.9404,
    lng: 108.4583,
    visited: false,
    notes: 'Thành phố ngàn hoa thanh bình và lãng mạn. Check-in hồ Tuyền Lâm, đồi chè Cầu Đất, tối dạo Chợ Đêm ăn bánh tráng nướng và súp cua ấm áp.',
    plannedDate: '2026-12-24',
    createdAt: new Date('2026-05-04').toISOString()
  },
  {
    id: 'phuquoc',
    name: 'Đảo Phú Quốc, Kiên Giang',
    region: 'Miền Nam',
    image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=1000',
    lat: 10.2289,
    lng: 103.9572,
    visited: false,
    notes: 'Ngắm hoàng hôn rực rỡ tại Sunset Sanato. Lặn ngắm san hô đảo Hòn Móng Tay, thưởng thức hải sản tươi ngon béo ngậy ở làng chài Hàm Ninh.',
    plannedDate: '2026-09-05',
    createdAt: new Date('2026-05-05').toISOString()
  },
  {
    id: 'danang',
    name: 'Bà Nà Hills & Cầu Vàng, Đà Nẵng',
    region: 'Miền Trung',
    image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=1000',
    lat: 15.9994,
    lng: 107.9969,
    visited: true,
    notes: 'Chụp ảnh với biểu tượng Cầu Vàng nổi tiếng thế giới nâng đỡ bởi đôi bàn tay khổng lồ bằng đá rêu phong kỳ vĩ giữa sương mù.',
    plannedDate: '2026-05-14',
    createdAt: new Date('2026-05-06').toISOString()
  },
  {
    id: 'hue',
    name: 'Cố Đô Huế, Thừa Thiên Huế',
    region: 'Miền Trung',
    image: 'https://images.unsplash.com/photo-1571401888144-cbdec62f474c?auto=format&fit=crop&q=80&w=1000',
    lat: 16.4697,
    lng: 107.5779,
    visited: false,
    notes: 'Tham quan Kinh Thành Huế cổ kính giàu lịch sử, lăng tẩm triều Nguyễn. Đi nghe ca Huế trên sông Hương thơ mộng buổi tối và ăn bún bò Huế gốc.',
    plannedDate: '2026-10-10',
    createdAt: new Date('2026-05-07').toISOString()
  },
  {
    id: 'saigon',
    name: 'Nhà Thờ Đức Bà & Dinh Độc Lập, Sài Gòn',
    region: 'Miền Nam',
    image: 'https://images.unsplash.com/photo-1546268039-d53dd41ba098?auto=format&fit=crop&q=80&w=1000',
    lat: 10.7798,
    lng: 106.6990,
    visited: true,
    notes: 'Thành phố náo nhiệt chuyển động không ngừng nghỉ. Buổi sáng làm ly cà phê bệt gần Nhà thờ Đức Bà, chiều tối lên xe bus hai tầng ngắm toàn cảnh thành phố.',
    plannedDate: '2026-01-01',
    createdAt: new Date('2026-05-08').toISOString()
  }
];

export const REGION_CATEGORIES = ['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Nước ngoài'];

export const BEAUTIFUL_PRESETS = [
  {
    name: 'Hải Đăng Kê Gà, Bình Thuận',
    region: 'Miền Nam',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
    lat: 10.6974,
    lng: 107.9942,
    notes: 'Ngọn hải đăng cổ nhất Việt Nam kiến trúc đá tuyệt đẹp dạt dào sóng vỗ.'
  },
  {
    name: 'Mũi Né, Phan Thiết',
    region: 'Miền Nam',
    image: 'https://images.unsplash.com/photo-1541943181603-d8fe267a5dcf?auto=format&fit=crop&q=80&w=600',
    lat: 10.9412,
    lng: 108.3012,
    notes: 'Những đồi cát bay đỏ khổng lồ ôm trọn biển xanh màu ngọc bích.'
  },
  {
    name: 'Đèo Hải Vân, Đà Nẵng',
    region: 'Miền Trung',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?auto=format&fit=crop&q=80&w=600',
    lat: 16.1873,
    lng: 108.1311,
    notes: 'Cung đèo hiểm trở hùng vĩ bậc nhất thế giới ngắm bao trọn Vịnh Lăng Cô.'
  },
  {
    name: 'Vườn Quốc Gia Phong Nha Kẻ Bàng',
    region: 'Miền Trung',
    image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600',
    lat: 17.5317,
    lng: 106.2691,
    notes: 'Vương quốc hang động thạch nhũ huyền ảo và thảm thực động vật cực quý hiếm.'
  },
  {
    name: 'Tokyo, Nhật Bản',
    region: 'Nước ngoài',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=600',
    lat: 35.6762,
    lng: 139.6503,
    notes: 'Khu phố rực rỡ đèn neon Shinjuku và tháp truyền hình Tokyo chọc trời.'
  },
  {
    name: 'Paris, Pháp',
    region: 'Nước ngoài',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600',
    lat: 48.8566,
    lng: 2.3522,
    notes: 'Dạo bước lãng mạn bên bờ sông Seine thơ mộng ngắm tháp Eiffel rực sáng.'
  }
];
