var nodemailer = require('nodemailer');

var getUser = function(database, id, callback) {
  var users = database.collection('users2');
  users.find({"id" : id}).toArray(function(err, docs) {
    if(err) {
      callback(err, null);
    }

    if(docs.length > 0) { // 검색 결과 값이 존재하면
      callback(null, docs);
    } else {  // 검색 결과 값이 존재하지 않으면
      console.log('getUser 결과 없음');
      callback(null, null);
    }
  });
}

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

    var users = database.collection('users2');   //db에서 users2 이름의 콜렉션 정보를 가져온다.
    var find_json = {};
    find_json[search_option + ""] = value;  // json객체에서 key값을 문자열로 표시하기 위한 방법
  
    console.log(find_json);
  
    users.find(find_json).toArray(function(err, docs) {
      if(err) {
        callback(err, null);    // 콜백함수에 err객체와 null값을 보냄
        return;
      }
      if(docs) {
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
        console.log('message sent : ' + response);
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
    friend.aggregate([
      { $lookup:
         {
           from: 'users2',
           localField: 'friend_id',
           foreignField: 'id',
           as: 'friend_details'
         }
       }
      ], function(err, res) {
      if (err) throw err;
      console.log(JSON.stringify(res));
      callback(null, res);
    });
    /*
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
    */
}

var saveRoom = function(database, participants, contents, code_language, room_url, room_title, description, likes, callback) {
  console.log('saveRoom 호출됨');
  //만약 방 url이 이미 등록되어있으면 participants에 회원 아이디만 추가
  var rooms = database.collection('rooms');
  rooms.insertMany([{"participants":participants, "contents":contents, "code_language":code_language, "room_url":room_url, "room_title":room_title, "description":description, likes:likes }], function(err, result) {
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

}

var viewRooms = function(database, user_id, callback) {
  console.log('viewRooms 호출됨');
  var rooms = database.collection('rooms');
  rooms.find({"participants" : user_id}).toArray(function(err, docs) {
    if(err) {
      callback(err, null);
    }

    if(docs.length > 0) { // 검색 결과 값이 존재하면
      callback(null, docs);
    } else {  // 검색 결과 값이 존재하지 않으면
      console.log('viewRooms 결과 없음');
      callback(null, null);
    }
  });
}

var likeRooms = function(database, user_id, room_id, callback) {
  console.log('likeRooms 호출됨');
  var likes = database.collection('likes');
  var rooms = database.collection('rooms');
  likes.find({'id': user_id, 'room_id': room_id}).toArray(function(err, docs) {
    if(err) { throw err; }
    if(docs.length > 0) {
      console.log('이미 좋아요를 누름');
      modify_likes(database, room_id, 0);

      likes.remove({'id': user_id, 'room_id': room_id}, function(err, docs) {
        console.log('좋아요 레코드삭제 완료');
      });

      callback(null, {'like_result' : 'min'});
    } else {
      console.log('좋아요 반영');
      modify_likes(database, room_id, 1);

      likes.insertMany([{'id': user_id, 'room_id': room_id}], function(err, result) {
        if(err) {
          callback(err, null);
          return;
        }
        if(result.insertCount > 0) {
          console.log('좋아요 체크 레코드 추가됨 : ' + result.insertedCount);
        } else {
          console.log('좋아요 체크 추가된 레코드 없음.');
        }
      });

      callback(null, {'like_result' : 'add'});

    }
  });
};


var modify_likes = function(database, room_id, key) {
  var likes_num = 0;
  console.log('modify_likes 호출됨');
  var rooms = database.collection('rooms');
  rooms.find({'room_url': 'http://127.0.0.1:3500/shareRoom/' + room_id}).toArray(function(err, docs) {
    if(err) { throw err; }
    if(docs) {
      likes_num = parseInt(docs[0].likes);
      console.log('likes_num : ' + likes_num);
    }
  });
  if(key == 1) {
    likes_num = likes_num + 1;
    console.log('likes_num2 : ' + likes_num);
    rooms.update({'room_url': 'http://127.0.0.1:3500/shareRoom/' + room_id}, {$set:{'likes': likes_num}}, function(err,docs) {
      if(err) { throw err; }
    });
  } else {
    likes_num = likes_num - 1;
    console.log('likes_num2 : ' + likes_num);
    rooms.update({'room_url': 'http://127.0.0.1:3500/shareRoom/' + room_id}, {$set:{'likes': likes_num}}, function(err, docs) {
      if(err) { throw err; }
    });
  }
}

var shareRoom = function(database, room_id, callback) {
  console.log('shareRoom 호출됨');
  var room = database.collection('rooms');
  room.find({'room_url': 'http://127.0.0.1:3500/shareRoom/' + room_id}).toArray(function(err, docs) {
    if(err) { throw err; }
    if(docs && docs.length > 0) {
      console.log('user docs : ' + docs);
      callback(null, docs);
    } else {
      console.log('user docs 없음');
      callback(null, null);
    }
  });

}

var addParticipants = function(database, room_url, user_id, contents, callback) {
  console.log('addParticipants 호출됨');
  var room = database.collection('rooms');
  room.update({"room_url": room_url}, { $addToSet : { "participants" : user_id }}, function(err, docs) {
    if(err) { throw err; }
    if(docs) {
      console.log('방 참여자 추가 성공');
    } else {
      console.log('방 참여자 추가 실패');
    }
  });
  room.update({"room_url": room_url}, { $set : { "contents" : contents }}, function(err, docs) {
    if(err) { throw err; }
    if(docs) {
      console.log('방 내용 수정 성공');
      callback(null, docs);
    } else {
      console.log('방 내용 수정 실패');
      callback(null, null);
    }
  });
} 

var modify_room_submit = function(database, room_id, room_title, description, password, code_language, public, callback) {
  var room = database.collection('rooms');
  var room_url = 'http://127.0.0.1:3500/shareRoom/' + room_id;
  room.update({"room_url": room_url}, {$set:{'room_title': room_title, 'description':description, 'password':password, 'code_language':code_language, 'public':public}}, function(err, docs) {
    if(err) { throw err; }
    if(docs) {
      callback(null, docs);
    } else {
      console.log('데이터 추가 오류');
      callback(null, null);
    }
  });
};
module.exports.getUser = getUser;
module.exports.addUser = addUser;
module.exports.authUser = authUser;
module.exports.findUser = findUser;
module.exports.sendEmail = sendEmail;
module.exports.addFriend = addFriend;
module.exports.viewFriends = viewFriends;
module.exports.saveRoom = saveRoom;
module.exports.viewRooms = viewRooms;
module.exports.likeRooms = likeRooms;
module.exports.shareRoom = shareRoom;
module.exports.addParticipants = addParticipants;
module.exports.modify_room_submit = modify_room_submit;
