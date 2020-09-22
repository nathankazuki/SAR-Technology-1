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
import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.hardware.camera2.CameraManager
import android.os.Bundle
import android.support.v4.app.ActivityCompat
import android.support.v7.app.AppCompatActivity
import android.support.v7.widget.RecyclerView
import android.util.Log
import com.clarifai.clarifai_android_sdk.core.Clarifai
import android.support.v7.app.AlertDialog
import android.content.Intent

import android.net.Uri
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.view.*
import java.io.File
import java.io.OutputStream
import java.io.FileOutputStream
import java.util.*
import java.io.IOException
import android.widget.Toast;
import android.os.Environment
import org.json.*

import android.location.*
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

import android.location.*
import android.widget.TextView
import kotlinx.android.synthetic.main.activity_home.*
import kotlin.collections.ArrayList

/**
 * Home.kt
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */
class Home : AppCompatActivity(), PeriodicPrediction.PredictionTriggers, CameraControl.CameraControlTriggers {

    override fun getCameraPermission() {
        if (!havePermissions()) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.ACCESS_FINE_LOCATION), CAMERA_REQUEST_CODE_INIT)
            return
        }
    }


    override fun checkCameraPermission(): Boolean {
        return havePermissions()
    }

    private lateinit var recyclerView: RecyclerView
    private lateinit var textureView: TextureView
    private lateinit var outputControl: OutputControl
    private lateinit var dialog: AlertDialog
    private lateinit var prefs: SharedPreferences
    private lateinit var textView: TextView

    private lateinit var cameraControl: CameraControl
    private lateinit var periodicPrediction: PeriodicPrediction

    private val PERMISSION_CODE = 1000
    private val IMAGE_CAPTURE_CODE = 1001
    var image_uri: Uri? = null

    private var locationManager : LocationManager? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupWindow()
        setContentView(R.layout.activity_home)
        findViews()
        loadingScreen(show = true)
        setSupportActionBar(findViewById(R.id.my_toolbar))
        prefs = this.getSharedPreferences("IntervalPrefs", Context.MODE_PRIVATE)
        val savedInterval = getInterval(this)
        val savedString = getIntString(this)
        Toast.makeText(this, "Saved Interval: " + savedString, Toast.LENGTH_LONG).show()
        val sharedPreferences = this.getSharedPreferences(getString(R.string.shared_preferences_key), Context.MODE_PRIVATE)
        val missingKey = getString(R.string.missing_api_key)
        val apiKey = sharedPreferences.getString(getString(R.string.shared_preferences_api_key), missingKey)

        outputControl = OutputControl(this.applicationContext, recyclerView)

        Clarifai.start(this, apiKey)

        PeriodicPrediction.REFRESH_RATE_MS = savedInterval

        if (!havePermissions()) {
            Log.d(TAG, "No permission. So, asking for it")
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.ACCESS_FINE_LOCATION), CAMERA_REQUEST_CODE_INIT)
            return
        }

        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager?

        onCreateAfterPermissions()
        periodicPrediction = PeriodicPrediction(this)

        try {
            var location = locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            Log.d("LOCATION", location.toString())
        } catch (e: SecurityException) {
            Log.d("Error", "ERROR!")
        }
    }

        override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu,menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem) = when (item.itemId) {
        R.id.gallery -> {
            val intent = Intent(this, Graph_view::class.java)
            startActivity(intent)
            Toast.makeText(this, "Gallery Clicked", Toast.LENGTH_SHORT).show()
            true
        }

        R.id.interval -> {
            Toast.makeText(this, "Interval Clicked", Toast.LENGTH_SHORT).show()
            val intent = Intent(this, OptionsAction::class.java)
            startActivity(intent)
            true
        }

        else -> {
            // If we got here, the user's action was not recognized.
            // Invoke the superclass to handle it.
            super.onOptionsItemSelected(item)
        }
    }
    override fun onResume() {
        super.onResume()
        if (!havePermissions()) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.ACCESS_FINE_LOCATION), CAMERA_REQUEST_CODE_INIT)
            return
        }
        onResumeAfterPermissions()
    }
    override fun onPause() {
        super.onPause()
        periodicPrediction.onPause()
    }
    override fun onStop() {
        super.onStop()
        cameraControl.onStop()
    }
    private fun setupWindow() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
    }
    private fun findViews() {
        textureView = findViewById(R.id.texture)
        recyclerView = findViewById(R.id.concepts_list_rv)



        val builder = AlertDialog.Builder(this)
        builder.setView(R.layout.progress)
        dialog = builder.create()
    }
    private fun loadingScreen(show: Boolean) {
        Log.d(TAG, "Changing the state of loading screen to $show")
        if (show)
            dialog.show()
        else
            dialog.dismiss()
    }
    @SuppressLint("MissingPermission")
    private fun onCreateAfterPermissions() {
        Log.d(TAG, "Have permission from requesting with onCreate")
        cameraControl = CameraControl(textureView, getSystemService(Context.CAMERA_SERVICE) as CameraManager, this)
        periodicPrediction = PeriodicPrediction(this)
    }
    @SuppressLint("MissingPermission")
    private fun onResumeAfterPermissions() {
        if (periodicPrediction.isModelLoaded) {
            cameraControl.onResume()
            periodicPrediction.onResume()
        }
    }
    private fun havePermissions(): Boolean {
        return ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        try {
            when (requestCode) {
                CAMERA_REQUEST_CODE_INIT -> onCreateAfterPermissions()
                CAMERA_REQUEST_CODE_RESUME -> onResumeAfterPermissions()
                else -> {
                }
            }
        } catch (se: SecurityException) {
            Log.e(TAG, "Permission not granted")
        }

    }
    override fun onReceivedPredictions(outputs: List<Array<String>>) {
        runOnUiThread {
            if (outputs.isNotEmpty()) {
                bitmapToFile(cameraControl.bitmap, outputs)
                outputControl.update(outputs)
            }
        }
    }
    override fun modelLoaded() {
        Log.d(TAG, "Loaded the model")
        runOnUiThread {
            loadingScreen(show = false)
            onResumeAfterPermissions()
        }
    }
    override fun captureBitmap(): Bitmap? {
        if (cameraControl.isCameraSetup()) {
            return cameraControl.bitmap
        }
        return null
    }
    private fun bitmapToFile(bitmap:Bitmap, outputs: List<Array<String>>): Uri {
        //Check if file exists
        var dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES+"/SearchLight")
        if (!dir.exists()){
            Log.d(TAG, "Directory did not exist creating:"+dir.absolutePath)
            dir.mkdir()
        }

        // Initialize a new file instance to save bitmap object
        var file = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES+"/SearchLight")
        file = File(file,"${DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC).format(Instant.now())}.jpg")

        try{
            // Compress the bitmap and save in jpg format
            val stream:OutputStream = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.JPEG,100,stream)
            stream.flush()
            stream.close()
            SaveData(outputs, file.absolutePath)
        }catch (e:IOException){
            e.printStackTrace()
        }
        // Return the saved bitmap uri
         Log.d(TAG, file.absolutePath)
        return Uri.parse(file.absolutePath)
    }
    private fun SaveData(outputs: List<Array<String>>, filepath: String): String {
        var dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES+"/SearchLight")
        if (!dir.exists()){
            Log.d(TAG, "Directory did not exist creating:"+dir.absolutePath)
            dir.mkdir()
        }
        var file = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES+"/SearchLight")
        file = File(file,"PredictionData.json")

        //GetLocation
        val location = GetLocation()

        //make json prototype
        var obj = JSONObject()
        obj.put("Filename",filepath)
        obj.put("TimeStamp", DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC).format(Instant.now()))
        obj.put("Latitude",location[0])
        obj.put("Longitude",location[1])

        for(value in outputs) {
            Log.d(TAG, value.joinToString())
            obj.put(value[0], value[1])
        }
        try{
            file.appendText(obj.toString()+";")

        }catch (e:IOException){
            e.printStackTrace()
        }
        return "Done"
    }
    fun getInterval(context: Context): Int {
        prefs = context.getSharedPreferences("IntervalPrefs", Context.MODE_PRIVATE)
        return prefs.getInt("Picture Intervals", 5000)
    }
    fun getIntString(context: Context): String? {
        prefs = context.getSharedPreferences("IntervalPrefs", Context.MODE_PRIVATE)
        return prefs.getString("Interval Strings", "5 seconds")
    }
    private fun GetLocation(): List<String>{
        var coord = ArrayList<String>()
        try{
            val location = locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            //Log.d("LOCATION",location?.latitude.toString())
            var lat = location?.latitude.toString()
            //Log.d("LOCATION",location?.longitude.toString())
            var log = location?.longitude.toString()
            coord.add(0, lat)
            coord.add(1, log)
        }
        catch(e:SecurityException){
            Log.d("LOCATION","ERROR!")
            coord.add(0, "0.00")
            coord.add(1, "0.00")
        }

        //Update Screen
        val text = "Latitude:"+coord[0]+"\nLongitude:"+coord[1]
        LocationView.text = text

        return coord
    }

    companion object {
        private val TAG = Home::class.java.simpleName
        private const val CAMERA_REQUEST_CODE_INIT = 101
        private const val CAMERA_REQUEST_CODE_RESUME = 102
    }
}
