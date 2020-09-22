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

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.support.v7.app.AlertDialog
import android.support.v7.app.AppCompatActivity
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout

class PreloadActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkForApiKey()
    }
    private fun checkForApiKey() {
        val sharedPreferences = this.getSharedPreferences(getString(R.string.shared_preferences_key), Context.MODE_PRIVATE)
        val missingKey = getString(R.string.missing_api_key)
        val apiKey = sharedPreferences.getString(getString(R.string.shared_preferences_api_key), missingKey)

        if (apiKey == missingKey) {
            promptForApiKey()
        } else {
            startHomeActivity()
        }
    }
    private fun promptForApiKey() {
        val alertDialog = AlertDialog.Builder(this)
        alertDialog.setTitle(getString(R.string.api_dialog_title))
        alertDialog.setMessage(getString(R.string.api_dialog_prompt))

        val textBox = EditText(this)
        val layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        textBox.layoutParams = layoutParams
        alertDialog.setView(textBox)

        alertDialog.setPositiveButton(getString(R.string.api_dialog_finished)) { dialog, which ->
            val apiKey = textBox.text.toString()
            if (apiKey.isNotEmpty()) {
                getSharedPreferences(getString(R.string.shared_preferences_key), Context.MODE_PRIVATE)
                        .edit()
                        .putString(getString(R.string.shared_preferences_api_key), apiKey)
                        .apply()
                startHomeActivity()
            } else {
                promptForApiKey()
            }
        }

        alertDialog.show()
    }
    private fun startHomeActivity() {
        val intent = Intent(this, Home::class.java)
        startActivity(intent)
        finish()
    }
}
