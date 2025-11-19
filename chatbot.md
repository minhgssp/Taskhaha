# Tài liệu Kỹ thuật: Tích hợp Trợ lý AI Gemini

## 1. Tổng quan

Tài liệu này mô tả chi tiết kiến trúc và cách triển khai Trợ lý AI trong ứng dụng Zenith Taskboard. Trọng tâm của tính năng này là cung cấp cho người dùng một giao diện ngôn ngữ tự nhiên (Natural Language Interface) để quản lý công việc, được hỗ trợ bởi API Google Gemini.

### Mục tiêu chính:
- **Tương tác trực quan:** Cho phép người dùng tạo, cập nhật, xóa và truy vấn công việc bằng ngôn ngữ đàm thoại thông thường.
- **Nhận thức theo ngữ cảnh:** Đảm bảo AI hiểu được trạng thái hiện tại của ứng dụng, bao gồm danh sách công việc, các bộ lọc đang hoạt động và các quy tắc do người dùng xác định.
- **Thực thi an toàn:** Đảm bảo không có hành động nào được thực hiện mà không có sự xác nhận rõ ràng từ người dùng thông qua một giao diện xem xét.
- **Linh hoạt:** Cung cấp hai chế độ hoạt động riêng biệt—một chế độ tập trung vào quản lý công việc và một chế độ cho các cuộc trò chuyện tự do.

### Công nghệ cốt lõi:
- **Google Gemini API:** Mô hình ngôn ngữ nền tảng để xử lý và tạo phản hồi.
- **Thư viện `@google/genai`:** SDK chính thức để tương tác với Gemini API từ phía client.
- **Function Calling:** Tính năng của Gemini cho phép mô hình trả về dữ liệu có cấu trúc (structured JSON) để gọi các hàm phía client, thay vì chỉ trả về văn bản.

---

## 2. Kiến trúc & Các Thành phần Chính

Kiến trúc của chatbot được thiết kế theo mô-đun để tách biệt các mối quan tâm: Giao diện người dùng (UI), Dịch vụ API (Service Layer), và Kỹ thuật lời nhắc (Prompt Engineering).

  <!-- Placeholder for a potential diagram -->

### 2.1. Tầng Giao diện người dùng (UI Layer)

- **`ChatAssistant.tsx`**: Đây là thành phần UI chính của chatbot.
  - **Quản lý Trạng thái:** Sử dụng `React.useState` để quản lý `messages` (lịch sử trò chuyện), `input` (nội dung người dùng nhập), `isLoading` (trạng thái chờ phản hồi từ API), và `chatMode` ('task' hoặc 'freechat').
  - **Luồng Tương tác:**
    1.  Bắt sự kiện người dùng nhập và gửi tin nhắn.
    2.  Gọi hàm `handleSend`, hàm này sẽ cập nhật ngay lập tức UI với tin nhắn của người dùng và đặt `isLoading = true`.
    3.  Gọi dịch vụ `getChatResponse` để nhận phản hồi từ Gemini.
    4.  Xử lý phản hồi trả về: Nếu là văn bản, hiển thị trực tiếp; nếu là một kế hoạch hành động, kích hoạt `ConfirmationModal` thông qua callback `onPlanProposed`.
- **`ConfirmationModal.tsx`**:
  - Một thành phần modal quan trọng, hoạt động như một "cầu chì an toàn".
  - Nhận một `plan` (kế hoạch) từ AI (bao gồm danh sách các hành động `creations`, `updates`, `deletions`).
  - Hiển thị các hành động này một cách rõ ràng để người dùng xem xét, cho phép họ loại bỏ từng hành động.
  - Chỉ khi người dùng nhấn "Confirm", nó mới gọi callback `onConfirm` để `App.tsx` thực thi các thay đổi.
- **`MarkdownContent.tsx`**:
  - Một thành phần đơn giản để phân tích và hiển thị các phản hồi văn bản từ bot với định dạng Markdown cơ bản (in đậm, in nghiêng), giúp cải thiện khả năng đọc.

### 2.2. Tầng Dịch vụ (Service Layer)

- **`geminiService.ts`**: Tệp này là trung tâm điều phối mọi tương tác với Gemini API.
  - **`getAiClient()`**: Một hàm factory khởi tạo `GoogleGenAI` với khóa API của người dùng lấy từ `localStorage`. Nó đảm bảo rằng mỗi yêu cầu đều được xác thực.
  - **`getChatResponse()`**: Hàm cốt lõi của dịch vụ.
    - **Tham số:** Nhận vào `prompt` (lời nhắc của người dùng), `history` (lịch sử trò chuyện), `tasks` (danh sách công việc hiện tại), và các thông tin ngữ cảnh khác như `systemNote`, `rules`, `activeTags`, và `activeCollection`.
    - **Logic Chuyển đổi Chế độ:** Kiểm tra `chatMode`. Nếu là `freechat`, nó sẽ sử dụng một lời nhắc hệ thống đơn giản hơn và không gửi bất kỳ công cụ (tools) nào. Nếu là `task`, nó sẽ xây dựng lời nhắc hệ thống phức tạp và bao gồm các khai báo hàm (function declarations).
    - **Gọi API:** Xây dựng payload và gọi `ai.models.generateContent()`.
    - **Xử lý Phản hồi:** Đây là phần quan trọng nhất. Nó kiểm tra phản hồi từ Gemini:
      - Nếu `response.functionCalls` tồn tại, nó sẽ trích xuất tên hàm (ví dụ: `proposePlan`) và các đối số (`args`), sau đó trả về một đối tượng được định kiểu, ví dụ: `{ type: 'proposePlanCall', data: call.args }`.
      - Nếu không, nó sẽ trích xuất `response.text` và trả về `{ type: 'text', data: response.text }`.

### 2.3. Kỹ thuật Lời nhắc (Prompt Engineering)

- **`promptService.ts`**: Tệp này chịu trách nhiệm xây dựng các lời nhắc hệ thống (system prompts) động và có tính ngữ cảnh cao được gửi đến Gemini.
  - **`generateSystemPrompt()` (Chế độ Task):**
    - **Vai trò & Hướng dẫn:** Lời nhắc bắt đầu bằng việc xác định vai trò của AI là một trợ lý quản lý công việc và hướng dẫn nó cách sử dụng các hàm được cung cấp (`createTask`, `proposePlan`, v.v.).
    - **Tiêm Ngữ cảnh Động:** Đây là yếu tố then chốt. Lời nhắc được xây dựng động bằng cách chèn:
      1.  **Ngày hiện tại:** `Hôm nay là ${today}`.
      2.  **Thông tin Người dùng:** `systemNote` và `rules` từ `SettingsModal`.
      3.  **Ngữ cảnh Bộ lọc:** Thông báo rõ ràng cho AI về các bộ lọc `activeCollection` và `activeTags` đang được áp dụng. Điều này cực kỳ quan trọng, vì nó hướng dẫn AI tự động áp dụng các thuộc tính này cho các công việc mới mà không cần hỏi lại người dùng.
      4.  **Dữ liệu Công việc:** Toàn bộ danh sách công việc hiện tại được chuyển đổi thành chuỗi JSON và đưa vào lời nhắc, cung cấp cho AI trạng thái đầy đủ của bảng công việc.
  - **`generateFreechatSystemPrompt()` (Chế độ Freechat):**
    - Một lời nhắc đơn giản hơn nhiều, chỉ định vai trò là một trợ lý trò chuyện và **ra lệnh rõ ràng không được gọi bất kỳ hàm nào**, đồng thời hướng dẫn người dùng chuyển sang chế độ 'Task' nếu họ muốn thực hiện hành động liên quan đến công việc.

### 2.4. Function Calling & Định nghĩa Schema

Trong `geminiService.ts`, chúng tôi định nghĩa một bộ `FunctionDeclaration` để hướng dẫn Gemini cách trả về dữ liệu có cấu trúc.

- **Mục đích:** Thay vì phân tích cú pháp văn bản tự do, chúng tôi yêu cầu Gemini điền vào một "biểu mẫu" JSON được định nghĩa trước. Điều này giúp loại bỏ sự không chắc chắn và làm cho việc xử lý phản hồi trở nên đáng tin cậy 100%.

- **Các hàm được định nghĩa:**
  - `createTask`: Cho một yêu cầu tạo công việc duy nhất.
  - `updateTask`: Cho một yêu cầu cập nhật công việc duy nhất.
  - `deleteTask`: Cho một yêu cầu xóa công việc duy nhất.
  - `proposePlan`: Hàm quan trọng nhất, được sử dụng cho các yêu cầu phức tạp. Schema của nó chứa ba mảng: `creations`, `updates`, và `deletions`. AI được hướng dẫn sử dụng hàm này khi yêu cầu của người dùng liên quan đến nhiều hành động.
  - `updateRules`: Một "meta-function" cho phép người dùng sửa đổi các quy tắc của chính AI thông qua trò chuyện.

Mỗi hàm đều có một `parameters` schema được định nghĩa bằng cách sử dụng các kiểu từ `@google/genai` (ví dụ: `Type.OBJECT`, `Type.STRING`, `Type.ARRAY`), cùng với mô tả chi tiết cho từng thuộc tính để hướng dẫn mô hình.

---

## 3. Luồng Dữ liệu (Từ Người dùng đến Hành động)

1.  **Đầu vào:** Người dùng gõ "Lên lịch họp với team thiết kế vào thứ Sáu lúc 2 giờ chiều và tạo một công việc để chuẩn bị slide" vào `ChatAssistant`.
2.  **Gửi đi:** `ChatAssistant` gọi `getChatResponse` với lời nhắc, lịch sử trò chuyện, danh sách công việc, và ngữ cảnh hiện tại (ví dụ: `activeCollection: 'Work'`).
3.  **Xây dựng Lời nhắc:** `promptService` tạo ra một lời nhắc hệ thống chi tiết, bao gồm hướng dẫn, ngữ cảnh bộ lọc "Work", và danh sách công việc dưới dạng JSON.
4.  **Gọi API:** `geminiService` gửi lời nhắc và các `FunctionDeclaration` đến API Gemini.
5.  **Phân tích của Gemini:** Gemini hiểu rằng yêu cầu này phức tạp và liên quan đến hai hành động tạo công việc. Nó quyết định gọi hàm `proposePlan`.
6.  **Phản hồi có cấu trúc:** API trả về một đối tượng `functionCalls` chứa:
    ```json
    {
      "name": "proposePlan",
      "args": {
        "creations": [
          { "title": "Họp với team thiết kế", "dueDate": "YYYY-MM-DD", "dueTime": "14:00", "collection": "Work" },
          { "title": "Chuẩn bị slide cho cuộc họp thiết kế", "collection": "Work" }
        ],
        "updates": [],
        "deletions": []
      }
    }
    ```
7.  **Xử lý Phản hồi:** `geminiService` phân tích phản hồi này và trả về `{ type: 'proposePlanCall', data: args }` cho `ChatAssistant`.
8.  **Xác nhận của Người dùng:**
    - `ChatAssistant` nhận được kế hoạch và gọi `onPlanProposed(plan)`.
    - `App.tsx` mở `ConfirmationModal` và hiển thị hai hành động "CREATE" cho người dùng xem xét.
9.  **Thực thi:**
    - Người dùng nhấn "Confirm" trong modal.
    - `App.tsx` gọi hàm `handleConfirmPlan`, lặp qua mảng `creations` và gọi `addTask()` cho mỗi mục.
10. **Cập nhật UI:** Trạng thái React được cập nhật, và hai công việc mới xuất hiện ngay lập tức trên tất cả các chế độ xem của ứng dụng.

---

## 4. Kết luận và Các Cải tiến trong Tương lai

Kiến trúc hiện tại cung cấp một nền tảng mạnh mẽ, có khả năng mở rộng và đáng tin cậy để tích hợp AI vào ứng dụng. Bằng cách tách biệt UI, dịch vụ và logic lời nhắc, chúng ta có thể dễ dàng bảo trì và cải tiến từng phần một cách độc lập. Việc sử dụng **Function Calling** kết hợp với một lớp xác nhận từ người dùng là yếu tố then chốt để đảm bảo tính chính xác và an toàn.

### Các hướng cải tiến tiềm năng:
- **Phản hồi Streaming:** Triển khai `generateContentStream` để hiển thị phản hồi của AI từng từ một, tạo cảm giác tương tác và phản hồi nhanh hơn.
- **Lưu trữ Lịch sử Trò chuyện:** Hiện tại, lịch sử trò chuyện chỉ được lưu trong phiên. Có thể xem xét lưu trữ nó vào `localStorage` để duy trì cuộc trò chuyện giữa các lần tải lại trang.
- **Tích hợp Chức năng Ghi chú:** Mở rộng khả năng của AI để có thể tạo, tìm kiếm và tóm tắt nội dung từ Chế độ xem Ghi chú.
- **Cải thiện Nhận dạng Thực thể:** Tinh chỉnh thêm các lời nhắc để AI có thể nhận dạng các công việc hiện có một cách đáng tin cậy hơn từ các mô tả mơ hồ (ví dụ: "đánh dấu công việc 'slide' là hoàn thành" thay vì yêu cầu ID).
