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

import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.os.Handler
import android.util.Log


import android.content.SharedPreferences

import com.clarifai.clarifai_android_sdk.dataassets.Image
import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingQueue
import android.app.Application
import android.icu.lang.UCharacter.GraphemeClusterBreak.T





/**
 * PeriodicPrediction.kt
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */

class PeriodicPrediction internal constructor(
        homeActivity: Activity) {
    private val useJavaHandler = false
    internal var isModelLoaded: Boolean = false
    private lateinit var context: Context

    private lateinit var capturePeriodicHandler: Handler
    private lateinit var applicationContextProvider: ApplicationContextProvider

    private lateinit var predictionPeriodicHandler: Handler
    private lateinit var prefs: SharedPreferences
    private val captureQueues: BlockingQueue<QueueData>
    private var homeActivityCallbacks: PredictionTriggers

    private var modelHandlerJava: ModelHandler_Java? = null
    private var modelHandlerKotlin: ModelHandler_Kotlin? = null

    private val isPredictionRunning: Boolean
        get() = if (useJavaHandler) {
            modelHandlerJava!!.isPredictionRunning
        } else {
            modelHandlerKotlin!!.predictionIsRunning
        }

    private inner class QueueData internal constructor(var image: Image, var timeInMs: Long)

    init {

        try {
            homeActivityCallbacks = homeActivity as PredictionTriggers
        } catch (cce: ClassCastException) {
            throw RuntimeException("Main Activity (" + homeActivity.javaClass.simpleName +
                    ") does not implement PredictionTriggers")
        }

        isModelLoaded = false
        captureQueues = LinkedBlockingQueue()
        if (useJavaHandler) {
            modelHandlerJava = ModelHandler_Java { isSuccess ->
                if (isSuccess) {
                    isModelLoaded = true
                    homeActivityCallbacks.modelLoaded()
                }
                null
            }
        } else {
            Log.d(TAG, "Loading the model now")

            modelHandlerKotlin = ModelHandler_Kotlin { isSuccess ->
                Log.d(TAG, "Model loading complete with $isSuccess")
                if (isSuccess) {
                    isModelLoaded = true
                    homeActivityCallbacks.modelLoaded()
                }
            }
        }
    }

    internal fun onResume() {

        capturePeriodicHandler = Handler()
        capturePeriodicHandler.post(object : Runnable {
            override fun run() {
                if (useJavaHandler) {
                    if (modelHandlerJava!!.isModelLoaded()) {
                        onTakePhoneButtonClicked()
                    }
                } else {
                    if (modelHandlerKotlin!!.modelLoaded) {
                        onTakePhoneButtonClicked()
                    }
                }
                capturePeriodicHandler.postDelayed(this, REFRESH_RATE_MS.toLong())
            }
        })

        Log.d("Picture Interval", REFRESH_RATE_MS.toString())

        predictionPeriodicHandler = Handler()




        predictionPeriodicHandler.post(object : Runnable {
            override fun run() {
                Log.d(TAG, "Bitmap queue size: " + captureQueues.size)
                Log.d("Time Interval", "referesh_rate: " + REFRESH_RATE_MS.toString())
                if (!captureQueues.isEmpty() && !isPredictionRunning) {
                    try {
                        if (captureQueues.size > 4) {
                            for (i in 0 until captureQueues.size - 1) {
                                captureQueues.take()
                            }
                        }
                        val queueData = captureQueues.take()
                        val image = queueData.image
                        val timeTaken = System.currentTimeMillis() - queueData.timeInMs
                        Log.d(TAG, "Time lag to process taken bitmap: $timeTaken")
                        predictWithImage(image) // Does checking and waiting if empty by itself. So, no need to handle empty case
                    } catch (e: InterruptedException) {
                        e.printStackTrace()
                    }

                }
                predictionPeriodicHandler.postDelayed(this, (REFRESH_RATE_MS / 2).toLong())
                Log.d(TAG, "Bitmap queue size after: " + captureQueues.size)
            }
        })

    }

    internal fun onPause() {
        capturePeriodicHandler.removeCallbacksAndMessages(null)
        predictionPeriodicHandler.removeCallbacksAndMessages(null)
    }


    private fun predictWithImage(image: Image) {
        if (useJavaHandler) {
            modelHandlerJava!!.predict(image) { outputs ->
                homeActivityCallbacks.onReceivedPredictions(outputs)
            }
        } else {
            modelHandlerKotlin!!.predict(image) { outputs ->
                homeActivityCallbacks.onReceivedPredictions(outputs)
            }
        }
    }

    private fun onTakePhoneButtonClicked() {
        val bitmap = homeActivityCallbacks.captureBitmap()
        if (bitmap != null) {
            val image = Image(bitmap)
            val queueData = QueueData(image, System.currentTimeMillis())
            captureQueues.add(queueData)
        }
    }

    fun Change_RFR(int:Int){
        REFRESH_RATE_MS = int
        Log.d(TAG, REFRESH_RATE_MS.toString())
    }

    internal interface PredictionTriggers {
        fun onReceivedPredictions(outputs: List<Array<String>>)
        fun modelLoaded()
        fun captureBitmap(): Bitmap?
    }




    companion object {
        var REFRESH_RATE_MS = 5000
        private val TAG = PeriodicPrediction::class.java.simpleName
    }
}

class ApplicationContextProvider : Application() {

    private var mContext: Context? = null

    fun getContext(): Context? {
        return mContext
    }

    fun setContext(mContext: Context) {
        this.mContext = mContext
    }
}


