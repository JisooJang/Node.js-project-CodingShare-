/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);

var Rsmodal = __webpack_require__(2);
var inputScript = __webpack_require__(3);

inputScript();


/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */
/***/ (function(module, exports) {

$('body').append('<div class="RSmodal_shadow"></div>');

var openModal = function(modalId, modalOption){
  $('.RSmodal_shadow').fadeIn(modalOption.shadowSpeed);
  $('#'+modalId).css('display','block');
  $('#'+modalId).animate({'top' : '0','opacity' : '1'},modalOption.modalSpeed);
  $('body').css('overflow','hidden');
}


var exitModal = function(modalId, modalOption){
  $('#'+modalId).stop().fadeOut(0);
  $('.RSmodal_shadow').fadeOut(0);
  $('body').css('overflow','scroll');
  $('#'+modalId).css({'top' : modalOption.animateHeight, 'opacity' : '0', 'filter': 'alpha(opacity=0)'});
}

$.fn.RSmodal = function(option){

  var modalOption = {
    'shadowSpeed' : 200,
    'modalSpeed' : 700,
    'animateHeight' : '-700px'
  }

  if(option){
    if(option.shadowSpeed){
      modalOption.shadowSpeed = option.shadowSpeed;
    }
    if(option.modalSpeed){
      modalOption.modalSpeed = option.modalSpeed;
    }
    if(option.animateHeight){
      modalOption.animateHeight = option.animateHeight;
    }
  }


  var modalId = $(this).attr('id');
  $(this).css('top',modalOption.animateHeight);

  $('.RSmodal_shadow').on('click',function(){
    exitModal(modalId, modalOption);
  });

  openModal(modalId, modalOption);
}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = function(){

  $('input[type="email"],input[type="password"],input[type="text"]').on({
    'focus' : function(){
      var thisId = $(this).attr('id');

      $('.'+thisId).addClass('selected');
      $(this).addClass('selected');
    },
    'blur' : function(){
      var thisId = $(this).attr('id');

      $(this).removeClass('selected');
      $('.'+thisId).removeClass('selected');
    }
  });




  $('.sign_in_link').on('click',function(){
    $('.sign_in_link h2').addClass('selected');
    $('.sign_up_link h2').removeClass('selected');

    $('.sign_in_form').css('display','block');
    $('.sign_up_form').css('display','none');
  });
  $('.sign_up_link').on('click',function(){
    $('.sign_up_link h2').addClass('selected');
    $('.sign_in_link h2').removeClass('selected');
    $('.sign_up_form').css('display','block');
    $('.sign_in_form').css('display','none');
  });
}

$('.sign_in_form button').on('click',function(){

  $.ajax({
            url:'/login',
            type:'POST',
            data:{
              'email' : $('.sign_in_form #inputEmail').val(),
              'password' : $('.sign_in_form #inputPassword').val()
            },
            success:function(data){
                console.log(data);
                if(data.alert_message == "로그인 성공") {
                  location.href='http://127.0.0.1:3500/public/index.html';
                } else if(data.alert_message == "로그인 실패") {
                  location.href='http://127.0.0.1:3500/public/404.html';
                } else {
                  location.href='http://127.0.0.1:3500/public/404.html';
                }
            }
        });

  //$('#loginModal').RSmodal();
  return false;
});

$('.sign_up_form button').on('click',function(){
  $.ajax({
            url:'/join',
            type:'POST',
            data:{
              'email' : $('.sign_up_form #inputEmail').val(),
              'password' : $('.sign_up_form #inputPassword').val(),
              'nickname' : $('.sign_up_form #inputNickname').val()
            },
            success:function(data){
                console.log(data);

                if(data.alert_message == "가입 성공") {
                  location.href='http://127.0.0.1:3500/public/index.html';
                } else if(data.alert_message == "가입 실패") {
                  location.href='http://127.0.0.1:3500/public/404.html';
                } else {
                  location.href='http://127.0.0.1:3500/public/404.html';
                }
            }
        });

  return false;
});

/***/ })
/******/ ]);