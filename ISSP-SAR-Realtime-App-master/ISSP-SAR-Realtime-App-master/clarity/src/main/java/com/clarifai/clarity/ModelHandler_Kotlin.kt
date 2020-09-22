/**
 *  Copyright © 2019 Clarifai
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.clarifai.clarity

import android.util.Log
import com.clarifai.clarifai_android_sdk.core.Clarifai
import com.clarifai.clarifai_android_sdk.dataassets.DataAsset
import com.clarifai.clarifai_android_sdk.dataassets.Image
import com.clarifai.clarifai_android_sdk.datamodels.Input
import com.clarifai.clarifai_android_sdk.datamodels.Model
import com.clarifai.clarifai_android_sdk.datamodels.Output
import com.clarifai.clarifai_android_sdk.utils.Error
import kotlinx.coroutines.GlobalScope
import java.util.*
import kotlinx.coroutines.launch

/**
 * ModelHandler_Kotlin.kt
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */
@Suppress("ClassName")
internal class ModelHandler_Kotlin (private var modelLoadedCallback : (Boolean) -> Unit) : ModelHandlerBase() {
    private companion object {
        @JvmField var TAG = ModelHandler_Kotlin::class.simpleName.toString()
    }

    init {
        loadModel()
    }

    @Volatile var predictionIsRunning = false
    private var model : Model? = null

    override fun isModelLoaded(): Boolean {
        return modelLoaded
    }

    override fun loadModel() {
        GlobalScope.launch {
            model = Clarifai.getInstance().generalModel
            modelLoaded = true
            modelLoadedCallback(true)
        }
    }

    override fun predict(image : Image, callback : (List<Array<String>>) -> Unit) {
        if (model == null || predictionIsRunning) return
        predictionIsRunning = true
        GlobalScope.launch {
            val dataAsset = DataAsset(image)
            val input = Input(dataAsset)
            input.id = "inputId"
            val startTime = System.currentTimeMillis()
            model!!.predict(listOf(input), object: Model.ModelCallbacks() {
                @Suppress("FunctionName")
                override fun PredictionComplete(successful: Boolean, error: Error?) {
                    val duration = System.currentTimeMillis() - startTime
                    Log.d(TAG, "Time taken to do the prediction: $duration ms")
                    if (successful) {
                        val outputs: List<Output> = model?.outputs as List<Output>
                        val concepts: List<Array<String>> = outputs.last()
                                .dataAsset
                                .concepts
                                .take(ModelHandlerBase.MAX_CONCEPTS)
                                .map {
                                    arrayOf(it.name, "%.4f".format(Locale.getDefault(), it.score))
                                }
                        callback(concepts)
                    } else {
                        Log.e(TAG, error?.errorMessage)
                    }
                    predictionIsRunning = false
                }
            })
        }
    }
}
