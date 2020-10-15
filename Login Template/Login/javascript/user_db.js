const fs = require('fs');
const _ = require('lodash');
const passwordHash = require('password-hash');

const firebase = require('firebase/app');
require('firebase/firestore');
firebase.initializeApp({
    apiKey: "AIzaSyCT-ig3IbJNgfDjoPqrOjjfrXj-pFkRuj0",
    authDomain: "acit2911-project.firebaseapp.com",
    databaseURL: "https://acit2911-project.firebaseio.com",
    projectId: "acit2911-project",
    storageBucket: "acit2911-project.appspot.com",
    messagingSenderId: "290770888287"
});

var check_username = async (user_name) => {
    //fetches all the documents in the collection
    var db = firebase.firestore();

    var list = [];

    try {
        var messages = await db.collection('accounts');

        var get_messages = await messages.get();

        // console.log(user_name);

        get_messages.forEach((element) => {
            // if (element.data().username)
            if (element.data().user_name === user_name) {
                list.push(element.data())
                // console.log(element.data())
            }
        });

        return list
    } catch (err) {
        console.log(err);
        return 'No new messages';
    }
};

// check_username('adiulay').then((element)=> {
//     // console.log(element)
// }).catch(
//     err => {
//         console.log(err)
//     }
// );

/////////////////////////////////////////////////////////////////////////////////////
// get_documents().then( (data) => {
//     console.log(data)
// });
/////////////////////////////////////////////////////////////////////////////////////

// const path = './user_database.json';

// try{
//     if (fs.existsSync(path)){
//         console.log('user_database.json is found');
//     } else {
//         throw 'File user_database.json is not found, creating new file...'
//     }
// } catch(err) {
//     console.log(err);
//     fs.writeFileSync('user_database.json', "{}");
// }

// var readUser = fs.readFileSync("user_database.json");
// var userObject = JSON.parse(readUser);

var add_new_user = async (username, email, password, re_password) => {

    if (password !== re_password) {
        //checks password whenever necessary
        return 'Password does not match.'
    } else {
        try {
            var db = firebase.firestore();

            var data = {
                email: email,
                password: passwordHash.generate(password),
                username: username
            };
            //checks for email if exist
            var check_email_exist = await db.collection('accounts').doc(email).get();

            if (check_email_exist.data().email === email) {
                return 'Email is already taken.'
            } else if (check_email_exist.data().username === username) {
                return 'Username is already taken.'
            } else {
                db.collection('accounts').doc(email).set(data);
                return 'Account created!'
            }
        } catch (err) {
            if (err) {
                db.collection('accounts').doc(email).set(data);
                return 'Account created!'
            } else {
                console.log('Error on register.js function addData');
            }
        }
    }

    // if (email in userObject) {
    //     return 'Email has already been taken.'
    // }
    //
    // if (password !== password_repeat) {
    //     return 'Password does not match'
    // } else {
    //     userObject[email] = {
    //         First_Name: first_name,
    //         Last_Name: last_name,
    //         Email_Address: email,
    //         Password: passwordHash.generate(password)
    //     };
    //     var result_user_account = JSON.stringify(userObject, undefined, 2);
    //     fs.writeFileSync('user_database.json', result_user_account);
    //
    //     return 'Your account is created!'
    // }
};

var login_check = async (email, password) => {
    var db = firebase.firestore();
    try {
        var check_email_exist = await db.collection('accounts').doc(email).get();

        if (check_email_exist.data().email === email) {
            if (passwordHash.verify(password, check_email_exist.data().password) === true) {
                return 'Success!'
            } else {
                return 'Password incorrect'
            }
        } else {
            return 'Email is not found'
        }
    } catch (err) {
        if (err) {
            return 'Email is not found'
        } else {
            console.log(err);
        }
    }

    // console.log(typeof userObject.Password);

    // if (email in userObject) {
    //     if (passwordHash.verify(password, userObject[`${email}`].Password) === true) {
    //         return 'Success!'
    //     } else {
    //         return 'Password incorrect'
    //     }
    // } else {
    //     return 'Email is not found'
    // }
};

var email_get = async (email) => {
    var db = firebase.firestore();

    try {
        var check_email_exist = await db.collection('accounts').doc(email).get();

        if (check_email_exist.data().email === email) {
            return check_email_exist.data().username
        }
    } catch (err) {
        if (err) {
            return 'Error Please Log off'
        } else {
            console.log(err)
        }
    }
};

var check_email = async (email) => {
    var db = firebase.firestore();

    try {
        var check_email_exist = await db.collection('accounts').doc(email).get();

        if (check_email_exist.data().email === email) {
            return true
        }
    } catch (err) {
        if (err) {
            return false
        } else {
            console.log(err)
        }
    }
};

var delete_test = async () => {
    var db = firebase.firestore();
 try {
     await db.collection("accounts").doc("test_email@gmail.com").delete()
 } catch (err) {
     console.log('Testing phase error code')
 }
};

var delete_account = async(email) => {
    var db  = firebase.firestore();
    try {
        await db.collection("accounts").doc(email).delete()
    } catch (err) {
        console.log('Deleting Account error')
    }
};
///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////FORUM FUNCTIONS/////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

var get_documents = async (collection_name) => {
    //fetches all the documents in the collection
    var db = firebase.firestore();

    var list = [];

    try {
        var messages = await db.collection(collection_name);

        var get_messages = await messages.get();

        get_messages.forEach((element) => {
            list.push(element.data());
        });

        //returns a list of documents info
        // console.log(list)
        return list.sort((a, b) => {
            return new Date(b.created) - new Date(a.created)
        });

        // console.log(get_messages)
// below is the promise method
        // messages
        //     .get()
        //     .then(snapshot => {
        //         snapshot.forEach(doc => {
        //             // console.log(doc.data());
        //             // console.log(doc.id)
        //             console.log(doc.data())
        //         });
        //     })
        //     .catch(err => {
        //         console.log(err)
        //     });
    } catch (err) {
        console.log(err);
        return 'No new messages';
    }
};

// const sortMessageByLatest = (nbaPlayers) => {
//     return nbaPlayers.sort(function(a, b){
//         return new Date(a.debut) - new Date(b.debut);
//     });
// }

// get_documents('messages').then( (data) => {
//     console.log(data)
// });

var post_message = async(subject, message, email) => {

    try {
        var db = firebase.firestore();
        var check_email_exist = await db.collection('accounts').doc(email).get();

        // console.log(check_email_exist.data());

        if (check_email_exist.data().email === email) {
            db.collection('messages').add({
                subject: subject,
                username: check_email_exist.data().username,
                message: message,
                created: Date()

            });
            return 'Message Posted'
        }
    } catch (err) {
        return 'Email is not found in the database'
    }

};

var post_message_face = async (subject, message, username) => {

    try {
        var db = firebase.firestore();

        await db.collection('messages').add({
            subject: subject,
            username: username,
            message: message,
            created: Date()
        });
        return 'Message Posted'
        // }
    } catch (err) {
        return 'Error posting message into database'
    }
};

// console.log(post_message_face('subject', 'message', 'testing it out'))

// post_message('hello jimmy i just posted this message', 'asdf@gmail.com', 'asdf@gmail.com').then((item) => {
//     console.log(item)
// }
// ).catch((err) => {
//     console.log('something happened');
// });

// console.log(Date(value))

var delete_test_message = async() => {
    try{
        //fetches all the documents in the collection
        var db = firebase.firestore();

        var messages = await db.collection('messages');

        var get_messages = await messages.get();

        get_messages.forEach((element) => {

            if (element.data().username === 'DELETEMESSAGE') {
                db.collection('messages').doc(element.id).delete();
            }
            // console.log(element.data().username)
        });

        return 'Testing Message deleted'

        //returns a list of documents info
        // console.log(list)

        // return list.sort((a, b) => {
        //     return new Date(b.created) - new Date(a.created)
        // });

    } catch (err) {
        return err
    }
};

module.exports = {
    add_new_user: add_new_user,
    login_check: login_check,
    email_get: email_get,
    delete_test,
    delete_account,
    check_email,
    get_documents,
    post_message,
    post_message_face,
    delete_test_message,
    check_username
};