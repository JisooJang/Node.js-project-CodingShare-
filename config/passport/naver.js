var NaverStrategy = require('passport-naver').Strategy;
var config = require('../config.js');
var session_user;

var naver_callback = function(app, passport) {
    return new NaverStrategy({
        clientID : config.naver.clientId,
        clientSecret : config.naver.clientSecret,
        callbackURL : config.naver.callbackURL
    }, function(accessToken, refreshToken, profile, done) {
        console.log('passport의 naver 호출됨');
        console.dir('profile:' + profile);

        var _profile = profile._json;
        
        var user = {
            'auth_type' : 'naver',
            'auth_id' : _profile.id,
            'auth_name' : _profile.nickname,
            'auth_email' : _profile.email
        };
        
        session_user = {
            id: user.auth_email,
            name: user.auth_name,
            profile_image: 'http://127.0.0.1:3500/public/image/default_profile.png',
            authorized: true
        }

        done(null, session_user);

        /*
        var database = app.get('database');
        database.userModel.load(options, function(err, user) {
            if(err) return done(err);

            if(!user) {
                var user = new database.userModel({
                    name : profile.displayName,
                    email : profile.emails[0].value,
                    provider : 'facebook',
                    facebook : profile._json
                });

                user.save(function(err) {
                    if(err) console.log(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
        */

    });
};

module.exports.naver_callback = naver_callback;
module.exports.session_user = session_user;