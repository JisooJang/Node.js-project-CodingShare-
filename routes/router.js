var express = require('express');
var router = express.Router();
var fs = require('fs');


var passport;
var database;
var authUser;
var addUser;
var findUser;


function init_router(passport, database, authUser, addUser, findUser) {
    this.passport = passport;
    this.database = database;
    this.authUser = authUser;
    this.addUser = addUser;
    this.findUser = findUser;
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

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + name + ', ' + sex + ', ' + birth + ', ' + phone);

    if(database) {
        addUser(database, paramId, paramPassword, name, sex, birth, phone, email, info, profile_image, function(err, result) {
          if(err) { throw err; }
    
          if(result && result.insertedCount > 0) {
            console.dir(result);
    
            res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
            res.write('<h1>사용자 추가 성공</h1>');
            res.end();
          } else {
            res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
            res.write('<h1>사용자 추가 실패</h1>');
            res.end();
          }
        });
      } else {
        res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
        res.write('<h1>데이터베이스 연결 실패</h1>');
        res.end();
      }
});


// 로그인 라우팅 함수
router.route('/login').post(function(req, res) {

    var paramId = req.body.id;
    var paramPassword = req.body.password;
  
    console.log(paramId + ', ' + paramPassword);
  
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
        res.send('<h1>로그인된 세션 정보가 없습니다.</h1>');
    }   
});


// 마이페이지 조회
router.route('/mygroup').get(function (req, res) {
  
  if(req.session.user) {
    var userId = req.session.user.id;   // 세션 객체에서 로그인된 회원 아이디 추출

  } else {
    var request_url = '/mygroup';
    console.log('로그인이 필요함.');

    res.send(request_url);
    res.redirect('http://127.0.0.1:3500/public/login.html');  
    // 로그인페이지에서 로그인 클릭시 기존 요청했던 requset_url로 페이지를 이동시키도록 구현
  }

});


// 회원검색 라우팅 함수
router.route('/finduser').post(function (req, res) {
    var search_option = req.body.search_option;   // 사용자가 회원 검색시 select 태그로 선택한 조건 값을 불러온다
    var value = req.body.keyword;
    console.log(search_option);
  
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

// 코딩쉐어 텍스트 편집방에 들어올 때
router.route('/shareRoom/:room_id').get(function(req, res){
  var room_id = req.params.room_id;
  
  fs.readFile('../public/subIndex.html', "utf-8", function(error, data) {
    if(error) console.log(error.message);
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(data);
 });
});


router.route('/').get(function(req, res) {
    res.redirect('http://127.0.0.1:3500/public/index.html');
});

module.exports.init_router = init_router;
module.exports.router = router;
