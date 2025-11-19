# Tài liệu Yêu cầu Sản phẩm: TaskHaha

## 1. Tổng quan

TaskHaha là một ứng dụng quản lý công việc thông minh theo phương pháp Kanban và lịch, tích hợp trợ lý AI được cung cấp bởi Gemini để tạo và truy vấn công việc thông qua trò chuyện bằng ngôn ngữ tự nhiên. Ứng dụng được thiết kế để cung cấp một cách liền mạch và trực quan để tổ chức quy trình làm việc, quản lý dự án cá nhân và theo sát các deadline, với giao diện chuyên biệt cho cả người dùng máy tính và di động.

### Kiến trúc Lưu trữ Dữ liệu:
Ứng dụng sử dụng một kiến trúc lưu trữ kết hợp:
- **Khi triển khai trên Vercel:** Dữ liệu được lưu trữ một cách bền bỉ thông qua một Hàm Serverless, giao tiếp với cơ sở dữ liệu Vercel KV (được cung cấp bởi Upstash). Điều này đảm bảo dữ liệu của bạn được an toàn và đồng bộ trên các phiên làm việc.
- **Trong các môi trường khác (ví dụ: phát triển cục bộ, AI Studio):** Ứng dụng sẽ tự động chuyển sang sử dụng `localStorage` của trình duyệt để lưu trữ tất cả dữ liệu. Điều này cho phép ứng dụng hoạt động đầy đủ mà không cần kết nối backend.

## 2. Các Tính năng Cốt lõi

### 2.1. Quản lý & Tổ chức Công việc

Ứng dụng được xây dựng xung quanh một hệ thống công việc linh hoạt, cung cấp nhiều cách để tổ chức và hiển thị công việc.

- **Bộ sưu tập Công việc:** Tất cả các công việc phải thuộc về bộ sưu tập 'Công việc' (Work) hoặc 'Cuộc sống' (Life), cung cấp sự tách biệt rõ ràng giữa trách nhiệm nghề nghiệp và cá nhân. Một bộ lọc chung ở phần đầu trang cho phép người dùng tập trung vào một bộ sưu tập tại một thời điểm.
- **Gắn thẻ & Lọc Công việc:** Các công việc có thể được gán nhiều thẻ mô tả (ví dụ: #design, #urgent). Một thanh lọc cho phép người dùng hiển thị động chỉ những công việc khớp với các thẻ đã chọn.
- **Màu sắc Công việc:** Người dùng có thể gán một màu sắc nổi bật tùy chọn (đỏ, vàng, xanh mòng két, hoặc hồng) cho các công việc để ưu tiên hoặc phân loại trực quan. Màu này có thể nhìn thấy trên tất cả các chế độ xem liên quan.

### 2.2. Các Chế độ Xem Công việc

Ứng dụng cung cấp nhiều chế độ xem để phục vụ các sở thích quy trình làm việc khác nhau. Tất cả dữ liệu công việc đều được lưu trữ và chia sẻ trên tất cả các chế độ xem.

- **Chế độ xem Mặc định (Desktop)**: Ứng dụng mở ra **Chế độ xem Tuần** theo mặc định trên máy tính.
- **Thứ tự Điều hướng (Desktop)**: Thứ tự điều hướng chế độ xem chính như sau: **Danh sách, Tuần, Lịch, Kanban, Ghi chú**.

#### 2.2.1. Chế độ xem Danh sách
Một định dạng danh sách công việc cần làm truyền thống.
- Các công việc được nhóm và sắp xếp theo ngày hết hạn.
- Các công việc không có ngày hết hạn được nhóm riêng ở cuối.
- Người dùng có thể nhanh chóng thay đổi trạng thái của một công việc (`Cần làm`, `Đang thực hiện`, `Hoàn thành`) thông qua một menu thả xuống trên mỗi mục.

#### 2.2.2. Chế độ xem Tuần (Chỉ cho Desktop)
Một cái nhìn tổng quan về các ngày sắp tới.
- **Số ngày có thể điều chỉnh**: Người dùng có thể điều chỉnh động số ngày trong tương lai được hiển thị, từ 1 đến 8 (cho tổng số ngày xem từ 3 đến 10, bao gồm cả hôm qua và hôm nay).
- **Bố cục Kép**: Chế độ xem này có thể được chuyển đổi giữa:
    - **Bố cục Đơn giản:** Một bố cục dạng cột cho mỗi ngày, hiển thị các thẻ công việc.
    - **Bố cục Lưới:** Một chế độ xem bảng theo khung giờ, tổ chức các công việc vào các khối thời gian được xác định trước trong ngày.
- Hỗ trợ kéo và thả để sắp xếp lại lịch trình công việc sang các ngày khác nhau.
- Một nút '+' trên mỗi ngày cho phép tạo nhanh công việc cho ngày cụ thể đó.

#### 2.2.3. Chế độ xem Lịch (Chỉ cho Desktop)
Một giao diện lịch nhiều tuần.
- Hiển thị các công việc trên một lưới lịch 3 tuần.
- Hỗ trợ kéo và thả để sắp xếp lại lịch trình công việc.
- Cung cấp điều hướng để chuyển đến các giai đoạn 3 tuần trước đó hoặc tiếp theo.

#### 2.2.4. Chế độ xem Kanban (Chỉ cho Desktop)
Một bảng để trực quan hóa quy trình làm việc, lý tưởng cho việc quản lý dự án.
- Các cột đại diện cho các trạng thái công việc: `Cần làm`, `Đang thực hiện`, `Hoàn thành`.
- Các công việc được biểu diễn dưới dạng thẻ có thể được kéo và thả giữa các cột.
- **Bộ lọc Ngày Tương lai**: Người dùng có thể điều chỉnh một bộ lọc để kiểm soát số ngày trong tương lai mà các công việc được hiển thị trên bảng, ngăn chặn sự lộn xộn từ các mục dài hạn.

#### 2.2.5. Chế độ xem Ghi chú (Chỉ cho Desktop)
Một không gian dành riêng cho các ghi chú và ý tưởng tự do.
- Một bố cục hai ô với danh sách các ghi chú ở bên trái và nội dung của ghi chú đã chọn ở bên phải.
- Người dùng có thể tạo, chỉnh sửa, xóa và đặt tiêu đề cho ghi chú.
- Nội dung được lưu tự động khi người dùng gõ.

### 2.3. Trợ lý AI (Hỗ trợ bởi Gemini)

Một AI đàm thoại được tích hợp vào ứng dụng để hợp lý hóa việc quản lý công việc.

- **Chế độ Trò chuyện Kép**: Trợ lý hoạt động ở hai chế độ riêng biệt:
    - **Chế độ Công việc:** Chế độ chính để quản lý công việc. AI có thể sử dụng các lệnh gọi hàm (function calls) để tạo, cập nhật và xóa công việc dựa trên yêu cầu của người dùng.
    - **Chế độ Trò chuyện:** Một chế độ đàm thoại cho các cuộc thảo luận và lập kế hoạch chung. Ở chế độ này, AI không thể thực hiện hành động nhưng có thể trò chuyện tự do.
- **Xử lý Ngôn ngữ Tự nhiên**: Người dùng có thể quản lý công việc bằng ngôn ngữ thông thường.
- **Đề xuất Kế hoạch**: Đối với các yêu cầu phức tạp liên quan đến nhiều bước, AI đề xuất một kế hoạch (danh sách các hành động tạo, cập nhật và xóa) mà người dùng phải xem xét và xác nhận trước khi thực hiện.
- **Nhận thức theo Ngữ cảnh**: AI nhận biết được danh sách công việc hiện tại, thông tin hồ sơ do người dùng cung cấp, các quy tắc tùy chỉnh và bất kỳ bộ lọc **Bộ sưu tập** hoặc **Thẻ** nào đang hoạt động. Nó sẽ tự động áp dụng các bộ lọc này làm thuộc tính cho bất kỳ công việc mới nào được tạo.
- **Hiển thị Markdown**: Các phản hồi từ trợ lý AI được hiển thị với hỗ trợ Markdown cơ bản (in đậm, in nghiêng, mã nội tuyến và xuống dòng).
- **Bắt đầu lại Cuộc trò chuyện**: Một nút "Cuộc trò chuyện mới" cho phép người dùng xóa lịch sử trò chuyện hiện tại.
- **Cá nhân hóa & Quy tắc (Chỉ cho Desktop)**:
  - Một cửa sổ "Tùy chỉnh Lời nhắc AI" cho phép người dùng cung cấp một "Ghi chú Hệ thống" với thông tin về bản thân và xác định một bộ "Quy tắc & Yêu cầu" mà AI phải tuân theo.

### 2.4. Cấu hình & Cài đặt

- **Khóa API Gemini:** Trợ lý AI yêu cầu một khóa API Google Gemini do người dùng cung cấp. Một cửa sổ cài đặt ban đầu sẽ nhắc người dùng nhập khóa này.
- **Lưu trữ:** Tất cả các khóa, công việc, ghi chú và cài đặt được lưu trữ theo kiến trúc được mô tả trong phần 1.

### 2.5. Trải nghiệm Người dùng theo Nền tảng

#### 2.5.1. Trải nghiệm Desktop
Trải nghiệm đầy đủ tính năng được thiết kế cho màn hình lớn hơn.
- **Cửa sổ Công việc Thống nhất**: Một cửa sổ duy nhất, toàn diện được sử dụng để tạo và chỉnh sửa công việc.
- **Phím tắt**: `Ctrl+B` (hoặc `Cmd+B` trên macOS) để bật/tắt bảng trò chuyện của Trợ lý AI.
- **Cài đặt**: Một menu thả xuống cài đặt cung cấp quyền truy cập nhanh vào việc bật/tắt hiển thị thẻ và thay đổi khóa API.

#### 2.5.2. Trải nghiệm Di động (Màn hình < 768px)
Một giao diện được sắp xếp hợp lý, tập trung cho việc quản lý công việc khi di chuyển.
- **Điều hướng dựa trên Tab**: Một thanh tab ở dưới cùng để điều hướng đơn giản.
- **Chỉ các Chế độ xem Cốt lõi**: Giao diện được giới hạn ở hai tab thiết yếu:
  - **Trò chuyện**: Một chế độ xem toàn màn hình để tương tác với Trợ lý AI. Việc tạo công việc được xử lý độc quyền qua trò chuyện.
  - **Danh sách**: Một chế độ xem toàn màn hình để duyệt và quản lý công việc.
- **Giao diện người dùng Đơn giản hóa**: Tất cả các chế độ xem khác (Tuần, Lịch, Kanban, Ghi chú) và các điều khiển nâng cao trên máy tính đều bị ẩn để cung cấp một trải nghiệm gọn gàng.