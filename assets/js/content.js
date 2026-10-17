// Default home-page content. The admin overrides any section through the API;
// these values are shown whenever a section was never saved or the API is unreachable.
// Text fields are either a plain string or { en, vn } (vn falls back to en when empty).

export const SITE_DEFAULTS = {
  hero: {
    status: { en: 'Available for new opportunities', vn: 'Sẵn sàng cho cơ hội mới' },
    name: 'Nguyen Nhat Bang',
    role: { en: 'AI Engineer', vn: 'Kỹ sư AI' },
    claim: {
      en: 'Building scalable LLM architectures, computer vision systems, and autonomous agents for next-generation digital ecosystems.',
      vn: 'Xây dựng kiến trúc LLM có khả năng mở rộng, hệ thống thị giác máy tính và các AI agent tự trị cho hệ sinh thái kỹ thuật số thế hệ mới.'
    },
    // Empty href = the active CV (social.cvUrl, managed on the admin Resume / CV page).
    primaryCta: { label: { en: 'Download CV', vn: 'Tải CV' }, href: '' },
    secondaryCta: { label: { en: 'Contact me', vn: 'Liên hệ' }, href: '/contact' }
  },
  about: {
    title: { en: 'About me & experience', vn: 'Giới thiệu & kinh nghiệm' },
    intro: {
      en: 'AI Engineer transitioning from no-code workflows to pure-code AI development. Experienced in building ML/DL models, custom LLM architectures (DeepSeek), Speech-to-Text pipelines, and scalable FastAPI microservices.',
      vn: 'Kỹ sư AI chuyển đổi từ quy trình làm việc no-code sang phát triển AI pure-code. Có kinh nghiệm xây dựng các mô hình ML/DL, kiến trúc LLM tùy chỉnh (DeepSeek), đường ống Speech-to-Text và các microservices FastAPI có khả năng mở rộng.'
    },
    experience: [
      {
        role: { en: 'AI Engineer', vn: 'Kỹ sư AI' },
        org: '10 Group Vietnam',
        period: 'Jul 2025 – Dec 2025',
        place: 'Remote, Part-time',
        description: {
          en: 'Developed internal and sales chatbots using n8n and LangGraph. Managed PostgreSQL, Cassandra, and ScyllaDB integrations. Built the core backend system for RAG-based chatbot responses.',
          vn: 'Phát triển chatbot nội bộ và bán hàng sử dụng n8n và LangGraph. Quản lý tích hợp PostgreSQL, Cassandra, và ScyllaDB. Xây dựng hệ thống backend cốt lõi cho phản hồi chatbot dựa trên RAG.'
        }
      },
      {
        role: { en: 'Data Scientist / AI Automation Intern', vn: 'Thực tập sinh Khoa học Dữ liệu / Tự động hóa AI' },
        org: 'Insight Data',
        period: 'Aug 2025 – Dec 2025',
        place: 'Hanoi, Vietnam',
        description: {
          en: 'Built ML models for house price forecasting, internal company chatbots, rule-based agents, and a CV parsing chatbot.',
          vn: 'Xây dựng các mô hình ML để dự báo giá nhà, chatbot nội bộ công ty, hệ thống agent dựa trên luật và chatbot phân tích CV.'
        }
      },
      {
        role: { en: 'Computer Vision Data Annotator', vn: 'Gắn nhãn dữ liệu thị giác máy tính' },
        org: 'Alchera Vietnam',
        period: 'Sep 2025 – Oct 2025',
        place: 'Remote, Freelance',
        description: {
          en: 'Annotated parking spaces in Korean image datasets, bounding boxes with LiDAR data, ensuring high accuracy.',
          vn: 'Chú thích bãi đậu xe trong tập dữ liệu hình ảnh Hàn Quốc, vẽ bounding box với dữ liệu LiDAR, đảm bảo độ chính xác cao.'
        }
      }
    ]
  },
  projects: {
    title: { en: 'Featured projects', vn: 'Dự án nổi bật' },
    items: [
      {
        name: 'Invera',
        url: 'https://github.com/Lilkremxxxx/Invera-AI_Interview_Practice_Platform',
        badge: 'Current',
        role: 'Tech Lead / AI Engineer',
        period: 'Jan 2026 – Present',
        stack: ['Python', 'FastAPI', 'DeepSeek LLM', 'Vosk', 'MediaPipe'],
        bullets: [
          { en: 'Developed a full-stack AI-powered mock interview platform for realistic video interview simulations.', vn: 'Phát triển nền tảng phỏng vấn mô phỏng tích hợp AI full-stack để phỏng vấn video chân thực.' },
          { en: 'Architected scalable AI microservices within FastAPI backend, serving DeepSeek and Vosk models.', vn: 'Thiết kế microservices AI có khả năng mở rộng trong backend FastAPI, phục vụ mô hình DeepSeek và Vosk.' },
          { en: 'Engineered advanced prompt pipelines and scoring algorithms to automatically analyze transcripts and provide feedback.', vn: 'Lập trình các luồng prompt nâng cao và thuật toán chấm điểm để tự động phân tích bản ghi và cung cấp phản hồi.' },
          { en: 'Built data ingestion pipelines using MediaPipe and NLP to clean STT artifacts.', vn: 'Xây dựng các luồng thu thập dữ liệu bằng MediaPipe và NLP để làm sạch kết quả STT.' }
        ]
      },
      {
        name: 'Verba',
        url: 'https://github.com/Lilkremxxxx/Verba-AI-Meeting-Recognition',
        badge: '',
        role: 'Tech Lead / AI Engineer',
        period: 'Jan 2026 – Apr 2026',
        stack: ['Python', 'FastAPI', 'PostgreSQL', 'PhoWhisper', 'Gemini API'],
        bullets: [
          { en: 'Users register, upload meeting audio, track processing, and use a synchronized player to edit/export results.', vn: 'Người dùng đăng ký, tải lên âm thanh cuộc họp, theo dõi quá trình xử lý và sử dụng trình phát đồng bộ để chỉnh sửa/xuất kết quả.' },
          { en: 'Integrated PhoWhisper/faster-whisper for speech-to-text, stored in PostgreSQL.', vn: 'Tích hợp PhoWhisper/faster-whisper để chuyển đổi giọng nói thành văn bản, lưu trữ trong PostgreSQL.' },
          { en: 'Speech is summarized via Gemini API into summary, decisions, tasks, and deadlines.', vn: 'Giọng nói được tóm tắt qua Gemini API thành tóm tắt, quyết định, công việc và thời hạn.' }
        ]
      }
    ]
  },
  skills: {
    title: { en: 'Technical skills', vn: 'Kỹ năng kỹ thuật' },
    groups: [
      { name: 'Languages', items: ['Python', 'C++', 'SQL'] },
      { name: 'AI & Machine Learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'LangGraph', 'RAG'] },
      { name: 'Data Science & CV', items: ['Pandas', 'NumPy', 'Matplotlib', 'MediaPipe'] },
      { name: 'Backend, DB & Tools', items: ['FastAPI', 'PostgreSQL', 'ScyllaDB', 'Docker', 'Git'] }
    ]
  },
  education: {
    title: { en: 'Education', vn: 'Học vấn' },
    schools: [
      { name: 'FPT University', location: 'Hanoi, Vietnam', degree: { en: 'Bachelor of Artificial Intelligence', vn: 'Cử nhân Trí tuệ Nhân tạo' }, period: 'Oct 2023 – Dec 2027' },
      { name: 'Hanoi University', location: 'Hanoi, Vietnam', degree: { en: 'Bachelor of Arts in English Language', vn: 'Cử nhân Ngôn ngữ Anh' }, period: 'Oct 2024 – Dec 2028' }
    ],
    certTitle: { en: 'Certifications', vn: 'Chứng chỉ' },
    certifications: [
      { name: 'Deep Learning', url: 'https://www.coursera.org/account/accomplishments/specialization/R0H3228D8BIW' },
      { name: 'Natural Language Processing', url: 'https://www.coursera.org/account/accomplishments/specialization/7ZKMSIDH9BME' },
      { name: 'IBM Introduction to Machine Learning', url: 'https://www.coursera.org/account/accomplishments/specialization/8SF9DW8VCNVD' },
      { name: 'KS57_1_Digital Ecosystem: From Governance to Business', url: 'https://www.coursera.org/account/accomplishments/badge/o42QDBg9SEiNkAwYPahIww' },
      { name: 'KS57_2_Key Activities of Digital Transformation', url: 'https://www.coursera.org/account/accomplishments/badge/InW0A-xTSpe1tAPsU7qXnQ' },
      { name: 'Fundamentals of Deep Learning', url: '/nvidia_dl.pdf' }
    ]
  },
  contact: {
    title: { en: 'Get in touch', vn: 'Liên hệ' },
    intro: { en: 'Open to AI Engineer roles and collaborations.', vn: 'Sẵn sàng cho vị trí AI Engineer và các dự án hợp tác.' },
    phone: '0345535911',
    phoneLabel: { en: 'Phone / Zalo', vn: 'Điện thoại / Zalo' },
    email: 'nhatbang.work@gmail.com',
    facebookLabel: 'Bằng Nguyễn',
    facebookUrl: 'https://www.facebook.com/dangtimrieulop/',
    closing: { en: 'Thanks for watching my portfolio', vn: 'Cảm ơn vì đã xem portfolio' }
  },
  // Blog listing: pinned posts show first in this order; hidden posts stay reachable by URL but leave the lists.
  blog: {
    featured: ['healthcare-stroke-prediction', 'lung-cancer-aff-cpp-inference'],
    hidden: ['welcome-to-my-blog']
  },
  social: {
    cvUrl: '/Nguyen_Nhat_Bang_AI_Engineer.pdf',
    github: 'https://github.com/Lilkremxxxx',
    linkedin: 'https://www.linkedin.com/in/nhatbang/',
    facebook: 'https://www.facebook.com/dangtimrieulop/'
  }
};

export const SECTION_KEYS = Object.keys(SITE_DEFAULTS);

// Interface strings (not admin-editable).
export const UI = {
  en: {
    nav_about: 'About', nav_work: 'Work', nav_skills: 'Skills', nav_education: 'Education', nav_blog: 'Blog', nav_contact: 'Contact',
    resume: 'Resume', lang_switch: 'Tiếng Việt', lang_short: 'VN',
    view_repo: 'View on GitHub', experience: 'Experience',
    writing: 'Latest writing', all_posts: 'All posts', blog_title: 'Writing', blog_intro: 'Paper-style notes on the models I build: method, evidence, and what I would change next.',
    min_read: 'min read', back_to_blog: 'All posts', next_post: 'Next', contents: 'Contents',
    loading_posts: 'Loading posts…', posts_failed: 'Posts could not be loaded right now.', retry: 'Try again', no_posts: 'No posts published yet.',
    post_failed: 'This article could not be loaded.', not_found: 'This article does not exist or is not published.',
    copy_email: 'Copy email', copied: 'Copied', email: 'Email', phone: 'Phone', certificates: 'Certificates', open: 'Open',
    footer_rights: 'AI Engineer portfolio', skip: 'Skip to content', menu: 'Menu', now: 'Now', based: 'Based in'
  },
  vn: {
    nav_about: 'Giới thiệu', nav_work: 'Dự án', nav_skills: 'Kỹ năng', nav_education: 'Học vấn', nav_blog: 'Blog', nav_contact: 'Liên hệ',
    resume: 'Hồ sơ', lang_switch: 'English', lang_short: 'EN',
    view_repo: 'Xem trên GitHub', experience: 'Kinh nghiệm',
    writing: 'Bài viết mới', all_posts: 'Tất cả bài viết', blog_title: 'Bài viết', blog_intro: 'Ghi chép kiểu paper về các mô hình tôi xây dựng: phương pháp, kết quả và điều sẽ cải thiện tiếp.',
    min_read: 'phút đọc', back_to_blog: 'Tất cả bài viết', next_post: 'Tiếp', contents: 'Mục lục',
    loading_posts: 'Đang tải bài viết…', posts_failed: 'Chưa tải được bài viết.', retry: 'Thử lại', no_posts: 'Chưa có bài viết nào.',
    post_failed: 'Không tải được bài viết này.', not_found: 'Bài viết không tồn tại hoặc chưa được xuất bản.',
    copy_email: 'Sao chép email', copied: 'Đã sao chép', email: 'Email', phone: 'Điện thoại', certificates: 'Chứng chỉ', open: 'Mở',
    footer_rights: 'Portfolio AI Engineer', skip: 'Bỏ qua tới nội dung', menu: 'Menu', now: 'Hiện tại', based: 'Nơi ở'
  }
};

export function localize(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String((lang === 'vn' && value.vn) || value.en || '');
  }
  return String(value ?? '');
}

// Saved sections replace defaults key by key, so a partial save never blanks other fields.
export function mergeSections(saved = {}) {
  const merged = {};
  for (const key of SECTION_KEYS) {
    const stored = saved[key]?.data;
    merged[key] = stored && typeof stored === 'object' ? { ...SITE_DEFAULTS[key], ...stored } : SITE_DEFAULTS[key];
  }
  return merged;
}
