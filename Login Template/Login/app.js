const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const session = require('express-session');
const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const {
    PORT = 8080,
    SESS_LIFETIME = 1000 * 60 * 60 * 2,
    SESS_NAME = 'sid',
    SESS_SECRET = 'fight sim'
} = process.env;

const user_db = require('./javascript/user_db.js');
var user = 'Characters';
var app = express();

hbs.registerPartials(__dirname + '/views/partials');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    name: SESS_NAME,
    secret: SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: SESS_LIFETIME,
        secure: false,
        sameSite: true
    }
}));

const redirectLogin = (request, response, next) => {
    if (!request.session.userId) {
        response.redirect('/')
    } else {
        next()
    }
};

const redirectHome = (request, response, next) => {
    if (request.session.userId) {
        response.redirect('/index_b')
    } else {
        next()
    }
};

app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/views'));
// app.use(express.static(path.join(__dirname, '../', '/views')));

app.get('/success', (request, response) => {
    response.render('success.hbs')
});

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
        end = new Date().getTime();
    }
}

var face_authentication = false;
var username_face = '';
app.get('/facetime', async (request, response) => {
    // wait(1500);
    function stringFromArray(data)
    {
        var count = data.length;
        var str = "";

        for(var index = 0; index < count; index += 1)
            str += String.fromCharCode(data[index]);

        return str;
    }

    var path = './ACIT2911_PROJECT/static/js/user_tem.json';

    if (fs.existsSync(path)){
        var readUser = fs.readFileSync(path);

        var username = stringFromArray(readUser);
        // console.log(`reading: ${username}`)

    } else {
        response.redirect('/')
    }

    var user_info = await user_db.check_username(username);
    // console.log(user_info);
    if (user_info === []) {
        response.redirect('/')
    } else {
        wait(1500);
        // console.log('from server');
        // console.log(user_info);
        face_authentication = true;
        username_face = user_info[0].user_name;
        user = user_info[0].email;
        request.session.userId = user_info[0].user_name;
        response.redirect('/index_b');
        fs.unlink(path, (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
});

app.get('/', redirectHome, (request, response) => {

    // if (request.session.userId) {
    //     response.redirect('/index_b');
    // } else {
    // response.status(200);
    response.status(200).render('index.hbs', {
        title_page: 'Official Front Page',
        header: 'Fight Simulator',
        username: user
    })
    // }
});

app.get('/login', redirectHome, (request, response) => {
    response.status(200).render('login.hbs')
});

app.post('/user_logging_in', async (request, response) => {


    var email = request.body.email;
    var password = request.body.password;
    var output = await user_db.login_check(email, password);

    if (output === 'Success!') {
        // authentication = true;
        user = email;
        request.session.userId = await user_db.email_get(user);
        response.redirect('/index_b')
    } else {
        response.render('login.hbs', {
            output: output
        })
        // response.redirect('/')
        // response.render('index.hbs', {
        //     title_page: 'Official Front Page',
        //     header: 'Fight Simulator',
        //     welcome: `Welcome ${user}`,
        //     username: user,
        //     output: output
        // })
    }
});

app.get('/logout', redirectLogin, (request, response) => {
    face_authentication = false;
    request.session.destroy( err => {
        if (err) {
            request.session.clearCookie(SESS_NAME);
            return response.redirect('/')
        }
    });
    user = 'Characters';
    response.redirect('/');
});

app.get('/index_b', redirectLogin, (request, response) => {
    // var name = await user_db.email_get(user);
    response.render('index_b.hbs', {
        title_page: 'Official Front Page',
        header: 'Fight Simulator',
        welcome: `Welcome ${request.session.userId}`,
        username: request.session.userId
    })
});

app.get('/sign_up', redirectHome, (request, response) => {
    response.render('sign_up.hbs', {
        title_page: 'Sign Up Form',
        header: 'Registration Form',
        username: user
    })
});

app.post('/insert', redirectHome, async (request, response) => {
    var first_name = request.body.first_name;
    // var last_name = request.body.last_name;
    var email = request.body.email;
    var password = request.body.password;
    var password_repeat = request.body.password_repeat;

    var output = await user_db.add_new_user(first_name, email, password, password_repeat);
    // var character_db_add = character_db.createAccount(email);
    // console.log(character_db_add);

    response.render('sign_up.hbs', {
        title_page: 'Sign Up Form',
        header: 'Registration Form',
        username: user,
        output_error: `${output}`
    })
});

app.get('/character', redirectLogin, async (request, response) => {
    var character_detail = await character_db.getDetails(user);

    if (character_detail === false) {
        response.render('character.hbs', {
            title_page: 'My Character Page',
            header: 'Character Stats',
            username: request.session.userId,
            character_name: 'CREATE CHARACTER NOW',
            character_health: 'CREATE CHARACTER NOW',
            character_dps: 'CREATE CHARACTER NOW'
        })
    } else {
        response.render('character.hbs', {
            title_page: 'My Character Page',
            header: 'Character Stats',
            username: request.session.userId,
            character_name: character_detail.character_name,
            character_health: character_detail.character_health,
            character_dps: character_detail.character_attack_damage
        })
    }
});

app.get('/character_creation', redirectLogin, async (request, response) => {
    // var name = await user_db.email_get(user);

    var authenticate = await character_db.authenticate(user);

    if (authenticate === true) {
        output = "You have a character ready for battle!";
        response.render('character_creation.hbs', {
            title_page: 'Character Creation',
            header: 'Create Character',
            username: request.session.userId,
            output_error: `${output}`
        })
    } else {
        output = "Create a character now!";
        response.render('character_creation.hbs', {
            title_page: 'Character Creation',
            header: 'Create Character',
            username: request.session.userId,
            output_error: `${output}`
        })
    }
});

app.post('/create_character', redirectLogin, async (request, response) => {
    var character_name = request.body.character_name;

    var outputting = await character_db.createCharacter(user, character_name);

    if (outputting === 'Character is already taken.') {
        response.redirect('back')
    } else if (outputting === 'Character created!') {
        response.redirect('/character')
    }
});


app.get('/account', redirectLogin, async (request, response) => {


    if (account_detail === false) {
        response.redirect('/account_error');
    } else {
        response.render('account.hbs', {
            name: request.session.userId,
            win: account_detail.win,
            losses: account_detail.lost,
            email: user,
            header: 'Account',
            username: request.session.userId,
        });
    }
});

app.get('/account_error', async (request, response) => {
    // var name = await user_db.email_get(user);
    response.render('account_error.hbs',{
        email: user,
        header: 'Account',
        username: request.session.userId
    })
});

app.get('/fight', redirectLogin, async (request, response) => {
    var character_stats = await character_db.getDetails(user);
    if (character_stats === false) {
        response.redirect('/character')
    } else {
        try {
            await fight.add_info(character_stats.character_name,
                character_stats.character_health,
                character_stats.character_attack_damage,
                user);

            var arena_stats = await fight.get_info(user); //dictionary
            // fight.battleEnemy(arena_stats.enemy_health, arena_stats.player_dps);
            // fight.battleCharacter(arena_stats.player_health, arena_stats.enemy_dps);

            response.render('fighting.hbs', {
                title_page: `Let's fight!`,
                header: 'Fight Fight Fight!',
                username: request.session.userId,
                character_name: arena_stats.player_name,
                enemy_name: `The Enemy`,
                health_player: `Health: ${arena_stats.player_health}`,
                dps_player: `DPS: ${arena_stats.player_dps}`,
                health_enemy: `Health: ${arena_stats.enemy_health}`,
                dps_enemy: `DPS: ${arena_stats.enemy_dps}`
            })
        } catch (e) {
            response.render('fighting.hbs', {
                title_page: 'Error 404',
                header: 'Error 404'
            })
        }
    }
});

app.get('/battle', redirectLogin, async (request, response) => {
    if (await fight.battleOutcome(user) === true) {
        // console.log('you are in the end game')
        await character_db.updateWin(user);
        response.render('win_lose_page.hbs', {
            win_lose: 'YOU WIN',
            username: request.session.userId
        })
    } else if (await fight.battleOutcome(user) === false) {

        await character_db.updateLost(user);
        response.render('win_lose_page.hbs', {
            win_lose: 'YOU LOSE',
            username: request.session.userId
        })
    } else {
        var arena_stats = await fight.get_info(user); //This is a dictionary

        await fight.battle(arena_stats.player_health, arena_stats.enemy_health, arena_stats.player_dps, arena_stats.enemy_dps,
            user);

        var result = await fight.get_info(user);

        response.render('fighting.hbs', {
            title_page: `Let's fight!`,
            header: 'Fight Fight Fight!',
            username: request.session.userId,
            character_name: result.player_name,
            enemy_name: `The Enemy`,
            health_player: `Health: ${result.player_health}`,
            dps_player: `DPS: ${result.player_dps}`,
            health_enemy: `Health: ${result.enemy_health}`,
            dps_enemy: `DPS: ${result.enemy_dps}`
        })
    }
});

app.post('/update', redirectLogin, async (request, response) => {
    var new_name = request.body.new_name;
    await character_db.updateName(user, new_name);
    response.redirect('/character')
});

app.get('/update_name', redirectLogin, async (request, response) => {
    var authenticate_character_existence = await character_db.authenticate(user);

    if (authenticate_character_existence === false) {
        response.redirect('/character')
    } else {
        response.render('update_name.hbs', {
            title_page: "Update Name",
            header: "Update Character Name",
            username: request.session.userId
        })
    }
});

app.post('/delete', redirectLogin, async (request, response) => {
    character_db.deleteCharacter(user);
    response.render('character.hbs', {
        title_page: 'My Character Page',
        header: 'Character Stats',
        username: request.session.userId,
        character_name: 'CREATE CHARACTER NOW',
        character_health: 'CREATE CHARACTER NOW',
        character_dps: 'CREATE CHARACTER NOW'
    })
});
////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////FORUM PAGE/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/forum', redirectLogin, async (request, response) => {
    var get_message =  await user_db.get_documents('messages');

    response.render('test_forum.hbs', {
        message: await get_message,
        username: request.session.userId,
        header: 'Message Forum',
        face_on: face_authentication
    });
});

app.post('/forum_post', redirectLogin, async (request, response) => {
    var message_title = request.body.message_title;
    var message_body = request.body.message_body;

    await user_db.post_message(message_title, message_body, user);
    // console.log('forum_post');

    response.redirect('back');
});

app.post('/forum_post_face', redirectLogin, (request, response) => {
    var message_title = request.body.message_title;
    var message_body = request.body.message_body;

    user_db.post_message_face(message_title, message_body, username_face);
    // console.log('forum_post_face');

    response.redirect('back')
});

app.use((request, response) => {
    response.send({
        error: `404, site not found`
    });
});

app.listen(PORT, () => {
    console.log(`Server is up on the port ${PORT}`);
    console.log(`http://localhost:${PORT}/`);
    // console.log(`http://localhost:${PORT}/forum`);
    //
    // console.log(`http://localhost:8000/login`);
    // console.log(`http://localhost:8000/register`)
});

module.exports = app;