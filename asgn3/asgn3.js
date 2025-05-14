// asgn3.js

// Vertex shader program
const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform bool u_IsSkybox;
    varying vec2 v_TexCoord;
    varying vec3 v_Position;
    void main() {
        v_TexCoord = a_TexCoord;
        if (u_IsSkybox) {
            // 对于天空盒，我们需要将顶点位置作为纹理坐标
            v_Position = a_Position.xyz;
            gl_Position = u_MvpMatrix * a_Position;
            // 确保天空盒始终在最远处
            gl_Position.z = gl_Position.w;
        } else {
            gl_Position = u_MvpMatrix * a_Position;
        }
    }`;

// Fragment shader program
const FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform sampler2D u_Sampler;
    uniform samplerCube u_SkyboxSampler;
    uniform bool u_UseTextures;
    uniform bool u_IsSkybox;
    uniform vec4 u_BaseColor;
    varying vec2 v_TexCoord;
    varying vec3 v_Position;
    void main() {
        if (u_IsSkybox) {
            gl_FragColor = textureCube(u_SkyboxSampler, normalize(v_Position));
        } else if (u_UseTextures) {
            gl_FragColor = texture2D(u_Sampler, v_TexCoord);
        } else {
            gl_FragColor = u_BaseColor;
        }
    }`;

// --- CAMERA CLASS DEFINITION ---
class Camera {
    constructor(fov = 60, aspect = 1.0, near = 0.1, far = 1000.0) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.eye = new Vector3([0, 1, 7]);
        this.at  = new Vector3([0, 0, 0]);
        this.up  = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.speed = 0.25;
        this.turnSpeed = 4.0;
        this.height = 1.7;      // 玩家身高
        this.radius = 0.3;      // 玩家碰撞半径
        this.gravity = -0.01;   // 重力加速度
        this.verticalSpeed = 0; // 垂直速度
        this.pitch = 0;  // 俯仰角
        this.yaw = -90;  // 偏航角，-90使相机开始时看向-z方向
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    // 获取地形高度
    getTerrainHeight(x, z) {
        // 转换到地形坐标系
        const terrainX = Math.floor(x + g_terrain.size/2);
        const terrainZ = Math.floor(z + g_terrain.size/2);
        
        // 获取区块坐标
        const chunkX = Math.floor(terrainX / g_terrain.chunkSize);
        const chunkZ = Math.floor(terrainZ / g_terrain.chunkSize);
        const key = getChunkKey(chunkX, chunkZ);
        
        // 如果区块不存在，返回一个安全的默认值
        if (!g_terrain.chunks.has(key)) return -0.5;
        
        // 在区块中查找最高点
        const blocks = g_terrain.chunks.get(key);
        let maxHeight = -0.5; // 默认地面高度
        
        for (const block of blocks) {
            const blockX = block.matrix.elements[12] + g_terrain.size/2;
            const blockZ = block.matrix.elements[14] + g_terrain.size/2;
            
            // 检查是否是同一位置
            if (Math.floor(blockX) === terrainX && Math.floor(blockZ) === terrainZ) {
                maxHeight = Math.max(maxHeight, block.matrix.elements[13] + 0.5);
            }
        }
        
        return maxHeight;
    }

    // 检查水平移动的碰撞
    checkCollision(newX, newZ) {
        // 检查与旋转立方体的碰撞
        if (checkSpinningCubeCollision(newX, newZ)) {
            return true;
        }

        // 检查与地形的碰撞
        const points = [
            [newX + this.radius, newZ + this.radius],
            [newX + this.radius, newZ - this.radius],
            [newX - this.radius, newZ + this.radius],
            [newX - this.radius, newZ - this.radius]
        ];

        for (const [x, z] of points) {
            const height = this.getTerrainHeight(x, z);
            if (this.eye.elements[1] < height + this.height) {
                return true;
            }
        }
        return false;
    }

    // 应用重力和碰撞检测
    update() {
        // 应用重力
        this.verticalSpeed += this.gravity;
        let newY = this.eye.elements[1] + this.verticalSpeed;
        
        // 获取当前位置的地形高度
        const groundHeight = this.getTerrainHeight(this.eye.elements[0], this.eye.elements[2]);
        
        // 检查是否着地
        if (newY < groundHeight + this.height) {
            newY = groundHeight + this.height;
            this.verticalSpeed = 0;
        }
        
        // 更新相机高度
        const deltaY = newY - this.eye.elements[1];
        this.eye.elements[1] = newY;
        this.at.elements[1] += deltaY;
        
        this.updateViewMatrix();
    }

    moveForward() {
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = 0;
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        f.normalize();
        f.elements[0] *= this.speed;
        f.elements[2] *= this.speed;

        // 检查碰撞
        const newX = this.eye.elements[0] + f.elements[0];
        const newZ = this.eye.elements[2] + f.elements[2];
        
        if (!this.checkCollision(newX, newZ)) {
            this.eye.elements[0] = newX;
            this.eye.elements[2] = newZ;
            this.at.elements[0] += f.elements[0];
            this.at.elements[2] += f.elements[2];
            this.updateViewMatrix();
        }
    }

    moveBackward() {
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = 0;
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        f.normalize();
        f.elements[0] *= this.speed;
        f.elements[2] *= this.speed;

        // 检查碰撞
        const newX = this.eye.elements[0] - f.elements[0];
        const newZ = this.eye.elements[2] - f.elements[2];
        
        if (!this.checkCollision(newX, newZ)) {
            this.eye.elements[0] = newX;
            this.eye.elements[2] = newZ;
            this.at.elements[0] -= f.elements[0];
            this.at.elements[2] -= f.elements[2];
            this.updateViewMatrix();
        }
    }

    moveLeft() {
        let rightDir = this._getRightDirection();
        
        // 检查碰撞
        const newX = this.eye.elements[0] - rightDir.elements[0] * this.speed;
        const newZ = this.eye.elements[2] - rightDir.elements[2] * this.speed;
        
        if (!this.checkCollision(newX, newZ)) {
            this.eye.elements[0] = newX;
            this.eye.elements[2] = newZ;
            this.at.elements[0] -= rightDir.elements[0] * this.speed;
            this.at.elements[2] -= rightDir.elements[2] * this.speed;
            this.updateViewMatrix();
        }
    }

    moveRight() {
        let rightDir = this._getRightDirection();
        
        // 检查碰撞
        const newX = this.eye.elements[0] + rightDir.elements[0] * this.speed;
        const newZ = this.eye.elements[2] + rightDir.elements[2] * this.speed;
        
        if (!this.checkCollision(newX, newZ)) {
            this.eye.elements[0] = newX;
            this.eye.elements[2] = newZ;
            this.at.elements[0] += rightDir.elements[0] * this.speed;
            this.at.elements[2] += rightDir.elements[2] * this.speed;
            this.updateViewMatrix();
        }
    }

    // 添加跳跃功能
    jump() {
        // 只有在地面上时才能跳跃
        const groundHeight = this.getTerrainHeight(this.eye.elements[0], this.eye.elements[2]);
        if (Math.abs(this.eye.elements[1] - (groundHeight + this.height)) < 0.1) {
            this.verticalSpeed = 0.15; // 跳跃初速度
        }
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
            this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
        );
    }
    updateProjectionMatrix() {
        let aspectToUse = this.aspect;
        if (isNaN(this.aspect) || this.aspect === 0 || !isFinite(this.aspect)) {
            aspectToUse = 1.0; 
        }
        this.projectionMatrix.setPerspective(this.fov, aspectToUse, this.near, this.far);
    }
    _getRightDirection() {
        let f_x_dir = this.at.elements[0] - this.eye.elements[0];
        let f_z_dir = this.at.elements[2] - this.eye.elements[2];
        let f_len = Math.sqrt(f_x_dir * f_x_dir + f_z_dir * f_z_dir);
        if (f_len < 0.00001) { return new Vector3([1, 0, 0]);  }
        f_x_dir /= f_len;
        f_z_dir /= f_len;
        let r_x = -f_z_dir;
        let r_z = f_x_dir;
        return new Vector3([r_x, 0, r_z]);
    }
    panLeft() {
        let f = new Vector3(); 
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = this.at.elements[1] - this.eye.elements[1]; 
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(this.turnSpeed, 0, 1, 0);         
        let f_prime = rotMatrix.multiplyVector3(f); 
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        this.updateViewMatrix(); 
    }
    panRight() {
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = this.at.elements[1] - this.eye.elements[1];
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(-this.turnSpeed, 0, 1, 0); 
        let f_prime = rotMatrix.multiplyVector3(f);
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        this.updateViewMatrix();
    }

    // 添加根据欧拉角更新相机方向的方法
    updateCameraVectors() {
        // 计算新的前向量
        const frontX = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        const frontY = Math.sin(this.pitch * Math.PI / 180);
        const frontZ = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        
        // 更新at点（相机看向的点）
        this.at.elements[0] = this.eye.elements[0] + frontX;
        this.at.elements[1] = this.eye.elements[1] + frontY;
        this.at.elements[2] = this.eye.elements[2] + frontZ;
        
        this.updateViewMatrix();
    }

    // 处理鼠标移动
    processMouseMovement(xoffset, yoffset, constrainPitch = true) {
        xoffset *= this.turnSpeed * g_mouseInfo.sensitivity;
        yoffset *= this.turnSpeed * g_mouseInfo.sensitivity;

        this.yaw += xoffset;
        this.pitch += yoffset;

        // 限制俯仰角，防止相机翻转
        if (constrainPitch) {
            if (this.pitch > 89.0) this.pitch = 89.0;
            if (this.pitch < -89.0) this.pitch = -89.0;
        }

        this.updateCameraVectors();
    }
}
// --- END OF CAMERA CLASS ---

// --- VIEW FRUSTUM CULLING ---
class Frustum {
    constructor() {
        this.planes = new Array(6); // 近、远、左、右、上、下平面
        for(let i = 0; i < 6; i++) {
            this.planes[i] = new Float32Array(4); // 平面方程系数 ax + by + cz + d = 0
        }
    }

    // 从投影视图矩阵更新平面方程
    update(projviewMatrix) {
        const m = projviewMatrix.elements;
        
        // 左平面
        this.planes[0][0] = m[3] + m[0];
        this.planes[0][1] = m[7] + m[4];
        this.planes[0][2] = m[11] + m[8];
        this.planes[0][3] = m[15] + m[12];
        
        // 右平面
        this.planes[1][0] = m[3] - m[0];
        this.planes[1][1] = m[7] - m[4];
        this.planes[1][2] = m[11] - m[8];
        this.planes[1][3] = m[15] - m[12];
        
        // 下平面
        this.planes[2][0] = m[3] + m[1];
        this.planes[2][1] = m[7] + m[5];
        this.planes[2][2] = m[11] + m[9];
        this.planes[2][3] = m[15] + m[13];
        
        // 上平面
        this.planes[3][0] = m[3] - m[1];
        this.planes[3][1] = m[7] - m[5];
        this.planes[3][2] = m[11] - m[9];
        this.planes[3][3] = m[15] - m[13];
        
        // 近平面
        this.planes[4][0] = m[3] + m[2];
        this.planes[4][1] = m[7] + m[6];
        this.planes[4][2] = m[11] + m[10];
        this.planes[4][3] = m[15] + m[14];
        
        // 远平面
        this.planes[5][0] = m[3] - m[2];
        this.planes[5][1] = m[7] - m[6];
        this.planes[5][2] = m[11] - m[10];
        this.planes[5][3] = m[15] - m[14];

        // 归一化平面方程
        for(let i = 0; i < 6; i++) {
            const len = Math.sqrt(
                this.planes[i][0] * this.planes[i][0] +
                this.planes[i][1] * this.planes[i][1] +
                this.planes[i][2] * this.planes[i][2]
            );
            for(let j = 0; j < 4; j++) {
                this.planes[i][j] /= len;
            }
        }
    }

    // 检查点是否在视锥体内
    containsPoint(x, y, z) {
        for(let i = 0; i < 6; i++) {
            if(this.planes[i][0] * x +
               this.planes[i][1] * y +
               this.planes[i][2] * z +
               this.planes[i][3] <= 0) {
                return false;
            }
        }
        return true;
    }
}

// --- PERLIN NOISE CLASS ---
class PerlinNoise {
    constructor(seed = 123) {
        this.permutation = new Array(256);
        for(let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        
        // Fisher-Yates shuffle with seed
        let random = this.seededRandom(seed);
        for(let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        
        // Duplicate the permutation array
        this.permutation = [...this.permutation, ...this.permutation];
    }

    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A  = this.permutation[X] + Y;
        const AA = this.permutation[A] + Z;
        const AB = this.permutation[A + 1] + Z;
        const B  = this.permutation[X + 1] + Y;
        const BA = this.permutation[B] + Z;
        const BB = this.permutation[B + 1] + Z;

        return this.lerp(
            this.lerp(
                this.lerp(
                    this.grad(this.permutation[AA], x, y, z),
                    this.grad(this.permutation[BA], x-1, y, z),
                    u
                ),
                this.lerp(
                    this.grad(this.permutation[AB], x, y-1, z),
                    this.grad(this.permutation[BB], x-1, y-1, z),
                    u
                ),
                v
            ),
            this.lerp(
                this.lerp(
                    this.grad(this.permutation[AA+1], x, y, z-1),
                    this.grad(this.permutation[BA+1], x-1, y, z-1),
                    u
                ),
                this.lerp(
                    this.grad(this.permutation[AB+1], x, y-1, z-1),
                    this.grad(this.permutation[BB+1], x-1, y-1, z-1),
                    u
                ),
                v
            ),
            w
        );
    }
}

// --- TERRAIN GENERATION ---
let g_terrain = {
    size: 32,          // 保持地形大小
    chunkSize: 8,      // 保持区块大小
    scale: 0.2,        // 增大噪声缩放以产生更明显的地形变化
    octaves: 4,        // 增加噪声叠加次数以增加细节
    persistence: 0.6,   // 增加持续度使地形更加起伏
    heightScale: 12,    // 增加高度以产生更高的地形
    heightOffset: -4,   // 调整高度偏移
    blocks: [],        
    chunks: new Map(), 
    activeChunks: new Set(),
    blockTypes: {
        GRASS: 0,
        DIRT: 1,
        STONE: 2,
        WOOD: 3,
        LEAVES: 4
    }
};

// 计算区块坐标
function getChunkKey(x, z) {
    const chunkX = Math.floor(x / g_terrain.chunkSize);
    const chunkZ = Math.floor(z / g_terrain.chunkSize);
    return `${chunkX},${chunkZ}`;
}

// 生成单个区块
function generateChunk(chunkX, chunkZ) {
    const perlin = new PerlinNoise(chunkX * 12345 + chunkZ);
    const blocks = [];
    const startX = chunkX * g_terrain.chunkSize;
    const startZ = chunkZ * g_terrain.chunkSize;
    
    // 用于决定是否生成树的噪声
    const treeNoise = new PerlinNoise(chunkX * 54321 + chunkZ);
    
    for(let x = 0; x < g_terrain.chunkSize; x++) {
        for(let z = 0; z < g_terrain.chunkSize; z++) {
            const worldX = startX + x;
            const worldZ = startZ + z;
            
            // 生成基础高度
            let amplitude = 1;
            let frequency = 1;
            let noiseHeight = 0;
            
            for(let i = 0; i < g_terrain.octaves; i++) {
                const sampleX = worldX * g_terrain.scale * frequency;
                const sampleZ = worldZ * g_terrain.scale * frequency;
                noiseHeight += perlin.noise(sampleX, sampleZ) * amplitude;
                amplitude *= g_terrain.persistence;
                frequency *= 2;
            }
            
            // 添加一些随机的小变化
            noiseHeight += (Math.random() * 0.2 - 0.1);
            
            const height = Math.floor(noiseHeight * g_terrain.heightScale + g_terrain.heightOffset);
            
            // 检查是否应该在这个位置生成树
            const treeValue = treeNoise.noise(worldX * 0.3, worldZ * 0.3);
            const shouldGenerateTree = treeValue > 0.6; // 降低阈值以增加树的密度
            
            // 生成所有方块（不再只生成表面方块）
            for(let y = 0; y <= height; y++) {
                // 确定方块类型
                let blockType;
                if (y === height) {
                    blockType = g_terrain.blockTypes.GRASS;
                } else if (y > height - 3) {
                    blockType = g_terrain.blockTypes.DIRT;
                } else {
                    blockType = g_terrain.blockTypes.STONE;
                }
                
                const model = new Matrix4();
                model.setIdentity();
                model.translate(
                    worldX - g_terrain.size/2,
                    y - 0.5,
                    worldZ - g_terrain.size/2
                );
                
                blocks.push({
                    matrix: model,
                    height: y,
                    maxHeight: height,
                    type: blockType
                });
            }
            
            // 生成树，但要确保树的位置合适
            if (shouldGenerateTree && height > g_terrain.heightOffset + 2) {
                const treeHeight = 4 + Math.floor(Math.random() * 3); // 4-6个方块高
                
                // 生成树干
                for(let y = height + 1; y <= height + treeHeight; y++) {
                    const model = new Matrix4();
                    model.setIdentity();
                    model.translate(
                        worldX - g_terrain.size/2,
                        y - 0.5,
                        worldZ - g_terrain.size/2
                    );
                    blocks.push({
                        matrix: model,
                        height: y,
                        maxHeight: height + treeHeight,
                        type: g_terrain.blockTypes.WOOD
                    });
                }
                
                // 生成更大的树冠
                for(let ly = height + treeHeight - 2; ly <= height + treeHeight; ly++) {
                    for(let lx = -2; lx <= 2; lx++) {
                        for(let lz = -2; lz <= 2; lz++) {
                            // 跳过树干位置的树叶
                            if (lx === 0 && lz === 0 && ly < height + treeHeight) continue;
                            
                            // 使树冠更自然，边缘随机跳过一些方块
                            if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() < 0.7) continue;
                            
                            const model = new Matrix4();
                            model.setIdentity();
                            model.translate(
                                worldX - g_terrain.size/2 + lx,
                                ly - 0.5,
                                worldZ - g_terrain.size/2 + lz
                            );
                            blocks.push({
                                matrix: model,
                                height: ly,
                                maxHeight: height + treeHeight,
                                type: g_terrain.blockTypes.LEAVES
                            });
                        }
                    }
                }
            }
        }
    }
    return blocks;
}

// 更新激活的区块
function updateActiveChunks() {
    const playerChunkX = Math.floor((g_camera.eye.elements[0] + g_terrain.size/2) / g_terrain.chunkSize);
    const playerChunkZ = Math.floor((g_camera.eye.elements[2] + g_terrain.size/2) / g_terrain.chunkSize);
    const renderDistance = 3; // 区块渲染距离
    
    // 记录新的激活区块
    const newActiveChunks = new Set();
    
    // 遍历玩家周围的区块
    for(let x = -renderDistance; x <= renderDistance; x++) {
        for(let z = -renderDistance; z <= renderDistance; z++) {
            const chunkX = playerChunkX + x;
            const chunkZ = playerChunkZ + z;
            const key = getChunkKey(chunkX, chunkZ);
            
            // 如果区块在地形范围内
            if (chunkX >= 0 && chunkX < g_terrain.size/g_terrain.chunkSize &&
                chunkZ >= 0 && chunkZ < g_terrain.size/g_terrain.chunkSize) {
                newActiveChunks.add(key);
                
                // 如果这个区块还没有生成，就生成它
                if (!g_terrain.chunks.has(key)) {
                    g_terrain.chunks.set(key, generateChunk(chunkX, chunkZ));
                }
            }
        }
    }
    
    // 更新激活区块集合
    g_terrain.activeChunks = newActiveChunks;
}

// Global variables
let gl;
let canvas;
let n_indices_cube; // Number of indices for a cube object

// Model matrices for different objects
let g_worldModelMatrix = new Matrix4(); // For the main spinning cube
let g_groundModelMatrix = new Matrix4();
let g_skyModelMatrix = new Matrix4();

let g_mvpMatrix = new Matrix4(); // Reused for each object
let g_camera;
let g_texture0; // For spinning cube and ground (can add more textures later)
let u_Sampler;
let u_UseTextures;
let u_BaseColor;
let u_MvpMatrixLoc;
let g_currentAngle = 0.0; 
const ANGLE_STEP = 45.0;  
let g_lastTime = Date.now(); 
let g_frustum = new Frustum();
let g_spinningCubePos = { x: 0, y: 0.5, z: 0 }; // 存储旋转立方体的位置
let g_skyboxTexture; // 天空盒纹理
let u_IsSkybox; // 天空盒uniform位置
let u_SkyboxSampler; // 天空盒纹理采样器位置
let g_selectedBlock = null; // 当前选中的方块
let g_selectedFace = null; // 当前选中的面
let g_maxPlaceDistance = 5.0; // 最大放置距离

// 在全局变量部分添加鼠标控制相关变量
let g_mouseInfo = {
    lastX: 0,
    lastY: 0,
    dragging: false,
    sensitivity: 0.5  // 鼠标灵敏度
};

function main() {
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas, true);
    if (!gl) { console.log('Failed to get GL context'); return; }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { console.log('Failed to init shaders'); return; }
    
    n_indices_cube = initVertexBuffersCube();
    if (n_indices_cube < 0) { console.log('Failed to set vertex buffers'); return; }

    gl.clearColor(0.0, 0.0, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);

    u_MvpMatrixLoc = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');
    u_BaseColor = gl.getUniformLocation(gl.program, 'u_BaseColor');
    u_IsSkybox = gl.getUniformLocation(gl.program, 'u_IsSkybox');
    u_SkyboxSampler = gl.getUniformLocation(gl.program, 'u_SkyboxSampler');

    if (!u_MvpMatrixLoc || !u_Sampler || !u_UseTextures || !u_BaseColor || !u_IsSkybox || !u_SkyboxSampler) {
        console.log('Failed to get uniform locations'); return;
    }
    
    if (!initTextures()) { console.log('Failed to init textures'); return; }
    if (!initSkyboxTexture()) { console.log('Failed to init skybox texture'); return; }

    // 初始化相机
    initCamera();

    // 初始化第一个区块
    updateActiveChunks();

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
    initEventHandlers();

    g_lastTime = Date.now();
    tick();

    // 添加鼠标事件监听
    canvas.addEventListener('mousedown', function(event) {
        g_mouseInfo.dragging = true;
        g_mouseInfo.lastX = event.clientX;
        g_mouseInfo.lastY = event.clientY;
    });

    canvas.addEventListener('mouseup', function(event) {
        g_mouseInfo.dragging = false;
        // 如果鼠标移动很小，认为是点击，处理方块操作
        const deltaX = Math.abs(event.clientX - g_mouseInfo.lastX);
        const deltaY = Math.abs(event.clientY - g_mouseInfo.lastY);
        if (deltaX < 5 && deltaY < 5) {
            if (event.button === 0 && g_selectedBlock && g_selectedFace) { // 左键添加方块
                addBlock();
            } else if (event.button === 2 && g_selectedBlock) { // 右键删除方块
                removeBlock();
            }
        }
    });

    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        if (g_mouseInfo.dragging) {
            // 处理相机旋转
            const deltaX = event.clientX - g_mouseInfo.lastX;
            const deltaY = event.clientY - g_mouseInfo.lastY;
            
            // 更新相机的欧拉角
            g_camera.yaw += deltaX * g_mouseInfo.sensitivity;
            g_camera.pitch -= deltaY * g_mouseInfo.sensitivity;
            
            // 限制俯仰角范围在-89到89度之间，防止万向节死锁
            g_camera.pitch = Math.max(-89, Math.min(89, g_camera.pitch));
            
            // 更新相机方向
            g_camera.updateCameraVectors();
            
            g_mouseInfo.lastX = event.clientX;
            g_mouseInfo.lastY = event.clientY;
        } else {
            // 当不在拖动状态时，实时更新选中的方块
            selectBlock(mouseX, mouseY);
        }
    });

    // 添加鼠标右键事件监听（阻止默认菜单）
    canvas.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });
}

function onWindowResize() { /* ... same ... */ 
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    if (g_camera) { 
        g_camera.aspect = gl.canvas.width / gl.canvas.height;
        g_camera.updateProjectionMatrix();
    }
}

function initVertexBuffersCube() { /* ... same (provides generic cube vertices/indices) ... */ 
    const verticesTexCoords = new Float32Array([ -0.5, -0.5,  0.5,  0.0, 0.0,  0.5, -0.5,  0.5,  1.0, 0.0,  0.5,  0.5,  0.5,  1.0, 1.0, -0.5,  0.5,  0.5,  0.0, 1.0, -0.5, -0.5, -0.5,  1.0, 0.0, -0.5,  0.5, -0.5,  1.0, 1.0,  0.5,  0.5, -0.5,  0.0, 1.0,  0.5, -0.5, -0.5,  0.0, 0.0, -0.5,  0.5,  0.5,  0.0, 1.0, -0.5,  0.5, -0.5,  0.0, 0.0,  0.5,  0.5, -0.5,  1.0, 0.0,  0.5,  0.5,  0.5,  1.0, 1.0, -0.5, -0.5,  0.5,  1.0, 1.0,  0.5, -0.5,  0.5,  0.0, 1.0,  0.5, -0.5, -0.5,  0.0, 0.0, -0.5, -0.5, -0.5,  1.0, 0.0,  0.5, -0.5,  0.5,  0.0, 0.0,  0.5, -0.5, -0.5,  1.0, 0.0,  0.5,  0.5, -0.5,  1.0, 1.0,  0.5,  0.5,  0.5,  0.0, 1.0, -0.5, -0.5,  0.5,  1.0, 0.0, -0.5,  0.5,  0.5,  1.0, 1.0, -0.5,  0.5, -0.5,  0.0, 1.0, -0.5, -0.5, -0.5,  0.0, 0.0 ]);
    const indices = new Uint8Array([ 0,  1,  2,    0,  2,  3,  4,  5,  6,    4,  6,  7,  8,  9, 10,    8, 10, 11, 12, 13, 14,   12, 14, 15, 16, 17, 18,   16, 18, 19, 20, 21, 22,   20, 22, 23 ]);
    const num_indices = indices.length;
    const vertexTexCoordBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer || !indexBuffer) { console.log("Buffer creation failed"); return -1; }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
    const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) { console.log("Failed to get a_Position"); return -1; }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
    const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) { console.log("Failed to get a_TexCoord"); return -1; }
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return num_indices;
}

function initTextures() {
    g_texture0 = gl.createTexture();
    if (!g_texture0) {
        console.log('Failed to create texture object');
        return false;
    }

    const image = new Image();
    image.onload = function() {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, g_texture0);
        
        // 修正纹理参数设置
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // 上传纹理数据
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // 设置采样器
        gl.uniform1i(u_Sampler, 0);
    };
    image.onerror = function() {
        console.log('Failed to load texture image');
    };
    image.src = 'square.png';
    return true;
}

function animate() { /* ... same (animates g_currentAngle for the spinning cube) ... */ 
    const now = Date.now();
    const elapsed = now - g_lastTime;
    g_lastTime = now;
    g_currentAngle = (g_currentAngle + (ANGLE_STEP * elapsed) / 1000.0) % 360;
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 更新视锥体
    const viewProjectionMatrix = new Matrix4(g_camera.projectionMatrix);
    viewProjectionMatrix.multiply(g_camera.viewMatrix);
    g_frustum.update(viewProjectionMatrix);

    // --- Draw Skybox ---
    gl.depthFunc(gl.LEQUAL);
    g_skyModelMatrix.setIdentity();
    // 移除平移部分，使天空盒跟随相机
    const viewMatrixWithoutTranslation = new Matrix4(g_camera.viewMatrix);
    viewMatrixWithoutTranslation.elements[12] = 0;
    viewMatrixWithoutTranslation.elements[13] = 0;
    viewMatrixWithoutTranslation.elements[14] = 0;

    g_mvpMatrix.set(g_camera.projectionMatrix);
    g_mvpMatrix.multiply(viewMatrixWithoutTranslation);
    g_mvpMatrix.multiply(g_skyModelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);

    gl.uniform1i(u_UseTextures, 0);
    gl.uniform1i(u_IsSkybox, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, g_skyboxTexture);
    gl.uniform1i(u_SkyboxSampler, 1);
    gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);
    gl.depthFunc(gl.LESS);

    // 重置天空盒标志
    gl.uniform1i(u_IsSkybox, 0);

    // --- Draw Ground ---
    g_groundModelMatrix.setIdentity();
    g_groundModelMatrix.translate(0, -0.75, 0);
    g_groundModelMatrix.scale(50, 0.5, 50);

    g_mvpMatrix.set(g_camera.projectionMatrix);
    g_mvpMatrix.multiply(g_camera.viewMatrix);
    g_mvpMatrix.multiply(g_groundModelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);

    // 使用纯色而不是纹理
    gl.uniform1i(u_UseTextures, 0);
    // 带褐色的浅色水泥色
    gl.uniform4f(u_BaseColor, 0.75, 0.7, 0.65, 1.0);
    gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);

    // 更新和渲染地形区块
    updateActiveChunks();

    // --- Draw Terrain ---
    const cameraPos = g_camera.eye;
    const MAX_RENDER_DISTANCE = 40.0;
    const MAX_RENDER_DISTANCE_SQ = MAX_RENDER_DISTANCE * MAX_RENDER_DISTANCE;

    // 遍历激活的区块
    for(const chunkKey of g_terrain.activeChunks) {
        const blocks = g_terrain.chunks.get(chunkKey);
        if (!blocks) continue;

        // 渲染区块中的方块
        for(const block of blocks) {
            const worldX = block.matrix.elements[12];
            const worldY = block.matrix.elements[13];
            const worldZ = block.matrix.elements[14];

            const dx = worldX - cameraPos.elements[0];
            const dy = worldY - cameraPos.elements[1];
            const dz = worldZ - cameraPos.elements[2];
            const distSq = dx*dx + dy*dy + dz*dz;

            if (distSq > MAX_RENDER_DISTANCE_SQ || !g_frustum.containsPoint(worldX, worldY, worldZ)) {
                continue;
            }

            g_mvpMatrix.set(g_camera.projectionMatrix);
            g_mvpMatrix.multiply(g_camera.viewMatrix);
            g_mvpMatrix.multiply(block.matrix);
            gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);

            // 如果是选中的方块，使用高亮颜色
            if (block === g_selectedBlock) {
                gl.uniform4f(u_BaseColor, 1.0, 1.0, 0.0, 1.0); // 黄色高亮
            } else {
                // 根据方块类型设置颜色
                switch(block.type) {
                    case g_terrain.blockTypes.GRASS:
                        gl.uniform4f(u_BaseColor, 0.4, 0.8, 0.3, 1.0); // 鲜艳的草地绿色
                        break;
                    case g_terrain.blockTypes.DIRT:
                        gl.uniform4f(u_BaseColor, 0.6, 0.4, 0.2, 1.0); // 泥土棕色
                        break;
                    case g_terrain.blockTypes.STONE:
                        gl.uniform4f(u_BaseColor, 0.6, 0.6, 0.6, 1.0); // 石头灰色
                        break;
                    case g_terrain.blockTypes.WOOD:
                        gl.uniform4f(u_BaseColor, 0.4, 0.3, 0.2, 1.0); // 深棕色木头
                        break;
                    case g_terrain.blockTypes.LEAVES:
                        gl.uniform4f(u_BaseColor, 0.2, 0.6, 0.2, 1.0); // 深绿色树叶
                        break;
                    default:
                        gl.uniform4f(u_BaseColor, 0.8, 0.8, 0.8, 1.0); // 默认浅灰色
                }
            }

            gl.uniform1i(u_UseTextures, 0);
            gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);
        }
    }

    // --- Draw Spinning Cube ---
    g_worldModelMatrix.setIdentity();
    g_worldModelMatrix.translate(g_spinningCubePos.x, g_spinningCubePos.y, g_spinningCubePos.z);
    g_worldModelMatrix.rotate(g_currentAngle, 0, 1, 0);

    g_mvpMatrix.set(g_camera.projectionMatrix);
    g_mvpMatrix.multiply(g_camera.viewMatrix);
    g_mvpMatrix.multiply(g_worldModelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrixLoc, false, g_mvpMatrix.elements);

    gl.uniform1i(u_UseTextures, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, g_texture0);
    gl.uniform1i(u_Sampler, 0);
    gl.drawElements(gl.TRIANGLES, n_indices_cube, gl.UNSIGNED_BYTE, 0);
}

function tick() {
    requestAnimationFrame(tick);
    animate();
    g_camera.update(); // 添加相机更新
    drawScene();
}

// --- EVENT HANDLING --- (remains the same)
function initEventHandlers() { /* ... same ... */ 
    document.addEventListener('keydown', handleKeyDown);
}
function handleKeyDown(ev) {
    let keyProcessed = true;
    switch (ev.code) {
        case 'KeyW': g_camera.moveForward(); break;
        case 'KeyS': g_camera.moveBackward(); break;
        case 'KeyA': g_camera.moveLeft(); break;
        case 'KeyD': g_camera.moveRight(); break;
        case 'KeyQ': g_camera.panLeft(); break;
        case 'KeyE': g_camera.panRight(); break;
        case 'Space': g_camera.jump(); break; // 添加跳跃控制
        default: keyProcessed = false; break;
    }
    if (keyProcessed) {
        ev.preventDefault();
    }
}

// 检查与旋转立方体的碰撞
function checkSpinningCubeCollision(x, z) {
    const radius = 0.7; // 碰撞半径稍大于立方体实际大小
    const dx = x - g_spinningCubePos.x;
    const dz = z - g_spinningCubePos.z;
    return (dx * dx + dz * dz) < (radius * radius);
}

// 初始化天空盒纹理
function initSkyboxTexture() {
    g_skyboxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, g_skyboxTexture);

    const faceInfos = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'skybox/right.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'skybox/left.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'skybox/top.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'skybox/bottom.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'skybox/front.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'skybox/back.jpg' },
    ];

    // 设置每个面的默认颜色，在加载完成前显示
    faceInfos.forEach(faceInfo => {
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        // 使用蓝色作为默认颜色
        const pixel = new Uint8Array([135, 206, 235, 255]);
        gl.texImage2D(faceInfo.target, level, internalFormat, width, height, 0, format, type, pixel);
    });

    // 加载每个面的纹理
    faceInfos.forEach(faceInfo => {
        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, g_skyboxTexture);
            gl.texImage2D(faceInfo.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        };
        image.src = faceInfo.url;
    });

    return true;
}

// 添加射线-方块相交检测函数
function rayBlockIntersection(origin, direction, blockPosition) {
    const EPSILON = 0.0001;
    const blockMin = [
        blockPosition[0] - 0.5,
        blockPosition[1] - 0.5,
        blockPosition[2] - 0.5
    ];
    const blockMax = [
        blockPosition[0] + 0.5,
        blockPosition[1] + 0.5,
        blockPosition[2] + 0.5
    ];
    
    let tmin = -Infinity;
    let tmax = Infinity;
    
    for (let i = 0; i < 3; i++) {
        if (Math.abs(direction[i]) < EPSILON) {
            if (origin[i] < blockMin[i] || origin[i] > blockMax[i]) {
                return null;
            }
        } else {
            const t1 = (blockMin[i] - origin[i]) / direction[i];
            const t2 = (blockMax[i] - origin[i]) / direction[i];
            
            tmin = Math.max(tmin, Math.min(t1, t2));
            tmax = Math.min(tmax, Math.max(t1, t2));
            
            if (tmin > tmax) return null;
        }
    }
    
    if (tmin < 0) return null;
    return tmin;
}

// 添加方块选择函数
function selectBlock(mouseX, mouseY) {
    // 将鼠标坐标转换为标准化设备坐标
    const x = (2.0 * mouseX) / canvas.width - 1.0;
    const y = 1.0 - (2.0 * mouseY) / canvas.height;
    
    // 创建射线
    const rayClip = new Vector4([x, y, -1.0, 1.0]);
    const invProjMatrix = new Matrix4();
    invProjMatrix.setInverseOf(g_camera.projectionMatrix);
    const rayEye = invProjMatrix.multiplyVector4(rayClip);
    rayEye.elements[2] = -1.0;
    rayEye.elements[3] = 0.0;
    
    const invViewMatrix = new Matrix4();
    invViewMatrix.setInverseOf(g_camera.viewMatrix);
    const rayWorld = invViewMatrix.multiplyVector4(rayEye);
    const rayDir = new Vector3(rayWorld.elements);
    rayDir.normalize();
    
    // 检查与所有方块的相交
    let minDist = Infinity;
    g_selectedBlock = null;
    g_selectedFace = null;
    
    // 检查活动区块中的方块
    for (const chunkKey of g_terrain.activeChunks) {
        const blocks = g_terrain.chunks.get(chunkKey);
        if (!blocks) continue;
        
        for (const block of blocks) {
            const blockPos = [
                block.matrix.elements[12],
                block.matrix.elements[13],
                block.matrix.elements[14]
            ];
            
            const dist = rayBlockIntersection(
                [g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]],
                [rayDir.elements[0], rayDir.elements[1], rayDir.elements[2]],
                blockPos
            );
            
            if (dist !== null && dist < minDist && dist <= g_maxPlaceDistance) {
                minDist = dist;
                g_selectedBlock = block;
                
                // 计算碰撞点
                const hitPoint = [
                    g_camera.eye.elements[0] + rayDir.elements[0] * dist,
                    g_camera.eye.elements[1] + rayDir.elements[1] * dist,
                    g_camera.eye.elements[2] + rayDir.elements[2] * dist
                ];
                
                // 确定碰撞面
                const relativeHit = [
                    hitPoint[0] - blockPos[0],
                    hitPoint[1] - blockPos[1],
                    hitPoint[2] - blockPos[2]
                ];
                
                // 找到最近的面
                const absX = Math.abs(relativeHit[0]);
                const absY = Math.abs(relativeHit[1]);
                const absZ = Math.abs(relativeHit[2]);
                
                if (absX > absY && absX > absZ) {
                    g_selectedFace = relativeHit[0] > 0 ? 'right' : 'left';
                } else if (absY > absX && absY > absZ) {
                    g_selectedFace = relativeHit[1] > 0 ? 'top' : 'bottom';
                } else {
                    g_selectedFace = relativeHit[2] > 0 ? 'front' : 'back';
                }
            }
        }
    }
}

// 添加和删除方块的函数
function addBlock() {
    if (!g_selectedBlock || !g_selectedFace) return;
    
    const pos = {
        x: g_selectedBlock.matrix.elements[12],
        y: g_selectedBlock.matrix.elements[13],
        z: g_selectedBlock.matrix.elements[14]
    };
    
    // 根据选中的面确定新方块的位置
    switch (g_selectedFace) {
        case 'right': pos.x += 1; break;
        case 'left': pos.x -= 1; break;
        case 'top': pos.y += 1; break;
        case 'bottom': pos.y -= 1; break;
        case 'front': pos.z += 1; break;
        case 'back': pos.z -= 1; break;
    }
    
    // 检查是否与相机碰撞
    const dx = pos.x - g_camera.eye.elements[0];
    const dy = pos.y - g_camera.eye.elements[1];
    const dz = pos.z - g_camera.eye.elements[2];
    const distSq = dx*dx + dy*dy + dz*dz;
    if (distSq < 2.0) return; // 防止在相机位置放置方块
    
    // 创建新方块
    const model = new Matrix4();
    model.setIdentity();
    model.translate(pos.x, pos.y, pos.z);
    
    // 获取区块坐标
    const chunkX = Math.floor((pos.x + g_terrain.size/2) / g_terrain.chunkSize);
    const chunkZ = Math.floor((pos.z + g_terrain.size/2) / g_terrain.chunkSize);
    const key = getChunkKey(chunkX, chunkZ);
    
    // 添加到对应的区块
    if (!g_terrain.chunks.has(key)) {
        g_terrain.chunks.set(key, []);
    }
    g_terrain.chunks.get(key).push({
        matrix: model,
        height: pos.y,
        maxHeight: pos.y,
        type: g_terrain.blockTypes.DIRT
    });
}

function removeBlock() {
    if (!g_selectedBlock) return;
    
    // 获取方块所在的区块
    const pos = {
        x: g_selectedBlock.matrix.elements[12],
        y: g_selectedBlock.matrix.elements[13],
        z: g_selectedBlock.matrix.elements[14]
    };
    
    const chunkX = Math.floor((pos.x + g_terrain.size/2) / g_terrain.chunkSize);
    const chunkZ = Math.floor((pos.z + g_terrain.size/2) / g_terrain.chunkSize);
    const key = getChunkKey(chunkX, chunkZ);
    
    // 从区块中移除方块
    if (g_terrain.chunks.has(key)) {
        const blocks = g_terrain.chunks.get(key);
        const index = blocks.indexOf(g_selectedBlock);
        if (index !== -1) {
            blocks.splice(index, 1);
        }
    }
}

// 修改相机初始化
function initCamera() {
    g_camera = new Camera();
    g_camera.aspect = canvas.width / canvas.height;
    g_camera.updateProjectionMatrix();
    
    // 设置初始位置和方向
    g_camera.eye = new Vector3([0, 5, 10]);
    g_camera.pitch = -15;  // 略微向下看
    g_camera.yaw = -90;    // 看向-z方向
    g_camera.updateCameraVectors();
}