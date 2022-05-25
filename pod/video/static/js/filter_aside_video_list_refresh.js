var infinite_waypoint;
var formCheckedInputs = [];
var regExGetOnlyChars = /([\D])/g;
var sort_direction_asc = true;
var sort_direction_chars = ["8600","8599"];

function getInfiniteScrollWaypoint() {
  // Return Waypoint Infinite object to init/refresh the infinite scroll
  return new Waypoint.Infinite({
    element: $("#videos_list")[0],
    onBeforePageLoad: function () {
      $(".infinite-loading").show();
    },
    onAfterPageLoad: function ($items) {
      $(".infinite-loading").hide();
      feather.replace({ class: "align-bottom" });
      $("footer.static-pod").addClass("small");
      $("footer.static-pod").addClass("fixed-bottom");
      $("footer.static-pod").attr("style", "height:80px; overflow-y:auto");
      $("footer.static-pod .hidden-pod").css("display", "none");
      $(window).scroll(function () {
        if (
          $(window).height() + $(window).scrollTop() ===
          $(document).height()
        ) {
          $("footer.static-pod .hidden-pod").css("display", "block");
          $("footer.static-pod").attr("style", "height:auto;");
          $("footer.static-pod").removeClass("fixed-bottom");
        }
      });
    },
  });
}

function replaceCountVideos(newCount) {
  // Replace count videos label (h1) with translation and plural
  var transVideoCount = newCount > 1 ? "videos found" : "video found";
  $("#video_count")[0].innerHTML = newCount + " " + gettext(transVideoCount);
}

function callAsyncListVideos(formCheckedInputs) {
  // Ajax request to refresh view with filtered video list
  return $.ajax({
    type: "GET",
    url: urlVideos,
    data: formCheckedInputs,
    dataType: "html",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
    success: function (html, status) {
      if (infinite_waypoint) {
        infinite_waypoint.destroy();
      }
      $(".infinite-loading").remove();
      $(".infinite-more-link").remove();
      $("#videos_list").replaceWith(html);
      if(urlVideos == 'videos'){
        replaceCountVideos(countVideos);
      }
      window.history.pushState({}, "", this.url);
    },
    error: function (result, status, error) {
      $("#videos_list").html(gettext("An Error occurred while processing "));
    },
  });
}

function refreshVideosSearch(){
  // Filter checkboxes change triggered event
  formCheckedInputs = [];
  $(".infinite-loading").show();
  $(".form-check-input input[type=checkbox]").attr("disabled", "true");
  $("#videos_list").html("");
  $("input[type=checkbox]:checked").each(function () {
    formCheckedInputs.push(this);
  });
  if($("#sort").val()){
    formCheckedInputs.push($("#sort")[0]);
  }
  callAsyncListVideos(formCheckedInputs).done(function () {
    $(".infinite-loading").hide();
    infinite_waypoint = getInfiniteScrollWaypoint();
    $(".form-check-input input[type=checkbox]").removeAttr("disabled");
  });
}
$(".form-check-input, .sort-select").change(function (event) {
  event.preventDefault();
  refreshVideosSearch(formCheckedInputs);
});

$("#sort_direction_label").click(function(event) {
  event.preventDefault();
  sort_direction_asc = !sort_direction_asc;
  $("#sort_direction").prop("checked", !$("#sort_direction").prop("checked"));
  $("#sort_direction_label").html("&#"+(sort_direction_chars[+ sort_direction_asc]).toString());
  refreshVideosSearch(formCheckedInputs);
});

// First launch of the infinite scroll
infinite_waypoint = getInfiniteScrollWaypoint();
