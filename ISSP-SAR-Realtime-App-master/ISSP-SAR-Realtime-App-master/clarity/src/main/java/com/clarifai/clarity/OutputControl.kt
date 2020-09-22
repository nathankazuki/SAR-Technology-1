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
import android.support.v7.widget.LinearLayoutManager
import android.support.v7.widget.RecyclerView

import java.util.ArrayList

/**
 * OutputControl.kt
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */
class OutputControl internal constructor(private val context: Context, private val recyclerView: RecyclerView) {
    private lateinit var conceptAdapter: ConceptsListAdapter

    init {
        setup()
    }

    private fun setup() {
        recyclerView.setHasFixedSize(true)
        val mLayoutManager = LinearLayoutManager(context)
        recyclerView.layoutManager = mLayoutManager

        val conceptData = ArrayList<Array<String>>()
        val noConcept = arrayOf("No", "Concept")
        conceptData.add(noConcept)
        conceptAdapter = ConceptsListAdapter(conceptData)
        recyclerView.adapter = conceptAdapter
    }

    fun update(predictions: List<Array<String>>) {
        conceptAdapter.updateList(predictions)
    }
}
