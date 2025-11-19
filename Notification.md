# Đề xuất Tính năng: Thông báo qua Email cho Công việc Quá hạn

## 1. Tổng quan

Tính năng này nhằm mục đích chủ động thông báo cho người dùng qua email khi có một hoặc nhiều công việc trong Zenith Taskboard bị quá hạn. Điều này giúp người dùng nắm bắt kịp thời các deadline quan trọng, tăng cường trách nhiệm và nâng cao hiệu quả quản lý công việc. Mục tiêu là biến ứng dụng từ một công cụ thụ động thành một trợ lý công việc chủ động.

## 2. Mô tả Tính năng

### 2.1. Kích hoạt và Tần suất
- **Kích hoạt:** Một email thông báo sẽ được gửi khi một công việc có `dueDate` (ngày hết hạn) đã qua nhưng `status` (trạng thái) vẫn chưa phải là `DONE`.
- **Tần suất:** Để tránh làm phiền người dùng, hệ thống sẽ chỉ gửi **một email tổng hợp mỗi ngày**, vào một thời điểm cố định (ví dụ: 8:00 sáng theo giờ địa phương của người dùng). Email này sẽ liệt kê tất cả các công việc đang bị quá hạn.

### 2.2. Nội dung Email
Email cần được thiết kế rõ ràng, chuyên nghiệp và hữu ích.

- **Tiêu đề:** "Zenith Taskboard: Bạn có [Số lượng] công việc đã quá hạn"
- **Nội dung:**
    - Lời chào thân thiện (ví dụ: "Chào [Tên người dùng],").
    - Một câu tóm tắt (ví dụ: "Có vẻ như bạn đã bỏ lỡ một vài deadline. Dưới đây là danh sách các công việc cần bạn chú ý:").
    - Danh sách các công việc quá hạn, mỗi công việc bao gồm:
        - **Tiêu đề công việc:** In đậm, rõ ràng.
        - **Ngày hết hạn:** Hiển thị ngày và ghi chú đã quá hạn bao lâu (ví dụ: "Quá hạn 2 ngày").
        - **Bộ sưu tập:** `Work` hoặc `Life`.
        - **Đường dẫn trực tiếp:** Một liên kết để mở trực tiếp công việc đó trong ứng dụng Zenith Taskboard.
    - Một nút kêu gọi hành động (Call-to-Action) nổi bật, ví dụ: **"Xem lại công việc ngay"**, dẫn đến trang chính của ứng dụng.
    - Chân trang email với tùy chọn để quản lý cài đặt thông báo hoặc hủy đăng ký.

### 2.3. Cài đặt Người dùng
Người dùng phải có toàn quyền kiểm soát tính năng này.
- Trong **Settings Modal**, thêm một mục "Thông báo".
- Cung cấp một nút bật/tắt để kích hoạt hoặc vô hiệu hóa thông báo qua email.
- Một ô để người dùng nhập và cập nhật địa chỉ email nhận thông báo.

## 3. Yêu cầu Kỹ thuật và Kế hoạch Triển khai

**Lưu ý quan trọng:** Ứng dụng hiện tại hoàn toàn hoạt động ở phía client (client-side) và sử dụng `localStorage`. Việc gửi email đòi hỏi một sự thay đổi lớn về kiến trúc, chuyển sang mô hình client-server.

### 3.1. Thành phần Bắt buộc
1.  **Backend Service:** Cần xây dựng một máy chủ backend (ví dụ: sử dụng Node.js, Python, Go) hoặc các hàm serverless (Google Cloud Functions, AWS Lambda). Máy chủ này sẽ chịu trách nhiệm xử lý logic kiểm tra công việc và gửi email.
2.  **Cơ sở dữ liệu (Database):** Dữ liệu công việc phải được chuyển từ `localStorage` sang một cơ sở dữ liệu thực sự như Firestore, MongoDB, hoặc PostgreSQL để backend có thể truy cập.
3.  **Xác thực người dùng (Authentication):** Cần một hệ thống đăng ký/đăng nhập để liên kết công việc và địa chỉ email với một tài khoản người dùng cụ thể.
4.  **Dịch vụ gửi Email (Email Service):** Tích hợp với một nhà cung cấp dịch vụ email giao dịch như SendGrid, Mailgun, hoặc Amazon SES để đảm bảo email được gửi đi một cách đáng tin cậy.
5.  **Tác vụ định kỳ (Cron Job):** Cần một bộ lập lịch (scheduler) để tự động chạy tác vụ kiểm tra công việc quá hạn mỗi ngày.

### 3.2. Luồng Hoạt động (Workflow)
1.  **Cấu hình:** Người dùng truy cập cài đặt, bật tính năng thông báo và nhập email. Thông tin này được gửi đến backend và lưu vào cơ sở dữ liệu.
2.  **Lập lịch:** Một cron job được thiết lập để chạy hàng ngày vào lúc 8:00 sáng.
3.  **Thực thi:**
    - Cron job kích hoạt một script trên backend.
    - Script truy vấn cơ sở dữ liệu để tìm tất cả người dùng đã bật thông báo.
    - Với mỗi người dùng, script tiếp tục truy vấn để tìm các công việc có `dueDate` < `hôm nay` và `status` != `DONE`.
4.  **Gửi Email:**
    - Nếu tìm thấy công việc quá hạn, script sẽ tạo nội dung email.
    - Script gọi API của dịch vụ email (ví dụ: SendGrid) để gửi email tổng hợp đến địa chỉ đã đăng ký của người dùng.
5.  **Hoàn tất:** Người dùng nhận được email và có thể hành động dựa trên thông tin đó.

## 4. Kết luận
Việc triển khai tính năng thông báo qua email sẽ là một bước tiến lớn, giúp Zenith Taskboard trở nên hữu ích và chuyên nghiệp hơn. Mặc dù đòi hỏi một sự đầu tư đáng kể vào việc xây dựng hạ tầng backend, lợi ích về sự gắn kết và hài lòng của người dùng là hoàn toàn xứng đáng.
