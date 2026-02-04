export const mockUser = {
    name: "Nguyễn Văn A",
    avatar: "/images/avatar.png",
    role: "Admin"
};

export const mockPosts = [
    {
        id: 1,
        title: "Bài viết về công nghệ",
        description: "Đây là bài viết thử nghiệm về React và JSX",
        category: "Công nghệ",
        image: "/images/post1.jpg",
        created_at: "2025-02-01",
        author: "Hoàng Nguyễn",
        content: `
      <p>React là một thư viện JavaScript rất mạnh mẽ.</p>
      <p>Nó giúp xây dựng giao diện người dùng một cách dễ dàng.</p>
    `
    },
    {
        id: 2,
        title: "Hướng dẫn học lập trình",
        description: "Các bước cơ bản để học lập trình hiệu quả",
        category: "Giáo dục",
        image: "/images/post2.jpg",
        created_at: "2025-01-28",
        author: "Admin",
        content: `
      <p>Bắt đầu với HTML, CSS và JavaScript.</p>
      <p>Sau đó học React hoặc Vue.</p>
    `
    },
    {
        id: 3,
        title: "Tin tức thể thao",
        description: "Cập nhật tin tức thể thao mới nhất",
        category: "Thể thao",
        image: "/images/post3.jpg",
        created_at: "2025-01-20",
        author: "Biên tập viên",
        content: `
      <p>Hôm nay có rất nhiều trận đấu hấp dẫn.</p>
    `
    }
];

export const mockCategories = [
    "Tất cả",
    "Công nghệ",
    "Thể thao",
    "Giáo dục",
    "Giải trí"
];
export const mockEditorData = {
    title: "Tiêu đề bài viết mẫu",
    description: "Đây là mô tả ngắn cho bài viết mẫu",
    content: "Nội dung bài viết sẽ được hiển thị ở đây",
    category: "Công nghệ",
    image: null
};
