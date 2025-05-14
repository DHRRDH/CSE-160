const fs = require('fs');
const { createCanvas } = require('canvas');

// 创建渐变天空纹理
function createSkyTexture(width, height, isTop = false, isBottom = false) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (isTop) {
        // 顶部纹理 - 浅蓝色
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');  // 天空蓝
        gradient.addColorStop(1, '#B0E2FF');  // 更浅的蓝色
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加一些云
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 20 + Math.random() * 30;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (isBottom) {
        // 底部纹理 - 深蓝色
        ctx.fillStyle = '#4A708B';  // 深蓝色
        ctx.fillRect(0, 0, width, height);
    } else {
        // 侧面纹理 - 渐变蓝色
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');  // 天空蓝
        gradient.addColorStop(1, '#4A708B');  // 深蓝色
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加一些云
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * width;
            const y = Math.random() * (height/2);  // 只在上半部分添加云
            const size = 15 + Math.random() * 25;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    return canvas.toBuffer('image/jpeg');
}

// 生成所有六个面的纹理
const size = 512;  // 纹理大小
const faces = [
    { name: 'front.jpg', isTop: false, isBottom: false },
    { name: 'back.jpg', isTop: false, isBottom: false },
    { name: 'left.jpg', isTop: false, isBottom: false },
    { name: 'right.jpg', isTop: false, isBottom: false },
    { name: 'top.jpg', isTop: true, isBottom: false },
    { name: 'bottom.jpg', isTop: false, isBottom: true }
];

faces.forEach(face => {
    const buffer = createSkyTexture(size, size, face.isTop, face.isBottom);
    fs.writeFileSync(`skybox/${face.name}`, buffer);
}); 