firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.

    document.getElementById("user_div").style.display = "block";
    document.getElementById("login_div").style.display = "none";

    var user = firebase.auth().currentUser;

    if(user != null){
      var email_id = user.email;
      document.getElementById("user_para").innerHTML = "Welcome User : " + email_id;
 
      // Use this to set current user to 50 usages
      writeUserData(user.uid, 'first name', 'last name', 'entity name', 'phone number', 'payment method', user.email, 0);

      //const scanRef = firebase.database().ref().child('users/' + user.uid);
      //scanRef.on('value', snap => document.getElementById("scans").innerHTML = "Scans left: " + snap.val()['scanNumber']);
    }
  } else {
    // No user is signed in.
    document.getElementById("user_div").style.display = "none";
    document.getElementById("login_div").style.display = "block";

  }
});

function login(){
  var userEmail = document.getElementById("email_field").value;
  var userPass = document.getElementById("password_field").value;

  firebase.auth().signInWithEmailAndPassword(userEmail, userPass).catch(function(error) {
    // Handle Errors here.
    var errorMessage = error.message;
    window.alert("Error : " + errorMessage);
  });
}

function writeUserData(userId, fName, lName, eName, pNumber, pMethod, email, scans){
  firebase.database().ref('users/' + userId).set({
    firstName: fName,
    lastName: lName,
    entity: eName,
    phoneNumber: pNumber,
    paymentMethod: pMethod,
    email: email,
    scanNumber : scans
  });
}

function scanImage(){
  let user = firebase.auth().currentUser;
  var userId = user.uid;
  let email = user.email;
  var remainingScans = 0;
  var scanRef = firebase.database().ref().child('users/' + user.uid);
  scanRef.once('value', snap => remainingScans = snap.val()['scanNumber']);
  remainingScans = remainingScans - 1;
  writeUserData(user.uid, 'first name', 'last name', 'entity name', 'phone number', 'payment method', remainingScans);
}

function logout(){
  firebase.auth().signOut();
}