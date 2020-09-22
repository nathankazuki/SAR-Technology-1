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

import android.support.v7.widget.RecyclerView
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView

/**
 * ConceptsListAdapter.kt
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */
internal class ConceptsListAdapter// Provide a suitable constructor (depends on the kind of dataset)
(private var mDataset: MutableList<Array<String>>) : RecyclerView.Adapter<ConceptsListAdapter.ViewHolder>() {

    // Provide a reference to the views for each data item
    // Complex data items may need more than one view per item, and
    // you provide access to all the views for a data item in a view holder
    internal class ViewHolder(// each data item is just a string in this case
            rootView: View) : RecyclerView.ViewHolder(rootView) {
            var conceptNameView: TextView = rootView.findViewById(R.id.concept_id)
            var conceptValueView: TextView = rootView.findViewById(R.id.concept_value)
    }

    fun updateList(newData: List<Array<String>>) {
        if (newData.size == mDataset.size) {
            mDataset.clear()
            for (i in newData.indices) {
                mDataset.add(i, newData[i])
            }
            notifyItemRangeChanged(0, mDataset.size)
        } else {
            mDataset.clear()
            mDataset.addAll(newData)
            notifyDataSetChanged()
        }
    }

    // Create new views (invoked by the layout manager)
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ConceptsListAdapter.ViewHolder {
        // create a new view
        val parentView = LayoutInflater.from(parent.context).inflate(R.layout.concept_item, parent, false)
        return ViewHolder(parentView)
    }

    // Replace the contents of a view (invoked by the layout manager)
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.conceptNameView.text = mDataset[position][0]
        holder.conceptValueView.text = mDataset[position][1]
    }

    // Return the size of your dataset (invoked by the layout manager)
    override fun getItemCount(): Int {
        return mDataset.size
    }
}
