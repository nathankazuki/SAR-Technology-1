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

import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.os.Handler
import android.os.HandlerThread
import android.support.annotation.RequiresPermission
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.TextureView
import android.app.Activity

import java.util.Objects

/**
 * CameraControl.kt
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */
class CameraControl
internal constructor(private val textureView: TextureView, private val cameraManager: CameraManager, homeActivity: Activity) {
    private val TAG = CameraControl::class.java.simpleName

    private var cameraFacing: Int = 0
    private var homeActivityCallbacks: CameraControlTriggers

    private lateinit var cameraDevice: CameraDevice
    private lateinit var backgroundThread: HandlerThread
    private lateinit var backgroundHandler: Handler
    private lateinit var cameraCaptureSession: CameraCaptureSession
    private lateinit var surfaceTextureListener: TextureView.SurfaceTextureListener
    private lateinit var previewSize: Size
    private lateinit var stateCallback: CameraDevice.StateCallback
    private lateinit var captureRequestBuilder: CaptureRequest.Builder
    private lateinit var cameraId: String
    private lateinit var captureRequest: CaptureRequest

    @Volatile
    private var isCameraSetup: Boolean = false

    fun isCameraSetup(): Boolean {
        return isCameraSetup
    }

    private var width = 1080
    private var height = 1920

    init {
        isCameraSetup = false
        try {
            homeActivityCallbacks = homeActivity as CameraControlTriggers
        } catch (cce: ClassCastException) {
            throw RuntimeException("Main Activity (${homeActivity.javaClass.simpleName}) does not implement PredictionTriggers")
        }
        setup()
    }

    val bitmap: Bitmap
        get() {
            val bitmap = textureView.bitmap
            unlock()
            return bitmap

        }

    private fun setup() {
        cameraFacing = CameraCharacteristics.LENS_FACING_BACK

        surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
                this@CameraControl.width = width
                this@CameraControl.height = height
                setUpCamera()
                openCamera()
            }

            override fun onSurfaceTextureSizeChanged(surfaceTexture: SurfaceTexture, width: Int, height: Int) {}

            override fun onSurfaceTextureDestroyed(surfaceTexture: SurfaceTexture): Boolean {
                return false
            }

            override fun onSurfaceTextureUpdated(surfaceTexture: SurfaceTexture) {}
        }

        stateCallback = object : CameraDevice.StateCallback() {
            override fun onOpened(cameraDevice: CameraDevice) {
                this@CameraControl.cameraDevice = cameraDevice
                createPreviewSession()
            }

            override fun onDisconnected(cameraDevice: CameraDevice) {
                cameraDevice.close()
            }

            override fun onError(cameraDevice: CameraDevice, error: Int) {
                cameraDevice.close()
            }
        }
    }

    @RequiresPermission(android.Manifest.permission.CAMERA)
    internal fun onResume() {
        openBackgroundThread()
        if (textureView.isAvailable) {
            setUpCamera()
            openCamera()
        } else {
            textureView.surfaceTextureListener = surfaceTextureListener
        }
    }

    internal fun onStop() {
        closeCamera()
        closeBackgroundThread()
    }

    private fun createPreviewSession() {
        try {
            val surfaceTexture = textureView.surfaceTexture
            surfaceTexture.setDefaultBufferSize(previewSize.width, previewSize.height)
            val previewSurface = Surface(surfaceTexture)
            captureRequestBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
            captureRequestBuilder.addTarget(previewSurface)

            cameraDevice.createCaptureSession(listOf(previewSurface), object : CameraCaptureSession.StateCallback() {
                override fun onConfigured(cameraCaptureSession: CameraCaptureSession) {
                    try {
                        captureRequest = captureRequestBuilder.build()
                        this@CameraControl.cameraCaptureSession = cameraCaptureSession
                        cameraCaptureSession.setRepeatingRequest(captureRequest, null, backgroundHandler)
                        isCameraSetup = true
                    } catch (e: CameraAccessException) {
                        e.printStackTrace()
                    }

                }

                override fun onConfigureFailed(cameraCaptureSession: CameraCaptureSession) {}
            }, backgroundHandler)
        } catch (e: CameraAccessException) {
            e.printStackTrace()
        }

    }

    private fun setUpCamera() {
        try {
            for (cameraId in cameraManager.cameraIdList) {
                val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId)
                if (cameraCharacteristics.get(CameraCharacteristics.LENS_FACING) == cameraFacing) {
                    val streamConfigurationMap = cameraCharacteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
                    previewSize = chooseOptimalSize(Objects.requireNonNull(streamConfigurationMap).getOutputSizes(ImageFormat.JPEG),
                            width, height)
                    this.cameraId = cameraId
                }
            }
        } catch (e: CameraAccessException) {
            e.printStackTrace()
        }

    }

    private fun openCamera() {
        try {
            if (homeActivityCallbacks.checkCameraPermission()) {
                cameraManager.openCamera(cameraId, stateCallback, backgroundHandler)
            }
        } catch (e: CameraAccessException) {
            e.printStackTrace()
        }

    }

    private fun lock(): Boolean {
        if (!isCameraSetup) return false
        return try {
            cameraCaptureSession.capture(captureRequestBuilder.build(), null, backgroundHandler)
            true
        } catch (e: CameraAccessException) {
            e.printStackTrace()
            false
        } catch (e: NullPointerException) {
            e.printStackTrace()
            false
        }

    }

    private fun unlock() {
        try {
            cameraCaptureSession.setRepeatingRequest(captureRequestBuilder.build(), null, backgroundHandler)
        } catch (e: CameraAccessException) {
            e.printStackTrace()
        } catch (e: NullPointerException) {
            e.printStackTrace()
        }

    }

    private fun chooseOptimalSize(outputSizes: Array<Size>, width: Int, height: Int): Size {
        val preferredRatio = height / width.toDouble()
        var currentOptimalSize = outputSizes[0]
        var currentOptimalRatio = currentOptimalSize.width / currentOptimalSize.height.toDouble()
        for (currentSize in outputSizes) {
            val currentRatio = currentSize.width / currentSize.height.toDouble()
            if (Math.abs(preferredRatio - currentRatio) < Math.abs(preferredRatio - currentOptimalRatio)) {
                currentOptimalSize = currentSize
                currentOptimalRatio = currentRatio
            }
        }
        return currentOptimalSize
    }

    private fun closeBackgroundThread() {
            backgroundThread.quitSafely()
    }

    private fun openBackgroundThread() {
        backgroundThread = HandlerThread("camera_background_thread")
        backgroundThread.start()
        backgroundHandler = Handler(backgroundThread.looper)
    }

    private fun closeCamera() {
        cameraCaptureSession.close()
        cameraDevice.close()

    }
    internal interface CameraControlTriggers {
        fun checkCameraPermission() : Boolean
        fun getCameraPermission()
    }
}
