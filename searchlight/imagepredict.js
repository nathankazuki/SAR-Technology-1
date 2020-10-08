
var personsApp = new Clarifai.App({
    apiKey: personsKey
});

var helicopterApp = new Clarifai.App({
    apiKey: helicopterKey
});

var aircraftApp = new Clarifai.App({
    apiKey: aircraftKey
});
/**
 * Add the api key here
 * Create a variable name by adding this to the code.
 * var name-of-the-variable-here = new Clarifai.App({
 *      apiKey: name-of-the-key(one that you defined in keys.js)
 * });
 * @type {Clarifai.App}
 */

var isLoading = false;
var fileDataArray = [];
var baseArray = [];
var imgArray = [];
var rows = [];
var totalPredictions = 0;
var processedImageCount = 0;
var totalImageCount = 0;
var currentImageNum = 1;
var fileExifArray = [];
var detailsArray = [];
var exifDataArray = [];
/**
 *  Shows file name of selected images.
 *  param: value - an array of files incoming from the HTML
 *  input = predict local files button
 *  output = div for results
 */
function showFileName(value) {
    baseArray = [];
    imgArray = [];
    fileDataArray = [];
    totalPredictions = 0;
    var input = value;

    var segment_option = document.getElementById("segment_user").checked;
    get_checkbox_list();

    var total_segment_num = input.files.length * segment_selection.filter(Boolean).length;

    var totalHTML = document.getElementById('totalProcessed');


    if (segment_option){
        if (segment_selection.length < 1){
            window.alert("Segmentation is enabled. Please select the segments with the selection box in the upper right.");
            return
        }

        totalHTML.innerHTML = (totalImageCount + total_segment_num).toString() ;
        totalImageCount += total_segment_num;
    }else{
        totalImageCount += input.files.length;
        totalHTML.innerHTML = totalImageCount;
    }

    //update user-defined segmentation selection
    isLoading = true;
    showLoading(isLoading);

    for (var i = 0; i < input.files.length; ++i) {
        //output.innerHTML += '<li>' +input.files.item(i).name + '     <br>Size: ' +input.files.item(i).size/1000 + ' KB' + '<br>Date: ' +input.files.item(i).lastModifiedDate + '</li><br>';
        console.log(input.files[i]);
        if (segment_option){
            var reader_segment = new FileReader();
            reader_segment.readAsDataURL(input.files[i]);
            on_load_segment(input.files[i], total_segment_num).then((result)=> {
                segmented_api_prep(result[0], result[1], result[2], result[3]);
            })

        }else{
            //Turn image into base 64 for clarifai.
            getBase64(input.files[i], input, input.files);
        }
    }
    // Close unordered list tag
//    output.innerHTML += '</ul>'
}

/**
 * Shows the target image in the top right corner
 * param : value - a single image file from the HTML
 * input : Show Images button
 * output : image source as thumbnail
 */
function showTarget(input) {
    var x = document.getElementById('test_table');
    while (x.hasChildNodes()){
        x.removeChild(x.childNodes[0])
    }
    imgData_Array = [];

    if(input.files && input.files[0]) {
        $('#tgtImg').attr('src', "");
        var reader = new FileReader();
        reader.readAsDataURL(input.files[0]);
        var user_segment = document.getElementById('segment_user').checked;

        reader.onload = function(e) {
            var user_row = document.getElementById('segment_user_row').value;
            var user_col = document.getElementById('segment_user_col').value;
            if ((user_segment)&&((user_row > 1)||(user_col > 1))){
                if ((user_row != "")&&(user_col != "")) {
                    // If user segment is checked and user input row and columns are not empty
                    if ((user_row > 1)||(user_col > 1)){
                        // If user input rows or columns are bigger than 1
                        segmentation(reader.result, "target");
                    }
                }
            }else {
                $('#tgtImg').attr('src', e.target.result);
            }
        };



    }
}

/*
"<br>File Name: " + image.files.item(i).name + "<br>Size: " + image.files.item(i).size /1000
+ " KB" + "<br>Date: " + image.files.item(i).lastModifiedDate;
*/

function getBase64(file, val, fileInput) {
    var reader = new FileReader();
    var exifEnabled = document.getElementById('exifOn');

    reader.readAsDataURL(file);
    reader.onload = function () {
        var preBase = reader.result.split("base64,")[1];

        fileDataArray.push(file);

        if (exifEnabled.checked) {
            getPhotodata(file).then(result =>{
                exifDataArray.push(result);
                baseArray.push({base64: preBase});

                imgArray.push(reader.result);

                totalPredictions++;
                console.log("Predict called" + totalPredictions + fileInput.length);
                if (baseArray.length == 4096*4 || totalPredictions == fileInput.length) {
                    console.log("Predict called" + totalPredictions + fileInput.length);

                    predict(file, baseArray, val, imgArray, fileDataArray,exifDataArray);

                    baseArray = [];
                    fileDataArray = [];
                    imgArray = [];
                    if (totalPredictions == fileInput.length) {
                        totalPredictions = 1;
                    }
                }
            })
        }else{
            exifDataArray.push('');
            baseArray.push({base64: preBase});

            imgArray.push(reader.result);

            totalPredictions++;
            console.log("Predict called" + totalPredictions + fileInput.length);
            if (baseArray.length == 4096*4 || totalPredictions == fileInput.length) {
                console.log("Predict called" + totalPredictions + fileInput.length);

                predict(file, baseArray, val, imgArray, fileDataArray,exifDataArray);
                exifDataArray = [];
                baseArray = [];
                fileDataArray = [];
                imgArray = [];
                if (totalPredictions == fileInput.length) {
                    totalPredictions = 1;
                }
            }
        }



    };
    reader.onerror = function (error) {

    };
}


/*
  Purpose: Retrieve the appropriate client app depending on which custom model is selected
  Args:
    None
  Return:
  	Client App
*/
function getApp() {
    var model = document.querySelector('input[name = "model"]:checked').value;
    console.log("Model: " + model);

    var keyList = {
        "Persons App.": personsApp,
        "Helicopters Crashed": helicopterApp,
        "Aircraft Crashed": aircraftApp
        /**
         * Add t
         */
    };

    if(model == "custom") {
        var stuff = document.getElementById('customModelDropDown').value;
        console.log(stuff);
        if (stuff == "Persons App.") {
            return personsApp;
        } else if (stuff == "Helicopters Crashed") {
            return helicopterApp;
        } else if (stuff == "Aircraft Crashed") {
            return aircraftApp;
        }
    } else {
        return personsApp;
    }
}


/**
 * Calls ClarifAI predict on the images
 * @param val base64 array of images.
 * @param image physical image data
 */

//  this is the image processing portion, add the batch processing thing here maybe
function predict(file, val, image, imgArray, fileData, exifDataArray) {
    var app = getApp();
    var successfulPredict = false;
    var modelID = getCriteria();
    var dataTags = "";
    var predictedImages = document.getElementById('imageProcessed');
    var fileProperties = document.getElementById('fileProperties');
    var exifEnabled = document.getElementById('exifOn');
    window.filePath = document.getElementById('filePathInput').value;
    // if(window.filePath == ' ')
    // window.filePath = "Not specified";
    var threshold = document.getElementById('thresholdInputText').value;
    if (threshold == '' || threshold == 0) {
        threshold = -1;
    }

    // Update this thing too, the number does not update, make a new var and have it count(? maybe)
    predictedImages.innerHTML = "Images processed: "+ processedImageCount + " /";

    /* the following code is to show the search category upon display of results table */
    var appString = getSelectedVal();
    // Make a unordered list in HTML, per file

    if (modelID == Clarifai.COLOR_MODEL) {
        //Clarifai API call
        app.models.predict(modelID, val, threshold).then( function (response) {
                console.log(response);
                successfulPredict = true;
                processedImageCount += val.length;
                // Update this thing too, the number does not update, make a new var and have it count(? maybe)
                predictedImages.innerHTML = "Images processed: " + processedImageCount + " /";
                //Array for image values
                /*var values = new Array(image.files.length);*/

                //For each file selected by user, show results

                for (var i = 0; i < image.files.length; ++i) {
                    dataTags = response.rawData.outputs[i].data.concepts;
                    dateObj = new Date(fileData[i].lastModified);
                    utcString = dateObj.toUTCString()
                    if (fileData[i].webkitRelativePath !== "") {
                        fullFilePath = fileData[i].webkitRelativePath
                        window.filePath = fullFilePath.substring(0, fullFilePath.lastIndexOf("/") + 1);
                    }
                    fileDetails = [currentImageNum, window.filePath, fileData[i].name, appString, fileData[i].size, utcString]
                    currentImageNum+=1

                    // Instantiation of the array of concept tags.
                    if (modelID == Clarifai.COLOR_MODEL) {
                        dataTags = response.rawData.outputs[i].data.colors;
                        // Hardcoded, but if the first concept in the list is the higher than the treshold it will
                        // display what is there.
                        if (dataTags[0].value.toFixed(2) * 100 >= parseFloat(threshold)) {

                            // stores image thumbnails
                            var thumbNail = "<img class='table_img' src ='" + imgArray[i] + "'/>";

                            //Stores Image Score
                            var imgScore = String(dataTags[0].value * 100).substring(0, 5);
                            // var imgScore = n + "%";

                            // stores image tags
                            var imageTags = [];
                            for (var j = 0; j < dataTags.length; ++j) {
                                // imageTags[j] = "<br>" + dataTags[j].w3c.name + " " + String(dataTags[j].value * 100).substring(0,5) + "% " +
                                // "<svg class='colsq' width='100' height='30'> <rect width='200' height='20' style='fill:" + dataTags[j].w3c.name + ";' /> </svg> ";
                                imageTags[j] = "<div style='width: 300px; background: linear-gradient(to right, white 60%, " + dataTags[j].w3c.name + " 60%'>" + dataTags[j].w3c.name + " " + String(dataTags[j].value * 100).substring(0,5) + "%      </div>";
                            }
                            imageTags = imageTags.join("");

                            // adds data into rows array
                            rows_detail = [thumbNail, "", imgScore, imageTags, fileDetails];

                            if (exifEnabled.checked) {
                                var values = exifDataArray;
                                    $(document).ready(function() {
                                        var t = $('#results').DataTable();

                                            if (values[i] !== "") {
                                                var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + ' ' + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: " + values[i][3]
                                                    + "<br>Date Taken: " + values[i][2] + "<br>Date Modified: " + rows_detail[4][5] + "<br>Coords: " + values[i][11] + "<br>Altitude: " + values[i][6] + "<br>Direction: " + values[i][7] + " " + values[i][8]
                                                    + "<br>Speed: " + values[i][9] + " " + values[i][10]
                                                    + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] + "' name='note' placeholder='Enter notes here'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                            } else {
                                                var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: Not Available"
                                                    + "<br>Date Taken: Not Available<br>Date Modified: " + rows_detail[4][5]
                                                    + "<br>Coords: Not Available<br>Altitude: Not Available<br>Direction: Not Available<br>Speed: Not Available<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] +
                                                    "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                            }
                                            t.row.add( [
                                                rows_detail[0],
                                                rows_detail[1],
                                                rows_detail[2],
                                                rows_detail[3],
                                                imgDetail]
                                            ).draw( false );
                                            $('#results').on('keyup', function () {
                                                t.search(this.value).draw()
                                            });

                                        rows.length = 0
                                    } );
                            } else {
                                $(document).ready(function() {
                                    var t = $('#results').DataTable();

                                        var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Size: " + rows_detail[4][4] /1000 + " KB"
                                            + "<br>Date Modified: " + rows_detail[4][5] + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0]
                                            + "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                        t.row.add( [
                                            rows_detail[0],
                                            rows_detail[1],
                                            rows_detail[2],
                                            rows_detail[3],
                                            imgDetail]
                                        ).draw( false );
                                        $('#results').on('keyup', function () {
                                            t.search(this.value).draw()
                                        });

                                    rows.length = 0
                                } );
                            }


                            // $(document).ready(function() {
                            //     var t = $('#results').DataTable();

                            //       t.row.add( [
                            //         thumbNail,
                            //         "",
                            //         imgScore,
                            //         imageTags,
                            //         exifDetails]
                            //     ).draw( false );
                            //     $('#results').on('keyup', function () {
                            //         t.search(this.value).draw()
                            //     })
                            // } );

                        }

                    }
                }

                isLoading = false;
                showLoading(isLoading);
            },
            function (err) {
                predict(val, image, imgArray, fileData);
                console.log(err);
            }
        )
    }
    else
    {
        app.models.predict(modelID, val).then( function (response) {
                successfulPredict = true;
                processedImageCount += val.length;
                predictedImages.innerHTML = "Images processed: " + processedImageCount + " /";
                //Array for image values
                var values = new Array(image.files.length);
                //For each file selected by user, show results


                for (var i = 0; i < image.files.length; ++i) {
                    dataTags = response.rawData.outputs[i].data.concepts;
                    dateObj = new Date(fileData[i].lastModified);
                    // utcString = dateObj.toUTCString()

                    //hides timezone
                    dateString = dateObj.toString().slice(0, 24)
                    if (fileData[i].webkitRelativePath !== "") {
                        fullFilePath = fileData[i].webkitRelativePath
                        window.filePath = fullFilePath.substring(0, fullFilePath.lastIndexOf("/") + 1);
                    }
                    fileDetails = [currentImageNum, window.filePath, fileData[i].name, appString, fileData[i].size, dateString]

                    currentImageNum+=1;

                    // Hardcoded, but if the first concept in the list is the higher than the threshold it will
                    // display what is there.
                    if (dataTags[0].value.toFixed(2) * 100 >= parseFloat(threshold)) {

                        // stores image thumbnails
                        var thumbNail = "<img class='table_img' src ='" + imgArray[i] + "'/>";

                        //Stores Image Schore
                        var imgScore = String(dataTags[0].value * 100).substring(0, 5);
                        // var imgScore = n + "%";

                        // stores image tags
                        var imageTags = [];
                        for (var j = 0; j < dataTags.length; ++j) {
                            imageTags[j] = "<br>" + dataTags[j].name + " " + String(dataTags[j].value * 100).substring(0, 5) + "%";
                        }

                        if(window.filePath == null) {
                            window.filePath = "Not Specified.";
                        }

                        //adds data into datatable
                        // adds data into rows array
                        rows_detail = [thumbNail, "", imgScore, imageTags, fileDetails];
                        if (exifEnabled.checked) {
                            var values = exifDataArray;
                                $(document).ready(function() {
                                    var t = $('#results').DataTable();

                                        if (values[i] !== "") {
                                            var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + ' ' + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: " + values[i][3]
                                                + "<br>Date Taken: " + values[i][2] + "<br>Date Modified: " + rows_detail[4][5] + "<br>Coords: " + values[i][11] + "<br>Altitude: " + values[i][6] + "<br>Direction: " + values[i][7] + " " + values[i][8]
                                                + "<br>Speed: " + values[i][9] + " " + values[i][10]
                                                + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] + "' name='note' placeholder='Enter notes here'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                        } else {
                                            var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: Not Available"
                                                + "<br>Date Taken: Not Available<br>Date Modified: " + rows_detail[4][5]
                                                + "<br>Coords: Not Available<br>Altitude: Not Available<br>Direction: Not Available<br>Speed: Not Available<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] +
                                                "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                        }
                                        t.row.add( [
                                            rows_detail[0],
                                            rows_detail[1],
                                            rows_detail[2],
                                            rows_detail[3],
                                            imgDetail]
                                        ).draw( false );
                                        $('#results').on('keyup', function () {
                                            t.search(this.value).draw()
                                        });

                                    rows.length = 0
                                } );

                        } else {
                            $(document).ready(function() {
                                var t = $('#results').DataTable();

                                    var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Size: " + rows_detail[4][4] /1000 + " KB"
                                        + "<br>Date Modified: " + rows_detail[4][5] + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0]
                                        + "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                    t.row.add( [
                                        rows_detail[0],
                                        rows_detail[1],
                                        rows_detail[2],
                                        rows_detail[3],
                                        imgDetail]
                                    ).draw( false );
                                    $('#results').on('keyup', function () {
                                        t.search(this.value).draw()
                                    });

                                rows.length = 0
                            } );
                        }


                    }
                }

                isLoading = false;
                showLoading(isLoading);
            },
            function (err) {
                predict(val, image, imgArray, fileData);
                console.log(err);
            }
        )
    }

}

/**
 * Show or hide the loading circle dependent on boolean isLoading
 */
function showLoading(bool) {
    var loadCircle = document.getElementById("loader");
    if(bool == true) {
        loadCircle.style.visibility = "visible";
    } else {
        loadCircle.style.visibility = "hidden";
        document.getElementById("imageFolderSelectButton").value = "";
        document.getElementById("imageFileSelectButton").value = "";
    }
}


function getCriteria() {
    var selectedCriteria = document.querySelector('input[name = "model"]:checked').value;
    console.log(selectedCriteria);
    if (selectedCriteria == "general") {
        return Clarifai.GENERAL_MODEL;
    } else if (selectedCriteria == "color") {
        return Clarifai.COLOR_MODEL;
    }   else if(selectedCriteria == "custom") {
        var e = document.getElementById("customModelDropDown");
        return e.options[e.selectedIndex].value;
    }
}

/**
 * It does the same thing as the function above, but with more formatting for the front end..
 * @returns {string}
 */
function getSelectedVal() {
    var generalVal = document.getElementById("appGeneral");
    var colorVal = document.getElementById("appColor");
    var customApp = document.getElementById("appCustom");
    var dropDown = document.getElementById("customModelDropDown");
    var selectedValue = dropDown.options[dropDown.selectedIndex].value;
    if(generalVal.checked) {
        return "Category: General";
    } else if(colorVal.checked) {
        return "Category: Color";
    } else if(selectedValue == "Persons App.") {
        return "Category: Persons App";
    } else if(selectedValue == "Helicopters Crashed") {
        return "Category: Helicopters Crashed";
    } else {
        return "Category: Aircrafts Crashed";
    }

}

// Datatables setup
$(document).ready(function() {

    $('#results').DataTable( {
        "search": {"regex": true, "smart": false},
        "autoWidth": false,
        "pageLength": 500,
        "columnDefs": [
            { "width": "150px", "targets": 0 },
            { type: 'natural', 'targets': 1, className: 'bolded', autoWidth: true}
        ],
        dom: 'fBrtip',
        buttons: [
            {
            text: 'Print/Save PDF',
            action: function() {
                    window.print();
                },
            }
        ],
        columns: [
            { title:"Image" },
            { title:"Rank"},
            { title:"Score",
               render: function (data) {
                   return data+'%'
               }},
            { title:"Keywords/Tags"},
            { title:"Details" }
        ],
        // Calculate rank of image by score
        drawCallback: function () {
            api = this.api();
            var arr = api.columns(2).data()[0];  //get array of column 2 (score)
            var sorted = arr.slice().sort(function(a,b){return b-a});
            var ranks = arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
            // interate through each row
            api.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
              var data = this.data();
            // data[1] = '#' + ranks[arr.indexOf(data[2])] + ' of ' + Math.max(...ranks);  //set the rank column = the array index of the score in the ranked array?
            data[1] = '#' + ranks[arr.indexOf(data[2])] + ' of ' + ranks.length;  //set the rank column = the array index of the score in the ranked array

            } );
          api.rows().invalidate();
        }
    } );
} );

function addNote(i) {
    note = "note" + i;
    document.getElementById("notes").value += "Image " + i + ": " + document.getElementById(note).value + "\r\n";
}

function getPhotodata(file) {
    return new Promise (resolve => {
        EXIF.getData(file, function() {

                var exifAllTags = EXIF.getAllTags(this)
                if (Object.keys(exifAllTags).length < 10) {
                    resolve('')
                }

                // if no coordinate references found, assuming NW
                var exifLatRef = exifAllTags.GPSLatitudeRef ? exifAllTags.GPSLatitudeRef : 'N'
                var exifLongRef = exifAllTags.GPSLongitudeRef ? exifAllTags.GPSLongitudeRef : 'W'

                exifLat = exifAllTags.GPSLatitude
                if (exifLat) {
                    if (exifLatRef == "S") {
                        var latitude = (exifLat[0]*-1) + (( (exifLat[1]*-60) + (exifLat[2]*-1) ) / 3600);
                    } else {
                        var latitude = exifLat[0] + (( (exifLat[1]*60) + exifLat[2] ) / 3600);
                    }
                } else {
                    var latitude = 0
                }

                exifLong = exifAllTags.GPSLongitude
                if (exifLong) {
                    if (exifLongRef == "E") {
                        var longitude = exifLong[0] + (( (exifLong[1]*60) + exifLong[2] ) / 3600);
                    } else {
                        var longitude = (exifLong[0]*-1) + (( (exifLong[1]*-60) + (exifLong[2]*-1) ) / 3600);
                    }
                } else {
                    var longitude = 0
                }

            if (exifAllTags.DateTimeOriginal) {
                var exifDateTimeOriginal = exifAllTags.DateTimeOriginal
                console.log(exifDateTimeOriginal)
                var str = exifDateTimeOriginal.split(" ");
                var dateStr = str[0].replace(/:/g, "-");
                //concat the strings (date and time part)
                var properDateStr = dateStr + " " + str[1];
                //pass to Date
                // var dateTaken = new Date(properDateStr).toUTCString();
                var dateTaken = new Date(properDateStr).toString().slice(0, 24)
            } else {
                var dateTaken = ''
            }

            var make = exifAllTags.Make ? exifAllTags.Make : ''
            var model = exifAllTags.Model ? exifAllTags.Model : ''
            var device = exifAllTags.Model ? make + ' ' + model : 'Not Available'
            var latStr = latitude.toFixed(5)
            var lonStr = longitude.toFixed(5)
            var altitude = exifAllTags.GPSAltitude ? exifAllTags.GPSAltitude.toFixed(4) + " MASL"  : 'Not Available'
            var bearing = exifAllTags.GPSDestBearing ? exifAllTags.GPSDestBearing.toFixed(4) : 'Not Available'
            var bearingRef = exifAllTags.GPSDestBearingRef ? exifAllTags.GPSDestBearingRef : ''
            var speed = exifAllTags.GPSSpeed ? exifAllTags.GPSSpeed : 'Not Available'
            var speedRef = exifAllTags.GPSSpeedRef ? exifAllTags.GPSSpeedRef + "PH" : ''
            var mapsLink = latitude && longitude ? "<a href='http://maps.google.com/maps?q=" + latitude + ',' + longitude + "'  target='_blank'>" + latStr + ', ' + lonStr + "<img src='./images/MagnifyingGlassBlue.png' height='16' width='16' style='margin-left: 8px'></a>" : 'Not Available'
            resolve([latitude, longitude, dateTaken, device, latStr, lonStr, altitude, bearing, bearingRef, speed, speedRef, mapsLink])

    })
})
}

// Segmentation Stuff

var temp_height;
var temp_width;
var imgData_Array = [];
var temp_data = [];
var rn;
var cn;
var result = [];

function loadImage(file) {
    return new Promise(resolve => {
        var test_img = new Image();
        test_img.src = file;
        test_img.addEventListener('load', () => {
            temp_height = test_img.height;
            temp_width = test_img.width;

            var temp_imgData_Array = [];
            temp_data = [];
            var row = document.getElementById('segment_user_row').value;
            var col = document.getElementById('segment_user_col').value;
            rn = row;
            cn = col;

            for (var cut_row_num = 0; cut_row_num < row; cut_row_num++){
                for (var cut_col_num = 0; cut_col_num < col; cut_col_num ++){
                    /*            canvas = document.getElementById('CANVAS');*/
                    var canvas = document.createElement("CANVAS");
                    canvas.setAttribute('width', Math.ceil(temp_width/col).toString());
                    canvas.setAttribute('height',Math.ceil(temp_height/row).toString());
                    canvas.style.display = "none";
                    var ctx = canvas.getContext('2d');

                    ctx.drawImage(test_img,
                        Math.ceil(temp_width/col) * cut_col_num,  // x -position from source canvas to start clipping
                        Math.ceil(temp_height/row) * cut_row_num, // y - position from source canvas to start clipping
                        Math.ceil(temp_width/col),  // width of original image
                        Math.ceil(temp_height/row), // height of original image
                        0,  // x-position of target canvas
                        0,  // y-position of target canvas
                        Math.ceil(temp_width/col),
                        Math.ceil(temp_height/row),
                    );
                    var temp_canvas_holder = document.getElementById('temp_canvas');
                    temp_canvas_holder.appendChild(canvas);
                    var dataURL = canvas.toDataURL("image/png");
                    temp_imgData_Array.push(dataURL);
                }
            }
            while (temp_canvas_holder.hasChildNodes()){
                temp_canvas_holder.removeChild(temp_canvas_holder.childNodes[0])
            }
            var source_img_parent = document.getElementById('source');
            while (source_img_parent.hasChildNodes()) {
                source_img_parent.removeChild(source_img_parent.childNodes[0])
            }
            console.log(temp_imgData_Array);
            resolve(temp_imgData_Array)
        });
    })}

function segmentation(file, type){
    return new Promise(resolve => {
        loadImage(file).then((result) => {
            if (type === "target") {
                createTable(result);
            }
            resolve(result);
            console.log('Created Table')
        });
    })
}

/**
 * 
 * @param {Image segment} cell 
 * Sets cell image opacity
 * Opacity of 1 is selected
 * Opactiy of 0.1 is deselected
 */
function imgSelect(cell){
    let seg = cell.classList.contains("segSelected");
    if (seg){
        cell.style.opacity = 0.5;
        cell.classList.remove("segSelected");
    }
    else{
        cell.style.opacity = 1;
        cell.classList.add("segSelected");
    }
}

function createTable(result) {
    var k = 0;
    var image_list = result;
    for(var r=0;r<parseInt(rn,10);r++)
    {
        var x = document.getElementById('test_table').insertRow(r);
        x.style.color = "white";

        for(var c=0;c<parseInt(cn,10);c++)
        {
            //Create cell and insert image with function
            var y = x.insertCell(c);
            var img = new Image();
            img.src = image_list[k];

            
            y.style.opacity = 1;
            //Adds segSelected class by default selecting all segments
            y.classList.add("segSelected");

            y.setAttribute('onclick', 'imgSelect(this)');
            table_width = 600;
            cell_width = Math.ceil(table_width/cn);
            cell_height = Math.ceil(temp_height*table_width/(temp_width*rn));
            y.style.width = cell_width.toString()+"px";
            y.style.height = cell_height.toString()+"px";

            y.style.backgroundSize = "100% 100%";
            y.style.backgroundRepeat = "no-repeat";
            y.style.backgroundImage = "url("+image_list[k]+")";
            k = k +1;
        }
    }
}

var segment_selection = [];

function get_checkbox_list(){
    segment_selection = [];
    var table = document.getElementById("test_table");
    for (let i = 0; i < table.rows.length; i++){
        for (let j = 0; j < table.rows[i].cells.length; j++){
            //Adds true or false to segment_selection based on if 'segSelected' class is found for cell
            if (table.rows[i].cells[j].classList.contains("segSelected")){
                segment_selection.push(true);
            }
            else{
                segment_selection.push(false);
            }
            console.log(table.rows[i].cells[j]);
        }
    }
    console.log(segment_selection);
}

function on_load_segment(file, num_seg){
    return new Promise(resolve => {
        var appString = getSelectedVal();
        dateObj = new Date(file.lastModified);
        utcString = dateObj.toUTCString();
        window.filePath = document.getElementById('filePathInput').value;
        if (file.webkitRelativePath !== "") {
            fullFilePath = file.webkitRelativePath;
            window.filePath = fullFilePath.substring(0, fullFilePath.lastIndexOf("/") + 1);
        }
        var temp_img_details = [currentImageNum, window.filePath, file.name, appString, file.size, utcString];
        currentImageNum += 1;
        var reader_segment = new FileReader();
        var temp_seg_img = reader_segment.result;
        var temp_seg_file = file;
        reader_segment.readAsDataURL(file);
        reader_segment.onload = function(e){
            loadImage(e.target.result).then((result) => {
                console.log('123');
                resolve([result, file, temp_img_details, num_seg])
            });
        }
    })
}

function segmented_api_prep(img_segments, file, details, num_seg) {
    var exifEnabled = document.getElementById('exifOn').checked;
    if (exifEnabled) {
        getPhotodata(file).then(result => {
            var temp_exif_data = result;
            for (var seg_num = 0; seg_num < img_segments.length; seg_num++) {
                if (segment_selection[seg_num]) {

                    var temp_details = [
                        details[0].toString() + " Segment Position:" + (seg_num + 1).toString(),
                        details[1],
                        details[2],
                        details[3],
                        details[4],
                        details[5]
                    ];
                    var preBase = img_segments[seg_num].split("base64,")[1];
                    baseArray.push({base64: preBase});
                    imgArray.push(img_segments[seg_num]);
                    detailsArray.push(temp_details);
                    exifDataArray.push(temp_exif_data);
                    totalPredictions++;
                }

                if (baseArray.length == 32 || totalPredictions == num_seg) {
                    console.log("Predict called" + totalPredictions + num_seg);
                    segmented_api_call(file, baseArray, num_seg, imgArray, detailsArray, exifDataArray);

                    detailsArray = [];
                    baseArray = [];
                    fileDataArray = [];
                    imgArray = [];
                    exifDataArray = [];

                    if (totalPredictions == num_seg) {
                        totalPredictions = 1;
                    }
                }
            }
        })
    } else {
        for (var seg_num = 0; seg_num < img_segments.length; seg_num++) {
            if (segment_selection[seg_num]) {

                var temp_details = [
                    details[0].toString() + " Segment Position:" + (seg_num + 1).toString(),
                    details[1],
                    details[2],
                    details[3],
                    details[4],
                    details[5]
                ];
                var preBase = img_segments[seg_num].split("base64,")[1];
                baseArray.push({base64: preBase});
                imgArray.push(img_segments[seg_num]);
                detailsArray.push(temp_details);
                exifDataArray.push('');
                totalPredictions++;
            }
            if (baseArray.length == 32 || totalPredictions == num_seg) {
                console.log("Predict called" + totalPredictions + num_seg);
                segmented_api_call(file, baseArray, num_seg, imgArray, detailsArray, exifDataArray);

                detailsArray = [];
                baseArray = [];
                fileDataArray = [];
                imgArray = [];
                exifDataArray = [];

                if (totalPredictions == num_seg) {
                    totalPredictions = 1;
                }
            }
        }

    }
}

function segmented_api_call(file, val, num_seg, imgArray, detailsArray, exifDataArray){
    var app = getApp();
    var successfulPredict = false;
    var modelID = getCriteria();
    var dataTags = "";
    var predictedImages = document.getElementById('imageProcessed');
    var exifEnabled = document.getElementById('exifOn');
    window.filePath = document.getElementById('filePathInput').value;
    var threshold = document.getElementById('thresholdInputText').value;
    if (threshold == '' || threshold == 0) {
        threshold = -1;
    }


    if (modelID == Clarifai.COLOR_MODEL) {
        //Clarifai API call
        app.models.predict(modelID, val, threshold).then( function (response) {
                console.log(response);
                successfulPredict = true;
                processedImageCount += val.length;
                // Update this thing too, the number does not update, make a new var and have it count(? maybe)
                predictedImages.innerHTML = "Images processed: " + processedImageCount + " /";
                //Array for image values
                /*var values = new Array(num_seg);*/

                //For each file selected by user, show results

                for (var i = 0; i < num_seg; ++i) {
                    fileDetails = detailsArray[i];

                    // Instantiation of the array of concept tags.
                    if (modelID == Clarifai.COLOR_MODEL) {
                        dataTags = response.rawData.outputs[i].data.colors;
                        // Hardcoded, but if the first concept in the list is the higher than the treshold it will
                        // display what is there.
                        if (dataTags[0].value.toFixed(2) * 100 >= parseFloat(threshold)) {

                            // stores image thumbnails
                            var thumbNail = "<img class='table_img' src ='" + imgArray[i] + "'/>";

                            //Stores Image Score
                            var imgScore = String(dataTags[0].value * 100).substring(0, 5);
                            // var imgScore = n + "%";

                            // stores image tags
                            var imageTags = [];
                            for (var j = 0; j < dataTags.length; ++j) {
                                // imageTags[j] = "<br>" + dataTags[j].w3c.name + " " + String(dataTags[j].value * 100).substring(0,5) + "% " +
                                // "<svg class='colsq' width='100' height='30'> <rect width='200' height='20' style='fill:" + dataTags[j].w3c.name + ";' /> </svg> ";
                                imageTags[j] = "<div style='width: 300px; background: linear-gradient(to right, white 60%, " + dataTags[j].w3c.name + " 60%'>" + dataTags[j].w3c.name + " " + String(dataTags[j].value * 100).substring(0,5) + "%      </div>";
                            }
                            imageTags = imageTags.join("");

                            // adds data into rows array
                            rows_detail = [thumbNail, "", imgScore, imageTags, fileDetails];

                            if (exifEnabled.checked) {
                                var values = exifDataArray;
                                $(document).ready(function() {
                                    var t = $('#results').DataTable();

                                        if (values[i] !== "") {
                                            var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + ' ' + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Original Image Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: " + values[i][3]
                                                + "<br>Date Taken: " + values[i][2] + "<br>Date Modified: " + rows_detail[4][5] + "<br>Coords: " + values[i][11] + "<br>Altitude: " + values[i][6] + "<br>Direction: " + values[i][7] + " " + values[i][8]
                                                + "<br>Speed: " + values[i][9] + " " + values[i][10]
                                                + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] + "' name='note' placeholder='Enter notes here'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                        } else {
                                            var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Original Image Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: Not Available"
                                                + "<br>Date Taken: Not Available<br>Date Modified: " + rows_detail[4][5]
                                                + "<br>Coords: Not Available<br>Altitude: Not Available<br>Direction: Not Available<br>Speed: Not Available<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] +
                                                "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                        }
                                        t.row.add( [
                                            rows_detail[0],
                                            rows_detail[1],
                                            rows_detail[2],
                                            rows_detail[3],
                                            imgDetail]
                                        ).draw( false );
                                        $('#results').on('keyup', function () {
                                            t.search(this.value).draw()
                                        });

                                    rows.length = 0
                                } );

                            } else {
                                $(document).ready(function() {
                                    var t = $('#results').DataTable();
                                    for (var m = 0; m < values.length; ++m) {
                                        var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Original Image Size: " + rows_detail[4][4] /1000 + " KB"
                                            + "<br>Date Modified: " + rows_detail[4][5] + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0]
                                            + "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                        t.row.add( [
                                            rows_detail[0],
                                            rows_detail[1],
                                            rows_detail[2],
                                            rows_detail[3],
                                            imgDetail]
                                        ).draw( false );
                                        $('#results').on('keyup', function () {
                                            t.search(this.value).draw()
                                        })
                                    }
                                    rows.length = 0
                                } );
                            }


                            // $(document).ready(function() {
                            //     var t = $('#results').DataTable();

                            //       t.row.add( [
                            //         thumbNail,
                            //         "",
                            //         imgScore,
                            //         imageTags,
                            //         exifDetails]
                            //     ).draw( false );
                            //     $('#results').on('keyup', function () {
                            //         t.search(this.value).draw()
                            //     })
                            // } );

                        }

                    }
                }
                // for row in rowarray, add row to table with all details
                isLoading = false;
                showLoading(isLoading);
            },
            function (err) {
                predict(val, image, imgArray, fileData);
                console.log(err);
            }
        )
    }
    else
    {
        app.models.predict(modelID, val).then( function (response) {
                successfulPredict = true;
                processedImageCount += val.length;
                predictedImages.innerHTML = "Images processed: " + processedImageCount + " /";
                //Array for image values
                /*var values = new Array(num_seg);*/
                //For each file selected by user, show results


                for (var i = 0; i < num_seg; ++i) {
                    dataTags = response.rawData.outputs[i].data.concepts;

                    fileDetails = detailsArray[i];

                    // Hardcoded, but if the first concept in the list is the higher than the threshold it will
                    // display what is there.
                    if (dataTags[0].value.toFixed(2) * 100 >= parseFloat(threshold)) {

                        // stores image thumbnails
                        var thumbNail = "<img class='table_img' src ='" + imgArray[i] + "'/>";

                        //Stores Image Schore
                        var imgScore = String(dataTags[0].value * 100).substring(0, 5);
                        // var imgScore = n + "%";

                        // stores image tags
                        var imageTags = [];
                        for (var j = 0; j < dataTags.length; ++j) {
                            imageTags[j] = "<br>" + dataTags[j].name + " " + String(dataTags[j].value * 100).substring(0, 5) + "%";
                        }

                        if(window.filePath == null) {
                            window.filePath = "Not Specified.";
                        }

                        //adds data into datatable
                        // adds data into rows array
                        rows_detail = [thumbNail, "", imgScore, imageTags, fileDetails];

                        if (exifEnabled.checked) {
                            var values = exifDataArray;
                            $(document).ready(function() {
                                var t = $('#results').DataTable();

                                    if (values[i] !== "") {
                                        var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + ' ' + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Original Image Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: " + values[i][3]
                                            + "<br>Date Taken: " + values[i][2] + "<br>Date Modified: " + rows_detail[4][5] + "<br>Coords: " + values[i][11] + "<br>Altitude: " + values[i][6] + "<br>Direction: " + values[i][7] + " " + values[i][8]
                                            + "<br>Speed: " + values[i][9] + " " + values[i][10]
                                            + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] + "' name='note' placeholder='Enter notes here'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                    } else {
                                        var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Original Image Size: " + rows_detail[4][4] /1000 + " KB" + "<br>Device: Not Available"
                                            + "<br>Date Taken: Not Available<br>Date Modified: " + rows_detail[4][5]
                                            + "<br>Coords: Not Available<br>Altitude: Not Available<br>Direction: Not Available<br>Speed: Not Available<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0] +
                                            "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                    }
                                    t.row.add( [
                                        rows_detail[0],
                                        rows_detail[1],
                                        rows_detail[2],
                                        rows_detail[3],
                                        imgDetail]
                                    ).draw( false );
                                    $('#results').on('keyup', function () {
                                        t.search(this.value).draw()
                                    });

                                rows.length = 0
                            } );

                        } else {
                            $(document).ready(function() {
                                var t = $('#results').DataTable();
                                for (var m = 0; m < values.length; ++m) {
                                    var imgDetail = "<br>Image #" + rows_detail[4][0] + ": " + rows_detail[4][1] + rows_detail[4][2] + "<br>" + rows_detail[4][3] + "<br>Original Image Size: " + rows_detail[4][4] /1000 + " KB"
                                        + "<br>Date Modified: " + rows_detail[4][5] + "<br><input type='text' style='width: 600px' id='note" + rows_detail[4][0]
                                        + "' name='note' placeholder='Enter notes here' style='width: 200'><input type='button' value='Add' onclick='addNote(\"" + rows_detail[4][0] + "\")'>"
                                    t.row.add( [
                                        rows_detail[0],
                                        rows_detail[1],
                                        rows_detail[2],
                                        rows_detail[3],
                                        imgDetail]
                                    ).draw( false );
                                    $('#results').on('keyup', function () {
                                        t.search(this.value).draw()
                                    })
                                }
                                rows.length = 0
                            } );
                        }

                    }
                }

                // for row in rowarray, add row to table with all details

                isLoading = false;
                showLoading(isLoading);
            },
            function (err) {
                /*predict(val, image, imgArray, fileData);*/
                console.log('ERROR GG');
                console.log(err);
            }
        )
    }
}
