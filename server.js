const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// URL API gốc (giữ nguyên như cũ)
const SOURCE_API_URL = 'https://wtxmd52.tele68.com/v1/txmd5/sessions';

/**
 * Hàm chuẩn hóa kết quả từ API gốc sang định dạng mới.
 * Đảm bảo Ket_qua chỉ là "Tài" hoặc "Xỉu".
 * * @param {object} rawResult - Đối tượng kết quả từ API gốc (một phần tử trong list)
 * @returns {object} - Đối tượng kết quả đã chuẩn hóa
 */
function formatResult(rawResult) {
    const { _id, resultTruyenThong, dices, point } = rawResult;

    // Chuẩn hóa Ket_qua CHỈ CHẤP NHẬN Tài hoặc Xỉu
    let ketQua = "Không rõ"; // Mặc định là "Không rõ" nếu không phải Tài/Xỉu
    if (resultTruyenThong) {
        const lowerCaseResult = resultTruyenThong.toLowerCase();
        if (lowerCaseResult === "tai") {
            ketQua = "Tài";
        } else if (lowerCaseResult === "xiu") {
            ketQua = "Xỉu";
        } 
        // BỎ QUA các giá trị khác như 'bao', 'hoa', v.v.
    }

    // Đảm bảo dices là mảng có 3 phần tử
    const d1 = dices?.[0] || 0;
    const d2 = dices?.[1] || 0;
    const d3 = dices?.[2] || 0;

    return {
        Phien: `${_id}`, 
        Xuc_xac_1: d1,
        Xuc_xac_2: d2,
        Xuc_xac_3: d3,
        Tong: point || (d1 + d2 + d3), 
        Ket_qua: ketQua, // Chỉ có "Tài", "Xỉu", hoặc "Không rõ"
        id: "@hzhsjsuhsgsvshhshsg" 
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
        const latestResultRaw = data?.list?.[0]; 

        if (!latestResultRaw || !latestResultRaw._id || !latestResultRaw.dices) {
            console.error("Dữ liệu nhận được không có trường 'list' hoặc 'list[0]' không hợp lệ.");
            return res.status(500).json({
                error: "Dữ liệu API gốc không hợp lệ. Vui lòng kiểm tra lại cấu trúc API.",
                details: latestResultRaw
            });
        }

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
                    
