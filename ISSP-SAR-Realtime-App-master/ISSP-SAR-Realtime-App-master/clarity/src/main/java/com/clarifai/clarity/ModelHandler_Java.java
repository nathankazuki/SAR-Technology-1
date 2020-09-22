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

package com.clarifai.clarity;

import android.arch.core.util.Function;
import android.os.AsyncTask;
import android.support.annotation.Nullable;
import android.util.Log;

import com.clarifai.clarifai_android_sdk.core.Clarifai;
import com.clarifai.clarifai_android_sdk.dataassets.DataAsset;
import com.clarifai.clarifai_android_sdk.dataassets.Image;
import com.clarifai.clarifai_android_sdk.datamodels.Concept;
import com.clarifai.clarifai_android_sdk.datamodels.Input;
import com.clarifai.clarifai_android_sdk.datamodels.Model;
import com.clarifai.clarifai_android_sdk.datamodels.Output;
import com.clarifai.clarifai_android_sdk.utils.Error;

import org.jetbrains.annotations.NotNull;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import kotlin.Unit;
import kotlin.jvm.functions.Function1;

/**
 * ModelHandler_Java.java
 * Clarity
 *
 * Copyright © 2018 Clarifai. All rights reserved.
 */

class ModelHandler_Java extends ModelHandlerBase {
    private static final String TAG = ModelHandler_Java.class.getSimpleName();
    private boolean modelLoaded = false;
    private Model model = null;
    private volatile boolean predictionIsRunning = false;
    private static final int MAX_CONCEPTS = 5;
    private Function<Boolean, Void> modelLoadedCallback;

    ModelHandler_Java(final Function<Boolean, Void> modelLoadedCallback) {
        this.modelLoadedCallback = modelLoadedCallback;
        loadModel();
    }

    @Override
    public boolean isModelLoaded() {
        return modelLoaded;
    }

    private void loadModel(Function<Model, Void> callback) { new LoadModel(callback).execute(); }

    public boolean isPredictionRunning() { return predictionIsRunning; }

    @Override
    public void loadModel() {
        loadModel(new Function<Model, Void>() {
            @Nullable
            @Override
            public Void apply(@Nullable Model model) {
                ModelHandler_Java.this.modelLoaded = true;
                ModelHandler_Java.this.model = model;
                ModelHandler_Java.this.modelLoadedCallback.apply(true);
                return null;
            }
        });
    }

    @Override
    public void predict(@NotNull final Image image, @NotNull final Function1<? super List<String[]>, Unit> callback) {
        if (this.model == null) {
            return;
        }
        predictionIsRunning = true;
        new Runnable() {
            @Override
            public void run() {
                DataAsset dataAsset = new DataAsset(image);
                Input input = new Input(dataAsset);
                input.setId("inputId");
                ModelHandler_Java.this.model.clear();
                ModelHandler_Java.this.model.addInput(input);
                final long startTime = System.currentTimeMillis();
                ModelHandler_Java.this.model.predict(new Model.ModelCallbacks() {
                    @Override
                    public void PredictionComplete(boolean successful, Error error) {
                        long duration = System.currentTimeMillis() - startTime;
                        Log.d(TAG, "Time taken to do the prediction: " + String.valueOf(duration) + "ms");
                        if (successful) {
                            List<Output> outputs = model.getOutputs();
                            if (outputs.size() > 0) {
                                List<String[]> concepts =
                                    conceptsListToStringList(outputs.get(outputs.size() - 1).getDataAsset().getConcepts());
                                callback.invoke(concepts);
                            }
                        } else {
                            Log.e(TAG, error.getErrorMessage());
                        }
                        predictionIsRunning = false;
                    }
                });
            }
        }
            .run();
    }

    private static class LoadModel extends AsyncTask<Void, Void, Void> {
        private WeakReference<Function<Model, Void>> callbackRef;

        LoadModel(Function<Model, Void> callback) { callbackRef = new WeakReference<>(callback); }

        @Override
        protected Void doInBackground(Void... voids) {
            final Function<Model, Void> callback = callbackRef.get();
            Model generalModel = Clarifai.getInstance().getGeneralModel(); // Get general model
            callback.apply(generalModel);
            return null;
        }
    }

    private List<String[]> conceptsListToStringList(List<Concept> list) {
        List<String[]> conceptsStrings = new ArrayList<>();
        int count = 0;
        for (Concept concept : list) {
            if (MAX_CONCEPTS <= count++) {
                break;
            }
            String scorePercentage = String.format(Locale.getDefault(), "%.4f", concept.getScore());
            String[] conceptIdValue = {concept.getName(), scorePercentage};
            conceptsStrings.add(conceptIdValue);
        }
        return conceptsStrings;
    }
}
