const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// URL API gốc (giữ nguyên)
const SOURCE_API_URL = 'https://wtxmd52.tele68.com/v1/txmd5/sessions';

/**
 * Hàm chuẩn hóa kết quả từ API gốc sang định dạng mới.
 * Sử dụng trường 'id' (nếu là số phiên) hoặc '_id' cho trường Phien.
 * * @param {object} rawResult - Đối tượng kết quả từ API gốc (một phần tử trong list)
 * @returns {object} - Đối tượng kết quả đã chuẩn hóa
 */
function formatResult(rawResult) {
    const { id, _id, resultTruyenThong, dices, point } = rawResult;
    
    // 1. Xử lý trường Phien: Ưu tiên dùng trường 'id' nếu có (giả sử nó là số phiên)
    // Nếu không có, dùng '_id' (là ID dài)
    // Lưu ý: Trong hình ảnh không có 'id' mà chỉ có '_id' (là mã dài). 
    // Chúng ta sẽ dùng '_id' và chuyển nó thành Phien
    const phienSo = id || _id; 

    // 2. Chuẩn hóa Ket_qua CHỈ CHẤP NHẬN Tài hoặc Xỉu
    let ketQua = "Không rõ"; 
    if (resultTruyenThong) {
        const lowerCaseResult = resultTruyenThong.toLowerCase();
        if (lowerCaseResult === "tai") {
            ketQua = "Tài";
        } else if (lowerCaseResult === "xiu") {
            ketQua = "Xỉu";
        } 
    }

    // 3. Xử lý Xúc xắc và Tổng
    const d1 = dices?.[0] || 0;
    const d2 = dices?.[1] || 0;
    const d3 = dices?.[2] || 0;

    return {
        // Phien: Sẽ là số phiên nếu API trả về 'id' là số. Nếu không, nó là mã dài '_id'
        Phien: `${phienSo}`, 
        Xuc_xac_1: d1,
        Xuc_xac_2: d2,
        Xuc_xac_3: d3,
        Tong: point || (d1 + d2 + d3), 
        Ket_qua: ketQua, 
        id_nguon: "@akkskskbucumh" // Đổi tên id để tránh nhầm lẫn với Phien
    };
}

// Endpoint chính để lấy phiên gần nhất
app.get('/api/lxk', async (req, res) => {
    console.log(`[${new Date().toISOString()}] Yêu cầu API nhận được.`);
    try {
        const response = await axios.get(SOURCE_API_URL, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 
        });
        
        const data = response.data;
        // Lấy kết quả đầu tiên trong mảng 'list'
        const latestResultRaw = data?.list?.[0]; 

        // Kiểm tra dữ liệu hợp lệ: cần có một ID và xúc xắc
        if (!latestResultRaw || (!latestResultRaw.id && !latestResultRaw._id) || !latestResultRaw.dices) {
            console.error("Dữ liệu nhận được không có trường 'list' hoặc không có ID/dices hợp lệ.");
            return res.status(500).json({
                error: "Dữ liệu API gốc không hợp lệ. Vui lòng kiểm tra lại cấu trúc API.",
                details: latestResultRaw
            });
        }

        // Chuẩn hóa và trả về kết quả
        const result = formatResult(latestResultRaw);
        console.log(`[${new Date().toISOString()}] Trả về phiên: ${result.Phien}`);
        res.json(result);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Lỗi khi gọi API gốc:`, error.message);
        res.status(503).json({
            error: "Không thể lấy dữ liệu từ API gốc.",
            details: error.message
        });
    }
});

// Endpoint mặc định
app.get('/', (req, res) => {
    res.send('Chào mừng đến với API Lấy Phiên Gần Nhất. Truy cập <b>/api/lxk</b> để xem kết quả phiên Tài Xỉu gần nhất.');
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy trên cổng ${PORT}`);
    console.log(`🌐 Truy cập: http://localhost:${PORT}`);
});
    
