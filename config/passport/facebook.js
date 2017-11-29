var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config');

module.exports = function(app, passport) {
    return new FacebookStrategy({
        clientID : config.facebook.clientId,
        clientSecret : config.facebook.clientSecret,
        callbackURL : config.facebook.callbackURL
    }, function(accessToken, refreshToken, profile, done) {
        console.log('passport의 facebook 호출됨');
        console.dir(profile);

        var user = {
            name : profile.displayName,
            email : profile.emails[0].value,
            provider : 'facebook',
            facebook : profile._json
        };

        console.log('user.name : ' + user.name + ' user.email : ' + user.email);

        done(null, user);
        
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