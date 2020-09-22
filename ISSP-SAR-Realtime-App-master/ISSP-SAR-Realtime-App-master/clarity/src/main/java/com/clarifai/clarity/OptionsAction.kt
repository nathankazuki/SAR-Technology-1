package com.clarifai.clarity

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.support.v7.app.AlertDialog
import android.support.v7.app.AppCompatActivity
import android.view.Menu
import android.view.MenuItem
import android.widget.TextView
import android.widget.Toast
import java.io.File
import android.os.Environment
import android.util.Log


class OptionsAction : AppCompatActivity() {


    private lateinit var toolbar: android.support.v7.widget.Toolbar
    private lateinit var text: TextView
    private lateinit var remove: TextView
    private lateinit var builder: AlertDialog.Builder
    private lateinit var dialog: AlertDialog



    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera_options_action)
        
//        setupSharedPreferences()

        toolbar = findViewById(R.id.my_toolbar)
        setSupportActionBar(toolbar)

        toolbar.setTitle("settings")
        text = findViewById(R.id.click)
        text.setOnClickListener{
            showAlertDialog()
        }

        remove = findViewById(R.id.Clearimages)
        remove.setOnClickListener{
            WarnUser()
        }


        fragmentManager.beginTransaction().add(R.id.fragment_container, SettingsFragment()).commit()

    }

    private fun showAlertDialog() {
        builder = AlertDialog.Builder(this)
        builder.setTitle("Time Intervals")
        val intervalOptions: IntArray = resources.getIntArray(R.array.picture_intervals)
        val intervalStrings = resources.getStringArray(R.array.time_intervals)
        var checkedItem = 1
        for (i in intervalStrings) {
            if (i == getIntString(this)) {
                checkedItem = intervalStrings.indexOf(i)
            }
        }
        builder.setSingleChoiceItems(intervalStrings, checkedItem, {_,which->
            val intervals = intervalOptions[which]
            val strings = intervalStrings[which]

            try {
                Toast.makeText(this, "You clicked " + strings, Toast.LENGTH_SHORT).show()
                saveIntervalChange(intervals)
                saveIntervalString(strings)
            } catch (e: IllegalArgumentException){
                Toast.makeText(this, "There was an error changing the interval", Toast.LENGTH_SHORT).show()
            }
            dialog.dismiss()
        })
         dialog = builder.create()

        dialog.show()
    }

    private fun WarnUser() {
        builder = AlertDialog.Builder(this)
        builder.setTitle("Warning")
        builder.setMessage("Do you sure want to DELETE all saved images?")
                .setCancelable(true)
                .setPositiveButton("Yes"){
                    dialog, which ->
                    val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES+"/SearchLight")
                    Log.d("remove", "Got Selected")
                    if (dir.isDirectory()) {
                        Log.d("remove", "Found Dir")
                        val children: Array<String> = dir.list()
                        for (i in children.indices) {
                            File(dir, children[i]).delete()
                        }
                    }
                }
                .setNegativeButton("No") {
                    dialog, id -> dialog.cancel()
                }

        dialog = builder.create()

        dialog.show()
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
            true
        }

        R.id.home -> {
            val intent = Intent(this, Home::class.java)
            startActivity(intent)
            true

        }

        else -> {
            // If we got here, the user's action was not recognized.
            // Invoke the superclass to handle it.
            super.onOptionsItemSelected(item)
        }
    }
    private lateinit var prefs: SharedPreferences
    private lateinit var editor: SharedPreferences.Editor

    private fun saveIntervalChange(interval: Int){
        prefs = this.getSharedPreferences("IntervalPrefs", Context.MODE_PRIVATE)
        editor = prefs.edit()
        editor.putInt("Picture Intervals", interval)
        editor.apply()
    }
    private fun saveIntervalString(interval: String){
        prefs = this.getSharedPreferences("IntervalPrefs", Context.MODE_PRIVATE)
        editor = prefs.edit()
        editor.putString("Interval Strings", interval)
        editor.apply()
    }
    fun getIntString(context: Context): String? {
        prefs = context.getSharedPreferences("IntervalPrefs", Context.MODE_PRIVATE)
        return prefs.getString("Interval Strings", "5 seconds")
    }




//        private lateinit var sharedPreferences: SharedPreferences
//
//        private fun setupSharedPreferences() {
//            sharedPreferences = this.getSharedPreferences("pref", Context.MODE_PRIVATE)
//        }

//        private fun loadInterval(sharedPreferences: SharedPreferences) {
//            Log.d("Interval",sharedPreferences.getString(getString(R.string.adjust_time_interval),getString(R.string.pref_5000_interval_value)))
//            changeIntervalTime(sharedPreferences.getString(getString(R.string.adjust_time_interval),getString(R.string.pref_5000_interval_value)))
//        }

//        private fun changeIntervalTime(time_intervals_values: String?) {
//            Log.d("Interval", time_intervals_values)
//            if (time_intervals_values.equals("5000")) {
//                PeriodicPrediction.REFRESH_RATE_MS = 5000
//            } else if(time_intervals_values.equals("10000")) {
//                PeriodicPrediction.REFRESH_RATE_MS = 10000
//            } else {
//                PeriodicPrediction.REFRESH_RATE_MS = 15000
//            }
//        }

    }

