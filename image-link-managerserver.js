const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'), false);
        }
    }
});

const DATA_FILE = 'siteData.json';

// 初始化默认数据
const defaultData = {
    text: "欢迎来到我们的图片链接管理平台！您可以点击下方图片跳转到指定网站。管理员可以编辑此文本内容、上传图片和设置链接。",
    fontSize: "20px",
    fontColor: "#333",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    linkUrl: "https://example.com",
    adminPassword: "admin123"
};

// 读取数据
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            return { ...defaultData, ...data };
        }
    } catch (error) {
        console.error('读取数据失败:', error);
    }
    return defaultData;
}

// 保存数据
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('保存数据失败:', error);
        return false;
    }
}

// 路由

// 获取网站数据
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// 更新网站数据
app.post('/api/data', (req, res) => {
    const data = req.body;
    if (saveData(data)) {
        res.json({ success: true, message: '数据已保存' });
    } else {
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

// 上传图片
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '没有上传文件' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        success: true, 
        message: '图片上传成功',
        imageUrl: imageUrl
    });
});

// 获取上传的图片
app.use('/uploads', express.static(uploadsDir));

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 数据文件: ${DATA_FILE}`);
    console.log(`📸 上传目录: ${uploadsDir}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});