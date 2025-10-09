package com.hltransslater.app

import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

/**
 * ML Kit OCR 原生模块
 * 提供离线文字识别功能
 */
class MLKitOCRModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MLKitOCR"
    }

    /**
     * 识别图片中的文字（离线）
     * @param imageUri 图片路径
     * @param promise Promise 回调
     */
    @ReactMethod
    fun recognizeText(imageUri: String, promise: Promise) {
        try {
            // 解析图片路径
            val cleanUri = imageUri.replace("file://", "")
            val file = File(cleanUri)
            
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "图片文件不存在: $cleanUri")
                return
            }

            // 读取图片
            val bitmap = BitmapFactory.decodeFile(file.absolutePath)
            if (bitmap == null) {
                promise.reject("INVALID_IMAGE", "无法读取图片: $cleanUri")
                return
            }

            // ✅ 输出图片实际尺寸（用于调试坐标问题）
            android.util.Log.d("MLKitOCR", "图片实际尺寸: ${bitmap.width} x ${bitmap.height}")

            // 创建 InputImage
            val image = InputImage.fromBitmap(bitmap, 0)
            
            // 创建文字识别器（拉丁文，支持英文、法语、德语等）
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            
            // 执行识别
            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val resultArray = Arguments.createArray()
                    
                    for (block in visionText.textBlocks) {
                        for (line in block.lines) {
                            val textInfo = Arguments.createMap()
                            textInfo.putString("text", line.text)
                            textInfo.putDouble("confidence", line.confidence?.toDouble() ?: 0.9)
                            
                            // 获取边界框
                            line.boundingBox?.let { box ->
                                val bounds = Arguments.createMap()
                                bounds.putInt("x0", box.left)
                                bounds.putInt("y0", box.top)
                                bounds.putInt("x1", box.right)
                                bounds.putInt("y1", box.bottom)
                                textInfo.putMap("bounds", bounds)
                            }
                            
                            resultArray.pushMap(textInfo)
                        }
                    }
                    
                    // 返回结果
                    val result = Arguments.createMap()
                    result.putArray("texts", resultArray)
                    result.putInt("totalBlocks", visionText.textBlocks.size)
                    result.putString("fullText", visionText.text)
                    
                    // ✅ 返回图片实际尺寸
                    val imageSize = Arguments.createMap()
                    imageSize.putInt("width", bitmap.width)
                    imageSize.putInt("height", bitmap.height)
                    result.putMap("imageSize", imageSize)
                    
                    promise.resolve(result)
                    
                    // 释放资源
                    bitmap.recycle()
                }
                .addOnFailureListener { e ->
                    bitmap.recycle()
                    promise.reject("OCR_FAILED", "OCR 识别失败: ${e.message}", e)
                }
                
        } catch (e: Exception) {
            promise.reject("OCR_ERROR", "OCR 处理异常: ${e.message}", e)
        }
    }

    /**
     * 检查 OCR 模块是否可用
     */
    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}

