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
  

// 사용자 검색 함수
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


module.exports.addUser = addUser;
module.exports.authUser = authUser;
module.exports.findUser = findUser;