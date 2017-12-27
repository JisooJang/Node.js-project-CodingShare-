var fs = require('fs');
var user = require('./user_function.js');
var shortid = require('shortid'); // 랜덤URL 생성 모듈
var database;
var roomName;
var init = function(db) {
    database = db;
}

var join = function(req, res) {
    console.log('/join 요청');
    console.log(req.body.email);
    console.log(req.body.password);
    console.log(req.body.nickname);

    var paramId = req.body.email;
    var paramPassword = req.body.password;
    var name = req.body.nickname;
    var profile_image = 'http://127.0.0.1:3500/public/image/default_profile.png';

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + name);
    

    var subject = name + '님 코드쉐어 회원가입을 축하드립니다.';
    var html = subject + '<br> 코드쉐어에서 다양한 네트워킹과 간편한 코딩 공유를 경험해보세요 ^_^';

    
    if(database) {
        user.addUser(database, paramId, paramPassword, name, profile_image, function(err, result) {
          if(err) { throw err; }
    
          if(result && result.insertedCount > 0) {
            console.dir(result);
    
            console.log('사용자 추가 성공');
            res.send({'alert_message' : '가입 성공'});
            user.sendEmail('inspirebj@gmail.com', paramId, subject, html);
          } else {
            console.log('사용자 추가 실패');
            res.send({'alert_message' : '가입 실패'});
          }
        });
      } else {
        console.log('데이터베이스 연결 실패');
        res.send({'alert_message' : '데이터베이스 오류'});
      }
}

var login = function(req, res) {
  var paramId = req.body.email;
  var paramPassword = req.body.password;
  
  console.log(paramId + ', ' + paramPassword);
  
  if(req.session.user) {
    console.log('이미 로그인되어있습니다.');
  }
  else {
    if(database) {
    user.authUser(database, paramId, paramPassword, function(err, docs) {
      if(err) { throw err; }
      if(docs) {
        console.dir(docs);
        var username = docs[0].name;
        req.session.user = {
            id: paramId,
            name: username,
            profile_image: docs[0].profile_image,
            authorized: true
        }
        res.send({'alert_message' : '로그인 성공'});
      } else {
        console.log('로그인 실패');
        res.send({'alert_message' : '로그인 실패'});
      }
    });
  } else {
    console.log('데이베이스 오류');
    res.send({'alert_message' : '데이터베이스 오류'});
  }
}
};

var logout = function(req, res) {
    if(req.session.user) {
        console.log('세션 확인 : ' + req.session.user);
        console.log('%s 회원 로그아웃 요청', req.session.userId);
  
        req.session.destroy(function(err) {
            console.log('세션 삭제 완료');
            res.redirect('http://127.0.0.1:3500');
        });    
    }
    else {
      res.redirect('http://127.0.0.1:3500');
        //res.send({"alert_message" : "세션이 만료되었습니다. 다시 로그인해주세요."});
    }   
}
var findPassword_before = function(req, res) {
  if(req.session.user) {
    console.log('이미 로그인되어 있습니다.');
    res.send({"alert_message" : "이미 로그인되어 있습니다."});
} else {
  var email = req.body.email;
  console.log(email);
  var subject = '코딩쉐어 비밀번호 찾기 인증 메일입니다.';
  var pass_temp = shortid.generate() + shortid.generate();
  var html_content =  '코드쉐어에서 회원님의 이메일 계정으로 비밀번호 찾기 요청이 확인되었습니다.<br>본인이 맞으시면 아래 수락버튼을 눌러주세요!<br>';
  html_content += '<a href="http://127.0.0.1:3500/findPassword/accept/' + email +'">비밀번호 찾기 수락(본인확인완료)</a>';

  user.sendEmail('inspirebj@gmail.com', email, subject, html_content);
  res.send("인증 메일을 성공적으로 전송하였습니다. 메일 확인후 수락버튼을 누르시면 임시 비밀번호가 전송됩니다.");
}
}
var findPassword = function(req, res) {
    if(req.session.user) {
        console.log('이미 로그인되어 있습니다.');
        res.send({"alert_message" : "이미 로그인되어 있습니다."});
    } else {
      var email = req.params.id;
      console.log('findPassword' + email);
      var subject = '코딩쉐어 비밀번호 찾기 안내 메일입니다.';
      var pass_temp = shortid.generate() + shortid.generate();
      var html_content =  '코드쉐어에서 회원님의 이메일 계정으로 임시 비밀번호를 보내드립니다.<br>임시비밀번호로 로그인 후 비밀번호를 변경해주세요!<br> 임시비밀번호 : ' + pass_temp;
  
      if(database) {
        var user2 = database.collection('users2');
        user2.update({'id' : email}, {$set : {'password' : pass_temp}});
      }
  
      user.sendEmail('inspirebj@gmail.com', email, subject, html_content);
      res.send("임시 비밀번호를 해당 메일로 전송하였습니다. 임시비밀번호를 이용하여 로그인후 비밀번호를 변경해주세요.");
    }
}

var mygroup = function (req, res) { 
    if(req.session.user) {
      var userId = req.session.user.id;   // 세션 객체에서 로그인된 회원 아이디 추출
    
    } else {
     
      console.log('로그인이 필요함.');
      res.send({"key" : "login", "request_url" : "/mygroup"});
      //res.redirect('http://127.0.0.1:3500/public/login.html');  
      // 로그인페이지에서 로그인 클릭시 기존 요청했던 requset_url로 페이지를 이동시키도록 구현
    }    
}

var finduser = function (req, res) {
    var search_option = req.body.search_option;   // 사용자가 회원 검색시 select 태그로 선택한 조건 값을 불러온다
    var value = req.body.keyword;
    console.log(search_option);

    if(req.session.user) {
      if(database) {
        user.findUser(database, value, search_option, function(err, docs) {
          if(err) { throw err; }
          if(docs) {
            console.log(docs);
            res.send(docs);
          }
          else {  // 검색 결과 데이터가 존재하지 않을 때
            res.send("검색 결과가 존재하지 않습니다.");
          }
        });
      }
    } else {
      console.log('로그인이 필요합니다.');
      res.send({"key" : "login", "request_url" : "/finduser"});
    }
}

var make_rooms = function(req, res) {
    var room_id = shortid.generate(); // 중복값 체크 필요한지 알아볼것
    res.redirect('http://127.0.0.1:3500/shareRoom/' + room_id); 
}

var shareRoom = function(req, res) {
  console.log('shareRoom 호출');
    roomName = req.body.room_id;
    console.log('router roomName : ' + roomName);
    if(req.session.user) {
      console.log(req.session.user.id);
    
    user.shareRoom(database, roomName, function(err, docs) {
      if(err) { throw err; }
      if(docs && docs.length > 0) {
        console.log('db에 방 존재');
        console.log(docs);
        res.send(docs);
      } else {
        console.log('방 검색결과 없음');
      }
    });
  } else {
    console.log('로그인 필요');
    read.send({'key': 'login'});
  }
}

var shareRoom_new = function(req, res) {
  roomName = req.param.room_id;
  fs.readFile( __dirname + '/../views/board.html', "utf-8", function(error, data) {
    if(error) console.log(error.message);
    //res.writeHead(200, {'Content-Type' : 'text/html'});
    res.send(data.toString());
  });
}


var addFriend = function(req, res) {
    var friend_id = req.params.id;
    if(req.session.user) {
      res.send({
        "alert_message" : "add_friend",
        "requester" : req.session.user.id,
        "receiver" : friend_id
    });
    } else {
      console.log('로그인 세션 필요');
      res.send({"key" : "login", "request_url" : "/addFriend/" + friend_id});
    }
}

var addFriend_accepted = function(req, res) {
    var friend_id = req.params.id;
    
    if(req.session.user) {
      if(database) {
        // 디비에 친구추가 하기 전에, 상대방에게 요청 알림이 가고 수락해야 db에 저장할 것.
        // 디비에 친구 추가
        user.addFriend(database, req.session.user.id, friend_id, function(err, docs) {
          if(err) { throw err; }
          if(docs) {
            console.log(docs);
            //res.send({'alert_message' : '친구 추가가 완료되었습니다.'});
            res.redirect('http://127.0.0.1:3500/public/mypage.html');
          }
          else { 
            res.send("이미 친구 추가가 되어있는 회원입니다.");
          }
        });
      } else {
        console.log('데이터베이스 접속 오류');
      }
    } else {
      console.log('로그인 세션 필요');
      //로그인 페이지로 이동, 로그인 후 친구추가 요청 처리할 것.
      res.send({"key" : "login", "request_url" : "/addFriend/" + friend_id + "/accepted"});
    }
}

var viewFriends = function(req, res) {
    if(req.session.user) {
      if(database) {
        user.viewFriends(database, req.session.user.id, function(err, docs) { //docs는 친구배열
          if(err) { throw err; }
          if(docs) {
            console.log(docs);
            res.send(docs); // 디비 검색 결과(배열)을 응답객체로 보냄 */
          }
          else { 
            res.send("친구 레코드 검색 오류");
          }
        });
      } else {
        console.log('데이터베이스 오류');
        res.send('<h2>데이터베이스 오류</h2>');
      }
    } else {
      console.log('로그인 세션 필요');
      res.send({"key" : "login", "request_url" : "/viewFriends"});
    }
}

var setImage = function(req, res) {
    var name = req.body.name;
    var pwd = req.body.pwd;
    var files = req.files;

    console.log('files : ' + files);
    console.log('name pw : ' + name + ' ' + pwd);
    if(req.session.user) {
        try {
            console.dir('#===== 업로드된 파일 정보 =====#');
            console.dir(req.files[0]);
            console.dir('#=====#');
  
            var originalname = '',
            filename = '',
            mimetype = '',
            size = 0;
  
            if(Array.isArray(files)) {
                console.log('배열에 들어있는 파일 갯수 : %d ', files.length);
  
                for(var index = 0; index < files.length; index++) {
                    originalname = files[index].originalname;
                    filename = files[index].filename;
                    mimetype = files[index].mimetype;
                    size = files[index].size;
                }
            } else {
                console.log('파일 갯수 : 1');
  
                originalname = files[0].originalname;
                filename = files[0].filename;
                mimetype = files[0].mimetype;
                size = files[0].size;
            }
  
            console.log('현재 파일 정보 : ' + originalname + ', ' + filename, + ', ' + mimetype + ', ' + size);
  
            if(database) {
                var img_url = "http://127.0.0.1:3500/uploads/" + filename;
                // 세션에서 회원아이디를 가져온 후, 프로필이미지 url db에 저장 
                var users = database.collection('users2');
                users.update({ "id": req.session.user.id }, {$set: { "name": name, "password": pwd, "profile_image": img_url }}, function(err, docs) {
                    if(err) { throw err; }
                    if(docs) {
                        console.log(docs);
                        var user_id = req.session.user.id;
                        req.session.user = {
                          id: user_id,
                          name: name,
                          profile_image: img_url,
                          authorized: true
                        };
                        res.redirect('/public/mypage.html');
                    }
                    else { 
                        res.send("프로필 수정 오류");
                    }
                });
            }
  
        } catch(err) {
            console.dir(err.stack);
        }
    } else {
        console.log('로그인 후 이용하세요');
        res.send({"key" : "login", "request_url" : "/setImage"});
    }
}

var contact_send = function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;
  var message = req.body.message;

  var admin_email = 'inspirebj@gmail.com';
  var content = '<div class="card"><div class="card-header">Coding-Chat Contact</div><div class="card-block"><blockquote class="card-blockquote"><p>작성자 명 : ' + name + ' </p><p>연락처 : ' + phone + '</p><footer>' + message + '</footer></blockquote></div></div>'

  user.sendEmail(email, admin_email, 'Coding-Chat contact - ' + name + '님 작성', content);
  res.send("Coding-Chat 관리자에게 요청 내용이 성공적으로 전송되었습니다.");
}

var mypage = function(req, res) {
  if(req.session.user) {
    console.log('mypage의 session' + req.session.user);
    res.send(req.session.user);
  } else if(req.user) {
    console.log('mypage의 req.user' + JSON.stringify(req.user));
    req.session.user = req.user;
    console.log(req.user.id + req.user.name + req.user.profile_image);
    console.log(req.session.user.id);
    res.send(req.user);
  }
    else {
    console.log('mypage에 세션없음');
    res.send({"alert_message" : "로그인이 필요합니다."});
  }
}

var myRooms = function(req, res) {
  if(req.session.user) {
    if(database) {
      user.viewRooms(database, req.session.user.id, function(err, docs) {
        if(err) { throw err; }
        if(docs) {
          res.send(docs);
        } else {
          console.log('검색 결과가 없습니다.');
          res.send({'alert_message' : '결과 없음'});
        };
      });
    } else {
      console.log('디비 오류');
      res.send({"alert_message" : "데이터베이스 오류"});
    }
  } else {
    //res.send({"alert_message" : "로그인이 필요합니다."});
    res.redirect('http://127.0.0.1:3500/');
  }
}

var likesRoom = function(req, res) {
  var room_id = req.params.room_id;
  if(req.session.user) {
    if(database) {
      user.likeRooms(database, req.session.user.id, room_id, function(err, result) {
        if(err) { throw err; }
        if(result) {
          res.send(result);
        }
      });
    }
  }
};

var modifyRoom = function(req, res) {
  var room_id = req.params.room_id;
  if(req.session.user) {
    if(database) {
      user.shareRoom(database, room_id, function(err, result) {
        if(err) { throw err; }
        if(result.length > 0) {
          res.send(result);
         } else {
           console.log('방이 존재하지 않음');
           res.send('해당 방이 저장소에 존재하지 않습니다.');
         }
      });
    }
  }
};

var modify_room_submit = function(req, res) {
  var room_id = req.params.room_id;
  var room_title = req.body.room_title;
  var description = req.body.description;
  var password = req.body.password;
  var code_language = req.body.code_language;
  var public = req.body.public;

  console.log(room_id + ' ' + room_title + ' ' + password + ' ' + code_language + ' ' + public);

  if(req.session.user) {
    if(database) {
      user.modify_room_submit(database, room_id, room_title, description, password, code_language, public, function(err, docs) {
        if(err) { throw err; }
        if(docs) {
          res.send({'alert_message' : 'success'});
        } else {
          res.send({'alert_message' : '데이터 수정 오류입니다. 잠시 후 다시 시도해주세요.'})
        }
      });
    }
  } else {
    console.log('로그인이 필요합니다.');
    res.redirect('http://127.0.0.1:3500');
  }
};

var inviteRooms = function(req, res) {
  var room_url = req.body.room_url;
  var receiver = req.body.receiver;
  console.log('inviteRooms' + receiver);

  var room_info;
  var html = receiver + ' 코딩쉐어 회원님이 실시간 코딩방을 초대하였습니다. 아래 버튼을 누르시면 코딩방 접속이 가능합니다.<br>';
  var result_code = 1;
  if(req.session.user) {
    if(database) {
      user.findUser(database, receiver, id, function(err, docs) {
        if(err) { throw err; }
        if(docs) {
          console.log('사용자 존재');
          //user.sendEmail(req.session.user.id, receiver, 'Coding-chat 실시간 코딩방 초대 메일입니다.', html);
        }
        else {
          console.log('해당 사용자는 존재하지 않습니다.');
          result_code = 0;
        }
      });

      if(result_code == 1) {
        user.shareRoom(database, room_url.substring(32, room_url.length), function(err, docs) {
          if(err) { throw err; }
          if(docs.length > 0) {
            console.log('방 가져오기 성공');
            console.log(JSON.stringify(docs));

            html += '방 이름 : ' + docs[0].room_title;
            html += '<br>방 설명 : ' + docs[0].description + '<br>';
            html += '<a href="' + room_url + '">방 입장하기</a>';
            console.log(html);
            user.sendEmail(req.session.user.id, receiver, 'Coding-chat 실시간 코딩방 초대 메일입니다.', html);
          }
        });
        res.send({'alert_message' : 'success'}); 

      } else {
        res.send({'alert_message' : '작성 아이디는 회원목록에 존재하지 않습니다.'});   
      }
    } else {
      console.log('디비 오류');
      res.send({'alert_message' : '데이터베이스 오류입니다. 잠시 후에 다시 시도하세요'});  
    }
  } else {
    console.log('로그인 필요');
    res.send({'alert_message' : '로그인이 필요합니다.'});  
  }
};

var index = function(req, res) {
    fs.readFile( __dirname + '/../views/sign.html', 'utf-8', function (error, data) {
      if(error) { console.log('error:' + error); }
        res.send(data.toString());
    });
}

module.exports.init = init;
module.exports.join = join;
module.exports.login = login;
module.exports.logout = logout;
module.exports.findPassword = findPassword;
module.exports.mygroup = mygroup;
module.exports.finduser = finduser;
module.exports.make_rooms = make_rooms;
module.exports.shareRoom = shareRoom;
module.exports.shareRoom_new = shareRoom_new;
module.exports.roomName = roomName;
module.exports.addFriend = addFriend;
module.exports.addFriend_accepted = addFriend_accepted;
module.exports.viewFriends = viewFriends;
module.exports.setImage = setImage;
module.exports.contact_send = contact_send;
module.exports.mypage = mypage;
module.exports.index = index;
module.exports.myRooms = myRooms;
module.exports.likesRoom = likesRoom;
module.exports.modifyRoom = modifyRoom;
module.exports.modify_room_submit = modify_room_submit;
module.exports.inviteRooms = inviteRooms;
module.exports.findPassword_before = findPassword_before;