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

export interface SuggestedSpot {
  name: string;
  region: string;
  image: string;
  lat: number;
  lng: number;
  notes: string;
}

export interface FamousDestination {
  id: string;
  cityName: string;
  region: string;
  spots: SuggestedSpot[];
}

export const FAMOUS_DESTINATIONS: FamousDestination[] = [
  {
    id: 'dalat',
    cityName: 'Đà Lạt',
    region: 'Miền Nam',
    spots: [
      {
        name: 'Hồ Xuân Hương, Đà Lạt',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1549441113-1b9134bb3240?auto=format&fit=crop&q=80&w=600',
        lat: 11.9421,
        lng: 108.4410,
        notes: 'Trái tim thơ mộng của Đà Lạt. Buổi sáng sớm dạo hồ ngắm sương mù lãng đãng hoặc thuê xe đạp đôi dạo quanh cực chill.'
      },
      {
        name: 'Đồi Chè Cầu Đất, Đà Lạt',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&q=80&w=600',
        lat: 11.8545,
        lng: 108.5678,
        notes: 'Thiên đường săn mây tuyệt diệu. Nên xuất phát từ 4h30-5h00 sáng để cảm nhận biển mây bồng bềnh phủ tràn núi đồi.'
      },
      {
        name: 'Thác Datanla, Đà Lạt',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&q=80&w=600',
        lat: 11.9022,
        lng: 108.4491,
        notes: 'Địa điểm trải nghiệm máng trượt xuyên thác uốn lượn kỳ thú nức tiếng bên những tán rừng rậm rạp hoang sơ.'
      },
      {
        name: 'Chùa Linh Phước, Đà Lạt',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&q=80&w=600',
        lat: 11.9424,
        lng: 108.4981,
        notes: 'Chùa Ve Chai trứ danh khảm sành tinh xảo. Check-in tượng rồng vỏ chai bia hoành tráng và tháp chuông uy nghiêm.'
      },
      {
        name: 'Thung Lũng Tình Yêu, Đà Lạt',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=600',
        lat: 11.9793,
        lng: 108.4552,
        notes: 'Thung lũng thơ mộng ngập tràn hoa ôn đới bao bọc bởi đồi thông reo và hồ nước trong vắt lãng mạn vô vàn.'
      }
    ]
  },
  {
    id: 'buonmathuot',
    cityName: 'Buôn Ma Thuột',
    region: 'Miền Trung',
    spots: [
      {
        name: 'Bảo tàng Thế giới Cà phê, Buôn Ma Thuột',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
        lat: 12.6960,
        lng: 108.0535,
        notes: 'Bảo tàng thế giới cà phê biểu tượng với kiến trúc nhà rông cách điệu Tây Nguyên tuyệt đẹp và bộ sưu tập cafe cổ vật quý giá.'
      },
      {
        name: 'Thác Dray Nur, Đắk Lắk',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=600',
        lat: 12.5414,
        lng: 107.9022,
        notes: 'Ngọn thác hùng vĩ bậc nhất vùng đất Tây Nguyên đỏ lửa, bọt nước tung trắng xóa thơ mộng dữ dội ôm trọn vách đá đại ngàn.'
      },
      {
        name: 'Khu du lịch Bản Đôn (Buôn Đôn), Đắk Lắk',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1582236371727-b505c1ab5bc9?auto=format&fit=crop&q=80&w=600',
        lat: 12.8368,
        lng: 107.7845,
        notes: 'Khám phá thủ phủ voi rừng nổi tiếng cùng nếp nhà sàn cổ bằng gỗ độc đáo mang tên tuổi vương quốc thuần dưỡng voi.'
      },
      {
        name: 'Chùa Sắc Tứ Khải Đoan, Buôn Ma Thuột',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=600',
        lat: 12.6917,
        lng: 108.0494,
        notes: 'Ngôi chùa cổ tự uy nghi lớn nhất Đắk Lắk pha trộn tinh tế phong cách nhà rông Tây Nguyên cùng nét cung đình Huế cổ kính.'
      }
    ]
  },
  {
    id: 'hanoi',
    cityName: 'Hà Nội',
    region: 'Miền Bắc',
    spots: [
      {
        name: 'Hồ Hoàn Kiếm, Hà Nội',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1509060464153-4466739f7840?auto=format&fit=crop&q=80&w=600',
        lat: 21.0285,
        lng: 105.8522,
        notes: 'Biểu tượng kinh kỳ ngàn năm văn hiến. Ngắm Tháp Rùa huyền sử cổ kính, đi cầu Thê Húc đỏ tươi đón nắng mai vàng.'
      },
      {
        name: 'Phố Cổ Hà Nội, Hoàn Kiếm',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
        lat: 21.0372,
        lng: 105.8496,
        notes: 'Nét văn hóa 36 phố phường sôi động tấp nập. Phải ăn thử tô Bún Chả đậm đà và cốc cà phê trứng béo ngậy nức mũi.'
      },
      {
        name: 'Văn Miếu Quốc Tử Giám, Hà Nội',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=600',
        lat: 21.0293,
        lng: 105.8359,
        notes: 'Trường Đại Học đầu tiên của Việt Nam, chứa dựng bao di tích bia tiến sĩ rùa đá tôn vinh tinh thần hiếu học dân tộc.'
      },
      {
        name: 'Lăng Bác & Chùa Một Cột, Hà Nội',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1562914319-6bc4131235b6?auto=format&fit=crop&q=80&w=600',
        lat: 21.0357,
        lng: 105.8335,
        notes: 'Nơi yên nghỉ vĩnh hằng của chủ tịch Hồ Chí Minh vĩ đại, ghé qua chiêm bái Chùa Một Cột hình hoa sen diệu lộng.'
      },
      {
        name: 'Hồ Tây & Chùa Trấn Quốc, Hà Nội',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600',
        lat: 21.0478,
        lng: 105.8365,
        notes: 'Ngôi chùa cổ nhất Việt Nam hơn 1500 năm tuổi gối đầu uy nghiêm bên sóng rộng mênh mông trữ tình lúc chiều tà.'
      }
    ]
  },
  {
    id: 'danang',
    cityName: 'Đà Nẵng & Hội An',
    region: 'Miền Trung',
    spots: [
      {
        name: 'Cầu Vàng (Bà Nà Hills), Đà Nẵng',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=1000',
        lat: 15.9994,
        lng: 107.9969,
        notes: 'Kỳ quan sống ảo mang tầm thế giới với bàn tay rêu phong khổng lồ bồng bềnh dệt lụa trong không gian sương mờ mờ.'
      },
      {
        name: 'Phố Cổ Hội An, Quảng Nam',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000',
        lat: 15.8801,
        lng: 108.3380,
        notes: 'Trải ngập đèn lồng lung linh và nhịp chèo mộc mạc đưa thuyền gỗ trôi xuôi thả hoa đăng cầu may mắn trên dòng sông Hoài.'
      },
      {
        name: 'Chùa Linh Ứng (Sơn Trà), Đà Nẵng',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=600',
        lat: 16.1009,
        lng: 108.2778,
        notes: 'Nơi thờ bức tượng mẹ Quan Âm sừng sững cao nhất Việt Nam ngắm sóng vỗ biển xanh chan chứa phúc lộc lồng lộng.'
      },
      {
        name: 'Ngũ Hành Sơn, Đà Nẵng',
        region: 'Miền Trung',
        image: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?auto=format&fit=crop&q=80&w=600',
        lat: 16.0028,
        lng: 108.2636,
        notes: 'Quần sơn ngũ hành huyền bí trầm mặc chứa đựng hang động Huyền Không rọi linh quang hào diệu đầy thanh tịnh.'
      }
    ]
  },
  {
    id: 'sapa',
    cityName: 'Sa Pa',
    region: 'Miền Bắc',
    spots: [
      {
        name: 'Đỉnh Fansipan, Sa Pa',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1508215885820-4585e56135c8?auto=format&fit=crop&q=80&w=1000',
        lat: 22.3364,
        lng: 103.8438,
        notes: 'Nóc nhà Đông Dương tuyết sương huyền diệu. Trải nghiệm chạm tay mốc son kỳ lục đất Việt đầy tự hào.'
      },
      {
        name: 'Bản Cát Cát, Sa Pa',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1541943181603-d8fe267a5dcf?auto=format&fit=crop&q=80&w=600',
        lat: 22.3275,
        lng: 103.8340,
        notes: 'Bản người Mông nguyên dã ấm áp. Hãy thuê các bộ đồ dệt thổ cẩm xinh đẹp chụp hình bên suối Tiên Sa rì rào.'
      },
      {
        name: 'Đèo Ô Quy Hồ, Lai Châu/Lào Cai',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=1000',
        lat: 22.3551,
        lng: 103.7745,
        notes: 'Một trong tứ đại đỉnh đèo hiểm yếu nhưng hùng vĩ cuốn hút bậc nhất Việt Nam ngắm lộng lẫy thung lũng mây giăng.'
      }
    ]
  },
  {
    id: 'halong',
    cityName: 'Vịnh Hạ Long',
    region: 'Miền Bắc',
    spots: [
      {
        name: 'Đảo Ti Tốp, Vịnh Hạ Long',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1524230507669-e29d737aa2ee?auto=format&fit=crop&q=80&w=600',
        lat: 20.8494,
        lng: 107.0801,
        notes: 'Hòn đảo có bãi tắm vầng trăng khuyết xanh ngọc và đài vọng cảnh vạn người mê trên đỉnh thu trọn vịnh tuyệt mỹ.'
      },
      {
        name: 'Hang Sửng Sốt, Vịnh Hạ Long',
        region: 'Miền Bắc',
        image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600',
        lat: 20.8418,
        lng: 107.0898,
        notes: 'Động thạch nhũ lộng lẫy to lớn nhất vịnh, đi sâu vào lòng hang bạn sẽ ngỡ ngàng như du hành thế giới tiền sử huyền bí.'
      }
    ]
  },
  {
    id: 'phuquoc',
    cityName: 'Phú Quốc',
    region: 'Miền Nam',
    spots: [
      {
        name: 'Bãi Sao, Phú Quốc',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=1000',
        lat: 10.0633,
        lng: 104.0325,
        notes: 'Tận hưởng bãi cát trắng mịn như kem và rặng dừa nghiêng nghiêng đu đưa đón gió biển hiền hòa dìu dịu.'
      },
      {
        name: 'Sunset Sanato, Phú Quốc',
        region: 'Miền Nam',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
        lat: 10.1504,
        lng: 103.9682,
        notes: 'Khu bãi biển ngắm hoàng hôn rực rỡ nghệ thuật với các mô hình tượng voi chân dài, sứa bay độc đáo vươn mình.'
      }
    ]
  },
  {
    id: 'nuocngoai',
    cityName: 'Nước Ngoài',
    region: 'Nước ngoài',
    spots: [
      {
        name: 'Tháp Eiffel, Paris (Pháp)',
        region: 'Nước ngoài',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600',
        lat: 48.8584,
        lng: 2.2945,
        notes: 'Biểu tượng kinh đô ánh sáng rực rỡ lấp lánh mỗi góc phố mộng mơ lãng mạn dạo bước sông Seine tao nhã.'
      },
      {
        name: 'Đền Angkor Wat, Campuchia',
        region: 'Nước ngoài',
        image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&q=80&w=600',
        lat: 13.4125,
        lng: 103.8670,
        notes: 'Kiến trúc đền đài vĩ đại bí sử với những rễ cây gắm chặt cổ thành đầy rêu phong huyền ảo chứa bao tích xưa.'
      }
    ]
  }
];

// For backward compatibility keep the original array declaration but mapping to the first items
export const BEAUTIFUL_PRESETS = [
  ...FAMOUS_DESTINATIONS[0].spots,
  ...FAMOUS_DESTINATIONS[1].spots,
  ...FAMOUS_DESTINATIONS[2].spots
].slice(0, 6);
