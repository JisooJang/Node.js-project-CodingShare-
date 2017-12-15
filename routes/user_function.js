var nodemailer = require('nodemailer');

var addUser = function(database, id, password, name, profile_image, callback) {
    console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name);
  
    // db의 users2 컬렉션 참조
    var users = database.collection('users2');
  
    // id, password, username을 사용해 사용자 추가
    users.insertMany([{"id":id, "password":password, "name":name, "profile_image":profile_image }], function(err, result) {
      if(err) {
        callback(err, null);
        return;
      }
  
      if(result.insertCount > 0) {
        console.log('사용자 레코드 추가됨 : ' + result.insertedCount);
      } else {
        console.log('추가된 레코드가 없음.');
      }
  
      callback(null, result);
    });
};
  
  
  // 사용자 인증(로그인) 함수
var authUser = function(database, id, password, callback) {
    console.log('authUser 호출됨.');
  
    // users 컬렉션 참조
    //var users = database.collection('users');
    var users = database.collection('users2');    //db에서 users2 이름의 콜렉션 정보를 가져온다.
  
    // 아이디와 비밀번호를 사용해 검색
    users.find({"id" : id, "password" : password}).toArray(function(err, docs) {
      if(err) {
        callback(err, null);  // 콜백함수에 err객체와 null값을 보냄
        return;
      }
  
      if(docs.length > 0) { // 검색 결과 값이 존재하면
        console.log('아이디 [%s], 비밀번호 [%s]가 일치하는 사용자 찾음.', id, password);
        callback(null, docs);   // 콜백함수에 db 검색결과인 docs배열을 전달
      } else {  // 검색 결과 값이 존재하지 않으면
        console.log('일치하는 사용자 찾지 못함.');
        callback(null, null);
      }
    });
};
  
  
  // 회원 검색 함수
var findUser = function(database, value, search_option, callback) {
    console.log('findUser 호출됨.');
    console.log(search_option + " : " + value);
    var users = database.collection('users2');   //db에서 users2 이름의 콜렉션 정보를 가져온다.
    var find_json = {};
    find_json[search_option + ""] = value;  // json객체에서 key값을 문자열로 표시하기 위한 방법
  
    console.log(find_json);
  
    users.find(find_json).toArray(function(err, docs) {
      if(err) {
        callback(err, null);    // 콜백함수에 err객체와 null값을 보냄
        return;
      }
  
      if(docs.length > 0) {
        console.log(search_option + " : " + value + " ===== 일치하는 사용자 찾음 ");
        callback(null, docs);   // 콜백함수에 db 검색결과인 docs배열을 전달
      } else {
        console.log('일치하는 사용자 찾지 못함.');
        callback(null, null);
      }
    });
  
};
  
  // 이메일 전송 함수
var sendEmail = function(from_email, to_email, subject, html) {
    var smtpTransport = nodemailer.createTransport({
      pool: true,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          user: 'inspirebj@gmail.com',
          pass: 'bcjsforever93'
      }
    });
  
    var mailOptions = {
      from: 'from_email',
      to: to_email,
      subject: subject,
      html: html
    };
  
    smtpTransport.sendMail(mailOptions, function(error, response) {
      if(error) {
        console.log(error); 
      } else {
        console.log('message sent : ' + response.message);
      }
  
      smtpTransport.close();
    });
  
};
  
var addFriend = function(database, user_id, friend_id, callback) {
    console.log('addFriend 호출됨.');
  
    var friend = database.collection('friend');
    if(user_id == friend_id) {
      console.log('자기 자신을 친추할 수 없습니다.');
      res.send({'alert_message': '자기 자신을 친추할 수 없습니다.'});
    }
    
    friend.find({"id": user_id, "friend_id" : friend_id}).toArray(function(err, docs) {
      if(err) {
        callback(err, null);
        return;
      }
      if(docs.length > 0) {
        console.log('이미 친구 추가가 되어있는 회원입니다.');
        callback(null, null);
        return;
      }
      else {
         // friend 테이블에서 이미 존재하는 검색결과가 존재하지 않을 때 db에 추가
        friend.insertMany([{"id":user_id, "friend_id":friend_id }], function(err2, result) {
        if(err2) {
          callback(err2, null);
          return;
        }
  
        if(result.insertCount > 0) {
          console.log('사용자 레코드 추가됨 : ' + result.insertedCount);
        } else {
          console.log('추가된 레코드가 없음.');
        }
  
        callback(null, result);
        });
      }
    });
      
};
  
  
var viewFriends = function(database, user_id, callback) {
    console.log('viewFriends 호출됨.');
    var friend = database.collection('friend');   //db에서 friend 이름의 컬렉션을 가져온다.
  
    friend.find({ "id": user_id }).toArray(function(err, docs) {
      if(err) {
        callback(err, null);    // 콜백함수에 err객체와 null값을 보냄
        return;
      }
  
      if(docs.length > 0) {
        console.log("사용자 찾음");
        callback(null, docs);   // 콜백함수에 db 검색결과인 docs배열을 전달
      } else {
        console.log('일치하는 사용자 찾지 못함.');
        callback(null, null);
      }
    });
}


module.exports.addUser = addUser;
module.exports.authUser = authUser;
module.exports.findUser = findUser;
module.exports.sendEmail = sendEmail;
module.exports.addFriend = addFriend;
module.exports.viewFriends = viewFriends;
