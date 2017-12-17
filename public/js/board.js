var socket = io().connect(); //소켓 연결
var range = document.getElementById('editor').contentWindow.getSelection();
var isPress = false;
var lastVal = $(editor.document.body).html();

var lastCursor = 0;

//iframe 디자인
editor.document.designMode = "on";
editor.document.body.style = 'margin : 0';
editor.document.body.style = 'color : #fff';

var room_id2 = $(location).attr('href');
alert(room_id2.substring(32, room_id2.length));
$.ajax({
  url: '/shareRoom_load',
  type: 'post',
  data: {
    room_id: room_id2.substring(32, room_id2.length)
  },
  success: function(data) {
    console.log(data);
    if(data[0].contents) {
      //방이 디비에 있으면
      var contents = data[0].contents;
      var code_language = data[0].code_language;
      var participants = data[0].participants;

      $(editor.document.body).text(contents);
      $('.dropdown-item').each(function(index, item) {
        if($(item).text() == code_language) {
          $(item).click();
        }
      })
    } 
  }
});


$('.dropdown-menu > *').click(function(e) {
  var text = $(this).text();
  $('#dropdownMenuButton').text(text);
});

$('#save').click(function(e) {
  alert($(editor.document.body).text());
  if($('#dropdownMenuButton').val() == 'Dropdown button') {
    alert('코드 언어를 선택해주세요.');
    return;
  }
  var request_url = $(location).attr('href').substring(21, $(location).attr('href').length) + '/save';

  var room_title = prompt('저장할 방 이름을 입력하세요. ', 'roomName');
  if(room_title != null && room_title != '') {
  var user_id = "";
  if(sessionStorage.getItem("user_id")) {
    alert('user_id 존재');
    user_id = sessionStorage.getItem("user_id");
  }
  socket.emit('save', {
    'contents' : $(editor.document.body).text(),
    'cursor': range.anchorOffset,
    'code_language': $('#dropdownMenuButton').text(),
    'room_url': $(location).attr('href'),
    'room_title': room_title,
    'user_id': user_id
  });
}
});

$(editor.document).on({
  "keypress" : function(){
    isPress = true;
  },
  "keyup" : function(e){
    var temp = $(editor.document.body).html();
    var regexp =/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

    if(isPress){
      socket.emit('send',{'contents' : $(editor.document.body).html(),
                          'cursor': range.anchorOffset});
      console.log(range.anchorOffset);
      lastCursor = range.anchorOffset;
      isPress = false;
    }


    if(regexp.test(temp.replace("</div>","")) && lastVal != $(editor.document.body).html() &&  e.keyCode != 8){
      socket.emit('send',{'contents' : $(editor.document.body).html(),
                          'cursor': range.anchorOffset});
      lastVal = $(editor.document.body).html();
      lastCursor = range.anchorOffset;
      console.log("한글");
    }

    if(e.keyCode == 8){
      socket.emit('send',{'contents' : $(editor.document.body).html(),
                          'cursor': range.anchorOffset});
      console.log("백스페이스");
      lastCursor = range.anchorOffset;
    }

    isPress = false;
  }
});

$.fn.selectRange = function(start, end) {
  return this.each(function() {
       if(this.setSelectionRange) {
           this.focus();
           this.setSelectionRange(start, end);
       } else if(this.createTextRange) {
           var range = this.createTextRange();
           range.collapse(true);
           range.moveEnd('character', end);
           range.moveStart('character', start);
           range.select();
       }
   });
};



socket.on('get',function(data){
  console.log('get data : ' + data);
  $(editor.document.body).html(data.contents);

  if(data.cursor<lastCursor){
    lastCursor++;
  }
  var iframeElement = document.getElementById('editor'); // the DOM element for the iframe;
  var contentDoc = iframeElement.contentDocument;
  var range = contentDoc.createRange();
  range.setStart(contentDoc.body.firstChild, lastCursor);
  range.setEnd(contentDoc.body.firstChild, lastCursor);
  var selection = iframeElement.contentWindow.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

 });

 socket.on('save_result', function(data) {
  if(data.key == 'success') {
    alert('코드방이 성공적으로 저장되었습니다.');
  } else {
    alert('저장 중 오류가 발생하였습니다. 잠시 후에 다시 시도해주세요');
  }
 });



///chat
var chatSelected = false;
var chatting = false;

var chatSubmit = function(){
  if(!$('.chat_input_text input').val()==''){
    var chatVal = $('.chat_input_text input').val()
    $('.chat_input_text input').val('');

    socket.emit('chat',chatVal);
    console.log("전송");
  }
}

socket.on('chat_get',function(data){
  $('.chat_contents').append(data+'<br>');
  $('.chat_contents').scrollTop($('.chat_contents')[0].scrollHeight);
});

$('.chat_header').on('click',function(){
  if(chatSelected){
    $('.chat_box').animate({'bottom' : -350},500);
    $('.chat_header_menu i').attr('class','fa fa-caret-up');
    chatSelected = false;
  }else{
    $('.chat_box').animate({'bottom' : 0},500);
    $('.chat_header_menu i').attr('class','fa fa-caret-down');
    chatSelected = true;
  }
});

$('.chat_input_text input').on({
  focus : function(){
    chatting = true;
  },
  blur : function(){
    chatting = false;
  }
});

$(window).on('keydown',function(e){
  if(chatting && e.keyCode == 13){
    chatSubmit();
  }
});

$('.chat_input_submit button').on('click',function(){
  chatSubmit();
});
