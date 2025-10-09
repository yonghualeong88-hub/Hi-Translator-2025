# Metro 缓存问题说明

## 问题
即使使用 `--clear` 参数，`translationModeManager.ts` 的修改仍然不生效，显示只打包 1 个模块。

## 解决方案
添加了注释触发文件变化，强制 Metro 重新编译。

## 重新启动步骤
1. 关闭所有 Metro 进程
2. 删除缓存
3. 重新启动

