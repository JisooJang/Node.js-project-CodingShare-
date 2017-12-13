// Express 기본 모듈 불러오기
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');

var router = express.Router();

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser'), static = require('serve-static');
var static = require('serve-static');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');        // 세션정보는 메모리에 저장

// 오류 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');
var errorHandler = expressErrorHandler({
  static: {
    '404': './public/404.html'
  }
});

var cors = require('cors'); // 클라이언트에서 ajax로 요청햇을 때 다중 서버 접속 지원
// 라우팅 사용하여 라우팅 함수 등록

// 몽고디비 모듈 사용
var MongoClient = require('mongodb').MongoClient;

var multer = require('multer'); // 파일업로드 모듈

var fs = require('fs');

var mongoose = require('mongoose');   // 자바스크립트 객체와 데이터베이스 객체를 매핑시키는 모듈

var nodemailer = require('nodemailer');

var passport = require('passport');

var facebook = require('./config/passport/facebook.js');
var naver = require('./config/passport/naver.js');

var io = require('socket.io').listen(server);

var shortid = require('shortid'); // 랜덤URL 생성 모듈

var database; // 데이터베이스 객체를 위한 변수
var UserSchema; // 데이터베이스 스키마 객체를 위한 변수
var UserModel;  // 데이터베이스 모델 객체를 위한 변순

var roomName;

app.use(expressSession({    // 세션 객체 호출 시 반환되는 객체 전달
  secret: 'abc123',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

app.use(bodyParser.urlencoded({ extended: false }));    // body-parser를 사용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.json());   // application/json 파싱

app.use('/public', static(path.join(__dirname, 'public')));  // 'public' 폴더에 있는 파일들을 static 미들웨어를 이용하여 특정 패스로 접근 가능하게 함
app.use('/uploads', static(path.join(__dirname, 'uploads')));

app.use('/', router);
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

app.use(cookieParser());

app.use(passport.initialize());   // 패스포트 초기화
app.use(passport.session());  // 패스포트 로그인 세션 유지


passport.use('facebook', facebook(app, passport));
passport.use('naver', naver(app, passport));

passport.serializeUser(function(user, done) {   // 사용자 정보를 세션에 저장
  done(null, user.ud);
});

passport.deserializeUser(function(id, done) {   // 세션으로부터 사용자 정보 복원
  done(null, user);
});

// multer 미들웨어 사용
var storage = multer.diskStorage({
  destination: function (req, file, callback) {   // 업로드한 파일이 저장될 폴더를 지정
    callback(null, 'uploads');
  },
  filename: function (req, file, callback) {    // 업로드한 파일의 이름을 바꿈
    callback(null, req.session.user.id + '_' + Date.now() + '_' + file.originalname);
  }
});

// 파일 제한 : 10개, 1G
var upload = multer({
  storage: storage,
  limits: {   // 파일 크기 및 개수 등의 제한 속성 설정
    files: 10,
    fileSize: 1024 * 1024 * 1024
  }
});


io.on('connection', function(socket) {
  console.log("소켓 연결됨.");
  console.log('room Name : ' + roomName);
  socket.join(roomName);    // roomName 방에 입장함. (roomName)방이 없으면 새로 만듦
  
  socket.on("send", function(data) {    // 소켓에 "send" 이벤트 연결
  id = socket.id;
  console.log('Data : ' + data);

  var client_info = {
    socket_id: id,
    contents: data.contents,
    cursor: data.cursor
  };

  //socket.broadcast.emit('get', data);   // 브로드캐스트 통신
  socket.in(roomName).emit('get', client_info);   // 참여중인 방에 소켓 데이터 전송
  });

  socket.on('chat', function(data) {    // 코드공유 페이지 내 멤버 채팅 이벤트 처리
    console.log('room Name : ' + roomName);
    console.log('Data : ' + data);

    socket.in(roomName).emit('chat_get', data);

  });

  socket.on('addFriend', function(data) {   //친구추가 버튼 클릭시, 상대방에게 실시간 요청 알림
    console.log('Data : ' + data);  //data에는 친구의 id를 포함해야함.
    socket.emit('alert_addFried', data);  // 친구의 id에게만 전송해야함.
  });
});

// 데이터베이스 연결 메소드
function connectDB() {
    var databaseUrl = 'mongodb://localhost:27017/local';  // db 연결 정보
  
    // 데이터베이스 연결
    MongoClient.connect(databaseUrl, function(err, db) {
      if(err) throw err;
  
      console.log('database에 연결됨: ' + databaseUrl);
  
      //database 변수에 할당
      database = db;
    });
}

var addUser = function(database, id, password, name, sex, birth, phone, email, info, profile_image, callback) {
  console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name, + ', ' + sex);

  // db의 users2 컬렉션 참조
  var users = database.collection('users2');

  // id, password, username을 사용해 사용자 추가
  users.insertMany([{"id":id, "password":password, "name":name, "sex":sex, "birth":birth, "phone":phone,
   "email":email, "info":info, "profile_image":profile_image }], function(err, result) {
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
  /*
  let smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: 'username',
        pass: 'password'
    }
};
  */
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

router.route('/join').post(function(req, res) {
  var paramId = req.body.member_id;
  var paramPassword = req.body.pwd;
  var name = req.body.member_name;
  var sex =  req.body.sex;
  var birth =  req.body.birth;
  var phone =  req.body.phone;
  var email =  req.body.email;
  var info =  req.body.content;
  var profile_image = 'image';

  var subject = name + '님 코드쉐어 회원가입을 축하드립니다.';
  var html = subject + '<br> 코드쉐어에서 다양한 네트워킹과 코딩 협업을 이루시길 바랍니다^_^';

  console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + name + ', ' + sex + ', ' + birth + ', ' + phone);

  if(database) {
      addUser(database, paramId, paramPassword, name, sex, birth, phone, email, info, profile_image, function(err, result) {
        if(err) { throw err; }
  
        if(result && result.insertedCount > 0) {
          console.dir(result);
  
          console.log('사용자 추가 성공');
        } else {
          console.log('사용자 추가 실패');
        }
      });
    } else {
      console.log('데이터베이스 연결 실패');
    }
    
    res.redirect('http://127.0.0.1:3500');
    sendEmail('inspirebj@gmail.com', paramId, subject, html);
});


// 로그인 라우팅 함수
router.route('/login').post(function(req, res) {
  var paramId = req.body.id;
  var paramPassword = req.body.password;

  console.log(paramId + ', ' + paramPassword);

  if(req.session.user) {
    console.log('이미 로그인되어있습니다.');
    res.send({"alert_message" : "이미 로그인 되어있습니다."});
  }
  else {
  if(database) {
    authUser(database, paramId, paramPassword, function(err, docs) {
      if(err) { throw err; }
      if(docs) {
        console.dir(docs);
        var username = docs[0].name;
        req.session.user = {
            id: paramId,
            name: username,
            authorized: true
        }

        res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
        res.write('<h1>로그인 성공</h1>');
        res.write('<div><p>' + '사용자 이름 : ' + username + '</p></div>');
        res.write('<div><p>' + '사용자 입력 아이디 : ' + paramId +'</p></div>');
        res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
        res.end();
      } else {
        res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
        res.write('<h1>로그인 실패</h1>')
        res.write('<div><p>아이디와 비밀번호를 다시 확인하십시오.</p></div>');
        res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
        res.end();
      }

    });
  } else {
    res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
    res.write('<h1>데이터베이스 연결 실패</h1>')
    res.write('<div><p>아이디와 비밀번호를 다시 확인하십시오.</p></div>');
    res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
    res.end();
  }
}
});

router.route('/logout').get(function(req, res) {
  if(req.session.user) {
      console.log('세션 확인 : ' + req.session.user);
      console.log('%s 회원 로그아웃 요청', req.session.userId);

      req.session.destroy(function(err) {
          console.log('세션 삭제 완료');
          res.redirect('http://127.0.0.1:3500/public/index.html');
      });    
  }
  else {
      res.send({"alert_message" : "로그인된 정보가 없습니다."});
  }   
});

router.route('/findPassword').get(function(req, res) {
  if(req.session.user) {
    var email = req.session.user.id;
    var subject = '코딩쉐어 비밀번호 찾기 안내 메일입니다.';
    var pass_temp = shortid.generate() + shortid.generate();
    var html_content = req.session.user.name + '님! 코드쉐어에서 회원님의 이메일 계정으로 임시 비밀번호를 보내드립니다.<br>임시비밀번호로 로그인 후 비밀번호를 변경해주세요!<br> 임시비밀번호 : ' + pass_temp;

    if(database) {
      var user = database.collection('users2');
      user.update({'id' : req.session.user.id}, {$set : {'password' : pass_temp}});
    }
    sendEmail('inspirebj@gmail.com', email, subject, html_content);
  } else {
    console.log('로그인 세션 필요');
    res.send({"key" : "login", "request_url" : "/findPassword"});
  }
});

// 마이페이지 조회
router.route('/mygroup').get(function (req, res) {

if(req.session.user) {
  var userId = req.session.user.id;   // 세션 객체에서 로그인된 회원 아이디 추출

} else {
 
  console.log('로그인이 필요함.');
  res.send({"key" : "login", "request_url" : "/mygroup"});
  //res.redirect('http://127.0.0.1:3500/public/login.html');  
  // 로그인페이지에서 로그인 클릭시 기존 요청했던 requset_url로 페이지를 이동시키도록 구현
}

});


// 회원검색 라우팅 함수
router.route('/finduser').post(function (req, res) {
  var search_option = req.body.search_option;   // 사용자가 회원 검색시 select 태그로 선택한 조건 값을 불러온다
  var value = req.body.keyword;
  console.log(search_option);
  if(req.session.user) {
    if(database) {
      findUser(database, value, search_option, function(err, docs) {
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
    //res.redirect('http://127.0.0.1:3500/public/login.html');
  }
});

router.route('/auth/facebook').get(passport.authenticate('facebook')
);

router.route('/auth/facebook/callback').get(passport.authenticate('facebook',{
successRedirect : '/',
failureRedirect : '/login',
session: false  // 추후 삭제할것. 세션 저장 필수
}));

router.route('/auth/naver').get(passport.authenticate('naver')
);

router.route('/auth/naver/callback').get(passport.authenticate('naver', {
successRedirect : '/',
failureRedirect : '/login',
session: false  // 추후 삭제할것. 세션 저장 필수
}));


router.route('/make_rooms').get(function(req, res) {
  var room_id = shortid.generate(); // 중복값 체크 필요한지 알아볼것
  res.redirect('http://127.0.0.1:3500/shareRoom/' + room_id); 
});

// 코딩쉐어 텍스트 편집방에 들어올 때
router.route('/shareRoom/:room_id').get(function(req, res) {
roomName = req.params.room_id;
  /*
  fs.readFile('./public/subIndex.html', "utf-8", function(error, data) {
    if(error) console.log(error.message);
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(data);
  });
  */
  fs.readFile('./public/chat_index.html', "utf-8", function(error, data) {
    if(error) console.log(error.message);
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(data);
  });

});

// 1) 친구추가 버튼을 눌렀을 때 소켓에 알림 전송(상대방에세 친구요청 알림이 실시간으로 가도록)
router.route('/addFriend/:id').get(function(req, res) {
  var friend_id = req.params.id;
  if(req.session.user) {

  } else {
    console.log('로그인 세션 필요');
    res.send({"key" : "login", "request_url" : "/addFriend/" + friend_id});
    //res.redirect('http://127.0.0.1:3500/public/login.html');
  }

});

// 2) 상대방이 친구 요청 알림 메시지를 받은 후 수락했을 때
router.route('/addFriend/:id/accepted').get(function(req, res) {
  var friend_id = req.params.id;
  
  if(req.session.user) {
    if(database) {
      // 디비에 친구추가 하기 전에, 상대방에게 요청 알림이 가고 수락해야 db에 저장할 것.
      // 디비에 친구 추가
      addFriend(database, req.session.user.id, friend_id, function(err, docs) {
        if(err) { throw err; }
        if(docs) {
          console.log(docs);
          res.send(docs);
        }
        else { 
          res.send("이미 친구추가가 되어있는 회원입니다.");
        }
      });
    } else {
      console.log('데이터베이스 접속 오류');
    }
  } else {
    console.log('로그인 세션 필요');
    //로그인 페이지로 이동, 로그인 후 친구추가 요청 처리할 것.
    res.send({"key" : "login", "request_url" : "/addFriend/" + friend_id + "/accepted"});
    //res.redirect('http://127.0.0.1:3500/public/login.html');
  }
});

// 등록된 친구 목록 확인
router.route('/viewFriends').get(function(req, res) {
  if(req.session.user) {
    if(database) {
      viewFriends(database, req.session.user.id, function(err, docs) {
        if(err) { throw err; }
        if(docs) {
          console.log(docs);
          res.send(docs); // 디비 검색 결과(배열)을 응답객체로 보냄
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
    //res.redirect('http://127.0.0.1/login');
    // 로그인 후 페이지 요청을 /viewFriends로 다시 넘겨줄 것
  }
});

// 사용자 프로필 사진 설정
router.route('/setImage').post(upload.array('photo', 1), function(req, res) {
  var files = req.files;
  console.log('files : ' + files);

  if(req.session.user) {
  try {
    console.dir('#===== 업로드된 파일 정보 =====#');
    console.dir(req.files[0]);
    console.dir('#=====#');

    var originalname = '',
    filename = '',
    mimetype = '',
    size = 0;

    if(Array.isArray(files)){
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
      users.update({ "id": req.session.user.id }, {$set: { "profile_image": img_url }}, function(err, docs) {
        if(err) { throw err; }
        if(docs) {
          console.log(docs);
          res.send(docs);
        }
        else { 
          res.send("프로필 이미지 설정 오류");
        }
      });
    }

  } catch(err) {
    console.dir(err.stack);
  }
} else {
  console.log('로그인 후 이용하세요');
  res.send({"key" : "login", "request_url" : "/setImage"});
  //res.redirect('http://127.0.0.1:3500/login');  // 로그인 후 프로필설정 페이지로 다시 요청해줄것
}
});

router.route('/').get(function(req, res) {
  res.redirect('http://127.0.0.1:3500/public/index.html');
});


// 3500번 포트에 웹서버 시작
server.listen(3500, function() {
  console.log('Server starting...');
  connectDB();  // DB 연결 메소드 호출
});

