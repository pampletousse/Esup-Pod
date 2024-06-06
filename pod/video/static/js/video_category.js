/**
 * Esup-Pod video category scripts.
 */
const catVideosListContainerId = "category_modal_videos_list";
var currentUrl;
selectedVideos[catVideosListContainerId] = [];

/**
 * Manage add category link in filter aside
 */
document.getElementById("add_category_btn").addEventListener("click", () => {
  get_category_modal(CATEGORIES_ADD_URL);
});

/**
 * Manage categories links (edit and delete in filter aside)
 */
function manageCategoriesLinks(){
    Array.from(document.getElementsByClassName("edit_category_btn")).forEach((el) => {
      el.addEventListener("click", () => {
        let url_edit = getCategoriesUrl("edit", el.dataset.slug);
        get_category_modal(url_edit);
      });
    });
    Array.from(document.getElementsByClassName("delete_category_btn")).forEach((el) => {
      el.addEventListener("click", () => {
        let url_delete = getCategoriesUrl("delete", el.dataset.slug);
        get_category_modal(url_delete);
      });
    });
}

/**
 * Manage search category input in filter aside
 */
let searchCategoriesInput = document.getElementById("searchCategoriesInput");
if(searchCategoriesInput){
    searchCategoriesInput.addEventListener("input", () => {
        manageSearchCategories(searchCategoriesInput.value.trim());
    });
}

/**
 * Manage search category input to display chosen ones
 *
 * @param search {string} : Search input string
 */
function manageSearchCategories(search){
    let categories = document.querySelectorAll(
      ".categories_list .cat_title:not(.hidden)",
    );
    if (search.length >= 3) {
      categories.forEach((cat) => {
        if (!cat.innerHTML.trim().toLowerCase().includes(search))
          cat.parentNode.classList.add("hidden");
        else cat.parentNode.classList.remove("hidden");
      });
    } else {
      categories = document.querySelectorAll(".categories_list .hidden");
      categories.forEach((cat) => {
        cat.classList.remove("hidden");
      });
    }
}

/**
 * Toggle category links and filter dashboard's videos list with given categories
 *
 * @param el {HTMLElement} : Category link clicked
 */
function toggleCategoryLink(el) {
    el.parentNode.classList.toggle("active");
    refreshVideosSearch();
}

/**
 * Build and return url for Get or Post categories methods
 *
 * @param action {string} : Action defined "add", "edit" or "delete"
 * @param slug {string} : Category slug given for edit or delete (can be null)
 * @returns {string} : Returns built URL
 */
function getCategoriesUrl(action, slug = null){
    let url;
    switch (action){
        case "add":
            url = CATEGORIES_ADD_URL;
            break;
        case "edit":
            url = CATEGORIES_EDIT_URL + slug + "/";
            break;
        case "delete":
            url = CATEGORIES_DELETE_URL + slug + "/";
            break;
        default:
            url = "";
    }
    return url
}

/**
 * Async call to create Add, Edit or Delete Modal for categories managment
 *
 * @param url {string} : Url to call (add, edit, delete)
 * @param page {number} : Page url managment (can be null)
 */
function get_category_modal(url, page=null){
    if(page){
        url += "?page=" + page;
    }
    fetch(url, {
    method: "GET",
    headers: {
      "X-CSRFToken": "{{ csrf_token }}",
      "X-Requested-With": "XMLHttpRequest",
    },
    cache: "no-store",
  })
    .then((response) => response.text())
    .then((data) => {
      // Parse data into html and create new modal
      let parser = new DOMParser();
      let html = parser.parseFromString(data, "text/html").body;
      if(page){
          document.getElementById("category_modal_videos_list").outerHTML = html.innerHTML;
          document.querySelectorAll("#category_modal_videos_list .infinite-item.selected").forEach((el) => {
              if(!selectedVideos[catVideosListContainerId].includes(el.dataset.slug)){
                  el.classList.remove("selected");
              }
          });
          setSelectedVideos(catVideosListContainerId);
          url = url.replaceAll(/([?]page=)(\d+)/g, "");
      }else{
          categoryModal.innerHTML = html.innerHTML;
          new bootstrap.Modal(document.getElementById('category_modal')).toggle();
          manageModalConfirmBtn();
      }
      if(url.includes(CATEGORIES_EDIT_URL)){
        var slugg = url.split("/")[url.split("/").length - 2];
        selectedVideos[catVideosListContainerId] = all_categories_videos[slugg];
      }
      currentUrl = url;
    })
    .catch(() => {
      showalert(gettext("An Error occurred while processing."), "alert-danger", "formalertdivbottomright");
    });
}

/**
 * Async call to post Add, Edit or Delete categories
 *
 * @param url {string} : Url to call (add, edit, delete)
 */
function post_category_modal(url){
    let formData = new FormData();
    if(selectedVideos[catVideosListContainerId] && selectedVideos[catVideosListContainerId].length > 0){
        formData.append("videos", JSON.stringify(selectedVideos[catVideosListContainerId]));
    }
    if(document.getElementById("catTitle")){
        formData.append("title", document.getElementById("catTitle").value);
    }

    fetch(url, {
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": csrftoken,
    },
    body: formData,
    cache: "no-store",
  })
    .then((response) => response.text())
    .then((data) => {
      data = JSON.parse(data);
      bootstrap.Modal.getInstance(categoryModal).toggle();
      let message = data["message"];
      let videos = data["all_categories_videos"];
      showalert(message, "alert-success", "formalertdivbottomright");
      if(videos !== undefined){
         all_categories_videos = JSON.parse(videos);
      }
      refreshCategoriesLinks();
    })
    .catch(() => {
      showalert(gettext("An Error occurred while processing."), "alert-danger", "formalertdivbottomright");
    });
}

/**
 * Manage category videos pagination (category modal's videos list)
 *
 * @param el {HTMLElement} : Previous or next clicked button
 */
function manageCategoryVideosPagination(el){
    let currentPage = parseInt(document.getElementById("pages_infos").dataset.currentPage);
    if(el.dataset.pageaction === "previous"){
        get_category_modal(currentUrl, currentPage - 1);
    }else if(el.dataset.pageaction === "next"){
        get_category_modal(currentUrl, currentPage + 1);
    }
}

/**
 * Dynamically add event listener on confirm button (Add, Edit or Delete) of category modal
 */
function manageModalConfirmBtn(){
    let btn = document.getElementById("confirm_category_btn");
    if(btn !== undefined && btn.dataset.action !== undefined){
        btn.addEventListener("click", () => {
            let action = btn.dataset.action;
            let slug = btn.dataset.slug ? btn.dataset.slug : null;
            let url_post = getCategoriesUrl(action, slug)
            post_category_modal(url_post);
        });
    }
}

/**
 * Refresh filter aside's category links after treatment
 */
function refreshCategoriesLinks(){
    fetch(CATEGORIES_LIST_URL, {
    method: "GET",
    headers: {
      "X-CSRFToken": "{{ csrf_token }}",
      "X-Requested-With": "XMLHttpRequest",
    },
    cache: "no-store",
  })
    .then((response) => response.text())
    .then((data) => {
      // Parse data into html and replace categories list
      let parser = new DOMParser();
      let html = parser.parseFromString(data, "text/html").body;
      categoriesListContainer.innerHTML = html.innerHTML;
      manageCategoriesLinks();
    })
    .catch(() => {
      showalert(gettext("An Error occurred while processing."), "alert-danger", "formalertdivbottomright");
    });
}

// Add event listeners on categories list buttons for the first time
manageCategoriesLinks();
