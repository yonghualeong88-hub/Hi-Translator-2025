# 网络配置说明

## 🎯 配置更改总结

本次更新解决了项目中的网络连接问题：

### ✅ 已修复的问题

1. **硬编码IP地址** - 移除了所有硬编码的IP地址 `10.243.25.104`
2. **端口不一致** - 统一使用端口 `3001` 作为后端服务端口
3. **配置管理** - 创建了统一的环境配置管理系统
4. **服务调用** - 更新了所有API调用使用统一配置

### 🔧 新增配置文件

#### `config/environment.ts`
- 统一的环境配置管理
- 支持环境变量配置
- 自动检测平台（移动端/Web端）
- 动态IP地址选择

#### 环境变量支持
```bash
# 后端API配置
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_API_PORT=3001

# 开发环境IP地址（如果需要远程访问）
EXPO_PUBLIC_DEV_IP=10.243.25.104

# 是否使用本地IP
EXPO_PUBLIC_USE_LOCAL_IP=false

# API超时设置
EXPO_PUBLIC_API_TIMEOUT=30000

# 调试设置
EXPO_PUBLIC_DEBUG_MODE=true
```

### 📝 修改的文件

1. **`config/apiConfig.ts`** - 重构为使用统一配置
2. **`config/environment.ts`** - 新增智能网络配置，自动检测移动设备
3. **`services/translationService.ts`** - 移除硬编码IP
4. **`components/RecordButton.tsx`** - 使用统一API配置
5. **`app/(tabs)/index.tsx`** - 修复语音翻译API调用
6. **`backend/config/api.ts`** - 统一端口配置
7. **`frontend/services/api.ts`** - 更新端口配置
8. **`frontend/services/translationService.ts`** - 更新端口配置
9. **`start-dev.js`** - 修复启动脚本端口信息

### 🚀 使用方法

#### 开发环境
1. **Web端**: 自动使用 `localhost:3001`
2. **移动端**: 自动使用 `10.243.25.104:3001`（本地IP地址）
3. 如需自定义IP，修改 `EXPO_PUBLIC_DEV_IP` 环境变量

#### 生产环境
1. 设置 `EXPO_PUBLIC_API_URL` 为生产环境API地址
2. 禁用调试模式：`EXPO_PUBLIC_DEBUG_MODE=false`

### 🔍 验证配置

检查后端服务是否运行在正确端口：
```bash
netstat -an | findstr :3001
```

测试API连接：
```bash
curl http://localhost:3001/api/test
```

### 📋 注意事项

1. 确保后端服务运行在端口 `3001`
2. 如需远程访问，确保防火墙允许端口 `3001`
3. 环境变量更改后需要重启应用
4. 调试模式下会显示详细的API调用日志

### 🔧 常见问题解决

#### 问题：Network request failed 错误
**原因**: 移动设备无法访问 `localhost`
**解决方案**: 系统已自动配置移动设备使用本地IP地址 `10.243.25.104:3001`

#### 问题：API连接超时
**原因**: 网络连接问题或防火墙阻止
**解决方案**: 
1. 检查设备和开发机器在同一WiFi网络
2. 确认防火墙允许端口3001
3. 检查IP地址是否正确

#### 问题：音频文件格式错误
**原因**: 录音格式不符合API要求
**解决方案**: 录音配置已优化，支持 `.m4a` 格式
