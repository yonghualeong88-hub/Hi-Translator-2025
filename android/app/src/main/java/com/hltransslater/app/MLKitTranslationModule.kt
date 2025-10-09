package com.hltransslater.app

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import com.google.mlkit.nl.translate.TranslateRemoteModel

class MLKitTranslationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MLKitTranslationModule"
        private val translators = mutableMapOf<String, Translator>()
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun translate(
        text: String,
        fromLang: String,
        toLang: String,
        promise: Promise
    ) {
        translateText(text, fromLang, toLang, promise)
    }

    @ReactMethod
    fun translateText(
        text: String,
        fromLang: String,
        toLang: String,
        promise: Promise
    ) {
        try {
            val sourceLanguage = convertToMLKitLanguageCode(fromLang)
            val targetLanguage = convertToMLKitLanguageCode(toLang)
            
            val key = "$sourceLanguage-$targetLanguage"
            val translator = translators.getOrPut(key) {
                val options = TranslatorOptions.Builder()
                    .setSourceLanguage(sourceLanguage)
                    .setTargetLanguage(targetLanguage)
                    .build()
                Translation.getClient(options)
            }

            val conditions = DownloadConditions.Builder()
                .requireWifi()
                .build()

            translator.downloadModelIfNeeded(conditions)
                .addOnSuccessListener {
                    translator.translate(text)
                        .addOnSuccessListener { translatedText ->
                            val result: WritableMap = Arguments.createMap()
                            result.putString("translatedText", translatedText)
                            result.putString("sourceLanguage", fromLang)
                            result.putString("targetLanguage", toLang)
                            promise.resolve(result)
                        }
                        .addOnFailureListener { exception ->
                            promise.reject("TRANSLATION_ERROR", "翻译失败: ${exception.message}", exception)
                        }
                }
                .addOnFailureListener { exception ->
                    promise.reject("MODEL_DOWNLOAD_ERROR", "模型下载失败: ${exception.message}", exception)
                }

        } catch (e: Exception) {
            promise.reject("MLKIT_ERROR", "ML Kit 翻译错误: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isLanguageDownloaded(languageCode: String, promise: Promise) {
        try {
            val mlkitCode = convertToMLKitLanguageCode(languageCode)
            val model = TranslateRemoteModel.Builder(mlkitCode).build()
            val modelManager = RemoteModelManager.getInstance()
            
            modelManager.isModelDownloaded(model)
                .addOnSuccessListener { isDownloaded ->
                    promise.resolve(isDownloaded)
                }
                .addOnFailureListener { exception ->
                    promise.resolve(false)
                }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun downloadLanguagePack(languageCode: String, promise: Promise) {
        downloadLanguageModel(languageCode, promise)
    }

    @ReactMethod
    fun downloadLanguageModel(languageCode: String, promise: Promise) {
        try {
            val mlkitCode = convertToMLKitLanguageCode(languageCode)
            val options = TranslatorOptions.Builder()
                .setSourceLanguage(TranslateLanguage.ENGLISH)
                .setTargetLanguage(mlkitCode)
                .build()
            
            val translator = Translation.getClient(options)
            val conditions = DownloadConditions.Builder()
                .build()

            translator.downloadModelIfNeeded(conditions)
                .addOnSuccessListener {
                    translator.close()
                    promise.resolve(true)
                }
                .addOnFailureListener { exception ->
                    translator.close()
                    promise.reject("DOWNLOAD_ERROR", "模型下载失败: ${exception.message}", exception)
                }

        } catch (e: Exception) {
            promise.reject("MLKIT_ERROR", "下载语言模型错误: ${e.message}", e)
        }
    }

    @ReactMethod
    fun removeLanguagePack(languageCode: String, promise: Promise) {
        deleteLanguageModel(languageCode, promise)
    }

    @ReactMethod
    fun deleteLanguageModel(languageCode: String, promise: Promise) {
        try {
            val mlkitCode = convertToMLKitLanguageCode(languageCode)
            val options = TranslatorOptions.Builder()
                .setSourceLanguage(TranslateLanguage.ENGLISH)
                .setTargetLanguage(mlkitCode)
                .build()
            
            val translator = Translation.getClient(options)
            translator.close()
            
            // ML Kit 没有提供删除模型的 API，所以我们只能标记成功
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("MLKIT_ERROR", "删除语言模型错误: ${e.message}", e)
        }
    }

    private fun convertToMLKitLanguageCode(languageCode: String): String {
        return when (languageCode.lowercase()) {
            "zh-cn", "zh" -> TranslateLanguage.CHINESE
            "zh-tw" -> TranslateLanguage.CHINESE
            "en" -> TranslateLanguage.ENGLISH
            "ja" -> TranslateLanguage.JAPANESE
            "ko" -> TranslateLanguage.KOREAN
            "fr" -> TranslateLanguage.FRENCH
            "de" -> TranslateLanguage.GERMAN
            "es" -> TranslateLanguage.SPANISH
            "it" -> TranslateLanguage.ITALIAN
            "pt" -> TranslateLanguage.PORTUGUESE
            "ru" -> TranslateLanguage.RUSSIAN
            "ar" -> TranslateLanguage.ARABIC
            "hi" -> TranslateLanguage.HINDI
            "th" -> TranslateLanguage.THAI
            "vi" -> TranslateLanguage.VIETNAMESE
            "id" -> TranslateLanguage.INDONESIAN
            "tr" -> TranslateLanguage.TURKISH
            "nl" -> TranslateLanguage.DUTCH
            "pl" -> TranslateLanguage.POLISH
            else -> TranslateLanguage.ENGLISH
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        translators.values.forEach { it.close() }
        translators.clear()
    }
}
