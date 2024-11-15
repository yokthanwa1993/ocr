const express = require('express');
const Tesseract = require('tesseract.js');
const axios = require('axios');

const app = express();
const port = 3000;

// เส้นทางสำหรับการทำ OCR โดยใช้ URL ของรูปภาพจาก query string
app.get('/', async (req, res) => {
  const imageUrl = req.query.image; // รับ URL รูปภาพจาก query string

  if (!imageUrl) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing image URL in query string',
    });
  }

  try {
    // ดาวน์โหลดภาพจาก URL
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer', // รับไฟล์ภาพเป็น array buffer
    });

    // ตรวจสอบความสมบูรณ์ของไฟล์ (หากไฟล์เป็น 0 หรือไม่มีข้อมูลจะถือว่าเป็นข้อผิดพลาด)
    if (response.data.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Downloaded image is empty or corrupted',
      });
    }

    // ใช้ Tesseract.js ทำ OCR บน Buffer (ไม่ต้องใช้ไฟล์)
    Tesseract.recognize(
      response.data, // ส่ง Buffer ของภาพไปให้ Tesseract.js
      'tha+eng', // ภาษาในการรู้จำ (สามารถเปลี่ยนเป็น 'tha' ถ้าต้องการภาษาไทย)
      {
        logger: (m) => console.log(m), // แสดง log ระหว่างการประมวลผล
      }
    ).then(({ data: { text } }) => {
      // ส่งข้อมูล OCR ในรูปแบบ JSON
      res.json({
        status: 'success',
        extractedText: text,
      });
    }).catch((error) => {
      res.status(500).json({
        status: 'error',
        message: 'Error processing image',
        error: error.message,
      });
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error downloading image',
      error: error.message,
    });
  }
});

// เริ่มต้น server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
