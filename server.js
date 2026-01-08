const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Virtual Try-On Backend Running' });
});

app.post('/api/tryon', async (req, res) => {
  try {
    const { human_img, garm_img } = req.body;

    if (!human_img || !garm_img) {
      return res.status(400).json({ 
        error: 'Требуются оба изображения: human_img и garm_img' 
      });
    }

    console.log('Отправка запроса в Replicate API...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_TOKEN}`
      },
      body: JSON.stringify({
        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        input: {
          human_img: human_img,
          garm_img: garm_img,
          garment_des: "clothing item",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Replicate API error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.detail || 'Ошибка Replicate API' 
      });
    }

    const prediction = await response.json();
    console.log('Prediction создан:', prediction.id);

    res.json(prediction);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message 
    });
  }
});

app.get('/api/tryon/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.detail || 'Ошибка при проверке статуса' 
      });
    }

    const prediction = await response.json();
    res.json(prediction);

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Ошибка проверки статуса',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Ready to process virtual try-on requests`);
});
