import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const API_KEY = process.env.GEMINI_API_KEY || '';
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

  try {
    console.log('--- Đang kiểm tra danh sách model bạn có quyền truy cập ---');
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('Lỗi API:', data.error);
      return;
    }

    if (data.models) {
      console.log('Các model khả dụng:');
      data.models.forEach((m: any) => {
        console.log(`- ${m.name.replace('models/', '')} (Hỗ trợ: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log('Không tìm thấy danh sách model.');
    }
  } catch (error) {
    console.error('Lỗi khi gọi API:', error);
  }
}

listModels();
