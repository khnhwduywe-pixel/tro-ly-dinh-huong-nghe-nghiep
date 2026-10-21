// 1. Cấu hình API Key và Model
const GEMINI_API_KEY = "AQ.Ab8RN6JOQUzUozS1ig_rbfWMh1XeYvaEsjZmUUFWQEhATtQrfg"; 
const GEMINI_MODEL = "gemini-3.8-flash";

const form = document.getElementById('chatForm'),
      input = document.getElementById('message'),
      chat = document.getElementById('chat'),
      welcome = document.getElementById('welcome'),
      send = document.getElementById('send');

let history = [];

// Hàm tạo Bong bóng chat
function addBubble(text, who) {
    const row = document.createElement('div');
    row.className = 'bubble-row ' + who;
    
    if (who === 'ai') {
        const av = document.createElement('div');
        av.className = 'avatar';
        av.textContent = '✿';
        row.appendChild(av);
    }
    
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text;
    row.appendChild(b);
    
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return row;
}

// Hàm gửi tin nhắn trực tiếp đến Google Gemini API
async function submitMessage(text) {
    text = (text || '').trim();
    if (!text || send.disabled) return;

    welcome.style.display = 'none';
    chat.style.display = 'block';
    
    // Hiển thị tin nhắn người dùng
    addBubble(text, 'user');
    history.push({ role: 'user', content: text });
    
    input.value = '';
    input.style.height = 'auto';
    send.disabled = true;

    // Hiển thị trạng thái đang phản hồi
    const loading = addBubble('Mình đang suy nghĩ một chút…', 'ai');
    loading.querySelector('.bubble').classList.add('typing');

    // Giới hạn 16 tin nhắn gần nhất
    const recentHistory = history.slice(-16);

    // Chuyển lịch sử trò chuyện sang định dạng của Gemini API
    const contents = recentHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // Prompt định hướng cho AI Career Psychology
    // Prompt định hướng và giới hạn phạm vi cho AI
    const systemInstruction = {
        parts: [{
            text: `Bạn là AI Career Psychology Assistant – trợ lý khám phá bản thân và định hướng nghề nghiệp.

NHIỆM VỤ CHÍNH:
- Giúp người dùng khám phá sở thích, năng lực, tính cách, giá trị cá nhân và tư vấn các nhóm nghề nghiệp phù hợp.
- Trò chuyện bằng tiếng Việt thân thiện, dễ hiểu, không phán xét. Mỗi lượt ưu tiên hỏi một câu rõ ràng.

QUY TẮC PHẠM VI NGHIÊM NGẶT (RẤT QUAN TRỌNG):
1. CHỈ TƯ VẤN NGHỀ NGHIỆP: Bạn chỉ được trả lời các câu hỏi liên quan đến chọn ngành, chọn nghề, khám phá bản thân, định hướng tương lai, kỹ năng công việc và lập kế hoạch nghề nghiệp.
2. TỪ CHỐI CÁC CHỦ ĐỀ KHÁC: Nếu người dùng hỏi các câu hỏi không liên quan đến nghề nghiệp/hướng nghiệp (ví dụ: làm bài tập toán/văn/anh, viết code, hỏi thời tiết, tin tức, giải trí, trò chuyện phiếm không liên quan...), bạn PHẢI TỪ CHỐI một cách lịch sự.
   - Cú pháp từ chối gợi ý: "Xin lỗi bạn, mình là Trợ lý Định hướng Nghề nghiệp nên chỉ có thể hỗ trợ bạn giải đáp các thắc mắc về chọn ngành, chọn nghề và khám phá bản thân. Bạn có muốn mình hỗ trợ gì về định hướng nghề nghiệp không?"
3. GIỚI HẠN TÂM LÝ & AN TOÀN: Không chẩn đoán bệnh tâm lý, không khẳng định chắc chắn 100% một nghề phù hợp, không bịa thông tin điểm chuẩn/học phí. Nêu rõ các gợi ý chỉ mang tính tham khảo.`
        }]
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: systemInstruction,
                generationConfig: {
                    maxOutputTokens: 900,
                    temperature: 0.7
                }
            })
        });

        const data = await res.json();
        loading.remove();

        if (!res.ok) {
            throw new Error(data.error?.message || 'Có lỗi xảy ra khi gọi API.');
        }

        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Mình chưa tạo được phản hồi, bạn thử lại nhé.';
        
        // Hiển thị phản hồi từ AI
        addBubble(answer, 'ai');
        history.push({ role: 'assistant', content: answer });

    } catch (e) {
        loading.remove();
        addBubble('Xin lỗi, hiện chưa kết nối được AI: ' + e.message, 'ai');
    } finally {
        send.disabled = false;
        input.focus();
    }
}

// Sự kiện cho Form & Input
form.addEventListener('submit', e => {
    e.preventDefault();
    submitMessage(input.value);
});

input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
    }
});

input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
});

// Các câu hỏi gợi ý nhanh
document.querySelectorAll('[data-prompt]').forEach(b => 
    b.addEventListener('click', () => submitMessage(b.dataset.prompt))
);

// Nút Tạo cuộc trò chuyện mới
document.getElementById('newChat').addEventListener('click', () => {
    history = [];
    chat.innerHTML = '';
    chat.style.display = 'none';
    welcome.style.display = 'block';
    input.value = '';
});