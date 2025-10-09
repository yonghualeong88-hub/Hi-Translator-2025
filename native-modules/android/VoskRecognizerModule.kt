package com.hltransslater.app

import android.util.Log
import com.facebook.react.bridge.*
import org.vosk.Model
import org.vosk.Recognizer
import org.json.JSONObject
import java.io.File
import java.io.IOException

/**
 * Vosk 离线语音识别原生模块
 */
class VoskRecognizerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "VoskRecognizer"
    private var model: Model? = null
    private var currentLanguage: String? = null
    
    companion object {
        const val NAME = "VoskRecognizer"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun initializeModel(modelPath: String, language: String, promise: Promise) {
        try {
            Log.d(TAG, "🔧 初始化Vosk模型: $modelPath (语言: $language)")
            
            val modelFile = File(modelPath)
            if (!modelFile.exists() || !modelFile.isDirectory) {
                promise.reject("MODEL_NOT_FOUND", "模型目录不存在: $modelPath")
                return
            }

            model?.close()
            model = Model(modelPath)
            currentLanguage = language
            
            Log.d(TAG, "✅ Vosk模型初始化成功")
            
            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putString("language", language)
                putString("modelPath", modelPath)
            }
            
            promise.resolve(result)
        } catch (e: IOException) {
            Log.e(TAG, "❌ Vosk模型初始化失败: ${e.message}", e)
            promise.reject("INIT_ERROR", "模型初始化失败: ${e.message}", e)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Vosk模型初始化失败: ${e.message}", e)
            promise.reject("INIT_ERROR", "未知错误: ${e.message}", e)
        }
    }

    @ReactMethod
    fun recognizeFile(audioPath: String, language: String, promise: Promise) {
        try {
            if (model == null) {
                promise.reject("MODEL_NOT_INITIALIZED", "模型未初始化")
                return
            }

            Log.d(TAG, "📁 识别音频文件: $audioPath (语言: $language)")

            val audioFile = File(audioPath)
            if (!audioFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "音频文件不存在: $audioPath")
                return
            }

            val recognizer = Recognizer(model, 16000.0f)
            val inputStream = audioFile.inputStream()
            val buffer = ByteArray(4096)
            var bytesRead: Int
            
            while (inputStream.read(buffer).also { bytesRead = it } >= 0) {
                recognizer.acceptWaveForm(buffer, bytesRead)
            }
            
            val finalResult = recognizer.finalResult()
            inputStream.close()
            
            Log.d(TAG, "✅ 识别完成: $finalResult")
            
            val jsonResult = JSONObject(finalResult)
            val text = jsonResult.getString("text")
            
            val result = Arguments.createMap().apply {
                putString("text", text)
                putDouble("confidence", 0.8)
                putString("language", language)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "❌ 文件识别失败: ${e.message}", e)
            promise.reject("RECOGNIZE_ERROR", "识别失败: ${e.message}", e)
        }
    }

    @ReactMethod
    fun cleanup(promise: Promise) {
        try {
            Log.d(TAG, "🧹 清理Vosk资源")
            model?.close()
            model = null
            currentLanguage = null
            Log.d(TAG, "✅ 资源清理完成")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "❌ 资源清理失败: ${e.message}", e)
            promise.reject("CLEANUP_ERROR", "清理失败: ${e.message}", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        model?.close()
    }
}

