module.exports = {
    server_port : 3500,
    //db_url = "mongodb://localhost:27017/local",
    db_schemas : [

    ],
    route_info : [

    ],
    facebook : {
        clientId : '1440605592675311',
        clientSecret : '84b0a64d4e637d6fd11e27d04b9ae1af',
        callbackURL : '/auth/facebook/callback' 
    },
    naver : {
        clientId : '9oPn35LTmIKwLVx8EYP1',
        clientSecret : 'rd2vO5uw0Z',
        callbackURL : '/auth/naver/callback'
    }
}