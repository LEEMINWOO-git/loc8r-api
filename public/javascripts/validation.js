// public/javascripts/validation.js
$('#addReview').submit(function (e) {
  // 기존 경고 숨김
  $('.alert.alert-danger').hide();

  // 입력값 검사 (이름, 평점, 리뷰 내용)
  if (
    !$('input#name').val() ||
    !$('select#rating').val() ||
    !$('textarea#review').val()
  ) {
    // 이미 경고 박스가 있으면 다시 표시
    if ($('.alert.alert-danger').length) {
      $('.alert.alert-danger').show();
    } 
    // 없으면 새로 추가
    else {
      $(this).prepend(
        '<div role="alert" class="alert alert-danger">All fields required, please try again</div>'
      );
    }
    // 서버로 submit 막기
    return false;
  }
});
