
# Guideline Kỹ thuật: Luồng Xác thực & Kiến trúc Lưu trữ Dữ liệu Hybrid

_Lưu ý: Đây là tài liệu hướng dẫn chung. Các placeholder như `[Tên Ứng dụng]` cần được thay thế bằng tên cụ thể của dự án._

## 1. Tổng quan

Tài liệu này cung cấp một cái nhìn sâu về mặt kỹ thuật về cách ứng dụng xử lý việc xác thực người dùng và quản lý dữ liệu. Kiến trúc được thiết kế theo mô hình "hybrid", có khả năng thích ứng linh hoạt giữa môi trường phát triển cục bộ (hoặc các môi trường demo như AI Studio) và môi trường triển khai chính thức trên Vercel.

Trạng thái cốt lõi điều khiển toàn bộ kiến trúc này là `authState`, được quản lý ở client-side. Trạng thái này có thể là một trong ba giá trị:
- `pending`: Trạng thái ban đầu, khi ứng dụng chưa biết người dùng là ai. Giao diện đăng nhập sẽ được hiển thị.
- `guest`: Người dùng đã chọn truy cập với tư cách khách. Dữ liệu sẽ được lưu trữ cục bộ.
- `premium`: Người dùng đã đăng nhập thành công với một phương thức xác thực nâng cao (ví dụ: mật khẩu). Dữ liệu sẽ được lưu trữ trên server.

## 2. Luồng Xác thực và Quản lý Truy cập

Ứng dụng không sử dụng hệ thống session-based truyền thống. Thay vào đó, nó hoạt động như một "cổng" (gateway). Việc đăng nhập chỉ nhằm mục đích xác định `authState` trên client, từ đó quyết định nguồn dữ liệu và khóa API sẽ được sử dụng. Trạng thái này được **lưu trữ bền bỉ trong `localStorage`** để duy trì phiên đăng nhập sau khi tải lại trang.

### 2.1. Lưu trữ Trạng thái Đăng nhập

-   **Key:** Trạng thái xác thực được lưu trong `localStorage` với key `[app_name]_auth_state`.
-   **Luồng hoạt động:**
    1.  **Khởi động ứng dụng:** Ứng dụng ngay lập tức kiểm tra `localStorage` để tìm key `[app_name]_auth_state`.
        -   Nếu tìm thấy giá trị (`'guest'` hoặc `'premium'`), nó sẽ đặt `authState` thành giá trị đó và bỏ qua màn hình đăng nhập.
        -   Nếu không tìm thấy, `authState` mặc định là `'pending'` và màn hình đăng nhập được hiển thị.
    2.  **Đăng nhập thành công:** Sau khi người dùng đăng nhập thành công (với tư cách Guest hoặc Premium), giá trị `authState` mới sẽ được ghi vào `localStorage`.
    3.  **Đăng xuất:** Khi người dùng chọn đăng xuất, key `[app_name]_auth_state` sẽ bị xóa khỏi `localStorage`, và `authState` trong React được reset về `'pending'`, đưa người dùng trở lại màn hình đăng nhập.

### 2.2. Luồng Guest

1.  **Kích hoạt:** Người dùng nhấn nút "Continue as Guest".
2.  **Hành động:** `handleLoginSuccess('guest')` được gọi trên client.
3.  **Kết quả:**
    -   `'guest'` được ghi vào `localStorage.setItem('[app_name]_auth_state', 'guest')`.
    -   Trạng thái React `authState` được cập nhật thành `'guest'`.

### 2.3. Luồng Premium

1.  **Kích hoạt:** Người dùng nhập mật khẩu và gửi đi.
2.  **Gọi API:** Client gửi `POST` đến `/api/login`.
3.  **Xử lý Backend (`api/login.ts`):** So sánh mật khẩu với biến môi trường `PREMIUM_PASSWORD` và trả về `200 OK` nếu thành công.
4.  **Kết quả Client:**
    -   Nếu nhận được phản hồi thành công, `handleLoginSuccess('premium')` được gọi.
    -   `'premium'` được ghi vào `localStorage.setItem('[app_name]_auth_state', 'premium')`.
    -   Trạng thái React `authState` được cập nhật thành `'premium'`.


## 3. Kiến trúc Lưu trữ Dữ liệu

Hook quản lý dữ liệu (ví dụ `useDataManager.ts`) là trung tâm của việc quản lý dữ liệu, đóng vai trò như một lớp trừu tượng (abstraction layer) để đọc và ghi dữ liệu từ các nguồn khác nhau.

### 3.1. Mô hình Hybrid

-   **Khi `authState` là `guest` (hoặc trong môi trường AI Studio):**
    -   **Nguồn dữ liệu:** `localStorage` của trình duyệt.
    -   **Key:** Toàn bộ dữ liệu của ứng dụng được lưu dưới dạng một đối tượng JSON duy nhất trong `localStorage` với key là `[app_name]_guest_data`.
    -   **Ưu điểm:** Cho phép ứng dụng hoạt động đầy đủ mà không cần backend, lý tưởng cho việc demo, phát triển và sử dụng ngoại tuyến.

-   **Khi `authState` là `premium` (triển khai trên Vercel):**
    -   **Nguồn dữ liệu:** Vercel KV (được cung cấp bởi Upstash).
    -   **Giao tiếp:** Client giao tiếp với Vercel KV thông qua một Vercel Serverless Function tại endpoint `/api/data`.

    > **LƯU Ý QUAN TRỌNG VỀ CẤU HÌNH BIẾN MÔI TRƯỜNG:**
    > Khi bạn kết nối một Vercel KV store với dự án trên Vercel, hệ thống sẽ yêu cầu bạn đặt một tên cho store đó. Tên này sẽ được dùng làm **tiền tố (prefix)** cho các biến môi trường.
    > - **Bắt buộc:** Hãy đặt tên cho store là **`taskmanager`**.
    > - **Kết quả:** Vercel sẽ tự động tạo ra các biến như `TASKMANAGER_KV_REST_API_URL` và `TASKMANAGER_KV_REST_API_TOKEN`.
    > - **Cảnh báo:** Tên này **không thể thay đổi** sau khi đã tạo. Nếu đặt sai tên, bạn sẽ phải tạo một KV store mới và kết nối lại. Mã nguồn của ứng dụng được thiết lập để ưu tiên tìm kiếm các biến với tiền tố `TASKMANAGER_`.

    -   **Logic Backend (`api/data.ts`):**
        -   Sử dụng thư viện `@vercel/kv` để kết nối đến cơ sở dữ liệu.
        -   Thông tin kết nối (`url`, `token`) được lấy từ các biến môi trường do Vercel tự động cung cấp.
        -   **GET `/api/data`**: Đọc toàn bộ dữ liệu từ key `[app_name]_app_data` trong Vercel KV và trả về cho client.
        -   **POST `/api/data`**: Nhận toàn bộ state dữ liệu từ client và ghi đè (overwrite) vào key `[app_name]_app_data`.

### 3.2. Cơ chế Lưu trữ Debounced

Để tối ưu hóa hiệu suất và giảm số lượng lệnh gọi API/ghi vào `localStorage`, mọi thao tác ghi dữ liệu đều được quản lý bởi một hàm `saveData` sử dụng kỹ thuật "debounce" với độ trễ `1500ms`.

-   **Luồng hoạt động:**
    1.  Người dùng thực hiện một thay đổi.
    2.  State trên React được cập nhật ngay lập tức để UI phản hồi.
    3.  Một `setTimeout` được thiết lập để gọi hàm lưu trữ sau `1.5 giây`.
    4.  Nếu người dùng thực hiện một thay đổi khác trong khoảng thời gian này, `setTimeout` trước đó sẽ bị hủy và một `setTimeout` mới được tạo.
-   **Lợi ích:** Gộp nhiều thay đổi nhỏ, liên tiếp thành một thao tác ghi duy nhất, giảm tải cho backend và I/O của trình duyệt.

## 4. Quản lý và Lưu trữ API Keys

Đối với các ứng dụng tích hợp dịch vụ của bên thứ ba (ví dụ: Google Gemini), việc quản lý API key một cách linh hoạt là rất quan trọng. Chúng tôi áp dụng kiến trúc 3 lớp ưu tiên để xác định key nào sẽ được sử dụng.

### Kiến trúc 3 Lớp Ưu tiên

1.  **Lớp 1: Khóa do Người dùng Cung cấp (Ưu tiên cao nhất)**
    -   **Lưu trữ:** `localStorage` của trình duyệt.
    -   **Key:** `[app_name]_api_key`.
    -   **Mô tả:** Người dùng có thể cung cấp khóa API của riêng họ thông qua một modal trong ứng dụng. Khóa này sẽ luôn được ưu tiên sử dụng, ghi đè lên bất kỳ khóa mặc định nào.
    -   **Lợi ích:** Cho phép người dùng toàn quyền kiểm soát, sử dụng hạn ngạch (quota) của riêng họ và tăng cường bảo mật vì khóa không bao giờ rời khỏi trình duyệt của họ.

2.  **Lớp 2: Khóa Mặc định theo Trạng thái Xác thực**
    -   **Nguồn:** Lấy từ backend qua endpoint `/api/keys`.
    -   **Mô tả:** Nếu không tìm thấy khóa nào trong `localStorage`, ứng dụng sẽ gửi yêu cầu `GET` đến `/api/keys?mode=${authState}` để lấy khóa mặc định do quản trị viên cung cấp.
    -   **Logic Backend (`api/keys.ts`):** Dựa vào `mode`, hàm serverless này sẽ trả về giá trị của biến môi trường tương ứng:
        -   `mode=guest`: Trả về `process.env.PUBLIC_GUEST_API_KEY`.
        -   `mode=premium`: Trả về `process.env.PREMIUM_API_KEY`.
    -   **Lợi ích:** Cung cấp trải nghiệm "dùng ngay" (out-of-the-box) mà không yêu cầu người dùng cấu hình ngay lập tức.

3.  **Lớp 3: Không có Khóa**
    -   **Mô tả:** Nếu cả hai lớp trên đều không cung cấp khóa, các tính năng yêu cầu API sẽ bị vô hiệu hóa một cách nhẹ nhàng (gracefully disabled) và một thông báo sẽ được hiển thị để hướng dẫn người dùng cung cấp khóa.

### Luồng Logic Hoạt động
Khi một thành phần cần sử dụng API:
1.  **Kiểm tra `localStorage`:** Tìm kiếm khóa tại `localStorage.getItem('[app_name]_api_key')`.
2.  **Nếu có:** Sử dụng khóa này.
3.  **Nếu không có:** Kiểm tra xem đã có khóa mặc định được fetch từ server chưa.
4.  **Nếu có khóa mặc định:** Sử dụng khóa đó.
5.  **Nếu không có khóa mặc định:** Hiển thị trạng thái lỗi/vô hiệu hóa cho người dùng.

## 5. Sơ đồ Luồng Dữ liệu Tóm tắt

```
Người dùng truy cập ứng dụng
         |
    [ Component Gốc ] -- Đọc `authState` từ localStorage
         |
  `authState` = ?
         |
         +--------------------------------------+
         |                                      |
  (Có `authState` trong localStorage)        (Không có `authState`)
  `authState` = 'guest'/'premium'           `authState` = 'pending'
         |                                      |
< Bỏ qua Login, vào ứng dụng chính >       < Hiển thị Component Đăng nhập >
                                                |
                               +--------------------------------+
                               |                                |
                        [ Nhấn "Guest" ]                  [ Nhập mật khẩu Premium ]
                               |                                |
                        Ghi 'guest' vào localStorage      POST -> /api/login -> Ghi 'premium'
                               |                                |
                               +--------------------------------+
                                              |
                                 [ Hook Quản lý Dữ liệu ]
                               (Dựa vào `authState`)
                                      |
                  +------------------------------------------+
                  |                                          |
          [ authState = 'guest' ]               [ authState = 'premium' ]
                  |                                          |
          Đọc/Ghi dữ liệu từ:                 Đọc/Ghi dữ liệu qua:
          `localStorage` ('[app_name]_guest_data')   GET/POST /api/data
                                                             |
                                                      [ Vercel KV Store ]
                                                      ('[app_name]_app_data')
```

## 6. Xử lý Lỗi và Thông báo Người dùng (UI/UX Guideline)

Để đảm bảo trải nghiệm người dùng nhất quán và chuyên nghiệp, tất cả các thông báo, lỗi và yêu cầu xác nhận phải tuân thủ các quy tắc sau:

### 6.1. Cấm sử dụng các hàm Alert mặc định của trình duyệt

Tuyệt đối **KHÔNG** sử dụng các hàm sau đây vì chúng chặn luồng thực thi (blocking) và có giao diện không nhất quán trên các trình duyệt:
- `window.alert()`
- `window.confirm()`
- `window.prompt()`

### 6.2. Sử dụng Component Thông báo Tùy chỉnh

Tất cả các thông báo phải được hiển thị thông qua một component tùy chỉnh, không chặn (non-blocking). Ứng dụng đã có sẵn một component `Notification.tsx` cho các thông báo ngắn hạn (toast notifications).

- **Đặc điểm:**
    - Xuất hiện ở một góc màn hình.
    - Tự động biến mất sau một khoảng thời gian ngắn (ví dụ: 3-5 giây).
    - Có các trạng thái trực quan rõ ràng (thành công, lỗi, cảnh báo).

### 6.3. Mẫu Thông báo Lỗi

Các thông báo lỗi cần phải rõ ràng, ngắn gọn và nếu có thể, hãy cung cấp hướng giải quyết cho người dùng.

- **Lỗi kết nối mạng/server:**
    - **Tệ:** `Error: [object Object]`
    - **Tốt:** `Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại.`

- **Lỗi xác thực (validation):**
    - **Tệ:** `Lỗi`
    - **Tốt:** `Mật khẩu không được để trống.` hoặc `Email không đúng định dạng.`

- **Lỗi API từ bên thứ ba (ví dụ: Gemini):**
    - **Tệ:** `API call failed`
    - **Tốt:** `Khóa API Gemini đã hết hạn ngạch hoặc không hợp lệ. Vui lòng cập nhật khóa mới.`

Đối với các yêu cầu cần sự xác nhận từ người dùng (ví dụ: xóa một mục quan trọng), hãy sử dụng một component `ConfirmationModal` tùy chỉnh.

## 7. Nguyên tắc Triển khai & Code Mẫu

### 7.1. Chuyển đổi Nguồn dữ liệu theo `authState`

Hook `useDataManager` sử dụng `useEffect` để fetch dữ liệu ban đầu ngay khi `authState` được xác định.

```typescript
// Trong hooks/useDataManager.ts

export const useDataManager = (authState: AuthState) => {
  // ... state declarations ...

  useEffect(() => {
    // Không làm gì nếu đang chờ đăng nhập
    if (authState === 'pending') {
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        let data: AppData = { tasks: [], notes: [] };
        
        // Luồng Guest: Dùng localStorage
        if (authState === 'guest') {
          const localData = localStorage.getItem(GUEST_STORAGE_KEY);
          data = localData ? JSON.parse(localData) : { tasks: [], notes: [] };
        } 
        // Luồng Premium: Dùng API
        else { 
          const response = await fetch('/api/data');
          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }
          data = await response.json();
        }
        setTasks(data.tasks || []);
        setNotes(data.notes || []);
      } catch (err) {
        setError("Could not load data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authState]); // Hook này chạy lại mỗi khi authState thay đổi

  // ... các hàm quản lý dữ liệu khác
};
```

### 7.2. Logic Hàm Serverless (`/api/data`)

Hàm này là cổng giao tiếp duy nhất tới Vercel KV. Nó đọc các biến môi trường để kết nối và xử lý các phương thức GET/POST.

```typescript
// Trong api/data.ts

import { createClient } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Đọc biến môi trường do Vercel cung cấp (với tiền tố đã cấu hình)
const API_URL = process.env.TASKMANAGER_KV_REST_API_URL;
const API_TOKEN = process.env.TASKMANAGER_KV_REST_API_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!API_URL || !API_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const kv = createClient({ url: API_URL, token: API_TOKEN });
  const DATA_KEY = 'taskhaha_app_data';

  if (req.method === 'GET') {
    const data = await kv.get(DATA_KEY);
    return res.status(200).json(data || { tasks: [], notes: [] });
  }

  if (req.method === 'POST') {
    await kv.set(DATA_KEY, req.body);
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).end('Method Not Allowed');
}
```

### 7.3. Logic API Key 3 Lớp ở Client

Trong component `App.tsx`, `useMemo` được sử dụng để tính toán `currentApiKey` một cách hiệu quả, đảm bảo logic ưu tiên được áp dụng mỗi khi một trong các key thay đổi.

```typescript
// Trong App.tsx

const App: React.FC = () => {
  // ... các state khác
  const [defaultApiKey, setDefaultApiKey] = useState<string | null>(null);
  const [localApiKey, setLocalApiKey] = useState<string | null>(() => 
    localStorage.getItem(API_KEY_STORAGE_KEY) // Lớp 1: Lấy từ localStorage
  );
  
  // Lấy key mặc định từ server dựa trên authState
  useEffect(() => {
    // ... logic fetch tới /api/keys để set `defaultApiKey` (Lớp 2)
  }, [authState]);

  // `useMemo` sẽ tính toán lại `currentApiKey` chỉ khi `localApiKey` hoặc `defaultApiKey` thay đổi.
  const currentApiKey = useMemo(() => localApiKey || defaultApiKey, [localApiKey, defaultApiKey]);

  // ...
  // Các component con như ChatAssistant sẽ nhận `currentApiKey` làm prop.
  return (
    // ...
    <ChatAssistant apiKey={currentApiKey} />
    // ...
  );
};
```

## 8. Nguyên tắc Về Import và Render trên Vercel

Kiến trúc của ứng dụng này là **"không-build" (no-build)**, có nghĩa là không có bước biên dịch (transpile) và đóng gói (bundle) trước khi triển khai. Toàn bộ quá trình này diễn ra trực tiếp trong trình duyệt của người dùng.

### 8.1. Chiến lược Import: `importmap`
- **Vấn đề:** Trình duyệt không hiểu các câu lệnh import như `import React from 'react'`. Nó cần một đường dẫn URL đầy đủ.
- **Giải pháp:** Chúng ta sử dụng `<script type="importmap">` trong `index.html`.
    - `importmap` hoạt động như một "bảng tra cứu" cho trình duyệt. Khi trình duyệt thấy `import ... from 'react'`, nó sẽ tra cứu trong `importmap` và thay thế `'react'` bằng URL CDN tương ứng (ví dụ: `https://aistudiocdn.com/react@^19.2.0`).
    - **Ưu điểm:** Cho phép viết code với cú pháp module ES6 tiêu chuẩn mà không cần bundler. Lý tưởng cho việc tạo mẫu nhanh.
    - **Nhược điểm:** Không có các tối ưu hóa như tree-shaking (loại bỏ code không dùng) và code-splitting mà các bundler hiện đại cung cấp.

### 8.2. Luồng Render & Transpile: Service Worker (`sw.js`)
Đây là "phép màu" chính của ứng dụng.

1.  **HTML Tải:** Trình duyệt tải `index.html`.
2.  **Đăng ký Service Worker:** Một đoạn script nhỏ trong `index.html` đăng ký `sw.js`.
3.  **Tải Babel:** `sw.js` sử dụng `importScripts()` để tải thư viện Babel Standalone vào môi trường của nó.
4.  **SW Kiểm soát:** Service Worker (`SW`) kích hoạt và giành quyền kiểm soát trang.
5.  **Tải Script Chính:** Script trong `index.html` tạo một thẻ `<script type="module" src="/index.tsx">`.
6.  **SW Chặn Yêu cầu:** SW chặn yêu cầu mạng cho `/index.tsx`.
7.  **Transpile:** Bên trong SW:
    - Nó `fetch` nội dung gốc của `index.tsx` (dưới dạng text).
    - Nó dùng API của Babel đã tải để biên dịch code TSX này thành JavaScript thuần.
8.  **Trả về JS:** SW trả về một `Response` mới chứa code JavaScript đã được biên dịch, với `Content-Type` là `application/javascript`.
9.  **Thực thi:** Trình duyệt nhận JavaScript này và thực thi nó, khởi động ứng dụng React.

**Hệ quả đối với Vercel:** Vercel xem đây là một dự án **Static**. Nó chỉ đơn giản là phục vụ các file tĩnh (`.html`, `.tsx`, `.ts`, `.js`). Toàn bộ logic phức tạp của việc biên dịch và render ứng dụng React diễn ra hoàn toàn ở **client-side**, được điều phối bởi Service Worker. Điều này khác biệt hoàn toàn với các framework như Next.js, nơi Vercel thực thi code ở phía server để tạo ra HTML (SSR/SSG).
