var socket = io().connect(); //소켓 연결
var range = document.getElementById('editor').contentWindow.getSelection();
var isPress = false;
var lastVal = $(editor.document.body).html();

var lastCursor = 0;


//iframe 디자인
editor.document.designMode = "on";
editor.document.body.style = 'margin : 0';
editor.document.body.style = 'color : #fff';

$('.emit').on('click',function(){
  socket.emit('send',$(editor.document.body).html());
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
  console.log(data);
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