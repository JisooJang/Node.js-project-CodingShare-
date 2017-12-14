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

var mongoose = require('mongoose');   // 자바스크립트 객체와 데이터베이스 객체를 매핑시키는 모듈

var passport = require('passport');

var facebook = require('./config/passport/facebook.js');
var naver = require('./config/passport/naver.js');

var io = require('socket.io').listen(server);

var user = require('./routes/user_function.js');  // 외부 사용자 처리 함수 모듈 파일. 모듈화 후 지울것
var router_function = require('./routes/router_function.js'); // 외부 라우터 콜백 함수 모듈 파일

var database; // 데이터베이스 객체를 위한 변수
var UserSchema; // 데이터베이스 스키마 객체를 위한 변수
var UserModel;  // 데이터베이스 모델 객체를 위한 변순


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

//var roomName;
io.on('connection', function(socket) {
  var roomName = router_function.roomName;

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
      database = db;   // 모듈화 후 삭제할것
      router_function.init(db);
    });
}

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

router.route('/join').post(router_function.join);

// 로그인 라우팅 함수
router.route('/login').post(router_function.login);

router.route('/logout').get(router_function.logout);

router.route('/findPassword').get(router_function.findPassword);

// 마이페이지 조회
router.route('/mygroup').get(router_function.mygroup);


// 회원검색 라우팅 함수
router.route('/finduser').post(router_function.finduser);

router.route('/make_rooms').get(router_function.make_rooms);

// 코딩쉐어 텍스트 편집방에 들어올 때
router.route('/shareRoom/:room_id').get(router_function.shareRoom);

// 1) 친구추가 버튼을 눌렀을 때 소켓에 알림 전송(상대방에세 친구요청 알림이 실시간으로 가도록)
router.route('/addFriend/:id').get(router_function.addFriend);

// 2) 상대방이 친구 요청 알림 메시지를 받은 후 수락했을 때
router.route('/addFriend/:id/accepted').get(router_function.addFriend_accepted);

// 등록된 친구 목록 확인
router.route('/viewFriends').get(router_function.viewFriends);

// 사용자 프로필 사진 설정
router.route('/setImage').post(upload.array('photo', 1), router_function.setImage);

// 메인페이지
router.route('/').get(router_function.index);


// 3500번 포트에 웹서버 시작
server.listen(3500, function() {
  console.log('Server starting...');
  connectDB();  // DB 연결 메소드 호출
});

